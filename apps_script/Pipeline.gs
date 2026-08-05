/**
 * Pipeline.gs — 處理層
 *
 * 流程：dedupe → filter (Haiku) → enrich (Sonnet) → rank → QC + 多樣性
 */

// ===========================================================
// Step 1: 去重
// ===========================================================

/**
 * URL 規範化 + 標題 embedding 相似度去重
 */
function dedupe(items) {
  const seenUrls = new Set();
  const kept = [];
  const embeddings = [];

  for (const item of items) {
    // 1. URL 去重
    const normUrl = normalizeUrl(item.source_url);
    if (seenUrls.has(normUrl)) continue;

    // 2. 標題 embedding 去重（同批內）
    let isDup = false;
    let emb;
    try {
      emb = embedText(item.title);
    } catch (e) {
      // embedding 失敗就跳過此項相似度檢查
      kept.push(item);
      seenUrls.add(normUrl);
      continue;
    }

    for (const prev of embeddings) {
      if (cosineSim(emb, prev) > CONFIG.DEDUP_SIMILARITY_THRESHOLD) {
        isDup = true;
        break;
      }
    }

    if (!isDup) {
      seenUrls.add(normUrl);
      embeddings.push(emb);
      item._embedding = emb;          // 後續排名 + 跨日比對也用得到
      kept.push(item);
    }
  }

  console.log(`Dedupe: ${items.length} → ${kept.length}`);
  return kept;
}

function normalizeUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    // 移除 utm_*、ref 等追蹤參數
    const params = new URLSearchParams(u.search);
    [...params.keys()].forEach(k => {
      if (k.startsWith('utm_') || k === 'ref' || k === 'source') params.delete(k);
    });
    return `${u.host}${u.pathname}${params.toString() ? '?' + params : ''}`.toLowerCase();
  } catch (e) {
    return url.toLowerCase();
  }
}

// ===========================================================
// Step 2: Claude Haiku 過濾（ACCEPT / REJECT）
// ===========================================================

const FILTER_SYSTEM_PROMPT = `# Role
你是資深 AI 影音產業情報分析師，專精於全球「AI 生成影音 (Generative Video)」領域。

# Task
對於每一則新聞，判斷是否屬於「AI 影片 / AI 虛擬人 / AI 配音 / AI 動畫 / 影音剪輯自動化」範疇。

# Reject Criteria
若符合以下任一，輸出 REJECT：
- 純 LLM 評測（如 GPT 在 MMLU 得分）
- 晶片硬體財報
- 機器人 Robotics
- 純文字 Agent（如 Computer Use、Coding Agent）
- 與影音生態無關的通用科技新聞

# Accept Criteria
任何涉及影片、影像、虛擬人、聲音生成、剪輯自動化、相關合規/版權議題 → ACCEPT。

# Output
對每則新聞回應 ACCEPT 或 REJECT，不加解釋。輸出純 JSON 陣列：
[{"i": 0, "verdict": "ACCEPT"}, {"i": 1, "verdict": "REJECT"}, ...]`;

function filterByClaude(items) {
  if (items.length === 0) return [];

  const BATCH_SIZE = 20;
  const accepted = [];
  let totalCost = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const userMsg = batch.map((item, idx) =>
      `[${idx}] 標題：${item.title}\n摘要：${(item.content || '').slice(0, 300)}`
    ).join('\n\n---\n\n');

    try {
      const result = callClaudeJson(
        CONFIG.CLAUDE_MODELS.HAIKU,
        FILTER_SYSTEM_PROMPT,
        userMsg,
        { useCache: true, maxTokens: 1500, temperature: 0 }
      );
      totalCost += estimateCost(result.usage, CONFIG.CLAUDE_MODELS.HAIKU);

      result.data.forEach(v => {
        if (v.verdict === 'ACCEPT' && batch[v.i]) accepted.push(batch[v.i]);
      });
    } catch (e) {
      console.warn(`Filter batch ${i} failed: ${e.message}. Pass through all.`);
      accepted.push(...batch);          // 失敗時保守通過，留待 enrich 再次過濾
    }

    Utilities.sleep(500);
  }

  console.log(`Filter: ${items.length} → ${accepted.length} (cost $${totalCost.toFixed(3)})`);
  return accepted;
}

// ===========================================================
// Step 3: Claude Sonnet 評分 + 分類 + 摘要
// ===========================================================

