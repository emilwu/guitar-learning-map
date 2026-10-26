---
title: "全域 Taxonomy V2"
version: 2.2.0
updated_at: "2026-07-12T20:20:00+08:00"
status: active
summary: >-
  依 10 個播放清單的全域盤點，定義核心能力、整合路線與器材支援；Bass 僅保留獨立分類，內容整理延後另案進行。
section_index:
  - "為什麼需要 V2"
  - "架構：核心能力、整合路線與支援路線"
  - "整合路線"
  - "支援路線"
  - "每支影片的資料欄位"
  - "原六模組在 V2 的位置"
  - "Taxonomy 穩定度"
---

# 全域 Taxonomy V2

更新日期：2026-07-12  
依據：10 個播放清單、417 個清單位置、目前可辨識約 297 支唯一影片

## 為什麼需要 V2

- 約 120 個清單位置是跨清單重複引用，不能依原清單名稱建立資料主檔。
- 「樂理」「練習」「Solo」「和弦」都包含彼此的內容。
- 148 支練習清單中，標題初篩同時大量命中基礎練習、理論／指板、主奏、節奏、曲風、曲目與器材。
- 原六個五聲音階／琶音模組仍有價值，但只涵蓋整體能力圖的一部分。

## 架構：核心能力、整合路線與支援路線

### C0｜學習起點與練習系統

- 程度診斷與學習順序
- 自學方法、目標設定與練習規劃
- 節拍器、刻意練習、錯誤診斷
- 每日 routine、速度紀錄與複習機制

### C1｜演奏技術與動作控制

- 左手按弦、獨立性、伸展與換把
- alternate／economy／hybrid／sweep picking
- muting、雜音控制與 articulation
- bend、slide、hammer-on、pull-off、vibrato、harmonics
- 速度、同步、耐力與放鬆

### C2｜節奏、和弦與伴奏

- subdivision、三連音、shuffle、切分與 groove
- 開放／封閉／power chords
- strumming、funk rhythm 與 riff
- chord progression、分解和弦與 fingerstyle
- shell chords、節奏用 triads 與歌曲伴奏

### C3｜樂理、和聲與指板

- 音名、音程、大調音階、調性與五度圈
- 和弦公式、triads、七和弦與 extensions
- CAGED、指板導航、轉調、scales 與 modes
- arpeggios、chord tones 與和弦／音階關係
- voicings、voice leading、Drop 2／Drop 3
- functional harmony、cadence、II–V–I、創作與編曲

### C4｜主奏、Solo 與即興

- pentatonic foundations 與把位連接
- phrasing、motif、lick vocabulary 與旋律發展
- chord-tone／triad／arpeggio soloing
- jam session、聆聽回應與即興結構
- 完整 solo 的學習、分析與轉化

## 整合路線

### S｜曲風語彙

Blues、Rock／Hard Rock／J-Rock、Funk、Jazz、Neo-Soul／R&B／Lofi、Math Rock、City Pop、Bossa 等。

曲風不是主要能力分類。每條曲風路線應引用 C1–C4 的先備，例如 Blues 會引用 dominant harmony、pentatonic、bend／vibrato 與 12-bar accompaniment。

### R｜曲目與實戰

- 完整歌曲、riff、solo、伴奏與編曲教學
- TAB／play-through／backing track
- repertoire、表演準備與 jam 任務

曲目是整合與驗收，不取代核心能力課。

## 支援路線

### E｜音色、器材、錄音與現場系統

- 樂器選擇、pickups、amps、effects
- signal chain、EQ、gain staging、tone shaping
- 配件、setup 與維護
- audio interface、DI、DAW、home recording
- live sound 與舞台溝通

### B｜Bass 獨立課程樹

- B0 基礎與指板
- B1 節奏、subdivision 與 groove
- B2 和聲角色、root／fifth／passing notes
- B3 曲風 bass line
- B4 技巧、曲目與 ensemble application

Bass 可引用 C3 共通樂理，但不與吉他技術及播放清單混排。

目前 `B` 為延後處理範圍：只維持清冊與分類隔離，不做影片分析、Stage 排序、課程設計、NotebookLM 匯入、YouTube 搬移或網站內容。未來另案開始時，再建立 Bass 專用先備關係與 B0–B4 的實際映射。

## 每支影片的資料欄位

每支影片只保存一筆主檔，並擁有：

- `primary_bucket`：C0–C4、R、E 或 B，只能一個。當影片本身以完整歌曲、TAB、cover、backing track 或 repertoire 為教學核心時使用 R；否則 R 只作整合標籤。
- `secondary_capabilities`：補充能力，可多個
- `style_tags`：S 層，可多個
- `repertoire_tags`：歌曲、作者或 riff／solo 等 R 層資訊
- `curriculum_role`：core、practice、application、reference、inspiration
- `level` 與 `prerequisites`
- `source_playlists`：原播放清單，多對多
- transcript／visual evidence 與 confidence

## 原六模組在 V2 的位置

| 原模組 | V2 位置 |
|---|---|
| 五聲音階：基本指型與練習方法 | C4 > Pentatonic Foundations；練習方法另引用 C0 |
| 五聲音階：連接把位與即興選音 | C4 > Pentatonic Navigation |
| 五聲音階：Licks、Solo 與進階整合 | C4 > Phrasing & Solo Application |
| 和弦公式與主奏琶音基礎 | C3 > Chord Construction & Arpeggios |
| 主奏琶音：練習、指板導航與即興 | C4 > Chord-tone Soloing；先備來自 C3 |
| 分解和弦、伴奏與演奏靈感 | C2 > Broken Chords & Accompaniment |

## Taxonomy 穩定度

- C0–C4 的能力邊界：中高信心
- E 器材支線：高信心
- B Bass 與吉他分離：高信心；B0–B4 內容與順序尚未處理
- S 與 R 作為整合層：高信心
- 個別影片的 primary capability：目前只是 title-level provisional，需 metadata／transcript／visual evidence 驗證
- 模組內精確播放順序：尚未完成
