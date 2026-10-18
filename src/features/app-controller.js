/**
* Moreno Horizon Spa & Resort - Main Application Controller
* Orchestrates all feature modules and manages application lifecycle.
* This is the primary entry point for the guest guide application.
*/

// Core modules
import { I18nEngine } from '../core/i18n.js';

// Feature modules
import { uiManager } from './ui-manager.js';
import { serviceHandler } from './service-handler.js';
import { audioManager } from './audio-manager.js';
import { themeManager } from './theme-manager.js';
import { pwaManager } from './pwa-manager.js';
import { weatherManager } from './weather-manager.js';

// Safe references for engines in browser vs test environments
const getMapEngine = () => (typeof window !== 'undefined' ? window.MapEngine : null);
const getVoiceNavigator = () => (typeof window !== 'undefined' ? (window.VoiceConcierge || window.VoiceNavigator) : null);

/**
 * @typedef {Object} AppState
 * @property {string} currentLang - Current language code (ar, en, ru, de)
 * @property {string} currentTheme - Current theme (dark, light)
 * @property {boolean} isSoundMuted - Whether audio is muted
 * @property {Array} cart - Shopping cart items
 * @property {Object|null} activeServiceOrder - Currently active service order
 */

/**
 * @typedef {Object} FeatureModule
 * @property {Function} init - Initialize the module
 * @property {string} name - Module display name
 */

