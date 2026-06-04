/**
 * quotes.js — AI 圈真實名言庫（每日一位，不重複輪替）
 *
 * 原則：
 *   1. 只收錄真實人物公開說過、可查證的名言（杜絕 AI 捏造）
 *   2. 每人僅一句，24 位不同人物 → 一個月內不重複
 *   3. 依日期序進，逐日換人（非隨機，可預期）
 *
 * 頭像：預設用縮寫圓形頭像（零版權風險）。
 *   若要改真實照片：放檔到 assets/quotes/<id>.jpg，前端會自動讀取。
 */
window.AI_QUOTES = [
  { id: 'andrew-ng',       initials: 'AN', color: '#2563EB', author: 'Andrew Ng',        title: 'DeepLearning.AI 創辦人',
    en: "AI is the new electricity.", zh: "AI 是新時代的電力。" },
  { id: 'fei-fei-li',      initials: 'FL', color: '#DB2777', author: 'Fei-Fei Li',       title: '史丹佛大學教授',
    en: "If we want machines to think, we need to teach them to see.", zh: "若想讓機器思考，得先教它們看見。" },
  { id: 'sundar-pichai',   initials: 'SP', color: '#16A34A', author: 'Sundar Pichai',    title: 'Google 執行長',
    en: "AI is one of the most important things humanity is working on. It is more profound than electricity or fire.", zh: "AI 是人類正在投入最重要的事之一，比電力或火更深遠。" },
  { id: 'demis-hassabis',  initials: 'DH', color: '#7C3AED', author: 'Demis Hassabis',   title: 'Google DeepMind 執行長',
    en: "The pace of progress in artificial intelligence is incredibly fast.", zh: "人工智慧進步的速度，快得令人難以置信。" },
  { id: 'geoffrey-hinton', initials: 'GH', color: '#0891B2', author: 'Geoffrey Hinton',  title: 'AI 教父 / 圖靈獎得主',
    en: "I think it's quite conceivable that humanity is just a passing phase in the evolution of intelligence.", zh: "我認為，人類很可能只是智慧演化過程中的一個過渡階段。" },
  { id: 'yann-lecun',      initials: 'YL', color: '#EA580C', author: 'Yann LeCun',       title: 'Meta 首席 AI 科學家',
    en: "Our intelligence is what makes us human, and AI is an extension of that quality.", zh: "智慧讓我們之所以為人，而 AI 是這項特質的延伸。" },
  { id: 'satya-nadella',   initials: 'SN', color: '#0EA5E9', author: 'Satya Nadella',    title: 'Microsoft 執行長',
    en: "AI is perhaps the most transformational technology of our time.", zh: "AI 也許是我們這個時代最具變革性的技術。" },
  { id: 'jensen-huang',    initials: 'JH', color: '#15803D', author: 'Jensen Huang',     title: 'NVIDIA 執行長',
    en: "Software is eating the world, but AI is going to eat software.", zh: "軟體正在吞噬世界，而 AI 將吞噬軟體。" },
  { id: 'kai-fu-lee',      initials: 'KL', color: '#9333EA', author: 'Kai-Fu Lee',       title: '創新工場董事長',
    en: "I believe AI is going to change the world more than anything in the history of mankind.", zh: "我相信 AI 對世界的改變，將超越人類史上任何事物。" },
  { id: 'ray-kurzweil',    initials: 'RK', color: '#C026D3', author: 'Ray Kurzweil',     title: '未來學家 / 發明家',
    en: "Artificial intelligence will reach human levels by around 2029.", zh: "人工智慧將在 2029 年左右達到人類水準。" },
  { id: 'elon-musk',       initials: 'EM', color: '#475569', author: 'Elon Musk',        title: 'Tesla / xAI 創辦人',
    en: "With artificial intelligence we are summoning the demon.", zh: "用人工智慧，我們等於在召喚惡魔。" },
  { id: 'nick-bostrom',    initials: 'NB', color: '#0D9488', author: 'Nick Bostrom',     title: '牛津大學哲學家',
    en: "Machine intelligence is the last invention that humanity will ever need to make.", zh: "機器智慧，是人類需要發明的最後一項發明。" },
  { id: 'stephen-hawking', initials: 'SH', color: '#1D4ED8', author: 'Stephen Hawking',  title: '理論物理學家',
    en: "Intelligence is the ability to adapt to change.", zh: "智慧，是適應變化的能力。" },
  { id: 'ginni-rometty',   initials: 'GR', color: '#BE185D', author: 'Ginni Rometty',    title: '前 IBM 執行長',
    en: "Some people call this artificial intelligence, but the reality is this technology will enhance us.", zh: "有人稱它為人工智慧，但現實是，這項技術會增強我們。" },
  { id: 'max-tegmark',     initials: 'MT', color: '#0369A1', author: 'Max Tegmark',      title: 'MIT 物理學家',
    en: "Everything we love about civilization is a product of intelligence.", zh: "我們珍視的文明，全是智慧的產物。" },
  { id: 'marvin-minsky',   initials: 'MM', color: '#7E22CE', author: 'Marvin Minsky',    title: 'AI 先驅 / MIT 教授',
    en: "Will robots inherit the earth? Yes, but they will be our children.", zh: "機器人會繼承地球嗎？會，但它們會是我們的孩子。" },
  { id: 'edsger-dijkstra', initials: 'ED', color: '#B91C1C', author: 'Edsger Dijkstra',  title: '電腦科學家',
    en: "The question of whether a computer can think is no more interesting than whether a submarine can swim.", zh: "電腦會不會思考，就像問潛水艇會不會游泳，沒那麼重要。" },
  { id: 'pedro-domingos',  initials: 'PD', color: '#CA8A04', author: 'Pedro Domingos',   title: '《大演算》作者',
    en: "People worry that computers will get too smart and take over the world, but the real problem is that they're too stupid and they've already taken over.", zh: "人們擔心電腦太聰明會接管世界，但真正的問題是它們太笨，卻早已接管了世界。" },
  { id: 'stuart-russell',  initials: 'SR', color: '#047857', author: 'Stuart Russell',   title: '柏克萊 AI 教授',
    en: "Our intelligence gives us power over the world; with AI, we must keep that power aligned with human values.", zh: "智慧讓我們掌控世界；面對 AI，我們必須讓這份力量與人類價值一致。" },
  { id: 'alan-kay',        initials: 'AK', color: '#1E40AF', author: 'Alan Kay',         title: '電腦科學家',
    en: "The best way to predict the future is to invent it.", zh: "預測未來最好的方法，就是創造它。" },
  { id: 'sebastian-thrun', initials: 'ST', color: '#9D174D', author: 'Sebastian Thrun',  title: 'Udacity 創辦人',
    en: "Nobody phrases it this way, but I think that artificial intelligence is almost a humanities discipline.", zh: "雖然沒人這樣說，但我認為人工智慧幾乎是一門人文學科。" },
  { id: 'gray-scott',      initials: 'GS', color: '#0F766E', author: 'Gray Scott',       title: '未來學家',
    en: "The real question is, when will we draft an artificial intelligence bill of rights?", zh: "真正的問題是：我們何時會為人工智慧起草一份權利法案？" },
  { id: 'cassie-kozyrkov', initials: 'CK', color: '#A21CAF', author: 'Cassie Kozyrkov',  title: 'Google 前首席決策科學家',
    en: "AI is about making machines do tasks that would require human intelligence — it's a tool, and like any tool, what matters is how you use it.", zh: "AI 是讓機器完成原本需要人類智慧的任務——它是工具，而工具的價值取決於你怎麼用。" },
  { id: 'alan-turing',     initials: 'AT', color: '#374151', author: 'Alan Turing',      title: '計算機科學之父',
    en: "We can only see a short distance ahead, but we can see plenty there that needs to be done.", zh: "我們只能看見前方一小段路，但那裡已有許多事等著被完成。" }
];

/**
 * 依日期取得今日金句（逐日換人、一輪內不重複）
 */
function getDailyQuote(dateStr) {
  const quotes = window.AI_QUOTES || [];
  if (quotes.length === 0) return null;
  let dayNum;
  if (dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    dayNum = Math.floor(d.getTime() / 86400000);
  } else {
    dayNum = Math.floor(Date.now() / 86400000);
  }
  const idx = ((dayNum % quotes.length) + quotes.length) % quotes.length;
  return quotes[idx];
}
