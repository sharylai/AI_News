# 《AI News》系統開發規劃書 v2.0（簡化版）

> 本文件取代原 `AI_News.req.md`，作為實際開發藍圖。
> **核心需求**：每天 08:00 收到 AI News，以 Web 呈現，資料庫放 Google Sheets。

---

## Part 1. 系統概覽

### 1.1 一句話描述
每天清晨 06:00，Google Apps Script 自動抓取 AI 影音新聞 → 呼叫 Claude API 過濾+評分+撰寫 → 寫入 Google Sheets → 08:00 前完成；使用者直接訪問 GitHub Pages 網站閱讀，網站即時從 Sheets 讀取資料。

### 1.2 架構圖

```
┌──────────────────────────────────────────────────────────────────────┐
│                     06:00 每日自動 Pipeline                          │
│                  (Google Apps Script 時間觸發器)                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  RSS 抓取        ┐                                                   │
│  Tavily API 檢索 ├─► 去重 ─► Claude Haiku 過濾 ─► Claude Sonnet 評分  │
│  Reddit / X      ┘                                  +分類+摘要+行動  │
│                                                            │         │
│                                                            ▼         │
│                                                  Claude Opus 寫     │
│                                                  Shary 觀點          │
│                                                            │         │
│                                                            ▼         │
│                                              ┌──────────────────┐    │
│                                              │ Google Sheets    │    │
│                                              │  (news_db)       │    │
│                                              └──────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
                                                            │
                                          (公開讀取 JSON 端點)
                                                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│              GitHub Pages（靜態 SPA，免費託管）                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐                 │
│  │ 今日首頁   │  │ 歷史封存   │  │ 搜尋 / 標籤過濾│                 │
│  └────────────┘  └────────────┘  └────────────────┘                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.3 技術堆疊（全免費或近零成本）

| 角色 | 技術 | 月成本 |
|------|------|-------|
| 排程器 | Google Apps Script 時間觸發器 | $0 |
| 資料庫 | Google Sheets | $0 |
| 後端邏輯 | Google Apps Script (JS) | $0 |
| 資料抓取 | Tavily API（Free tier）+ RSS | $0-30 |
| LLM | Claude API（Haiku/Sonnet/Opus 分工） | ~$45 |
| Embedding（去重） | OpenAI text-embedding-3-small | ~$2 |
| 前端框架 | Vanilla JS + Alpine.js（無 build） | $0 |
| 前端託管 | GitHub Pages | $0 |
| **合計** | | **~$47-77/月** |

> 比原 n8n + LINE + SendGrid 方案省一半，且維運複雜度大幅降低。

---

## Part 2. 資料庫設計（Google Sheets）

建立一個 Google Sheets，命名 `ai_news_db`，內含 **3 個分頁**：

### 2.1 分頁 `news`（每則新聞一列）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | string | UUID，主鍵 |
| `date` | YYYY-MM-DD | 推送日期 |
| `category` | enum | 工具 / 案例 / 教學 / 情報 |
| `title` | string | 台灣繁體中文標題（≤30 字） |
| `score` | float | 綜合評分（見 Part 4） |
| `credibility` | A/B/C/D | 可信度 |
| `one_line` | string | 一句話摘要（≤30 字） |
| `key_takeaway` | string | 核心影響（≤100 字） |
| `actionable` | string | 今日可執行行動 |
| `audience` | string | 目標族群，逗號分隔 |
| `tags` | string | 工具/品牌標籤，逗號分隔（用於搜尋） |
| `company` | string | 主要公司（用於多樣性保護） |
| `source_url` | string | 原文 URL |
| `is_top` | boolean | 是否為當日 Top 3 戰情點 |
| `published_at` | ISO datetime | 原文發佈時間 |
| `created_at` | ISO datetime | 寫入時間 |

### 2.2 分頁 `shary_voice`（每日一段 Shary 觀點）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `date` | YYYY-MM-DD | 主鍵 |
| `content` | string | 100-150 字觀點 |
| `created_at` | ISO datetime | 寫入時間 |

### 2.3 分頁 `pipeline_log`（運作紀錄，用於除錯）

| 欄位 | 說明 |
|------|------|
| `run_at` | 執行時間 |
| `status` | success / partial / fail |
| `fetched` | 抓到幾則原始資料 |
| `accepted` | 通過 Filter 幾則 |
| `published` | 最終寫入幾則 |
| `error` | 錯誤訊息（若有） |
| `cost_usd` | 估算的 API 成本 |

### 2.4 Sheet 公開讀取設定
- 檔案 → 共用 → 「知道連結的任何人皆可檢視」
- 用 GViz JSON 端點讀取（無需 API Key）：
  ```
  https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=news
  ```

---

## Part 3. Pipeline 流程（Google Apps Script）

### 3.1 觸發器設定
- Apps Script 編輯器 → 觸發條件 → 新增
- 來源：時間驅動 → 每日計時器 → 上午 5-6 點
- 函式：`runDailyPipeline()`

### 3.2 主流程（pseudo-code）

```javascript
function runDailyPipeline() {
  const startTime = new Date();
  let status = { fetched: 0, accepted: 0, published: 0, cost: 0 };

  try {
    // Step 1: 抓取
    const raw = [
      ...fetchRSS(RSS_SOURCES),        // 官方 Blog
      ...fetchTavily(KEYWORDS),         // Tavily API
      ...fetchReddit(SUBREDDITS)        // Reddit JSON API
    ];
    status.fetched = raw.length;

    // Step 2: 去重（URL + title embedding 相似度）
    const deduped = dedupe(raw);

    // Step 3: Claude Haiku 批次過濾（ACCEPT/REJECT）
    const filtered = filterByClaude(deduped, 'haiku-4.5');

    // Step 4: Claude Sonnet 分類 + 評分 + 摘要
    const enriched = enrichByClaude(filtered, 'sonnet-4.6');
    status.accepted = enriched.length;

    // Step 5: 排序、QC Gate、多樣性保護
    const ranked = rankAndFilter(enriched);  // 取 Top 8-10
    status.published = ranked.length;

    // Step 6: Claude Opus 生成 Shary 觀點
    const sharyVoice = generateSharyVoice(ranked.slice(0, 5), 'opus-4.7');

    // Step 7: 寫入 Sheets
    writeToNewsSheet(ranked);
    writeToSharyVoiceSheet(sharyVoice);

    logPipeline({ status, success: true, startTime });
  } catch (err) {
    logPipeline({ status, success: false, error: err.message, startTime });
    sendErrorEmail(err);  // 寄錯誤通知到你的 Gmail
  }
}
```

### 3.3 時間預算
- 預計總執行時間：8-15 分鐘
- Apps Script 單次執行上限：30 分鐘（足夠）
- 06:00 開始 → 06:15 前完成 → 08:00 使用者開站時資料已就緒

### 3.4 錯誤處理
- 任何步驟失敗 → Catch → 寫 `pipeline_log` + 寄信通知
- 若當日 0 筆通過過濾 → 寫入 `pipeline_log` warning，網站顯示「今日無重大情報」
- API quota 超限 → 自動 fallback 到備用模型

---

## Part 4. 評分與過濾邏輯（沿用 v1 但補完）

### 4.1 評分公式

$$\text{Score} = (F \times 0.25) + (S \times 0.25) + (U \times 0.20) + (T \times 0.20) + (R \times 0.10)$$

| 指標 | 5 分判準 | 1 分判準 |
|------|---------|---------|
| **F** Freshness | ≤24h | >120h |
| **S** Social Buzz | X likes+RT ≥1k | 無社群跡象 |
| **U** Utility | 有公開 API+免費試用 | 純理論討論 |
| **T** Transformability | 可立刻寫成 Prompt 教學 | 無法轉化 |
| **R** Relevance | 100% 影音生成 | <2 直接 REJECT |

### 4.2 過濾閾值
- Score ≥ 4.0 → 「今日必推」（`is_top = true`）
- 3.0 ≤ Score < 4.0 → 進今日列表
- 2.0 ≤ Score < 3.0 → 進 Sheet 但不顯示在首頁
- Score < 2.0 → 直接丟棄

### 4.3 可信度分級

| 級別 | 條件 | 處理 |
|------|------|------|
| **A** | 官方公告 / 主流媒體 / 有 GitHub Repo | 直接發佈 |
| **B** | 二手媒體 + ≥2 source 交叉確認 | 直接發佈 |
| **C** | 單一 X / Reddit 爆料但有 Demo 截圖 | 寫入但網站標「待確認」標籤 |
| **D** | 純猜測 / 釣魚標題 | 丟棄 |

### 4.4 QC Gate
- 若當日 Score ≥3 的條目 > 20 → 提高閾值到 3.3
- 同一公司 7 日內最多上 Top 3 三次
- 跨日（最近 14 天）標題 embedding 相似度 > 0.85 → 視為重複丟棄

---

## Part 5. Prompt 設計（取代原規格書 6.1 / 6.2）

### 5.1 模組一：過濾 + 分類 + 評分（Claude Sonnet 4.6）

````markdown
# Role
你是資深 AI 影音產業情報分析師與數據科學家，專精於全球「AI 生成影音 (Generative Video)」領域。

# Task
請評估、過濾並結構化解析傳入的原始新聞與社群文本。

# Constraints
1. 嚴格過濾：若內容與「AI 影片、AI 虛擬人、AI 配音、AI 動畫、影音剪輯自動化」無直接關係（例如：單純 LLM 評測、晶片硬體、通用財報、機器人、純文字 Agent），請輸出 [REJECT] 並跳過。
2. 在地化語言（台灣繁體）：
   - 使用「影片」非「视频」
   - 使用「提示詞 / 指令」非「提示語」
   - 使用「最佳化 / 優化」非「优化」
   - 使用「上線」非「上线」、「服務」非「服务」、「資料」非「数据」
3. 嚴禁幻覺：摘要必須完全基於輸入文本，不可捏造功能、價格或數據。
4. 不確定時用「據官方說法」「報導指出」等避責語句。

# Few-shot
ACCEPT 範例：
- "Runway 推出 Gen-4 模型，支援多角色一致性與 4K 輸出" → ACCEPT
- "HeyGen 發佈 Interactive Avatar API" → ACCEPT
- "歐盟對 Deepfake 影片強制標註" → ACCEPT

REJECT 範例：
- "OpenAI GPT-5 在 MMLU 取得新高分" → REJECT（純 LLM 評測）
- "NVIDIA Q4 財報營收成長 40%" → REJECT（硬體財報）
- "Anthropic Computer Use 功能上線" → REJECT（非影音範疇）

# Output JSON Schema
{
  "id": "{自動生成 UUID}",
  "source_url": "原文 URL",
  "credibility": "A|B|C|D",
  "title": "≤30 字台灣繁中標題",
  "category": "工具|案例|教學|情報",
  "metrics": { "F": 5, "S": 4, "U": 5, "T": 4, "R": 5 },
  "score": 4.35,
  "one_line": "≤30 字一句話摘要",
  "key_takeaway": "≤100 字核心影響",
  "audience": ["創作者", "行銷人", "HR", "企業決策者"],
  "tags": ["Runway", "Gen-4", "影片生成"],
  "company": "Runway",
  "actionable": "今日可執行的具體行動",
  "published_at": "ISO datetime"
}
````

### 5.2 模組二：Shary 觀點（Claude Opus 4.7）

````markdown
# Role
你是「影音創客」創辦人 Shary 的 AI 策略思維複製體。

# Voice
- 專業權威但接地氣，像有遠見的學長/姐分享洞察
- 商業敏感度高：從一個「小工具更新」看穿「大產業趨勢」
- 適合台灣企業主、HR、數位轉型主管與高階創作者
- **禁用詞**：「未來已來」「科技改變世界」「賦能」「賽道」「閉環」「彎道超車」「視頻」
- 偶帶微幽默，但不耍嘴皮；點到痛點就收

# Input
今日 Top 5 戰情：[插入 JSON]

# Task
撰寫 100-150 字 Shary 觀點，聚焦：
1. 企業如何將技術應用於「內容內製化」或「數位教材轉型」
2. 創作者如何調整工作流，讓工具加值而非淘汰自己

# Output
純文字，無 Markdown 標題，不收尾於問句。

# Self-check
- 字數 100-150？
- 避開所有禁用詞？
- 含具體企業/創作者行動指引？
````

---

## Part 6. 資料來源清單

### 6.1 RSS（A 級，每日全量抓）
- OpenAI Blog、Anthropic News、Google DeepMind Blog
- Runway Research、Pika Labs Blog、Stability AI News
- ElevenLabs Blog、HeyGen Blog、Synthesia Blog
- TechCrunch (AI tag)、The Verge AI、VentureBeat AI

### 6.2 Tavily API 關鍵字檢索（過去 24h）
- 英文：`AI video generation`、`text-to-video`、`AI avatar`、`AI voice clone`、`generative video model`
- 中文：`AI 影片生成`、`虛擬人`、`AI 配音`、`Sora`、`Runway`

### 6.3 Reddit JSON API（公開、免認證）
- `r/StableDiffusion`、`r/aivideo`、`r/runwayml`、`r/singularity`、`r/midjourney`
- 取每個 sub 過去 24h 內 score > 50 的貼文

### 6.4 X / Twitter
> 初期不接（API 收費 + 內容雜訊高）。Phase 2 評估是否導入。

---

## Part 7. Web 前端設計

### 7.1 頁面結構

```
ai-news.github.io/
├── index.html        # 首頁 = 今日 AI News（自動讀今日資料）
├── archive.html      # 歷史封存（依日期瀏覽）
├── search.html       # 搜尋 / 標籤過濾
└── assets/
    ├── app.js        # Alpine.js + GViz fetch 邏輯
    └── style.css     # TailwindCSS via CDN
