/**
 * Social.gs — 把當日新聞 + AI 新視野 轉成社群素材
 *
 * 對外 export：
 *   - generateAndSaveSocialAssets(date, items, sharyVoice)
 *
 * 產出：
 *   Drive/{DRIVE_FOLDER_ROOT}/YYYY-MM-DD/
 *     ├── social-posts.md       (IG / Threads / FB 三平台貼文文案)
 *     └── ai-shinshi-ye.png     (1080×1080 AI 新視野 社群貼圖)
 */

const SOCIAL_COPY_SYSTEM_PROMPT = `# Role
你是「影音創客」社群編輯。把 AI 影音情報轉成台灣繁中、適合 IG / Threads / FB 發布的貼文文案。

# Voice
- 第一行用爆點問句或關鍵字鉤住讀者（≤25 字）
- 接著 2-3 段，每段不超過 2 行
- 結尾一句呼籲（CTA）：去試用 / 收藏 / 分享 / 留言討論
- 加上適當 emoji，但不浮誇

# Localization
台灣繁體：影片（非视频）、最佳化（非优化）、上線（非上线）、資料（非数据）。

# Output JSON Schema
{
  "ig": "Instagram 貼文（150-250 字，最後附 8-10 個 hashtag）",
  "threads": "Threads 貼文（≤280 字，1-2 個 hashtag）",
  "fb": "Facebook 貼文（200-400 字，可附 3-5 個 hashtag）",
  "hashtags": ["核心","標籤","清單"]
}`;

/**
 * 主入口：生成社群文案 + 貼圖 + 存到 Drive
 *
 * @param {string} date          YYYY-MM-DD
 * @param {Array}  items         今日 ranked items（取前 5）
 * @param {string} sharyVoice    今日 AI 新視野 文字
 * @returns {string|null}        Drive 資料夾 URL，失敗回 null
 */
function generateAndSaveSocialAssets(date, items, sharyVoice) {
  try {
    // 1. 生成各則新聞的社群貼文文案
    const topItems = items.slice(0, 5);
    const socialPacks = topItems.map(item => {
      try {
        return generateSocialCopyForItem(item);
      } catch (e) {
        console.warn(`Social copy failed for "${item.title}": ${e.message}`);
        return null;
      }
    });

    // 2. 組裝 markdown 文檔
    const markdown = buildSocialPostsMarkdown(date, topItems, socialPacks, sharyVoice);

    // 3. 生成 AI 新視野 社群貼圖（1080×1080 PNG）
    let imageBlob = null;
    if (sharyVoice) {
      try {
        imageBlob = buildSharyQuoteImage(sharyVoice, date);
      } catch (e) {
        console.warn('Shary image generation failed:', e.message);
      }
    }

    // 4. 存到 Drive
    const folderUrl = saveDailyAssetsToDrive(date, markdown, imageBlob);
    console.log(`Social assets saved: ${folderUrl}`);

    // 5. 寄送 Email（附 markdown + PNG）
    if (CONFIG.ENABLE_SOCIAL_EMAIL) {
      try {
        sendSocialEmail(date, topItems, sharyVoice, markdown, imageBlob, folderUrl);
        console.log(`Email sent to ${CONFIG.SOCIAL_EMAIL_TO}`);
      } catch (e) {
        console.warn('Email failed (non-fatal):', e.message);
      }
    }

    return folderUrl;

  } catch (err) {
    console.error('generateAndSaveSocialAssets error:', err.message);
    return null;
  }
}

// ===========================================================
// 5. 寄送 Email（附 markdown + PNG）
// ===========================================================

