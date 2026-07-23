# BNI BINGO 紅黃綠燈平台 — Lessons Learned

## 1. 最重要的產品學習

### 先定義「正式結果」與「建議結果」

今次最重要的界線是：

- Excel 分數是正式結果
- Green Path 是行動建議

如果一開始沒有寫清楚，系統很容易把「重算」和「改善模擬」混在一起，降低團隊信任。

### 推薦系統應該 goal-oriented，不是 threshold-oriented

只告訴會員「再做多少可以 +5 分」不足以解決問題。真正需要回答的是：

> 根據目前表現，完成哪些行動可以到達綠燈？

### 個人化不是加 AI 文案

真正的個人化來自：

- 排除已滿分項目
- 使用會員 raw metrics
- 計算所有可達分級
- 找出完整達標組合
- 清楚分開 selected actions 與 alternatives

## 2. 最重要的資料學習

### Excel 欄位名稱不能靠模糊猜測

同一份 Traffic Excel 可能同時有原始數據欄及正式得分欄。只用 `includes('培訓')` 會讀錯。

未來同類平台必須先建立：

- 欄位資料字典
- 官方分數欄 mapping
- raw metrics mapping
- aliases
- required／optional columns
- validation fixtures

### 前端檢查要與 backend contract 完全一致

今次一度出現：

- 前端只警告七項合計不一致
- backend 直接拒絕發布

結果是 LT 到最後一步才知道失敗。未來應由同一份 schema／validation rules 驅動前後端。

### Legacy aliases 必須記錄

舊資料使用 `one_to_one`，新解析可能使用 `1-2-1`。沒有 aliases 時，畫面看似正常，建議引擎卻漏項。

## 3. 最重要的工程學習

### 不要「修 A 壞 B」

連續在同一頁追加 patch 容易造成：

- 重複密碼按鈕
- 會員分享圖消失
- loader／入口不一致
- 桌面及手機樣式互相覆蓋

未來做法：

1. 先列 regression matrix
2. 把邏輯拆成單一責任 module
3. 每次修改後跑受影響及核心功能測試
4. 重大修改使用 preview／branch

### 外部 dependency 必須驗證真正部署

批量 ZIP 原本依賴不存在的 `vendor_jszip.min.js`。程式碼引用不代表 production 有檔案。

每個 dependency 都要檢查：

- repo 是否存在
- production 是否 200
- 載入順序
- browser compatibility
- fallback

### Production verification 不能只看 commit 成功

GitHub commit 成功不代表 Vercel 已部署。每次發布要：

- fetch 正式根網址
- 確認 cache-bust version
- fetch 修改後檔案
- 核對 production 內容

### 手機版要從最窄場景開始設計

LT 後台最初出現「上寬下窄」及要自行縮頁，原因是 container、grid、table、button 有不同最小寬度。

同類後台應預設：

- `min-width: 0`
- 單一 container system
- table 自己 scroll，不令整頁 scroll
- controls 在手機轉單欄
- 下載／上載按鈕滿寬

## 4. QA 學習

### 「程式存在」不等於「功能完成」

Upload Wizard 曾經有四步 UI，實際只讀到檔案行數。驗收必須測真實 user journey，而不是看畫面或 function 名稱。

### 不可以把未實測項目寫成 Pass

Browser file picker、正式發布、ZIP 解壓等需要真人或 browser automation。未能執行時要標明「未測」，不能以 code review 代替 end-to-end test。

### 邊界會員比一般會員更重要

必測樣本：

- 綠燈會員
- 65 分只差 5 分
- 60 分差 10 分
- 黑燈，需要四至五項行動
- 1-2-1 已滿分
- 1-2-1 未滿分
- 長姓名
- 缺 raw metric

## 5. 下一個類似項目的高效做法

### Phase 0：一頁 Product Contract

開發前先確定：

- 使用者角色
- source of truth
- 正式結果與模擬結果的界線
- 核心 user journeys
- 權限
- success metrics
- 不做事項

### Phase 1：Data Contract First

先取得真實 Excel／CSV，建立：

- column dictionary
- score rules
- aliases
- 5–10 個 test fixtures
- expected output

在寫 UI 前先證明 parser 及計分可以重現官方結果。

### Phase 2：Design the workflow before screens

先畫：

1. Login
2. Upload
3. Validate
4. Preview
5. Publish
6. Verify
7. Distribute

每一步都要有成功、警告、錯誤及返回路徑。

### Phase 3：One source of logic

- 一個 scoring module
- 一個 recommendation module
- 一個 validation schema
- PNG／web／ZIP 共用同一份 member plan

不要在不同畫面各自複製計算。

### Phase 4：Build regression tests early

最低限度：

- parser tests
- scoring tests
- Green Path combination tests
- upload validation tests
- browser smoke tests
- mobile screenshots

### Phase 5：Release with docs

Definition of Done 應包括：

- 功能
- production verification
- QA record
- README／workflow／decision update
- team handover message

## 6. 建議的效率提升

### 立即可做

- 每月固定使用 QA Checklist
- 保存一份 anonymized test Excel
- 每次錯誤建立 issue，而非只在 chat 記錄
- 使用 feature branch 處理 P0／P1 改動
- 每次 release 寫一行 release record

### 下一階段可做

- 建立 Playwright smoke tests
- 將 V2 overlays 合併為 modular V3
- 建立 staging environment
- 建立 schema-driven Excel parser
- 建立個別會員帳戶或 Workspace login

## 7. 一句總結

下一個類似項目要快，不是少做文件或少做測試；而是**更早固定資料契約、共用邏輯、驗收標準及 release workflow**，減少後期反覆修正。
