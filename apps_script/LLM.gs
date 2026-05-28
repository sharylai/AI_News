/**
 * LLM.gs — 統一 Claude API 呼叫介面
 *
 * 對外 export：
 *   - callClaude(model, system, messages, options) — 主呼叫
 *   - callClaudeJson(model, system, userMsg, options) — 強制回傳 JSON 陣列/物件
 *   - embedText(text) — OpenAI embedding（去重用）
 */

/**
 * 主 Claude API 呼叫
 *
 * @param {string} model      CONFIG.CLAUDE_MODELS.HAIKU / SONNET / OPUS
 * @param {string} system     System prompt（支援 cache）
 * @param {Array}  messages   [{role: 'user'|'assistant', content: '...'}]
 * @param {Object} options    { maxTokens, temperature, useCache }
 */
function callClaude(model, system, messages, options = {}) {
  const apiKey = getApiKey('ANTHROPIC_API_KEY');
  const maxTokens = options.maxTokens || 2000;
  const temperature = options.temperature !== undefined ? options.temperature : 0.3;

  // System prompt 支援 cache control
  const systemBlock = options.useCache
    ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
    : system;

  const payload = {
    model: model,
    max_tokens: maxTokens,
    temperature: temperature,
    system: systemBlock,
    messages: messages
  };

  const resp = UrlFetchApp.fetch(CONFIG.CLAUDE_API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': CONFIG.CLAUDE_VERSION
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = resp.getResponseCode();
  if (code !== 200) {
    const body = resp.getContentText().slice(0, 500);
    throw new Error(`Claude API ${code}: ${body}`);
  }

  const data = JSON.parse(resp.getContentText());
  const text = data.content && data.content[0] && data.content[0].text;
  if (!text) throw new Error('Claude API empty response');

  return {
    text: text,
    usage: data.usage,
    stop_reason: data.stop_reason
  };
}

/**
 * 強制要求 Claude 回傳純 JSON
 * 自動 strip code fence、parse、回傳物件
 */
function callClaudeJson(model, system, userMsg, options = {}) {
  const sysWithJsonHint = system + '\n\n# CRITICAL: 只輸出純 JSON，不要加 ```json 標籤、不要說明文字。';

  const result = callClaude(model, sysWithJsonHint, [
    { role: 'user', content: userMsg }
  ], options);

  let raw = result.text.trim();

  // strip code fences if any
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  }

  try {
    return { data: JSON.parse(raw), usage: result.usage };
  } catch (e) {
    // 嘗試只抽取 JSON 陣列或物件
    const arrMatch = raw.match(/\[[\s\S]+\]/);
    const objMatch = raw.match(/\{[\s\S]+\}/);
    const extracted = arrMatch ? arrMatch[0] : (objMatch ? objMatch[0] : null);
    if (extracted) {
      try {
        return { data: JSON.parse(extracted), usage: result.usage };
      } catch (e2) {
        throw new Error(`Claude JSON parse 失敗：${e.message}\nRaw: ${raw.slice(0, 300)}`);
      }
    }
    throw new Error(`Claude JSON parse 失敗：${e.message}\nRaw: ${raw.slice(0, 300)}`);
  }
}

/**
 * OpenAI Embedding（去重用）
 *
 * @param {string} text
 * @returns {number[]} 1536 維向量
 */
function embedText(text) {
  const apiKey = getApiKey('OPENAI_API_KEY');
  const payload = {
    model: CONFIG.OPENAI_EMBED_MODEL,
    input: text.slice(0, 8000)
  };

  const resp = UrlFetchApp.fetch(CONFIG.OPENAI_EMBED_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error(`OpenAI Embedding ${resp.getResponseCode()}: ${resp.getContentText().slice(0, 200)}`);
  }

  return JSON.parse(resp.getContentText()).data[0].embedding;
}

/**
 * Cosine similarity（去重比對用）
 */
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * 估算成本（粗估）
 */
function estimateCost(usage, model) {
  if (!usage) return 0;
  const RATES = {
    'claude-haiku-4-5':  { input: 1.0, output: 5.0 },     // USD per 1M tokens
    'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
    'claude-opus-4-7':   { input: 15.0, output: 75.0 }
  };
  const rate = RATES[model] || { input: 0, output: 0 };
  return (
    (usage.input_tokens || 0) * rate.input / 1e6 +
    (usage.output_tokens || 0) * rate.output / 1e6
  );
}
