# 🚦 BNI BINGO 紅黃綠燈計算平台

手機及桌面均可使用的會員表現平台。會員以共用密碼登入，搜尋姓名後查看最新燈號、分項得分、每月升跌、75 分安全線建議及可複製 WhatsApp recap。LT 以管理員密碼登入，上傳及發布最新 Excel。

## 正式網址

- Vercel：<https://bni-traffic-light-eta.vercel.app/>
- GitHub Pages：<https://carriehw.github.io/bni-traffic-light/>

## 每月工作流程

1. LT 收到最新 Member Traffic Light Excel。
2. 在「LT 後台」選擇檔案。
3. 平台讀取 Traffic Light Report、重新核對七個分項總和及會員數量。
4. 平台以最新已發布月份作比較，顯示本月／上月分數與燈號升跌。
5. LT 查看預覽後按「正式發布」。
6. 原始 Excel 儲存到 Supabase 私密 Storage；結構化分數保留於歷史資料庫。
7. 會員重新整理頁面即可查看新月份，並可一鍵複製個人化 recap。

## 權限與資料安全

- 會員：共用密碼，可查看全會已發布成績。
- LT：另一組管理員密碼，可上傳及發布報告。
- 瀏覽器只保存限時 session token；密碼及 Supabase service role key 不會寫入 GitHub。
- 所有公開資料表已啟用 RLS，客戶端不能直接讀寫資料庫。
- Excel bucket 為 private，檔案不會出現在公開 repository。

## 計分與燈號

七個分項滿分 100：缺席 15、遲到 10、引薦 20、嘉賓 20、1-2-1 10、培訓 10、生意 15。燈號為綠 ≥70、黃 50–69、紅 30–49、黑 <30；平台以 75 分作安全建議目標。

詳細公式見 [SCORING.md](SCORING.md)，每月 SOP 見 [WORKFLOW.md](WORKFLOW.md)。

## 技術架構

靜態 HTML/JavaScript 前台 + Supabase Postgres、Private Storage 及 Edge Function。vendor_xlsx.full.min.js 只在 LT 瀏覽器內解析 Excel；API 會再次驗證分項總和才發布。

> 本工具供 BINGO Chapter 內部使用，並非 BNI 官方產品。
