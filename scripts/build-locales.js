import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ar = fs.readFileSync(
  path.resolve(__dirname, "../locales/ar.json"),
  "utf8",
);
const en = fs.readFileSync(
  path.resolve(__dirname, "../locales/en.json"),
  "utf8",
);
const ru = fs.readFileSync(
  path.resolve(__dirname, "../locales/ru.json"),
  "utf8",
);
const de = fs.readFileSync(
  path.resolve(__dirname, "../locales/de.json"),
  "utf8",
);

const code = `/**
 * Moreno Horizon Spa & Resort - Bundled Localizations
 * Auto-generated from locales/*.json for fast non-blocking client loading and offline PWA
 */
(function(root) {
  const arData = ${ar};
  const enData = ${en};
  const ruData = ${ru};
  const deData = ${de};

  if (typeof root.I18nEngine !== 'undefined') {
    root.I18nEngine.registerLocale('ar', arData);
    root.I18nEngine.registerLocale('en', enData);
    root.I18nEngine.registerLocale('ru', ruData);
    root.I18nEngine.registerLocale('de', deData);
    root.i18n = root.I18nEngine.createLegacyProxy();
  } else {
    root.i18n = { ar: arData, en: enData, ru: ruData, de: deData };
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
`;

fs.writeFileSync(
  path.resolve(__dirname, "../js/locales-bundle.js"),
  code,
  "utf8",
);
console.log("Successfully generated js/locales-bundle.js");
