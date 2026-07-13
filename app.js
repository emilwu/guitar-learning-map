/*
 * Guitar Learning Map interactions
 * Version: 1.0.0
 * Updated: 2026-07-14
 * Stores only stage selection, placement checks, and weekly completion locally.
 */
(function () {
  "use strict";

  const data = window.GUITAR_CURRICULUM;
  if (!data) return;

  const storageKey = "guitar-learning-map-v1";
  const defaults = { stage: "stage1", completed: {}, placement: {}, libraryFilter: "all" };
  let state = loadState();

  function loadState() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
    } catch (_) {
      return { ...defaults };
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function el(id) {
    return document.getElementById(id);
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

  function currentStage() {
    return data.stages.find((stage) => stage.id === state.stage) || data.stages[0];
  }

  function progressFor(stage) {
    const complete = stage.weeks.filter((week) => state.completed[`${stage.id}-${week.n}`]).length;
    return { complete, total: stage.weeks.length, percent: Math.round((complete / stage.weeks.length) * 100) };
  }

  function renderRoadmap() {
    el("roadmap-grid").innerHTML = data.stages.map((stage, index) => {
      const progress = progressFor(stage);
      return `<button class="roadmap-card" type="button" data-select-stage="${stage.id}" style="--stage-color:${stage.color}">
        <span class="roadmap-number">${stage.number}</span>
        <span class="roadmap-copy"><small>${stage.duration} · ${stage.daily}</small><strong>${stage.short}</strong><span>${stage.title}</span></span>
        <span class="roadmap-progress">${progress.complete}/${progress.total}</span>
        ${index < data.stages.length - 1 ? '<i aria-hidden="true">→</i>' : ""}
      </button>`;
    }).join("");
  }

  function renderTabs() {
    el("stage-tabs").innerHTML = data.stages.map((stage) => `<button class="stage-tab" type="button" role="tab" aria-selected="${stage.id === state.stage}" data-select-stage="${stage.id}" style="--stage-color:${stage.color}"><span>${stage.number}</span>${stage.short}</button>`).join("");
  }

  function renderList(items) {
    return items.map((item) => `<li>${item}</li>`).join("");
  }

  function renderPlaylistCard(key) {
    const item = data.playlists[key];
    const kindNames = { core: "核心", support: "按需補強", optional: "完成後選修", branch: "曲風專修", reference: "參考", context: "需脈絡" };
    return `<article class="playlist-card" data-library-stage="${item.stage}">
      <div class="playlist-meta"><span>${kindNames[item.kind] || item.kind}</span><b>${item.count} 項</b></div>
      <h3>${item.label}</h3><p>${item.role}</p>
      <a href="${playlistUrl(key)}" target="_blank" rel="noreferrer">開啟 Playlist <span aria-hidden="true">↗</span></a>
    </article>`;
  }

  function renderStage() {
    const stage = currentStage();
    const progress = progressFor(stage);
    document.documentElement.style.setProperty("--active-stage", stage.color);

    el("stage-overview").innerHTML = `<div><p>STAGE ${stage.number}</p><h2>${stage.title}</h2><p>${stage.summary}</p></div><dl><div><dt>時程</dt><dd>${stage.duration}</dd></div><div><dt>每日</dt><dd>${stage.daily}</dd></div></dl>`;
    el("stage-progress-card").innerHTML = `<div><span>本階段進度</span><strong>${progress.percent}%</strong></div><div class="large-meter"><span style="width:${progress.percent}%"></span></div><p>${progress.complete} / ${progress.total} 週已標記完成。通過週末證據後才勾選。</p>`;
    el("stage-entry").innerHTML = renderList(stage.entry);
    el("stage-exit").innerHTML = renderList(stage.exit);
    el("daily-title").textContent = `${stage.daily} 的固定節奏`;
    el("routine-track").innerHTML = stage.dailyBlocks.map(([minutes, title, detail]) => `<article class="routine-block"><strong>${minutes}<small>分</small></strong><div><h4>${title}</h4><p>${detail}</p></div></article>`).join("");
    el("weeks-grid").innerHTML = stage.weeks.map((week) => {
      const key = `${stage.id}-${week.n}`;
      const complete = Boolean(state.completed[key]);
      return `<article class="week-card${complete ? " complete" : ""}" id="${key}">
        <div class="week-index"><span>WEEK</span><strong>${String(week.n).padStart(2, "0")}</strong></div>
        <div class="week-body"><div class="week-topline"><span>${data.playlists[week.playlist].label}</span>${complete ? "<b>完成</b>" : ""}</div>
          <h4>${week.title}</h4><p><b>本週只做：</b>${week.task}</p><p><b>通過證據：</b>${week.evidence}</p>
          <div class="week-actions"><a href="${videoUrl(week)}" target="_blank" rel="noreferrer">${week.video ? "從 Playlist 開啟本週影片" : "開啟本階段 Playlist"} ↗</a><button type="button" data-toggle-week="${key}" aria-pressed="${complete}">${complete ? "取消完成" : "通過並完成"}</button></div>
        </div>
      </article>`;
    }).join("");
    el("gate-list").innerHTML = stage.gates.map((gate, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><p>${gate}</p></li>`).join("");
    el("optional-note").textContent = stage.optional || "通過本階段後再前進；補強清單不增加畢業門檻。";
    el("stage-playlists").innerHTML = stage.playlists.map(renderPlaylistCard).join("");
    renderTabs();
    renderRoadmap();
    renderHeaderProgress();
  }

  function renderHeaderProgress() {
    const stage = currentStage();
    const progress = progressFor(stage);
    el("header-progress-label").textContent = `S${stage.number} · ${progress.complete}/${progress.total}`;
    el("header-progress-bar").style.width = `${progress.percent}%`;
    const firstOpen = stage.weeks.find((week) => !state.completed[`${stage.id}-${week.n}`]);
    el("continue-link").textContent = firstOpen ? `繼續 Stage ${stage.number} · Week ${firstOpen.n}` : `Stage ${stage.number} 已完成`;
    el("continue-link").href = firstOpen ? `#${stage.id}-${firstOpen.n}` : "#curriculum";
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
      result.innerHTML = `<span>建議入口</span><strong>Stage ${stage.number}</strong><h3>${stage.short}</h3><p>${stage.title}</p><button type="button" data-select-stage="${stage.id}">打開這個 Stage</button>`;
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
    state.stage = stageId;
    saveState();
    renderStage();
    if (shouldScroll) el("curriculum").scrollIntoView({ behavior: "smooth" });
  }

  document.addEventListener("click", (event) => {
    const stageButton = event.target.closest("[data-select-stage]");
    if (stageButton) selectStage(stageButton.dataset.selectStage, true);

    const weekButton = event.target.closest("[data-toggle-week]");
    if (weekButton) {
      const key = weekButton.dataset.toggleWeek;
      state.completed[key] = !state.completed[key];
      saveState();
      renderStage();
      document.getElementById(key)?.scrollIntoView({ block: "center" });
    }

    const filterButton = event.target.closest("[data-library-filter]");
    if (filterButton) {
      state.libraryFilter = filterButton.dataset.libraryFilter;
      saveState();
      renderLibrary();
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
    }
  });

  el("reset-stage").addEventListener("click", () => {
    const stage = currentStage();
    if (!window.confirm(`確定要清除 Stage ${stage.number} 在這台裝置上的週進度嗎？`)) return;
    stage.weeks.forEach((week) => delete state.completed[`${stage.id}-${week.n}`]);
    saveState();
    renderStage();
  });

  renderPlacement();
  renderLibrary();
  renderStage();
})();
