(function(){
  // Bible Data Store
  window.__APP_STATE__ = {
    current: {
      book: '',
      chapter: 1,
      translation: 'kjv',
      readingPlan: null,
      readingPlanDay: 1
    },
    style: 'modern',
    textSize: 'normal',
    audioSettings: {
      voice: 'matthew',
      speed: 1.0
    }
  };

  let bookInfo = {};
  let translations = {};
  let strongsMeta = {};
  let readingPlans = {};
  
  window.BIBLE_TEXTS = {};

  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  function normalizeName(name) {
    return name.replace(/[^a-zA-Z]/g, '').toLowerCase();
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function searchTexts(query, translation = 'kjv') {
    if (!query.trim()) return [];
    const bible = window.BIBLE_TEXTS[translation];
    if (!bible) return [];
    
    const results = [];
    const queryLower = query.toLowerCase();
    
    Object.keys(bible).forEach(book => {
      Object.keys(bible[book]).forEach(chapter => {
        bible[book][chapter].forEach(verse => {
          if (verse.text.toLowerCase().includes(queryLower)) {
            results.push({
              book,
              chapter: parseInt(chapter),
              verse: verse.verse,
              text: verse.text
            });
          }
        });
      });
    });
    
    return results.slice(0, 50);
  }

  function loadTranslation(translation) {
    if (window.BIBLE_TEXTS[translation]) return Promise.resolve();
    
    return fetch(`data/bible/${translation}.json`)
      .then(response => response.json())
      .then(data => {
        window.BIBLE_TEXTS[translation] = {};
        data.forEach(book => {
          const bookName = normalizeName(book.name);
          const chapters = {};
          book.chapters.forEach((chapter, idx) => {
            const chapterNum = String(idx + 1);
            chapters[chapterNum] = chapter.map((text, verseIdx) => ({
              verse: verseIdx + 1,
              text
            }));
          });
          window.BIBLE_TEXTS[translation][bookName] = chapters;
        });
      })
      .catch(error => {
        console.error(`Failed to load ${translation} translation:`, error);
      });
  }

  async function loadBookInfo() {
    try {
      const response = await fetch('data/metadata/books.json');
      const data = await response.json();
      data.forEach(book => {
        bookInfo[normalizeName(book.name)] = book;
      });
    } catch (error) {
      console.error('Failed to load book info:', error);
    }
  }

  async function loadTranslations() {
    try {
      const response = await fetch('data/metadata/translations.json');
      translations = await response.json();
      populateTranslationSelect();
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  function populateTranslationSelect() {
    const select = document.getElementById('translation-select');
    if (!select || !translations) return;
    
    select.innerHTML = '';
    Object.keys(translations).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = translations[key].name;
      if (key === window.__APP_STATE__.current.translation) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  function renderVerse(book, chapter, verse, translation = 'kjv') {
    const bible = window.BIBLE_TEXTS[translation];
    if (!bible || !bible[book] || !bible[book][chapter]) return '';
    
    const verseData = bible[book][chapter].find(v => v.verse === verse);
    return verseData ? verseData.text : '';
  }

  function renderChapter(book, chapter, translation = 'kjv') {
    const bible = window.BIBLE_TEXTS[translation];
    if (!bible || !bible[book] || !bible[book][chapter]) return '';
    
    return bible[book][chapter].map(verse => 
      `<span class="verse" data-verse="${verse.verse}">
         <sup class="verse-number">${verse.verse}</sup>
         ${verse.text}
       </span>`
    ).join(' ');
  }

  function updateCurrentReference(book, chapter, translation) {
    window.__APP_STATE__.current.book = book;
    window.__APP_STATE__.current.chapter = chapter;
    window.__APP_STATE__.current.translation = translation;
    
    updateURL();
    updateNavigationButtons();
    updateChapterTitle();
  }

  function updateURL() {
    const state = window.__APP_STATE__.current;
    const bookName = Object.keys(bookInfo).find(key => 
      normalizeName(key) === state.book
    ) || state.book;
    
    const url = `#${bookName.replace(/\s+/g, '-')}-${state.chapter}`;
    history.replaceState(null, '', url);
  }

  function updateNavigationButtons() {
    // Implementation for navigation buttons
  }

  function updateChapterTitle() {
    const titleElement = document.querySelector('.chapter-title');
    if (!titleElement) return;
    
    const state = window.__APP_STATE__.current;
    const book = Object.values(bookInfo).find(b => 
      normalizeName(b.name) === state.book
    );
    
    if (book) {
      titleElement.textContent = `${book.name} ${state.chapter}`;
    }
  }

  function parseURL() {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    
    const match = hash.match(/^(.+)-(\d+)$/);
    if (!match) return null;
    
    const bookName = match[1].replace(/-/g, ' ');
    const chapter = parseInt(match[2]);
    
    const book = Object.values(bookInfo).find(b => 
      b.name.replace(/\s+/g, '-').toLowerCase() === bookName.toLowerCase()
    );
    
    return book ? {
      book: normalizeName(book.name),
      chapter,
      translation: window.__APP_STATE__.current.translation
    } : null;
  }

  function highlightVerse(book, chapter, verse, color = 'yellow') {
    const highlights = JSON.parse(localStorage.getItem('highlights') || '[]');
    const key = `${book}-${chapter}-${verse}`;
    const existing = highlights.find(h => h.key === key);
    
    if (existing) {
      existing.color = color;
    } else {
      highlights.push({
        key,
        book,
        chapter,
        verse,
        color,
        timestamp: Date.now()
      });
    }
    
    localStorage.setItem('highlights', JSON.stringify(highlights));
    applyVerseHighlights();
  }

  function removeHighlight(book, chapter, verse) {
    const highlights = JSON.parse(localStorage.getItem('highlights') || '[]');
    const filtered = highlights.filter(h => h.key !== `${book}-${chapter}-${verse}`);
    localStorage.setItem('highlights', JSON.stringify(filtered));
    applyVerseHighlights();
  }

  function applyVerseHighlights() {
    const highlights = JSON.parse(localStorage.getItem('highlights') || '[]');
    const currentBook = window.__APP_STATE__.current.book;
    const currentChapter = String(window.__APP_STATE__.current.chapter);
    
    highlights.forEach(highlight => {
      if (highlight.book === currentBook && String(highlight.chapter) === currentChapter) {
        const verseElement = document.querySelector(`[data-verse="${highlight.verse}"]`);
        if (verseElement) {
          verseElement.classList.add('highlighted');
          verseElement.style.backgroundColor = highlight.color;
        }
      }
    });
  }

  function loadReadingPlan(planName) {
    if (readingPlans[planName]) {
      return Promise.resolve(readingPlans[planName]);
    }
    
    return fetch(`data/reading-plans/${planName}.json`)
      .then(response => response.json())
      .then(data => {
        readingPlans[planName] = data;
        return data;
      });
  }

  function getReadingPlanDay(planName, day) {
    const plan = readingPlans[planName];
    if (!plan || !plan.days || !plan.days[day - 1]) return null;
    return plan.days[day - 1];
  }

  function setReadingPlan(planName, day = 1) {
    window.__APP_STATE__.current.readingPlan = planName;
    window.__APP_STATE__.current.readingPlanDay = day;
    localStorage.setItem('readingPlan', JSON.stringify({
      plan: planName,
      day: day
    }));
  }

  function loadUserSettings() {
    const settings = localStorage.getItem('userSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      Object.assign(window.__APP_STATE__, parsed);
    }
  }

  function saveUserSettings() {
    localStorage.setItem('userSettings', JSON.stringify(window.__APP_STATE__));
  }

  function initializeApp() {
    loadUserSettings();
    
    Promise.all([
      loadBookInfo(),
      loadTranslations(),
      loadTranslation(window.__APP_STATE__.current.translation)
    ]).then(() => {
      const urlData = parseURL();
      if (urlData) {
        updateCurrentReference(urlData.book, urlData.chapter, urlData.translation);
      }
      
      applyVerseHighlights();
      initializeEventListeners();
    });
  }

  function initializeEventListeners() {
    // Translation selector
    const translationSelect = document.getElementById('translation-select');
    if (translationSelect) {
      translationSelect.addEventListener('change', (e) => {
        const newTranslation = e.target.value;
        loadTranslation(newTranslation).then(() => {
          updateCurrentReference(
            window.__APP_STATE__.current.book,
            window.__APP_STATE__.current.chapter,
            newTranslation
          );
          renderCurrentChapter();
        });
      });
    }

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      const debouncedSearch = debounce((query) => {
        if (query.length > 2) {
          const results = searchTexts(query, window.__APP_STATE__.current.translation);
          displaySearchResults(results);
        }
      }, 300);
      
      searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
      });
    }

    // Window hash change
    window.addEventListener('hashchange', () => {
      const urlData = parseURL();
      if (urlData) {
        loadTranslation(urlData.translation).then(() => {
          updateCurrentReference(urlData.book, urlData.chapter, urlData.translation);
          renderCurrentChapter();
        });
      }
    });
  }

  function displaySearchResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    if (results.length === 0) {
      container.innerHTML = '<p>No results found.</p>';
      return;
    }
    
    container.innerHTML = results.map(result => 
      `<div class="search-result" data-book="${result.book}" data-chapter="${result.chapter}" data-verse="${result.verse}">
         <strong>${capitalize(result.book)} ${result.chapter}:${result.verse}</strong>
         <p>${result.text}</p>
       </div>`
    ).join('');
  }

  function renderCurrentChapter() {
    const container = document.getElementById('bible-text');
    if (!container) return;
    
    const state = window.__APP_STATE__.current;
    const content = renderChapter(state.book, String(state.chapter), state.translation);
    container.innerHTML = content;
    
    applyVerseHighlights();
    updateChapterTitle();
    
    // Add click handlers for verses
    container.querySelectorAll('.verse').forEach(verse => {
      verse.addEventListener('click', (e) => {
        const verseNum = parseInt(e.target.dataset.verse);
        showVerseModal(state.book, state.chapter, verseNum);
      });
    });
  }

  function showVerseModal(book, chapter, verse) {
    // Implementation for verse modal
  }

  // Export global functions
  window.BibleApp = {
    searchTexts,
    renderVerse,
    renderChapter,
    updateCurrentReference,
    highlightVerse,
    removeHighlight,
    loadTranslation,
    loadReadingPlan,
    setReadingPlan,
    getReadingPlanDay
  };

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', initializeApp);
  document.addEventListener('DOMContentLoaded', initAuth);

})();

