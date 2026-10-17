/**
 * Moreno Horizon Spa & Resort - PWA Manager Feature Module
 * Handles Progressive Web App features: service worker, install prompt, offline support.
 */

export class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstallable = false;
        this.isInstalled = false;
        this.registration = null;
    }

    // Register service worker
    registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('[PWA] Service Worker not supported');
            return;
        }

        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                this.registration = registration;
                console.log('[PWA] Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.warn('[PWA] Service Worker registration failed:', error);
            });
    }

    // Handle install prompt
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.isInstallable = true;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.isInstallable = false;
            this.hideInstallButton();
            console.log('[PWA] App installed successfully');
        });
    }

    // Show install button in UI
    showInstallButton() {
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) {
            installBtn.classList.remove('hidden');
        }
    }

    // Hide install button
    hideInstallButton() {
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) {
            installBtn.classList.add('hidden');
        }
    }

    // Trigger install prompt
    async installPwa() {
        if (!this.deferredPrompt) {
            console.warn('[PWA] No install prompt available');
            return false;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            this.isInstalled = true;
            this.isInstallable = false;
            this.hideInstallButton();
            return true;
        }

        return false;
    }

    // Check if app is running as PWA
    isPwaMode() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: minimal-ui)').matches ||
            (window.navigator.standalone === true);
    }

    // Request notification permission
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('[PWA] Notifications not supported');
            return 'unsupported';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission === 'denied') {
            return 'denied';
        }

        const permission = await Notification.requestPermission();
        return permission;
    }

    // Send notification
    async sendNotification(title, options = {}) {
        const permission = await this.requestNotificationPermission();
        if (permission !== 'granted') return;

        if (this.registration) {
            this.registration.showNotification(title, {
                icon: 'assets/icons/icon-192.png',
                badge: 'assets/icons/icon-192.png',
                ...options
            });
        } else if (this.isPwaMode()) {
            new Notification(title, options);
        }
    }

    // Check for updates
    checkForUpdates() {
        if (!this.registration) return;

        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New version available, prompt user to refresh
                    this.notifyUpdateAvailable();
                }
            });
        });
    }

    // Notify user about update with a real visible banner
    notifyUpdateAvailable() {
        console.log('[PWA] New version available.');
        if (typeof document === 'undefined') return;

        // Reuse existing toast container or create one
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pwaUpdateBanner';
            container.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;';
            document.body.appendChild(container);
        }

        const banner = document.createElement('div');
        banner.style.cssText = 'background:rgba(13,23,39,0.95);border:1px solid rgba(6,182,212,0.5);border-radius:16px;padding:12px 20px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);color:#f1f5f9;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;';
        banner.innerHTML = `
            <span style="font-size:18px">🔄</span>
            <span>تحديث جديد متاح للتطبيق</span>
            <button onclick="window.location.reload()" style="margin-inline-start:auto;padding:6px 14px;border-radius:10px;background:linear-gradient(135deg,#06b6d4,#3b82f6);color:#020617;font-weight:900;font-size:12px;border:none;cursor:pointer;">
                تحديث الآن
            </button>
        `;
        container.appendChild(banner);
    }
}

// Create a singleton instance for backward compatibility
export const pwaManager = new PWAManager();
export default PWAManager;