export const App = {
    /** @type {AppState} */
    currentLang: 'ar',
    currentCategory: 'all',
    isSoundMuted: false,
    cart: [],
    activeServiceOrder: null,

    /**
     * Initialize the application
     * This is called when the DOM is fully loaded
     */
    async init() {
        console.log('[App] Initializing Moreno Horizon Guest Guide...');

        // 1. Initialize theme first (avoid flash of unstyled content)
        themeManager.init();

        // 2. Initialize i18n
        await this.initI18n();

        // 3. Initialize feature modules
        audioManager.init();
        pwaManager.registerServiceWorker();
        pwaManager.setupInstallPrompt();
        weatherManager.refreshWeather(this.currentLang);
        weatherManager.startAutoRefresh(15 * 60 * 1000, this.currentLang);

        // 4. Initialize external engines
        themeManager.setTheme(localStorage.getItem('moreno_theme') || 'dark');
        const mapEngine = getMapEngine();
        if (mapEngine && typeof mapEngine.init === 'function') mapEngine.init();
        const voiceNav = getVoiceNavigator();
        if (voiceNav && typeof voiceNav.init === 'function') voiceNav.init();

        // 5. Setup UI state
        const savedRoom = localStorage.getItem('moreno_guest_room');
        if (savedRoom) {
            // Update room search inputs
            this.prefillRoomSearch(savedRoom);
        }
        this.updateGuestDashboardUI();
        this.updateCartBadge();

        // 6. Start clock and other periodic updates
        this.startResortClock();
        themeManager.setTheme(this.currentTheme || 'dark');

        // 7. Keyboard shortcuts
        this.bindKeyboardShortcuts();

        console.log('[App] Initialization complete.');
    },

    async initI18n() {
        // i18n locales are loaded via js/locales-bundle.js
        // This creates the legacy i18n object for backward compatibility
        const bundleEl = document.querySelector('script[src*="locales-bundle"]');
        if (!bundleEl) {
            console.warn('[App] locales-bundle.js not loaded, using default locales');
        }
        this.currentLang = localStorage.getItem('moreno_language') || 'ar';
        this.applyLanguage(this.currentLang);
    },

    /**
     * Apply the selected language
     * @param {string} lang - Language code
     */
    async applyLanguage(lang) {
        if (I18nEngine) {
            I18nEngine.setLanguage(lang);
        }
        this.currentLang = lang;
        localStorage.setItem('moreno_language', lang);

        // Update document direction and language
        const root = document.documentElement;
        root.setAttribute('lang', lang);
        root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

        // Update all elements with data-i18n attribute
        // Sync dropdown selector
        const langSelect = document.getElementById('langSelect');
        if (langSelect && langSelect.value !== lang) {
            langSelect.value = lang;
        }

        // Localize page title
        if (typeof I18nEngine !== 'undefined') {
            const pageTitle = I18nEngine.t('page_title');
            if (pageTitle) document.title = pageTitle;
        }

        this.updateI18nElements();

        if (typeof window !== 'undefined' && window.Wayfinder && typeof window.Wayfinder.populateDropdowns === 'function') {
            window.Wayfinder.populateDropdowns(lang);
        }

        if (typeof window !== 'undefined' && window.MapEngine && typeof window.MapEngine.updateLandmarkPresetLabels === 'function') {
            window.MapEngine.updateLandmarkPresetLabels(lang);
        }

        if (typeof window !== 'undefined' && window.MapEngine && typeof window.MapEngine.renderPins === 'function') {
            window.MapEngine.renderPins();
        }

        if (typeof window !== 'undefined' && window.MapEngine && typeof window.MapEngine.updateLanguage === 'function') {
            window.MapEngine.updateLanguage(lang);
        }

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    },

    /**
     * Update all elements with i18n attributes
     */
    updateI18nElements() {
        const getTrans = (key) => {
            if (typeof I18nEngine !== 'undefined' && typeof I18nEngine.t === 'function') {
                const res = I18nEngine.t(key, null, this.currentLang);
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
        };

        // Text
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                const text = getTrans(key);
                if (text && text !== key) {
                    if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
                        el.value = text;
                    } else {
                        el.textContent = text;
                    }
                }
            }
        });

        // Placeholders
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            const key = el.getAttribute('data-i18n-ph');
            if (key) {
                const text = getTrans(key);
                if (text && text !== key) el.setAttribute('placeholder', text);
            }
        });

        // Titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                const text = getTrans(key);
                if (text && text !== key) el.setAttribute('title', text);
            }
        });

        // Aria labels
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (key) {
                const text = getTrans(key);
                if (text && text !== key) el.setAttribute('aria-label', text);
            }
        });
    },

    changeLanguage(lang) {
        this.applyLanguage(lang);
    },

    /**
     * Update the cart badge
     */
    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = this.cart.length;
            badge.classList.toggle('hidden', this.cart.length === 0);
        }
    },

    /**
     * Pre-fill room search inputs with saved room
     * @param {string} room - Room number
     */
    prefillRoomSearch(room) {
        const inputs = [
            document.getElementById('bookRoomNum'),
            document.getElementById('vipServiceRoomInput')
        ];
        inputs.forEach(input => {
            if (input && !input.value) input.value = room;
        });
    },

    /**
     * Start the resort clock
     */
    startResortClock() {
        const clockEl = document.getElementById('resortClock');
        if (clockEl) {
            this.updateClock(clockEl);
            setInterval(() => this.updateClock(clockEl), 1000);
        }
        this.updateMealScheduleTracker();
        setInterval(() => this.updateMealScheduleTracker(), 30000);
    },

    /**
     * Update clock display
     * @param {HTMLElement} clockEl - Clock element
     */
    updateClock(clockEl) {
        const date = new Date();
        const locale = { ar: 'ar-EG', en: 'en-GB', ru: 'ru-RU', de: 'de-DE' }[this.currentLang] || 'ar-EG';
        try {
            const timeStr = new Intl.DateTimeFormat(locale, {
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
            clockEl.textContent = timeStr;
        } catch (e) {
            clockEl.textContent = date.toTimeString().substring(0, 5);
        }
    },

    /**
     * Update Live Meal Schedule Tracker
     */
    updateMealScheduleTracker() {
        if (typeof document === 'undefined') return;

        const statusBadge = document.getElementById('currentMealLiveStatus');
        const mealBreakfast = document.getElementById('mealSlotBreakfast');
        const mealLunch = document.getElementById('mealSlotLunch');
        const mealSnacks = document.getElementById('mealSlotSnacks');
        const mealDinner = document.getElementById('mealSlotDinner');

        if (!statusBadge && !mealBreakfast) return;

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
                names: { ar: 'الإفطار', en: 'Breakfast', ru: 'Завтрак', de: 'Frühstück' },
                venues: { ar: 'المطعم الرئيسي', en: 'Main Restaurant', ru: 'Главный ресторан', de: 'Hauptrestaurant' },
                start: 7 * 60,
                end: 10 * 60 + 30,
                poiId: '12'
            },
            {
                id: 'mealSlotLunch',
                el: mealLunch,
                names: { ar: 'الغداء', en: 'Lunch', ru: 'Обед', de: 'Mittagessen' },
                venues: { ar: 'بوفيه هورايزون', en: 'Horizon Buffet', ru: 'Шведский стол «Горизонт»', de: 'Horizon-Buffet' },
                start: 12 * 60 + 30,
                end: 15 * 60,
                poiId: '12'
            },
            {
                id: 'mealSlotSnacks',
                el: mealSnacks,
                names: { ar: 'سناك وشاي', en: 'Snacks & Tea', ru: 'Закуски и чай', de: 'Snacks & Tee' },
                venues: { ar: 'بار مسبح لوتس', en: 'Lotus Pool Bar', ru: 'Бар у бассейна «Лотос»', de: 'Lotus-Poolbar' },
                start: 16 * 60,
                end: 17 * 60 + 30,
                poiId: '11'
            },
            {
                id: 'mealSlotDinner',
                el: mealDinner,
                names: { ar: 'العشاء', en: 'Dinner', ru: 'Ужин', de: 'Abendessen' },
                venues: { ar: 'المطاعم الرئيسية', en: 'Main Restaurants', ru: 'Главные рестораны', de: 'Hauptrestaurants' },
                start: 18 * 60 + 30,
                end: 21 * 60 + 30,
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
                        badge.textContent = this.t ? this.t('guest_meal_available') : 'متاح الآن 🟢';
                    }
                } else if (status === 'ended') {
                    meal.el.className = 'p-2.5 rounded-xl transition shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/40 opacity-70 cursor-pointer';
                    if (badge) {
                        badge.className = 'meal-badge text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
                        badge.textContent = this.t ? this.t('guest_meal_ended') : 'انتهى ✓';
                    }
                } else {
                    meal.el.className = 'p-2.5 rounded-xl transition shadow-sm border border-amber-300/40 dark:border-amber-700/40 bg-white/80 dark:bg-slate-850/70 hover:border-amber-400 cursor-pointer';
                    if (badge) {
                        badge.className = 'meal-badge text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60';
                        badge.textContent = this.t ? this.t('guest_meal_upcoming') : 'القادمة ⏳';
                    }
                }

                meal.el.onclick = () => {
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

        const formatWaitTime = (mins) => {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            if (lang === 'ar') {
                if (h === 0) return `${m} دقيقة`;
                if (h === 1 && m === 0) return 'ساعة واحدة';
                if (h === 2 && m === 0) return 'ساعتين';
                if (m === 0) return `${h} ساعات`;
                return `${h} ساعة و ${m} دقيقة`;
            } else if (lang === 'ru') {
                if (h === 0) return `${m} мин.`;
                if (m === 0) return `${h} ч.`;
                return `${h} ч. ${m} мин.`;
            } else if (lang === 'de') {
                if (h === 0) return `${m} Min.`;
                if (m === 0) return `${h} Std.`;
                return `${h} Std. ${m} Min.`;
            } else {
                if (h === 0) return `${m} mins`;
                if (m === 0) return `${h} hrs`;
                return `${h}h ${m}m`;
            }
        };

        if (statusBadge) {
            if (activeMeal) {
                const mealName = activeMeal.names[lang] || activeMeal.names.ar;
                const venueName = activeMeal.venues[lang] || activeMeal.venues.ar;
                const template = this.t ? this.t('guest_meal_active') : 'بوفيه {meal} مفتوح الآن في {venue} 🍽️';
                const text = template.replace('{meal}', mealName).replace('{venue}', venueName);

                statusBadge.className = 'text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/40 shadow-sm inline-flex items-center gap-1.5 transition-all';
                statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>${text}</span>`;
            } else if (nextMeal && minWait < 24 * 60 && nowMinutes < mealDefs[3].end) {
                const mealName = nextMeal.names[lang] || nextMeal.names.ar;
                const timeStr = formatWaitTime(minWait);
                const template = this.t ? this.t('guest_meal_next') : 'الوجبة القادمة: {meal} (تبدأ خلال {time}) ⏳';
                const text = template.replace('{meal}', mealName).replace('{time}', timeStr);

                statusBadge.className = 'text-[11px] px-3 py-1 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-400/40 shadow-sm inline-flex items-center gap-1.5 transition-all';
                statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500"></span><span>${text}</span>`;
            } else {
                const text = this.t ? this.t('guest_meal_closed') : 'انتهت بوفيهات اليوم • خدمة الغرف متاحة 24/7 🛎️';
                statusBadge.className = 'text-[11px] px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700 shadow-sm inline-flex items-center gap-1.5 transition-all';
                statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400"></span><span>${text}</span>`;
            }
        }
    },

    /**
     * Bind keyboard shortcuts
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC - close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            // Ctrl/Cmd + K - open spotlight search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSpotlightSearch();
            }
            // Ctrl/Cmd + B - toggle bookmarks
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toggleBookmarks();
            }
        });
    },

    /**
     * Close all open modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('[id$="Modal"], [id$="drawer"], [id*="modal"]');
        modals.forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    },

    /**
     * Open spotlight search
     */
    openSpotlightSearch() {
        const searchInput = document.getElementById('spotlightSearch');
        const modal = document.getElementById('spotlightModal');
        if (searchInput && modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => searchInput.focus(), 100);
        } else {
            // Direct search if no modal
            document.getElementById('roomSearchInput')?.focus();
        }
    },

    /**
     * Toggle bookmarks visibility
     */
    toggleBookmarks() {
        const bookmarksPanel = document.getElementById('bookmarksPanel');
        if (bookmarksPanel) {
            bookmarksPanel.classList.toggle('hidden');
        }
    },

    /**
     * Share guest coordinates via WhatsApp
     */
    shareGuestCoordinates() {
        if (!navigator.geolocation) {
            uiManager.showToast('لا يتوفر تحديد الموقع الجغرافي في هذا المتصفح', '⚠️');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const url = `https://wa.me/?text=📍%20%20${encodeURIComponent(`أبحث عن غرفتي في موقع: ${latitude}, ${longitude}`)}`;
                window.open(url, '_blank');
            },
            () => {
                uiManager.showToast('تعذر الوصول إلى موقعك الحالي', '⚠️');
            }
        );
    },

    /**
     * Open hotspot login modal
     */
    openHotspotLoginModal() {
        uiManager.openModal('hotspotLoginModal');
    },

    /**
     * Open emergency drawer
     */
    openEmergencyDrawer() {
        uiManager.openModal('emergencyDrawer');
    },

    /**
     * Open feedback modal
     */
    openFeedbackModal() {
        uiManager.openModal('feedbackModal');
    },

    /**
     * Open sun shade radar modal
     */
    openSunShadeModal() {
        uiManager.openModal('sunShadeModal');
    },

    /**
     * Open guest profile modal
     */
    openGuestProfileModal() {
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
        uiManager.openModal('guestProfileModal');
    },

    /**
     * Close guest profile modal
     */
    closeGuestProfileModal() {
        uiManager.closeModal('guestProfileModal');
    },

    /**
     * Save guest profile from modal form
     */
    saveGuestProfile(e) {
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
        audioManager.playBeep(880, 150);
        const isAr = (this.currentLang || 'ar') === 'ar';
        this.showToast(isAr ? `✨ مرحباً بك يا ${name}! تم حفظ بياناتك وتحديث اللوحة بنجاح` : `✨ Welcome ${name}! Profile updated successfully`, '👑');
    },

    /**
     * Update guest dashboard header UI elements
     */
    updateGuestDashboardUI() {
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
                if (!isNaN(roomNum) && typeof globalThis.Wayfinder !== 'undefined' && typeof globalThis.Wayfinder.findRoomBuilding === 'function') {
                    foundBuilding = globalThis.Wayfinder.findRoomBuilding(roomNum);
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

    /**
     * Close modal by id
     * @param {string} modalId - Modal element id
     */
    closeModal(modalId) {
        uiManager.closeModal(modalId);
    },

    /**
     * Open smart hub modal
     */
    openSmartHubModal() {
        uiManager.openModal('smartHubModal');
    },

    /**
     * Close smart hub modal
     */
    closeSmartHubModal() {
        uiManager.closeModal('smartHubModal');
    },

    /**
     * Install PWA
     */
    installPwa() {
        pwaManager.installPwa();
    },

    /**
     * Toggle sunlight/high-contrast mode
     */
    toggleSunlightMode() {
        // Implementation for beach mode / high contrast mode
        const body = document.body;
        body.classList.toggle('beach-mode');
    },

    /**
     * Open cinematic promo video
     */
    openCinematicPromoVideo() {
        if (typeof PromoVideoPlayer !== 'undefined') {
            PromoVideoPlayer.open();
        } else {
            uiManager.openModal('promoVideoModal');
        }
    },

    /**
     * Open photo gallery
     */
    openGalleryModal(cat = 'all') {
        if (typeof GalleryManager !== 'undefined') {
            GalleryManager.open(cat);
        } else {
            uiManager.openModal('resortGalleryModal');
        }
    },

    /**
     * Start cinematic tour
     */
    startCinematicTour() {
        if (typeof MapEngine !== 'undefined') {
            if (typeof MapEngine.startCinematicTour === 'function') {
                MapEngine.startCinematicTour();
            } else if (typeof MapEngine.startOrbitTour === 'function') {
                MapEngine.scrollToMap();
                MapEngine.startOrbitTour();
            }
        }
    },

    /**
     * Open MikroTik portal
     */
    openMikrotikPortal() {
        window.open('http://8.8.8.8', '_blank');
    },

    // Legacy methods for backward compatibility
    showToast(msg, icon = '🛎️', duration = 3400) {
        uiManager.showToast(msg, icon, duration);
    },

    loadSavedRoom() {
        serviceHandler.loadSavedRoom();
    },

    saveGuestRoom(room, name) {
        serviceHandler.saveGuestRoom(room, name);
    }
};

// Make App globally available for inline onclick handlers in index.html
if (typeof window !== 'undefined') {
    window.App = App;
}

export default App;