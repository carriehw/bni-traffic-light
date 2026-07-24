# BNI BINGO 紅黃綠燈平台 — QA Checklist

## A. 每月 Excel 發布驗收

### 檔案及欄位

- [ ] 使用原始 Traffic Excel
- [ ] 檔案／內容月份正確
- [ ] 平台讀到會員姓名
- [ ] 平台讀到 Excel 總分
- [ ] 七項正式分數欄全部讀到
- [ ] 原始 G、V、1-2-1、T、Biz Give 數據存在
- [ ] 無重複會員姓名
- [ ] 七項得分合計等於 Excel 總分

### 預覽及發布

- [ ] 工作表選擇正確
- [ ] 發布月份正確
- [ ] 會員數與 Excel 一致
- [ ] 新月份／歷史月份／相同月份模式正確
- [ ] 已下載核對 CSV
- [ ] 發布成功訊息顯示正確月份及會員數

### 發布後抽查

- [ ] 最新月份紀錄正確
- [ ] 隨機抽查至少 3 位會員
- [ ] 綠燈會員總分及燈號正確
- [ ] 黃／紅／黑會員總分及燈號正確
- [ ] 1-2-1 已滿分會員列入「已達滿分」
- [ ] 1-2-1 未滿分會員可產生相應改善選項
- [ ] 已滿分項目沒有出現在加分建議
- [ ] Green Path selected actions 加分合計等於 projected score 增幅
- [ ] 所有計入 projected score 的行動均完整顯示
- [ ] 其他加分方法標明未計入預計總分
- [ ] 出席及準時只作 rolling reminder

### 圖卡及下載

- [ ] 個人 PNG 可下載及開啟
- [ ] PNG 姓名、燈號、正式分數正確
- [ ] PNG 文字無重疊／截斷
- [ ] 「黃燈或以下」預設人數正確
- [ ] ZIP 可完成製作及下載
- [ ] ZIP 可正常解壓
- [ ] ZIP 內至少抽查 2 張 PNG
- [ ] 切換「全部會員／只黃燈／紅黑」後人數正確

## B. Production Release Smoke Test

### Deployment

- [ ] Production 根網址可開啟
- [ ] 根網址載入最新 cache-bust version
- [ ] 不需要 `/v2.html` 才能使用
- [ ] 沒有 404 的 JS／CSS／vendor file
- [ ] Cloudflare API `/api/bni` 接受 POST
- [ ] Cloudflare `/health` 回傳 `ok: true`，D1 資料可讀取

### Authentication

- [ ] 會員登入成功
- [ ] LT 登入成功
- [ ] 錯誤密碼顯示清楚訊息
- [ ] 顯示／隱藏密碼只有一個控制
- [ ] 登出成功
- [ ] 過期 session 有合理提示
- [ ] 會員看不到 LT 管理功能

### Member Platform

- [ ] 最新月份正確
- [ ] KPI 燈號分布正確
- [ ] 搜尋會員正常
- [ ] 會員詳情正常
- [ ] 月份紀錄正常
- [ ] Green Path Engine 正常
- [ ] 個人 PNG 正常

### LT Platform

- [ ] Upload Wizard 可用
- [ ] Valid Excel 可預覽
- [ ] 缺欄 Excel 被阻擋
- [ ] 重複會員被阻擋
- [ ] 七項合計不一致被阻擋
- [ ] 相同月份顯示 Replace 提示
- [ ] 月份紀錄正常
- [ ] 會員趨勢選擇器正常
- [ ] 批量下載篩選正常

### Responsive UI

在至少以下尺寸檢查：

- [ ] iPhone／手機約 390px 寬
- [ ] Tablet 約 768px 寬
- [ ] Desktop 1366px 或以上

檢查：

- [ ] 無整頁水平溢出
- [ ] Header 不遮內容
- [ ] LT 卡片寬度一致
- [ ] Table 可獨立橫向 scroll
- [ ] 按鈕不超出卡片
- [ ] 改善圖下載工具 desktop 緊湊、mobile 單欄

## C. Regression Matrix

每次改動最少勾選受影響範圍：

| 改動類型 | 必測範圍 |
|---|---|
| 計分／Green Path | 會員詳情、PNG、ZIP、1-2-1、projected score |
| Excel parser | Upload、preview、CSV、publish、replace、raw metrics |
| UI／CSS | 手機、desktop、login、member、LT |
| Auth／API | member login、admin login、history、publish、logout |
| PNG renderer | 個別 PNG、低分多行動會員、長姓名、ZIP |
| ZIP filter | 各範圍人數、ZIP filename、解壓及內容 |

## D. Release Record Template

```text
Release version:
Date/time:
Changed files:
Change summary:
Data impact: Yes / No
Auth impact: Yes / No
Mobile checked: Yes / No
Member login: Pass / Fail
LT login: Pass / Fail
PNG: Pass / Fail
ZIP: Pass / Fail
Upload preview: Pass / Fail
Publish/replace tested: Pass / Not tested
Known limitations:
Checked by:
```
