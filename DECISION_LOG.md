# BNI BINGO 紅黃綠燈平台 — Decision Log

## D-001：Excel 是正式分數唯一來源

**日期：** 2026-07-22

網站不可用自行計算結果覆蓋 LT 上載的 Excel 正式分數。網站只會在發布前檢查七項合計，並使用 raw metrics 產生改善建議。

## D-002：個人綠燈門檻是 70 分

**日期：** 2026-07-23

個人 Green Path 以 70 分為目標。「75% 綠燈」只代表分會整體綠燈會員比例，不是個人 75 分安全線。

## D-003：Green Path 必須 goal-oriented

**日期：** 2026-07-23

系統不再只列每項下一級 +5 分。它必須先計算距離 70 分的差額，再選出足以到達綠燈的完整行動組合。

## D-004：建議按會員表現分類

**日期：** 2026-07-23

會員頁及圖卡分為：綠燈行動建議、其他加分方法、已達滿分、需留意。已滿分項目不再出現在加分建議。

## D-005：出席及準時只作提醒

**日期：** 2026-07-23

由於出席及準時按六個月 rolling data 計算，平台不可承諾單次出席或準時會增加固定分數。

## D-006：完整顯示所有 selected actions

**日期：** 2026-07-23

所有被計入 projected score 的 Green Path 行動必須完整顯示。不可只顯示 Top 3 而在總分計算更多隱藏行動。

## D-007：支援 legacy raw metric aliases

**日期：** 2026-07-23

1-2-1 原始欄位支援 `1-2-1`、`121`、`一對一`、`one_to_one`、`one to one`、`O`。Biz Give 亦支援 `biz_give` 等格式。

## D-008：正式分數欄必須明確鎖定

**日期：** 2026-07-23

上載程式不可用模糊欄名先讀到 `T培訓`、`G引薦` 等原始次數。正式分數必須鎖定 Excel／得分／score 欄位；raw row 另行保存。

## D-009：七項合計不一致時禁止發布

**日期：** 2026-07-23

前端檢查與 backend contract 保持一致。任何會員七項正式得分合計不等於 Excel 總分，發布按鈕必須鎖住。

## D-010：批量 ZIP 不依賴缺失的外部 JSZip

**日期：** 2026-07-23

原來的 `vendor_jszip.min.js` 未部署，導致批量下載停在 0。現改用內置 dependency-free ZIP generator。

## D-011：改善圖預設排除綠燈

**日期：** 2026-07-23

LT 日常派發以需要改善會員為主，因此 ZIP 預設下載黃燈、紅燈及黑燈。保留全部會員、只黃燈、紅黑篩選。

## D-012：Production 根網址必須直接可用

**日期：** 2026-07-23

團隊只需使用 `https://bni-traffic-light.bingo-win.workers.dev/`，不應依賴 `/v2.html` 或 release query parameter。

## D-013：短期保留 V2 stabilization layer

**日期：** 2026-07-23

為快速穩定 production，V2 loader 會在核心頁注入模組及 CSS。下一次大型 V3 應整合成單一正式 modular app。

## D-014：文件與 QA 是交付的一部分

**日期：** 2026-07-23

每次功能更新不只提交程式，亦需要更新相關 MD、cache-bust version、production verification 及 regression checklist。

## D-015：長頁面提供浮動返回最頂控制

**日期：** 2026-07-23

捲動超過 600px 後顯示右下角浮動「最頂」按鈕；返回頂部後自動隱藏。控制支援鍵盤、ARIA、safe-area 及 reduced-motion。

## D-016：所有未滿分主動項目必須有交代

**日期：** 2026-07-23

培訓、1-2-1、引薦、生意額及嘉賓只要未滿分，就必須出現在「本方案」、「其他加分方法」或「資料需核對」其中一區。1-2-1 不可因排序或圖卡空間而靜默消失。

## D-017：數據不一致時停止預測

**日期：** 2026-07-23

以下任何情況都會停止顯示 projected score 及改善方案：

- 七項正式分數合計不等於 Excel 總分
- raw metric 參考分數不等於 Excel 正式分數
- action gain 不等於 target score 減 current score
- selected gains 總和不等於 projected score 增幅

網頁及 PNG 均只顯示「資料需核對」。

## D-018：建議排序以實際可行性優先

**日期：** 2026-07-23

舊排序過度偏好較少項目，可能建議一次增加大量嘉賓。新排序使用加權行動量、超出70分幅度、項目數量及單項難度。培訓與1-2-1每次權重1、引薦1.25、嘉賓2、Biz Give每HK$10,000權重1。權重只影響推薦次序，不影響正式分數。

## D-019：核心邏輯必須有固定回歸測試

**日期：** 2026-07-23

建立 `tests/green_path_logic.test.js`，固定測試 Carrie、Danielle、Eric、Cheeno、嘉賓分級及總分不一致案例。核心logic修改需通過測試，避免再次漏掉1-2-1或寫錯加分幅度。


## D-020：Cloudflare Workers + D1 成為正式 production

**日期：** 2026-07-24

正式根網址改為 `https://bni-traffic-light.bingo-win.workers.dev/`。`main` 為 production source，由 GitHub Actions 部署到 Cloudflare。原始 Excel 只在瀏覽器解析，不上載至 Cloudflare；LT 必須另行保留原檔。Supabase 保留 read-only 七日作回復保障。
