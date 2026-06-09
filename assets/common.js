/**
 * common.js — index / archive / search 三頁共用
 */

window.AI_NEWS_CONFIG = {
  SHEET_ID: '1_EiUhQ-nSOtFaLzEiQcMu-eBFb9P0504VUsw_-5boI8',
  SHEETS: { NEWS: 'news', SHARY: 'shary_voice', STUDIO: 'studio' },
  // 影音創客主站連結（修改為實際 URL）
  PARENT_SITE: {
    home: '#',
    courses: '#',
    consulting: '#',
    news: '#',
    column: '#'
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
    '工具': 'cat-tool',
    '案例': 'cat-case',
    '教學': 'cat-teach',
    '情報': 'cat-news'
  }[category] || '';
}

function platformMeta(platform) {
  const map = {
    'YouTube':  { icon: '▶', color: '#FF0000', label: 'YouTube' },
    'Threads':  { icon: '@', color: '#000000', label: 'Threads' },
    'Instagram':{ icon: '◉', color: '#C13584', label: 'Instagram' },
    'IG':       { icon: '◉', color: '#C13584', label: 'Instagram' },
    '小紅書':    { icon: '小', color: '#FF2442', label: '小紅書' },
    'TikTok':   { icon: '♪', color: '#000000', label: 'TikTok' },
    'X':        { icon: '𝕏', color: '#000000', label: 'X' }
  };
  return map[platform] || { icon: '🔗', color: '#6B7280', label: platform || '來源' };
}

function categoryEmoji(category) {
  return {
    '工具': '🛠️',
    '案例': '🎬',
    '教學': '💡',
    '情報': '📡'
  }[category] || '📰';
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

function dateStampParts(dateStr) {
  if (!dateStr) return { day: '', month: '' };
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day: String(d.getDate()),
    month: `${d.getMonth()+1}月`
  };
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}

/**
 * 共用 Header HTML（黃色 nav + Logo + Sub-nav）
 *
 * 用法：在 <body> 開頭呼叫 document.write(renderHeader('today'))
 * activeKey: 'today' | 'archive' | 'search'
 */
function renderHeader(activeKey) {
  return `
    <div class="brand-topbar"></div>
    <div class="brand-header">
      <div class="brand-header-inner">
        <a href="index.html" class="brand-logo">
          <img src="assets/logo.png?v=20260605e" alt="AI Video News" class="brand-logo-img">
        </a>
        <span class="brand-tagline">每日 <b>8</b> 點 ｜ AI 影音趨勢雷達</span>
        <nav class="subnav">
          <a href="index.html" class="${activeKey==='today'?'active':''}">今日</a>
          <a href="archive.html" class="${activeKey==='archive'?'active':''}">歷史封存</a>
          <a href="search.html" class="${activeKey==='search'?'active':''}">搜尋</a>
        </nav>
      </div>
    </div>
  `;
}

function renderFooter() {
  return `
    <footer class="brand-footer">
      <p>AI Video News｜<a href="https://www.videomaker.cc" target="_blank" rel="noopener">影音創客</a>監製。每日 08:00 更新</p>
      <p style="margin-top:0.4rem">內容僅供參考，原文連結為準</p>
    </footer>
  `;
}
