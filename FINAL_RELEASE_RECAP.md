# BNI BINGO 紅黃綠燈平台 — Final Release Recap

## Production URL

<https://bni-traffic-light-eta.vercel.app/>

團隊請只使用以上正式根網址。

## Project Status

**Status：Production Ready — strict logic release**

平台已完成會員流程、LT 每月資料流程、個人化 Green Path、PNG／ZIP 圖卡、月份歷史、手機版穩定化及浮動返回最頂功能。

## Member Features

- 會員共用密碼登入
- 搜尋會員姓名
- 最新燈號及 Excel 正式分數
- 月份表現變化
- 個人化綠燈行動建議
- 所有其他已驗證加分方法
- 已達滿分項目
- 出席／準時 rolling reminder
- 個人 PNG 分享圖下載
- 長頁面浮動「最頂」按鈕

## LT Features

- LT 專用登入
- Excel 上載及工作表辨認
- 正式分數欄鎖定及 raw metrics 保存
- 必要欄位、重複會員、七項合計及月份檢查
- 發布新月份、加入歷史月份、取代相同月份
- 月份紀錄及會員月份趨勢
- 核對 CSV
- 批量改善圖 ZIP

## Improvement Card Download

預設只下載黃燈、紅燈及黑燈會員。亦可選擇全部會員、只下載黃燈、或紅燈及黑燈。按鈕會顯示符合條件的實際會員數。

## Strict Green Path Logic

- Excel 是正式分數唯一來源。
- 綠燈門檻是 70 分。
- 75% 是分會整體綠燈會員比例目標，不是個人分數目標。
- Green Path 只用 raw metrics 計算行動，不修改正式分數。
- 1-2-1 未滿分時，必須出現在本方案、其他方法或資料需核對其中一區。
- 所有未滿分主動項目都必須有交代，不能因排序或圖卡空間而消失。
- 每項 gain 必須等於目標分減目前正式分。
- selected actions 加分總和必須等於 projected score 增幅。
- 七項合計或 raw data 不一致時，網頁及 PNG 均停止顯示預計分數，只提示 LT 核對。
- 建議排序以實際所需行動量及難度為先，避免一次要求大量嘉賓或大額 Biz Give。

## Logic Regression Tests

固定測試包括：

- Carrie：65→70
- Danielle：1-2-1 5／10，再做4次可 +5
- Eric：用多個接近門檻的小步驟達70，而非一次帶14位嘉賓
- Cheeno：低分方案必須交代1-2-1
- 嘉賓10→15只可 +5
- 七項合計40、Excel總分50時必須 blocked

測試檔：`tests/green_path_logic.test.js`

## Data and Security

- 會員及 LT 使用不同密碼。
- 密碼及 service role key 不寫入 GitHub。
- API 透過 same-origin Vercel proxy。
- Supabase Edge Function 驗證權限及發布資料。
- 原始 Excel 保存於 private Storage。

## Documentation Delivered

- `README.md`
- `TEAM_HANDOVER.md`
- `WORKFLOW.md`
- `SCORING.md`
- `QA_CHECKLIST.md`
- `PROJECT_HANDOFF.md`
- `DECISION_LOG.md`
- `LESSONS_LEARNED.md`
- `FINAL_RELEASE_RECAP.md`
- `skills/data-driven-performance-platform/SKILL.md`
- `tests/green_path_logic.test.js`

## Recommended Monthly Routine

1. LT 上載原始 Traffic Excel。
2. 核對欄位、月份、會員數及七項合計。
3. 下載核對 CSV。
4. 正式發布。
5. 抽查至少3位會員，包括1位1-2-1未滿分會員。
6. 確認所有未滿分項目都有出現在建議、備選或資料核對。
7. 測試個人 PNG。
8. 下載黃燈或以下 ZIP，抽查至少2張圖。
9. 再向會員發布平台或改善圖。

## Team Share Message

> 🚦 BNI BINGO 紅黃綠燈平台正式上線
>
> 正式網址：<https://bni-traffic-light-eta.vercel.app/>
>
> 會員登入後可搜尋姓名，查看最新燈號、Excel 正式分數、月份變化及個人化綠燈行動建議，亦可下載個人分享圖。
>
> LT 後台可上載每月 Traffic Excel、核對及發布資料，並批量下載黃燈、紅燈及黑燈會員改善圖。
>
> 正式分數以 LT 上載的 Excel 為準。平台會按照會員目前表現計算達到70分的行動方案；所有未滿分項目都會清楚列作本方案、其他方法或資料需核對。資料不一致時，平台會停止顯示預計分數，避免提供誤導建議。
>
> 會員密碼及 LT 密碼會由負責人分開提供，LT 密碼請勿公開轉發。
