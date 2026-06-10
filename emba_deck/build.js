const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
p.author = "影音創客";
p.title = "AI Video News｜EMBA 專案報告";

// ===== 品牌色 =====
const INK = "111827";       // 深墨
const INK2 = "1F2937";
const YELLOW = "FBBF24";    // 品牌黃
const YELLOWD = "F59E0B";
const PAPER = "FFFFFF";
const SOFT = "F9FAFB";
const GRAY = "6B7280";
const LINE = "E5E7EB";
const HEAD = "Microsoft JhengHei";  // Windows 簡報通用
const BODY = "Microsoft JhengHei";

const W = 13.333, H = 7.5;

// 共用：黃色小圓 + 編號
function numCircle(s, x, y, n) {
  s.addShape(p.shapes.OVAL, { x, y, w: 0.5, h: 0.5, fill: { color: YELLOW } });
  s.addText(String(n), { x, y, w: 0.5, h: 0.5, align: "center", valign: "middle", fontFace: HEAD, fontSize: 18, bold: true, color: INK, margin: 0 });
}
// 共用：頁尾
function footer(s, idx) {
  s.addText("AI Video News｜影音創客 · EMBA 專案報告", { x: 0.6, y: 7.05, w: 9, h: 0.3, fontFace: BODY, fontSize: 9, color: GRAY, margin: 0 });
  s.addText(String(idx), { x: 12.4, y: 7.05, w: 0.4, h: 0.3, align: "right", fontFace: BODY, fontSize: 9, color: GRAY, margin: 0 });
}
// 共用：標題列（內容頁）
function head(s, kicker, title) {
  s.addText(kicker, { x: 0.6, y: 0.45, w: 11, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: YELLOWD, charSpacing: 2, margin: 0 });
  s.addText(title, { x: 0.6, y: 0.74, w: 12, h: 0.7, fontFace: HEAD, fontSize: 30, bold: true, color: INK, margin: 0 });
}

// =========================================================
// Slide 1 — 封面（深色）
// =========================================================
let s = p.addSlide();
s.background = { color: INK };
s.addShape(p.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.18, fill: { color: YELLOW } });
s.addImage({ path: "../assets/logo.png", x: 0.85, y: 1.5, w: 4.2, h: 1.4, sizing: { type: "contain", w: 4.2, h: 1.4 } });
s.addText("每日 8 點 ｜ AI 影音趨勢雷達", { x: 0.9, y: 2.95, w: 9, h: 0.4, fontFace: HEAD, fontSize: 16, color: YELLOW, bold: true, margin: 0 });
s.addText("自動化 AI 影音情報系統", { x: 0.9, y: 3.7, w: 11.5, h: 0.9, fontFace: HEAD, fontSize: 44, bold: true, color: PAPER, margin: 0 });
s.addText("由 AI 自主運作、每日產出產業情報與社群素材的全自動內容系統", { x: 0.9, y: 4.7, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 16, color: "CBD5E1", margin: 0 });
s.addText([
  { text: "EMBA 專案報告", options: { bold: true, color: INK } },
], { x: 0.9, y: 5.55, w: 2.8, h: 0.5, fontFace: HEAD, fontSize: 15, align: "center", valign: "middle", fill: { color: YELLOW }, margin: 0 });
s.addText("線上運作中：sharylai.github.io/AI_News　|　影音創客監製", { x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: BODY, fontSize: 12, color: GRAY, margin: 0 });

