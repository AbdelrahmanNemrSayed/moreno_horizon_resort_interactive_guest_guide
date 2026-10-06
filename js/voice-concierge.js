/**
 * Moreno Horizon Spa & Resort - Voice-Driven AI Concierge & Audio Navigation
 * 
 * Capabilities:
 * 1. Multilingual Speech Recognition (Web Speech API - SpeechRecognition / webkitSpeechRecognition):
 *    - Arabic (ar-EG / ar-SA), English (en-US), Russian (ru-RU), German (de-DE)
 *    - Zero runtime errors if microphone permissions are denied or unsupported.
 * 2. Natural Language Intent Parser:
 *    - Maps natural spoken queries to POI names, categories, and amenities in resortPois (data.js).
 *    - Resolves closest restrooms, restaurants, pools, beach, clinic, reception, etc.
 * 3. Action Trigger:
 *    - Auto-selects resolved POI, triggers MapEngine.navigateDirectTo(), and centers the camera.
 * 4. Turn-by-Turn Spoken Guidance (Web Speech Synthesis - speechSynthesis):
 *    - Announces route commencement with distance and walking time.
 *    - Spoken directions at walkway decision nodes.
 *    - Arrival greeting chime & voice message upon reaching destination.
 */

const VoiceConcierge = {
  isInitialized: false,
  isListening: false,
  isMuted: false,
  recognition: null,
  activeLanguage: 'ar-EG',
  lastSpokenText: '',
  lastSpokenStepIdx: -1,
  audioCtx: null,

  // Multilingual voice locale mapping
  LANG_MAP: {
    ar: 'ar-EG',
    en: 'en-US',
    ru: 'ru-RU',
    de: 'de-DE'
  },

  // Language responses dictionary
  RESPONSES: {
    ar: {
      listening: 'أنا أستمع إليك الآن... تحدث بوجهتك أو سؤالك 🎙️',
      processing: 'جاري فهم طلبك...',
      unrecognized: 'عذراً، لم أستطع تحديد الوجهة بدقة. يرجى ذكر اسم المكان مثل (مطعم سيرينا، مسبح لوتس، الشاطئ، الاستقبال).',
      routeStart: (name, meters) => `بدء الملاحة إلى ${name}، المسافة ${meters} متراً.`,
      arrival: (name) => `لقد وصلت بنجاح إلى ${name}! نتمنى لك قضاء وقت ممتع في مورينو هورايزون.`,
      micDenied: 'يرجى السماح بالوصول للميكروفون من إعدادات المتصفح للاستفادة من المرشد الصوتي.',
      unsupported: 'خاصية التعرف على الصوت غير مدعومة في متصفحك الحالي.'
    },
    en: {
      listening: 'Listening... Say your destination or question 🎙️',
      processing: 'Processing your request...',
      unrecognized: 'Sorry, I could not recognize that location. Try saying Sirena Restaurant, Lotus Pool, Beach, or Reception.',
      routeStart: (name, meters) => `Starting navigation to ${name}, distance is ${meters} meters.`,
      arrival: (name) => `You have arrived at ${name}! Enjoy your time at Moreno Horizon Resort.`,
      micDenied: 'Please allow microphone access in your browser settings to use the voice concierge.',
      unsupported: 'Speech recognition is not supported in this browser.'
    },
    ru: {
      listening: 'Слушаю вас... Назовите место назначения 🎙️',
      processing: 'Обработка вашего запроса...',
      unrecognized: 'Извините, не удалось определить место. Попробуйте сказать: Ресторан Сирена, Бассейн Лотос, Пляж или Ресепшн.',
      routeStart: (name, meters) => `Начало навигации к ${name}, расстояние ${meters} метров.`,
      arrival: (name) => `Вы успешно прибыли в ${name}! Приятного отдыха в Moreno Horizon.`,
      micDenied: 'Пожалуйста, разрешите доступ к микрофону в настройках браузера.',
      unsupported: 'Распознавание речи не поддерживается в этом браузере.'
    },
    de: {
      listening: 'Ich höre zu... Nennen Sie Ihr Ziel 🎙️',
      processing: 'Verarbeite Ihre Anfrage...',
      unrecognized: 'Entschuldigung, ich konnte das Ziel nicht erkennen. Versuchen Sie Sirena Restaurant, Lotus Pool, Strand oder Rezeption.',
      routeStart: (name, meters) => `Navigation zu ${name} gestartet, Entfernung beträgt ${meters} Meter.`,
      arrival: (name) => `Sie haben Ihr Ziel ${name} erreicht! Einen schönen Aufenthalt im Moreno Horizon.`,
      micDenied: 'Bitte erlauben Sie den Mikrofonzugriff in Ihren Browsereinstellungen.',
      unsupported: 'Spracherkennung wird in diesem Browser nicht unterstützt.'
    }
  },

  init() {
    if (this.isInitialized) return;
    this.setupSpeechRecognition();
    const existing = document.getElementById('voiceConciergeFloatingBar');
    if (existing) existing.remove();
    this.bindEvents();
    this.isInitialized = true;
    console.log('[VoiceConcierge] AI Voice Concierge & Audio Navigation initialized.');
  },

  getCurrentLangKey() {
    if (typeof App !== 'undefined' && App.currentLang && this.LANG_MAP[App.currentLang]) {
      return App.currentLang;
    }
    return 'ar';
  },

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VoiceConcierge] Web Speech API SpeechRecognition is not supported in this browser.');
      this.recognition = null;
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 3;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateUiState('listening');
      };

      this.recognition.onresult = (event) => {
        if (!event.results || event.results.length === 0) return;
        const transcript = event.results[0][0].transcript;
        console.log('[VoiceConcierge] Transcribed speech:', transcript);
        this.updateTranscriptUi(transcript);
        this.handleSpokenQuery(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn('[VoiceConcierge] Recognition event:', event.error);
        this.isListening = false;
        this.updateUiState('idle');
        if (event.error === 'not-allowed') {
          this.showToast(this.getLocalizedText('micDenied'));
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateUiState('idle');
      };
    } catch (err) {
      console.warn('[VoiceConcierge] Speech recognition initialization failed:', err);
      this.recognition = null;
    }
  },

  getLocalizedText(key) {
    const lang = this.getCurrentLangKey();
    const dict = this.RESPONSES[lang] || this.RESPONSES.ar;
    return dict[key] || '';
  },

  toggleListening() {
    if (!this.recognition) {
      this.showToast(this.getLocalizedText('unsupported'));
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Safe catch
      }
      this.isListening = false;
      this.updateUiState('idle');
    } else {
      const langKey = this.getCurrentLangKey();
      this.recognition.lang = this.LANG_MAP[langKey] || 'ar-EG';
      try {
        this.recognition.start();
        this.showToast(this.getLocalizedText('listening'));
      } catch (err) {
        console.warn('[VoiceConcierge] Could not start recognition:', err);
        this.isListening = false;
        this.updateUiState('idle');
      }
    }
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    const btnMute = document.getElementById('voiceConciergeMuteBtn');
    if (btnMute) {
      btnMute.innerHTML = this.isMuted ? '🔇' : '🔊';
      btnMute.classList.toggle('opacity-50', this.isMuted);
    }
    const lang = this.getCurrentLangKey();
    const msg = this.isMuted
      ? (lang === 'ar' ? 'تم كتم الصوت الإرشادي 🔇' : 'Audio guidance muted 🔇')
      : (lang === 'ar' ? 'تم تفعيل الصوت الإرشادي 🔊' : 'Audio guidance enabled 🔊');
    this.showToast(msg);
  },

  /**
   * Natural Language Intent Parser:
   * Maps natural language questions to POIs in resortPois
   */
  handleSpokenQuery(rawTranscript) {
    if (!rawTranscript || typeof rawTranscript !== 'string') return;
    const query = rawTranscript.trim();
    this.updateUiState('processing');

    const matchedPoi = this.parseQueryIntent(query);

    if (matchedPoi) {
      this.executeNavigationIntent(matchedPoi);
    } else {
      this.speak(this.getLocalizedText('unrecognized'));
      this.updateTranscriptUi(query, this.getLocalizedText('unrecognized'));
    }
  },

  /**
   * Normalizes Arabic & multilingual search strings
   */
  normalizeText(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/[ى]/g, 'ي')
      .replace(/[ة]/g, 'ه')
      .replace(/[ؤئ]/g, 'ء')
      .replace(/[^\w\s\u0600-\u06FF]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  parseQueryIntent(query) {
    if (typeof resortPois === 'undefined' || !Array.isArray(resortPois)) return null;

    const normQuery = this.normalizeText(query);
    const words = normQuery.split(' ');

    // 1. Category heuristics
    // Restroom / WC
    const wcKeywords = ['حمام', 'حمامات', 'تواليت', 'دوره مياه', 'دورات مياه', 'toilet', 'restroom', 'wc', 'туалет', 'klosett'];
    if (wcKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return this.findClosestPoiByCategory(['wc', 'restroom']) || resortPois.find(p => p.id === '11' || p.id === '12');
    }

    // Swimming Pool
    const poolKeywords = ['مسبح', 'حمامات سباحه', 'بسين', 'حمام سباحه', 'pool', 'swimming pool', 'бассейн', 'schwimmbad'];
    if (poolKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      if (normQuery.includes('واحه') || normQuery.includes('oasis')) {
        return resortPois.find(p => p.id === '16') || resortPois.find(p => p.id === '11');
      }
      return resortPois.find(p => p.id === '11') || resortPois.find(p => p.category === 'pool');
    }

    // Beach & Marina
    const beachKeywords = ['شاطيء', 'شاطي', 'بحر', 'مارينا', 'مرسى', 'beach', 'marina', 'sea', 'пляж', 'strand'];
    if (beachKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return resortPois.find(p => p.id === '1');
    }

    // Lobby & Reception
    const lobbyKeywords = ['استقبال', 'لوبي', 'ريسبشن', 'مكتب الاستقبال', 'lobby', 'reception', 'ресепшн', 'rezeption'];
    if (lobbyKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return resortPois.find(p => p.id === 'M');
    }

    // Clinic & Pharmacy
    const clinicKeywords = ['عياده', 'دكتور', 'طبيب', 'صيدليه', 'اسعاف', 'clinic', 'doctor', 'pharmacy', 'клиника', 'arzt'];
    if (clinicKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return resortPois.find(p => p.id === '15');
    }

    // Aqua park
    const aquaKeywords = ['اكوا بارك', 'اكوابارك', 'زحاليق', 'العاب مائيه', 'aqua park', 'water park', 'аквапарк', 'rutschen'];
    if (aquaKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return resortPois.find(p => p.id === '3');
    }

    // Tennis & Sports
    const tennisKeywords = ['تنس', 'ملاعب تنس', 'كوره', 'tennis', 'tennis court', 'теннис'];
    if (tennisKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return resortPois.find(p => p.id === '10');
    }

    // Spa & Gym
    const spaKeywords = ['سبا', 'مساج', 'جيم', 'لياقه', 'جاكوزي', 'سونا', 'spa', 'gym', 'wellness', 'спа', 'sauna'];
    if (spaKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return resortPois.find(p => p.id === '9');
    }

    // Diving Center
    const divingKeywords = ['غوص', 'سنوركلينج', 'غطس', 'diving', 'scuba', 'дайвинг', 'tauchen'];
    if (divingKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return resortPois.find(p => p.id === '2');
    }

    // Italian Restaurant / La Mama
    const mamaKeywords = ['ايطالي', 'لا ماما', 'بيتزا', 'باستا', 'la mama', 'italian', 'итальянский', 'italienisch'];
    if (mamaKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return resortPois.find(p => p.id === '8');
    }

    // Oriental Grill
    const grillKeywords = ['شرقي', 'مشويات', 'مشاوي', 'شواء', 'oriental', 'grill', 'гриль', 'kebab'];
    if (grillKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return resortPois.find(p => p.id === '6');
    }

    // Sirena Restaurant
    const sirenaKeywords = ['سيرينا', 'مطعم رئيسي', 'بوفيه', 'اكل', 'عشاء', 'غداء', 'افطار', 'sirena', 'buffet', 'restaurant'];
    if (sirenaKeywords.some(k => normQuery.includes(this.normalizeText(k)))) {
      return resortPois.find(p => p.id === '12');
    }

    // 2. Direct string & keyword matching against all POIs
    let bestPoi = null;
    let highestScore = 0;

    for (const poi of resortPois) {
      let score = 0;
      const names = [
        this.normalizeText(poi.nameAr),
        this.normalizeText(poi.nameEn),
        this.normalizeText(poi.nameRu),
        this.normalizeText(poi.nameDe),
        this.normalizeText(poi.tagAr),
        this.normalizeText(poi.category)
      ].filter(Boolean);

      for (const name of names) {
        // Exact containment
        if (normQuery.includes(name) || name.includes(normQuery)) {
          score += 15;
        }

        // Token overlap
        for (const w of words) {
          if (w.length >= 3 && name.includes(w)) {
            score += 4;
          }
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestPoi = poi;
      }
    }

    if (highestScore >= 4) {
      return bestPoi;
    }

    return null;
  },

  findClosestPoiByCategory(cats) {
    if (typeof resortPois === 'undefined') return null;
    const candidates = resortPois.filter(p => cats.includes(p.category) || cats.includes(p.id));
    if (candidates.length === 0) return null;

    // If live location is known, pick closest by Euclidean distance
    if (typeof MapEngine !== 'undefined' && MapEngine.lastGuestPosition) {
      const gX = MapEngine.lastGuestPosition.pctX;
      const gY = MapEngine.lastGuestPosition.pctY;
      let closest = candidates[0];
      let minDist = Infinity;
      for (const c of candidates) {
        const d = Math.hypot(c.coords.x - gX, c.coords.y - gY);
        if (d < minDist) {
          minDist = d;
          closest = c;
        }
      }
      return closest;
    }

    return candidates[0];
  },

  /**
   * Action Trigger:
   * Selects POI, triggers MapEngine.navigateDirectTo(), centers camera, and speaks route start.
   */
  executeNavigationIntent(poi) {
    const lang = this.getCurrentLangKey();
    const locPoi = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr };
    const poiName = locPoi.name || poi.nameAr;

    this.updateTranscriptUi(`وجهتك: ${poiName}`, 'جاري رسم المسار...');

    if (typeof MapEngine !== 'undefined') {
      // Center camera
      if (poi.coords) {
        MapEngine.focusCoordinate(poi.coords.x, poi.coords.y, 1.45, true);
      }

      // Trigger navigation
      if (typeof MapEngine.navigateDirectTo === 'function') {
        MapEngine.navigateDirectTo(poi.id);
      }
    }

    if (typeof App !== 'undefined' && App.selectPoi) {
      App.selectPoi(poi);
    }
  },

  /**
   * Web Speech Synthesis (TTS)
   */
  speak(text) {
    if (this.isMuted) return;
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      const langKey = this.getCurrentLangKey();
      utterance.lang = this.LANG_MAP[langKey] || 'ar-EG';
      utterance.rate = 0.96;
      utterance.pitch = 1.0;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langKey));
        if (matchVoice) {
          utterance.voice = matchVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
      this.lastSpokenText = text;
    } catch (err) {
      console.warn('[VoiceConcierge] Speech synthesis failed:', err);
    }
  },

  /**
   * Turn-by-Turn Spoken Navigation Hooks called by MapEngine
   */
  onRouteCalculated({ destTitle, meters, minutes }) {
    if (this.isMuted) return;
    const lang = this.getCurrentLangKey();
    const dict = this.RESPONSES[lang] || this.RESPONSES.ar;
    const message = dict.routeStart(destTitle, meters);
    this.speak(message);
    this.showToast(`🧭 ${message}`);
  },

  onTurnStep(step, stepIdx, totalSteps) {
    if (this.isMuted) return;
    if (this.lastSpokenStepIdx === stepIdx) return;
    this.lastSpokenStepIdx = stepIdx;

    if (step && step.instruction) {
      this.speak(step.instruction);
    }
  },

  onDestinationArrived(destPoi, destName) {
    this.playArrivalChime();
    const lang = this.getCurrentLangKey();
    const dict = this.RESPONSES[lang] || this.RESPONSES.ar;
    const message = dict.arrival(destName || destPoi.nameAr);
    this.speak(message);
    this.showToast(`🎉 ${message}`);
  },

  playArrivalChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = this.audioCtx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch (e) {
      // AudioContext fallback
    }
  },

  /**
   * Floating UI Elements
   */
  createFloatingUi() {
    if (document.getElementById('voiceConciergeFloatingBar')) return;

    const bar = document.createElement('div');
    bar.id = 'voiceConciergeFloatingBar';
    bar.className = 'fixed bottom-24 end-4 z-40 flex flex-col items-center gap-2 select-none';

    bar.innerHTML = `
      <!-- Speech Transcript Mini Toast -->
      <div id="voiceTranscriptBubble" class="hidden max-w-[260px] p-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 text-white text-xs shadow-2xl backdrop-blur-md transition-all animate-bounce-short">
        <p class="font-bold text-cyan-300 text-[10px] uppercase tracking-wider mb-0.5" id="voiceTranscriptTitle">المرشد الصوتي AI</p>
        <p class="text-slate-100 text-[11px] leading-snug" id="voiceTranscriptBody">...</p>
      </div>

      <!-- Control Buttons Group -->
      <div class="flex items-center gap-1.5 p-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/15 shadow-2xl">
        <!-- Mute/Unmute Audio Guidance -->
        <button id="voiceConciergeMuteBtn" onclick="VoiceConcierge.toggleMute()" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-sm flex items-center justify-center transition active:scale-95" title="تشغيل / كتم الصوت الإرشادي">
          🔊
        </button>

        <!-- Main Pulsing Mic Button -->
        <button id="voiceConciergeMicBtn" onclick="VoiceConcierge.toggleListening()" class="relative w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 via-sky-500 to-teal-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg transition transform active:scale-90 hover:brightness-110" title="تحدث مع المرشد الصوتي الذكي (Voice Concierge)">
          <span id="voiceMicIcon">🎙️</span>
          <span id="voiceMicPulseRing" class="hidden absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping"></span>
        </button>
      </div>
    `;

    document.body.appendChild(bar);
  },

  updateUiState(state) {
    const micBtn = document.getElementById('voiceConciergeMicBtn');
    const pulseRing = document.getElementById('voiceMicPulseRing');
    const bubble = document.getElementById('voiceTranscriptBubble');
    const body = document.getElementById('voiceTranscriptBody');

    if (!micBtn) return;

    if (state === 'listening') {
      micBtn.classList.add('ring-4', 'ring-cyan-400/50', 'from-rose-500', 'to-amber-500');
      if (pulseRing) pulseRing.classList.remove('hidden');
      if (bubble) {
        bubble.classList.remove('hidden');
        if (body) body.textContent = this.getLocalizedText('listening');
      }
    } else if (state === 'processing') {
      if (pulseRing) pulseRing.classList.add('hidden');
      if (body) body.textContent = this.getLocalizedText('processing');
    } else {
      micBtn.classList.remove('ring-4', 'ring-cyan-400/50', 'from-rose-500', 'to-amber-500');
      if (pulseRing) pulseRing.classList.add('hidden');
      setTimeout(() => {
        if (!this.isListening && bubble) {
          bubble.classList.add('hidden');
        }
      }, 3500);
    }
  },

  updateTranscriptUi(transcript, responseText = null) {
    const bubble = document.getElementById('voiceTranscriptBubble');
    const body = document.getElementById('voiceTranscriptBody');
    if (!bubble || !body) return;

    bubble.classList.remove('hidden');
    body.innerHTML = `
      <span class="text-cyan-300 font-bold">"${transcript}"</span>
      ${responseText ? `<div class="mt-1 text-slate-300 text-[10px]">${responseText}</div>` : ''}
    `;
  },

  showToast(message) {
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(message);
    } else {
      console.log('[VoiceConcierge]', message);
    }
  },

  bindEvents() {
    // Re-check voices when available
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }
};

// Global registration
if (typeof window !== 'undefined') {
  window.VoiceConcierge = VoiceConcierge;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VoiceConcierge.init());
  } else {
    VoiceConcierge.init();
  }
}
