// AIAgent: local, no-paid-API conversational assistant using rule-based + small on-device model hooks
(function(){
  // Simple rule-based responses augmented with scripture search and lexicon/commentary hooks
  async function chat(prompt){
    const lower = prompt.toLowerCase();

    // Topic detection examples
    if (/dinosaur|behemoth|leviathan/.test(lower)){
      return respondWithDinosaurContext();
    }
    if (/why.*(evil|suffer)/.test(lower)){
      return respondWithTheodicy();
    }
    if (/evolution|creation/i.test(prompt)){
      return respondWithCreationEvolution();
    }
    if (/tithe|tithing/i.test(prompt)){
      return respondWithTithing();
    }
    if (/reading plan|devotional|plan/i.test(lower)){
      return generateReadingPlan(prompt);
    }

    // Fallback: do a scripture search and summarize
    const verses = await window.SearchAgent.search(prompt, 'keyword', window.__APP_STATE__.current.translation);
    if (verses.length){
      const top = verses.slice(0, 5).map(v => `<li><strong>${v.reference}</strong> — ${v.snippet}</li>`).join('');
      return `<p>I found passages related to your query:</p><ul>${top}</ul><p>Would you like me to assemble these into a short study plan?</p>`;
    }

    return `<p>I'm reflecting on your question. Could you rephrase or specify the passage or topic you have in mind?</p>`;
  }

  function respondWithDinosaurContext(){
    return [
      `<p>Scripture mentions powerful creatures like Behemoth and Leviathan, often discussed in relation to dinosaurs.</p>`,
      `<ul>`,
      `<li><strong>Job 40:15–24</strong> — Behemoth described with immense strength and a tail like a cedar.</li>`,
      `<li><strong>Job 41</strong> — Leviathan portrayed as a fearsome sea creature.</li>`,
      `</ul>`,
      `<p>Interpretations vary between literal creatures known to the ancient world and symbolic depictions of chaos. We can open these passages and examine Hebrew terms like behemoth (בהמות) and leviathan (לִוְיָתָן) in the lexicon.</p>`
    ].join('');
  }

  function respondWithTheodicy(){
    return [
      `<p>The problem of evil in Scripture is framed by God's sovereignty and human responsibility.</p>`,
      `<ul>`,
      `<li><strong>Genesis 50:20</strong> — God can turn intended evil for good.</li>`,
      `<li><strong>Deuteronomy 30:19</strong> — Human moral choice is real: choose life.</li>`,
      `<li><strong>Romans 8:28</strong> — God works all things together for good for those who love Him.</li>`,
      `<li><strong>James 1:13–15</strong> — God does not tempt with evil; desire gives birth to sin.</li>`,
      `</ul>`,
      `<p>We can study these passages with early Fathers like Augustine on free will and grace, comparing Pelagian debates for deeper context.</p>`
    ].join('');
  }

  function respondWithCreationEvolution(){
    return [
      `<p>On creation and evolution, Scripture emphasizes God as Creator while Christians debate mechanisms.</p>`,
      `<ul>`,
      `<li><strong>Genesis 1–2</strong> — Literary structure, Hebrew yom (day), and genre considerations.</li>`,
      `<li><strong>Psalm 104</strong> — Poetic cosmology praising God's providence.</li>`,
      `<li><strong>Romans 1:20</strong> — Creation reveals God's attributes.</li>`,
      `</ul>`,
      `<p>We can compare readings: young-earth, old-earth, and evolutionary creation. Church Fathers like Basil (Hexaemeron) and Augustine (On the Literal Meaning of Genesis) provide nuanced early perspectives.</p>`
    ].join('');
  }

  function respondWithTithing(){
    return [
      `<p>Tithing in Scripture spans Old Covenant practice and New Covenant generosity.</p>`,
      `<ul>`,
      `<li><strong>Genesis 14:20</strong> — Abram gives a tenth to Melchizedek.</li>`,
      `<li><strong>Malachi 3:10</strong> — Bring the full tithe... test me in this.</li>`,
      `<li><strong>Matthew 23:23</strong> — Jesus acknowledges tithing while prioritizing justice, mercy, faithfulness.</li>`,
      `<li><strong>2 Corinthians 9:6–8</strong> — Cheerful, generous giving under grace.</li>`,
      `</ul>`,
      `<p>Conclusion: While the New Testament emphasizes generous, willing giving, many Christians use 10% as a wise baseline.</p>`
    ].join('');
  }

  function generateReadingPlan(prompt){
    // Simple heuristic: detect theme and assemble passages
    const days = [
      { title: 'Day 1 — God as Creator', refs: ['Genesis 1', 'Psalm 19'] },
      { title: 'Day 2 — The Fall and Promise', refs: ['Genesis 3', 'Romans 5:12–21'] },
      { title: 'Day 3 — Faith and Covenant', refs: ['Genesis 12', 'Galatians 3'] },
      { title: 'Day 4 — Wisdom and Prayer', refs: ['Psalm 1', 'Matthew 6'] },
      { title: 'Day 5 — Life in Christ', refs: ['John 3', 'Romans 8'] },
      { title: 'Day 6 — The Spirit-filled Life', refs: ['Acts 2', 'Galatians 5'] },
      { title: 'Day 7 — Hope and Future', refs: ['Revelation 21–22'] },
    ];
    return `<p>Here is a 7-day personalized starter plan. We can refine it based on your circumstances:</p>` +
      '<ol>' + days.map(d => `<li><strong>${d.title}:</strong> ${d.refs.join('; ')}</li>`).join('') + '</ol>';
  }

  // Personal paraphrase generator using concordance and lexicon for contextual accuracy
  function generatePersonalParaphrase(verseText, reference, userStyle = 'modern') {
    // Extract key theological terms and their lexicon meanings
    const words = verseText.match(/\b[A-Za-z]+\b/g) || [];
    const lexicon = window.LEXICON || {};
    const keyTerms = [];
    
    // Identify theologically significant words that have lexicon entries
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (lexicon[lowerWord]) {
        keyTerms.push({
          original: word,
          lexical: lexicon[lowerWord],
          glosses: lexicon[lowerWord].glosses || [],
          senses: lexicon[lowerWord].senses || []
        });
      }
    });

    // Generate paraphrase suggestions based on user's conversational style
    let paraphrase = verseText;
    const styleGuides = {
      'modern': {
        'thee': 'you', 'thou': 'you', 'thy': 'your', 'thine': 'yours',
        'unto': 'to', 'hath': 'has', 'doth': 'does', 'verily': 'truly',
        'behold': 'look', 'therefore': 'so', 'wherein': 'in which'
      },
      'conversational': {
        'and it came to pass': 'then', 'came to pass': 'happened',
        'verily verily': 'I tell you the truth', 'fear not': "don't be afraid",
        'be not': "don't be", 'know ye not': "don't you know"
      },
      'contemporary': {
        'righteousness': 'living right with God', 'salvation': 'being saved/rescued',
        'justification': 'being made right with God', 'sanctification': 'growing in holiness',
        'propitiation': 'satisfaction for sin', 'redemption': 'buying back/rescue'
      }
    };

    // Apply style transformations while preserving meaning
    const guide = styleGuides[userStyle] || styleGuides['modern'];
    Object.entries(guide).forEach(([old, modern]) => {
      const regex = new RegExp(`\\b${old}\\b`, 'gi');
      paraphrase = paraphrase.replace(regex, modern);
    });

    // Create contextual notes for key terms
    const contextualNotes = keyTerms.map(term => {
      const primarySense = term.senses[0] || term.glosses[0] || term.original;
      return `<li><strong>${term.original}</strong>: ${primarySense} (${term.lexical.lang})</li>`;
    }).join('');

    return {
      originalText: verseText,
      paraphrase: paraphrase,
      keyTerms: keyTerms,
      contextualNotes: contextualNotes,
      styleUsed: userStyle,
      warning: "This paraphrase preserves original context while adapting language style. Always compare with established translations."
    };
  }

  // Enhanced chat function with paraphrase capability
  async function chatEnhanced(prompt) {
    const lower = prompt.toLowerCase();
    
    // Check if user wants a paraphrase
    if (/paraphrase|rephrase|my words|personal version|rewrite/i.test(prompt)) {
      // Try to extract verse reference from prompt
      const refMatch = prompt.match(/([A-Z][a-z]+ \d+:\d+)/);
      if (refMatch) {
        const reference = refMatch[1];
        const [book, chapVerse] = reference.split(' ');
        const [chapter, verse] = chapVerse.split(':');
        
        const verseData = await window.BibleAgent.getChapterAsync(window.__APP_STATE__.current.translation, book, parseInt(chapter));
        const verseObj = verseData.find(v => v.verse === parseInt(verse));
        
        if (verseObj) {
          const styleMatch = prompt.match(/(modern|conversational|contemporary)/i);
          const style = styleMatch ? styleMatch[1].toLowerCase() : 'modern';
          
          const result = generatePersonalParaphrase(verseObj.text, reference, style);
          
          return [
            `<div class="paraphrase-result">`,
            `<h4>Personal Paraphrase (${result.styleUsed} style)</h4>`,
            `<p><strong>Original:</strong> ${result.originalText}</p>`,
            `<p><strong>Your Version:</strong> <em>${result.paraphrase}</em></p>`,
            `<h5>Key Terms & Context:</h5>`,
            `<ul>${result.contextualNotes}</ul>`,
            `<p class="warning"><small>⚠️ ${result.warning}</small></p>`,
            `</div>`
          ].join('');
        }
      }
      
      return `<p>To create a personal paraphrase, please specify a verse reference like "paraphrase John 3:16 in modern style" or "rephrase Romans 8:28 conversationally".</p>`;
    }
    
    // Original chat functionality
    return chat(prompt);
  }

  window.AIAgent = { 
    chat: chatEnhanced, 
    generatePersonalParaphrase,
    // Legacy support
    chatOriginal: chat 
  };
})();