(function(){
  const AudioAgent = {
    recognition: null,
    recognizing: false,
    speechEnabled: true,

    init() {
      this.initSpeechRecognition();
      this.updateVoiceButton();
      this.updateSpeechButton();
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

    speak(text, opts = {}){
      try {
        const msg = new SpeechSynthesisUtterance(this.stripHtml(text));
        msg.lang = 'en-US';
        msg.rate = 1.0;
        msg.pitch = 1.0;
        msg.volume = 1.0;
        if (!this.speechEnabled && !opts.forceSpeak) return;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(msg);
      } catch (e) {
        console.warn('Speech synthesis unavailable:', e);
      }
    },

    toggleSpeechOutput(){
      this.speechEnabled = !this.speechEnabled;
      this.updateSpeechButton();
    },

    startVoiceChat(onTranscript){
      if (!this.recognition) {
        alert('Your browser does not support voice input. Please use Chrome or Edge.');
        return;
      }
      if (this.recognizing) {
        this.recognition.stop();
        return;
      }
      this.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join(' ')
          .trim();
        if (transcript && typeof onTranscript === 'function') {
          onTranscript(transcript);
        }
      };
      this.recognition.start();
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