// Core app initialization and shared utilities
(function(){
  const state = {
    theme: localStorage.getItem('theme') || 'light',
    audioEnabled: false,
    current: { translation: 'kjv', book: 'Genesis', chapter: 1 },
    style: localStorage.getItem('style') || 'modern',
  };

  function setTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function initNav(){
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const section = item.dataset.section;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(section).classList.add('active');
    }));
  }

  function initThemeToggle(){
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      setTheme(state.theme);
    });
    setTheme(state.theme);
  }

  function initAudioToggle(){
    const audioBtn = document.getElementById('audio-toggle');
    audioBtn.addEventListener('click', () => {
      state.audioEnabled = !state.audioEnabled;
      audioBtn.classList.toggle('active', state.audioEnabled);
    });
  }

  // Populate books select
  function populateBooks(){
    const bookSelect = document.getElementById('book-select');
    BOOKS.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.textContent = b.name;
      bookSelect.appendChild(opt);
    });
  }

  function populateChapters(book){
    const chapterSelect = document.getElementById('chapter-select');
    chapterSelect.innerHTML = '<option value="">Chapter</option>';
    const b = BOOKS.find(x => x.name === book);
    if (!b) return;
    for (let i=1;i<=b.chapters;i++){
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      chapterSelect.appendChild(opt);
    }
  }

  function loadChapter(){
    const { translation, book, chapter } = state.current;
    const title = document.getElementById('chapter-title');
    title.textContent = `${book} ${chapter} (${translation.toUpperCase()})`;
    const container = document.getElementById('verse-container');
    container.innerHTML = '';

    const verses = getChapter(translation, book, chapter);
    verses.forEach(v => {
      const p = document.createElement('p');
      p.className = 'verse';
      p.dataset.verse = v.verse;
      p.innerHTML = `<span class="verse-number">${v.verse}</span>${v.text}`;
      const actions = document.createElement('span');
      actions.className = 'verse-actions';
      actions.innerHTML = `
        <button class="btn-icon verse-chat" title="Discuss this verse"><i class="fas fa-comments"></i></button>
        <button class="btn-icon verse-voice" title="Voice chat about this verse"><i class="fas fa-microphone"></i></button>
        <button class="btn-icon verse-highlight" title="Highlight this verse"><i class="fas fa-highlighter"></i></button>
      `;
      p.appendChild(actions);

      p.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('.verse-actions')) return;
        window.VerseInteraction.openVerseModal({
          reference: `${book} ${chapter}:${v.verse}`,
          text: v.text,
          translation,
          book,
          chapter,
          verse: v.verse,
        });
      });

      actions.querySelector('.verse-chat').addEventListener('click', async (e) => {
        e.stopPropagation();
        const style = state.style;
        const prompt = `Discuss ${book} ${chapter}:${v.verse} in a ${style} tone while preserving the original meaning. Include brief notes on key Greek/Hebrew terms if relevant.`;
        const messages = document.getElementById('chat-messages');
        const add = (role, text) => {
          const div = document.createElement('div');
          div.className = `message ${role}-message`;
          const content = document.createElement('div');
          content.className = 'message-content';
          content.innerHTML = text;
          div.appendChild(content);
          messages.appendChild(div);
          messages.scrollTop = messages.scrollHeight;
        };
        add('user', `Please discuss ${book} ${chapter}:${v.verse}`);
        add('ai', 'Thinking...');
        const response = (window.AIAgent.chatEnhanced ? await window.AIAgent.chatEnhanced(prompt) : await window.AIAgent.chat(prompt));
        messages.lastElementChild.querySelector('.message-content').innerHTML = response;
        if (window.AudioAgent && window.AudioAgent.speechEnabled) {
          window.AudioAgent.speak(response, { forceSpeak: true });
        }
        document.querySelector('.nav-item[data-section="ai-chat"]').click();
      });

      actions.querySelector('.verse-voice').addEventListener('click', (e) => {
        e.stopPropagation();
        if (!window.AudioAgent) return;
        const style = state.style;
        const currentVerseRef = `${book} ${chapter}:${v.verse}`;
        window.AudioAgent.startVoiceChat(async (transcript) => {
          const messages = document.getElementById('chat-messages');
          const add = (role, text) => {
            const div = document.createElement('div');
            div.className = `message ${role}-message`;
            const content = document.createElement('div');
            content.className = 'message-content';
            content.innerHTML = text;
            div.appendChild(content);
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
          };
          add('user', transcript || `Discuss ${currentVerseRef}`);
          add('ai', 'Listening and thinking...');
          const response = await window.AudioAgent.processVoiceChat(transcript || `Discuss ${currentVerseRef}`, `${currentVerseRef} in a ${style} tone`);
          messages.lastElementChild.querySelector('.message-content').innerHTML = response;
          document.querySelector('.nav-item[data-section="ai-chat"]').click();
        });
      });

      actions.querySelector('.verse-highlight').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleHighlight(`${book}|${chapter}|${v.verse}`);
      });

      container.appendChild(p);
    });

    document.getElementById('prev-chapter').disabled = (chapter <= 1 && BOOKS.find(b=>b.name===book).index===0);
  }

  function toggleHighlight(key){
    const storeKey = 'highlights';
    const current = JSON.parse(localStorage.getItem(storeKey) || '[]');
    const idx = current.indexOf(key);
    if (idx >= 0) {
      current.splice(idx,1);
    } else {
      current.push(key);
    }
    localStorage.setItem(storeKey, JSON.stringify(current));
    applyHighlights();
    renderHighlightsPanel();
  }

  function applyHighlights(){
    const storeKey = 'highlights';
    const current = JSON.parse(localStorage.getItem(storeKey) || '[]');
    document.querySelectorAll('.verse').forEach(el => {
      const book = state.current.book;
      const chapter = state.current.chapter;
      const vnum = el.dataset.verse;
      const key = `${book}|${chapter}|${vnum}`;
      if (current.includes(key)) {
        el.classList.add('saved-highlight');
      } else {
        el.classList.remove('saved-highlight');
      }
    });
  }

  function renderHighlightsPanel(){
    const listEl = document.getElementById('highlights-list');
    if (!listEl) return;
    const items = JSON.parse(localStorage.getItem('highlights') || '[]');
    // Sort by canonical order: book index, chapter, verse
    const bookOrder = BOOKS.map(b => b.name);
    const orderMap = new Map(bookOrder.map((name, idx) => [name, idx]));
    const sorted = items.map(key => {
      const [book, chap, verse] = key.split('|');
      return { book, chapter: Number(chap), verse: Number(verse), key };
    }).sort((a,b) => {
      const ai = orderMap.get(a.book) ?? 9999;
      const bi = orderMap.get(b.book) ?? 9999;
      if (ai !== bi) return ai - bi;
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    });

    listEl.innerHTML = '';
    sorted.forEach(item => {
      const div = document.createElement('div');
      div.className = 'search-item';
      div.innerHTML = `<strong>${item.book} ${item.chapter}:${item.verse}</strong> <button class="btn-secondary" data-key="${item.key}">Remove</button>`;
      div.addEventListener('click', (e) => {
        if (e.target.matches('button[data-key]')) {
          e.stopPropagation();
          toggleHighlight(item.key);
          return;
        }
        // Navigate to verse
        state.current.book = item.book;
        state.current.chapter = item.chapter;
        document.getElementById('book-select').value = item.book;
        populateChapters(item.book);
        document.getElementById('chapter-select').value = String(item.chapter);
        loadChapter();
        setTimeout(() => {
          applyHighlights();
          const verseEl = document.querySelector(`.verse[data-verse="${item.verse}"]`);
          if (verseEl) {
            verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            verseEl.classList.add('highlight');
            setTimeout(() => verseEl.classList.remove('highlight'), 2000);
          }
        }, 250);
        document.querySelector('.nav-item[data-section="bible"]').click();
      });
      listEl.appendChild(div);
    });
  }

  function initBibleControls(){
    const translationSelect = document.getElementById('translation-select');
    const bookSelect = document.getElementById('book-select');
    const chapterSelect = document.getElementById('chapter-select');
    const styleSelect = document.getElementById('style-select');

    // Populate translations
    const translations = [
      { value: 'kjv', name: 'King James Version (KJV)' },
      { value: 'niv', name: 'New International Version (NIV)' },
      { value: 'nkjv', name: 'New King James Version (NKJV)' },
      { value: 'nlt', name: 'New Living Translation (NLT)' },
      { value: 'esv', name: 'English Standard Version (ESV)' }
    ];
    translations.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.value;
      opt.textContent = t.name;
      translationSelect.appendChild(opt);
    });
    translationSelect.value = state.current.translation;

    if (styleSelect) {
      styleSelect.value = state.style;
      styleSelect.addEventListener('change', () => {
        state.style = styleSelect.value;
        localStorage.setItem('style', state.style);
      });
    }

    translationSelect.addEventListener('change', () => {
      state.current.translation = translationSelect.value;
      loadChapter();
    });

    bookSelect.addEventListener('change', () => {
      state.current.book = bookSelect.value;
      populateChapters(bookSelect.value);
      state.current.chapter = 1;
      chapterSelect.value = '1';
      loadChapter();
    });

    chapterSelect.addEventListener('change', () => {
      state.current.chapter = Number(chapterSelect.value);
      loadChapter();
    });

    document.getElementById('prev-chapter').addEventListener('click', () => {
      const bIndex = BOOKS.findIndex(b=>b.name===state.current.book);
      if (state.current.chapter > 1){
        state.current.chapter -= 1;
      } else if (bIndex > 0) {
        state.current.book = BOOKS[bIndex-1].name;
        state.current.chapter = BOOKS[bIndex-1].chapters;
        document.getElementById('book-select').value = state.current.book;
        populateChapters(state.current.book);
        document.getElementById('chapter-select').value = String(state.current.chapter);
      }
      loadChapter();
    });

    document.getElementById('next-chapter').addEventListener('click', () => {
      const bIndex = BOOKS.findIndex(b=>b.name===state.current.book);
      const b = BOOKS[bIndex];
      if (state.current.chapter < b.chapters){
        state.current.chapter += 1;
      } else if (bIndex < BOOKS.length-1) {
        state.current.book = BOOKS[bIndex+1].name;
        state.current.chapter = 1;
        document.getElementById('book-select').value = state.current.book;
        populateChapters(state.current.book);
        document.getElementById('chapter-select').value = '1';
      }
      loadChapter();
    });
  }

  function initChapterActions(){
    const chatBtn = document.getElementById('chapter-chat-btn');
    const voiceBtn = document.getElementById('chapter-voice-btn');
    if (chatBtn) {
      chatBtn.addEventListener('click', async () => {
        const { book, chapter } = state.current;
        const style = state.style;
        const prompt = `Discuss ${book} ${chapter} in a ${style} tone while preserving original meaning and noting key lexicon terms.`;
        const messages = document.getElementById('chat-messages');
        const add = (role, text) => {
          const div = document.createElement('div');
          div.className = `message ${role}-message`;
          const content = document.createElement('div');
          content.className = 'message-content';
          content.innerHTML = text;
          div.appendChild(content);
          messages.appendChild(div);
          messages.scrollTop = messages.scrollHeight;
        };
        add('user', `Please discuss ${book} ${chapter}`);
        add('ai', 'Thinking...');
        const response = (window.AIAgent && window.AIAgent.chatEnhanced ? await window.AIAgent.chatEnhanced(prompt) : await window.AIAgent.chat(prompt));
        messages.lastElementChild.querySelector('.message-content').innerHTML = response;
        if (window.AudioAgent && window.AudioAgent.speechEnabled) {
          window.AudioAgent.speak(response, { forceSpeak: true });
        }
        document.querySelector('.nav-item[data-section="ai-chat"]').click();
      });
    }
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        if (!window.AudioAgent) return;
        const { book, chapter } = state.current;
        const style = state.style;
        const ref = `${book} ${chapter}`;
        window.AudioAgent.startVoiceChat(async (transcript) => {
          const messages = document.getElementById('chat-messages');
          const add = (role, text) => {
            const div = document.createElement('div');
            div.className = `message ${role}-message`;
            const content = document.createElement('div');
            content.className = 'message-content';
            content.innerHTML = text;
            div.appendChild(content);
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
          };
          add('user', transcript || `Discuss ${ref}`);
          add('ai', 'Listening and thinking...');
          const response = await window.AudioAgent.processVoiceChat(transcript || `Discuss ${ref}`, `${ref} in a ${style} tone`);
          messages.lastElementChild.querySelector('.message-content').innerHTML = response;
          document.querySelector('.nav-item[data-section="ai-chat"]').click();
        });
      });
    }
  }

  function initSearch(){
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');
    const results = document.getElementById('search-results');
    btn.addEventListener('click', async () => {
      const q = input.value.trim();
      if (!q) return;
      const type = document.querySelector('input[name="search-type"]:checked').value;
      results.innerHTML = '<p>Searching...</p>';
      const items = await window.SearchAgent.search(q, type, state.current.translation);
      results.innerHTML = '';
      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `<strong>${item.reference}</strong>: ${item.snippet}`;
        div.addEventListener('click', () => {
          state.current.book = item.book; state.current.chapter = item.chapter; document.getElementById('book-select').value = item.book; populateChapters(item.book); document.getElementById('chapter-select').value = String(item.chapter); loadChapter();
          setTimeout(() => {
            const verseEl = document.querySelector(`.verse[data-verse="${item.verse}"]`);
            if (verseEl) verseEl.classList.add('highlight');
            setTimeout(() => verseEl && verseEl.classList.remove('highlight'), 2000);
          }, 250);
        });
        results.appendChild(div);
      });
    });
  }

  function initChat(){
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('send-message');
    const messages = document.getElementById('chat-messages');
    const voiceBtn = document.getElementById('voice-chat-btn');
    const speechToggle = document.getElementById('speech-output-toggle');

    function addMessage(role, text){
      const div = document.createElement('div');
      div.className = `message ${role}-message`;
      const content = document.createElement('div');
      content.className = 'message-content';
      content.innerHTML = text;
      div.appendChild(content);
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    btn.addEventListener('click', async () => {
      const q = input.value.trim();
      if (!q) return;
      addMessage('user', q);
      input.value = '';
      addMessage('ai', 'Thinking...');
      const response = await window.AIAgent.chat(q);
      messages.lastElementChild.querySelector('.message-content').innerHTML = response;
      if (window.AudioAgent && window.AudioAgent.speechEnabled) {
        window.AudioAgent.speak(response, { forceSpeak: true });
      }
    });

    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        if (!window.AudioAgent) return;
        window.AudioAgent.startVoiceChat(async (transcript) => {
          addMessage('user', transcript);
          addMessage('ai', 'Listening and thinking...');
          const verseEl = document.querySelector('.verse.highlight');
          const currentVerse = null; // future: capture from modal if open
          const response = await window.AudioAgent.processVoiceChat(transcript, currentVerse);
          messages.lastElementChild.querySelector('.message-content').innerHTML = response;
        });
      });
    }

    if (speechToggle) {
      speechToggle.addEventListener('click', () => {
        if (!window.AudioAgent) return;
        window.AudioAgent.toggleSpeechOutput();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initThemeToggle();
    initAudioToggle();
    populateBooks();
    initBibleControls();
    initSearch();
    initChat();
    initChapterActions();

    document.getElementById('book-select').value = state.current.book;
    populateChapters(state.current.book);
    document.getElementById('chapter-select').value = String(state.current.chapter);
    setTimeout(() => { loadChapter(); applyHighlights(); renderHighlightsPanel(); }, 50);

    // Highlights panel controls
    const exportBtn = document.getElementById('export-highlights');
    const clearBtn = document.getElementById('clear-highlights');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = localStorage.getItem('highlights') || '[]';
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'highlights.json';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!confirm('Clear all saved highlights?')) return;
        localStorage.removeItem('highlights');
        applyHighlights();
        renderHighlightsPanel();
      });
    }

    // Set initial active nav and section
    const firstNav = document.querySelector('.nav-item[data-section="bible"]');
    if (firstNav) firstNav.classList.add('active');
  });

  window.__APP_STATE__ = state;
})();