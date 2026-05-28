# AI News｜每日 8 點，AI 影音趨勢雷達

每天清晨 06:00，Google Apps Script 自動抓取 AI 影音相關新聞（RSS / Tavily / Reddit），經 Claude API 三層處理（Haiku 過濾、Sonnet 評分摘要、Opus 寫觀點），寫入 Google Sheets。網站從 Sheets 即時讀取，8 點開站就看到當日內容。

**線上版本**：https://sharylai.github.io/AI_News/（GitHub Pages 啟用後生效）

## 系統架構

```
┌─────────────┐    06:00 觸發    ┌──────────────────┐    GViz JSON    ┌──────────────────┐
│ Apps Script │ ──────────────► │ Google Sheets    │ ──────────────► │  GitHub Pages    │
│  Pipeline   │  自動抓取+寫入   │ news / shary     │   即時讀取       │ index/archive/   │
└─────────────┘                  └──────────────────┘                 │ search.html      │
                                                                       └──────────────────┘
```

## 專案結構

```
AI_News/
├── index.html              首頁（今日內容）
├── archive.html            歷史封存（日期切換）
├── search.html             搜尋（fuzzy + 過濾）
├── assets/
│   └── common.js           三頁共用：SHEET_ID、fetchSheet、parseGviz
├── apps_script/            Google Apps Script Pipeline（7 個 .gs 檔）
│   ├── Config.gs           常數、來源清單
│   ├── Fetchers.gs         RSS / Tavily / Reddit 抓取
│   ├── LLM.gs              Claude API 統一介面
│   ├── Pipeline.gs         去重、過濾、評分、排名、QC
│   ├── Shary.gs            Opus 生成觀點
│   ├── Sheets.gs           寫入 Google Sheets
│   ├── Main.gs             主流程 + 觸發器設定
│   └── README.md           安裝指引
├── sample_data/            CSV 範例與匯入指引
├── AI_News.req.md          原始產品規格書
└── AI_News_plan.md         完整工程規劃書（含成本估算、14 天計畫）
```

## 快速開始

### 前端（純靜態，已可即時使用）
1. Clone 此 repo
2. 編輯 `assets/common.js`，把 `SHEET_ID` 改成你自己的 Google Sheets ID
3. 開 `index.html`（或推到 GitHub Pages）即可使用

### 後端 Pipeline
照 [apps_script/README.md](apps_script/README.md) 7 個步驟設定，預估 30 分鐘可上線每日自動推送。

## 技術堆疊

- **前端**：Vanilla JS + Alpine.js + Tailwind CDN（無 build）
- **資料庫**：Google Sheets（透過 GViz JSON 公開讀取）
- **後端**：Google Apps Script（排程 + 抓取 + LLM 呼叫）
- **LLM**：Claude API（Haiku 過濾 / Sonnet 評分 / Opus 寫觀點）
- **搜尋**：Fuse.js（client-side fuzzy search）
- **託管**：GitHub Pages（免費、零維運）

## 成本

預估月成本 ~$47-77 USD，啟用 Prompt Caching 可降至 ~$35-55。詳見 [AI_News_plan.md](AI_News_plan.md) Part 10。

## License

私人專案。
