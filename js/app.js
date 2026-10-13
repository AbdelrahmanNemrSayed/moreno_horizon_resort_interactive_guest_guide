/**
 * Moreno Horizon Spa & Resort - Main Application Controller
 * Handles UI interactions, Modals, Digital Dining Cart, Audio FX, i18n, Dark Mode, and PWA.
 * Engineered for zero-waterfall, error-free client loading and dual compatibility (Browser + ESM/Node).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var AppInstance = factory();
    root.App = AppInstance;

    // Register global convenience helpers for inline HTML onclick handlers
    root.openEmergencyDrawer = function () { AppInstance.openEmergencyDrawer(); };
    root.openVoiceNavigator = function () { AppInstance.openVoiceNavigator(); };
    root.openHotspotLoginModal = function () { AppInstance.openHotspotLoginModal(); };
    root.openFeedbackModal = function () { AppInstance.openFeedbackModal(); };
    root.openSunShadeModal = function () { AppInstance.openSunShadeModal(); };
    root.openGuestProfileModal = function () { AppInstance.openGuestProfileModal(); };
    root.openSmartHubModal = function () { AppInstance.openSmartHubModal(); };
    root.closeModal = function (modalId) { AppInstance.closeModal(modalId); };
    root.showToast = function (msg, icon, dur) { AppInstance.showToast(msg, icon, dur); };
    root.playBeep = function (freq, dur) { AppInstance.playBeep(freq, dur); };

    // Auto-init when DOM is ready
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { AppInstance.init(); });
      } else {
        AppInstance.init();
      }
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ==========================================
  // Sub-Manager: Audio System
  // ==========================================
  var audioManager = {
    audioContext: null,
    isMuted: false,
    init: function () {
      var savedMute = typeof localStorage !== 'undefined' ? localStorage.getItem('moreno_sound_muted') : null;
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    },
    getAudioContext: function () {
      if (!this.audioContext && typeof window !== 'undefined') {
        try {
          var AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.audioContext = new AudioCtx();
        } catch (e) {
          // AudioContext not supported or permission denied
        }
      }
      return this.audioContext;
    },
    playBeep: function (frequency, duration, type) {
      if (this.isMuted) return;
      frequency = frequency || 880;
      duration = duration || 200;
      type = type || 'sine';
      var ctx = this.getAudioContext();
      if (!ctx) return;
      try {
        var oscillator = ctx.createOscillator();
        var gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        var now = ctx.currentTime;
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
        oscillator.start(now);
        oscillator.stop(now + duration / 1000);
      } catch (err) {
        // Silently catch audio policy blocks
      }
    },
    playChime: function () {
      if (this.isMuted) return;
      this.playBeep(523.25, 120);
      var self = this;
      setTimeout(function () { self.playBeep(659.25, 120); }, 130);
      setTimeout(function () { self.playBeep(783.99, 200); }, 260);
    },
    toggleMute: function () {
      this.isMuted = !this.isMuted;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('moreno_sound_muted', String(this.isMuted));
      }
      return this.isMuted;
    }
  };

  // ==========================================
  // Sub-Manager: Theme & Appearance
  // ==========================================
  var themeManager = {
    currentTheme: 'dark',
    init: function () {
      var saved = typeof localStorage !== 'undefined' ? localStorage.getItem('moreno_theme') : null;
      this.setTheme(saved || 'dark');
    },
    setTheme: function (theme) {
      this.currentTheme = theme;
      if (typeof document !== 'undefined') {
        var root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('moreno_theme', theme);
      }
    },
    toggleTheme: function () {
      var next = this.currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
      return next;
    }
  };

  // ==========================================
  // Sub-Manager: PWA & Service Worker
  // ==========================================
  var pwaManager = {
    deferredPrompt: null,
    registerServiceWorker: function () {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('./sw.js')
            .then(function (reg) {
              console.log('[PWA] Service Worker active, scope:', reg.scope);
            })
            .catch(function (err) {
              console.warn('[PWA] Service Worker registration failed:', err);
            });
        });
      }
    },
    setupInstallPrompt: function () {
      var self = this;
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeinstallprompt', function (e) {
          e.preventDefault();
          self.deferredPrompt = e;
          var btn = document.getElementById('pwaInstallBtn');
          if (btn) btn.classList.remove('hidden');
        });
        window.addEventListener('appinstalled', function () {
          self.deferredPrompt = null;
          var btn = document.getElementById('pwaInstallBtn');
          if (btn) btn.classList.add('hidden');
        });
      }
    },
    installPwa: function () {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        var self = this;
        this.deferredPrompt.userChoice.then(function () {
          self.deferredPrompt = null;
          var btn = document.getElementById('pwaInstallBtn');
          if (btn) btn.classList.add('hidden');
        });
      }
    }
  };

  // ==========================================
  // Sub-Manager: Weather & Marine Forecast
  // ==========================================
  var weatherManager = {
    cacheKey: 'moreno_weather_cache',
    cacheTtl: 30 * 60 * 1000,
    weatherUrl: 'https://api.open-meteo.com/v1/forecast?latitude=27.2579&longitude=33.8116&current=temperature_2m,weather_code&daily=uv_index_max,sunrise,sunset&timezone=Africa%2FCairo&forecast_days=1',
    marineUrl: 'https://marine-api.open-meteo.com/v1/marine?latitude=27.2579&longitude=33.8116&current=wave_height,sea_surface_temperature&timezone=Africa%2FCairo',
    readCache: function () {
      try {
        var cached = JSON.parse(localStorage.getItem(this.cacheKey) || 'null');
        return cached && Number.isFinite(cached.fetchedAt) ? cached : null;
      } catch (e) {
        return null;
      }
    },
    renderWeather: function (data, lang) {
      if (typeof document === 'undefined') return;
      lang = lang || 'ar';
      var t = typeof window !== 'undefined' && window.i18n && window.i18n[lang] ? window.i18n[lang] : {};
      var wvalTemp = document.getElementById('wvalTemp');
      var wvalSea = document.getElementById('wvalSea');
      var wvalUv = document.getElementById('wvalUv');
      var wvalSunset = document.getElementById('wvalSunset');
      var statusEl = document.getElementById('weatherStatus');

      if (!data) {
        if (wvalTemp) wvalTemp.innerText = '28°C';
        if (wvalSea) wvalSea.innerText = '26°C';
        if (wvalUv) wvalUv.innerText = '5.2';
        if (wvalSunset) wvalSunset.innerText = '17:35';
        if (statusEl && t.weather_sunny) statusEl.innerText = t.weather_sunny;
        return;
      }

      if (wvalTemp && data.temp !== undefined) wvalTemp.innerText = Math.round(data.temp) + '°C';
      if (wvalSea && data.seaTemp !== undefined) wvalSea.innerText = Math.round(data.seaTemp) + '°C';
      if (wvalUv && data.uv !== undefined) wvalUv.innerText = data.uv.toFixed(1);
      if (wvalSunset && data.sunset) wvalSunset.innerText = data.sunset;
    },
    refreshWeather: function (lang) {
      var cached = this.readCache();
      if (cached && Date.now() - cached.fetchedAt < this.cacheTtl) {
        this.renderWeather(cached, lang);
        return;
      }
      var self = this;
      if (typeof fetch === 'function') {
        Promise.all([
          fetch(this.weatherUrl).then(function (r) { return r.json(); }).catch(function () { return null; }),
          fetch(this.marineUrl).then(function (r) { return r.json(); }).catch(function () { return null; })
        ]).then(function (results) {
          var w = results[0];
          var m = results[1];
          var data = {
            fetchedAt: Date.now(),
            temp: w && w.current ? w.current.temperature_2m : 28,
            uv: w && w.daily && w.daily.uv_index_max ? w.daily.uv_index_max[0] : 5.0,
            sunset: w && w.daily && w.daily.sunset && w.daily.sunset[0] ? w.daily.sunset[0].split('T')[1] : '17:35',
            seaTemp: m && m.current ? m.current.sea_surface_temperature : 26
          };
          try { localStorage.setItem(self.cacheKey, JSON.stringify(data)); } catch (e) {}
          self.renderWeather(data, lang);
        }).catch(function () {
          self.renderWeather(null, lang);
        });
      } else {
        this.renderWeather(null, lang);
      }
    }
  };

  // ==========================================
  // Sub-Manager: UI & Modal Manager
  // ==========================================
  var uiManager = {
    toastContainer: null,
    openModal: function (modalId) {
      if (typeof document === 'undefined') return;
      var modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        var focusable = modal.querySelector('button, input, select, textarea, [tabindex="0"]');
        if (focusable) setTimeout(function () { focusable.focus(); }, 80);
      }
    },
    closeModal: function (modalId) {
      if (typeof document === 'undefined') return;
      var modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    },
    showToast: function (message, icon, duration) {
      if (typeof document === 'undefined') return;
      icon = icon || '🛎️';
      duration = duration || 3400;

      if (!this.toastContainer) {
        this.toastContainer = document.getElementById('toastContainer');
        if (!this.toastContainer) {
          this.toastContainer = document.createElement('div');
          this.toastContainer.id = 'toastContainer';
          this.toastContainer.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none items-center max-w-sm w-full px-4';
          document.body.appendChild(this.toastContainer);
        }
      }

      var toast = document.createElement('div');
      toast.className = 'toast-msg glass-card p-3 rounded-2xl border border-amber-500/30 shadow-2xl flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-white pointer-events-auto transform transition-all duration-300';

      var iconEl = document.createElement('span');
      iconEl.className = 'w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm shadow-sm shrink-0';
      iconEl.textContent = icon;

      var messageEl = document.createElement('span');
      messageEl.className = 'flex-1 leading-snug';
      messageEl.textContent = message;

      toast.appendChild(iconEl);
      toast.appendChild(messageEl);
      this.toastContainer.appendChild(toast);

      setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px) scale(0.95)';
        setTimeout(function () { toast.remove(); }, 320);
      }, duration);
    }
  };

  // ==========================================
  // Main App Controller
  // ==========================================
  var App = {
    currentLang: 'ar',
    currentTheme: 'dark',
    isSoundMuted: false,
    cart: [],
    activeServiceOrder: null,
    isInitialized: false,

    init: function () {
      if (this.isInitialized) return;
      this.isInitialized = true;
      console.log('[App] Initializing Moreno Horizon Guest Guide v48.0...');

      // 1. Theme
      themeManager.init();
      this.currentTheme = themeManager.currentTheme;

      // 2. Audio
      audioManager.init();
      this.isSoundMuted = audioManager.isMuted;

      // 3. i18n
      this.initI18n();

      // 4. PWA
      pwaManager.registerServiceWorker();
      pwaManager.setupInstallPrompt();

      // 5. Weather
      weatherManager.refreshWeather(this.currentLang);

      // 6. Clock & UI state
      this.startResortClock();
      this.loadSavedRoom();
      this.updateCartBadge();
      this.bindKeyboardShortcuts();

      // 7. Initialize Map & Voice if present
      if (typeof window !== 'undefined') {
        if (window.MapEngine && typeof window.MapEngine.init === 'function') {
          window.MapEngine.init();
        }
        if (window.VoiceConcierge && typeof window.VoiceConcierge.init === 'function') {
          window.VoiceConcierge.init();
        }
      }

      console.log('[App] System fully initialized and ready.');
    },

    initI18n: function () {
      if (typeof localStorage !== 'undefined') {
        this.currentLang = localStorage.getItem('moreno_language') || 'ar';
      }
      this.applyLanguage(this.currentLang);
    },

    applyLanguage: function (lang) {
      this.currentLang = lang;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('moreno_language', lang);
      }

      if (typeof window !== 'undefined' && window.I18nEngine) {
        window.I18nEngine.setLanguage(lang);
      }

      if (typeof document !== 'undefined') {
        var root = document.documentElement;
        root.setAttribute('lang', lang);
        root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        this.updateI18nElements();
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
      }
    },

    updateI18nElements: function () {
      if (typeof document === 'undefined') return;
      var self = this;
      var elements = document.querySelectorAll('[data-i18n]');
      elements.forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (!key) return;
        var text = null;
        if (typeof window !== 'undefined' && window.I18nEngine && typeof window.I18nEngine.t === 'function') {
          text = window.I18nEngine.t(key);
        } else if (typeof window !== 'undefined' && window.i18n && window.i18n[self.currentLang]) {
          text = window.i18n[self.currentLang][key];
        }
        if (text) {
          if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
            el.setAttribute('placeholder', text);
          } else {
            el.textContent = text;
          }
        }
      });
    },

    changeLanguage: function (lang) {
      this.applyLanguage(lang);
      weatherManager.refreshWeather(lang);
      this.playBeep(650, 100);
    },

    playBeep: function (frequency, duration, type) {
      audioManager.playBeep(frequency, duration, type);
    },

    playChime: function () {
      audioManager.playChime();
    },

    toggleSound: function () {
      this.isSoundMuted = audioManager.toggleMute();
      var msg = this.isSoundMuted ? 'تم كتم الصوت' : 'تم تفعيل المؤثرات الصوتية';
      this.showToast(msg, this.isSoundMuted ? '🔇' : '🔊');
      return this.isSoundMuted;
    },

    toggleTheme: function () {
      this.currentTheme = themeManager.toggleTheme();
      this.playBeep(700, 80);
      var msg = this.currentTheme === 'dark' ? 'المظهر الداكن الملكي' : 'المظهر الفاتح الصباحي';
      this.showToast(msg, this.currentTheme === 'dark' ? '🌙' : '☀️');
      return this.currentTheme;
    },

    setTheme: function (theme) {
      themeManager.setTheme(theme);
      this.currentTheme = theme;
    },

    isDarkMode: function () {
      return this.currentTheme === 'dark';
    },

    showToast: function (msg, icon, duration) {
      uiManager.showToast(msg, icon, duration);
    },

    openModal: function (modalId) {
      uiManager.openModal(modalId);
      this.playBeep(600, 80);
    },

    closeModal: function (modalId) {
      uiManager.closeModal(modalId);
    },

    closeAllModals: function () {
      if (typeof document === 'undefined') return;
      var modals = document.querySelectorAll('[id$="Modal"], [id$="drawer"], [id*="modal"]');
      modals.forEach(function (m) {
        m.classList.add('hidden');
        m.classList.remove('flex');
      });
    },

    // Specific modal convenience triggers
    openEmergencyDrawer: function () {
      this.openModal('emergencyDrawer');
    },

    openVoiceNavigator: function () {
      if (typeof window !== 'undefined' && window.VoiceConcierge) {
        window.VoiceConcierge.toggleListening();
      } else {
        this.showToast('المرشد الصوتي الذكي جاهز للاستخدام 🎙️', '🧭');
      }
    },

    openHotspotLoginModal: function () {
      this.openModal('hotspotLoginModal');
    },

    openFeedbackModal: function () {
      this.openModal('feedbackModal');
    },

    openSunShadeModal: function () {
      this.openModal('sunShadeModal');
    },

    openGuestProfileModal: function () {
      this.openModal('guestProfileModal');
    },

    closeGuestProfileModal: function () {
      this.closeModal('guestProfileModal');
    },

    openSmartHubModal: function () {
      this.openModal('smartHubModal');
    },

    closeSmartHubModal: function () {
      this.closeModal('smartHubModal');
    },

    installPwa: function () {
      pwaManager.installPwa();
    },

    toggleSunlightMode: function () {
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('beach-mode');
        var isActive = document.body.classList.contains('beach-mode');
        this.showToast(isActive ? 'وضع الشاطئ عالي التباين مفعل 🏖️' : 'تم إيقاف وضع الشاطئ', '☀️');
      }
    },

    openCinematicPromoVideo: function () {
      this.openModal('promoVideoModal');
    },

    startCinematicTour: function () {
      if (typeof window !== 'undefined' && window.MapEngine && typeof window.MapEngine.startFlyover === 'function') {
        window.MapEngine.startFlyover();
      } else {
        this.showToast('جولة الخريطة التفاعلية تبدأ الآن', '🚁');
      }
    },

    openMikrotikPortal: function () {
      if (typeof window !== 'undefined') {
        window.open('http://192.1.1.1/login', '_blank');
      }
    },

    // Guest Room persistence
    loadSavedRoom: function () {
      if (typeof localStorage === 'undefined') return;
      var room = localStorage.getItem('moreno_guest_room');
      if (room) {
        this.prefillRoomSearch(room);
      }
    },

    saveGuestRoom: function (room, name) {
      if (typeof localStorage !== 'undefined') {
        if (room) localStorage.setItem('moreno_guest_room', String(room));
        if (name) localStorage.setItem('moreno_guest_name', String(name));
      }
      this.prefillRoomSearch(room);
      this.showToast('تم حفظ بيانات الغرفة بنجاح', '👑');
    },

    prefillRoomSearch: function (room) {
      if (typeof document === 'undefined' || !room) return;
      ['roomSearchInput', 'bookRoomNum', 'vipServiceRoomInput', 'srvRoomNumberInput'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !el.value) el.value = room;
      });
    },

    // Cart and order management
    addToCart: function (item) {
      this.cart.push(item);
      this.updateCartBadge();
      this.playBeep(880, 100);
      this.showToast('تمت الإضافة إلى الطلب', '🛒');
    },

    removeFromCart: function (itemId) {
      this.cart = this.cart.filter(function (it) { return it.id !== itemId; });
      this.updateCartBadge();
    },

    updateCartBadge: function () {
      if (typeof document === 'undefined') return;
      var badge = document.getElementById('cartBadge');
      if (badge) {
        badge.textContent = String(this.cart.length);
        if (this.cart.length === 0) {
          badge.classList.add('hidden');
        } else {
          badge.classList.remove('hidden');
        }
      }
    },

    // Clock display
    startResortClock: function () {
      if (typeof document === 'undefined') return;
      var clockEl = document.getElementById('resortClock');
      if (!clockEl) return;
      var self = this;
      this.updateClock(clockEl);
      setInterval(function () { self.updateClock(clockEl); }, 1000);
    },

    updateClock: function (clockEl) {
      var date = new Date();
      var locale = { ar: 'ar-EG', en: 'en-GB', ru: 'ru-RU', de: 'de-DE' }[this.currentLang] || 'ar-EG';
      try {
        var timeStr = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);
        clockEl.textContent = timeStr;
      } catch (e) {
        clockEl.textContent = date.toTimeString().substring(0, 5);
      }
    },

    // Keyboard navigation
    bindKeyboardShortcuts: function () {
      if (typeof document === 'undefined') return;
      var self = this;
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          self.closeAllModals();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          self.openSpotlightSearch();
        }
      });
    },

    openSpotlightSearch: function () {
      var input = document.getElementById('spotlightSearch') || document.getElementById('roomSearchInput');
      if (input) input.focus();
    },

    shareGuestCoordinates: function () {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        this.showToast('تحديد الموقع غير مدعوم في متصفحك', '⚠️');
        return;
      }
      var self = this;
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          var url = 'https://wa.me/?text=' + encodeURIComponent('أنا في منتجع مورينو هورايزون: https://maps.google.com/?q=' + lat + ',' + lng);
          window.open(url, '_blank');
        },
        function () {
          self.showToast('تعذر جلب إحداثيات الموقع الحالي', '⚠️');
        }
      );
    }
  };

  return App;
});
