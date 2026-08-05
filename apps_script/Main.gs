/**
 * Main.gs — Pipeline orchestrator + trigger setup
 *
 * 主要函式：
 *   - runDailyPipeline()    每日自動執行的主流程（時間觸發器呼叫）
 *   - setupDailyTrigger()   一次性執行，建立每天 08:00 (Asia/Taipei) 的觸發器
 *   - testRunPipeline()     開發/手動測試用（不寫入 Sheet）
 *   - clearAllTriggers()    清除所有現有觸發器（除錯用）
 */

/**
 * 主流程：每日自動執行
 */
function runDailyPipeline() {
  const startTime = new Date();
  let status = {
    fetched: 0,
    accepted: 0,
    published: 0,
    cost: 0,
    error: ''
  };

  try {
    console.log('=== AI News Pipeline START ===');

    // Step 1: 抓取
    const raw = fetchAllSources();
    status.fetched = raw.length;
    if (raw.length === 0) throw new Error('沒有抓到任何資料');

    // Step 2: 去重
    const deduped = dedupe(raw);

    // Step 3: Filter (Haiku)
    const filtered = filterByClaude(deduped);

    // Step 4: Enrich (Sonnet)
    const enriched = enrichByClaude(filtered);
    status.accepted = enriched.length;
    if (enriched.length === 0) {
      console.log('No items passed enrichment. Logging empty day.');
      logPipeline({
        status: 'empty',
        fetched: status.fetched,
        accepted: 0,
        published: 0,
        cost: status.cost,
        error: ''
      });
      alertIfStale();   // 連續多天無新內容 → 寄警告信
      return;
    }

    // Step 5: Rank + QC + 多樣性
    const recentHistory = getRecentHistory(14);
    const ranked = rankAndFilter(enriched, recentHistory);
    status.published = ranked.length;

    if (ranked.length === 0) {
      console.log('Ranker 過濾後無項目。');
      logPipeline({
        status: 'filtered_empty',
        fetched: status.fetched,
        accepted: status.accepted,
        published: 0,
        cost: status.cost,
        error: ''
      });
      alertIfStale();   // 連續多天無新內容 → 寄警告信
      return;
    }

    // Step 6: Shary 觀點
    let sharyVoice = '';
    try {
      sharyVoice = generateSharyVoice(ranked.slice(0, 5));
    } catch (e) {
      console.warn('Shary voice generation failed:', e.message);
      sharyVoice = '（今日 Shary 觀點生成失敗，待人工補充）';
    }

    // Step 7: 寫入 Sheets
    writeToNewsSheet(ranked);
    writeToSharyVoiceSheet(sharyVoice);

    // Step 7.5: AI 製片實戰（YouTube 半自動抓取 → studio 分頁）
    if (CONFIG.ENABLE_STUDIO_PIPELINE) {
      try {
        generateStudioPicks();
      } catch (e) {
        console.warn('Studio pipeline failed (non-fatal):', e.message);
      }
    }

    // Step 8: 社群素材生成（IG/Threads/FB 文案 + AI 新視野 圖卡 → Drive）
    let socialFolderUrl = '';
    if (CONFIG.ENABLE_SOCIAL_PIPELINE) {
      try {
        socialFolderUrl = generateAndSaveSocialAssets(
          getTodayString(), ranked, sharyVoice
        ) || '';
      } catch (e) {
        console.warn('Social pipeline failed (non-fatal):', e.message);
      }
    }

    const elapsedSec = ((new Date() - startTime) / 1000).toFixed(1);
    console.log(`=== Pipeline DONE in ${elapsedSec}s ===`);
    if (socialFolderUrl) console.log(`Social assets: ${socialFolderUrl}`);

    logPipeline({
      status: 'success',
      fetched: status.fetched,
      accepted: status.accepted,
      published: status.published,
      cost: status.cost,
      error: ''
    });

    if (CONFIG.EMAIL_ON_SUCCESS) {
      sendErrorEmail('Pipeline 完成',
        `今日推送 ${status.published} 條，耗時 ${elapsedSec}s，成本 $${status.cost.toFixed(3)}`);
    }

  } catch (err) {
    console.error('Pipeline ERROR:', err.message, err.stack);
    status.error = err.message;
    logPipeline({
      status: 'fail',
      fetched: status.fetched,
      accepted: status.accepted,
      published: status.published,
      cost: status.cost,
      error: err.message
    });
    sendErrorEmail('Pipeline 失敗', `${err.message}\n\n${err.stack}`);
    throw err;
  }
}

/**
 * 內容陳舊警告：若 news 最新日期距今 ≥ STALE_ALERT_DAYS 天，寄警告信。
 * 每天最多寄一次（用 Script Property 記錄上次寄信日）。
 */