// =========================================================
// Slide 2 — 專案緣起與定位
// =========================================================
s = p.addSlide(); s.background = { color: PAPER };
head(s, "01　專案緣起", "從「資訊焦慮」到「行動轉化」");
// 左：痛點
s.addText("產業痛點", { x: 0.6, y: 1.7, w: 5.6, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: INK, margin: 0 });
[["每天追新工具太累", "工具幾乎每週更新，資訊分散各處"],
 ["看不懂技術規格", "不知道如何轉化為商業應用"],
 ["缺乏系統化整理", "沒有人把知識轉成可行動的決策"]].forEach((it, i) => {
  const y = 2.2 + i * 1.0;
  s.addShape(p.shapes.RECTANGLE, { x: 0.6, y, w: 5.7, h: 0.85, fill: { color: SOFT }, line: { color: LINE, width: 1 } });
  s.addShape(p.shapes.RECTANGLE, { x: 0.6, y, w: 0.07, h: 0.85, fill: { color: YELLOW } });
  s.addText(it[0], { x: 0.85, y: y + 0.1, w: 5.3, h: 0.35, fontFace: HEAD, fontSize: 14, bold: true, color: INK, margin: 0 });
  s.addText(it[1], { x: 0.85, y: y + 0.44, w: 5.3, h: 0.35, fontFace: BODY, fontSize: 11, color: GRAY, margin: 0 });
});
// 右：定位（深色塊）
s.addShape(p.shapes.RECTANGLE, { x: 6.7, y: 1.7, w: 6, h: 4.4, fill: { color: INK } });
s.addText("產品定位", { x: 7.05, y: 2.0, w: 5.3, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: YELLOW, margin: 0 });
s.addText("「每天 8 點，幫你把全球 AI 影音情報，轉化為立刻可用的創作靈感與商業行動。」",
  { x: 7.05, y: 2.5, w: 5.3, h: 1.6, fontFace: HEAD, fontSize: 20, bold: true, color: PAPER, lineSpacingMultiple: 1.2, margin: 0 });
s.addText("核心差異化", { x: 7.05, y: 4.3, w: 5.3, h: 0.35, fontFace: HEAD, fontSize: 13, bold: true, color: YELLOW, margin: 0 });
s.addText([
  { text: "不做 ", options: {} }, { text: "翻譯 與 摘要", options: { color: "94A3B8" } },
  { text: "　而做　", options: {} }, { text: "洞察 與 行動轉化", options: { bold: true, color: YELLOW } },
], { x: 7.05, y: 4.7, w: 5.3, h: 0.5, fontFace: BODY, fontSize: 14, color: PAPER, margin: 0 });
s.addText("目標：影音創客 · 行銷人 · 企業 HR/L&D · AI 工具玩家", { x: 7.05, y: 5.45, w: 5.3, h: 0.4, fontFace: BODY, fontSize: 11, color: "94A3B8", margin: 0 });
footer(s, 2);

// =========================================================
// Slide 3 — 系統架構總覽
// =========================================================
s = p.addSlide(); s.background = { color: PAPER };
head(s, "02　系統架構", "採集 → 判斷 → 撰寫 → 發佈，全程由 AI 自主完成");
const layers = [
  ["資料輸入層", "RSS 官方部落格　·　Tavily 關鍵字搜尋　·　YouTube Data API　·　社群與媒體", "1B4965"],
  ["AI 核心處理層", "Claude 三層分工：Haiku 過濾 → Sonnet 評分/分類/摘要 → Sonnet 撰寫觀點　＋　真實性防線", INK],
  ["輸出與儲存層", "Google Sheets 資料庫 → 網站即時呈現　·　社群圖文 → Google Drive + Email", "166534"],
];
let yy = 1.85;
layers.forEach((L, i) => {
  s.addShape(p.shapes.RECTANGLE, { x: 1.6, y: yy, w: 10.1, h: 1.25, fill: { color: L[2] } });
  s.addText(L[0], { x: 1.9, y: yy + 0.18, w: 9.6, h: 0.45, fontFace: HEAD, fontSize: 19, bold: true, color: YELLOW, margin: 0 });
  s.addText(L[1], { x: 1.9, y: yy + 0.66, w: 9.5, h: 0.5, fontFace: BODY, fontSize: 12.5, color: "E5E7EB", margin: 0 });
  if (i < 2) s.addShape(p.shapes.RECTANGLE, { x: 6.55, y: yy + 1.25, w: 0.2, h: 0.28, fill: { color: YELLOWD } });
  yy += 1.55;
});
s.addText("設計哲學：全程使用免費或近零成本的雲端服務，無自建伺服器、無維運人力", { x: 1.6, y: 6.55, w: 10.1, h: 0.4, align: "center", fontFace: BODY, fontSize: 12, italic: true, color: GRAY, margin: 0 });
footer(s, 3);

