/**
 * Moreno Horizon Spa & Resort - UI Manager Feature Module
 * Handles UI interactions, modals, dialogs, and user interface updates.
 */

export class UIManager {
    constructor() {
        this.modals = new Map();
        this.toastContainer = null;
    }

    // Modal management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Trap focus in modal
            this.trapFocus(modal);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            // Return focus to trigger element
            this.returnFocus();
        }
    }

    trapFocus(modal) {
        // Implementation for trapping focus in modal
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) { // shift + tab
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else { // tab
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
            if (e.key === 'Escape') {
                this.closeModal(modal.id);
            }
        });
    }

    returnFocus() {
        // Implementation to return focus to the element that opened the modal
        // This would need to be set when opening the modal
    }

    // Toast notifications
    showToast(message, icon = "🛎️", duration = 3400) {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toastContainer';
            document.body.appendChild(this.toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-msg glass-card p-3 rounded-2xl border border-amber-500/30 shadow-2xl flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-white';

        const iconEl = document.createElement('span');
        iconEl.className = 'w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm shadow-sm';
        iconEl.textContent = icon;

        const messageEl = document.createElement('span');
        messageEl.className = 'flex-1';
        messageEl.textContent = message;

        toast.append(iconEl, messageEl);
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-leave');
            setTimeout(() => toast.remove(), 320);
        }, duration);
    }

    // UI updates
    updateElementText(elementId, text) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = text;
    }

    updateElementClass(elementId, classToAdd, classToRemove = null) {
        const el = document.getElementById(elementId);
        if (el) {
            if (classToAdd) el.classList.add(classToAdd);
            if (classToRemove) el.classList.remove(classToRemove);
        }
    }

    toggleElementVisibility(elementId, show) {
        const el = document.getElementById(elementId);
        if (el) {
            if (show) {
                el.classList.remove('hidden');
                el.classList.add('flex');
            } else {
                el.classList.add('hidden');
                el.classList.remove('flex');
            }
        }
    }
}

// Create a singleton instance for backward compatibility
export const uiManager = new UIManager();
export default UIManager;