function alertIfStale() {
  try {
    const gapDays = CONFIG.STALE_ALERT_DAYS || 2;
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAMES.NEWS);
    const data = sheet.getDataRange().getValues();
    const dateCol = NEWS_COLUMNS.indexOf('date');
    let latest = '';
    for (let i = 1; i < data.length; i++) {
      const v = data[i][dateCol];
      const s = v instanceof Date ? Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd') : String(v).slice(0, 10);
      if (s > latest) latest = s;
    }
    const today = getTodayString();
    const gap = Math.round((new Date(today) - new Date(latest)) / 86400000);
    if (gap < gapDays) return;   // 還沒到警告門檻

    // 每天最多寄一次
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty('STALE_ALERT_SENT') === today) return;

    const to = CONFIG.SOCIAL_EMAIL_TO || PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
    if (to) {
      MailApp.sendEmail({
        to: to,
        subject: `⚠️ [AI News] 內容已 ${gap} 天未更新，請檢查`,
        body: `AI Video News 已連續 ${gap} 天沒有產出新內容（news 最新日期：${latest}）。\n\n`
          + `常見原因：\n`
          + `1. Anthropic API 額度用完 → 前往 console.anthropic.com/settings/billing 儲值\n`
          + `2. 模型 API 規格變更 → 用 Web App 診斷入口 ?diag=1 檢查\n`
          + `3. 抓取來源全部失效\n\n`
          + `診斷：在 Apps Script 執行 testRunPipeline 看 console 錯誤。`
      });
      props.setProperty('STALE_ALERT_SENT', today);
      console.warn(`已寄出內容陳舊警告信（gap ${gap} 天）`);
    }
  } catch (e) {
    console.warn('alertIfStale 失敗:', e.message);
  }
}

/**
 * Web App 入口（GitHub Actions 備援觸發器呼叫）
 *
 * 冪等設計：當天 news 已有資料就跳過，只在主觸發器失敗時補跑。
 * 安全：需帶正確 token（?token=...，對應 Script Property BACKUP_TOKEN）
 *
 * 部署：clasp deploy 或編輯器「部署 → 新增部署 → 網頁應用程式」
 *   執行身分：我自己；存取權：任何人
 */
function doGet(e) {
  const out = (obj) => ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  // 1. token 驗證
  const expected = PropertiesService.getScriptProperties().getProperty('BACKUP_TOKEN');
  const got = e && e.parameter && e.parameter.token;
  if (!expected || got !== expected) {
    return out({ ok: false, error: 'unauthorized' });
  }

  // 1.5 診斷模式：?diag=1 跑一次「真實的評分呼叫」，回傳原始狀態/錯誤
  if (e.parameter.diag) {
    // (a) 帶 system prompt + prompt cache 的真實呼叫（模擬 filter/enrich）
    const raw = {};
    ['HAIKU', 'SONNET'].forEach(k => {
      try {
        const resp = UrlFetchApp.fetch(CONFIG.CLAUDE_API_URL, {
          method: 'post', contentType: 'application/json',
          headers: { 'x-api-key': getApiKey('ANTHROPIC_API_KEY'), 'anthropic-version': CONFIG.CLAUDE_VERSION },
          payload: JSON.stringify({
            model: CONFIG.CLAUDE_MODELS[k], max_tokens: 100, temperature: 0.3,
            system: [{ type: 'text', text: '你是測試助手。', cache_control: { type: 'ephemeral' } }],
            messages: [{ role: 'user', content: '請只回覆 JSON 陣列 [{"ok":true}]' }]
          }),
          muteHttpExceptions: true
        });
        raw[k] = { model: CONFIG.CLAUDE_MODELS[k], http: resp.getResponseCode(), body: resp.getContentText().slice(0, 400) };
      } catch (err) { raw[k] = { model: CONFIG.CLAUDE_MODELS[k], error: err.message }; }
    });
    // (b) 走真實 callClaude 路徑（含 temperature 條件邏輯）測 Sonnet
    let sonnetTest;
    try {
      const r = callClaude(CONFIG.CLAUDE_MODELS.SONNET, '你是測試助手。',
        [{ role: 'user', content: '回覆 OK' }], { useCache: true, maxTokens: 50, temperature: 0.2 });
      sonnetTest = { ok: true, text: r.text.slice(0, 100) };
    } catch (err) { sonnetTest = { ok: false, error: err.message.slice(0, 300) }; }
    return out({ ok: true, rawCall: raw, sonnetViaCallClaude: sonnetTest });
  }

  // 2. 冪等檢查：今天是否已有 news
  const today = getTodayString();
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAMES.NEWS);
    const data = sheet.getDataRange().getValues();
    const dateCol = NEWS_COLUMNS.indexOf('date');
    const hasToday = data.slice(1).some(r => {
      const v = r[dateCol];
      const s = v instanceof Date ? Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd') : String(v).slice(0, 10);
      return s === today;
    });
    if (hasToday) {
      return out({ ok: true, action: 'skipped', reason: 'today already published', date: today });
    }
  } catch (err) {
    return out({ ok: false, error: 'sheet check failed: ' + err.message });
  }

  // 3. 今天沒資料 → 補跑
  try {
    runDailyPipeline();
    return out({ ok: true, action: 'ran', date: today });
  } catch (err) {
    return out({ ok: false, action: 'run failed', error: err.message });
  }
}