async function safeFetchJSON(url) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (e) {
    console.warn(`Failed to fetch ${url}:`, e);
    return null;
  }
}

let KJV_LOADING = false;
async function loadFullKJVIfNeeded() {
  if (KJV_LOADING || window.BIBLE_TEXTS.kjv) return;
  KJV_LOADING = true;
  
  try {
    const data = await safeFetchJSON('data/bible/kjv-full.json');
    if (!data) return;

    const map = {};
    data.forEach(b => {
      const chapters = {};
      b.chapters.forEach((chapterArr, idx) => {
        const cnum = String(idx + 1);
        chapters[cnum] = chapterArr.map((t, j) => ({ verse: j + 1, text: t }));
      });
      const name = normalizeName(b.name);
      map[name] = chapters;
    });
    window.BIBLE_TEXTS = window.BIBLE_TEXTS || {};
    // Merge but prefer fetched full text for KJV
    window.BIBLE_TEXTS.kjv = map;
  } catch (e) {
    console.warn('Failed to load full KJV:', e);
  } finally {
    KJV_LOADING = false;
  }
}

function initAuth() {
  const signInBtn = document.getElementById('sign-in-btn');
  const authModal = document.getElementById('auth-modal');
  const closeBtns = document.querySelectorAll('[data-close-auth]');
  const userMenu = document.getElementById('user-menu');
  const userName = document.getElementById('user-name');
  const userAvatar = document.getElementById('user-avatar');
  const signOutBtn = document.getElementById('sign-out-btn');
  const syncBtn = document.getElementById('sync-data-btn');
  const accountBtn = document.getElementById('account-settings-btn');

  // Email/Phone controls
  const googleBtn = document.getElementById('google-signin');
  const emailBtn = document.getElementById('email-signin');
  const emailInput = document.getElementById('email-input');
  const emailCodeWrap = document.getElementById('email-code-container');
  const emailVerifyBtn = document.getElementById('email-verify');
  const emailCodeInput = document.getElementById('email-code-input');

  const phoneBtn = document.getElementById('phone-signin');
  const phoneInput = document.getElementById('phone-input');
  const phoneCodeWrap = document.getElementById('phone-code-container');
  const phoneVerifyBtn = document.getElementById('phone-verify');
  const phoneCodeInput = document.getElementById('phone-code-input');

  const AUTH_STORE = 'auth.user';

  function loadUser() {
    try { return JSON.parse(localStorage.getItem(AUTH_STORE) || 'null'); } catch { return null; }
  }
  function saveUser(user) { localStorage.setItem(AUTH_STORE, JSON.stringify(user)); }
  function clearUser() { localStorage.removeItem(AUTH_STORE); }

  function showSignedIn(user) {
    if (!signInBtn || !userMenu) return;
    signInBtn.style.display = 'none';
    userMenu.style.display = 'flex';
    userName.textContent = user.name || user.email || user.phone || 'User';
    userAvatar.src = user.photoURL || 'assets/icons/logo.svg';
  }
  function showSignedOut() {
    if (!signInBtn || !userMenu) return;
    signInBtn.style.display = 'inline-block';
    userMenu.style.display = 'none';
  }

  // Initialize from local storage
  const existing = loadUser();
  if (existing) showSignedIn(existing); else showSignedOut();

  // Open/Close modal handlers
  if (signInBtn) signInBtn.addEventListener('click', () => authModal.classList.add('show'));
  closeBtns.forEach(btn => btn.addEventListener('click', () => authModal.classList.remove('show')));
  if (authModal) authModal.addEventListener('click', (e) => { if (e.target === authModal) authModal.classList.remove('show'); });

  // Simulated Google sign-in (placeholder to plug in real provider later)
  if (googleBtn) googleBtn.addEventListener('click', async () => {
    // TODO: integrate real provider (Firebase Auth, Clerk, etc.)
    const user = { uid: 'local-google', name: 'Google User', email: 'user@example.com', provider: 'google' };
    saveUser(user);
    showSignedIn(user);
    authModal.classList.remove('show');
    await syncAllData(user);
  });

  // Email magic-link/code flow (simulated)
  if (emailBtn) emailBtn.addEventListener('click', () => {
    if (!emailInput.value) { alert('Enter your email'); return; }
    emailCodeWrap.style.display = 'block';
    // In real impl: send code via email service
    localStorage.setItem('auth.email.pending', emailInput.value);
    alert('Verification code sent to your email (simulated: use 123456)');
  });
  if (emailVerifyBtn) emailVerifyBtn.addEventListener('click', async () => {
    if (emailCodeInput.value !== '123456') { alert('Invalid code (use 123456 for demo)'); return; }
    const email = localStorage.getItem('auth.email.pending') || emailInput.value;
    const user = { uid: 'local-email:' + email, name: email.split('@')[0], email, provider: 'email' };
    saveUser(user);
    showSignedIn(user);
    authModal.classList.remove('show');
    await syncAllData(user);
  });

  // Phone OTP flow (simulated)
  if (phoneBtn) phoneBtn.addEventListener('click', () => {
    if (!phoneInput.value) { alert('Enter your phone number'); return; }
    phoneCodeWrap.style.display = 'block';
    localStorage.setItem('auth.phone.pending', phoneInput.value);
    alert('Verification code sent via SMS (simulated: use 123456)');
  });
  if (phoneVerifyBtn) phoneVerifyBtn.addEventListener('click', async () => {
    if (phoneCodeInput.value !== '123456') { alert('Invalid code (use 123456 for demo)'); return; }
    const phone = localStorage.getItem('auth.phone.pending') || phoneInput.value;
    const user = { uid: 'local-phone:' + phone, name: phone, phone, provider: 'phone' };
    saveUser(user);
    showSignedIn(user);
    authModal.classList.remove('show');
    await syncAllData(user);
  });

  if (signOutBtn) signOutBtn.addEventListener('click', () => {
    clearUser();
    showSignedOut();
  });

  if (syncBtn) syncBtn.addEventListener('click', async () => {
    const user = loadUser();
    if (!user) { alert('Please sign in first.'); return; }
    await syncAllData(user);
  });

  if (accountBtn) accountBtn.addEventListener('click', () => {
    alert('Account settings coming soon.');
  });

  async function syncAllData(user) {
    try {
      // Prepare payloads from local storage/state
      const highlights = JSON.parse(localStorage.getItem('highlights') || '[]');
      const chats = JSON.parse(localStorage.getItem('chat.history') || '[]');
      const notes = JSON.parse(localStorage.getItem('study.notes') || '[]');

      const payload = {
        user: { uid: user.uid, email: user.email || null, phone: user.phone || null, name: user.name || null },
        highlights,
        chats,
        notes,
        settings: { style: (window.__APP_STATE__ && window.__APP_STATE__.style) || 'modern' }
      };

      // TODO: send to backend API; for now, store locally to simulate cloud
      localStorage.setItem('cloud.sync', JSON.stringify(payload));
      alert('Data synced (local simulation). Set up a backend to persist.');
    } catch (e) {
      console.error('Sync failed', e);
      alert('Sync failed');
    }
  }
}