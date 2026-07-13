---
title: "Guitar Learning Map 網站內容與檔案說明"
version: 1.1.0
updated_at: "2026-07-14T02:40:00+08:00"
status: published_verified
summary: >-
  說明已發布 GitHub Pages 網站的內容來源、檔案職責、互動資料、公開網址與驗證邊界。
section_index:
  - "網站目的"
  - "發布結果"
  - "檔案職責"
  - "內容範圍"
  - "互動與隱私"
  - "發布前檢查"
---

# Guitar Learning Map 網站內容與檔案說明

## 網站目的

網站把 Stage 1–4 已驗證課程與十六個私人 YouTube 播放清單組合成一個可操作的學習地圖。YouTube 清單本身可獨立學習；網站另外提供程度判斷、每週唯一任務、能力閘門、補強分流與本機進度。

## 發布結果

- 公開網站：https://emilwu.github.io/guitar-learning-map/
- Repository：https://github.com/emilwu/guitar-learning-map
- GitHub Pages 來源：`main` branch、repository root `/`。
- HTTPS 已強制啟用，Pages build 與首頁／資源讀取已通過。

## 檔案職責

| 檔案 | 用途 |
|---|---|
| `index.html` | 首頁、程度判斷、Stage 工作區、Playlist Library 與方法說明 |
| `styles.css` | 深色編輯式視覺、桌面／行動版版面、鍵盤焦點與減少動態設定 |
| `app.js` | Stage 切換、每週進度、程度建議、Playlist 篩選與本機儲存 |
| `data/curriculum.js` | Stage 1–4 課程、週次、能力閘門與十六個已驗證 Playlist IDs |
| `data/stage4.js` | 第一版 Stage 4 原型資料；保留作版本稽核，不再由首頁載入 |
| `.nojekyll` | 讓 GitHub Pages 直接提供靜態檔案 |

## 內容範圍

- Stage 1：4 週、每日 18 分鐘。
- Stage 2：9 週、每日 20–24 分鐘。
- Stage 3：20 週共同主線與完成後 4 週選修、每日 30 分鐘。
- Stage 4：16 週共同核心與 4 週單一曲風專修、每日 35 分鐘。
- 十六個播放清單維持 private；Bass、Stage 5、器材與舊清單清理不在網站 V1 範圍。

## 互動與隱私

網站只把目前 Stage、程度勾選、每週完成狀態與 Playlist 篩選保存在瀏覽器 `localStorage`。沒有登入、分析追蹤、伺服器資料庫或上傳功能。

## 發布前檢查

1. 檢查桌面與手機版的導覽、Stage 切換與週卡片。
2. 使用擁有 YouTube 頻道的帳號抽查十六個私人 Playlist 連結。
3. 驗證重新整理後進度仍存在，重設只清除目前 Stage。
4. 使用實際手機與桌面瀏覽器抽查導覽、可讀性與 private Playlist 登入行為。