// =========================================================
// Slide 4 — 六大內容板塊
// =========================================================
s = p.addSlide(); s.background = { color: PAPER };
head(s, "03　內容設計", "六大內容板塊：資訊 → 洞察 → 行動的閉環");
const blocks = [
  ["AI 新視野", "AI 模擬創辦人觀點，撰寫 100–150 字產業洞察"],
  ["今日三大戰情點", "當日最具衝擊力 3 件事，含為什麼重要 + 今日行動"],
  ["趨勢。商業。創新", "Top 快報，每則 50–100 字摘要 + 評分 + 可信度"],
  ["AI 製片實戰", "YouTube/社群/媒體的 AI 影片製作教學案例，每日 3 則"],
  ["每日 AI 金句", "電影海報風，真實 AI 名人名言 24 位輪替"],
  ["歷史封存 + 搜尋", "完整資料庫，可依工具/分類/日期檢索"],
];
const cw = 3.85, ch = 1.85, gx = 0.35, gy = 0.3, ox = 0.6, oy = 1.75;
blocks.forEach((b, i) => {
  const c = i % 3, r = Math.floor(i / 3);
  const x = ox + c * (cw + gx), y = oy + r * (ch + gy);
  s.addShape(p.shapes.RECTANGLE, { x, y, w: cw, h: ch, fill: { color: SOFT }, line: { color: LINE, width: 1 } });
  s.addShape(p.shapes.RECTANGLE, { x, y, w: cw, h: 0.09, fill: { color: YELLOW } });
  numCircle(s, x + 0.25, y + 0.3, i + 1);
  s.addText(b[0], { x: x + 0.85, y: y + 0.32, w: cw - 1.0, h: 0.5, fontFace: HEAD, fontSize: 16, bold: true, color: INK, valign: "middle", margin: 0 });
  s.addText(b[1], { x: x + 0.25, y: y + 0.95, w: cw - 0.5, h: 0.8, fontFace: BODY, fontSize: 11.5, color: GRAY, lineSpacingMultiple: 1.15, margin: 0 });
});
footer(s, 4);

// =========================================================
// Slide 5 — 技術堆疊與工具
// =========================================================
s = p.addSlide(); s.background = { color: PAPER };
head(s, "04　技術堆疊", "使用的工具：全程免費或近零成本的雲端生態");
const rows = [
  ["排程引擎", "Google Apps Script 時間觸發器", "免費"],
  ["AI 核心", "Anthropic Claude API（Haiku / Sonnet）", "依用量"],
  ["去重比對", "OpenAI Embedding", "極低"],
  ["資料抓取", "Tavily API · YouTube Data API · RSS", "免費額度"],
  ["資料庫", "Google Sheets", "免費"],
  ["網站前端 / 託管", "Alpine.js + Tailwind（無 build）/ GitHub Pages", "免費"],
  ["社群素材", "Google Slides API + Python 圖卡生成", "免費"],
  ["通知 / 備援", "Gmail 寄送 · GitHub Actions 備援觸發", "免費"],
];
const tbl = [[
  { text: "角色", options: { fill: { color: INK }, color: YELLOW, bold: true, fontFace: HEAD, fontSize: 13, align: "left", valign: "middle" } },
  { text: "採用工具", options: { fill: { color: INK }, color: YELLOW, bold: true, fontFace: HEAD, fontSize: 13, align: "left", valign: "middle" } },
  { text: "成本", options: { fill: { color: INK }, color: YELLOW, bold: true, fontFace: HEAD, fontSize: 13, align: "center", valign: "middle" } },
]];
rows.forEach((r, i) => {
  const bg = i % 2 ? SOFT : PAPER;
  tbl.push([
    { text: r[0], options: { fill: { color: bg }, color: INK, bold: true, fontFace: BODY, fontSize: 12.5, align: "left", valign: "middle" } },
    { text: r[1], options: { fill: { color: bg }, color: INK2, fontFace: BODY, fontSize: 12, align: "left", valign: "middle" } },
    { text: r[2], options: { fill: { color: bg }, color: YELLOWD, bold: true, fontFace: BODY, fontSize: 11.5, align: "center", valign: "middle" } },
  ]);
});
s.addTable(tbl, { x: 0.6, y: 1.75, w: 12.1, colW: [2.6, 7.3, 2.2], rowH: 0.52, border: { type: "solid", pt: 1, color: LINE } });
footer(s, 5);

