// Interactive verse exploration: modal, tabs, and word-lookup
(function(){
  function init(){
    const modal = document.getElementById('verse-modal');
    if (!modal) return; // modal might not be present yet
    const closeBtn = modal.querySelector('.modal-close');
    const title = document.getElementById('modal-verse-reference');
    const text = document.getElementById('modal-verse-text');
    const tabs = modal.querySelectorAll('.tab-btn');
    const tabContent = document.getElementById('modal-tab-content');

    function renderParaphrase(){
      const ref = title.textContent; // e.g., "John 3:16"
      const verseText = text.textContent || '';
      if (!verseText.trim()){
        tabContent.innerHTML = '<p>No verse selected.</p>';
        return;
      }
      const result = window.AIAgent.generatePersonalParaphrase(verseText, ref, 'modern');
      tabContent.innerHTML = [
        `<div class="paraphrase-result">`,
        `<h4>Personal Paraphrase</h4>`,
        `<p><strong>Original:</strong> ${result.originalText}</p>`,
        `<p><strong>Your Version:</strong> <em>${result.paraphrase}</em></p>`,
        `<h5>Key Terms & Context:</h5>`,
        `<ul>${result.contextualNotes}</ul>`,
        `<p class="warning"><small>⚠️ ${result.warning}</small></p>`,
        `</div>`
      ].join('');
    }

    function switchTab(name){
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
      if (name === 'commentary'){
        tabContent.innerHTML = window.CommentaryAgent.renderCurrentCommentary();
      } else if (name === 'lexicon'){
        tabContent.innerHTML = window.LexiconAgent.renderCurrentLexicon();
      } else if (name === 'cross-refs'){
        tabContent.innerHTML = window.CommentaryAgent.renderCrossReferences();
      } else if (name === 'paraphrase'){
        renderParaphrase();
      }
    }

    tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });

    window.VerseInteraction = {
      openVerseModal({ reference, text: verseText, translation, book, chapter, verse }){
        const titleEl = title;
        const textEl = text;
        const contentEl = tabContent;
        titleEl.textContent = reference;
        // First annotate with Strong's links if available, then wrap words for click selection
        const annotated = (window.LexiconAgent && window.LexiconAgent.annotateVerseHtml)
          ? window.LexiconAgent.annotateVerseHtml(verseText)
          : verseText;
        textEl.innerHTML = annotated.replace(/([A-Za-z\-']+)/g, '<span class="word" data-word="$1">$1</span>');
        modal.classList.add('show');
        window.CommentaryAgent.setCurrentReference({ translation, book, chapter, verse, verseText });
        if (window.LexiconAgent) {
          window.LexiconAgent.setCurrentWord(null);
          window.LexiconAgent.setCurrentVerseText(verseText);
        }
        // Set audio conversation context for this verse
        if (window.AudioAgent && typeof window.AudioAgent.setConversationContext === 'function') {
          const commentaryHtml = window.CommentaryAgent.renderCurrentCommentary();
          const crossRefsHtml = window.CommentaryAgent.renderCrossReferences();
          const lexEntry = null; // will be set upon word click
          window.AudioAgent.setConversationContext({
            verse: { reference, text: verseText, translation, book, chapter, verse },
            commentary: commentaryHtml,
            lexicon: lexEntry,
            crossRefs: (crossRefsHtml || '').replace(/<[^>]+>/g,'').split(/\n|;|<li>|<\/li>|<p>|<\/p>/).filter(Boolean)
          });
        }
        switchTab('commentary');
        if (window.AudioAgent && typeof window.AudioAgent.speakVerse === 'function') {
          window.AudioAgent.speakVerse(reference, verseText);
        }
        textEl.querySelectorAll('.word').forEach(w => {
          w.addEventListener('click', () => {
            const selected = w.dataset.word;
            if (window.LexiconAgent) {
              window.LexiconAgent.setCurrentWord(selected);
              window.LexiconAgent.setCurrentVerseText(verseText);
            }
            // update context with lexicon
            if (window.AudioAgent && typeof window.AudioAgent.setConversationContext === 'function') {
              const entryHtml = window.LexiconAgent.renderCurrentLexicon();
              window.AudioAgent.setConversationContext({
                verse: { reference, text: verseText, translation, book, chapter, verse },
                commentary: window.CommentaryAgent.renderCurrentCommentary(),
                lexicon: { word: selected, entry: entryHtml },
                crossRefs: (window.CommentaryAgent.renderCrossReferences() || '').replace(/<[^>]+>/g,'').split(/\n|;|<li>|<\/li>|<p>|<\/p>/).filter(Boolean)
              });
            }
            switchTab('lexicon');
          });
        });
      }
    };
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();