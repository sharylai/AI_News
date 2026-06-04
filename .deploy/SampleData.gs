/**
 * SampleData.gs — 開發用的範例資料 seed 函式
 *
 * 用法：在 Apps Script 編輯器選 seedToday2026_05_29() 函式執行一次，
 *       Sheet 立刻有今日 8 則新聞 + 1 則 AI 新視野，網站重新整理就看得到。
 *
 * 上線後可整檔刪除（不影響 production pipeline）。
 */

/**
 * Seed 2026-05-29 的範例資料（不重複）
 */
function seedToday2026_05_29() {
  const targetDate = '2026-05-29';
  seedDateData_(targetDate, SAMPLE_NEWS_2026_05_29, SAMPLE_SHARY_2026_05_29);
}

/**
 * 通用 seed 邏輯：先清除目標日期既有資料，再寫入新資料
 */
function seedDateData_(date, newsItems, sharyContent) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);

  // News 分頁
  const newsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.NEWS);
  if (!newsSheet) throw new Error(`找不到 ${CONFIG.SHEET_NAMES.NEWS} 分頁`);

  // 清除目標日期既有 rows
  removeRowsForDate_(newsSheet, 2, date);   // date 在第 2 欄
  const createdAt = nowIso();
  const rows = newsItems.map(item => NEWS_COLUMNS.map(col => {
    if (col === 'date') return date;
    if (col === 'created_at') return createdAt;
    if (col === 'is_top') return Boolean(item.is_top);
    if (col === 'score') return Number(item.score);
    return item[col] !== undefined ? item[col] : '';
  }));
  newsSheet.getRange(newsSheet.getLastRow() + 1, 1, rows.length, NEWS_COLUMNS.length)
    .setValues(rows);
  console.log(`✅ News：寫入 ${rows.length} 則 (${date})`);

  // Shary 分頁
  const sharySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SHARY);
  if (!sharySheet) throw new Error(`找不到 ${CONFIG.SHEET_NAMES.SHARY} 分頁`);
  removeRowsForDate_(sharySheet, 1, date);
  sharySheet.appendRow([date, sharyContent, createdAt]);
  console.log(`✅ AI 新視野：寫入 1 則 (${date})`);

  console.log(`完成！前往 https://sharylai.github.io/AI_News/ 重新整理即可看到。`);
}

function removeRowsForDate_(sheet, dateColumn, date) {
  if (sheet.getLastRow() < 2) return;
  const data = sheet.getRange(2, dateColumn, sheet.getLastRow() - 1, 1).getValues();
  const toDelete = [];
  data.forEach((row, i) => {
    const v = row[0];
    const s = v instanceof Date
      ? Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd')
      : String(v).slice(0, 10);
    if (s === date) toDelete.push(i + 2);
  });
  for (let i = toDelete.length - 1; i >= 0; i--) sheet.deleteRow(toDelete[i]);
}

// ===========================================================
// 2026-05-29（週五）範例資料
// ===========================================================