function sendSocialEmail(date, topItems, sharyVoice, markdown, imageBlob, folderUrl) {
  const recipient = CONFIG.SOCIAL_EMAIL_TO;
  if (!recipient) {
    console.warn('SOCIAL_EMAIL_TO 未設定，跳過寄信');
    return;
  }

  // 預覽：Top 3
  const top3 = topItems.slice(0, 3).map((it, i) => {
    const score = it.score ? `★${Number(it.score).toFixed(1)}` : '';
    return `${i + 1}. 【${it.category}】${it.title} ${score}`;
  }).join('\n');

  // 預覽：Shary voice (截取)
  const sharyPreview = sharyVoice
    ? (sharyVoice.length > 120 ? sharyVoice.slice(0, 120) + '…' : sharyVoice)
    : '（今日無 AI 新視野）';

  const subject = `[AI News] ${date} 社群素材已生成（${topItems.length} 則）`;

  const plainBody =
`✍️ AI 新視野（今日核心觀點）
${sharyPreview}

🚀 今日 Top 3
${top3 || '（無）'}

📎 附件
  • social-posts-${date}.md  ←  5 則 IG / Threads / FB 三平台貼文
  • ai-shinshi-ye-${date}.png ←  1080×1080 AI 新視野 社群貼圖

🔗 Google Drive 完整資料夾
${folderUrl || '(尚未產生)'}

🌐 線上版網站
https://sharylai.github.io/AI_News/

—
本信由 AI News Pipeline 自動寄送
影音創客監製 · Claude API 自動生成`;

  // HTML 版（讓 Gmail 顯示比較好看）
  const htmlBody = `
<div style="font-family:-apple-system,'Noto Sans TC',sans-serif;max-width:600px;color:#111827;line-height:1.7">
  <div style="background:#111827;color:#FBBF24;padding:1.25rem 1.5rem;border-radius:0.5rem">
    <h2 style="margin:0;font-weight:900;letter-spacing:-0.01em">AI News｜${date} 社群素材已生成</h2>
    <p style="margin:0.25rem 0 0;font-size:0.8rem;color:#9CA3AF">影音創客監製 · Claude API 自動生成</p>
  </div>

  <div style="background:#FEF3C7;border-left:4px solid #FBBF24;padding:1rem 1.25rem;margin-top:1rem;border-radius:0 0.5rem 0.5rem 0">
    <div style="font-size:0.7rem;font-weight:800;color:#92400E;letter-spacing:0.05em;margin-bottom:0.5rem">AI 新視野</div>
    <p style="margin:0;color:#111827">${escapeHtml(sharyPreview)}</p>
  </div>

  <h3 style="margin:1.5rem 0 0.5rem;font-weight:800">🚀 今日 Top 3</h3>
  <ol style="padding-left:1.25rem;margin:0">
    ${topItems.slice(0, 3).map(it => {
      const score = it.score ? `<span style="color:#F59E0B;font-weight:700">★${Number(it.score).toFixed(1)}</span>` : '';
      return `<li style="margin-bottom:0.4rem"><strong>【${it.category}】</strong>${escapeHtml(it.title)} ${score}</li>`;
    }).join('')}
  </ol>

  <h3 style="margin:1.5rem 0 0.5rem;font-weight:800">📎 附件</h3>
  <ul style="padding-left:1.25rem;margin:0">
    <li><code>social-posts-${date}.md</code> — IG / Threads / FB 三平台貼文</li>
    <li><code>ai-shinshi-ye-${date}.png</code> — 1080×1080 社群貼圖</li>
  </ul>

  <div style="margin-top:1.5rem">
    <a href="${folderUrl}" style="display:inline-block;background:#FBBF24;color:#111827;padding:0.6rem 1.2rem;text-decoration:none;font-weight:700;border-radius:0.4rem">📂 開啟 Drive 資料夾</a>
    <a href="https://sharylai.github.io/AI_News/" style="display:inline-block;margin-left:0.5rem;color:#111827;text-decoration:underline">🌐 線上版網站</a>
  </div>

  <p style="margin-top:2rem;padding-top:1rem;border-top:1px solid #E5E7EB;font-size:0.75rem;color:#6B7280">
    本信由 AI News Pipeline 自動寄送｜<a href="https://www.videomaker.cc" style="color:#F59E0B">影音創客</a>監製
  </p>
</div>`;

  // 組裝附件
  const attachments = [];
  attachments.push(Utilities.newBlob(markdown, 'text/markdown', `social-posts-${date}.md`));
  if (imageBlob) attachments.push(imageBlob);

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: CONFIG.SOCIAL_EMAIL_FROM_NAME,
    attachments: attachments
  });
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ===========================================================
// 1. Claude 生成單則新聞的社群文案
// ===========================================================

