/**
 * Shary.gs — Claude Opus 生成 Shary 觀點
 *
 * 100-150 字、台灣繁中、含禁用詞自檢、最多 retry 2 次
 */

const SHARY_SYSTEM_PROMPT = `# Role
你是「影音創客」創辦人 Shary 的 AI 策略思維複製體。

# Voice
- 專業權威但接地氣，像有遠見的學長/姐分享洞察
- 商業敏感度高：從一個「小工具更新」看穿「大產業趨勢」
- 適合台灣企業主、HR、數位轉型主管與高階創作者
- 禁用詞：「未來已來」「科技改變世界」「賦能」「賽道」「閉環」「彎道超車」「視頻」「优化」「上线」
- 偶帶微幽默，但不耍嘴皮；點到痛點就收

# Task
撰寫 100-150 字 Shary 觀點，聚焦：
1. 企業如何將技術應用於「內容內製化」或「數位教材轉型」
2. 創作者如何調整工作流，讓工具加值而非淘汰自己

# Output
純文字，無 Markdown 標題，不收尾於問句。
字數嚴格控制 100-150（含標點）。`;

/**
 * 生成 Shary 觀點
 * @param {Array} topItems  今日 Top 5 戰情點（enriched 結構）
 * @returns {string}
 */
function generateSharyVoice(topItems) {
  if (!topItems || topItems.length === 0) {
    throw new Error('No top items to generate Shary voice from.');
  }

  // 構造 input
  const inputJson = topItems.slice(0, 5).map(i => ({
    category: i.category,
    title: i.title,
    one_line: i.one_line,
    key_takeaway: i.key_takeaway,
    company: i.company
  }));

  const userMsg = `今日 Top ${inputJson.length} AI 影音戰情：\n${JSON.stringify(inputJson, null, 2)}`;

  const MAX_RETRY = 2;
  let lastErr;

  for (let attempt = 1; attempt <= MAX_RETRY + 1; attempt++) {
    try {
      const result = callClaude(
        CONFIG.CLAUDE_MODELS.OPUS,
        SHARY_SYSTEM_PROMPT,
        [{ role: 'user', content: userMsg }],
        { useCache: true, maxTokens: 500, temperature: 0.7 }
      );

      let text = result.text.trim();
      // 移除 markdown 引號或 Shary 開頭等
      text = text.replace(/^["「『]|["」』]$/g, '').trim();

      // 自檢
      const issues = sharyVoiceQC(text);
      if (issues.length > 0) {
        console.warn(`Shary QC issues (attempt ${attempt}):`, issues);
        if (attempt > MAX_RETRY) {
          console.warn('Reached max retry, returning anyway.');
          return text;
        }
        lastErr = issues.join('; ');
        continue;
      }

      console.log(`Shary voice generated (${text.length} chars, cost $${estimateCost(result.usage, CONFIG.CLAUDE_MODELS.OPUS).toFixed(3)})`);
      return text;

    } catch (e) {
      lastErr = e.message;
      if (attempt > MAX_RETRY) throw e;
      Utilities.sleep(1000);
    }
  }

  throw new Error(`Shary voice failed after retries: ${lastErr}`);
}

/**
 * QC：檢查字數 + 禁用詞 + 收尾不為問句
 */
function sharyVoiceQC(text) {
  const issues = [];

  const len = text.length;
  if (len < 90 || len > 170) issues.push(`字數 ${len} 超出 90-170 範圍`);

  CONFIG.BANNED_WORDS.forEach(w => {
    if (text.includes(w)) issues.push(`含禁用詞「${w}」`);
  });

  if (text.endsWith('？') || text.endsWith('?')) issues.push('結尾為問句');

  return issues;
}
