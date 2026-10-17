/**
 * Moreno Horizon Spa & Resort - Audio Manager Feature Module
 * Handles audio effects, voice guidance, and sound notifications.
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.isInitialized = false;
        this.sounds = new Map();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('[AudioManager] Audio system initialized.');
    }

    // Audio context management
    getAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.warn('[AudioManager] AudioContext not supported:', error);
            }
        }
        return this.audioContext;
    }

    // Play a beep sound
    playBeep(frequency = 880, duration = 200, type = 'sine') {
        if (this.isMuted) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

        oscillator.start(now);
        oscillator.stop(now + duration / 1000);
    }

    // Play a chime sound for notifications
    playChime() {
        if (this.isMuted) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.frequency.value = freq;
                oscillator.type = 'sine';

                const now = ctx.currentTime;
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

                oscillator.start(now);
                oscillator.stop(now + 0.3);
            }, i * 100);
        });
    }

    // Toggle mute
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    setMuted(muted) {
        this.isMuted = muted;
    }

    // Preload sound effects
    preloadSound(name, url) {
        if (!name || !url) return;
        this.sounds.set(name, url);
    }

    // Play sound from preloaded buffer
    playSound(name) {
        const sound = this.sounds.get(name);
        if (!sound) return;
        // Implementation for playing preloaded sound
    }
}

// Create a singleton instance for backward compatibility
export const audioManager = new AudioManager();
export default AudioManager;