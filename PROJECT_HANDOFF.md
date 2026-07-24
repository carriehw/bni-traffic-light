# BNI BINGO 紅黃綠燈平台 — Project Handoff

## 1. Production Resources

- Production：<https://bni-traffic-light.bingo-win.workers.dev/>
- Repository：<https://github.com/carriehw/bni-traffic-light>
- Cloudflare Worker：`bni-traffic-light`
- Cloudflare D1：`bni-traffic-light`
- Production branch：`main`
- API：same-origin `/api/bni`
- Recovery source：原 Supabase project `qyufbsvrophwzcwlkppv` 保留 read-only 至 2026-07-31

任何密碼、service role key、session token 都不可寫入本文件或 GitHub。

## 2. Architecture

### Frontend

- `index.html`：核心會員及 LT 介面
- `v2.html`：Production loader，載入核心頁及穩定化模組
- `precision_scoring.js`：Green Path Engine
- `upload_workflow_v2.js`：Excel 核對及發布流程
- `v2_stabilization.js`：會員詳情、PNG、手機穩定化
- `bulk_cards_v2.js`：篩選及批量 ZIP 圖卡
- `v2_stabilization.css`：主要 V2 視覺及 responsive 修正
- `bulk_cards_layout_v2.css`：改善圖下載區排版
- `vendor_xlsx.full.min.js`：瀏覽器 Excel 解析

### Backend

- Cloudflare Worker 處理 same-origin `/api/bni` 的 login、history、publish、replace 及 logout。
- D1 `report_batches` 保存月份批次。
- D1 `member_scores` 保存每位會員每月分數及 raw metrics。
- session token 只以 SHA-256 hash 保存於 D1。
- 原始 Excel 只在瀏覽器解析，不會傳送或儲存於 Cloudflare；LT 必須另行保留原檔。

## 3. Data Contract

每個會員紀錄至少需要：

- `member_name`
- `total_score`
- `light`
- `training_score`
- `absence_score`
- `lateness_score`
- `one_to_one_score`
- `referral_score`
- `biz_give_score`
- `visitor_score`
- `raw_metrics`

Backend 會拒絕七項得分合計不等於 `total_score` 的發布。

`raw_metrics` 必須保留原始數據，Green Path 才可計算具體行動量。

## 4. Authentication

- 會員及 LT 使用不同共用密碼。
- Worker 使用 secrets 驗證會員及 LT 密碼。
- 登入成功後發出限時 session token，D1 只保存 token hash。
- 登出會在伺服器端即時刪除 session token。
- 權限判斷必須由 backend session 驗證，不可只依靠前端隱藏按鈕。

## 5. Non-negotiable Product Rules

1. Excel 是正式分數唯一來源。
2. 個人綠燈門檻是 70 分。
3. 75% 是分會綠燈會員比例目標。
4. Green Path 不可改寫正式分數。
5. 已滿分項目不可再建議加分。
6. 出席及準時不可承諾單次行動會加分。
7. 畫面顯示的 selected actions 必須完整等於 projected score 所計行動。
8. 批量改善圖預設排除綠燈。

## 6. Release Process

每次 production code 更新：

1. 由 feature branch 更新相關 module。
2. 更新 `v2.html` cache-bust version。
3. 完成 CI、Cloudflare staging deployment 及 acceptance。
4. Merge 到 `main`，由 GitHub Actions 部署 Cloudflare production。
5. 核對 production 根網址、`/health`、JS／CSS version 及 D1 資料。
6. 完成 [QA_CHECKLIST.md](QA_CHECKLIST.md) 對應項目。
7. 更新文件及 Decision Log。

## 7. Known Technical Debt

### 目前可用但建議日後改善

- Production 仍由 `v2.html` 動態讀取 `index.html` 再注入 V2 modules。這個穩定層解決了上線問題，下一次大型改版應整理為單一清晰入口及正式 module imports。
- 暫未有 Playwright／Cypress 自動 browser regression tests。
- 登入使用 chapter-level 共用密碼，而非每人帳戶。
- 前端仍為單頁原生 JavaScript，隨功能增加會提高 regression 風險。
- 目前主要依靠 manual release QA。

### 建議下一次大型改版完成

1. 將 loader／overlay 架構整合成正式 modular app。
2. 將官方 Excel fixture 去識別化後加入自動 parser tests。
3. 加入完整自動 browser regression tests。
4. 評估 custom domain。
5. 評估 individual login 或 Google Workspace access。

## 8. Incident Triage

### 登入失敗

- 檢查 `/api/bni` POST
- 檢查 Cloudflare `/health`、Worker logs 及 D1 status
- 檢查 session expiry
- 不要在公開訊息要求使用者提供密碼

### Excel 發布失敗

- 核對正式分數欄
- 核對七項合計
- 核對月份
- 核對 duplicate period／replace flag
- 查看 Cloudflare Worker error logs

### PNG／ZIP 失敗

- 確認 `drawMemberCardV2` 已載入
- 確認 canvas 可產生 Blob
- 確認瀏覽器沒有封鎖下載
- ZIP 使用內置 dependency-free generator，不需要 JSZip 檔案

### 手機版溢出

- 檢查 fixed width／min-width
- table 應使用橫向 scroll
- control group 在手機應轉單欄

## 9. Ownership 建議

- Product owner：確認計分、建議及會員溝通邏輯
- LT data owner：每月 Excel 及發布
- Second checker：發布後抽查
- Technical maintainer：code、GitHub Actions、Cloudflare Workers、D1、incident

角色可以由同一人兼任，production 發布仍建議最少有第二位 LT 覆核。
