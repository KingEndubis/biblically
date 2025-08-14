// LexiconAgent: Hebrew/Greek/Aramaic/Latin lookup with concordance ids (offline subset)
(function(){
  let currentWord = null;
  function setCurrentWord(w){ currentWord = w; }

  function lookup(word){
    if (!word) return null;
    const entry = window.LEXICON[word.toLowerCase()] || null;
    return entry;
  }

  function renderCurrentLexicon(){
    if (!currentWord) return '<p>Click a word in the verse to look it up.</p>';
    const entry = lookup(currentWord);
    if (!entry) return `<p>No lexicon entry found for <strong>${currentWord}</strong> in the offline set.</p>`;
    const senses = (entry.senses || []).map(s => `<li>${s}</li>`).join('');
    const forms = (entry.forms || []).map(f => `<code>${f}</code>`).join(', ');
    return `
      <div class="lex-entry">
        <h4>${entry.headword} — ${entry.lang.toUpperCase()} (${entry.strongs || 'n/a'})</h4>
        <p><em>Transliteration:</em> ${entry.translit || 'n/a'}</p>
        <p><em>Glosses:</em> ${entry.glosses.join(', ')}</p>
        <p><em>Morphology:</em> ${entry.morph || 'n/a'}</p>
        <p><em>Forms:</em> ${forms || '—'}</p>
        <p><em>Senses:</em></p>
        <ul>${senses}</ul>
        <p><em>References:</em> ${(entry.refs||[]).join('; ')}</p>
      </div>
    `;
  }

  window.LexiconAgent = { setCurrentWord, renderCurrentLexicon };
})();