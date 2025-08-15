// SearchAgent: verse, topic, and keyword searches; topic integrates OpenBible crossrefs via scraping-free curated data
(function(){
  async function searchVerse(query, translation){
    // Simple search across loaded translation
    const res = [];
    const t = window.BIBLE_TEXTS[translation] || window.BIBLE_TEXTS['kjv'];
    Object.keys(t).forEach(book => {
      const chapters = t[book];
      Object.keys(chapters).forEach(chStr => {
        const chapter = Number(chStr);
        const verses = chapters[chapter];
        verses.forEach(v => {
          const combined = `${v.verse} ${v.text}`;
          if (combined.toLowerCase().includes(query.toLowerCase())){
            res.push({ reference: `${book} ${chapter}:${v.verse}`, book, chapter, verse: v.verse, snippet: highlightSnippet(v.text, query) });
          }
        });
      });
    });
    return res.slice(0, 50);
  }

  function highlightSnippet(text, q){
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    const start = Math.max(0, idx - 30);
    const end = Math.min(text.length, idx + q.length + 30);
    const snippet = text.substring(start, end);
    return snippet.replace(new RegExp(q, 'ig'), m => `<mark>${m}</mark>`) + '...';
  }

  async function searchTopic(query, translation){
    // Offline curated topics mapping to references (placeholder sample)
    const mapping = window.TOPIC_INDEX || {};
    const refs = mapping[query.toLowerCase()] || [];
    const results = [];
    for (const ref of refs){
      const [book, rest] = ref.split(' ');
      const [chapStr, verseStr] = rest.split(':');
      const chapter = Number(chapStr);
      const verse = Number(verseStr);
      const verses = await window.BibleAgent.getChapterAsync(translation, book, chapter);
      const vs = verses.find(v=>v.verse===verse);
      if (vs) results.push({ reference: ref, book, chapter, verse, snippet: vs.text });
    }
    return results.length ? results : searchVerse(query, translation);
  }

  async function searchKeyword(query, translation){
    return searchVerse(query, translation);
  }

  window.SearchAgent = {
    search(query, type, translation){
      if (type === 'topic') return searchTopic(query, translation);
      if (type === 'keyword') return searchKeyword(query, translation);
      return searchVerse(query, translation);
    }
  };
})();