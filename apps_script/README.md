# Apps Script Pipeline 安裝指引

這份指引帶你把 `apps_script/` 裡的 7 個檔案部署到 Google Apps Script，從零到每天 06:00 自動跑完整 Pipeline。

預估時間：**30 分鐘**

---

## 前置作業：申請 API Key

| Key | 申請位置 | 月費（預估用量） |
|-----|---------|----------------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | ~$45 |
| `TAVILY_API_KEY` | https://app.tavily.com/home | Free tier 即可 |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | ~$2（只用 embedding） |

也建議準備一個 Gmail 收錯誤通知（`NOTIFY_EMAIL`），可用你自己的 Google 帳號 email。

---

## Step 1：建立 Apps Script 專案

1. 開啟你的 Google Sheet：
   https://docs.google.com/spreadsheets/d/1_EiUhQ-nSOtFaLzEiQcMu-eBFb9P0504VUsw_-5boI8/edit

2. 上方選單：**擴充功能 → Apps Script**

3. 開啟後是空白專案，左側只有一個 `Code.gs`。先把它刪掉（右鍵 → 刪除）。

---

## Step 2：貼入 7 個檔案

對每個 `.gs` 檔案：
1. 左側「檔案」旁的「+」按鈕 → **指令碼**
2. 命名（不含 `.gs` 副檔名）：`Config`、`Fetchers`、`LLM`、`Pipeline`、`Shary`、`Sheets`、`Main`
3. 把對應 `apps_script/{name}.gs` 的全部內容貼到右側編輯區
4. **Ctrl/Cmd + S** 存檔

完成後左側檔案列表應該有 7 個 .gs 檔。

---

## Step 3：設定 Script Properties（API Keys）

1. 編輯器左側：**齒輪圖示「專案設定」**
2. 滾到最下方 **「指令碼屬性」**
3. 點「新增指令碼屬性」逐一加入：

| 屬性 | 值 |
|------|-----|
| `ANTHROPIC_API_KEY` | sk-ant-... |
| `TAVILY_API_KEY` | tvly-... |
| `OPENAI_API_KEY` | sk-... |
| `NOTIFY_EMAIL` | your@gmail.com |

4. 按 **儲存指令碼屬性**

> ⚠️ 不要把 key 直接寫進 Config.gs，公開了會被盜用。

---

## Step 4：時區設定

1. 左側齒輪「專案設定」
2. **時區** → 選 `(GMT+08:00) Taipei`
3. 儲存

---

## Step 5：第一次手動測試

1. 回到編輯器，打開 `Main.gs`
2. 上方函式下拉選單 → 選 `testRunPipeline`
3. 按 **執行**（▶ icon）
4. 第一次會跳出授權對話框：
   - 選你的 Google 帳號
   - 「進階」→「前往 [專案名稱]（不安全）」
   - 「允許」（這是因為 Google 對未驗證的 Apps Script 都會跳警告，不影響你個人帳號的安全性）
5. 等 1-3 分鐘，看下方執行記錄

### 預期看到
```
Fetched: 50-150
Sample: {...}
Deduped: 30-100
Filtered: 5-30
Enriched sample: { score: 3.x, ... }
```

### 常見錯誤排查

| 錯誤訊息 | 原因 | 解法 |
|---------|------|------|
| `Script Property "..." 尚未設定` | API Key 沒設或拼錯 | 回 Step 3 檢查 |
| `Tavily HTTP 401` | Tavily Key 錯 | 確認 key 開頭是 `tvly-` |
| `Claude API 401` | Anthropic Key 錯 | 確認 key 開頭是 `sk-ant-` |
| `Sheet「news」不存在` | Sheet 分頁名稱拼錯 | Sheet 左下角分頁名要完全等於 `news` `shary_voice` `pipeline_log` |
| `RSS HTTP 404` | 某 RSS 來源網址改了 | 編輯 Config.gs RSS_SOURCES 移除或更新 |

---

## Step 6：執行完整 Pipeline（會寫入 Sheet）

確認 `testRunPipeline` 跑得通後：

1. 函式下拉選 `runDailyPipeline`
2. 按 **執行**
3. 等 8-15 分鐘
4. 完成後回到 Google Sheet 檢查：
   - `news` 分頁：應有今日 5-10 列
   - `shary_voice` 分頁：應有今日一列
   - `pipeline_log` 分頁：應有一筆 `success`

5. 開啟 `index.html`（在 Preview 或瀏覽器）→ 重新整理 → 看到今天真實抓到的新聞 🎉

---

## Step 7：設定每日 06:00 自動觸發

1. 函式下拉選 `setupDailyTrigger`
2. 按 **執行**
3. 完成後左側「觸發條件」圖示（時鐘 ⏰）會看到一筆每天 06:00 的觸發

### 驗證觸發器
- 函式下拉選 `listTriggers` → 執行 → 下方記錄顯示 `runDailyPipeline | CLOCK | ...`

---

## 日常維運

### 看執行記錄
- Apps Script 編輯器左側「執行記錄」圖示，可看每次跑的 console.log 與錯誤

### 改 Prompt / 參數
- 直接編輯對應的 .gs 檔，存檔即生效，下次 06:00 自動套用

### 暫停每日推送
- 函式下拉選 `clearAllTriggers` → 執行

### 重新啟用
- 函式下拉選 `setupDailyTrigger` → 執行

---

## 檔案責任表

| 檔案 | 行數 | 責任 |
|------|------|------|
| `Config.gs` | ~100 | 所有常數、來源清單、Script Property 讀取 |
| `Fetchers.gs` | ~150 | RSS / Tavily / Reddit 三種來源抓取 |
| `LLM.gs` | ~130 | Claude API 統一介面、JSON 解析、Embedding |
| `Pipeline.gs` | ~220 | 去重、過濾、評分、排名、QC、多樣性 |
| `Shary.gs` | ~80 | Opus 生成 Shary 觀點、字數/禁用詞自檢 |
| `Sheets.gs` | ~150 | 寫入 news/shary/log 三個分頁、歷史讀取 |
| `Main.gs` | ~150 | `runDailyPipeline`、觸發器設定、手動測試 |

---

## 與 index.html 的銜接

Pipeline 寫入 Sheet 後，index.html 透過 GViz JSON 端點即時讀取。**不需要任何額外部署**——只要 Sheet 有資料、index.html 已設定正確 SHEET_ID，每天 08:00 開站就會看到當日內容。

---

## 下一步（規劃書 Part 7-8）

- [ ] archive.html（歷史日期切換）
- [ ] search.html（Fuse.js fuzzy search + 標籤過濾）
- [ ] GitHub Pages 部署（push index/archive/search.html → 開啟 Pages）