const ENRICH_SYSTEM_PROMPT = `# Role
你是資深 AI 影音產業情報分析師與數據科學家。

# Task
為傳入的新聞做台灣繁中結構化解析，包含分類、評分、摘要、行動建議。

# Constraints
1. 在地化語言（台灣繁體）：
   - 使用「影片」非「视频」
   - 使用「提示詞 / 指令」非「提示語」
   - 使用「最佳化 / 優化」非「优化」
   - 使用「上線」非「上线」、「服務」非「服务」、「資料」非「数据」
2. 嚴禁幻覺：摘要必須基於輸入文本，不可捏造功能、價格、數據。
3. 不確定時用「據官方說法」「報導指出」避責。

# Evaluation Metrics (1-5)
- F (Freshness):     ≤24h=5、24-48h=4、48-72h=3、72-120h=2、>120h=1
- S (Social Buzz):   X likes+RT≥1k=5、500-1k=4、100-500=3、<100=2、無=1
- U (Utility):       有公開 API+免費試用=5、Web Demo=4、Waitlist=3、論文=2、理論=1
- T (Transformability): 可立刻寫教學=5、可拆工作流=4、可作社群選題=3、僅背景=2、無=1
- R (Relevance):     100% 影音=5、單模=4、含影音多模 LLM=3、邊緣=2、<2 應 REJECT

Score = F*0.25 + S*0.25 + U*0.20 + T*0.20 + R*0.10

# Output JSON Schema
{
  "source_url": "原文 URL",
  "credibility": "A|B|C|D",
  "title": "≤30 字台灣繁中標題",
  "category": "工具|案例|教學|情報",
  "metrics": { "F": 5, "S": 4, "U": 5, "T": 4, "R": 5 },
  "score": 4.35,
  "one_line": "≤30 字一句話摘要",
  "key_takeaway": "≤100 字核心影響",
  "audience": "創作者,行銷人,HR,企業決策者",
  "tags": "標籤,逗號分隔",
  "company": "主要公司名",
  "actionable": "今日可執行的具體行動",
  "published_at": "ISO datetime"
}`;

function enrichByClaude(items) {
  if (items.length === 0) return [];

  // 成本保險：Haiku 篩完若仍過多，只送前 N 則給 Sonnet 評分
  // （含社群熱度的優先，其次依抓取順序）
  if (CONFIG.MAX_ENRICH_ITEMS && items.length > CONFIG.MAX_ENRICH_ITEMS) {
    items = items.slice().sort((a, b) => {
      const sa = (a.social_metrics && a.social_metrics.score) || 0;
      const sb = (b.social_metrics && b.social_metrics.score) || 0;
      return sb - sa;
    }).slice(0, CONFIG.MAX_ENRICH_ITEMS);
    console.log(`評分上限：取前 ${CONFIG.MAX_ENRICH_ITEMS} 則送 Sonnet`);
  }

  const enriched = [];
  let totalCost = 0;

  // 一次一則（Sonnet 評分需要完整 context）
  for (const item of items) {
    const userMsg = `來源類型：${item.source_type}
原文 URL：${item.source_url}
發佈時間：${item.published_at}
社群指標：${JSON.stringify(item.social_metrics || {})}

標題：${item.title}
內文：
${(item.content || '').slice(0, 1500)}`;

    try {
      const result = callClaudeJson(
        CONFIG.CLAUDE_MODELS.SONNET,
        ENRICH_SYSTEM_PROMPT,
        userMsg,
        { useCache: true, maxTokens: 1500, temperature: 0.2 }
      );
      totalCost += estimateCost(result.usage, CONFIG.CLAUDE_MODELS.SONNET);

      const obj = result.data;
      if (obj && typeof obj.score === 'number') {
        obj.id = generateId(obj.published_at || item.published_at);
        obj.source_url = obj.source_url || item.source_url;
        obj._embedding = item._embedding;
        obj.is_top = false;          // 後續 Ranker 決定
        enriched.push(obj);
      }
    } catch (e) {
      console.warn(`Enrich failed for ${item.title.slice(0, 40)}: ${e.message}`);
    }

    Utilities.sleep(300);
  }

  console.log(`Enrich: ${items.length} → ${enriched.length} (cost $${totalCost.toFixed(3)})`);
  return enriched;
}

/**
 * 來源網域驗證：source_url 的網域是否與宣稱的公司相符
 * 例如 company=Runway，source_url 應該是 runwayml.com（或主流媒體報導）
 */
function sourceMatchesCompany(item) {
  if (!item.company || !item.source_url) return false;
  let host = '';
  try { host = new URL(item.source_url).host.toLowerCase().replace(/^www\./, ''); }
  catch (e) { return false; }

  // 公司官方網域對照表（可在 Config.gs 擴充）
  const map = CONFIG.COMPANY_DOMAINS || {};
  const company = item.company.trim();
  const officialDomain = map[company];

  // 1. 命中官方網域 → 通過
  if (officialDomain && host.indexOf(officialDomain) !== -1) return true;

  // 2. 來自可信主流媒體 → 通過（二手報導也算可信）
  const trustedMedia = CONFIG.TRUSTED_MEDIA_DOMAINS || [];
  if (trustedMedia.some(d => host.indexOf(d) !== -1)) return true;

  // 3. 公司名稱（去空格小寫）出現在網域中 → 通過（寬鬆比對）
  const companyKey = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (companyKey.length >= 4 && host.replace(/[^a-z0-9]/g, '').indexOf(companyKey) !== -1) return true;

  return false;
}