// =========================================================
// Slide 6 — AI 模型三層分工
// =========================================================
s = p.addSlide(); s.background = { color: PAPER };
head(s, "05　AI 分工", "Claude 三層分工：成本與品質的平衡");
const tiers = [
  ["Claude Haiku", "大量初篩過濾", "量大、便宜、速度快\n每天篩 100+ 則原始資料", "1B4965"],
  ["Claude Sonnet", "評分 · 分類 · 摘要 · 觀點", "品質與成本最佳平衡\n撰寫繁中洞察與行動建議", INK],
  ["OpenAI Embedding", "標題去重", "便宜、效果好\n避免同則新聞重複出現", "166534"],
];
tiers.forEach((t, i) => {
  const x = 0.6 + i * 4.1, y = 1.9;
  s.addShape(p.shapes.RECTANGLE, { x, y, w: 3.85, h: 4.0, fill: { color: t[3] } });
  s.addText("第 " + (i + 1) + " 層", { x: x + 0.3, y: y + 0.3, w: 3.2, h: 0.35, fontFace: HEAD, fontSize: 12, bold: true, color: YELLOW, margin: 0 });
  s.addText(t[0], { x: x + 0.3, y: y + 0.72, w: 3.3, h: 0.5, fontFace: HEAD, fontSize: 19, bold: true, color: PAPER, margin: 0 });
  s.addText(t[1], { x: x + 0.3, y: y + 1.4, w: 3.3, h: 0.7, fontFace: HEAD, fontSize: 14, bold: true, color: YELLOW, margin: 0 });
  s.addShape(p.shapes.LINE, { x: x + 0.3, y: y + 2.2, w: 3.2, h: 0, line: { color: "FFFFFF", width: 1, transparency: 70 } });
  s.addText(t[2], { x: x + 0.3, y: y + 2.4, w: 3.3, h: 1.3, fontFace: BODY, fontSize: 12, color: "E5E7EB", lineSpacingMultiple: 1.25, margin: 0 });
});
footer(s, 6);

// =========================================================
// Slide 7 — 真實性防線
// =========================================================
s = p.addSlide(); s.background = { color: PAPER };
head(s, "06　品質控制", "真實性防線：杜絕 AI 幻覺、守住品牌信任");
const defs = [
  ["可信度分級 A–D", "只有 A/B 級（官方、主流媒體）自動發佈；C/D 級（單一社群爆料）自動隔離至待人工確認，不上線。"],
  ["來源網域驗證", "宣稱「某公司發布」的消息，原文網址須與該公司官方網域相符，否則自動攔截。源於一次實際攔截到的假消息。"],
  ["嚴禁幻覺 Prompt", "摘要必須完全基於原文，不可捏造功能或數據；不確定時使用「據官方說法」「報導指出」避責。"],
];
defs.forEach((d, i) => {
  const y = 1.85 + i * 1.35;
  s.addShape(p.shapes.RECTANGLE, { x: 0.6, y, w: 8.5, h: 1.15, fill: { color: SOFT }, line: { color: LINE, width: 1 } });
  numCircle(s, 0.85, y + 0.33, i + 1);
  s.addText(d[0], { x: 1.5, y: y + 0.18, w: 7.4, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: INK, margin: 0 });
  s.addText(d[1], { x: 1.5, y: y + 0.55, w: 7.4, h: 0.55, fontFace: BODY, fontSize: 11.5, color: GRAY, lineSpacingMultiple: 1.1, margin: 0 });
});
// 右側 管理意涵
s.addShape(p.shapes.RECTANGLE, { x: 9.4, y: 1.85, w: 3.3, h: 3.65, fill: { color: INK } });
s.addText("管理意涵", { x: 9.7, y: 2.15, w: 2.8, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: YELLOW, margin: 0 });
s.addText("在 AI 自動化系統中，「可信度治理」比「產量」更重要。寧可少推、精準，也不冒品牌信任的風險。",
  { x: 9.7, y: 2.65, w: 2.8, h: 2.6, fontFace: HEAD, fontSize: 16, bold: true, color: PAPER, lineSpacingMultiple: 1.35, margin: 0 });
footer(s, 7);

