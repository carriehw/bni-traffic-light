# 🚦 BNI BINGO 紅黃綠燈平台

BNI BINGO 會員表現及綠燈行動平台。會員可查看最新燈號、Excel 正式分數、月份變化及個人化改善路徑；LT 可核對及發布每月 Traffic Excel、查看歷史紀錄，以及批量下載會員改善圖卡。

## 正式網址

- Production：<https://bni-traffic-light-eta.vercel.app/>
- Repository：<https://github.com/carriehw/bni-traffic-light>

> 團隊請只分享 Production 網址，不需要使用 `/v2.html` 或任何測試參數。

## 核心原則

1. **Excel 是正式分數唯一來源。** 網站不自行覆蓋或重算官方分數。
2. **綠燈門檻是 70 分。** 分會「75% 綠燈」是整體會員比例目標，不是個人 75 分目標。
3. **Green Path Engine 只用原始數據計算行動建議。** 建議不會改寫 Excel 分數。
4. **建議以會員表現為本。** 已滿分項目列作優勢；未滿分項目才會成為綠燈行動或備選方法。
5. **出席及準時屬六個月滾動紀錄。** 平台只作提醒，不承諾「出席一次／準時一次即可加分」。

## 主要功能

### 會員平台

- 共用會員密碼登入
- 搜尋會員姓名
- 查看最新月份燈號及七項 Excel 正式分數
- 查看月份表現變化
- 查看「綠燈行動建議／其他加分方法／已達滿分／需留意」
- 下載個人 PNG 分享圖

### LT 管理

- 使用獨立 LT 密碼登入
- 上載及核對 Traffic Excel
- 鎖定讀取 Excel 正式分數欄及保留原始數據
- 檢查缺少欄位、重複會員、月份及七項合計
- 發布最新月份、加入歷史月份或取代相同月份
- 查看月份紀錄及會員趨勢
- 批量下載圖卡 ZIP
- 預設只下載黃燈、紅燈及黑燈會員；亦可選全部、只黃燈、紅燈及黑燈

## 文件索引

- [TEAM_HANDOVER.md](TEAM_HANDOVER.md)：團隊使用及分享說明
- [WORKFLOW.md](WORKFLOW.md)：每月 LT 操作及開發發布流程
- [SCORING.md](SCORING.md)：正式計分及 Green Path Engine 邏輯
- [QA_CHECKLIST.md](QA_CHECKLIST.md)：每月資料及版本發布驗收清單
- [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md)：架構、權限、維護及技術債
- [DECISION_LOG.md](DECISION_LOG.md)：重要產品及技術決策
- [LESSONS_LEARNED.md](LESSONS_LEARNED.md)：今次項目復盤及下一個類似項目做法
- [skills/data-driven-performance-platform/SKILL.md](skills/data-driven-performance-platform/SKILL.md)：供 AI／開發者重複使用的工作技能

## 技術架構

- Frontend：靜態 HTML、CSS、JavaScript，部署於 Vercel
- Excel 解析：瀏覽器內使用 SheetJS
- API：Vercel same-origin proxy `/api/bni`
- Backend：Supabase Edge Function
- Database：Supabase Postgres
- Original files：Supabase Private Storage
- Authentication：會員及 LT 共用密碼換取限時 session token

## 資料安全

- 密碼只保存雜湊，不寫入 GitHub 或文件。
- Supabase service role key 不會暴露於瀏覽器。
- Excel Storage 為 private。
- LT 密碼只應私下交予獲授權管理員。
- 本平台供 BINGO Chapter 內部使用，並非 BNI 官方產品。

## Production 狀態

2026-07-23 已完成會員平台、LT 上載發布、歷史紀錄、個人化 Green Path、PNG 分享圖、篩選式批量 ZIP 及手機版穩定化。重大改動前必須完成 [QA_CHECKLIST.md](QA_CHECKLIST.md)。
