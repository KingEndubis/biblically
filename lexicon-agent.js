// LexiconAgent: Hebrew/Greek/Aramaic/Latin lookup with concordance ids (offline subset)
(function(){
  let currentWord = null;
  let currentVerseText = '';
  
  // Word mappings to handle common inflections and alternate forms
  const WORD_MAPPINGS = {
    // Common English verb forms
    'created': 'created',
    'creates': 'created',
    'creating': 'created',
    'loves': 'loved',
    'loving': 'loved',
    'believes': 'believe',
    'believing': 'believe',
    'believed': 'believe',
    'saves': 'saved',
    'saving': 'saved',
    'save': 'saved',
    'sends': 'sent',
    'sending': 'sent',
    'send': 'sent',
    'gives': 'gave',
    'giving': 'gave',
    'give': 'gave',
    'given': 'gave',
    'condemns': 'condemn',
    'condemning': 'condemn',
    'condemned': 'condemn',
    'judges': 'condemn',
    'judging': 'condemn',
    'judge': 'condemn',
    'judged': 'condemn',
    'perishes': 'perish',
    'perishing': 'perish',
    'perished': 'perish',
    'born': 'born',
    'births': 'born',
    'bearing': 'born',
    'bear': 'born',
    'bore': 'born',
    'worships': 'worship',
    'worshiping': 'worship',
    'worshipped': 'worship',
    'worshiped': 'worship',
    
    // Plurals and possessives
    'gods': 'god',
    'lords': 'lord',
    'sons': 'son',
    'lights': 'light',
    'waters': 'water',
    'heavens': 'heaven',
    'earths': 'earth',
    'spirits': 'spirit',
    'men': 'man',
    'souls': 'soul',
    'covenants': 'covenant',
    'sins': 'sin',
    'works': 'works', // keep as is, it's already in lexicon
    'churches': 'church',
    'apostles': 'apostle',
    'creations': 'creation',
    
    // Alternate spellings and forms
    'jesus\'': 'jesus',
    'christ\'s': 'christ',
    'god\'s': 'god',
    'lord\'s': 'lord',
    'man\'s': 'man',
    'world\'s': 'world',
    'everyone': 'whosoever',
    'anyone': 'whosoever',
    'all': 'whosoever',
    'everybody': 'whosoever',
    'somebody': 'whosoever',
    'someone': 'whosoever',
    'everlasting': 'eternal',
    'forever': 'eternal',
    'endless': 'eternal',
    'immortal': 'eternal',
    'agape': 'loved',
    'philadelphia': 'loved',
    'phileo': 'loved',
    'trust': 'believe',
    'faith': 'believe',
    'trusts': 'believe',
    'trusting': 'believe',
    'trusted': 'believe',
    'rescue': 'saved',
    'deliver': 'saved',
    'deliverance': 'saved',
    'salvation': 'saved',
    'rescues': 'saved',
    'delivers': 'saved',
    'delivered': 'saved',
    'rescued': 'saved',
    'kosmos': 'world',
    'universe': 'world',
    'humanity': 'world',
    'mankind': 'world',
    'people': 'world',
    'nations': 'world',
    'gentiles': 'world',
    'huios': 'son',
    'child': 'son',
    'offspring': 'son',
    'begotten': 'son',
    'only-begotten': 'only',
    'unique': 'only',
    'one': 'only',
    'single': 'only',
    'sole': 'only',
    'commissioned': 'sent',
    'dispatched': 'sent',
    'appointed': 'sent',
    'messiah': 'christ',
    'anointed': 'christ',
    'savior': 'jesus',
    'redeemer': 'jesus',
    'master': 'lord',
    'sovereign': 'lord',
    'ruler': 'lord',
    'owner': 'lord',
    'kyrios': 'lord',
    'adonai': 'lord',
    'yahweh': 'lord',
    'jehovah': 'lord',
    'unmerited': 'grace',
    'favor': 'grace',
    'kindness': 'grace',
    'goodness': 'grace',
    'charis': 'grace',
    'deed': 'works',
    'deeds': 'works',
    'action': 'works',
    'actions': 'works',
    'labor': 'works',
    'labors': 'works',
    'effort': 'works',
    'efforts': 'works',
    'assembly': 'church',
    'congregation': 'church',
    'ekklesia': 'church',
    'body': 'church',
    'messenger': 'apostle',
    'envoy': 'apostle',
    'missionary': 'apostle',
    'good-news': 'gospel',
    'glad-tidings': 'gospel',
    'message': 'gospel',
    'euangelion': 'gospel',
    'strength': 'power',
    'might': 'power',
    'ability': 'power',
    'dunamis': 'power',
    'dynamite': 'power',
    'force': 'power',
    'energy': 'power',
    'justice': 'righteousness',
    'rightness': 'righteousness',
    'dikaiosune': 'righteousness',
    'justification': 'righteousness',
    'uprightness': 'righteousness',
    'unveiling': 'revelation',
    'disclosure': 'revelation',
    'apokalypse': 'revelation',
    'apocalypse': 'revelation',
    'revealing': 'revelation',
    'anger': 'wrath',
    'fury': 'wrath',
    'orge': 'wrath',
    'indignation': 'wrath',
    'judgment': 'wrath',
    'creature': 'creation',
    'creatures': 'creation',
    'created-thing': 'creation',
    'created-things': 'creation',
    'ktisis': 'creation',
    'unseen': 'invisible',
    'hidden': 'invisible',
    'aoratos': 'invisible',
    'spiritual': 'invisible',
    'divinity': 'godhead',
    'deity': 'godhead',
    'divine-nature': 'godhead',
    'theiotes': 'godhead',
    'inexcusable': 'excuse',
    'without-defense': 'excuse',
    'anapologetos': 'excuse',
    'defenseless': 'excuse'
  };
  
  function setCurrentWord(w){ currentWord = w; }
  function setCurrentVerseText(t){ currentVerseText = t || ''; }

  function normalizeWord(word){
    if (!word) return null;
    const lower = word.toLowerCase().replace(/[^a-z\-']/g, '');
    return WORD_MAPPINGS[lower] || lower;
  }

  function lookup(word){
    if (!word) return null;
    const normalized = normalizeWord(word);
    const entry = window.LEXICON[normalized] || null;
    return entry;
  }

  function strongsUrl(code){
    if (!code) return null;
    // Default external link; could be user-configurable later
    return `https://www.blueletterbible.org/search/lexiconResults.cfm?criteria=${encodeURIComponent(code)}`;
  }

  function renderEntryHTML(entry){
    const senses = (entry.senses || []).map(s => `<li>${s}</li>`).join('');
    const forms = (entry.forms || []).map(f => `<code>${f}</code>`).join(', ');
    const s = entry.strongs ? `<a href="${strongsUrl(entry.strongs)}" target="_blank" rel="noopener noreferrer" class="strongs-link">${entry.strongs}</a>` : 'n/a';
    return `
      <div class="lex-entry">
        <h4>${entry.headword} — ${entry.lang.toUpperCase()} (${s})</h4>
        <p><em>Transliteration:</em> ${entry.translit || 'n/a'}</p>
        <p><em>Glosses:</em> ${(entry.glosses||[]).join(', ')}</p>
        <p><em>Morphology:</em> ${entry.morph || 'n/a'}</p>
        <p><em>Forms:</em> ${forms || '—'}</p>
        <p><em>Senses:</em></p>
        <ul>${senses}</ul>
        <p><em>References:</em> ${(entry.refs||[]).join('; ')}</p>
      </div>
    `;
  }

  // Concordance search across all Bible texts
  function searchWordOccurrences(word, translation = 'kjv') {
    if (!word || !window.BIBLE_TEXTS || !window.BIBLE_TEXTS[translation]) return [];
    
    const normalizedWord = normalizeWord(word);
    const results = [];
    const bibleData = window.BIBLE_TEXTS[translation];
    
    // Search through all books and chapters
    Object.keys(bibleData).forEach(book => {
      Object.keys(bibleData[book]).forEach(chapter => {
        const verses = bibleData[book][chapter];
        if (Array.isArray(verses)) {
          verses.forEach(verseObj => {
            const verseText = verseObj.text || '';
            const words = verseText.match(/[A-Za-z\-']+/g) || [];
            
            // Check if any word in this verse matches our search term
            const found = words.some(w => {
              const normalized = normalizeWord(w);
              return normalized === normalizedWord || normalized === word.toLowerCase();
            });
            
            if (found) {
              results.push({
                reference: `${book} ${chapter}:${verseObj.verse}`,
                text: verseText,
                book: book,
                chapter: parseInt(chapter),
                verse: verseObj.verse
              });
            }
          });
        }
      });
    });
    
    return results;
  }

  function renderConcordanceResults(word, results, lexiconEntry) {
    if (!results || results.length === 0) {
      return `<p>No occurrences found for <strong>"${word}"</strong> in the current translation.</p>`;
    }

    const strongsInfo = lexiconEntry && lexiconEntry.strongs 
      ? `<p><strong>Strong's Number:</strong> <a href="${strongsUrl(lexiconEntry.strongs)}" target="_blank" rel="noopener noreferrer" class="strongs-link">${lexiconEntry.strongs}</a></p>`
      : '';

    const occurrenceList = results.map(result => `
      <li class="concordance-verse">
        <strong>${result.reference}</strong><br>
        <span class="verse-text">${result.text}</span>
      </li>
    `).join('');

    return `
      <div class="concordance-results">
        <h4>Concordance: "${word}" (${results.length} occurrence${results.length !== 1 ? 's' : ''})</h4>
        ${strongsInfo}
        ${lexiconEntry ? `<div class="lexicon-summary">
          <p><strong>Hebrew/Greek:</strong> ${lexiconEntry.headword}</p>
          <p><strong>Meaning:</strong> ${(lexiconEntry.glosses || []).join(', ')}</p>
        </div>` : ''}
        <ol class="concordance-list">${occurrenceList}</ol>
      </div>
    `;
  }

  function renderCurrentLexicon(){
    if (currentWord) {
      const entry = lookup(currentWord);
      if (!entry) {
        // Still show concordance even without lexicon entry
        const currentTranslation = (window.__APP_STATE__ && window.__APP_STATE__.current && window.__APP_STATE__.current.translation) || (window.state && window.state.current && window.state.current.translation) || 'kjv';
        const occurrences = searchWordOccurrences(currentWord, currentTranslation);
        
        if (occurrences.length > 0) {
          return `<div>
            <p>No lexicon entry found for <strong>${currentWord}</strong> in the offline set.</p>
            ${renderConcordanceResults(currentWord, occurrences, null)}
          </div>`;
        }
        
        return `<p>No lexicon entry found for <strong>${currentWord}</strong> in the offline set.</p>`;
      }
      
      // Show both lexicon entry and concordance
      const currentTranslation = (window.__APP_STATE__ && window.__APP_STATE__.current && window.__APP_STATE__.current.translation) || (window.state && window.state.current && window.state.current.translation) || 'kjv';
      const occurrences = searchWordOccurrences(currentWord, currentTranslation);
      
      return `<div>
        ${renderEntryHTML(entry)}
        ${renderConcordanceResults(currentWord, occurrences, entry)}
      </div>`;
    }
    
    // Fallback: scan the current verse text for known lexicon entries (acts like a simple concordance for this verse)
    if (currentVerseText && typeof currentVerseText === 'string') {
      const tokens = (currentVerseText.match(/[A-Za-z\-']+/g) || []);
      const seen = new Set();
      const matches = [];
      tokens.forEach(t => {
        const normalized = normalizeWord(t);
        if (!seen.has(normalized) && window.LEXICON && window.LEXICON[normalized]) {
          seen.add(normalized);
          matches.push(window.LEXICON[normalized]);
        }
      });
      if (matches.length) {
        return `<div class="lexicon-verse-summary">
          <h4>Lexicon & Concordance (matched words in this verse)</h4>
          ${matches.map(renderEntryHTML).join('')}
        </div>`;
      }
      return '<p>No matching lexicon entries found for this verse in the offline subset.</p>';
    }
    return '<p>Click a word in the verse to look it up.</p>';
  }

  // Inline badge helper for verse text (optional usage)
  function annotateVerseHtml(html){
    if (!html) return html;
    return html.replace(/>([A-Za-z\-']+)</g, (m, w) => {
      const normalized = normalizeWord(w);
      const entry = window.LEXICON && window.LEXICON[normalized];
      if (!entry || !entry.strongs) return m;
      const code = entry.strongs;
      const url = strongsUrl(code);
      return `><span class="word lex-badge" data-word="${w}" title="${entry.headword} — ${code}">${w} <a class="lex-link" href="${url}" target="_blank" rel="noopener" aria-label="Strong's ${code}">(${code})</a></span><`;
    });
  }

  window.LexiconAgent = { setCurrentWord, setCurrentVerseText, renderCurrentLexicon, annotateVerseHtml };
})();