// =========================================================
// Slide 8 — 雙重自動觸發
// =========================================================
s = p.addSlide(); s.background = { color: PAPER };
head(s, "07　可靠性設計", "雙重自動觸發：確保每日不中斷");
// 兩個觸發器卡
const trig = [
  ["主觸發器", "每天 08:00", "Google Apps Script", "正常每天執行的主力", YELLOW, INK],
  ["備援觸發器", "每天 08:35", "GitHub Actions", "偵測主觸發器漏跑 → 自動補上", INK, PAPER],
];
trig.forEach((t, i) => {
  const x = 0.6 + i * 4.15, y = 1.9;
  s.addShape(p.shapes.RECTANGLE, { x, y, w: 3.9, h: 2.5, fill: { color: t[4] }, line: { color: LINE, width: 1 } });
  s.addText(t[1], { x: x + 0.3, y: y + 0.28, w: 3.3, h: 0.5, fontFace: HEAD, fontSize: 24, bold: true, color: t[5], margin: 0 });
  s.addText(t[0], { x: x + 0.3, y: y + 0.95, w: 3.3, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: t[5], margin: 0 });
  s.addText(t[2], { x: x + 0.3, y: y + 1.4, w: 3.3, h: 0.35, fontFace: BODY, fontSize: 12, color: (i ? "94A3B8" : INK2), margin: 0 });
  s.addText(t[3], { x: x + 0.3, y: y + 1.78, w: 3.3, h: 0.55, fontFace: BODY, fontSize: 11.5, color: (i ? "CBD5E1" : GRAY), margin: 0 });
});
// 冪等設計
s.addShape(p.shapes.RECTANGLE, { x: 9.0, y: 1.9, w: 3.7, h: 2.5, fill: { color: SOFT }, line: { color: YELLOWD, width: 1.5 } });
s.addText("冪等設計", { x: 9.3, y: 2.15, w: 3.1, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: YELLOWD, margin: 0 });
s.addText([
  { text: "主觸發成功 → ", options: {} }, { text: "備援自動跳過", options: { bold: true, color: INK } }, { text: "（不重複）", options: { breakLine: true, color: GRAY } },
  { text: "主觸發失敗 → ", options: { breakLine: false } }, { text: "備援自動補跑", options: { bold: true, color: INK } },
], { x: 9.3, y: 2.65, w: 3.1, h: 1.6, fontFace: BODY, fontSize: 12.5, color: INK2, lineSpacingMultiple: 1.3, margin: 0 });
// 底部結論
s.addShape(p.shapes.RECTANGLE, { x: 0.6, y: 4.7, w: 12.1, h: 1.3, fill: { color: INK } });
s.addText("管理意涵", { x: 0.9, y: 4.95, w: 3, h: 0.4, fontFace: HEAD, fontSize: 13, bold: true, color: YELLOW, margin: 0 });
s.addText("兩個觸發器分屬不同平台、不同時間，同時失效機率極低。可靠性從「會出錯」提升到「自我修復」。",
  { x: 0.9, y: 5.35, w: 11.5, h: 0.5, fontFace: HEAD, fontSize: 15, bold: true, color: PAPER, margin: 0 });
footer(s, 8);

// =========================================================
// Slide 9 — 資料來源（收集平台）
// =========================================================
s = p.addSlide(); s.background = { color: PAPER };
head(s, "08　資料來源", "收集的平台：多源情報採集");
const src = [
  ["官方部落格", "OpenAI · Google DeepMind · Hugging Face · Google AI Blog", "RSS"],
  ["科技媒體", "TechCrunch · The Verge · MIT Tech Review · Ars Technica · VentureBeat · Engadget", "RSS"],
  ["關鍵字搜尋", "全球新聞：AI video / Sora / Runway / 影片生成 等中英關鍵字", "Tavily API"],
  ["影音教學案例", "YouTube：AI 影片製作 · 工作流 · Prompt 教學", "YouTube Data API"],
  ["社群與媒體", "Threads · Instagram · 小紅書（人工精選補充）", "半自動"],
];
src.forEach((r, i) => {
  const y = 1.8 + i * 0.96;
  s.addShape(p.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.82, fill: { color: i % 2 ? SOFT : PAPER }, line: { color: LINE, width: 1 } });
  s.addText(r[0], { x: 0.85, y: y + 0.1, w: 2.4, h: 0.6, fontFace: HEAD, fontSize: 15, bold: true, color: INK, valign: "middle", margin: 0 });
  s.addText(r[1], { x: 3.4, y: y + 0.1, w: 7.0, h: 0.6, fontFace: BODY, fontSize: 12, color: GRAY, valign: "middle", margin: 0 });
  s.addText(r[2], { x: 10.5, y: y + 0.16, w: 2.0, h: 0.5, fontFace: HEAD, fontSize: 11, bold: true, color: INK, align: "center", valign: "middle", fill: { color: YELLOW }, margin: 0 });
});
footer(s, 9);

