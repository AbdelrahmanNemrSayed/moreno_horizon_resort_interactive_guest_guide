import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.resolve(__dirname, "../js/data.js");
const content = fs.readFileSync(targetPath, "utf8");

const startMarker = "const i18n = {";
const endMarker = "// Activity Titles Localization";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const replacement = `// Internationalization (i18n) is provided by js/core/i18n-engine.js and js/locales-bundle.js
if (typeof i18n === 'undefined') {
  var i18n = (typeof I18nEngine !== 'undefined') ? I18nEngine.createLegacyProxy() : {};
}

`;

const newContent =
  content.slice(0, startIdx) + replacement + content.slice(endIdx);
fs.writeFileSync(targetPath, newContent, "utf8");
console.log(
  `Successfully trimmed js/data.js from ${content.length} to ${newContent.length} bytes`,
);