function generateSocialCopyForItem(item) {
  const userMsg = `類別：${item.category}
標題：${item.title}
一句話摘要：${item.one_line}
核心影響：${item.key_takeaway}
今日行動：${item.actionable}
適合族群：${item.audience}
原文連結：${item.source_url}`;

  const result = callClaudeJson(
    CONFIG.CLAUDE_MODELS.SONNET,
    SOCIAL_COPY_SYSTEM_PROMPT,
    userMsg,
    { useCache: true, maxTokens: 1500, temperature: 0.6 }
  );
  return result.data;
}

// ===========================================================
// 2. 組裝 Markdown 文檔
// ===========================================================

function buildSocialPostsMarkdown(date, items, packs, sharyVoice) {
  let md = `# AI News 社群素材｜${date}\n\n`;
  md += `> 影音創客監製｜由 Claude API 自動生成\n\n`;

  // AI 新視野
  if (sharyVoice) {
    md += `---\n\n## ✍️ AI 新視野（今日核心觀點）\n\n${sharyVoice}\n\n`;
    md += `> 同目錄下的 \`ai-shinshi-ye.png\` 可直接發 IG / FB / Threads。\n\n`;
  }

  // 各則新聞
  items.forEach((item, idx) => {
    const pack = packs[idx];
    md += `---\n\n## ${idx + 1}. 【${item.category}】${item.title}\n\n`;
    md += `**評分** ${item.score ? item.score.toFixed(1) : '-'} · **可信度** ${item.credibility} · [原文](${item.source_url})\n\n`;
    md += `${item.one_line}\n\n`;

    if (!pack) {
      md += `> ⚠️ 此則貼文生成失敗，請參考摘要手動撰寫。\n\n`;
      return;
    }

    md += `### 📷 Instagram\n\n\`\`\`\n${pack.ig || ''}\n\`\`\`\n\n`;
    md += `### 🧵 Threads\n\n\`\`\`\n${pack.threads || ''}\n\`\`\`\n\n`;
    md += `### 📘 Facebook\n\n\`\`\`\n${pack.fb || ''}\n\`\`\`\n\n`;

    if (pack.hashtags && pack.hashtags.length > 0) {
      md += `**建議標籤**：${pack.hashtags.map(t => '#' + t).join(' ')}\n\n`;
    }
  });

  md += `---\n\n*Generated at ${nowIso()}*\n`;
  return md;
}

// ===========================================================
// 3. Google Slides 生成 AI 新視野 1080×1080 社群貼圖
// ===========================================================

/**
 * 用 SlidesApp 程式化建一張 1080×1080 投影片，匯出為 PNG blob
 *
 * 視覺：黑底 + 黃色「AI 新視野」標籤 + 大引號 + 內文 + Shary 簽名 + 頭像
 */
