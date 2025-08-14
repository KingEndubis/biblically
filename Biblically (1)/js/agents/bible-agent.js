// BibleAgent: multiple translations access (offline sample texts + plug-in architecture)
(function(){
  const registry = {
    kjv: { name: 'King James Version', provider: 'local' },
    niv: { name: 'New International Version', provider: 'local' },
    esv: { name: 'English Standard Version', provider: 'local' },
    nlt: { name: 'New Living Translation', provider: 'local' },
    nkjv: { name: 'New King James Version', provider: 'local' },
    msg: { name: 'The Message', provider: 'local' },
    nasb: { name: 'New American Standard Bible', provider: 'local' },
    csb: { name: 'Christian Standard Bible', provider: 'local' },
    rsv: { name: 'Revised Standard Version', provider: 'local' },
  };

  function getChapter(translation, book, chapter){
    if (typeof window.BIBLE_TEXTS === 'undefined') return [];
    // handle common alias/typo
    if (translation === 'kgv') translation = 'kjv';
    if (translation === 'nkgv') translation = 'nkjv';
    const t = window.BIBLE_TEXTS[translation] || window.BIBLE_TEXTS['kjv'];
    const b = t[book];
    if (!b) return [];
    return b[chapter] || [];
  }

  window.getChapter = getChapter;
  window.BibleAgent = { registry, getChapter };
})();