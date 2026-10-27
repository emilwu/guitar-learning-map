---
title: "Guitar Learning Map"
version: 1.2.0
updated_at: "2026-10-26T00:00:00+08:00"
summary: >-
  Stage 1–4 吉他學習地圖。每週在同一頁走完學習方式、影片與練習，並附學習計劃頁。
section_index:
  - "網站內容"
  - "使用方式"
  - "隱私"
---

# Guitar Learning Map

## 網站內容

從基本動作、節奏與 Pentatonic，到指板導航、進階和聲與編曲的四階段吉他課程。網站包含 49 個主線週次、十六個 YouTube Playlist、每日練習配置、週末通過證據與能力閘門。每週的學習方式、影片與練習都在首頁的同一週視圖裡完成。完整計畫在 `plan/`。

公開網站：[Guitar Learning Map](https://emilwu.github.io/guitar-learning-map/)

## 使用方式

先用首頁的程度判斷找到入口。進入某一週後，依序走「學習方式 → 看影片 → 練習」，階段最後一週的下一步是階段出口。頁首的進度會回到上次停下的步驟。影片看完不代表完成，必須留下該週要求的錄音、錄影、口述或書面證據。

## 學習計劃頁

`plan/index.html` 是總覽，`plan/stage-1.html` 到 `plan/stage-4.html` 是各階段原文，`plan/appendix.html` 是分類附錄。這些 HTML 由 `node scripts/build-plan.mjs` 從 `content/plan/` 與 `content/guided-flow.mjs` 產生，產生結果一併提交，GitHub Pages 不需要建置步驟。改完 Markdown 或每週流程後再跑一次腳本。

## 隱私

學習進度只保存在瀏覽器 localStorage（鍵名 `guitar-learning-map-v1`）。網站沒有帳號、追蹤、上傳或伺服器資料庫。15 個 YouTube 播放清單為不公開（unlisted），需透過連結開啟。Stage 4N（Neo-Soul／Mateus）為私人，只有具權限的頻道帳號能播放。
