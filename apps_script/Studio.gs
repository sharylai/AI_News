/**
 * Studio.gs — AI 製片實戰（YouTube 半自動抓取）
 *
 * 流程：
 *   1. YouTube Data API 搜尋近 7 天 AI 影片製作教學/案例
 *   2. 去重（同頻道+標題）
 *   3. Claude Sonnet 篩選最佳 N 則 + 寫成繁中卡片（角度/標題/摘要）
 *   4. 寫入 studio 分頁（今日）
 *
 * 需要 Script Property: YOUTUBE_API_KEY
 */

function generateStudioPicks() {
  // 1. 抓 YouTube 候選
  const candidates = fetchYouTubeCandidates();
  if (candidates.length === 0) {
    console.warn('Studio: YouTube 無候選影片');
    return [];
  }
  console.log(`Studio: 抓到 ${candidates.length} 支候選影片`);

  // 2. Claude 篩選 + 寫卡片
  const picks = pickAndWriteStudio(candidates);
  if (picks.length === 0) {
    console.warn('Studio: Claude 未產出有效卡片');
    return [];
  }

  // 3. 寫入 studio 分頁
  writeToStudioSheet(picks);
  console.log(`Studio: 寫入 ${picks.length} 則製片實戰`);
  return picks;
}

/**
 * YouTube Data API 搜尋
 */
function fetchYouTubeCandidates() {
  const apiKey = getApiKey('YOUTUBE_API_KEY');
  const publishedAfter = new Date(Date.now() - CONFIG.YOUTUBE_LOOKBACK_DAYS * 86400 * 1000).toISOString();
  const seen = new Set();
  const all = [];

  CONFIG.STUDIO_QUERIES.forEach(q => {
    const params = {
      part: 'snippet',
      q: q,
      type: 'video',
      order: 'relevance',
      maxResults: 8,
      publishedAfter: publishedAfter,
      relevanceLanguage: 'zh-Hant',
      videoEmbeddable: 'true',
      key: apiKey
    };
    const url = CONFIG.YOUTUBE_API_URL + '?' +
      Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&');

    try {
      const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (resp.getResponseCode() !== 200) {
        console.warn(`YouTube "${q}" HTTP ${resp.getResponseCode()}: ${resp.getContentText().slice(0, 150)}`);
        return;
      }
      const data = JSON.parse(resp.getContentText());
      (data.items || []).forEach(it => {
        const vid = it.id && it.id.videoId;
        if (!vid || seen.has(vid)) return;
        seen.add(vid);
        all.push({
          video_id: vid,
          title: it.snippet.title,
          description: (it.snippet.description || '').slice(0, 400),
          channel: it.snippet.channelTitle,
          published_at: it.snippet.publishedAt,
          source_url: `https://www.youtube.com/watch?v=${vid}`
        });
      });
    } catch (e) {
      console.warn(`YouTube "${q}" error: ${e.message}`);
    }
    Utilities.sleep(300);
  });

  return all;
}

/**
 * Claude 篩選最佳 N 則 + 寫繁中卡片
 */
const STUDIO_SYSTEM_PROMPT = `# Role
你是 AI 影音教學策展人，專門從一堆 YouTube 影片中挑出最值得學的「AI 影片製作」教學與案例。

# Task
從傳入的候選影片清單，挑出最佳 ${'{COUNT}'} 則，並改寫成台灣繁中的「製片實戰」卡片。

# 篩選標準（重要）
- 必須與「AI 影片製作」直接相關：工具運用、工作流程、案例拆解、Prompt 技巧
- 優先選「可實作、有具體工作流」的內容，而非純新聞或空泛討論
- 排除：純行銷推銷、與影片製作無關、標題殺人但無料

# Constraints
- 台灣繁體中文（影片非视频、最佳化非优化、工作流非工作流程）
- 嚴禁幻覺：摘要只能根據影片標題與描述，不可捏造影片內容
- angle 從這三選一：「工具運用」「工作流程」「案例拆解」

# Output JSON
[
  {
    "video_id": "原 video_id",
    "platform": "YouTube",
    "angle": "工具運用|工作流程|案例拆解",
    "title": "≤30 字台灣繁中標題（可重寫得更精準）",
    "summary": "50-90 字摘要，說明這支影片教什麼、值得看的點",
    "creator": "頻道名稱"
  }
]
只輸出 JSON 陣列，挑不到好的就回 []。`;

function pickAndWriteStudio(candidates) {
  const count = CONFIG.STUDIO_DAILY_COUNT;
  const sys = STUDIO_SYSTEM_PROMPT.replace('{COUNT}', count);

  const listText = candidates.map((c, i) =>
    `[${i}] video_id=${c.video_id}\n標題：${c.title}\n頻道：${c.channel}\n描述：${c.description}`
  ).join('\n\n---\n\n');

  let result;
  try {
    result = callClaudeJson(
      CONFIG.CLAUDE_MODELS.SONNET, sys,
      `候選影片清單：\n\n${listText}`,
      { useCache: true, maxTokens: 1500, temperature: 0.3 }
    );
  } catch (e) {
    console.warn('Studio Claude failed:', e.message);
    return [];
  }

  const byId = {};
  candidates.forEach(c => { byId[c.video_id] = c; });

  const today = getTodayString();
  const createdAt = nowIso();
  return (result.data || []).slice(0, count).map((p, i) => {
    const src = byId[p.video_id];
    return {
      id: `st_${today.replace(/-/g, '')}_${String(i + 1).padStart(3, '0')}`,
      date: today,
      platform: p.platform || 'YouTube',
      angle: p.angle || '工具運用',
      title: p.title || (src && src.title) || '',
      summary: p.summary || '',
      creator: p.creator || (src && src.channel) || '',
      source_url: (src && src.source_url) || `https://www.youtube.com/watch?v=${p.video_id}`,
      created_at: createdAt
    };
  }).filter(x => x.title && x.summary);
}

/**
 * 寫入 studio 分頁（覆蓋今日）
 */
const STUDIO_COLUMNS = ['id', 'date', 'platform', 'angle', 'title', 'summary', 'creator', 'source_url', 'created_at'];

function writeToStudioSheet(items) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.STUDIO_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.STUDIO_SHEET_NAME);
    sheet.appendRow(STUDIO_COLUMNS);
  } else {
    ensureHeaderRow(sheet, STUDIO_COLUMNS);
    removeRowsForDateGeneric(sheet, STUDIO_COLUMNS.indexOf('date') + 1, getTodayString());
  }
  const rows = items.map(it => STUDIO_COLUMNS.map(c => it[c] !== undefined ? it[c] : ''));
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, STUDIO_COLUMNS.length).setValues(rows);
  }
}

function removeRowsForDateGeneric(sheet, dateCol, date) {
  if (sheet.getLastRow() < 2) return;
  const data = sheet.getRange(2, dateCol, sheet.getLastRow() - 1, 1).getValues();
  const toDel = [];
  data.forEach((row, i) => {
    const v = row[0];
    const s = v instanceof Date ? Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd') : String(v).slice(0, 10);
    if (s === date) toDel.push(i + 2);
  });
  for (let i = toDel.length - 1; i >= 0; i--) sheet.deleteRow(toDel[i]);
}

/**
 * 手動測試：只跑 studio 抓取
 */
function testStudioOnly() {
  const picks = generateStudioPicks();
  console.log(JSON.stringify(picks, null, 2));
}