```

### 7.2 首頁版面（index.html）

```
┌──────────────────────────────────────────────────────┐
│  AI News｜每日 8 點，AI 影音趨勢雷達       2026/05/29 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  🚀 今日三大戰情點                                    │
│  ┌──────────────────────────────────────────────┐    │
│  │ 【工具】Runway Gen-5 上線                      │    │
│  │ 一秒看懂：支援 10 秒連續鏡頭                   │    │
│  │ 為什麼重要：縮短分鏡製作時程 60%               │    │
│  │ 今日行動：前往 Runway 試用新模型 →             │    │
│  └──────────────────────────────────────────────┘    │
│  [...另外 2 張卡片]                                   │
│                                                       │
│  🛠️ 工具 & 案例快報（Top 5）                          │
│  [可摺疊卡片列表，依 score 排序]                       │
│                                                       │
│  💡 今日實戰教學                                      │
│  [若有相關項目顯示，無則隱藏]                          │
│                                                       │
│  ✍️ Shary 觀點                                       │
│  「[100-150 字觀點]」                                  │
│                                                       │
│  🔗 今日完整連結庫                                    │
│  [所有原文 URL 列表]                                  │
│                                                       │
└──────────────────────────────────────────────────────┘
        [回到頂部] [歷史封存] [搜尋]
