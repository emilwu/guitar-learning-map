/*
 * Guitar Learning Map interactions
 * Version: 1.2.0
 * Updated: 2026-10-26
 * Stores stage selection, placement, weekly completion, and the guided-step position locally.
 */
(function () {
  "use strict";

  const data = window.GUITAR_CURRICULUM;
  const guided = window.GUIDED_FLOW;
  if (!data || !guided) return;

  const storageKey = "guitar-learning-map-v1";
  const defaults = {
    stage: "stage1",
    completed: {},
    placement: {},
    libraryFilter: "all",
    focus: {},
    gates: {},
    seen: {},
    resume: null,
  };
  let state = loadState();

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return {
        ...defaults,
        ...parsed,
        completed: { ...(parsed.completed || {}) },
        placement: { ...(parsed.placement || {}) },
        focus: { ...(parsed.focus || {}) },
        gates: { ...(parsed.gates || {}) },
        seen: { ...(parsed.seen || {}) },
      };
    } catch (_) {
      return {
        ...defaults,
        completed: {},
        placement: {},
        focus: {},
        gates: {},
        seen: {},
      };
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
  }

  function playlistUrl(key) {
    return `https://www.youtube.com/playlist?list=${data.playlists[key].id}`;
  }

  function videoUrl(week) {
    if (!week.video) return playlistUrl(week.playlist);
    const list = data.playlists[week.playlist].id;
    const time = week.start ? `&t=${week.start}s` : "";
    return `https://www.youtube.com/watch?v=${week.video}&list=${list}${time}`;
  }

  function embedUrl(week) {
    const list = data.playlists[week.playlist].id;
    if (!week.video) return `https://www.youtube-nocookie.com/embed/videoseries?rel=0&list=${encodeURIComponent(list)}`;
    const start = week.start ? `&start=${week.start}` : "";
    return `https://www.youtube-nocookie.com/embed/${week.video}?rel=0&modestbranding=1&list=${encodeURIComponent(list)}${start}`;
  }

  function withFrom(href) {
    const url = new URL(href);
    url.searchParams.set("from", "map");
    return url.toString();
  }

  function currentStage() {
    return data.stages.find((stage) => stage.id === state.stage) || data.stages[0];
  }

  function stageById(stageId) {
    return data.stages.find((stage) => stage.id === stageId) || data.stages[0];
  }

  function normalizeTarget(stageId, week, step) {
    const stage = stageById(stageId);
    const weekNumber = Number(week);
    const weekOk = stage.weeks.some((item) => item.n === weekNumber) ? weekNumber : stage.weeks[0].n;
    const stepOk = step === "exit" || step === 1 || step === 2 || step === 3 ? step : 1;
    return { stage: stage.id, week: weekOk, step: stepOk };
  }

  function focusOf(stageId) {
    const stage = stageById(stageId || state.stage);
    const saved = state.focus[stage.id] || {};
    return normalizeTarget(stage.id, saved.week || stage.weeks[0].n, saved.step || 1);
  }

  function guidedWeek(stageId, weekNumber) {
    return guided.stages[stageId].weeks.find((week) => week.n === weekNumber);
  }

  function progressFor(stage) {
    const complete = stage.weeks.filter((week) => state.completed[`${stage.id}-${week.n}`]).length;
    return { complete, total: stage.weeks.length, percent: Math.round((complete / stage.weeks.length) * 100) };
  }

  function stepName(step) {
    if (step === "exit") return "階段出口";
    return ["", "學習方式", "看影片", "練習"][step] || "學習方式";
  }

  function parseFlowHash(raw) {
    const hash = String(raw || "").replace(/^#/, "");
    let match = hash.match(/^stage([1-4])-(\d+)-step(1|2|3|exit)$/);
    if (match) return { stage: `stage${match[1]}`, week: Number(match[2]), step: match[3] === "exit" ? "exit" : Number(match[3]) };
    match = hash.match(/^stage([1-4])-(\d+)$/);
    if (match) return { stage: `stage${match[1]}`, week: Number(match[2]), step: 1 };
    return null;
  }

  function flowHash(target) {
    return `#${target.stage}-${target.week}-step${target.step}`;
  }

  function commitFlow(target, options = {}) {
    const next = normalizeTarget(target.stage, target.week, target.step);
    state.stage = next.stage;
    state.focus[next.stage] = { week: next.week, step: next.step };
    state.resume = next;
    state.seen[`${next.stage}-${next.week}-${next.step}`] = true;
    saveState();
    const hash = flowHash(next);
    if (options.hashMode === "push" && location.hash !== hash) history.pushState(null, "", hash);
    if (options.hashMode === "replace" && location.hash !== hash) history.replaceState(null, "", hash);
    renderStage();
    if (options.scroll) el("week-studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function move(delta) {
    const stages = data.stages;
    const stage = currentStage();
    const here = focusOf(stage.id);
    const weeks = stage.weeks;
    const weekIndex = weeks.findIndex((week) => week.n === here.week);
    const stageIndex = stages.findIndex((item) => item.id === stage.id);
    if (delta > 0) {
      if (here.step === 1 || here.step === 2) return { stage: stage.id, week: here.week, step: here.step + 1, label: "下一步" };
      if (here.step === 3 && weekIndex < weeks.length - 1) return { stage: stage.id, week: weeks[weekIndex + 1].n, step: 1, label: "下一週" };
      if (here.step === 3) return { stage: stage.id, week: here.week, step: "exit", label: "看本階段出口" };
      if (here.step === "exit" && stageIndex < stages.length - 1) {
        const next = stages[stageIndex + 1];
        return { stage: next.id, week: next.weeks[0].n, step: 1, label: `前往 Stage ${Number(next.number)}` };
      }
      return null;
    }
    if (here.step === "exit") return { stage: stage.id, week: weeks[weeks.length - 1].n, step: 3, label: "回到最後一週" };
    if (here.step === 2 || here.step === 3) return { stage: stage.id, week: here.week, step: here.step - 1, label: "上一步" };
    if (here.step === 1 && weekIndex > 0) return { stage: stage.id, week: weeks[weekIndex - 1].n, step: 3, label: "上一週" };
    if (here.step === 1 && stageIndex > 0) {
      const prev = stages[stageIndex - 1];
      return { stage: prev.id, week: prev.weeks[prev.weeks.length - 1].n, step: "exit", label: `回到 Stage ${Number(prev.number)} 出口` };
    }
    return null;
  }

  function renderRoadmap() {
    el("roadmap-grid").innerHTML = data.stages.map((stage, index) => {
      const progress = progressFor(stage);
      const plan = guided.stages[stage.id].plan;
      return `<article class="roadmap-card" style="--stage-color:${stage.color}">
        <button class="roadmap-main" type="button" data-select-stage="${stage.id}">
          <span class="roadmap-number">${stage.number}</span>
          <span class="roadmap-copy"><small>${escapeHtml(stage.duration)} · ${escapeHtml(stage.daily)}</small><strong>${escapeHtml(stage.short)}</strong><span>${escapeHtml(stage.title)}</span></span>
          <span class="roadmap-progress">${progress.complete}/${progress.total}</span>
        </button>
        ${index < data.stages.length - 1 ? '<i aria-hidden="true">→</i>' : ""}
        <a class="roadmap-plan" href="${plan}">閱讀 Stage ${Number(stage.number)} 計畫</a>
      </article>`;
    }).join("");
  }

  function renderTabs() {
    el("stage-tabs").innerHTML = data.stages.map((stage) => `<button class="stage-tab" type="button" role="tab" aria-selected="${stage.id === state.stage}" data-select-stage="${stage.id}" style="--stage-color:${stage.color}"><span>${stage.number}</span>${escapeHtml(stage.short)}</button>`).join("");
  }

  function renderList(items) {
    return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function playlistAccessNote(key) {
    if (key === "s4neo") return "Stage 4N 播放清單為私人，需用擁有 Emil Wu YouTube 頻道的帳號開啟。";
    return "播放清單為不公開（unlisted），需透過連結開啟。";
  }

  function renderPlaylistCard(key) {
    const item = data.playlists[key];
    const kindNames = { core: "核心", support: "按需補強", optional: "完成後選修", branch: "曲風專修", reference: "參考", context: "需脈絡" };
    const privacy = key === "s4neo" ? `<p>此播放清單為私人。</p>` : "";
    return `<article class="playlist-card" data-library-stage="${item.stage}">
      <div class="playlist-meta"><span>${kindNames[item.kind] || escapeHtml(item.kind)}</span><b>${item.count} 項</b></div>
      <h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.role)}</p>
      ${privacy}
      <a href="${playlistUrl(key)}" target="_blank" rel="noreferrer">開啟 Playlist <span aria-hidden="true">↗</span></a>
    </article>`;
  }

  function renderTools(practice, titlePrefix) {
    const tools = practice.tools || [];
    if (!tools.length) {
      return `<aside class="callout"><p>這一週直接在琴上做，沒有對應的線上工具。</p></aside>`;
    }
    const buttons = tools.map((item, index) => {
      const src = withFrom(item.href);
      return `<button type="button" data-tool-src="${escapeHtml(src)}" data-tool-title="${escapeHtml(`${titlePrefix}：${item.label}`)}" aria-pressed="${index === 0 ? "true" : "false"}">${escapeHtml(item.label)}${item.soon ? " · 即將推出" : ""}</button>`;
    }).join("");
    const first = tools[0];
    const src = withFrom(first.href);
    const soon = first.soon
      ? `<aside class="callout"><p>${escapeHtml(first.label)}即將推出。練習內容寫在上面；下面嵌入的是工具站的這一頁，不會把你帶去別的地方。</p></aside>`
      : "";
    const switcher = tools.length > 1 ? `<div class="tool-switch" role="group" aria-label="選擇練習工具">${buttons}</div>` : "";
    return `${soon}${switcher}
      <iframe class="tool-frame" id="tool-frame" title="${escapeHtml(`${titlePrefix}：${first.label}`)}" src="${escapeHtml(src)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <div class="step-actions"><a id="tool-open" href="${escapeHtml(src)}" target="_blank" rel="noreferrer">開啟全螢幕</a></div>`;
  }

  function practiceLogHref(stage, week, practice) {
    const params = new URLSearchParams();
    params.set("stage", String(Number(stage.number)));
    params.set("week", String(week.n));
    const sentence = String(practice?.exercise || week.title).split("。")[0].trim();
    params.set("exercise", sentence.slice(0, 80));
    const tools = practice?.tools || [];
    const metro = tools.find((item) => item.href.includes("/metronome/"));
    const board = tools.find((item) => item.href.includes("/fretboard/"));
    const chordTool = tools.find((item) => item.href.includes("/chord/"));
    const named = metro || board || chordTool;
    if (named?.href.includes("/metronome/")) params.set("tool", "metronome");
    else if (named?.href.includes("/fretboard/")) params.set("tool", "fretboard");
    else if (named) params.set("tool", "chord");
    if (metro) {
      const bpm = new URL(metro.href).hash.match(/bpm=(\d+)/);
      if (bpm) params.set("bpm", bpm[1]);
    }
    const url = new URL("https://emilwu.github.io/guitar-practice-tools/log/");
    url.hash = params.toString();
    return withFrom(url.toString());
  }

  function renderPracticeBlock(practice, titlePrefix) {
    const proposed = practice.linkBasis === "proposed"
      ? `<p class="origin-note">處方沒有指定這個和弦或調。下面是依照本週任務舉的例子。</p>`
      : "";
    return `<p>${escapeHtml(practice.exercise)}</p>${proposed}${renderTools(practice, titlePrefix)}`;
  }

  function renderExit(stage) {
    const flowStage = guided.stages[stage.id];
    const saved = state.gates[stage.id] || {};
    const progress = progressFor(stage);
    const checks = stage.gates.map((gate, index) => `<label class="check-row"><input type="checkbox" data-gate="${index}" ${saved[index] ? "checked" : ""} /><span>${escapeHtml(gate)}</span></label>`).join("");
    const notes = (flowStage.exitNotes || []).map((note) => `<p>${escapeHtml(note)}</p>`).join("");
    const optional = stage.optional ? `<p class="optional-note">${escapeHtml(stage.optional)}</p>` : "";
    const extra = flowStage.extra ? `<section class="reading"><h3>${escapeHtml(flowStage.extra.title)}</h3>${renderPracticeBlock(flowStage.extra, flowStage.extra.title)}<p><a href="${flowStage.plan}#${flowStage.extra.anchor}">閱讀這段選修</a></p></section>` : "";
    return `<p class="step-kicker">STAGE EXIT</p>
      <h3>Stage ${Number(stage.number)} 出口</h3>
      <p>這台裝置已勾選 ${progress.complete} / ${progress.total} 週。出口看的是做得到，不是看過。勾選只存在這個瀏覽器。</p>
      ${notes}
      <div class="gate-checks">${checks}</div>
      ${optional}
      ${extra}
      <p><a href="${flowStage.plan}">閱讀 Stage ${Number(stage.number)} 完整計畫</a></p>`;
  }

  function renderStepPanel(stage, week, step) {
    if (step === "exit") return renderExit(stage);
    const lesson = guidedWeek(stage.id, week.n);
    const flowStage = guided.stages[stage.id];
    const planHref = `${flowStage.plan}#${lesson.anchor}`;
    if (step === 1) {
      const reading = lesson.reading.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
      return `<p class="step-kicker">01 · 學習方式</p>
        <h3>${escapeHtml(lesson.goal)}</h3>
        <ul>${lesson.approach.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <p><b>本週只做：</b>${escapeHtml(week.task)}</p>
        <p><b>通過證據：</b>${escapeHtml(week.evidence)}</p>
        <details class="reading"><summary>展開本週計畫摘錄</summary>${reading}</details>
        <p><a href="${planHref}">閱讀 Stage ${Number(stage.number)} 完整計畫的這一節</a></p>
        <p class="embed-note">下一步是看這週的影片。看完要回到這一頁。</p>`;
    }
    if (step === 2) {
      const openLabel = week.video ? "在 YouTube 開啟這支影片" : "在 YouTube 開啟本階段 Playlist";
      return `<p class="step-kicker">02 · 看影片</p>
        <h3>${escapeHtml(week.title)}</h3>
        <p>${escapeHtml(data.playlists[week.playlist].label)}。${escapeHtml(lesson.watchFor)}</p>
        <p class="embed-note">${escapeHtml(playlistAccessNote(week.playlist))}看完回到這裡，按下一步做練習。若播放器是空白或無法播放，用按鈕在 YouTube 開啟。</p>
        <iframe class="video-frame" title="${escapeHtml(`第 ${week.n} 週影片：${week.title}`)}" src="${escapeHtml(embedUrl(week))}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
        <div class="step-actions"><a href="${videoUrl(week)}" target="_blank" rel="noreferrer">${openLabel}</a></div>`;
    }
    const done = Boolean(state.completed[`${stage.id}-${week.n}`]);
    return `<p class="step-kicker">03 · 練習</p>
      <h3>${escapeHtml(week.title)}</h3>
      ${renderPracticeBlock(lesson.practice, `第 ${week.n} 週練習`)}
      <p class="embed-note">練完留在這一頁。通過證據後再勾選完成。紀錄頁即將上線，連結已帶上這一週。</p>
      <div class="step-actions"><a href="${escapeHtml(practiceLogHref(stage, week, lesson.practice))}" target="_blank" rel="noreferrer">記錄這次練習</a><button type="button" data-toggle-week="${stage.id}-${week.n}" aria-pressed="${done}">${done ? "取消完成" : "通過並完成"}</button></div>`;
  }

  function renderStudio(stage) {
    const here = focusOf(stage.id);
    const activeWeek = stage.weeks.find((week) => week.n === here.week) || stage.weeks[0];
    el("week-rail").innerHTML = stage.weeks.map((week) => {
      const done = Boolean(state.completed[`${stage.id}-${week.n}`]);
      const current = week.n === activeWeek.n && here.step !== "exit";
      return `<button class="week-pill${done ? " is-done" : ""}" type="button" data-flow-week="${week.n}" aria-current="${current ? "true" : "false"}"><b>${String(week.n).padStart(2, "0")}${done ? " · 完成" : ""}</b><span>${escapeHtml(week.title)}</span></button>`;
    }).join("");
    const steps = [
      [1, "01", "學習方式"],
      [2, "02", "看影片"],
      [3, "03", "練習"],
      ["exit", "04", "階段出口"],
    ];
    el("step-indicator").innerHTML = steps.map(([id, number, label]) => {
      const selected = here.step === id;
      const seen = Boolean(state.seen[`${stage.id}-${activeWeek.n}-${id}`]);
      return `<button class="step-tab${seen ? " is-seen" : ""}" type="button" role="tab" id="step-tab-${id}" aria-selected="${selected}" aria-controls="step-panel" data-flow-step="${id}"><small>${number}</small>${label}</button>`;
    }).join("");
    const panel = el("step-panel");
    panel.innerHTML = renderStepPanel(stage, activeWeek, here.step);
    const selectedTab = steps.find(([id]) => id === here.step);
    panel.setAttribute("aria-labelledby", `step-tab-${selectedTab[0]}`);
    const previous = move(-1);
    const next = move(1);
    el("step-move").innerHTML = `<button type="button" data-flow-go="-1" ${previous ? "" : "disabled"}>${previous ? escapeHtml(previous.label) : "上一步"}</button><button class="is-next" type="button" data-flow-go="1" ${next ? "" : "disabled"}>${next ? escapeHtml(next.label) : "已是最後階段"}</button>`;
  }

  function renderStage() {
    const stage = currentStage();
    const progress = progressFor(stage);
    const flowStage = guided.stages[stage.id];
    document.documentElement.style.setProperty("--active-stage", stage.color);
    el("stage-overview").innerHTML = `<div><p>STAGE ${stage.number}</p><h2>${escapeHtml(stage.title)}</h2><p>${escapeHtml(stage.summary)}</p><p><a href="${flowStage.plan}">閱讀 Stage ${Number(stage.number)} 完整計畫</a></p></div><dl><div><dt>時程</dt><dd>${escapeHtml(stage.duration)}</dd></div><div><dt>每日</dt><dd>${escapeHtml(stage.daily)}</dd></div></dl>`;
    el("stage-progress-card").innerHTML = `<div><span>本階段進度</span><strong>${progress.percent}%</strong></div><div class="large-meter"><span style="width:${progress.percent}%"></span></div><p>${progress.complete} / ${progress.total} 週已標記完成。通過當週證據後才勾選。</p>`;
    el("stage-entry").innerHTML = renderList(stage.entry);
    el("stage-exit").innerHTML = renderList(stage.exit);
    el("daily-title").textContent = `${stage.daily} 的固定節奏`;
    el("routine-track").innerHTML = stage.dailyBlocks.map(([minutes, title, detail]) => `<article class="routine-block"><strong>${minutes}<small>分</small></strong><div><h4>${escapeHtml(title)}</h4><p>${escapeHtml(detail)}</p></div></article>`).join("");
    renderStudio(stage);
    el("stage-playlists").innerHTML = stage.playlists.map(renderPlaylistCard).join("");
    renderTabs();
    renderRoadmap();
    renderHeaderProgress();
  }

  function renderHeaderProgress() {
    const stage = currentStage();
    const progress = progressFor(stage);
    el("header-progress-label").textContent = `S${Number(stage.number)} · ${progress.complete}/${progress.total}`;
    el("header-progress-bar").style.width = `${progress.percent}%`;
    const target = state.resume || focusOf(stage.id);
    const targetStage = stageById(target.stage);
    const href = flowHash(target);
    const label = `繼續 Stage ${Number(targetStage.number)} · 第 ${target.week} 週 · ${stepName(target.step)}`;
    const continueLink = el("continue-link");
    continueLink.textContent = label;
    continueLink.href = href;
    const resumeLink = el("resume-link");
    if (resumeLink) resumeLink.href = href;
  }

  function renderPlacement() {
    document.querySelectorAll("[data-placement]").forEach((input) => {
      input.checked = Boolean(state.placement[input.dataset.placement]);
    });
    let next = 1;
    while (next <= 4 && state.placement[next]) next += 1;
    const result = el("placement-result");
    if (next <= 4) {
      const stage = data.stages[next - 1];
      result.innerHTML = `<span>建議入口</span><strong>Stage ${stage.number}</strong><h3>${escapeHtml(stage.short)}</h3><p>${escapeHtml(stage.title)}</p><button type="button" data-select-stage="${stage.id}">打開這個 Stage</button>`;
    } else {
      result.innerHTML = `<span>目前判定</span><strong>Stage 1–4 complete</strong><h3>進入真實作品驗證</h3><p>選一條 Stage 4 專修與 Stage 5 曲目路徑，持續用錄音而非觀看量驗證。</p><button type="button" data-select-stage="stage4">回看 Stage 4 閘門</button>`;
    }
  }

  function renderLibrary() {
    const filters = [{ id: "all", label: "全部 16 個" }, ...data.stages.map((stage) => ({ id: String(Number(stage.number)), label: `Stage ${Number(stage.number)}` }))];
    el("library-filters").innerHTML = filters.map((filter) => `<button type="button" data-library-filter="${filter.id}" aria-pressed="${state.libraryFilter === filter.id}">${filter.label}</button>`).join("");
    const keys = Object.keys(data.playlists).filter((key) => state.libraryFilter === "all" || String(data.playlists[key].stage) === state.libraryFilter);
    el("playlist-library").innerHTML = keys.map(renderPlaylistCard).join("");
  }

  function selectStage(stageId, shouldScroll) {
    const saved = state.focus[stageId];
    commitFlow({ stage: stageId, week: saved?.week || 1, step: saved?.step || 1 }, { hashMode: "push", scroll: shouldScroll });
  }

  function sameTarget(left, right) {
    return left && right && left.stage === right.stage && left.week === right.week && left.step === right.step;
  }

  function applyHash(scroll) {
    const parsed = parseFlowHash(location.hash);
    if (!parsed) return;
    if (sameTarget(state.resume, normalizeTarget(parsed.stage, parsed.week, parsed.step)) && state.stage === parsed.stage) {
      if (scroll) el("week-studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    commitFlow(parsed, { hashMode: "none", scroll });
  }

  document.addEventListener("click", (event) => {
    const toolButton = event.target.closest("[data-tool-src]");
    if (toolButton) {
      const frame = el("tool-frame");
      const open = el("tool-open");
      if (frame) {
        frame.src = toolButton.dataset.toolSrc;
        frame.title = toolButton.dataset.toolTitle || frame.title;
      }
      if (open) open.href = toolButton.dataset.toolSrc;
      toolButton.parentElement.querySelectorAll("button").forEach((button) => {
        button.setAttribute("aria-pressed", button === toolButton ? "true" : "false");
      });
      return;
    }

    const stageButton = event.target.closest("[data-select-stage]");
    if (stageButton) {
      selectStage(stageButton.dataset.selectStage, true);
      return;
    }

    const weekButton = event.target.closest("[data-toggle-week]");
    if (weekButton) {
      const key = weekButton.dataset.toggleWeek;
      state.completed[key] = !state.completed[key];
      saveState();
      renderStage();
      el("week-studio")?.scrollIntoView({ block: "start" });
      return;
    }

    const filterButton = event.target.closest("[data-library-filter]");
    if (filterButton) {
      state.libraryFilter = filterButton.dataset.libraryFilter;
      saveState();
      renderLibrary();
      return;
    }

    const stepButton = event.target.closest("[data-flow-step]");
    if (stepButton) {
      const step = stepButton.dataset.flowStep === "exit" ? "exit" : Number(stepButton.dataset.flowStep);
      commitFlow({ stage: state.stage, week: focusOf().week, step }, { hashMode: "push", scroll: false });
      return;
    }

    const weekPill = event.target.closest("[data-flow-week]");
    if (weekPill) {
      commitFlow({ stage: state.stage, week: Number(weekPill.dataset.flowWeek), step: 1 }, { hashMode: "push", scroll: false });
      return;
    }

    const moveButton = event.target.closest("[data-flow-go]");
    if (moveButton && !moveButton.disabled) {
      const destination = move(Number(moveButton.dataset.flowGo));
      if (destination) commitFlow(destination, { hashMode: "push", scroll: false });
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-placement]")) {
      const level = Number(event.target.dataset.placement);
      state.placement[level] = event.target.checked;
      if (!event.target.checked) {
        for (let i = level + 1; i <= 4; i += 1) state.placement[i] = false;
      }
      saveState();
      renderPlacement();
      return;
    }
    if (event.target.matches("[data-gate]")) {
      const stage = currentStage();
      state.gates[stage.id] = state.gates[stage.id] || {};
      state.gates[stage.id][event.target.dataset.gate] = event.target.checked;
      saveState();
    }
  });

  el("reset-stage").addEventListener("click", () => {
    const stage = currentStage();
    if (!window.confirm(`確定要清除 Stage ${Number(stage.number)} 在這台裝置上的週進度嗎？`)) return;
    stage.weeks.forEach((week) => delete state.completed[`${stage.id}-${week.n}`]);
    delete state.gates[stage.id];
    commitFlow({ stage: stage.id, week: stage.weeks[0].n, step: 1 }, { hashMode: "push", scroll: true });
  });

  ["continue-link", "resume-link"].forEach((id) => {
    const node = el(id);
    if (!node) return;
    node.addEventListener("click", (event) => {
      const href = node.getAttribute("href");
      if (location.hash === href) {
        event.preventDefault();
        el("week-studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  window.addEventListener("hashchange", () => applyHash(true));
  window.addEventListener("popstate", () => applyHash(false));

  const opening = parseFlowHash(location.hash);
  if (opening) {
    const next = normalizeTarget(opening.stage, opening.week, opening.step);
    state.stage = next.stage;
    state.focus[next.stage] = { week: next.week, step: next.step };
    state.resume = next;
    state.seen[`${next.stage}-${next.week}-${next.step}`] = true;
  } else if (!state.focus[state.stage]) {
    const stage = currentStage();
    const openWeek = stage.weeks.find((week) => !state.completed[`${stage.id}-${week.n}`]) || stage.weeks[0];
    state.focus[stage.id] = { week: openWeek.n, step: 1 };
    if (!state.resume) state.resume = { stage: stage.id, week: openWeek.n, step: 1 };
  }
  saveState();
  renderPlacement();
  renderLibrary();
  renderStage();
  if (opening) el("week-studio")?.scrollIntoView({ block: "start" });
})();