const SAMPLE_NEWS_2026_05_29 = [
  {
    id: 'n_20260529_001',
    category: '工具',
    title: 'OpenAI Sora 2.0 商用 API 正式上線',
    score: 4.8,
    credibility: 'A',
    one_line: '4K HDR + 60 秒連續鏡頭 + camera control API',
    key_takeaway: '單支廣告片可一次性 AI 生成完成且支援精準鏡頭控制，影片製作工作流預計重組，廣告片預算結構翻轉。每秒費用 $0.15 美元，仍遠低於傳統拍攝。',
    actionable: '登入 OpenAI 平台申請 Sora API 試用，用一支現有廣告腳本重製比較成本。',
    audience: '創作者,行銷人,廣告主,製片',
    tags: 'Sora,OpenAI,4K,API,商用',
    company: 'OpenAI',
    source_url: 'https://openai.com/sora',
    is_top: true,
    published_at: '2026-05-29T08:00:00Z'
  },
  {
    id: 'n_20260529_002',
    category: '案例',
    title: 'Nike 全 AI 生成東京奧運廣告 24h 破 8000 萬觀看',
    score: 4.5,
    credibility: 'B',
    one_line: 'Sora 生成影像 + ElevenLabs 配音 + 6 國語言同步上架',
    key_takeaway: '全球品牌首次完全以 AI 生成的廣告大片，製作週期從 3 個月壓縮到 2 週，預算僅傳統製作的 8%。觀眾接受度極高，意味著「混合製作」進入常態化。',
    actionable: '拆解該廣告前 3 秒的鏡頭運動 + 配樂節奏，套用到下一支短影音腳本。',
    audience: '行銷人,品牌主,廣告主',
    tags: 'Nike,廣告案例,全AI製作,奧運',
    company: 'Nike',
    source_url: 'https://www.nike.com/stories',
    is_top: true,
    published_at: '2026-05-29T05:30:00Z'
  },
  {
    id: 'n_20260529_003',
    category: '情報',
    title: '美國 FTC 發布 AI 廣告強制揭露準則',
    score: 4.3,
    credibility: 'A',
    one_line: '所有 AI 生成的人臉、聲音、產品圖需加機器可讀標籤',
    key_takeaway: '美 + 歐 + 中三大市場合規同步完成，違者最高罰 50,000 美元/則。台灣品牌跨境投放壓力大增，需立刻檢視內容生成 SOP。',
    actionable: '指派一位專人負責「AI 內容合規」，盤點現行素材是否符合三地標註規範。',
    audience: '行銷主管,法務,品牌主,HR',
    tags: 'FTC,合規,標註,美國',
    company: 'FTC',
    source_url: 'https://www.ftc.gov/news-events',
    is_top: true,
    published_at: '2026-05-29T03:00:00Z'
  },
  {
    id: 'n_20260529_004',
    category: '工具',
    title: 'Adobe Firefly Video 加入即時去背與角色替換',
    score: 3.9,
    credibility: 'A',
    one_line: '影片即時去背從 5-10 秒壓到 1 秒內',
    key_takeaway: '原本需要綠幕拍攝的場景現在任何素材都可即時合成，社群短影音剪輯生產力大幅提升，中小型團隊可挑戰 A 級視覺。',
    actionable: '用 Firefly Video 重製公司過去三支表現最好的廣告短片，比較剪輯時間差異。',
    audience: '創作者,影音剪輯師,行銷人',
    tags: 'Adobe,Firefly,去背,剪輯',
    company: 'Adobe',
    source_url: 'https://www.adobe.com/sensei',
    is_top: false,
    published_at: '2026-05-29T01:20:00Z'
  },
  {
    id: 'n_20260529_005',
    category: '案例',
    title: '某銀行 AI 客服影片導入後 NPS 提升 35%',
    score: 3.6,
    credibility: 'B',
    one_line: '24h 多語客服影片，6 個月內全分行導入',
    key_takeaway: '台灣金融業首例公開 AI 客服影片 NPS 數據。關鍵不是技術，而是把高頻 FAQ 拆成 200+ 短影片並建立用戶觸發邏輯。',
    actionable: '盤點公司客服 Top 30 FAQ，評估改造成 AI 影片 SOP 的可行性。',
    audience: 'HR,L&D,金融業,客服主管',
    tags: '客服,銀行,NPS,影片SOP',
    company: '某金融機構',
    source_url: 'https://www.bankofeast.com.tw/news',
    is_top: false,
    published_at: '2026-05-28T22:00:00Z'
  },
  {
    id: 'n_20260529_006',
    category: '教學',
    title: 'Veo 3 多視角 Prompt：camera control 進階用法',
    score: 3.7,
    credibility: 'A',
    one_line: 'wide → close-up → tracking shot 一鏡完成的 Prompt 結構',
    key_takeaway: '過去多視角需要剪接拼貼，Veo 3 的 camera control 讓單一 Prompt 就能控制連續鏡頭運動。三段結構：場景設定 + 主體動作 + 鏡頭運動曲線。',
    actionable: '複製本篇 Prompt 範本，套用到你下一支短影音的開場分鏡測試。',
    audience: '創作者,影音剪輯師,廣告人',
    tags: 'Veo,Prompt,camera,工作流',
    company: 'Google',
    source_url: 'https://blog.google/products/gemini',
    is_top: false,
    published_at: '2026-05-28T16:45:00Z'
  },
  {
    id: 'n_20260529_007',
    category: '情報',
    title: 'Anthropic 推 Claude 4.8 Video 模式（直接理解影片）',
    score: 3.4,
    credibility: 'A',
    one_line: 'LLM 可直接理解影片內容（不只字幕）',
    key_takeaway: '影片搜尋、自動剪輯、課程影片自動摘要等場景出現新可能。對企業培訓影片庫的可被檢索性是質變。',
    actionable: '思考公司現有影片資產（培訓、會議錄影）是否值得用 Video Mode 重新編目。',
    audience: 'HR,L&D,知識管理,企業決策者',
    tags: 'Claude,影片理解,LLM,Anthropic',
    company: 'Anthropic',
    source_url: 'https://www.anthropic.com/news',
    is_top: false,
    published_at: '2026-05-28T20:00:00Z'
  },
  {
    id: 'n_20260529_008',
    category: '情報',
    title: '中國抖音禁 AI 換臉名人內容上架',
    score: 2.8,
    credibility: 'B',
    one_line: '跟進歐美法規，違者帳號永久封禁',
    key_takeaway: '繼歐盟與美國後，中國平台完成法規執行。台灣品牌若有 KOL 或公眾人物相關 AI 內容需立刻審視。',
    actionable: '檢查內容團隊現有素材，下架可能違規的名人合成影像。',
    audience: '行銷主管,品牌主,法務',
    tags: '抖音,換臉,中國,合規',
    company: 'ByteDance',
    source_url: 'https://www.bytedance.com',
    is_top: false,
    published_at: '2026-05-28T14:00:00Z'
  }
];

const SAMPLE_SHARY_2026_05_29 = '今天三件事看起來分散，其實連成一條線：Sora 2.0 商用化讓全 AI 廣告變成可執行方案，Nike 用實際案例驗證觀眾接受度，FTC 規範把「揭露」從選項變成義務。給企業主：別等競品做了你才動。現在就拆出「AI 內製組 + 合規 SOP」雙軌，半年內你的廣告成本結構會跟對手拉開 30-50% 差距。';