// =========================================================
// Slide 10 — 成本分析
// =========================================================
s = p.addSlide(); s.background = { color: PAPER };
head(s, "09　成本分析", "用一杯咖啡的成本，取代一個小編團隊");
// 大數字
s.addShape(p.shapes.RECTANGLE, { x: 0.6, y: 1.9, w: 5.6, h: 4.0, fill: { color: INK } });
s.addText("每月實際成本", { x: 0.9, y: 2.2, w: 5, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: YELLOW, margin: 0 });
s.addText([{ text: "$2–3", options: { fontSize: 80, bold: true, color: PAPER } }], { x: 0.9, y: 2.7, w: 5, h: 1.5, fontFace: HEAD, align: "left", margin: 0 });
s.addText("約新台幣 75–95 元 / 月", { x: 0.9, y: 4.3, w: 5, h: 0.4, fontFace: BODY, fontSize: 15, color: "CBD5E1", margin: 0 });
s.addText("無人力 · 無伺服器 · 無維運", { x: 0.9, y: 5.1, w: 5, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: YELLOW, margin: 0 });
// 對照
s.addText("成本對照", { x: 6.6, y: 1.95, w: 6, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: INK, margin: 0 });
const comp = [["原始規劃（n8n + 付費服務）", "$47–77", GRAY], ["最終實作", "$2–3", YELLOWD]];
comp.forEach((c, i) => {
  const y = 2.5 + i * 1.0;
  s.addShape(p.shapes.RECTANGLE, { x: 6.6, y, w: 6.1, h: 0.82, fill: { color: SOFT }, line: { color: LINE, width: 1 } });
  s.addText(c[0], { x: 6.85, y: y + 0.1, w: 4.0, h: 0.6, fontFace: BODY, fontSize: 13, color: INK2, valign: "middle", margin: 0 });
  s.addText(c[1], { x: 10.7, y: y + 0.1, w: 1.8, h: 0.6, fontFace: HEAD, fontSize: 18, bold: true, color: c[2], align: "right", valign: "middle", margin: 0 });
});
s.addShape(p.shapes.RECTANGLE, { x: 6.6, y: 4.65, w: 6.1, h: 1.25, fill: { color: YELLOW } });
s.addText([{ text: "節省約 ", options: { color: INK, fontSize: 18, bold: true } }, { text: "95%", options: { color: INK, fontSize: 30, bold: true } }],
  { x: 6.85, y: 4.85, w: 5.6, h: 0.5, fontFace: HEAD, valign: "middle", margin: 0 });
s.addText("善用 AI ＋ 免費雲端生態，取代過去需要團隊的內容生產", { x: 6.85, y: 5.4, w: 5.6, h: 0.4, fontFace: BODY, fontSize: 11.5, color: INK2, margin: 0 });
footer(s, 10);

// =========================================================
// Slide 11 — 商業價值與管理啟示
// =========================================================
s = p.addSlide(); s.background = { color: PAPER };
head(s, "10　EMBA 觀點", "商業價值與管理啟示");
const ins = [
  ["內製化已被驗證", "過去需編輯團隊的每日快報 + 社群素材，現可由 AI 全自動完成，成本降 95% 以上。"],
  ["AI 在放大、不在取代", "把人力從採集整理，釋放到策略判斷與創意——AI 還做不到的高價值環節。"],
  ["可信度治理是落地關鍵", "真實性防線正是企業導入 AI 時最易忽略、卻最致命的風險控管。"],
];
ins.forEach((it, i) => {
  const y = 1.85 + i * 1.18;
  s.addShape(p.shapes.RECTANGLE, { x: 0.6, y, w: 7.6, h: 1.0, fill: { color: SOFT }, line: { color: LINE, width: 1 } });
  s.addShape(p.shapes.RECTANGLE, { x: 0.6, y, w: 0.08, h: 1.0, fill: { color: YELLOW } });
  s.addText(it[0], { x: 0.9, y: y + 0.13, w: 7.1, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: INK, margin: 0 });
  s.addText(it[1], { x: 0.9, y: y + 0.52, w: 7.1, h: 0.45, fontFace: BODY, fontSize: 11.5, color: GRAY, margin: 0 });
});
// 右：可複製方法論
s.addShape(p.shapes.RECTANGLE, { x: 8.5, y: 1.85, w: 4.2, h: 3.55, fill: { color: INK } });
s.addText("可複製的方法論", { x: 8.8, y: 2.15, w: 3.6, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: YELLOW, margin: 0 });
s.addText([
  { text: "多源採集", options: { breakLine: true, bold: true, color: PAPER } },
  { text: "AI 分層處理", options: { breakLine: true, bold: true, color: PAPER } },
  { text: "可信度治理", options: { breakLine: true, bold: true, color: PAPER } },
  { text: "多通道發佈", options: { breakLine: true, bold: true, color: PAPER } },
  { text: "跨平台冗餘", options: { bold: true, color: PAPER } },
], { x: 8.8, y: 2.65, w: 3.6, h: 2.0, fontFace: HEAD, fontSize: 16, color: PAPER, lineSpacingMultiple: 1.35, margin: 0 });
s.addText("可遷移到金融、醫療、法律、零售等任何每日情報場景", { x: 8.8, y: 4.85, w: 3.6, h: 0.5, fontFace: BODY, fontSize: 11, italic: true, color: "94A3B8", margin: 0 });
footer(s, 11);

