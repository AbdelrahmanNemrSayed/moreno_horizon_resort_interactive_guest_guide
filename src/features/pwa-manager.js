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

    // Notify user about update
    notifyUpdateAvailable() {
        // Implementation for showing update notification
        console.log('[PWA] New version available. Please refresh.');
    }
}

// Create a singleton instance for backward compatibility
export const pwaManager = new PWAManager();
export default PWAManager;