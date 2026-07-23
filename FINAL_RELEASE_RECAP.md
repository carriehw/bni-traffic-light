# BNI BINGO 紅黃綠燈平台 — Final Release Recap

## Production URL

<https://bni-traffic-light-eta.vercel.app/>

團隊請只使用以上正式根網址。

## Project Status

**Status：Production Ready**

平台已完成會員使用流程、LT 每月資料流程、個人化 Green Path、PNG／ZIP 圖卡、月份歷史及 responsive stabilization。

## Member Features

- 會員共用密碼登入
- 搜尋會員姓名
- 最新燈號及 Excel 正式分數
- 月份表現變化
- 個人化綠燈行動建議
- 其他加分方法
- 已達滿分項目
- 出席／準時 rolling reminder
- 個人 PNG 分享圖下載

## LT Features

- LT 專用登入
- Excel 上載及工作表辨認
- 正式分數欄鎖定
- raw metrics 保存
- 必要欄位、重複會員、七項合計及月份檢查
- 發布新月份
- 加入歷史月份
- 取代相同月份
- 月份紀錄
- 會員月份趨勢
- 核對 CSV
- 批量改善圖 ZIP

## Improvement Card Download

預設只下載：

- 黃燈
- 紅燈
- 黑燈

可切換：

- 全部會員
- 只下載黃燈
- 紅燈及黑燈

按鈕會顯示符合條件的實際會員數。

## Scoring Principles

- Excel 是正式分數唯一來源。
- 綠燈門檻是 70 分。
- 75% 是分會綠燈會員比例目標，不是個人分數目標。
- Green Path 只用 raw metrics 計算行動，不修改正式分數。
- 已滿分項目不會出現在加分建議。
- 出席及準時只作六個月 rolling reminder。
- 所有計入預計總分的行動均完整顯示。

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
- `skills/data-driven-performance-platform/SKILL.md`

## Recommended Monthly Routine

1. LT 上載原始 Traffic Excel。
2. 核對欄位、月份、會員數及七項合計。
3. 下載核對 CSV。
4. 正式發布。
5. 抽查至少 3 位會員。
6. 測試個人 PNG。
7. 下載黃燈或以下 ZIP，抽查至少 2 張圖。
8. 再向會員發布平台或改善圖。

## Team Share Message

> 🚦 BNI BINGO 紅黃綠燈平台正式上線
>
> 正式網址：<https://bni-traffic-light-eta.vercel.app/>
>
> 會員登入後可搜尋姓名，查看最新燈號、Excel 正式分數、月份變化及個人化綠燈行動建議，亦可下載個人分享圖。
>
> LT 後台可上載每月 Traffic Excel、核對及發布資料，並批量下載黃燈、紅燈及黑燈會員改善圖。
>
> 正式分數以 LT 上載的 Excel 為準；行動建議只作改善方向，實際下月結果以新 Excel 為準。
>
> 會員密碼及 LT 密碼會由負責人分開提供，LT 密碼請勿公開轉發。
