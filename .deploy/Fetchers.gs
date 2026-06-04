/**
 * Fetchers.gs — 資料抓取層
 *
 * 對外只 export 一個 fetchAllSources() 函式，回傳統一格式：
 *   { source_url, title, content, published_at, social_metrics, source_type }
 */

/**
 * 主入口：呼叫所有來源並合併
 */
function fetchAllSources() {
  const all = [];
  const errors = [];

  // RSS（並行不可用，逐個抓）
  CONFIG.RSS_SOURCES.forEach(src => {
    try {
      const items = fetchRssFeed(src.url, src.name);
      all.push(...items);
    } catch (e) {
      errors.push(`RSS ${src.name}: ${e.message}`);
    }
  });

  // Tavily
  CONFIG.TAVILY_KEYWORDS.forEach(kw => {
    try {
      const items = fetchTavily(kw);
      all.push(...items);
    } catch (e) {
      errors.push(`Tavily "${kw}": ${e.message}`);
    }
  });

  // Reddit
  CONFIG.REDDIT_SUBS.forEach(sub => {
    try {
      const items = fetchReddit(sub);
      all.push(...items);
    } catch (e) {
      errors.push(`Reddit r/${sub}: ${e.message}`);
    }
  });

  console.log(`Fetched ${all.length} raw items, ${errors.length} source errors`);
  if (errors.length > 0) console.warn('Fetch errors:', errors);

  return all;
}

/**
 * RSS 抓取（用 XmlService 解析 RSS 2.0 / Atom）
 */
function fetchRssFeed(url, sourceName) {
  const resp = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true,
    validateHttpsCertificates: true
  });
  if (resp.getResponseCode() !== 200) {
    throw new Error(`HTTP ${resp.getResponseCode()}`);
  }

  const xml = XmlService.parse(resp.getContentText());
  const root = xml.getRootElement();
  const atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');

  // RSS 2.0: <rss><channel><item>
  // Atom:    <feed><entry>
  let entries = [];
  const channel = root.getChild('channel');
  if (channel) {
    entries = channel.getChildren('item');
  } else {
    entries = root.getChildren('entry', atom);
  }

  const cutoff = Date.now() - CONFIG.LOOKBACK_HOURS * 3600 * 1000;
  const items = [];

  entries.slice(0, CONFIG.MAX_ITEMS_PER_SOURCE).forEach(entry => {
    const title = (entry.getChildText('title') || '').trim();
    const link = entry.getChildText('link') ||
                 (entry.getChild('link', atom) && entry.getChild('link', atom).getAttribute('href').getValue()) || '';
    const pubText = entry.getChildText('pubDate') ||
                    entry.getChildText('published') ||
                    entry.getChildText('updated', atom) || '';
    const desc = (entry.getChildText('description') ||
                  entry.getChildText('summary') || '').trim();

    if (!title || !link) return;

    const publishedAt = pubText ? new Date(pubText).getTime() : Date.now();
    if (publishedAt < cutoff) return;

    items.push({
      source_url: link,
      title: title,
      content: stripHtml(desc).slice(0, 2000),
      published_at: new Date(publishedAt).toISOString(),
      social_metrics: null,
      source_type: 'rss',
      source_name: sourceName
    });
  });

  return items;
}

/**
 * Tavily API 關鍵字搜尋
 */
function fetchTavily(keyword) {
  const payload = {
    api_key: getApiKey('TAVILY_API_KEY'),
    query: keyword,
    search_depth: 'basic',
    topic: 'news',
    days: 1,                                // 過去 24h
    max_results: 10,
    include_answer: false,
    include_raw_content: false
  };

  const resp = UrlFetchApp.fetch(CONFIG.TAVILY_API_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error(`Tavily HTTP ${resp.getResponseCode()}: ${resp.getContentText().slice(0, 200)}`);
  }

  const data = JSON.parse(resp.getContentText());
  return (data.results || []).map(r => ({
    source_url: r.url,
    title: r.title,
    content: (r.content || '').slice(0, 2000),
    published_at: r.published_date || new Date().toISOString(),
    social_metrics: null,
    source_type: 'tavily',
    source_name: `Tavily: ${keyword}`
  }));
}

/**
 * Reddit JSON API（公開、免認證）
 * 取 24h 內 score >= 50 的貼文
 */
function fetchReddit(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=25`;
  const resp = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'AI-News-Bot/1.0 (by /u/aivideomaker)' }
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error(`Reddit HTTP ${resp.getResponseCode()}`);
  }

  const data = JSON.parse(resp.getContentText());
  const cutoff = Date.now() / 1000 - CONFIG.LOOKBACK_HOURS * 3600;

  return (data.data.children || [])
    .map(c => c.data)
    .filter(p => p.score >= CONFIG.REDDIT_MIN_SCORE && p.created_utc >= cutoff && !p.over_18)
    .slice(0, CONFIG.MAX_ITEMS_PER_SOURCE)
    .map(p => ({
      source_url: `https://www.reddit.com${p.permalink}`,
      title: p.title,
      content: (p.selftext || '').slice(0, 2000) || `[Link post] ${p.url}`,
      published_at: new Date(p.created_utc * 1000).toISOString(),
      social_metrics: {
        score: p.score,
        comments: p.num_comments,
        platform: 'reddit'
      },
      source_type: 'reddit',
      source_name: `r/${subreddit}`
    }));
}

/**
 * Helper: 去除 HTML 標籤與多餘空白
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