// =========================================================
// Slide 12 — 結論（深色）
// =========================================================
s = p.addSlide(); s.background = { color: INK };
s.addShape(p.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.18, fill: { color: YELLOW } });
s.addText("結論", { x: 0.9, y: 1.3, w: 11, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: YELLOW, charSpacing: 3, margin: 0 });
s.addText("一個人，用接近零的成本，\n建立並維運過去需要團隊的全自動內容系統。",
  { x: 0.9, y: 1.85, w: 11.5, h: 1.6, fontFace: HEAD, fontSize: 33, bold: true, color: PAPER, lineSpacingMultiple: 1.2, margin: 0 });
const pts = [
  ["架構設計", "把昂貴的人力與伺服器，用 AI 與免費生態取代"],
  ["品質治理", "用真實性防線守住品牌信任"],
  ["可靠工程", "用跨平台冗餘確保不中斷"],
];
pts.forEach((pt, i) => {
  const x = 0.9 + i * 4.0;
  s.addShape(p.shapes.RECTANGLE, { x, y: 4.0, w: 3.7, h: 1.5, fill: { color: INK2 } });
  s.addShape(p.shapes.RECTANGLE, { x, y: 4.0, w: 3.7, h: 0.08, fill: { color: YELLOW } });
  s.addText(pt[0], { x: x + 0.3, y: 4.25, w: 3.1, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: YELLOW, margin: 0 });
  s.addText(pt[1], { x: x + 0.3, y: 4.7, w: 3.1, h: 0.7, fontFace: BODY, fontSize: 12, color: "E5E7EB", lineSpacingMultiple: 1.15, margin: 0 });
});
s.addText("AI 時代的核心競爭力——不是誰擁有最強的工具，而是誰能把工具組織成穩定、可信、可規模化的系統。",
  { x: 0.9, y: 5.95, w: 11.5, h: 0.7, fontFace: HEAD, fontSize: 15, italic: true, color: YELLOW, margin: 0 });
s.addText("sharylai.github.io/AI_News　|　影音創客監製", { x: 0.9, y: 6.95, w: 11, h: 0.35, fontFace: BODY, fontSize: 11, color: GRAY, margin: 0 });

