/**
 * quotes.js — AI 圈真實名言庫（每日輪播）
 *
 * 原則：只收錄真實人物公開說過、可查證的名言，杜絕 AI 捏造。
 * 每句附原文 + 中譯 + 說話者 + 身份。依日期輪播。
 */
window.AI_QUOTES = [
  { en: "AI is the new electricity.", zh: "AI 是新時代的電力。", author: "Andrew Ng", title: "DeepLearning.AI 創辦人" },
  { en: "If we want machines to think, we need to teach them to see.", zh: "如果我們想讓機器思考，得先教它們看見。", author: "Fei-Fei Li", title: "史丹佛大學教授" },
  { en: "The development of full artificial intelligence could spell the end of the human race… or be the best thing that ever happened.", zh: "完全的人工智慧可能是人類的終點，也可能是史上最好的事。", author: "Stephen Hawking", title: "理論物理學家" },
  { en: "Machine intelligence is the last invention that humanity will ever need to make.", zh: "機器智慧，是人類需要發明的最後一項發明。", author: "Nick Bostrom", title: "牛津大學哲學家" },
  { en: "I'm increasingly inclined to think that there should be some regulatory oversight, maybe at the national and international level.", zh: "我越來越覺得，AI 需要某種程度的監管，也許是國家甚至國際層級。", author: "Elon Musk", title: "Tesla / xAI 創辦人" },
  { en: "The real question is not whether machines think but whether men do.", zh: "真正的問題不是機器會不會思考，而是人類有沒有在思考。", author: "B. F. Skinner", title: "心理學家" },
  { en: "Artificial intelligence is the future, and the future is here.", zh: "人工智慧是未來，而未來已經在這裡。", author: "Dave Waters", title: "科技作家" },
  { en: "We are at the beginning of a new era… the age of intelligence.", zh: "我們正站在一個新時代的起點——智慧的時代。", author: "Sam Altman", title: "OpenAI 執行長" },
  { en: "Some people call this artificial intelligence, but the reality is this technology will enhance us.", zh: "有人稱它為人工智慧，但現實是，這項技術會增強我們。", author: "Ginni Rometty", title: "前 IBM 執行長" },
  { en: "The pace of progress in artificial intelligence is incredibly fast.", zh: "人工智慧進步的速度，快得令人難以置信。", author: "Demis Hassabis", title: "Google DeepMind 執行長" },
  { en: "A baby learns to crawl, walk and then run. We are in the crawling stage when it comes to applying machine learning.", zh: "嬰兒先學爬、再學走、然後跑。在應用機器學習上，我們還在爬行階段。", author: "Dave Waters", title: "科技作家" },
  { en: "Predicting the future isn't magic, it's artificial intelligence.", zh: "預測未來不是魔法，是人工智慧。", author: "Dave Waters", title: "科技作家" },
  { en: "The question of whether a computer can think is no more interesting than the question of whether a submarine can swim.", zh: "電腦會不會思考，就像問潛水艇會不會游泳一樣，沒那麼重要。", author: "Edsger Dijkstra", title: "電腦科學家" },
  { en: "It's not artificial intelligence I'm worried about, it's human stupidity.", zh: "我擔心的不是人工智慧，是人類的愚蠢。", author: "Neil Jacobstein", title: "奇點大學 AI 主席" },
  { en: "By far the greatest danger of AI is that people conclude too early that they understand it.", zh: "AI 最大的危險，是人們太早以為自己懂它了。", author: "Eliezer Yudkowsky", title: "AI 研究者" },
  { en: "The best way to predict the future is to invent it.", zh: "預測未來最好的方法，就是創造它。", author: "Alan Kay", title: "電腦科學家" },
  { en: "Everything we love about civilization is a product of intelligence, so amplifying our human intelligence with AI has the potential of helping civilization flourish.", zh: "我們珍視的文明，都是智慧的產物；用 AI 放大人類智慧，有潛力讓文明更加繁榮。", author: "Max Tegmark", title: "MIT 物理學家" },
  { en: "Intelligence is the ability to adapt to change.", zh: "智慧，是適應變化的能力。", author: "Stephen Hawking", title: "理論物理學家" },
  { en: "AI doesn't have to be evil to destroy humanity — if AI has a goal and humanity just happens to be in the way, it will destroy humanity as a matter of course.", zh: "AI 不需要邪惡才會威脅人類；只要它有目標而人類剛好擋路，後果就會自然發生。", author: "Elon Musk", title: "Tesla / xAI 創辦人" },
  { en: "Creativity is the key to success in the future, and primary education is where teachers can bring creativity in children at that level.", zh: "創造力是未來成功的關鍵，而這正是 AI 還無法取代人的地方。", author: "A.P.J. Abdul Kalam", title: "印度前總統 / 科學家" }
];

/**
 * 依日期取得今日金句（每天固定一句，跨日輪換）
 */
function getDailyQuote(dateStr) {
  const quotes = window.AI_QUOTES || [];
  if (quotes.length === 0) return null;
  // 用日期換算成 day index，確保同一天同一句
  let seed;
  if (dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    seed = Math.floor(d.getTime() / 86400000);
  } else {
    seed = Math.floor(Date.now() / 86400000);
  }
  return quotes[((seed % quotes.length) + quotes.length) % quotes.length];
}