function generateId(publishedAt) {
  const date = publishedAt ? publishedAt.slice(0, 10).replace(/-/g, '') : Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMdd');
  const rand = Utilities.getUuid().slice(0, 6);
  return `n_${date}_${rand}`;
}

// ===========================================================
// Step 4: Ranker + QC Gate + 多樣性保護
// ===========================================================

function rankAndFilter(enriched, recentHistory) {
  // recentHistory = 最近 14 天已推送的新聞（用於跨日去重和公司頻率檢查）
  recentHistory = recentHistory || [];

  // ===== 真實性防線（authenticity-first）=====
  // 0a. 來源網域驗證：宣稱某公司發布的工具，其 source_url 網域須與公司相符
  //     不符者降級為待人工確認，不自動發佈（防 Runway 假新聞重演）
  // 0b. 可信度閘門：只有 A/B 級自動發佈；C/D 級轉入 review 分頁
  const review = [];
  enriched = enriched.filter(item => {
    const cred = String(item.credibility || '').toUpperCase();
    if (CONFIG.MIN_CREDIBILITY_TO_PUBLISH === 'B' && (cred === 'C' || cred === 'D')) {
      item._review_reason = `可信度 ${cred} 級，未達自動發佈門檻`;
      review.push(item);
      return false;
    }
    // 網域驗證只擋「低可信度(C/D)」的工具消息；A/B 級已由 Claude 判定為官方/主流媒體，信任其判斷照發，
    // 避免媒體報導（來源網域非公司官網）被誤殺。仍保留防 Runway 假新聞（那是低可信度爆料）的效果。
    if (CONFIG.VERIFY_SOURCE_DOMAIN && item.category === '工具'
        && (cred === 'C' || cred === 'D') && !sourceMatchesCompany(item)) {
      item._review_reason = `工具消息來源網域與公司「${item.company}」不符，且可信度僅 ${cred} 級`;
      review.push(item);
      return false;
    }
    return true;
  });
  if (review.length > 0) {
    console.warn(`真實性防線攔截 ${review.length} 則，轉入待人工確認`);
    try { writeToReviewSheet(review); } catch (e) { console.warn('寫入 review 失敗:', e.message); }
  }

  // 1. QC Gate: 候選 >20 時提高閾值
  let threshold = CONFIG.SCORE_MIN_PUBLISH;
  if (enriched.length > CONFIG.QC_RAISE_THRESHOLD_WHEN) {
    threshold = CONFIG.QC_RAISED_THRESHOLD;
    console.log(`QC Gate: 候選 ${enriched.length} > ${CONFIG.QC_RAISE_THRESHOLD_WHEN}，提高閾值至 ${threshold}`);
  }

  // 2. 過濾分數低於閾值者
  let candidates = enriched.filter(i => i.score >= threshold);

  // 3. 排序（高分先）
  candidates.sort((a, b) => b.score - a.score);

  // 4. 多樣性：同公司 7 日內最多 3 次 Top
  const companyCountLast7 = {};
  const sevenDaysAgo = Date.now() - 7 * 86400 * 1000;
  recentHistory.forEach(h => {
    if (new Date(h.date).getTime() >= sevenDaysAgo && h.is_top) {
      companyCountLast7[h.company] = (companyCountLast7[h.company] || 0) + 1;
    }
  });

  // 5. 跨日標題相似度去重（14 天）
  const fourteenDaysAgo = Date.now() - 14 * 86400 * 1000;
  const recentEmbeddings = recentHistory
    .filter(h => new Date(h.date).getTime() >= fourteenDaysAgo && h._embedding)
    .map(h => h._embedding);

  candidates = candidates.filter(c => {
    if (!c._embedding) return true;
    for (const prev of recentEmbeddings) {
      if (cosineSim(c._embedding, prev) > CONFIG.CROSS_DAY_SIMILARITY_LIMIT) {
        console.log(`跨日重複丟棄：${c.title}`);
        return false;
      }
    }
    return true;
  });

  // 6. 標記 Top 3（score ≥4 且未超過公司頻率）
  let topCount = 0;
  candidates.forEach(c => {
    if (topCount >= 3) return;
    if (c.score < CONFIG.SCORE_TOP_TIER) return;
    if ((companyCountLast7[c.company] || 0) >= CONFIG.MAX_SAME_COMPANY_PER_WEEK) {
      console.log(`公司頻率超限：${c.company}`);
      return;
    }
    c.is_top = true;
    topCount++;
  });

  // 7. 限制總量
  const final = candidates.slice(0, CONFIG.MAX_PUBLISH_PER_DAY);

  console.log(`Ranker: ${enriched.length} → ${final.length} (top ${topCount})`);
  return final;
}