```

### 7.3 前端實作策略
- **無 build**：Alpine.js + Tailwind CDN，純靜態 HTML
- **資料來源**：直接 fetch GViz JSON 端點，前端解析
- **快取**：localStorage 存當日資料，避免重複請求
- **搜尋**：Fuse.js（client-side fuzzy search），<2000 筆完全夠用
- **RWD**：手機優先，斷點 sm/md/lg

### 7.4 程式碼骨架（index.html 核心）

```html
<div x-data="newsApp()" x-init="loadToday()">
  <h1 x-text="todayDate"></h1>

  <section>
    <h2>🚀 今日三大戰情點</h2>
    <template x-for="item in topThree">
      <article>
        <h3 x-text="`【${item.category}】${item.title}`"></h3>
        <p>一秒看懂：<span x-text="item.one_line"></span></p>
        <p>為什麼重要：<span x-text="item.key_takeaway"></span></p>
        <p>今日行動：<span x-text="item.actionable"></span></p>
        <a :href="item.source_url" target="_blank">原文 →</a>
      </article>
    </template>
  </section>

  <section>
    <h2>✍️ Shary 觀點</h2>
    <blockquote x-text="sharyVoice"></blockquote>
  </section>
</div>

<script>
function newsApp() {
  return {
    todayDate: new Date().toISOString().slice(0, 10),
    items: [],
    sharyVoice: '',
    get topThree() {
      return this.items.filter(i => i.is_top).slice(0, 3);
    },
    async loadToday() {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=news`;
      const resp = await fetch(url);
      const text = await resp.text();
      const json = JSON.parse(text.match(/\((.*)\);?$/s)[1]);
      this.items = parseGviz(json).filter(i => i.date === this.todayDate);
      // 載入 Shary 觀點...
    }
  };
}
</script>
```

---

## Part 8. 14 天開發計畫

### Phase 1：核心管線（Day 1-7）

| Day | 任務 | 驗收標準 |
|-----|------|---------|
| 1 | 建立 Google Sheet `ai_news_db`，設定 3 個分頁與欄位 | Sheet 可手動寫入測試資料 |
| 2 | 申請 Tavily API Key、Anthropic API Key、OpenAI API Key（embedding 用） | 三組 Key 可呼叫 |
| 3 | Apps Script 專案初始化，寫 `fetchRSS()` + `fetchTavily()` | 可印出原始資料 |
| 4 | 實作 `dedupe()` + `filterByClaude(Haiku)` | 篩出 AI 影音相關項目 |
| 5 | 實作 `enrichByClaude(Sonnet)` 含完整 JSON 解析 | 可寫入結構化欄位 |
| 6 | 實作 `rankAndFilter()` + 多樣性保護 | 取出 Top 8-10 |
| 7 | 實作 `generateSharyVoice(Opus)` + 寫 Sheets + 設時間觸發器 | 06:00 自動跑完整流程 |

### Phase 2：Web 前端（Day 8-12）

| Day | 任務 |
|-----|------|
| 8 | GitHub Repo 建立，GitHub Pages 啟用，static index.html 骨架 |
| 9 | Alpine.js 接 GViz JSON，今日資料正確渲染 |
| 10 | archive.html 歷史頁，依日期下拉切換 |
| 11 | search.html 搜尋頁，Fuse.js fuzzy search + 標籤過濾 |
| 12 | Tailwind 視覺優化、RWD 手機版調整 |

### Phase 3：穩定性（Day 13-14）

| Day | 任務 |
|-----|------|
| 13 | 錯誤通知 Email、`pipeline_log` 視覺化、API 成本累計 |
| 14 | 全鏈路壓測，連續 3 天觀察是否穩定，調整 Prompt |

**Day 15+**：正式上線，每週抽檢 5 則內容品質。

---

## Part 9. 風險與緩解

| 風險 | 緩解 |
|------|------|
| Apps Script 執行時間 >30 分鐘 | 拆兩個觸發器（抓取 06:00 / 處理 06:30） |
| Sheets 讀取速度慢（>1000 列後） | 每月將舊資料封存到第二份 Sheet |
| GViz JSON 公開端點被濫用 | 加 Cloudflare Worker 中介（Phase 2） |
| Claude API 帳單失控 | 設定每日支出上限 alert（Anthropic Console） |
| LLM 幻覺造成錯誤情報 | C/D 級不直接顯示為 Top；每週抽檢 5 則 |
| RSS 來源網站改版斷掉 | 多源備援；`pipeline_log` 顯示 fetched < 5 時告警 |
| 版權問題 | 摘要 ≤150 字、必附原文連結、不重製圖片 |

---

## Part 10. 成本估算（月）

| 項目 | 用量 | USD/月 |
|------|------|-------|
| Claude Haiku 4.5（Filter） | 200 則/日 × 30 天 ≈ 6M token | $5 |
| Claude Sonnet 4.6（主處理） | 50 則/日 × 30 天 ≈ 4.5M token | $25 |
| Claude Opus 4.7（Shary） | 1 次/日 × 30 天 ≈ 300k token | $15 |
| OpenAI Embedding | 200 次/日 × 30 天 | $2 |
| Tavily API | Free tier（1000 req/月）or Pro | $0-30 |
| Google Apps Script | Free quota 內 | $0 |
| Google Sheets | Free | $0 |
| GitHub Pages | Free | $0 |
| **合計** | | **~$47-77** |

**啟用 Prompt Caching 後**：可降至 ~$35-55/月。

---

## Part 11. 下一步行動 Checklist

立刻可做：
- [ ] **Step 1**：建立 Google Sheets `ai_news_db`，貼上 Part 2 的欄位定義
- [ ] **Step 2**：申請 3 組 API Key
  - Anthropic Console（`claude-sonnet-4-6`、`claude-haiku-4-5`、`claude-opus-4-7`）
  - Tavily API（free tier 先試）
  - OpenAI（只用 embedding）
- [ ] **Step 3**：建 GitHub Repo `ai-news`，開啟 GitHub Pages
- [ ] **Step 4**：照 Part 8 Day 1-3 任務開工

若要我接著做：
1. 產出 Google Sheets 完整欄位 + 範例資料的 CSV 樣板
2. 寫第一版 Apps Script 程式碼（`runDailyPipeline` 完整實作）
3. 寫第一版 `index.html` 含 Alpine.js 接 GViz

任選其一告訴我即可。
