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

  // Map book names to external source
  const externalBookMap = {
    'Psalm': 'Psalms',
    'Song of Solomon': 'Song of Songs'
  };

  // Cache for fetched chapters
  const fetchCache = new Map();

  async function fetchKJVChapter(book, chapter) {
    const cacheKey = `kjv-${book}-${chapter}`;
    if (fetchCache.has(cacheKey)) {
      return fetchCache.get(cacheKey);
    }

    try {
      // Build candidate filenames for external source naming
      const primary = externalBookMap[book] || book;
      const candidates = [primary];
      // Add fallbacks for known variations
      if (book === 'Song of Solomon') {
        if (!candidates.includes('Song of Solomon')) candidates.push('Song of Solomon');
        if (!candidates.includes('Song of Songs')) candidates.push('Song of Songs');
      }
      if (!candidates.includes(book)) candidates.push(book);

      let data = null;
      let lastError = null;
      for (const name of candidates) {
        const url = `https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/${name}.json`;
        try {
          const response = await fetch(url);
          if (!response.ok) {
            lastError = new Error(`HTTP ${response.status}`);
            continue;
          }
          data = await response.json();
          break;
        } catch (e) {
          lastError = e;
          continue;
        }
      }

      if (!data) {
        throw lastError || new Error('Failed to fetch KJV book JSON');
      }

      // Transform external format to our internal format
      if (data.chapters) {
        const chapterData = data.chapters.find(c => parseInt(c.chapter) === chapter);
        if (chapterData && chapterData.verses) {
          const verses = chapterData.verses.map(v => ({
            verse: parseInt(v.verse),
            text: v.text
          }));
          // Cache the result
          fetchCache.set(cacheKey, verses);
          // Also populate our local data structure for future use
          if (!window.BIBLE_TEXTS.kjv[book]) {
            window.BIBLE_TEXTS.kjv[book] = {};
          }
          window.BIBLE_TEXTS.kjv[book][chapter] = verses;
          return verses;
        }
      }

      // If we couldn't find the chapter, cache empty result
      fetchCache.set(cacheKey, []);
      return [];

    } catch (error) {
      console.warn(`Failed to fetch KJV ${book} ${chapter}:`, error);
      fetchCache.set(cacheKey, []);
      return [];
    }
  }

  function getChapter(translation, book, chapter){
    if (typeof window.BIBLE_TEXTS === 'undefined') return [];
    
    // handle common alias/typo
    if (translation === 'kgv') translation = 'kjv';
    if (translation === 'nkgv') translation = 'nkjv';
    
    const t = window.BIBLE_TEXTS[translation] || window.BIBLE_TEXTS['kjv'];
    const b = t[book];
    
    // If we have the chapter locally, return it
    if (b && b[chapter]) {
      return b[chapter];
    }
    
    // For KJV, try to fetch from external source
    if (translation === 'kjv' || (!window.BIBLE_TEXTS[translation] && translation !== 'kjv')) {
      // Return a promise that will resolve with the verses
      return fetchKJVChapter(book, chapter);
    }
    
    return [];
  }

  // Async version for explicit async usage
  async function getChapterAsync(translation, book, chapter) {
    const result = getChapter(translation, book, chapter);
    if (result instanceof Promise) {
      return await result;
    }
    return result;
  }

  window.getChapter = getChapter;
  window.BibleAgent = { registry, getChapter, getChapterAsync, fetchKJVChapter };
})();