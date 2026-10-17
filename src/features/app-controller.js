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

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    },

    /**
     * Update all elements with i18n attributes
     */
    updateI18nElements() {
        const getTrans = (key) => {
            if (typeof I18nEngine !== 'undefined' && typeof I18nEngine.t === 'function') {
                return I18nEngine.t(key, null, this.currentLang);
            }
            if (typeof window !== 'undefined' && window.i18n && window.i18n[this.currentLang]) {
                return window.i18n[this.currentLang][key];
            }
            return key;
        };

        // Text
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                const text = getTrans(key);
                if (text) {
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
                if (text) el.setAttribute('placeholder', text);
            }
        });

        // Titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                const text = getTrans(key);
                if (text) el.setAttribute('title', text);
            }
        });

        // Aria labels
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (key) {
                const text = getTrans(key);
                if (text) el.setAttribute('aria-label', text);
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
            document.getElementById('roomSearchInput'),
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
        if (!clockEl) return;

        this.updateClock(clockEl);
        setInterval(() => this.updateClock(clockEl), 1000);
    },

    /**
     * Update clock display
     * @param {HTMLElement} clockEl - Clock element
     */
    updateClock(clockEl) {
        const date = new Date();
        const locale = { ar: 'ar-EG', en: 'en-GB', ru: 'ru-RU', de: 'de-DE' }[this.currentLang] || 'ar-EG';
        const timeStr = new Intl.DateTimeFormat(locale, {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
        clockEl.textContent = timeStr;
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
        uiManager.openModal('guestProfileModal');
    },

    /**
     * Close guest profile modal
     */
    closeGuestProfileModal() {
        uiManager.closeModal('guestProfileModal');
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
        // Implementation for video modal
        uiManager.openModal('promoVideoModal');
    },

    /**
     * Start cinematic tour
     */
    startCinematicTour() {
        // Implementation for 3D map tour
        if (typeof MapEngine !== 'undefined' && MapEngine.startFlyover) {
            MapEngine.startFlyover();
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