# 🚦 BNI 紅黃綠燈計算平台 · Bingo

每月處理 BNI Member Traffic Light 報表:**覆核 → 分析 → 生成升燈 recap + 會員圖卡**,一 run 搞掂。

## 🔗 網址(可分享俾其他 LT)

**LT 工具**:https://carriehw.github.io/bni-traffic-light/

> 開個網址就用得,唔使安裝。上傳月報 Excel,全程喺你部機/瀏覽器處理,**數據唔會上傳去任何伺服器**。

## 🔒 私隱

**全程喺你部機／瀏覽器本機運算,Excel 唔會上傳去任何伺服器。** 呢個 repo 只放**工具程式碼**,唔含任何會員數據(`samples/`、`*.xlsx` 已被 `.gitignore` 排除)。

## 用法

**方法 A(線上)**:開 GitHub Pages 網址 → 拖入當月 Excel。數據仍然只喺你瀏覽器本機處理。

**方法 B(單一檔案,離線)**:下載 [`bni-traffic-light-standalone.html`](bni-traffic-light-standalone.html) 一個檔案,double-click 就用,可離線、可 send 俾其他 LT。

## 功能

- **全會 Dashboard** — 綠/黃/紅/黑分佈、達標進度、排名
- **覆核** — 由原始數據重算對比官方分(捉入機/公式錯)、跨月對比、**簽核記錄批核人+時間**
- **會員** — 燈號、雷達圖、**升到綠燈最平路線**、一鍵 copy recap、**下載會員圖卡 PNG**(連上月對比箭嘴)
- **批量 Recap** — 一次過生成全部會員 recap + 圖卡

## 會員版(自含檔案分享)

LT 工具【① 上傳】頁底「生成會員版(可分享)」→ 下載一個**自含 HTML**(數據內嵌,唔含生意額,密碼選填)→ send 俾會員。會員開檔揀自己名就睇到燈號/雷達圖/升燈貼士。唔使每月 git、唔使後端。步驟見 [WORKFLOW.md](WORKFLOW.md)。

## 計分邏輯

見 [SCORING.md](SCORING.md)(已用真實月報核對 100% 準確)。五大元素滿分 100,燈號:綠 ≥70 / 黃 50–70 / 紅 30–50 / 黑 <30。

## 檔案

| 檔 | 用途 |
|---|---|
| `index.html` | 主工具(引用 `vendor_xlsx.full.min.js`) |
| `bni-traffic-light-standalone.html` | 單一檔案版(SheetJS 已內嵌,離線用) |
| `build-standalone.py` | 由 index.html 產生單一檔案版 |
| `SCORING.md` / `WORKFLOW.md` | 計分邏輯 / 每月 SOP |

---
免責:非投資／非官方工具,計分依 BNI HK 公開規則,僅供分會內部參考。
