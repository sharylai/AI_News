# 範例資料匯入指南

本目錄包含 3 個 CSV 範例檔，對應 Google Sheets 的 3 個分頁。所有 `date` 欄位都是今天 (2026-05-28)，匯入後立刻可在 [index.html](../index.html) 看到完整渲染效果。

## 匯入步驟

### 1. 建立 Google Sheet
- 前往 https://sheets.google.com → 新增空白試算表
- 命名為 `ai_news_db`

### 2. 建立 3 個分頁
分頁名稱必須完全一致（程式碼依此抓取）：
- `news`
- `shary_voice`
- `pipeline_log`

### 3. 逐一匯入 CSV
對每個分頁：
1. 切換到該分頁
2. 檔案 → 匯入 → 上傳 → 選對應 CSV
3. 匯入位置選「**取代目前的工作表**」
4. 分隔符號選「**逗號**」
5. 「**將文字轉換為數字、日期和公式**」打勾

### 4. 設定公開讀取
- 右上「共用」按鈕 → 一般存取權 → 改為「**知道連結的任何人**」→ 權限「**檢視者**」

### 5. 取得 SHEET_ID
從網址擷取，格式如下：
```
https://docs.google.com/spreadsheets/d/【這一段就是 SHEET_ID】/edit
```

### 6. 填入 index.html
編輯 [index.html](../index.html) 第 209 行附近：
```javascript
const SHEET_ID = '貼上你的 SHEET_ID';
```

### 7. 在瀏覽器開啟 index.html
直接 double-click 開檔，或用 Live Server 之類的工具預覽，應該會看到：
- 3 則「今日三大戰情點」（Runway Gen-5 / 美妝虛擬代言人 / 歐盟 AI Act）
- 5 則「工具 & 案例快報」
- 1 則「今日實戰教學」（角色一致性 Prompt）
- Shary 觀點（黑底引言區塊）
- 8 條原文連結庫

## 欄位定義（對照 AI_News_plan.md Part 2）

### news 分頁（16 欄）
| 欄位 | 型別 | 範例 |
|------|------|------|
| id | string | n_20260528_001 |
| date | YYYY-MM-DD | 2026-05-28 |
| category | enum | 工具 / 案例 / 教學 / 情報 |
| title | string | Runway Gen-5 公開測試開放 |
| score | float | 4.65 |
| credibility | A/B/C/D | A |
| one_line | string | 新增 15 秒連續鏡頭與角色一致性鎖定 |
| key_takeaway | string | ≤100 字 |
| actionable | string | 今日可執行行動 |
| audience | string | 逗號分隔 |
| tags | string | 逗號分隔 |
| company | string | Runway |
| source_url | URL | https://... |
| is_top | boolean | true / false |
| published_at | ISO datetime | 2026-05-27T22:15:00Z |
| created_at | ISO datetime | 2026-05-28T06:12:33Z |

### shary_voice 分頁（3 欄）
date / content / created_at

### pipeline_log 分頁（7 欄）
run_at / status / fetched / accepted / published / error / cost_usd
