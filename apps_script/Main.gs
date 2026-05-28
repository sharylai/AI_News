/**
 * Main.gs — Pipeline orchestrator + trigger setup
 *
 * 主要函式：
 *   - runDailyPipeline()    每日自動執行的主流程（時間觸發器呼叫）
 *   - setupDailyTrigger()   一次性執行，建立每天 06:00 的觸發器
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

    const elapsedSec = ((new Date() - startTime) / 1000).toFixed(1);
    console.log(`=== Pipeline DONE in ${elapsedSec}s ===`);

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
 * 一次性執行：建立每天 06:00 自動觸發器
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

  // 新增每天 06:00 (Asia/Taipei) 觸發
  ScriptApp.newTrigger('runDailyPipeline')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .nearMinute(0)
    .inTimezone('Asia/Taipei')
    .create();

  console.log('Daily trigger created: runDailyPipeline @ 06:00 Asia/Taipei');
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
 * 列出目前所有觸發器
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    console.log(`- ${t.getHandlerFunction()} | ${t.getEventType()} | ${t.getTriggerSource()}`);
  });
  return triggers.length;
}
