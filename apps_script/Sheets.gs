/**
 * Sheets.gs — Google Sheets 寫入層
 *
 * news 欄位順序必須對齊 (Part 2.1 schema)：
 *   id, date, category, title, score, credibility, one_line, key_takeaway,
 *   actionable, audience, tags, company, source_url, is_top, published_at, created_at
 */

const NEWS_COLUMNS = [
  'id', 'date', 'category', 'title', 'score', 'credibility',
  'one_line', 'key_takeaway', 'actionable', 'audience', 'tags',
  'company', 'source_url', 'is_top', 'published_at', 'created_at'
];

const SHARY_COLUMNS = ['date', 'content', 'created_at'];

const LOG_COLUMNS = [
  'run_at', 'status', 'fetched', 'accepted', 'published', 'error', 'cost_usd'
];

/**
 * 寫入今日 news（覆蓋同日資料）
 */
function writeToNewsSheet(items) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.NEWS);
  if (!sheet) throw new Error(`Sheet「${CONFIG.SHEET_NAMES.NEWS}」不存在`);

  ensureHeaderRow(sheet, NEWS_COLUMNS);

  const today = getTodayString();

  // 先刪除今日的舊資料（避免重複跑導致重複列）
  removeTodayRows(sheet, NEWS_COLUMNS.indexOf('date') + 1, today);

  const createdAt = nowIso();
  const rows = items.map(item => NEWS_COLUMNS.map(col => {
    if (col === 'date') return today;
    if (col === 'created_at') return createdAt;
    if (col === 'is_top') return Boolean(item.is_top);
    if (col === 'score') return Number(item.score) || 0;
    if (col === 'audience' && Array.isArray(item.audience)) return item.audience.join(',');
    if (col === 'tags' && Array.isArray(item.tags)) return item.tags.join(',');
    return item[col] !== undefined ? item[col] : '';
  }));

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, NEWS_COLUMNS.length).setValues(rows);
  }

  console.log(`Wrote ${rows.length} rows to news sheet.`);
}

/**
 * 寫入今日 Shary 觀點（覆蓋同日）
 */
function writeToSharyVoiceSheet(content) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SHARY);
  if (!sheet) throw new Error(`Sheet「${CONFIG.SHEET_NAMES.SHARY}」不存在`);

  ensureHeaderRow(sheet, SHARY_COLUMNS);
  const today = getTodayString();
  removeTodayRows(sheet, 1, today);     // date 在第 1 欄

  sheet.appendRow([today, content, nowIso()]);
  console.log('Wrote shary_voice for today.');
}

/**
 * 寫入 pipeline 執行記錄
 */
function logPipeline({ status, fetched, accepted, published, error, cost }) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LOG);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAMES.LOG);
    sheet.appendRow(LOG_COLUMNS);
  } else {
    ensureHeaderRow(sheet, LOG_COLUMNS);
  }

  sheet.appendRow([
    nowIso(),
    status,
    fetched || 0,
    accepted || 0,
    published || 0,
    error || '',
    Number(cost || 0).toFixed(3)
  ]);
}

/**
 * 讀取最近 N 天的 news（給 Ranker 跨日去重 / 公司頻率檢查用）
 */
function getRecentHistory(days) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.NEWS);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const colIdx = {};
  NEWS_COLUMNS.forEach(c => { colIdx[c] = headers.indexOf(c); });

  const cutoff = Date.now() - days * 86400 * 1000;
  const history = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const dateStr = row[colIdx.date];
    const date = new Date(dateStr).getTime();
    if (isNaN(date) || date < cutoff) continue;

    history.push({
      date: dateStr,
      title: row[colIdx.title],
      company: row[colIdx.company],
      is_top: row[colIdx.is_top] === true || row[colIdx.is_top] === 'TRUE'
      // _embedding 不存 sheet（成本考量），跨日去重就用近期記憶體版本
    });
  }

  return history;
}

// ===== Helpers =====

function ensureHeaderRow(sheet, columns) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(columns);
    return;
  }
  // 驗證 header（簡單比對第一列）
  const firstRow = sheet.getRange(1, 1, 1, columns.length).getValues()[0];
  const missing = columns.filter((c, i) => firstRow[i] !== c);
  if (missing.length > 0) {
    console.warn(`Header 不符，預期 ${columns.join(',')}，實際 ${firstRow.join(',')}`);
  }
}

function removeTodayRows(sheet, dateColumn, today) {
  if (sheet.getLastRow() < 2) return;
  const data = sheet.getRange(2, dateColumn, sheet.getLastRow() - 1, 1).getValues();
  const rowsToDelete = [];
  data.forEach((row, i) => {
    const cellVal = row[0];
    let dateStr = '';
    if (cellVal instanceof Date) {
      dateStr = Utilities.formatDate(cellVal, 'Asia/Taipei', 'yyyy-MM-dd');
    } else {
      dateStr = String(cellVal).slice(0, 10);
    }
    if (dateStr === today) rowsToDelete.push(i + 2);
  });
  // 從尾巴開始刪
  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
    sheet.deleteRow(rowsToDelete[i]);
  }
}

/**
 * 寫入「待人工確認」分頁（被真實性防線攔截的項目）
 * 這些項目不會出現在正式網站，需人工審核後才手動移到 news
 */
function writeToReviewSheet(items) {
  if (!items || items.length === 0) return;
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.REVIEW_SHEET_NAME);
  const cols = ['date', 'reason', 'title', 'category', 'credibility', 'score',
                'company', 'source_url', 'one_line', 'created_at'];
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.REVIEW_SHEET_NAME);
    sheet.appendRow(cols);
  }
  const today = getTodayString();
  const createdAt = nowIso();
  const rows = items.map(it => [
    today, it._review_reason || '', it.title || '', it.category || '',
    it.credibility || '', Number(it.score) || 0, it.company || '',
    it.source_url || '', it.one_line || '', createdAt
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, cols.length).setValues(rows);
  console.log(`寫入 review 分頁 ${rows.length} 則待人工確認`);
}

/**
 * 寄發錯誤通知 Email
 */
function sendErrorEmail(subject, body) {
  if (!CONFIG.EMAIL_ON_ERROR) return;
  try {
    const recipient = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
    if (!recipient) return;
    MailApp.sendEmail({
      to: recipient,
      subject: `[AI News] ${subject}`,
      body: body
    });
  } catch (e) {
    console.error('Send email failed:', e.message);
  }
}
