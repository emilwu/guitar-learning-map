#!/usr/bin/env node
/**
 * Build learner-facing plan pages and the guided-flow data file.
 *
 *   node scripts/build-plan.mjs
 *
 * Reads Markdown in content/plan/ and content/plan/src/, writes plan/*.html
 * and data/guided-flow.js. GitHub Pages serves the generated files; no CI.
 * Re-run after copying an updated lesson into content/plan/src/.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "content/plan/src");
const outDir = path.join(root, "plan");

const DROP_HEADINGS = new Set([
  "影片處理結果",
  "定向驗證結論",
  "下一輪驗證",
  "證據與限制",
  "證據限制",
  "和弦／節奏定向驗證",
  "音階／Pentatonic 定向驗證",
  "即興出口定向驗證",
  "樂理鏈定向驗證",
  "下一版需要的證據",
  "每支影片的資料欄位",
  "Taxonomy 穩定度",
  "使用前提醒",
  "第一批核心候選",
  "3A／3B 初驗結果",
  "3A 定案與 3C 系列驗證",
  "3C 核心定案",
  "3D 核心定案",
  "3E 核心定案",
  "3F 核心定案",
  "3G 核心定案",
  "整合驗證結果",
  "下一步",
]);

const RENAME_HEADINGS = {
  "安全與證據限制": "安全",
};

const OPS_LINE = /字幕端點|IP 封鎖|youtube-ops|\.secrets|youtube-run-state|OAuth|access token|refresh token|API Key|client JSON|UCMd|\/Users\/|NotebookLM|dry-run|checksum|quota/i;

const LINK_LABELS = {
  "LEARNING_MAP_V0.md": "學習先備地圖",
  "GLOBAL_TAXONOMY_V2.md": "分類附錄",
  "STAGE_1_CURRICULUM_V1.md": "Stage 1 課程",
  "STAGE_1_PRACTICE_PRESCRIPTION.md": "Stage 1 練習處方",
  "STAGE_2_CURRICULUM_V1.md": "Stage 2 課程",
  "STAGE_2_CHORD_RHYTHM_PRESCRIPTION.md": "Stage 2 和弦與節奏處方",
  "STAGE_2_SCALE_PENTATONIC_PRESCRIPTION.md": "Stage 2 音階處方",
  "STAGE_3_INTEGRATED_CURRICULUM_V1.md": "Stage 3 課程",
  "STAGE_3_FRAMEWORK_V0.md": "Stage 3 架構",
  "STAGE_3_3C_PRESCRIPTION.md": "3C 處方",
  "STAGE_3_3D_PRESCRIPTION.md": "3D 處方",
  "STAGE_3_3E_PRESCRIPTION.md": "3E 處方",
  "STAGE_3_3F_PRESCRIPTION.md": "3F 處方",
  "STAGE_3_3G_PRESCRIPTION.md": "3G 處方",
  "STAGE_3R_MANUAL_LIST_V1.md": "Stage 3 補充清單",
  "STAGE_4_INTEGRATED_CURRICULUM_V1.md": "Stage 4 課程",
};

const FILE_PAGE = {
  "LEARNING_MAP_V0.md": "index.html",
  "GLOBAL_TAXONOMY_V2.md": "appendix.html",
  "STAGE_1_CURRICULUM_V1.md": "stage-1.html",
  "STAGE_1_PRACTICE_PRESCRIPTION.md": "stage-1.html#s1-rx",
  "STAGE_2_CURRICULUM_V1.md": "stage-2.html",
  "STAGE_2_CHORD_RHYTHM_PRESCRIPTION.md": "stage-2.html",
  "STAGE_2_SCALE_PENTATONIC_PRESCRIPTION.md": "stage-2.html",
  "STAGE_3_INTEGRATED_CURRICULUM_V1.md": "stage-3.html",
  "STAGE_3_FRAMEWORK_V0.md": "stage-3.html",
  "STAGE_3_3C_PRESCRIPTION.md": "stage-3.html#s3-3c",
  "STAGE_3_3D_PRESCRIPTION.md": "stage-3.html#s3-3d",
  "STAGE_3_3E_PRESCRIPTION.md": "stage-3.html#s3-3e",
  "STAGE_3_3F_PRESCRIPTION.md": "stage-3.html#s3-3f",
  "STAGE_3_3G_PRESCRIPTION.md": "stage-3.html#s3-3g",
  "STAGE_3R_MANUAL_LIST_V1.md": "stage-3.html#s3-3r",
  "STAGE_4_INTEGRATED_CURRICULUM_V1.md": "stage-4.html",
};

const ANCHORS = {
  "STAGE_1_PRACTICE_PRESCRIPTION.md": {
    "Stage 1 每日練習處方與教材收斂": "s1-rx",
    "第 1 週：乾淨接觸": "s1-w1",
    "第 2 週：相鄰弦": "s1-w2",
    "第 3 週：短序列": "s1-w3",
    "第 4 週：音樂循環": "s1-w4",
  },
  "STAGE_2_CHORD_RHYTHM_PRESCRIPTION.md": {
    "第 1 週：開放和弦與不中斷拍點": "s2-w1",
    "第 2 週：封閉和弦": "s2-w2",
    "第 3 週：分解和弦": "s2-w3",
    "第 4 週：切分音": "s2-w4",
    "第 5 週：綜合節奏曲": "s2-w5",
  },
  "STAGE_2_CURRICULUM_V1.md": {
    "B｜基礎樂理與和聲": "s2-theory",
    "Stage 2 結尾：Jazz 入門橋接（選修）": "s2-jazz",
  },
  "STAGE_2_SCALE_PENTATONIC_PRESCRIPTION.md": {
    "第 1 週：小調五聲音階與根音": "s2-w8",
    "第 2 週：小調短句": "s2-w8b",
    "第 3 週：大調五聲音階": "s2-w9",
    "第 4 週：大小調對照與概念整合": "s2-w9b",
  },
  "STAGE_3_INTEGRATED_CURRICULUM_V1.md": {
    "Phase 1｜Weeks 1–4：3A 指板地標＋3B Triads": "s3-p1",
    "Phase 2｜Weeks 5–8：3C Arpeggios 與 Chord Targeting": "s3-p2",
    "Phase 3｜Weeks 9–12：3D Pentatonic 區域連接": "s3-p3",
    "Phase 4｜Weeks 13–16：3E Phrasing 與表現技巧": "s3-p4",
    "Phase 5｜Weeks 17–20：3F 通用 Rhythm＋整合出口": "s3-p5",
    "統一出口任務": "s3-exit",
  },
  "STAGE_3_3C_PRESCRIPTION.md": {
    "Stage 3｜3C Arpeggio 與 Chord-tone 學習處方": "s3-3c",
    "第 1 週｜Root 與公式": "s3-w5",
    "第 2 週｜弦組與最近路徑": "s3-w6",
    "第 3 週｜調內串連": "s3-w7",
    "第 4 週｜音樂化與出口測試": "s3-w8",
  },
  "STAGE_3_3D_PRESCRIPTION.md": {
    "Stage 3｜3D Pentatonic 區域連接與和弦追蹤處方": "s3-3d",
    "第 1 週｜地圖與小調路徑": "s3-w9",
    "第 2 週｜斜向連接與轉調": "s3-w10",
    "第 3 週｜大調版本": "s3-w11",
    "第 4 週｜Horizontal／Vertical 合流": "s3-w12",
  },
  "STAGE_3_3E_PRESCRIPTION.md": {
    "Stage 3｜3E Phrasing、表現技巧與句子發展處方": "s3-3e",
    "第 1 週｜少音、Root 與限制": "s3-w13",
    "第 2 週｜三音 Motif 與 Call／Response": "s3-w14",
    "第 3 週｜Bend、Slide、Pull-off 與止音": "s3-w15",
    "第 4 週｜綜合 Solo 與表情控制": "s3-w16",
  },
  "STAGE_3_3F_PRESCRIPTION.md": {
    "Stage 3｜3F 進階 Rhythm 與曲風分支處方": "s3-3f",
    "第 1 週｜完整和弦縮成 Triad": "s3-w17",
    "第 2 週｜Dyad、Ghost Notes 與音色空間": "s3-w18",
    "第 3 週｜音域、Voice Leading 與可選 Fills": "s3-w19",
    "第 4 週｜選一條曲風分支": "s3-style",
  },
  "STAGE_3_3G_PRESCRIPTION.md": {
    "Stage 3｜3G Modes 與音階擴展處方": "s3-3g",
  },
  "STAGE_3R_MANUAL_LIST_V1.md": {
    "Stage 3R 精選補充手動清單": "s3-3r",
  },
  "STAGE_3_FRAMEWORK_V0.md": {
    "內部分層": "s3-layers",
  },
  "STAGE_4_INTEGRATED_CURRICULUM_V1.md": {
    "4A｜Seventh-chord foundation": "s4-4a",
    "4B｜Drop 2、top note 與 voice leading": "s4-4b",
    "4C｜Play over changes": "s4-4c",
    "4D｜Chord-melody／solo-guitar arrangement": "s4-4d",
    "16 週共同核心": "s4-weeks",
    "統一出口作品": "s4-exit",
  },
};

function readSrc(name) {
  const file = path.join(srcDir, name);
  if (!fs.existsSync(file)) throw new Error(`Missing source ${name}`);
  return fs.readFileSync(file, "utf8");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function stripFrontmatter(md) {
  if (!md.startsWith("---\n")) return md;
  const end = md.indexOf("\n---\n", 4);
  if (end === -1) return md;
  return md.slice(end + 5);
}

function applyAnchors(md, fileName) {
  const map = ANCHORS[fileName] || {};
  return md.replace(/^(#{1,6})\s+(.+)$/gm, (line, marks, title) => {
    const clean = title.replace(/\s+\{#[^}]+\}\s*$/, "").trim();
    if (!map[clean]) return line;
    return `${marks} ${clean} {#${map[clean]}}`;
  });
}

function filterMarkdown(md) {
  const lines = stripFrontmatter(md).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let skipping = false;
  let skipLevel = 0;
  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.+?)\s*(?:\{#([A-Za-z0-9_-]+)\})?\s*$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim();
      if (skipping && level <= skipLevel) skipping = false;
      if (!skipping && DROP_HEADINGS.has(title)) {
        skipping = true;
        skipLevel = level;
        continue;
      }
      if (!skipping && RENAME_HEADINGS[title]) {
        const id = heading[3] ? ` {#${heading[3]}}` : "";
        out.push(`${heading[1]} ${RENAME_HEADINGS[title]}${id}`);
        continue;
      }
    }
    if (skipping) continue;
    if (!heading && OPS_LINE.test(line)) continue;
    out.push(line);
  }
  return `${out.join("\n").trim()}\n`;
}

function shiftHeadings(md, amount) {
  if (!amount) return md;
  return md.replace(/^(#{1,6})(\s)/gm, (full, marks, space) => {
    const level = Math.min(6, marks.length + amount);
    return `${"#".repeat(level)}${space}`;
  });
}

function renderLink(text, url, ctx) {
  if (OPS_LINE.test(url) || /youtube-ops|analysis\/|\.secrets|PRACTICE_LOG|GITHUB_PAGES|STAGE_MAPPING|PROJECT_PLAN|STAGE_4_FRAMEWORK/.test(url)) {
    return escapeHtml(text);
  }
  if (/^https?:\/\//.test(url)) {
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`;
  }
  const hash = url.includes("#") ? url.slice(url.indexOf("#")) : "";
  const base = url.split("#")[0].split("?")[0].split("/").pop();
  const target = FILE_PAGE[base];
  if (!target) return escapeHtml(text);
  const [pagePath, pageHash] = target.split("#");
  let href = pagePath;
  if (pagePath === ctx.page) href = hash || (pageHash ? `#${pageHash}` : "#top");
  else href = `${pagePath}${hash || (pageHash ? `#${pageHash}` : "")}`;
  const label = LINK_LABELS[text] || text;
  return `<a href="${escapeAttr(href)}">${escapeHtml(label)}</a>`;
}

function renderInline(text, ctx) {
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0;
  let html = "";
  for (const match of text.matchAll(re)) {
    html += escapeHtml(text.slice(last, match.index)).replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    if (match[1] !== undefined) html += renderLink(match[1], match[2], ctx);
    else if (match[3] !== undefined) html += `<code>${escapeHtml(match[3])}</code>`;
    else html += `<strong>${escapeHtml(match[4])}</strong>`;
    last = match.index + match[0].length;
  }
  html += escapeHtml(text.slice(last)).replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return html;
}

function slugify(title, used) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "section";
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function markdownToHtml(md, ctx) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const toc = [];
  const used = new Set();
  let i = 0;

  const pushParagraph = (buf) => {
    if (!buf.length) return;
    html.push(`<p>${renderInline(buf.join(" "), ctx)}</p>`);
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      const code = escapeHtml(buf.join("\n"));
      if (lang === "mermaid") {
        html.push(`<aside class="callout"><p>能力先後可以看成：練習系統與安全姿勢，接著左右手控制、拍點和基本和弦，再到音程、triad、pentatonic、把位連接與 chord tone，最後才是曲風和曲目。每週實際順序以階段頁和學習地圖上的流程為準。</p></aside>`);
      } else {
        html.push(`<pre><code>${code}</code></pre>`);
      }
      continue;
    }
    const heading = /^(#{1,6})\s+(.+?)\s*(?:\{#([A-Za-z0-9_-]+)\})?\s*$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim();
      const id = heading[3] || slugify(title, used);
      if (heading[3]) used.add(heading[3]);
      html.push(`<h${level} id="${escapeAttr(id)}">${renderInline(title, ctx)}</h${level}>`);
      if (level === 2 || level === 3) toc.push({ level, id, title });
      i += 1;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      html.push("<hr />");
      i += 1;
      continue;
    }
    if (line.startsWith(">")) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      html.push(`<blockquote><p>${renderInline(buf.join(" "), ctx)}</p></blockquote>`);
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const splitRow = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      const head = header.map((cell) => `<th>${renderInline(cell, ctx)}</th>`).join("");
      const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell, ctx)}</td>`).join("")}</tr>`).join("");
      html.push(`<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      html.push(`<ul>${readList(lines, () => i, (n) => { i = n; }, ctx, "ul")}</ul>`);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      html.push(`<ol>${readList(lines, () => i, (n) => { i = n; }, ctx, "ol")}</ol>`);
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|-{3,}|\*{3,})/.test(lines[i]) && !(/^\s*([-*]|\d+[.)])\s+/.test(lines[i]))) {
      if (lines[i].includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) break;
      buf.push(lines[i].trim());
      i += 1;
    }
    pushParagraph(buf);
  }
  return { html: html.join("\n"), toc };
}

function readList(lines, getI, setI, ctx, kind) {
  let i = getI();
  const marker = kind === "ol" ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/;
  let html = "";
  while (i < lines.length && marker.test(lines[i])) {
    html += `<li>${renderInline(lines[i].replace(marker, ""), ctx)}</li>`;
    i += 1;
  }
  setI(i);
  return html;
}

function prepareFile(name, { shift = 0, demoteH1 = false } = {}) {
  let md = filterMarkdown(readSrc(name));
  md = applyAnchors(md, name);
  md = shiftHeadings(md, shift);
  if (demoteH1) md = md.replace(/^#\s+/m, "## ");
  return md;
}

function takeTitle(md) {
  const match = /^#\s+(.+)$/m.exec(md);
  if (!match) return { title: "學習計劃", body: md };
  return {
    title: match[1].replace(/\s+\{#[^}]+\}\s*$/, "").trim(),
    body: md.replace(/^#\s+.+\n+/, ""),
  };
}

function shell({ file, title, lede, eyebrow, toc, body, flowHash, stageColor }) {
  const tocHtml = toc.length
    ? `<nav class="plan-toc" aria-label="本頁目錄"><p>本頁目錄</p><ol>${toc.map((item) => `<li class="toc-l${item.level}"><a href="#${escapeAttr(item.id)}">${escapeHtml(item.title)}</a></li>`).join("")}</ol></nav>`
    : "";
  const color = stageColor ? ` style="--active-stage:${stageColor}"` : "";
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#121311" />
    <meta name="description" content="${escapeAttr(lede)}" />
    <title>${escapeHtml(title)}｜Guitar Learning Map</title>
    <link rel="stylesheet" href="../styles.css" />
  </head>
  <body class="plan-page"${color}>
    <a class="skip-link" href="#main">跳到主要內容</a>
    <header class="site-header">
      <a class="brand" href="../index.html#top" aria-label="回到學習地圖">
        <span class="brand-mark" aria-hidden="true">GL</span>
        <span>Guitar Learning Map</span>
      </a>
      <nav class="primary-nav" aria-label="主要導覽">
        <a href="../index.html#placement">從哪開始</a>
        <a href="../index.html#roadmap">學習路線</a>
        <a href="../index.html#curriculum">每週課程</a>
        <a href="../index.html#library">Playlist</a>
        <a href="./index.html" aria-current="page">學習計劃</a>
      </nav>
      <a class="header-progress" id="resume-link" href="../index.html#curriculum" aria-label="繼續上次的每週流程">
        <span id="header-progress-label">繼續</span>
        <span class="mini-meter"><span id="header-progress-bar"></span></span>
      </a>
    </header>
    <main id="main">
      <section class="plan-hero">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(lede)}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="../index.html#${escapeAttr(flowHash)}">回到每週流程</a>
          <a class="button button-quiet" href="./index.html">計畫總覽</a>
        </div>
      </section>
      <div class="plan-layout">
        ${tocHtml}
        <article class="prose" id="top">${body}</article>
      </div>
    </main>
    <footer class="site-footer">
      <div><strong>Guitar Learning Map</strong><p>學習計劃 · 由 content/plan 產生</p></div>
      <div><p>進度只存在學習地圖頁的瀏覽器，不會上傳。</p><a href="../index.html#top">回學習地圖 ↑</a></div>
    </footer>
    <script>
      (function () {
        var key = "guitar-learning-map-v1";
        var state = {};
        try { state = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
        var stage = state.stage || "stage1";
        var totals = { stage1: 4, stage2: 9, stage3: 20, stage4: 16 };
        var numbers = { stage1: "1", stage2: "2", stage3: "3", stage4: "4" };
        var total = totals[stage] || 4;
        var count = 0;
        var completed = state.completed || {};
        for (var n = 1; n <= total; n += 1) if (completed[stage + "-" + n]) count += 1;
        var label = document.getElementById("header-progress-label");
        var bar = document.getElementById("header-progress-bar");
        if (label) label.textContent = "S" + (numbers[stage] || "1") + " · " + count + "/" + total;
        if (bar) bar.style.width = Math.round((count / total) * 100) + "%";
        var resume = state.resume;
        var link = document.getElementById("resume-link");
        if (link && resume && resume.stage && resume.week && resume.step) {
          link.href = "../index.html#" + resume.stage + "-" + resume.week + "-step" + resume.step;
        }
      })();
    </script>
  </body>
</html>
`;
}

function buildPage({ file, lede, eyebrow, flowHash, stageColor, parts }) {
  let title = "";
  let body = "";
  const toc = [];
  parts.forEach((part, index) => {
    const raw = part.literal ? part.md : prepareFile(part.name, { shift: part.shift || 0, demoteH1: Boolean(part.demoteH1) });
    const taken = index === 0 ? takeTitle(raw) : { title: "", body: raw };
    if (index === 0) title = taken.title;
    const rendered = markdownToHtml(taken.body, { page: file });
    body += rendered.html;
    toc.push(...rendered.toc);
  });
  const html = shell({ file, title, lede, eyebrow, toc, body, flowHash, stageColor });
  assertClean(html, file);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, file), html);
  return { file, title, ids: toc.map((item) => item.id) };
}

function assertClean(html, file) {
  const forbidden = /\/Users\/|client_secret|refresh token|access token|UCMdQj8RfVDp5kNTLSI|\.secrets|youtube-ops|OAuth|API Key|AIza|ghp_/i;
  if (forbidden.test(html)) {
    const match = html.match(forbidden);
    throw new Error(`${file} contains excluded operational text: ${match && match[0]}`);
  }
}

function loadCurriculum() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "data/curriculum.js"), "utf8"), context);
  return context.window.GUITAR_CURRICULUM;
}

function writeFlow(flow) {
  const curriculum = loadCurriculum();
  for (const stage of curriculum.stages) {
    const page = flow.stages[stage.id];
    if (!page) throw new Error(`guided flow missing ${stage.id}`);
    const numbers = page.weeks.map((week) => week.n);
    const expected = stage.weeks.map((week) => week.n);
    if (numbers.join(",") !== expected.join(",")) {
      throw new Error(`${stage.id} weeks ${numbers.join(",")} != curriculum ${expected.join(",")}`);
    }
    for (const week of page.weeks) {
      if (!week.anchor || !week.goal || !week.approach?.length || !week.watchFor || !week.practice?.exercise) {
        throw new Error(`${stage.id} week ${week.n} is incomplete`);
      }
      if (!["sourced", "proposed"].includes(week.practice.origin) || !["sourced", "proposed"].includes(week.practice.linkBasis)) {
        throw new Error(`${stage.id} week ${week.n} missing origin`);
      }
      for (const tool of week.practice.tools || []) {
        if (!tool.href.startsWith("https://emilwu.github.io/guitar-practice-tools/")) {
          throw new Error(`${stage.id} week ${week.n} tool is outside the practice site`);
        }
      }
    }
  }
  const js = `/* Generated by scripts/build-plan.mjs. Edit content/guided-flow.mjs, then rebuild. */\nwindow.GUIDED_FLOW = ${JSON.stringify(flow, null, 2)};\n`;
  fs.writeFileSync(path.join(root, "data/guided-flow.js"), js);
}

const pages = [
  {
    file: "index.html",
    eyebrow: "00 · PLAN",
    lede: "目標、階段結構、能力閘門，以及每週如何在同一個頁面裡學習、看影片、練習。",
    flowHash: "curriculum",
    parts: [
      { literal: true, md: fs.readFileSync(path.join(root, "content/plan/overview.md"), "utf8") },
      { name: "LEARNING_MAP_V0.md", demoteH1: true },
    ],
  },
  {
    file: "stage-1.html",
    eyebrow: "STAGE 01",
    stageColor: "#efb35b",
    lede: "基本動作、18 分鐘每日處方，以及四週怎麼從乾淨單音走到第一個音樂循環。",
    flowHash: "stage1-1-step1",
    parts: [
      { name: "STAGE_1_CURRICULUM_V1.md" },
      { name: "STAGE_1_PRACTICE_PRESCRIPTION.md", shift: 1 },
    ],
  },
  {
    file: "stage-2.html",
    eyebrow: "STAGE 02",
    stageColor: "#83c7b3",
    lede: "和弦、節奏、基礎樂理、pentatonic，以及選修的 Jazz 入門橋接。",
    flowHash: "stage2-1-step1",
    parts: [
      { name: "STAGE_2_CURRICULUM_V1.md" },
      { name: "STAGE_2_CHORD_RHYTHM_PRESCRIPTION.md", shift: 1 },
      { name: "STAGE_2_SCALE_PENTATONIC_PRESCRIPTION.md", shift: 1 },
    ],
  },
  {
    file: "stage-3.html",
    eyebrow: "STAGE 03",
    stageColor: "#8fb8db",
    lede: "20 週主線、3C–3G 練習處方、補充清單，以及指板到 rhythm 的能力出口。",
    flowHash: "stage3-1-step1",
    parts: [
      { name: "STAGE_3_INTEGRATED_CURRICULUM_V1.md" },
      { name: "STAGE_3_FRAMEWORK_V0.md", shift: 1 },
      { name: "STAGE_3_3C_PRESCRIPTION.md", shift: 1 },
      { name: "STAGE_3_3D_PRESCRIPTION.md", shift: 1 },
      { name: "STAGE_3_3E_PRESCRIPTION.md", shift: 1 },
      { name: "STAGE_3_3F_PRESCRIPTION.md", shift: 1 },
      { name: "STAGE_3_3G_PRESCRIPTION.md", shift: 1 },
      { name: "STAGE_3R_MANUAL_LIST_V1.md", shift: 1 },
    ],
  },
  {
    file: "stage-4.html",
    eyebrow: "STAGE 04",
    stageColor: "#d99bc1",
    lede: "16 週共同核心：七和弦、Drop 2、依和弦選音與 chord-melody，再加一條曲風專修。",
    flowHash: "stage4-1-step1",
    parts: [{ name: "STAGE_4_INTEGRATED_CURRICULUM_V1.md" }],
  },
  {
    file: "appendix.html",
    eyebrow: "APPENDIX",
    lede: "C0–C4 能力分類。給想知道每個階段在練哪一種能力的人，不是每週作業。",
    flowHash: "curriculum",
    parts: [{ name: "GLOBAL_TAXONOMY_V2.md" }],
  },
];

const built = pages.map(buildPage);
const flowModule = await import(pathToFileURL(path.join(root, "content/guided-flow.mjs")).href);
writeFlow(flowModule.flow);

const requiredAnchors = new Set(["s2-jazz", "s3-exit", "s3-3g", "s4-exit"]);
for (const stage of Object.values(flowModule.flow.stages)) {
  for (const week of stage.weeks) requiredAnchors.add(week.anchor);
}
for (const map of Object.values(ANCHORS)) {
  for (const id of Object.values(map)) requiredAnchors.add(id);
}
const allHtml = fs.readdirSync(outDir).filter((name) => name.endsWith(".html")).map((name) => fs.readFileSync(path.join(outDir, name), "utf8")).join("\n");
for (const id of requiredAnchors) {
  if (!allHtml.includes(`id="${id}"`)) throw new Error(`Missing anchor #${id}`);
}

console.log(built.map((page) => page.file).join("\n"));
console.log(`anchors ${requiredAnchors.size} ok`);
