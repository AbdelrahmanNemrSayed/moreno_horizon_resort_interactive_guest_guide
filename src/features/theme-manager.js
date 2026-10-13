/**
 * Moreno Horizon Spa & Resort - Theme Manager Feature Module
 * Handles dark/light mode, theme persistence, and UI theming.
 */

export class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.loadTheme();
    }

    // Load saved theme from localStorage
    loadTheme() {
        const savedTheme = localStorage.getItem('moreno_theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // Default to dark theme for luxury resort experience
            this.setTheme('dark');
        }
    }

    // Set theme (dark or light)
    setTheme(theme) {
        this.currentTheme = theme;
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Save to localStorage
        localStorage.setItem('moreno_theme', theme);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    // Toggle between dark and light
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        return newTheme;
    }

    // Check if dark mode is active
    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    // Get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Create a singleton instance for backward compatibility
export const themeManager = new ThemeManager();
export default ThemeManager;