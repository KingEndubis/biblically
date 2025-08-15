(function(){
  const AudioAgent = {
    recognition: null,
    recognizing: false,
    speechEnabled: true,
    conversationContext: {
      currentVerse: null,
      currentCommentary: null,
      currentLexicon: null,
      currentCrossRefs: null
    },

    // Transport state
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    isPaused: false,
    currentUtterance: null,
    // Audio bar elements
    playBtn: null,
    stopBtn: null,
    labelEl: null,
    progressEl: null,

    init() {
      this.initSpeechRecognition();
      this.updateVoiceButton();
      this.updateSpeechButton();
      this.initAudioBar();
    },

    initSpeechRecognition(){
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        console.warn('SpeechRecognition not supported in this browser.');
        return;
      }
      this.recognition = new SR();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.addEventListener('start', () => {
        this.recognizing = true;
        this.updateVoiceButton(true);
      });
      this.recognition.addEventListener('end', () => {
        this.recognizing = false;
        this.updateVoiceButton(false);
      });
      this.recognition.addEventListener('error', (e) => {
        console.error('Speech recognition error:', e);
        this.recognizing = false;
        this.updateVoiceButton(false);
      });
    },

    initAudioBar(){
      this.playBtn = document.getElementById('audio-bar-play');
      this.stopBtn = document.getElementById('audio-bar-stop');
      this.labelEl = document.getElementById('audio-bar-label');
      this.progressEl = document.getElementById('audio-bar-progress-inner');
      if (this.playBtn) {
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.playBtn.title = 'Play';
        this.playBtn.addEventListener('click', () => this.togglePlayPause());
      }
      if (this.stopBtn) {
        this.stopBtn.addEventListener('click', () => this.stopPlayback());
      }
      this.setAudioLabel('Ready');
      this.setProgress(0);
    },

    setAudioLabel(text){
      if (this.labelEl) this.labelEl.textContent = text;
    },

    setProgress(percent){
      if (this.progressEl) this.progressEl.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    },

    updatePlayButtonIcon(){
      if (!this.playBtn) return;
      if (this.isPlaying && !this.isPaused) {
        this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        this.playBtn.title = 'Pause';
      } else {
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.playBtn.title = 'Play';
      }
    },

    updateVoiceButton(active){
      const btn = document.getElementById('voice-chat-btn');
      if (!btn) return;
      if (active || this.recognizing) {
        btn.classList.add('active');
        btn.title = 'Listening... click to cancel';
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      } else {
        btn.classList.remove('active');
        btn.title = 'Voice Chat';
        btn.innerHTML = '<i class="fas fa-microphone"></i>';
      }
    },

    updateSpeechButton(){
      const btn = document.getElementById('speech-output-toggle');
      if (!btn) return;
      btn.innerHTML = this.speechEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
      btn.title = this.speechEnabled ? 'Speech On' : 'Speech Off';
    },

    stripHtml(html){
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    },

    // Low-level speak for ad-hoc outputs (chat, etc.)
    speak(text, opts = {}){
      try {
        const msg = new SpeechSynthesisUtterance(this.stripHtml(text));
        msg.lang = 'en-US';
        msg.rate = opts.rate || 0.9;
        msg.pitch = opts.pitch || 1.0;
        msg.volume = opts.volume || 1.0;
        if (!this.speechEnabled && !opts.forceSpeak) return;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(msg);
        this.setAudioLabel('Speaking');
        this.setProgress(0);
        msg.onend = () => {
          this.setAudioLabel('Ready');
          this.setProgress(0);
        };
      } catch (e) {
        console.warn('Speech synthesis unavailable:', e);
      }
    },

    // Internal: speak a single utterance without cancelling queue
    _speakUtterance(text, opts = {}, onEnd, onBoundary){
      try {
        if (!this.speechEnabled && !opts.forceSpeak) { if (onEnd) onEnd(); return; }
        const msg = new SpeechSynthesisUtterance(this.stripHtml(text));
        msg.lang = 'en-US';
        msg.rate = opts.rate || 0.85; // slightly slower for scripture
        msg.pitch = opts.pitch || 1.0;
        msg.volume = opts.volume || 1.0;
        msg.onend = () => onEnd && onEnd();
        if (onBoundary) msg.onboundary = onBoundary;
        this.currentUtterance = msg;
        window.speechSynthesis.speak(msg);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
        if (onEnd) onEnd();
      }
    },

    // Queue helpers
    startQueue(items, label){
      // items: array of { text, meta }
      window.speechSynthesis.cancel();
      this.queue = items || [];
      this.currentIndex = (this.queue.length ? 0 : -1);
      this.isPlaying = this.queue.length > 0;
      this.isPaused = false;
      this.updatePlayButtonIcon();
      this.setAudioLabel(label || 'Playing');
      this.setProgress(0);
      if (this.isPlaying) this._playCurrent();
    },

    _playCurrent(){
      if (!this.queue.length || this.currentIndex < 0 || this.currentIndex >= this.queue.length) {
        this._donePlayback();
        return;
      }
      const current = this.queue[this.currentIndex];
      const totalItems = this.queue.length;
      const baseProgress = (this.currentIndex / totalItems) * 100;
      this.setAudioLabel(current.label || 'Playing');
      this._speakUtterance(current.text, { forceSpeak: true, rate: current.rate || 0.85 }, () => {
        // On end, advance to next item
        this.currentIndex++;
        if (this.currentIndex < this.queue.length) {
          this.setProgress(Math.min(99, (this.currentIndex / totalItems) * 100));
          // Avoid tight loop to allow UI to repaint
          setTimeout(() => this._playCurrent(), 50);
        } else {
          this._donePlayback();
        }
      }, (ev) => {
        // Boundary progress within current item (if supported)
        if (typeof ev.charIndex === 'number' && current.text && current.text.length) {
          const frac = Math.min(1, ev.charIndex / current.text.length);
          const percent = baseProgress + (frac * (100 / totalItems));
          this.setProgress(percent);
        }
      });
    },

    _donePlayback(){
      this.isPlaying = false;
      this.isPaused = false;
      this.queue = [];
      this.currentIndex = -1;
      this.currentUtterance = null;
      this.updatePlayButtonIcon();
      this.setAudioLabel('Finished');
      setTimeout(() => this.setAudioLabel('Ready'), 1200);
      this.setProgress(100);
      setTimeout(() => this.setProgress(0), 800);
    },

    togglePlayPause(){
      if (!this.isPlaying) {
        // Nothing to resume; ignore
        return;
      }
      if (this.isPaused) {
        try { window.speechSynthesis.resume(); } catch(_){}
        this.isPaused = false;
        this.updatePlayButtonIcon();
        this.setAudioLabel('Playing');
      } else {
        try { window.speechSynthesis.pause(); } catch(_){}
        this.isPaused = true;
        this.updatePlayButtonIcon();
        this.setAudioLabel('Paused');
      }
    },

    stopPlayback(){
      try { window.speechSynthesis.cancel(); } catch(_){}
      this.isPlaying = false;
      this.isPaused = false;
      this.queue = [];
      this.currentIndex = -1;
      this.currentUtterance = null;
      this.updatePlayButtonIcon();
      this.setAudioLabel('Stopped');
      this.setProgress(0);
    },

    // Play chapter audio by reading all verses sequentially (queue-based)
    async playChapter(book, chapter, translation = 'KJV') {
      try {
        const chapterData = await window.BibleAgent.getChapterAsync(translation, book, chapter);
        if (!chapterData || !chapterData.verses) {
          this.speak('Chapter text not available for audio playback.');
          return;
        }
        const items = [];
        // Title first
        items.push({ text: `${book} chapter ${chapter}`, label: `${book} ${chapter}`, rate: 0.9 });
        // Verses
        chapterData.verses.forEach(v => {
          items.push({ text: `Verse ${v.verse}. ${v.text}`, label: `${book} ${chapter}:${v.verse}`, rate: 0.85 });
        });
        this.startQueue(items, `Playing ${book} ${chapter}`);
      } catch (error) {
        console.error('Error playing chapter audio:', error);
        this.speak('Unable to play chapter audio at this time.');
      }
    },

    // Play individual verse audio (queue-based)
    playVerse(reference, text) {
      if (!reference || !text) return;
      const items = [ { text: `${reference}. ${text}`, label: reference, rate: 0.85 } ];
      this.startQueue(items, `Playing ${reference}`);
    },

    // Set conversation context for smarter responses
    setConversationContext({ verse, commentary, lexicon, crossRefs } = {}) {
      this.conversationContext = {
        currentVerse: verse || null,
        currentCommentary: commentary || null,
        currentLexicon: lexicon || null,
        currentCrossRefs: crossRefs || null
      };
    },

    // Enhanced conversation with context awareness
    async startContextualVoiceChat(onTranscript, contextType = 'general') {
      if (!this.recognition) {
        alert('Your browser does not support voice input. Please use Chrome or Edge.');
        return;
      }
      if (this.recognizing) {
        this.recognition.stop();
        return;
      }
      
      this.recognition.onresult = async (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join(' ')
          .trim();
        
        if (transcript && typeof onTranscript === 'function') {
          // Build contextual prompt based on available context
          let contextualPrompt = transcript;
          const ctx = this.conversationContext;
          
          if (contextType === 'verse' && ctx.currentVerse) {
            contextualPrompt = `Regarding ${ctx.currentVerse.reference} ("${ctx.currentVerse.text}"): ${transcript}`;
          } else if (contextType === 'commentary' && ctx.currentCommentary) {
            contextualPrompt = `About the commentary on ${ctx.currentVerse?.reference || 'this verse'}: ${transcript}. Commentary context: ${ctx.currentCommentary}`;
          } else if (contextType === 'lexicon' && ctx.currentLexicon) {
            contextualPrompt = `Regarding the word "${ctx.currentLexicon.word}" in ${ctx.currentVerse?.reference || 'this verse'}: ${transcript}. Lexicon context: ${JSON.stringify(ctx.currentLexicon.entry)}`;
          } else if (contextType === 'cross-refs' && ctx.currentCrossRefs) {
            contextualPrompt = `About cross-references for ${ctx.currentVerse?.reference || 'this verse'}: ${transcript}. Cross-references: ${ctx.currentCrossRefs.join(', ')}`;
          }
          
          await onTranscript(contextualPrompt);
        }
      };
      this.recognition.start();
    },

    toggleSpeechOutput(){
      this.speechEnabled = !this.speechEnabled;
      this.updateSpeechButton();
    },

    startVoiceChat(onTranscript){
      return this.startContextualVoiceChat(onTranscript, 'general');
    },

    async processVoiceChat(transcript, currentVerse){
      const styleHint = 'modern conversational literary style while preserving original meaning and key theological terms';
      const prompt = currentVerse
        ? `Paraphrase ${currentVerse} in a ${styleHint}. Keep meaning faithful and include brief notes for key Greek/Hebrew terms where relevant.`
        : `${transcript}. Please answer in a ${styleHint}, keeping fidelity to original context and noting key lexicon terms.`;

      let response;
      if (window.AIAgent && typeof window.AIAgent.chatEnhanced === 'function') {
        response = await window.AIAgent.chatEnhanced(prompt);
      } else if (window.AIAgent && typeof window.AIAgent.chat === 'function') {
        response = await window.AIAgent.chat(prompt);
      } else {
        response = 'AI is not available right now.';
      }

      if (response && this.speechEnabled) {
        this.speak(response, { forceSpeak: true });
      }
      return response;
    }
  };

  window.AudioAgent = AudioAgent;
  document.addEventListener('DOMContentLoaded', () => AudioAgent.init());
})();