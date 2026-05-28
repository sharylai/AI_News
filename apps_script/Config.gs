/**
 * Config.gs — 集中所有常數、來源清單、評分閾值
 *
 * API Keys 不要寫在程式碼裡！
 * 請到 Apps Script 編輯器 → 專案設定 → 指令碼屬性，新增以下三個 key：
 *   - ANTHROPIC_API_KEY
 *   - TAVILY_API_KEY
 *   - OPENAI_API_KEY        (僅用於 embedding 去重)
 *   - NOTIFY_EMAIL          (錯誤通知收件人)
 */

const CONFIG = {

  // ===== Google Sheets =====
  SHEET_ID: '1_EiUhQ-nSOtFaLzEiQcMu-eBFb9P0504VUsw_-5boI8',
  SHEET_NAMES: {
    NEWS: 'news',
    SHARY: 'shary_voice',
    LOG: 'pipeline_log'
  },

  // ===== Claude API =====
  CLAUDE_API_URL: 'https://api.anthropic.com/v1/messages',
  CLAUDE_MODELS: {
    HAIKU: 'claude-haiku-4-5',     // 批次初篩
    SONNET: 'claude-sonnet-4-6',   // 主要分類、評分、摘要
    OPUS: 'claude-opus-4-7'        // Shary 觀點
  },
  CLAUDE_VERSION: '2023-06-01',

  // ===== Tavily API =====
  TAVILY_API_URL: 'https://api.tavily.com/search',

  // ===== OpenAI Embedding (去重用) =====
  OPENAI_EMBED_URL: 'https://api.openai.com/v1/embeddings',
  OPENAI_EMBED_MODEL: 'text-embedding-3-small',

  // ===== 抓取設定 =====
  FETCH_TIMEOUT_MS: 30000,
  LOOKBACK_HOURS: 24,                  // 只抓過去 24 小時
  MAX_ITEMS_PER_SOURCE: 30,            // 每個來源最多抓 30 則
  DEDUP_SIMILARITY_THRESHOLD: 0.92,    // 標題 cosine similarity > 此值視為重複

  // ===== 評分閾值 =====
  SCORE_TOP_TIER: 4.0,                 // 進「今日三大戰情點」
  SCORE_MIN_PUBLISH: 3.0,              // 進今日推送
  SCORE_MIN_STORE: 2.0,                // 進 Sheet 存檔（不推送）

  // ===== QC Gate =====
  MAX_PUBLISH_PER_DAY: 10,             // 一天最多推 10 條
  QC_RAISE_THRESHOLD_WHEN: 20,         // 候選 >20 時提高閾值
  QC_RAISED_THRESHOLD: 3.3,            // 提高後的閾值
  MAX_SAME_COMPANY_PER_WEEK: 3,        // 同一公司 7 天內最多 3 次 Top
  CROSS_DAY_SIMILARITY_LIMIT: 0.85,    // 跨日標題相似 > 此值視為重複丟棄

  // ===== RSS 來源（A 級） =====
  RSS_SOURCES: [
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' },
    { name: 'Anthropic News', url: 'https://www.anthropic.com/news/rss' },
    { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml' },
    { name: 'Runway Research', url: 'https://runwayml.com/research/rss' },
    { name: 'Stability AI', url: 'https://stability.ai/news/rss.xml' },
    { name: 'ElevenLabs', url: 'https://elevenlabs.io/blog/rss.xml' },
    { name: 'HeyGen', url: 'https://www.heygen.com/blog/rss.xml' },
    { name: 'Synthesia', url: 'https://www.synthesia.io/blog/rss.xml' },
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml' },
    { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' }
  ],

  // ===== Tavily 關鍵字 =====
  TAVILY_KEYWORDS: [
    'AI video generation',
    'text-to-video model',
    'AI avatar virtual human',
    'AI voice clone',
    'generative video model',
    'AI 影片生成',
    'Sora video',
    'Runway Gen',
    'AI 虛擬人'
  ],

  // ===== Reddit Subreddits =====
  REDDIT_SUBS: [
    'StableDiffusion',
    'aivideo',
    'runwayml',
    'singularity',
    'midjourney'
  ],
  REDDIT_MIN_SCORE: 50,

  // ===== 在地化用詞檢查（Shary 觀點禁用詞） =====
  BANNED_WORDS: [
    '未來已來', '科技改變世界', '賦能', '賽道', '閉環',
    '彎道超車', '視頻', '提示语', '优化', '上线', '数据', '服务'
  ],

  // ===== Logging =====
  EMAIL_ON_ERROR: true,
  EMAIL_ON_SUCCESS: false,

  // ===== Social 素材 =====
  ENABLE_SOCIAL_PIPELINE: true,                  // 是否自動生成社群素材
  DRIVE_FOLDER_ROOT: 'AI News',                  // Drive 根資料夾名稱
  SOCIAL_MAX_ITEMS: 5,                           // 取前 N 則新聞生成貼文

  // ===== Email 通知 =====
  ENABLE_SOCIAL_EMAIL: true,                     // 是否把社群素材直接寄信
  SOCIAL_EMAIL_TO: 'sharylai@gmail.com',         // 收件人（可改）
  SOCIAL_EMAIL_FROM_NAME: 'AI News｜影音創客'    // 寄件人顯示名稱
};

/**
 * Helper: 從 Script Properties 讀取 API key
 */
function getApiKey(name) {
  const key = PropertiesService.getScriptProperties().getProperty(name);
  if (!key) {
    throw new Error(`Script Property "${name}" 尚未設定。請至 專案設定 → 指令碼屬性 新增。`);
  }
  return key;
}

/**
 * Helper: 取得今日日期字串 (Asia/Taipei)
 */
function getTodayString() {
  return Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
}

/**
 * Helper: ISO datetime string
 */
function nowIso() {
  return new Date().toISOString();
}