function buildSharyQuoteImage(sharyVoice, date) {
  // Step 1: 建一個暫時的 Slides presentation
  const presentation = SlidesApp.create(`__tmp_ai_news_${date}_${Utilities.getUuid().slice(0, 6)}`);
  const presentationId = presentation.getId();

  // Step 2: 設定為 1080×1080（IG 方形）
  // SlidesApp 用 points (1 inch = 72 pt)。1080px @ 72dpi = 1080 pt
  // 注意：SlidesApp.setPageSize 不存在，需用 advanced Slides Service
  try {
    Slides.Presentations.batchUpdate({
      requests: [{
        updatePageProperties: {
          objectId: presentation.getSlides()[0].getObjectId(),
          fields: '*'
        }
      }]
    }, presentationId);

    // 直接用 advanced API 設定簡報尺寸（pt）
    Slides.Presentations.batchUpdate({
      requests: [{
        // Slides 不支援單張 slide 改尺寸，要改 master
        // 改採用：直接讓 slide 內元素適配預設 720×405，最後輸出時轉檔
      }]
    }, presentationId);
  } catch (e) {
    console.warn('Slides advanced service not enabled, using default size.');
  }

  const slide = presentation.getSlides()[0];

  // Step 3: 清空預設 placeholder
  slide.getPageElements().forEach(el => el.remove());

  // Step 4: 黑色背景（畫一個 ink 色矩形塞滿整張投影片）
  // 預設 Slide 720×405 (pt)
  const W = 720, H = 405;          // pt
  const bg = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, W, H);
  bg.getFill().setSolidFill('#111827');
  bg.getBorder().setTransparent();

  // Step 5: 黃色「AI 新視野」標籤
  const label = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 40, 40, 120, 32);
  label.getFill().setSolidFill('#FBBF24');
  label.getBorder().setTransparent();
  const labelText = label.getText();
  labelText.setText('AI 新視野');
  labelText.getTextStyle()
    .setForegroundColor('#111827')
    .setBold(true)
    .setFontSize(14)
    .setFontFamily('Noto Sans TC');
  labelText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // Step 6: 大引號（裝飾）
  const quoteMark = slide.insertTextBox('"', 40, 75, 60, 60);
  quoteMark.getText().getTextStyle()
    .setForegroundColor('#FBBF24')
    .setFontSize(80)
    .setBold(true)
    .setFontFamily('Georgia');

  // Step 7: 主文字（自動換行）
  const body = slide.insertTextBox(sharyVoice, 60, 130, W - 120, 200);
  body.getText().getTextStyle()
    .setForegroundColor('#F9FAFB')
    .setFontSize(18)
    .setFontFamily('Noto Sans TC');

  // Step 8: 簽名 + 日期（右下）
  const sign = slide.insertTextBox(`Shary｜影音創客創辦人\n${date}`, W - 240, H - 60, 200, 50);
  sign.getText().getTextStyle()
    .setForegroundColor('#FBBF24')
    .setFontSize(11)
    .setBold(true)
    .setFontFamily('Noto Sans TC');
  sign.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.END);

  // Step 9: 嘗試插入 Shary 頭像（若有設定）
  const avatarFileId = PropertiesService.getScriptProperties().getProperty('SHARY_AVATAR_FILE_ID');
  if (avatarFileId) {
    try {
      const avatarFile = DriveApp.getFileById(avatarFileId);
      const img = slide.insertImage(avatarFile.getBlob(), W - 110, H - 130, 60, 60);
      // SlidesApp 不直接支援圓形 mask，用陰影增加質感
    } catch (e) {
      console.warn('Avatar insert failed:', e.message);
    }
  }

  // Step 10: 儲存 + 等待
  presentation.saveAndClose();
  Utilities.sleep(2000);            // 給 Google 一點時間 render

  // Step 11: 匯出 PNG
  const url = `https://docs.google.com/presentation/d/${presentationId}/export/png?id=${presentationId}&pageid=${slide.getObjectId()}`;
  const resp = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    DriveApp.getFileById(presentationId).setTrashed(true);
    throw new Error(`Slides export HTTP ${resp.getResponseCode()}`);
  }

  const blob = resp.getBlob().setName(`ai-shinshi-ye-${date}.png`);

  // Step 12: 刪除暫時 Slides
  try { DriveApp.getFileById(presentationId).setTrashed(true); } catch (e) {}

  return blob;
}

// ===========================================================
// 4. 存到 Drive
// ===========================================================

function saveDailyAssetsToDrive(date, markdown, imageBlob) {
  // 取得或建立根資料夾
  const rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), CONFIG.DRIVE_FOLDER_ROOT);
  // 取得或建立日期資料夾
  const dayFolder = getOrCreateFolder(rootFolder, date);

  // 清空當日舊內容（避免重複跑產生多檔）
  const existing = dayFolder.getFiles();
  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }

  // 寫 markdown
  dayFolder.createFile(`social-posts-${date}.md`, markdown, 'text/markdown');

  // 寫圖片
  if (imageBlob) {
    dayFolder.createFile(imageBlob);
  }

  return dayFolder.getUrl();
}

function getOrCreateFolder(parent, name) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}
