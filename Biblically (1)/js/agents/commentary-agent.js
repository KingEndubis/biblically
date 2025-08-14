// CommentaryAgent: Early Church Fathers & cross-references (offline curated subset + pluggable)
(function(){
  let currentRef = null;

  function setCurrentReference({ translation, book, chapter, verse, verseText }){
    currentRef = { translation, book, chapter, verse, verseText };
  }

  function renderCurrentCommentary(){
    if (!currentRef) return '<p>Select a verse to see commentary.</p>';
    const key = `${currentRef.book} ${currentRef.chapter}:${currentRef.verse}`;
    const c = (window.COMMENTARIES[key] || []);
    if (!c.length) return '<p>No commentary found for this verse in the offline set. We can expand the library.</p>';
    return '<div class="commentary-list">' + c.map(item => `
      <div class="commentary-item">
        <h4>${item.author} — ${item.work}</h4>
        <p>${item.excerpt}</p>
      </div>
    `).join('') + '</div>';
  }

  function renderCrossReferences(){
    if (!currentRef) return '<p>Select a verse to see cross references.</p>';
    const key = `${currentRef.book} ${currentRef.chapter}:${currentRef.verse}`;
    const refs = (window.CROSS_REFERENCES[key] || []);
    if (!refs.length) return '<p>No cross references available in the offline set.</p>';
    return '<ul>' + refs.map(r => `<li>${r}</li>`).join('') + '</ul>';
  }

  window.CommentaryAgent = { setCurrentReference, renderCurrentCommentary, renderCrossReferences };
})();