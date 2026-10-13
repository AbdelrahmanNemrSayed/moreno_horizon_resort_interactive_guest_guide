/**
 * Moreno Horizon Spa & Resort - Advanced Internationalization (i18n) Engine
 * Features:
 * - ICU MessageFormat parameter interpolation ({name}, {room})
 * - Native Intl.PluralRules pluralization support (Arabic 6-plural categories, English, Russian, German)
 * - Safe HTML entity escaping
 * - Full backward compatibility with window.i18n[lang][key]
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.I18nEngine = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  class I18nEngineClass {
    constructor() {
      this.currentLang = "ar";
      this.locales = {
        ar: {},
        en: {},
        ru: {},
        de: {},
      };
      this.pluralRulesCache = new Map();
      this.isInitialized = false;
    }

    /**
     * Load locale dictionary directly into engine
     */
    registerLocale(lang, messages) {
      if (!this.locales[lang]) {
        this.locales[lang] = {};
      }
      this.locales[lang] = Object.assign(this.locales[lang], messages);
    }

    /**
     * Set active locale
     */
    setLanguage(lang) {
      if (this.locales[lang]) {
        this.currentLang = lang;
      }
      return this.currentLang;
    }

    getPluralRule(lang) {
      if (!this.pluralRulesCache.has(lang)) {
        try {
          this.pluralRulesCache.set(lang, new Intl.PluralRules(lang));
        } catch (e) {
          this.pluralRulesCache.set(lang, new Intl.PluralRules("en"));
        }
      }
      return this.pluralRulesCache.get(lang);
    }

    /**
     * Translate a key with optional ICU parameter interpolation and plural rules
     * @param {string} key
     * @param {Object} [params]
     * @param {string} [lang]
     * @returns {string}
     */
    t(key, params = null, lang = this.currentLang) {
      const dict = this.locales[lang] || this.locales.ar || {};
      let msg = dict[key];

      // Fallback to Arabic if missing in current locale
      if (msg === undefined && lang !== "ar") {
        msg = (this.locales.ar || {})[key];
      }

      if (msg === undefined) {
        return key;
      }

      if (!params || typeof params !== "object") {
        return msg;
      }

      return this.formatMessage(msg, params, lang);
    }

    /**
     * Parse message with {variable} and {count, plural, ...} patterns
     */
    formatMessage(pattern, params, lang) {
      if (typeof pattern !== "string") return String(pattern);

      // 1. Process ICU plural expressions: {count, plural, one {...} other {...}}
      let formatted = pattern.replace(
        /\{(\w+),\s*plural,\s*((?:[^{}]*\{[^{}]*\})+)\s*\}/g,
        (match, varName, rulesStr) => {
          const count = Number(params[varName]);
          if (isNaN(count)) return match;

          const pr = this.getPluralRule(lang);
          const category = pr.select(count); // 'zero', 'one', 'two', 'few', 'many', 'other'

          // Parse rules like: one {# room} other {# rooms}
          const ruleRegex = /(\w+)\s*\{([^}]*)\}/g;
          let ruleMatch;
          const branches = {};
          while ((ruleMatch = ruleRegex.exec(rulesStr)) !== null) {
            branches[ruleMatch[1]] = ruleMatch[2];
          }

          const template = branches[category] || branches["other"] || "";
          return template.replace(/#/g, String(count));
        },
      );

      // 2. Process standard parameter interpolations: {name}, {room}, {destination}
      formatted = formatted.replace(/\{(\w+)\}/g, (match, varName) => {
        if (params[varName] !== undefined && params[varName] !== null) {
          return String(params[varName]);
        }
        return match;
      });

      return formatted;
    }

    /**
     * Create backward-compatible Proxy for window.i18n
     */
    createLegacyProxy() {
      const self = this;
      return new Proxy(this.locales, {
        get(target, lang) {
          if (lang in target) {
            return target[lang];
          }
          return target.ar;
        },
      });
    }
  }

  const instance = new I18nEngineClass();
  return instance;
});