/**
 * 一次性執行：建立每天 08:00 (Asia/Taipei) 自動觸發器
 *
 * 使用方式：在 Apps Script 編輯器選此函式 → 執行 → 授權
 */
function setupDailyTrigger() {
  // 先清除舊的同名觸發器
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'runDailyPipeline') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // 新增每天 08:00 (Asia/Taipei) 觸發
  ScriptApp.newTrigger('runDailyPipeline')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .nearMinute(0)
    .inTimezone('Asia/Taipei')
    .create();

  console.log('Daily trigger created: runDailyPipeline @ 08:00 Asia/Taipei');
}

/**
 * 手動測試：跑完整 pipeline 但只 console.log 不寫 sheet
 */
function testRunPipeline() {
  const raw = fetchAllSources();
  console.log(`Fetched: ${raw.length}`);
  console.log('Sample:', JSON.stringify(raw[0], null, 2));

  const deduped = dedupe(raw.slice(0, 30));
  console.log(`Deduped: ${deduped.length}`);

  const filtered = filterByClaude(deduped);
  console.log(`Filtered: ${filtered.length}`);

  if (filtered.length > 0) {
    const enriched = enrichByClaude(filtered.slice(0, 5));
    console.log('Enriched sample:', JSON.stringify(enriched[0], null, 2));
  }
}

/**
 * 清除所有觸發器（除錯用）
 */
function clearAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  console.log(`Deleted ${triggers.length} triggers.`);
}

/**
 * 跑社群素材測試（預設今日；無資料時自動 fallback 到最新有資料的日期）
 */
function testSocialOnly() {
  return testSocialForDate(null);
}

/**
 * 跑昨天的社群素材（給「2026-05-28 範例資料」測試用）
 */
function testSocialYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const dateStr = Utilities.formatDate(d, 'Asia/Taipei', 'yyyy-MM-dd');
  return testSocialForDate(dateStr);
}

/**
 * 指定日期跑社群素材
 *
 * @param {string|null} targetDate  'YYYY-MM-DD'；傳 null 用今日，今日無資料則 fallback 到最新有資料的日期
 */
function testSocialForDate(targetDate) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const newsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.NEWS);
  const sharySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SHARY);

  // 若沒傳日期，預設今日；若今日無資料，自動找最新
  if (!targetDate) {
    targetDate = getTodayString();
    const allDates = newsSheet.getDataRange().getValues().slice(1)
      .map(r => r[1] instanceof Date
        ? Utilities.formatDate(r[1], 'Asia/Taipei', 'yyyy-MM-dd')
        : String(r[1]).slice(0, 10))
      .filter(Boolean);
    if (!allDates.includes(targetDate)) {
      const sorted = [...new Set(allDates)].sort((a, b) => b.localeCompare(a));
      if (sorted.length > 0) {
        targetDate = sorted[0];
        console.log(`今日無資料，fallback 到最新：${targetDate}`);
      }
    }
  }
  console.log('Testing social pipeline for', targetDate);

  const newsRows = newsSheet.getDataRange().getValues();
  const headers = newsRows[0];
  const idx = {};
  NEWS_COLUMNS.forEach(c => { idx[c] = headers.indexOf(c); });

  const items = [];
  for (let i = 1; i < newsRows.length; i++) {
    const r = newsRows[i];
    const dateStr = r[idx.date] instanceof Date
      ? Utilities.formatDate(r[idx.date], 'Asia/Taipei', 'yyyy-MM-dd')
      : String(r[idx.date]).slice(0, 10);
    if (dateStr === targetDate) {
      items.push({
        category: r[idx.category],
        title: r[idx.title],
        score: r[idx.score],
        credibility: r[idx.credibility],
        one_line: r[idx.one_line],
        key_takeaway: r[idx.key_takeaway],
        actionable: r[idx.actionable],
        audience: r[idx.audience],
        tags: r[idx.tags],
        source_url: r[idx.source_url],
        is_top: r[idx.is_top] === true || r[idx.is_top] === 'TRUE'
      });
    }
  }

  // Shary voice
  let sharyVoice = '';
  const sharyRows = sharySheet.getDataRange().getValues();
  for (let i = 1; i < sharyRows.length; i++) {
    const d = sharyRows[i][0];
    const dStr = d instanceof Date
      ? Utilities.formatDate(d, 'Asia/Taipei', 'yyyy-MM-dd')
      : String(d).slice(0, 10);
    if (dStr === targetDate) {
      sharyVoice = sharyRows[i][1];
      break;
    }
  }

  console.log(`Found ${items.length} items, sharyVoice = ${sharyVoice ? sharyVoice.slice(0, 30) + '...' : '(empty)'}`);

  if (items.length === 0) {
    console.log(`⚠️ Sheet 找不到 ${targetDate} 的資料，請確認日期格式或先匯入範例資料`);
    return null;
  }

  const url = generateAndSaveSocialAssets(targetDate, items, sharyVoice);
  console.log('Drive folder:', url);
  return url;
}

/**
 * 列出目前所有觸發器
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    console.log(`- ${t.getHandlerFunction()} | ${t.getEventType()} | ${t.getTriggerSource()}`);
  });
  return triggers.length;
}