// =========================================================
// 演講備忘稿（上台講稿，只有講者看得到）
// =========================================================
const notes = {
1: `【開場 30 秒】
各位老師、同學好。今天要分享的是我做的一個專案——AI Video News，一個「會自己每天工作」的全自動 AI 影音情報系統。
它每天早上 8 點，自動把全球最新的 AI 影音資訊，整理成可以直接行動的情報，發佈到網站、生成社群素材、寄到我信箱——全程沒有人介入。
這個專案我想分享的不只是「做了什麼」，而是「AI 時代，一個人可以用多低的成本，做到過去一個團隊才能做的事」。`,
2: `【緣起 1 分鐘】
先講為什麼做。AI 影音這個領域，工具幾乎每週更新，資訊爆炸。但真正的痛點不是資訊太少——是太多、太雜、看不懂、也沒時間轉成決策。
所以我給這個產品的定位很明確（指右邊）：不做翻譯、不做摘要，而是做「洞察」跟「行動轉化」。
重點不是告訴你發生什麼事，而是告訴你「這對你的生意代表什麼，今天可以做什麼」。`,
3: `【架構 1 分鐘】
系統架構分三層：採集、AI 處理、輸出。（由上往下指）
上層多源採集；中層是核心——用 Claude 做三層 AI 處理，加上真實性防線；下層輸出到網站、社群、Email。
一句話總結設計哲學：全程用免費或近零成本的雲端服務，沒有自建伺服器、沒有維運人力。這是後面成本能壓到極低的關鍵。`,
4: `【六大板塊 1 分半】
網站每天自動產出六個區塊，形成「資訊到行動」的閉環。（快速掃過六塊）
我特別講三個：① AI 新視野——AI 模擬我的觀點寫產業洞察；④ AI 製片實戰——自動從 YouTube 抓 AI 影片製作教學；⑤ 每日金句——電影海報風格，用真實 AI 名人名言。
重點是：這六塊每天「自動生成」，不是我寫的。`,
5: `【工具 1 分鐘】
這是完整的工具清單。各位注意最右邊一欄「成本」——幾乎全部是「免費」。
排程、資料庫、網站、託管、社群素材、通知、備援，全部零成本。唯一花錢的只有 AI 模型那一塊。
這就是「站在巨人肩膀上」——用免費的雲端生態，把基礎設施成本降到零。`,
6: `【AI 分工 1 分鐘】
這頁是成本控制的核心智慧：不是所有任務都用最貴的模型。
大量初篩用便宜的 Haiku；需要品質的評分跟撰寫用 Sonnet；去重用更便宜的 Embedding。
就像企業用人——粗活交給效率工具，關鍵決策才用最強的資源。分層分工，品質跟成本同時顧到。`,
7: `【真實性防線 1 分半】★重點頁
這頁是我最想強調的。AI 自動化最大的風險是「幻覺」——它會一本正經地講假話。如果系統每天自動發佈假情報，品牌信任就毀了。
所以我設了三道防線：可信度分級、來源網域驗證、嚴禁幻覺的指令。
（指右邊）管理意涵是：在 AI 系統裡，「可信度治理」比「產量」更重要。寧可少推、精準，也不冒信任的風險。這是企業導入 AI 最容易忽略、卻最致命的一點。`,
8: `【雙重觸發 1 分鐘】★工程亮點
分享一個真實故事：上線後有一天，主觸發器突然漏跑，那天沒有更新。
我的解法不是「每天盯著」，而是加一道「跨平台備援」——Google 的主觸發器 8 點跑，GitHub 的備援 8 點 35 補位。
關鍵是「冪等設計」：主觸發成功，備援自動跳過；主觸發失敗，備援自動補跑。兩個系統不會同時壞。
管理意涵：可靠性從「會出錯」提升到「自我修復」。`,
9: `【資料來源 40 秒】
快速帶過收集的平台：官方部落格、科技媒體、關鍵字搜尋、YouTube、社群媒體。
重點是「多源」——不依賴單一來源，所以即使某個來源失效，系統還是有料。`,
10: `【成本 1 分鐘】★震撼頁
這頁請大家記住一個數字（指大數字）：每月 2 到 3 美元，台幣不到 100 元。
（指右邊）原本規劃要 47 到 77 美元，最終實作壓到 2 到 3，省了 95%。
更重要的是隱性成本趨近於零——無人力、無伺服器、無維運。
一句話：用一杯咖啡的錢，取代過去一個小編團隊的工作。`,
11: `【EMBA 觀點 1 分半】★管理結論
從管理的角度，我歸納三個啟示：
一、內容內製化已經被驗證可行；二、AI 的價值在「放大」人、不在取代——它把人從雜事釋放到策略跟創意；三、可信度治理是 AI 落地的關鍵門檻。
（指右邊）而且這套方法論可以複製——多源採集、AI 分層、可信度治理、多通道發佈、跨平台冗餘。同樣的架構可以搬到金融、醫療、零售任何每日情報的場景。`,
12: `【結語 40 秒】
最後總結。這個專案證明了一件事：一個人，用接近零的成本，可以建立並維運過去需要團隊的系統。
關鍵不在工具多貴，而在三件事：架構設計、品質治理、可靠工程。
（念出黃字）AI 時代的核心競爭力，不是誰擁有最強的工具，而是誰能把工具組織成穩定、可信、可規模化的系統。
謝謝大家，歡迎提問。`,
};
p.slides.forEach((sl, i) => { if (notes[i + 1]) sl.addNotes(notes[i + 1]); });

p.writeFile({ fileName: "AI_Video_News_EMBA簡報.pptx" }).then(f => console.log("✅ 已生成（含講稿）：" + f));
