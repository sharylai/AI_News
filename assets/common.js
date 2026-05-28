/**
 * common.js — index / archive / search 三頁共用
 *
 * 對外提供：
 *   - AI_NEWS_CONFIG.SHEET_ID
 *   - fetchSheet(sheetName)        Promise<Array<Object>>
 *   - parseGviz(json)               GViz JSON → Array<Object>
 *   - categoryClass(category)       Tailwind classes for category badge
 *   - todayString()                 'YYYY-MM-DD' Asia/Taipei
 *   - displayDate(dateStr)          'YYYY/MM/DD 週X'
 *   - formatTime(isoStr)            'HH:MM'
 */

window.AI_NEWS_CONFIG = {
  SHEET_ID: '1_EiUhQ-nSOtFaLzEiQcMu-eBFb9P0504VUsw_-5boI8',
  SHEETS: {
    NEWS: 'news',
    SHARY: 'shary_voice'
  }
};

async function fetchSheet(sheetName) {
  const id = window.AI_NEWS_CONFIG.SHEET_ID;
  if (!id || id === 'YOUR_GOOGLE_SHEET_ID_HERE') {
    throw new Error('尚未設定 SHEET_ID，請編輯 assets/common.js。');
  }
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Sheet「${sheetName}」載入失敗 (HTTP ${resp.status})`);
  const text = await resp.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?\s*$/);
  if (!match) throw new Error(`Sheet「${sheetName}」回應格式錯誤，請確認已設為「知道連結者可檢視」。`);
  return parseGviz(JSON.parse(match[1]));
}

function parseGviz(json) {
  const cols = json.table.cols.map(c => c.label || c.id);
  return (json.table.rows || []).map(row => {
    const obj = {};
    row.c.forEach((cell, idx) => {
      const key = cols[idx];
      if (!key) return;
      let v = cell ? cell.v : '';
      if (key === 'date' && cell && cell.f) v = cell.f;
      if (key === 'score') v = Number(v) || 0;
      obj[key] = v;
    });
    return obj;
  });
}

function categoryClass(category) {
  return {
    '工具': 'bg-blue-100 text-blue-800',
    '案例': 'bg-purple-100 text-purple-800',
    '教學': 'bg-amber-100 text-amber-800',
    '情報': 'bg-emerald-100 text-emerald-800'
  }[category] || 'bg-slate-100 text-slate-700';
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function displayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const weekday = ['週日','週一','週二','週三','週四','週五','週六'][d.getDay()];
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${weekday}`;
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}
