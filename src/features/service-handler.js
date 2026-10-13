/**
 * Moreno Horizon Spa & Resort - Service Handler Feature Module
 * Handles service requests, orders, and service-related UI interactions.
 */

export class ServiceHandler {
    constructor() {
        this.activeServiceOrder = null;
        this.cart = [];
    }

    // Cart management
    addToCart(item) {
        this.cart.push(item);
        this.updateCartBadge();
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.updateCartBadge();
    }

    updateCartBadge() {
        if (typeof document === 'undefined') return;
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            cartBadge.textContent = this.cart.length;
            cartBadge.classList.toggle('hidden', this.cart.length === 0);
        }
    }

    // Service order management
    startServiceOrder(serviceDetails) {
        this.activeServiceOrder = {
            ...serviceDetails,
            startTime: Date.now(),
            status: 'active'
        };
        this.updateServiceOrderUI();
    }

    completeServiceOrder() {
        if (this.activeServiceOrder) {
            this.activeServiceOrder.status = 'completed';
            this.activeServiceOrder.endTime = Date.now();
            this.updateServiceOrderUI();
            // Optionally, save to history or send to server
        }
    }

    cancelServiceOrder() {
        this.activeServiceOrder = null;
        this.updateServiceOrderUI();
    }

    updateServiceOrderUI() {
        if (typeof document === 'undefined') return;
        const serviceOrderEl = document.getElementById('activeServiceOrder');
        if (serviceOrderEl) {
            if (this.activeServiceOrder) {
                serviceOrderEl.classList.remove('hidden');
                serviceOrderEl.classList.add('flex');
                // Update details
                // ... (implementation depends on UI structure)
            } else {
                serviceOrderEl.classList.add('hidden');
                serviceOrderEl.classList.remove('flex');
            }
        }
    }

    // Guest room management
    loadSavedRoom() {
        // This would typically be in UIManager or a separate room manager
        // For now, we keep it here as it was in app.js
        const savedRoom = localStorage.getItem('moreno_guest_room');
        const savedName = localStorage.getItem('moreno_guest_name');
        if (savedRoom || savedName) {
            // Update UI with saved room/name
            // This would call UIManager methods
        }
    }

    saveGuestRoom(room, name) {
        localStorage.setItem('moreno_guest_room', room);
        localStorage.setItem('moreno_guest_name', name);
    }
}

// Create a singleton instance for backward compatibility
export const serviceHandler = new ServiceHandler();
export default ServiceHandler;