/**
 * Moreno Horizon Spa & Resort - Main Application Controller
 * Handles UI interactions, Modals, Digital Dining Cart, Audio FX, i18n, Dark Mode, and PWA.
 * Engineered for zero-waterfall, error-free client loading and dual compatibility (Browser + ESM/Node).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const AppInstance = factory();
    root.App = AppInstance;

    // Register global convenience helpers for inline HTML onclick handlers
    root.changeLanguage = function (lang) { AppInstance.changeLanguage(lang); };
    root.handleRoomLookup = function () { if (typeof Wayfinder !== 'undefined' && Wayfinder.lookupRoom) Wayfinder.lookupRoom(); };
    root.lookupRoom = function () { if (typeof Wayfinder !== 'undefined' && Wayfinder.lookupRoom) Wayfinder.lookupRoom(); };
    root.findRoom = function () { if (typeof Wayfinder !== 'undefined' && Wayfinder.lookupRoom) Wayfinder.lookupRoom(); };
    root.toggleAudio = function () { return AppInstance.toggleSound(); };
    root.toggleSound = function () { return AppInstance.toggleSound(); };
    root.toggleDarkMode = function () { return AppInstance.toggleTheme(); };
    root.toggleTheme = function () { return AppInstance.toggleTheme(); };
    root.toggleSunlightMode = function () { AppInstance.toggleSunlightMode(); };
    root.openEmergencyDrawer = function () { AppInstance.openEmergencyDrawer(); };
    root.openVoiceNavigator = function () { AppInstance.openVoiceNavigator(); };
    root.openHotspotLoginModal = function () { AppInstance.openHotspotLoginModal(); };
    root.openWifiModal = function () { AppInstance.openHotspotLoginModal(); };
    root.openFeedbackModal = function () { AppInstance.openFeedbackModal(); };
    root.openSunShadeModal = function () { AppInstance.openSunShadeModal(); };
    root.openGuestProfileModal = function () { AppInstance.openGuestProfileModal(); };
    root.closeGuestProfileModal = function () { AppInstance.closeGuestProfileModal(); };
    root.saveGuestProfile = function (e) { AppInstance.saveGuestProfile(e); };
    root.openSmartHubModal = function () { AppInstance.openSmartHubModal(); };
    root.closeSmartHubModal = function () { AppInstance.closeSmartHubModal(); };
    root.openCompendiumModal = function () { AppInstance.openModal('smartHubModal'); };
    root.openCinematicPromoVideo = function () { if (typeof PromoVideoPlayer !== 'undefined') PromoVideoPlayer.open(); else AppInstance.openCinematicPromoVideo(); };
    root.openGalleryModal = function (cat) { if (typeof GalleryManager !== 'undefined') GalleryManager.open(cat || 'all'); else AppInstance.openGalleryModal(cat); };
    root.startCinematicTour = function () { AppInstance.startCinematicTour(); };
    root.openAiChatModal = function () { AppInstance.openModal('aiChatModal'); };
    root.openWhereAmIModal = function () { if (typeof MapEngine !== 'undefined') MapEngine.locateMe(); };
    root.toggleMapFullscreen = function () { if (typeof MapEngine !== 'undefined') MapEngine.toggleFullscreen(); };
    root.resetMapTransform = function () { if (typeof MapEngine !== 'undefined') MapEngine.fitToViewport(); };
    root.zoomMap = function (delta) { if (typeof MapEngine !== 'undefined') MapEngine.zoom(delta); };
    root.scrollToSection = function (id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };
    root.calculateCustomRoute = function () { if (typeof Wayfinder !== 'undefined') Wayfinder.calculateRoute(); };
    root.resetWayfinder = function () { if (typeof Wayfinder !== 'undefined') Wayfinder.reset(); };
    root.takeMeToMyRoom = function () { if (typeof Wayfinder !== 'undefined') Wayfinder.takeMeToMyRoom(); };
    root.clearSavedRoom = function () { AppInstance.clearSavedRoom(); };
    root.quickSelectRoom = function (num) { if (typeof Wayfinder !== 'undefined') Wayfinder.quickSelectRoom(num); };
    root.openPoiModal = function (poi) { AppInstance.openPoiModal(poi); };
    root.closeModal = function (modalId) { AppInstance.closeModal(modalId); };
    root.showToast = function (msg, icon, dur) { AppInstance.showToast(msg, icon, dur); };
    root.playBeep = function (freq, dur) { AppInstance.playBeep(freq, dur); };
    root.updateMealScheduleTracker = function () { AppInstance.updateMealScheduleTracker(); };
    root.setWayfinderTab = function (tab) { if (typeof Wayfinder !== 'undefined' && Wayfinder.setTab) Wayfinder.setTab(tab); };
    root.swapWayfinderPoints = function () { if (typeof Wayfinder !== 'undefined' && Wayfinder.swapPoints) Wayfinder.swapPoints(); };

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
  const audioManager = {
    audioContext: null,
    isMuted: false,
    init: function () {
      const savedMute = typeof localStorage !== 'undefined' ? localStorage.getItem('moreno_sound_muted') : null;
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    },
    getAudioContext: function () {
      if (!this.audioContext && typeof window !== 'undefined') {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
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
      const ctx = this.getAudioContext();
      if (!ctx) return;
      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        const now = ctx.currentTime;
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
      const self = this;
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
  const themeManager = {
    currentTheme: 'dark',
    init: function () {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('moreno_theme') : null;
      this.setTheme(saved || 'dark');
    },
    updateIcons: function (theme) {
      if (typeof document === 'undefined') return;
      const sun = document.getElementById('sunIcon');
      const moon = document.getElementById('moonIcon');
      if (sun) sun.style.display = theme === 'dark' ? 'block' : 'none';
      if (moon) moon.style.display = theme === 'dark' ? 'none' : 'block';
    },
    setTheme: function (theme) {
      this.currentTheme = theme;
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        this.updateIcons(theme);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('moreno_theme', theme);
      }
    },
    toggleTheme: function () {
      const next = this.currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
      return next;
    }
  };

  // ==========================================
  // Sub-Manager: PWA & Service Worker
  // ==========================================
  const pwaManager = {
    deferredPrompt: null,
    registerServiceWorker: function () {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('./sw.js')
            .then(function (reg) {
              console.log('[PWA] Service Worker active, scope:', reg.scope);
              if (reg.update) {
                reg.update();
              }
            })
            .catch(function (err) {
              console.warn('[PWA] Service Worker registration failed:', err);
            });
        });
      }
    },
    setupInstallPrompt: function () {
      const self = this;
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeinstallprompt', function (e) {
          e.preventDefault();
          self.deferredPrompt = e;
          const btn = document.getElementById('pwaInstallBtn');
          if (btn) btn.classList.remove('hidden');
        });
        window.addEventListener('appinstalled', function () {
          self.deferredPrompt = null;
          const btn = document.getElementById('pwaInstallBtn');
          if (btn) btn.classList.add('hidden');
        });
      }
    },
    installPwa: function () {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const self = this;
        this.deferredPrompt.userChoice.then(function () {
          self.deferredPrompt = null;
          const btn = document.getElementById('pwaInstallBtn');
          if (btn) btn.classList.add('hidden');
        });
      }
    }
  };

  // ==========================================
  // Sub-Manager: Weather & Marine Forecast
  // ==========================================
  const weatherManager = {
    cacheKey: 'moreno_weather_cache',
    cacheTtl: 30 * 60 * 1000,
    weatherUrl: 'https://api.open-meteo.com/v1/forecast?latitude=27.2579&longitude=33.8116&current=temperature_2m,weather_code&daily=uv_index_max,sunrise,sunset&timezone=Africa%2FCairo&forecast_days=1',
    marineUrl: 'https://marine-api.open-meteo.com/v1/marine?latitude=27.2579&longitude=33.8116&current=wave_height,sea_surface_temperature&timezone=Africa%2FCairo',
    readCache: function () {
      try {
        const cached = JSON.parse(localStorage.getItem(this.cacheKey) || 'null');
        return cached && Number.isFinite(cached.fetchedAt) ? cached : null;
      } catch (e) {
        return null;
      }
    },
    renderWeather: function (data, lang) {
      if (typeof document === 'undefined') return;
      lang = lang || 'ar';
      const t = typeof window !== 'undefined' && window.i18n && window.i18n[lang] ? window.i18n[lang] : {};
      const wvalTemp = document.getElementById('wvalTemp');
      const wvalSea = document.getElementById('wvalSea');
      const wvalUv = document.getElementById('wvalUv');
      const wvalSunset = document.getElementById('wvalSunset');
      const statusEl = document.getElementById('weatherStatus');

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
      const cached = this.readCache();
      if (cached && Date.now() - cached.fetchedAt < this.cacheTtl) {
        this.renderWeather(cached, lang);
        return;
      }
      const self = this;
      if (typeof fetch === 'function') {
        Promise.all([
          fetch(this.weatherUrl).then(function (r) { return r.json(); }).catch(function () { return null; }),
          fetch(this.marineUrl).then(function (r) { return r.json(); }).catch(function () { return null; })
        ]).then(function (results) {
          const w = results[0];
          const m = results[1];
          const data = {
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
  const uiManager = {
    toastContainer: null,
    openModal: function (modalId) {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        const focusable = modal.querySelector('button, input, select, textarea, [tabindex="0"]');
        if (focusable) setTimeout(function () { focusable.focus(); }, 80);
      }
    },
    closeModal: function (modalId) {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById(modalId);
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

      const toast = document.createElement('div');
      toast.className = 'toast-msg glass-card p-3 rounded-2xl border border-amber-500/30 shadow-2xl flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-white pointer-events-auto transform transition-all duration-300';

      const iconEl = document.createElement('span');
      iconEl.className = 'w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm shadow-sm shrink-0';
      iconEl.textContent = icon;

      const messageEl = document.createElement('span');
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
  const App = {
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
      if (typeof window !== 'undefined' && window.__pendingLang) {
        this.applyLanguage(window.__pendingLang);
        delete window.__pendingLang;
      }

      // Explicit DOM event bindings for navbar controls (avoid duplicate execution if inline handlers exist)
      if (typeof document !== 'undefined') {
        const langSel = document.getElementById('langSelect');
        if (langSel && !langSel.getAttribute('onchange')) {
          langSel.addEventListener('change', function (e) {
            App.changeLanguage(e.target.value);
          });
        }
        const darkBtn = document.getElementById('darkModeToggleBtn');
        if (darkBtn && !darkBtn.getAttribute('onclick')) {
          darkBtn.addEventListener('click', function () {
            App.toggleTheme();
          });
        }
      }

      // 4. PWA
      pwaManager.registerServiceWorker();
      pwaManager.setupInstallPrompt();

      // 5. Weather
      try {
        weatherManager.refreshWeather(this.currentLang);
      } catch (err) {
        console.warn('[App] Initial weather fetch skipped:', err);
      }

      // 6. Clock & UI state
      this.startResortClock();
      this.loadSavedRoom();
      this.updateCartBadge();
      this.bindKeyboardShortcuts();

      // 7. Initialize Map & Voice if present
      if (typeof window !== 'undefined') {
        try {
          if (window.MapEngine && typeof window.MapEngine.init === 'function') {
            window.MapEngine.init();
          }
        } catch (e) {
          console.warn('[App] MapEngine init skipped:', e);
        }
        try {
          if (window.VoiceConcierge && typeof window.VoiceConcierge.init === 'function') {
            window.VoiceConcierge.init();
          }
        } catch (e) {
          console.warn('[App] VoiceConcierge init skipped:', e);
        }
      }

      // 8. Load resort state (beach flag + POI statuses) from server
      this.loadResortState();
      this.initLiveResortStream();

      console.log('[App] System fully initialized and ready.');
    },

    initI18n: function () {
      if (typeof localStorage !== 'undefined') {
        this.currentLang = localStorage.getItem('moreno_language') || 'ar';
      }
      this.applyLanguage(this.currentLang);
    },

    t: function (key, params) {
      if (typeof window !== 'undefined' && window.I18nEngine && typeof window.I18nEngine.t === 'function') {
        const res = window.I18nEngine.t(key, params, this.currentLang);
        if (res && res !== key) return res;
      }
      if (typeof window !== 'undefined' && window.i18n && window.i18n[this.currentLang]) {
        const res = window.i18n[this.currentLang][key];
        if (res) return res;
      }
      if (typeof window !== 'undefined' && window.i18n && window.i18n.ar && window.i18n.ar[key]) {
        return window.i18n.ar[key];
      }
      return key;
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
        const root = document.documentElement;
        root.setAttribute('lang', lang);
        root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

        // Sync dropdown selector
        const langSelect = document.getElementById('langSelect');
        if (langSelect && langSelect.value !== lang) {
          langSelect.value = lang;
        }

        // Localize page title
        const titleText = this.t('page_title');
        if (titleText) {
          document.title = titleText;
        }

        // Apply translations across all elements
        this.updateI18nElements();

        // Repopulate Wayfinder Origin/Destination with localized names
        try {
          if (typeof window !== 'undefined' && window.Wayfinder && typeof window.Wayfinder.populateDropdowns === 'function') {
            window.Wayfinder.populateDropdowns(lang);
          }
        } catch (e) {
          console.warn('[App] Wayfinder dropdown localization skipped:', e);
        }

        // Repopulate Landmark Preset chips
        try {
          if (typeof window !== 'undefined' && window.MapEngine && typeof window.MapEngine.updateLandmarkPresetLabels === 'function') {
            window.MapEngine.updateLandmarkPresetLabels(lang);
          }
        } catch (e) {
          console.warn('[App] Landmark presets localization skipped:', e);
        }

        // Re-render Map pins with localized tooltips
        try {
          if (typeof window !== 'undefined' && window.MapEngine) {
            if (typeof window.MapEngine.renderPins === 'function') {
              window.MapEngine.renderPins();
            }
            if (window.MapEngine.activePoi && typeof window.MapEngine.showPopover === 'function') {
              window.MapEngine.showPopover(window.MapEngine.activePoi);
            }
            if (typeof window.MapEngine.updateLanguage === 'function') {
              window.MapEngine.updateLanguage(lang);
            }
          }
        } catch (e) {
          console.warn('[App] MapEngine pin localization skipped:', e);
        }
      }

      // Refresh weather in active language
      try {
        weatherManager.refreshWeather(lang);
      } catch (e) {
        console.warn('[App] Weather refresh skipped:', e);
      }

      // Live update meal schedule in active language
      try {
        this.updateMealScheduleTracker();
      } catch (e) {
        console.warn('[App] Meal schedule tracker update skipped:', e);
      }

      // Live update guest dashboard in active language
      try {
        this.updateGuestDashboardUI();
      } catch (e) {
        console.warn('[App] Guest dashboard localization update skipped:', e);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
      }
    },

    updateI18nElements: function () {
      if (typeof document === 'undefined') return;
      const self = this;

      // 1. Static text elements [data-i18n]
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        const text = self.t(key);
        if (text && text !== key) {
          if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
            el.value = text;
          } else {
            el.textContent = text;
          }
        }
      });

      // 2. Input Placeholders [data-i18n-ph]
      document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
        const key = el.getAttribute('data-i18n-ph');
        if (!key) return;
        const text = self.t(key);
        if (text && text !== key) {
          el.setAttribute('placeholder', text);
        }
      });

      // 3. Element Titles [data-i18n-title]
      document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
        const key = el.getAttribute('data-i18n-title');
        if (!key) return;
        const text = self.t(key);
        if (text && text !== key) {
          el.setAttribute('title', text);
        }
      });

      // 4. Accessibility Aria Labels [data-i18n-aria]
      document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
        const key = el.getAttribute('data-i18n-aria');
        if (!key) return;
        const text = self.t(key);
        if (text && text !== key) {
          el.setAttribute('aria-label', text);
        }
      });
    },

    changeLanguage: function (lang) {
      this.applyLanguage(lang);
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
      const msg = this.isSoundMuted ? 'تم كتم الصوت' : 'تم تفعيل المؤثرات الصوتية';
      this.showToast(msg, this.isSoundMuted ? '🔇' : '🔊');
      return this.isSoundMuted;
    },

    toggleTheme: function () {
      const now = Date.now();
      if (this._lastThemeToggle && (now - this._lastThemeToggle < 300)) {
        return this.currentTheme;
      }
      this._lastThemeToggle = now;
      this.currentTheme = themeManager.toggleTheme();
      this.playBeep(700, 80);
      const msg = this.currentTheme === 'dark' ? 'المظهر الداكن الملكي' : 'المظهر الفاتح الصباحي';
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
      const modals = document.querySelectorAll('[id$="Modal"], [id$="drawer"], [id*="modal"]');
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
      if (typeof document !== 'undefined' && typeof localStorage !== 'undefined') {
        const nameInput = document.getElementById('profGuestName');
        const roomInput = document.getElementById('profRoomNum');
        const dateInput = document.getElementById('profCheckoutDate');
        const savedName = localStorage.getItem('moreno_guest_name');
        const savedRoom = localStorage.getItem('moreno_guest_room');
        const savedDate = localStorage.getItem('moreno_guest_checkout');
        if (nameInput && savedName) nameInput.value = savedName;
        if (roomInput && savedRoom) roomInput.value = savedRoom;
        if (dateInput && savedDate) dateInput.value = savedDate;
      }
      this.openModal('guestProfileModal');
    },

    closeGuestProfileModal: function () {
      this.closeModal('guestProfileModal');
    },

    saveGuestProfile: function (e) {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      if (typeof document === 'undefined') return;

      const nameInput = document.getElementById('profGuestName');
      const roomInput = document.getElementById('profRoomNum');
      const dateInput = document.getElementById('profCheckoutDate');

      const name = nameInput ? nameInput.value.trim() : '';
      const room = roomInput ? roomInput.value.trim() : '';
      const checkout = dateInput ? dateInput.value : '';

      if (!name || !room) {
        this.showToast('يرجى كتابة اسم النزيل ورقم الغرفة', '⚠️');
        return;
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('moreno_guest_name', name);
        localStorage.setItem('moreno_guest_room', room);
        if (checkout) {
          localStorage.setItem('moreno_guest_checkout', checkout);
        } else {
          localStorage.removeItem('moreno_guest_checkout');
        }
      }

      this.prefillRoomSearch(room);
      this.updateGuestDashboardUI();
      this.closeGuestProfileModal();
      this.playBeep(880, 150);
      const isAr = (this.currentLang || 'ar') === 'ar';
      this.showToast(isAr ? `✨ مرحباً بك يا ${name}! تم حفظ بياناتك وتحديث اللوحة بنجاح` : `✨ Welcome ${name}! Profile updated successfully`, '👑');
    },

    updateGuestDashboardUI: function () {
      if (typeof document === 'undefined') return;
      const lang = this.currentLang || 'ar';
      const name = typeof localStorage !== 'undefined' ? localStorage.getItem('moreno_guest_name') : null;
      const room = typeof localStorage !== 'undefined' ? localStorage.getItem('moreno_guest_room') : null;

      const nameEl = document.getElementById('guestDashName');
      const roomBadge = document.getElementById('guestDashRoomBadge');
      const roomText = document.getElementById('guestDashRoomText');
      const buildingText = document.getElementById('guestDashBuildingText');
      const editBtn = document.getElementById('guestDashEditBtnText');

      if (nameEl) {
        if (name) {
          const greetings = {
            ar: `مرحباً بك، ${name} 👑`,
            en: `Welcome, ${name} 👑`,
            de: `Willkommen, ${name} 👑`,
            ru: `Добро пожаловать, ${name} 👑`
          };
          nameEl.textContent = greetings[lang] || greetings.ar;
        } else {
          nameEl.textContent = this.t('guest_welcome') || 'مرحباً بك في منتجع مورينو هورايزون';
        }
      }

      if (room) {
        if (roomBadge) {
          roomBadge.style.display = 'inline-flex';
          roomBadge.classList.remove('hidden');
        }
        if (roomText) {
          const prefixes = { ar: 'غرفة', en: 'Room', de: 'Zimmer', ru: 'Номер' };
          roomText.textContent = `${prefixes[lang] || 'غرفة'} ${room}`;
        }
        if (editBtn) {
          const editLabels = {
            ar: 'تعديل بيانات الغرفة',
            en: 'Edit Room Profile',
            de: 'Zimmerdaten bearbeiten',
            ru: 'Изменить данные номера'
          };
          editBtn.textContent = editLabels[lang] || editLabels.ar;
        }
        if (buildingText) {
          const roomNum = parseInt(room, 10);
          let foundBuilding = null;
          if (!isNaN(roomNum) && typeof Wayfinder !== 'undefined' && typeof Wayfinder.findRoomBuilding === 'function') {
            foundBuilding = Wayfinder.findRoomBuilding(roomNum);
          }
          if (foundBuilding && foundBuilding.building) {
            const b = foundBuilding.building;
            const bName = lang === 'ar' ? b.nameAr : (b.nameEn || b.nameAr);
            const floorStr = foundBuilding.floor ? (lang === 'ar' ? foundBuilding.floor.floor : (foundBuilding.floor.nameEn || foundBuilding.floor.floor)) : '';
            buildingText.textContent = `📍 ${bName}${floorStr ? ' • ' + floorStr : ''}`;
          } else {
            const defaultPrompts = {
              ar: `غرفتك رقم ${room} مفعلة ومربوطة بالخريطة والملاحة الذكية`,
              en: `Room ${room} is active & linked to smart navigation`,
              de: `Zimmer ${room} ist aktiv & mit Navigation verknüpft`,
              ru: `Номер ${room} активен и подключен к навигации`
            };
            buildingText.textContent = defaultPrompts[lang] || defaultPrompts.ar;
          }
        }
      } else {
        if (roomBadge) {
          roomBadge.style.display = 'none';
          roomBadge.classList.add('hidden');
        }
        if (editBtn) {
          const regLabels = {
            ar: 'تسجيل / تعديل الغرفة',
            en: 'Register / Edit Room',
            de: 'Zimmer registrieren / bearbeiten',
            ru: 'Регистрация / Изменение номера'
          };
          editBtn.textContent = regLabels[lang] || regLabels.ar;
        }
        if (buildingText) {
          buildingText.textContent = this.t('guest_building_prompt') || 'سجل غرفتك واستمتع بخدمات النزلاء الحصرية والملاحة الذكية فورياً';
        }
      }
    },

    openSmartHubModal: function () {
      this.openModal('smartHubModal');
    },

    closeSmartHubModal: function () {
      this.closeModal('smartHubModal');
    },

    openPoiModal: function (poi) {
      if (!poi) return;
      const contentEl = document.getElementById('modalContent');
      if (!contentEl) return;
      const lang = this.currentLang || 'ar';
      const loc = typeof getLocalizedPoi === 'function' ? getLocalizedPoi(poi, lang) : { name: poi.nameAr, desc: poi.descriptionAr };
      const t = (window.i18n && window.i18n[lang]) || {};

      if (typeof ViewTemplates !== 'undefined' && ViewTemplates.renderPoiDetailsModal) {
        contentEl.innerHTML = ViewTemplates.renderPoiDetailsModal({ poi, loc, lang, t });
      } else {
        contentEl.innerHTML = `<div class="p-4 text-center"><h3 class="font-black text-lg">${loc.name || poi.nameAr}</h3><p class="text-sm mt-2">${loc.desc || poi.descriptionAr || ''}</p></div>`;
      }
      this.openModal('detailModal');
    },

    navigateFromPoiModal: function (poiId) {
      this.closeModal('detailModal');
      if (typeof MapEngine !== 'undefined') {
        MapEngine.focusPreset(poiId);
      } else if (typeof Wayfinder !== 'undefined') {
        const destSel = document.getElementById('selectDestination');
        if (destSel) destSel.value = poiId;
        Wayfinder.calculateRoute();
      }
    },

    sharePoi: function (poiId) {
      const poi = (typeof resortPois !== 'undefined' && resortPois.find(function (p) { return String(p.id) === String(poiId); })) || null;
      const name = poi ? (poi.nameAr || poi.nameEn) : 'Moreno Resort Landmark';
      const url = window.location.origin + window.location.pathname + '#poi-' + poiId;
      if (navigator.share) {
        navigator.share({ title: name, text: 'استكشف ' + name + ' في منتجع مورينو هورايزون', url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        const self = this;
        navigator.clipboard.writeText(url).then(function () {
          self.showToast('تم نسخ رابط المرفق بنجاح 📋', '✅');
        });
      } else {
        this.showToast(url, '🔗');
      }
    },

    installPwa: function () {
      pwaManager.installPwa();
    },

    toggleSunlightMode: function () {
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('beach-mode');
        const isActive = document.body.classList.contains('beach-mode');
        this.showToast(isActive ? 'وضع الشاطئ عالي التباين مفعل 🏖️' : 'تم إيقاف وضع الشاطئ', '☀️');
      }
    },

    openCinematicPromoVideo: function () {
      if (typeof PromoVideoPlayer !== 'undefined') {
        PromoVideoPlayer.open();
      } else {
        this.openModal('promoVideoModal');
      }
    },

    openGalleryModal: function (cat) {
      if (typeof GalleryManager !== 'undefined') {
        GalleryManager.open(cat || 'all');
      } else {
        this.openModal('resortGalleryModal');
      }
    },

    closeGalleryModal: function () {
      if (typeof GalleryManager !== 'undefined') {
        GalleryManager.close();
      } else {
        this.closeModal('resortGalleryModal');
      }
    },

    startCinematicTour: function () {
      if (typeof window !== 'undefined' && window.MapEngine) {
        if (typeof window.MapEngine.startCinematicTour === 'function') {
          window.MapEngine.startCinematicTour();
        } else if (typeof window.MapEngine.startOrbitTour === 'function') {
          window.MapEngine.scrollToMap();
          window.MapEngine.startOrbitTour();
        }
      } else {
        this.showToast('جولة الخريطة التفاعلية تبدأ الآن', '🚁');
      }
    },

    openMikrotikPortal: function () {
      if (typeof window !== 'undefined') {
        // Use URL configured by admin in the admin panel (moreno_hotspot_url),
        // fallback to the default MikroTik hotspot gateway.
        var hotspotUrl = (typeof localStorage !== 'undefined'
          ? localStorage.getItem('moreno_hotspot_url')
          : null) || 'http://192.1.1.1/login';
        window.open(hotspotUrl, '_blank');
      }
    },

    // Guest Room persistence
    loadSavedRoom: function () {
      if (typeof localStorage === 'undefined') return;
      const room = localStorage.getItem('moreno_guest_room');
      if (room) {
        this.prefillRoomSearch(room);
      }
      this.updateGuestDashboardUI();
    },

    saveGuestRoom: function (room, name) {
      if (typeof localStorage !== 'undefined') {
        if (room) localStorage.setItem('moreno_guest_room', String(room));
        if (name) localStorage.setItem('moreno_guest_name', String(name));
      }
      this.prefillRoomSearch(room);
      this.updateGuestDashboardUI();
      this.showToast('تم حفظ بيانات الغرفة بنجاح', '👑');
    },

    clearSavedRoom: function () {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('moreno_guest_room');
        localStorage.removeItem('moreno_guest_name');
        localStorage.removeItem('moreno_guest_checkout');
      }
      const roomInput = document.getElementById('roomSearchInput');
      if (roomInput) roomInput.value = '';
      this.updateGuestDashboardUI();
      this.showToast('تم مسح رقم الغرفة المحفوظ بنجاح', '🗑️');
    },

    prefillRoomSearch: function (room) {
      if (typeof document === 'undefined' || !room) return;
      // Note: roomSearchInput is kept clean on startup so guest sees the placeholder.
      // Saved room is used for booking forms and the dedicated 'Take Me to My Room' action.
      ['bookRoomNum', 'vipServiceRoomInput', 'srvRoomNumberInput'].forEach(function (id) {
        const el = document.getElementById(id);
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
      const badge = document.getElementById('cartBadge');
      if (badge) {
        badge.textContent = String(this.cart.length);
        if (this.cart.length === 0) {
          badge.classList.add('hidden');
        } else {
          badge.classList.remove('hidden');
        }
      }
    },

    // Clock display & Meal Schedule Tracker
    startResortClock: function () {
      if (typeof document === 'undefined') return;
      const clockEl = document.getElementById('resortClock');
      const self = this;
      if (clockEl) {
        this.updateClock(clockEl);
        setInterval(function () { self.updateClock(clockEl); }, 1000);
      }
      this.updateMealScheduleTracker();
      setInterval(function () { self.updateMealScheduleTracker(); }, 30000);
    },

    updateClock: function (clockEl) {
      const date = new Date();
      const locale = { ar: 'ar-EG', en: 'en-GB', ru: 'ru-RU', de: 'de-DE' }[this.currentLang] || 'ar-EG';
      try {
        const timeStr = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);
        clockEl.textContent = timeStr;
      } catch (e) {
        clockEl.textContent = date.toTimeString().substring(0, 5);
      }
    },

    updateMealScheduleTracker: function () {
      if (typeof document === 'undefined') return;

      const statusBadge = document.getElementById('currentMealLiveStatus');
      const mealBreakfast = document.getElementById('mealSlotBreakfast');
      const mealLunch = document.getElementById('mealSlotLunch');
      const mealSnacks = document.getElementById('mealSlotSnacks');
      const mealDinner = document.getElementById('mealSlotDinner');

      if (!statusBadge && !mealBreakfast) return;

      // Calculate Hurghada/Cairo current time
      let currentHour = 0;
      let currentMin = 0;
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Africa/Cairo',
          hour12: false,
          hour: 'numeric',
          minute: 'numeric'
        }).formatToParts(new Date());
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].type === 'hour') currentHour = parseInt(parts[i].value, 10);
          if (parts[i].type === 'minute') currentMin = parseInt(parts[i].value, 10);
        }
        if (currentHour === 24) currentHour = 0;
      } catch (e) {
        const d = new Date();
        currentHour = d.getHours();
        currentMin = d.getMinutes();
      }

      const nowMinutes = currentHour * 60 + currentMin;
      const lang = this.currentLang || 'ar';

      const mealDefs = [
        {
          id: 'mealSlotBreakfast',
          el: mealBreakfast,
          nameKey: 'guest_meal_breakfast',
          names: { ar: 'الإفطار', en: 'Breakfast', ru: 'Завтрак', de: 'Frühstück' },
          venueKey: 'guest_venue_main',
          venues: { ar: 'المطعم الرئيسي', en: 'Main Restaurant', ru: 'Главный ресторан', de: 'Hauptrestaurant' },
          start: 7 * 60,       // 07:00
          end: 10 * 60 + 30,   // 10:30
          poiId: '12'
        },
        {
          id: 'mealSlotLunch',
          el: mealLunch,
          nameKey: 'guest_meal_lunch',
          names: { ar: 'الغداء', en: 'Lunch', ru: 'Обед', de: 'Mittagessen' },
          venueKey: 'guest_venue_horizon',
          venues: { ar: 'بوفيه هورايزون', en: 'Horizon Buffet', ru: 'Шведский стол «Горизонт»', de: 'Horizon-Buffet' },
          start: 12 * 60 + 30, // 12:30
          end: 15 * 60,        // 15:00
          poiId: '12'
        },
        {
          id: 'mealSlotSnacks',
          el: mealSnacks,
          nameKey: 'guest_meal_snacks',
          names: { ar: 'سناك وشاي', en: 'Snacks & Tea', ru: 'Закуски и чай', de: 'Snacks & Tee' },
          venueKey: 'guest_venue_lotus_bar',
          venues: { ar: 'بار مسبح لوتس', en: 'Lotus Pool Bar', ru: 'Бар у бассейна «Лотос»', de: 'Lotus-Poolbar' },
          start: 16 * 60,      // 16:00
          end: 17 * 60 + 30,   // 17:30
          poiId: '11'
        },
        {
          id: 'mealSlotDinner',
          el: mealDinner,
          nameKey: 'guest_meal_dinner',
          names: { ar: 'العشاء', en: 'Dinner', ru: 'Ужин', de: 'Abendessen' },
          venueKey: 'guest_venue_restaurants',
          venues: { ar: 'المطاعم الرئيسية', en: 'Main Restaurants', ru: 'Главные рестораны', de: 'Hauptrestaurants' },
          start: 18 * 60 + 30, // 18:30
          end: 21 * 60 + 30,   // 21:30
          poiId: '12'
        }
      ];

      let activeMeal = null;
      let nextMeal = null;
      let minWait = Infinity;

      mealDefs.forEach((meal) => {
        let status = 'upcoming';
        if (nowMinutes >= meal.start && nowMinutes < meal.end) {
          status = 'active';
          activeMeal = meal;
        } else if (nowMinutes >= meal.end) {
          status = 'ended';
        } else {
          status = 'upcoming';
          const wait = meal.start - nowMinutes;
          if (wait > 0 && wait < minWait) {
            minWait = wait;
            nextMeal = meal;
          }
        }

        if (meal.el) {
          const badge = meal.el.querySelector('.meal-badge');
          if (status === 'active') {
            meal.el.className = 'p-2.5 rounded-xl transition shadow-md border-2 border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 cursor-pointer';
            if (badge) {
              badge.className = 'meal-badge text-[9px] px-2 py-0.5 rounded-full font-black bg-emerald-500 text-white shadow-sm animate-pulse';
              badge.textContent = this.t('guest_meal_available');
            }
          } else if (status === 'ended') {
            meal.el.className = 'p-2.5 rounded-xl transition shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/40 opacity-70 cursor-pointer';
            if (badge) {
              badge.className = 'meal-badge text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
              badge.textContent = this.t('guest_meal_ended');
            }
          } else {
            meal.el.className = 'p-2.5 rounded-xl transition shadow-sm border border-amber-300/40 dark:border-amber-700/40 bg-white/80 dark:bg-slate-850/70 hover:border-amber-400 cursor-pointer';
            if (badge) {
              badge.className = 'meal-badge text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60';
              badge.textContent = this.t('guest_meal_upcoming');
            }
          }

          meal.el.onclick = function () {
            if (typeof window !== 'undefined' && window.MapEngine && typeof window.MapEngine.selectPoi === 'function') {
              window.MapEngine.selectPoi(meal.poiId);
            }
          };
        }
      });

      if (!activeMeal && !nextMeal) {
        nextMeal = mealDefs[0];
        minWait = (24 * 60 - nowMinutes) + mealDefs[0].start;
      }

      const formatWaitTime = function (mins) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (lang === 'ar') {
          if (h === 0) return m + ' دقيقة';
          if (h === 1 && m === 0) return 'ساعة واحدة';
          if (h === 2 && m === 0) return 'ساعتين';
          if (m === 0) return h + ' ساعات';
          return h + ' ساعة و ' + m + ' دقيقة';
        } else if (lang === 'ru') {
          if (h === 0) return m + ' мин.';
          if (m === 0) return h + ' ч.';
          return h + ' ч. ' + m + ' мин.';
        } else if (lang === 'de') {
          if (h === 0) return m + ' Min.';
          if (m === 0) return h + ' Std.';
          return h + ' Std. ' + m + ' Min.';
        } else {
          if (h === 0) return m + ' mins';
          if (m === 0) return h + ' hrs';
          return h + 'h ' + m + 'm';
        }
      };

      if (statusBadge) {
        if (activeMeal) {
          const mealName = activeMeal.names[lang] || activeMeal.names.ar;
          const venueName = activeMeal.venues[lang] || activeMeal.venues.ar;
          const template = this.t('guest_meal_active');
          const text = template.replace('{meal}', mealName).replace('{venue}', venueName);

          statusBadge.className = 'text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/40 shadow-sm inline-flex items-center gap-1.5 transition-all';
          statusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>' + text + '</span>';
        } else if (nextMeal && minWait < 24 * 60 && nowMinutes < mealDefs[3].end) {
          const mealName = nextMeal.names[lang] || nextMeal.names.ar;
          const timeStr = formatWaitTime(minWait);
          const template = this.t('guest_meal_next');
          const text = template.replace('{meal}', mealName).replace('{time}', timeStr);

          statusBadge.className = 'text-[11px] px-3 py-1 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-400/40 shadow-sm inline-flex items-center gap-1.5 transition-all';
          statusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span><span>' + text + '</span>';
        } else {
          const text = this.t('guest_meal_closed');
          statusBadge.className = 'text-[11px] px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700 shadow-sm inline-flex items-center gap-1.5 transition-all';
          statusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-400"></span><span>' + text + '</span>';
        }
      }
    },

    // Keyboard navigation
    bindKeyboardShortcuts: function () {
      if (typeof document === 'undefined') return;
      const self = this;
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
      const input = document.getElementById('spotlightSearch') || document.getElementById('roomSearchInput');
      if (input) input.focus();
    },

    shareGuestCoordinates: function () {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        this.showToast('تحديد الموقع غير مدعوم في متصفحك', '⚠️');
        return;
      }
      const self = this;
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const url = 'https://wa.me/?text=' + encodeURIComponent('أنا في منتجع مورينو هورايزون: https://maps.google.com/?q=' + lat + ',' + lng);
          window.open(url, '_blank');
        },
        function () {
          self.showToast('تعذر جلب إحداثيات الموقع الحالي', '⚠️');
        }
      );
    },

    // ==========================================
    // Resort State Sync (Beach Flag + POI Status)
    // ==========================================
    loadResortState: function () {
      if (typeof fetch !== 'function') return;
      var self = this;
      fetch('/api/resort/state')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.success) return;
          // Persist locally for offline fallback
          if (data.beachFlag && typeof localStorage !== 'undefined') {
            localStorage.setItem('moreno_beach_flag', data.beachFlag);
          }
          // Sync POI statuses into localStorage
          if (data.poiStatuses && typeof localStorage !== 'undefined') {
            Object.keys(data.poiStatuses).forEach(function (id) {
              localStorage.setItem('poi_status_' + id, data.poiStatuses[id]);
            });
          }
          // Sync MikroTik hotspot portal URL from server
          if (data.hotspotUrl && typeof localStorage !== 'undefined') {
            localStorage.setItem('moreno_hotspot_url', data.hotspotUrl);
          }
          // Sync live guest announcements
          if (data.announcement) {
            self.applyAnnouncementToUI(data.announcement);
          }
          // Sync emergency contacts
          if (data.emergencyContacts) {
            self.applyEmergencyContactsToUI(data.emergencyContacts, data.emergencyWhatsapp);
          }
          self.applyBeachFlagToUI(data.beachFlag || 'safe');
        })
        .catch(function () {
          // Fallback: read from localStorage
          var cached = typeof localStorage !== 'undefined'
            ? localStorage.getItem('moreno_beach_flag') : null;
          if (cached) self.applyBeachFlagToUI(cached);
        });
    },

    applyBeachFlagToUI: function (flag) {
      if (typeof document === 'undefined') return;
      var flagEl = document.getElementById('beachFlagIndicator');
      var flagText = document.getElementById('beachFlagText');
      var flagBadge = document.getElementById('beachFlagBadge');
      var colorMap = { safe: '#10b981', caution: '#f59e0b', danger: '#ef4444' };
      var textMap = {
        safe:    { ar: 'آمن للسباحة 🟢',             en: 'Safe for swimming 🟢'    },
        caution: { ar: 'تحذير: أمواج متوسطة 🟡',    en: 'Caution: Moderate waves 🟡' },
        danger:  { ar: 'خطر: السباحة ممنوعة 🔴',    en: 'Danger: No swimming 🔴'   }
      };
      var color = colorMap[flag] || colorMap.safe;
      var texts = textMap[flag] || textMap.safe;
      var lang  = this.currentLang || 'ar';
      var text  = texts[lang] || texts.ar;
      if (flagEl)    { flagEl.style.backgroundColor = color; }
      if (flagText)  { flagText.textContent = text; }
      if (flagBadge) { flagBadge.style.backgroundColor = color; flagBadge.textContent = flag.toUpperCase(); }
    },

    // ==========================================
    // Live Guest Announcements & Alerts Banner
    // ==========================================
    /**
     * Renders live announcement data to the guest top banner
     * @param {Object|null} [announcement] Announcement data object
     * @returns {void}
     */
    applyAnnouncementToUI: function (announcement) {
      if (typeof document === 'undefined') return;
      var banner = document.getElementById('liveGuestAnnouncement');
      if (!banner) return;
      if (!announcement || !announcement.active) {
        banner.classList.add('hidden');
        return;
      }

      // Check if dismissed in this session
      var dismissedTime = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('dismissed_announcement_time') : null;
      if (dismissedTime && dismissedTime === announcement.updatedAt) {
        banner.classList.add('hidden');
        return;
      }

      var lang = this.currentLang || 'ar';
      var text = (lang === 'ar' || !announcement.textEn) ? announcement.textAr : announcement.textEn;
      var textEl = document.getElementById('guestAnnouncementText');
      var iconEl = document.getElementById('guestAnnouncementIcon');
      var badgeEl = document.getElementById('guestAnnouncementBadge');

      if (textEl) textEl.textContent = text;

      // Styling based on type
      var typeStyles = {
        info: {
          bg: 'bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent border-cyan-500/40 text-cyan-200',
          badge: 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40',
          badgeText: lang === 'ar' ? 'إعلان المنتجع' : 'RESORT NOTICE',
          icon: 'ℹ️'
        },
        warning: {
          bg: 'bg-gradient-to-r from-amber-500/25 via-rose-500/10 to-transparent border-amber-500/50 text-amber-200',
          badge: 'bg-amber-500/30 text-amber-300 border border-amber-400/40',
          badgeText: lang === 'ar' ? 'تنبيه وأمان' : 'IMPORTANT ALERT',
          icon: '⚠️'
        },
        event: {
          bg: 'bg-gradient-to-r from-purple-500/25 via-amber-500/10 to-transparent border-purple-500/50 text-purple-200',
          badge: 'bg-purple-500/30 text-purple-300 border border-purple-400/40',
          badgeText: lang === 'ar' ? 'فعالية واحتفال' : 'SPECIAL EVENT',
          icon: '🎉'
        }
      };

      var style = typeStyles[announcement.type] || typeStyles.info;
      banner.className = 'mb-3 p-3.5 rounded-2xl border shadow-lg transition duration-300 relative overflow-hidden backdrop-blur-md ' + style.bg;
      if (badgeEl) {
        badgeEl.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ' + style.badge;
        badgeEl.textContent = style.badgeText;
      }
      if (iconEl) iconEl.textContent = style.icon;

      this.currentAnnouncement = announcement;
      banner.classList.remove('hidden');
    },

    dismissAnnouncement: function () {
      if (typeof document === 'undefined') return;
      var banner = document.getElementById('liveGuestAnnouncement');
      if (banner) banner.classList.add('hidden');
      if (this.currentAnnouncement && this.currentAnnouncement.updatedAt && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('dismissed_announcement_time', this.currentAnnouncement.updatedAt);
      }
    },

    // ==========================================
    // Dynamic Emergency Contacts Sync
    // ==========================================
    applyEmergencyContactsToUI: function (contacts, whatsapp) {
      if (typeof document === 'undefined') return;
      if (Array.isArray(contacts)) {
        contacts.forEach(function (c) {
          var link = document.getElementById('contactLink_' + c.id);
          var ext = document.getElementById('contactExt_' + c.id);
          if (link && c.phone) {
            link.href = 'tel:' + c.phone;
          }
          if (ext && c.extension) {
            ext.textContent = 'داخلي: ' + c.extension;
          }
        });
      }
      if (whatsapp) {
        var waBtn = document.getElementById('emergencyDrawerWaBtn');
        if (waBtn) {
          waBtn.href = 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent('مرحبا فندق مورينو هورايزون، أحتاج مساعدة عاجلة');
        }
      }
    },

    // ==========================================
    // Real-Time SSE Stream for Guests
    // ==========================================
    initLiveResortStream: function () {
      if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
      var self = this;
      try {
        var sse = new EventSource('/api/location/stream');
        sse.onmessage = function (event) {
          if (!event.data || event.data.startsWith(': keepalive')) return;
          try {
            var msg = JSON.parse(event.data);
            if (msg.type === 'announcement') {
              self.applyAnnouncementToUI(msg.announcement);
            } else if (msg.type === 'beach_flag') {
              self.applyBeachFlagToUI(msg.beachFlag);
            } else if (msg.type === 'contacts') {
              self.applyEmergencyContactsToUI(msg.emergencyContacts, msg.emergencyWhatsapp);
            } else if (msg.type === 'poi_status') {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('poi_status_' + msg.id, msg.status);
              }
            }
          } catch (e) {
            // ignore non-JSON or positioning packets
          }
        };
      } catch (err) {
        console.warn('[App] SSE Live Resort stream unavailable:', err);
      }
    }
  };


  return App;
});
