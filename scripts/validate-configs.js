/**
 * Moreno Horizon Spa & Resort - Configuration Validation Suite
 * Verifies all JSON configs, locales symmetry, and spatial coordinates.
 */

import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("--- Running Moreno Horizon Configuration Validator ---");

// 1. Validate Access Points
const apPath = path.resolve(__dirname, "../config/accessPoints.json");
assert.ok(fs.existsSync(apPath), "config/accessPoints.json must exist");
const apConfig = JSON.parse(fs.readFileSync(apPath, "utf8"));

assert.strictEqual(apConfig.mapWidth, 896, "mapWidth must be 896");
assert.strictEqual(apConfig.mapHeight, 1200, "mapHeight must be 1200");
assert.ok(
  Array.isArray(apConfig.accessPoints),
  "accessPoints must be an array",
);
assert.ok(
  apConfig.accessPoints.length >= 10,
  "Expected at least 10 access points",
);

for (const ap of apConfig.accessPoints) {
  assert.ok(ap.id, `AP missing id: ${JSON.stringify(ap)}`);
  assert.ok(ap.bssid, `AP missing bssid: ${ap.id}`);
  assert.ok(ap.x >= 0 && ap.x <= 896, `AP ${ap.id} x out of bounds: ${ap.x}`);
  assert.ok(ap.y >= 0 && ap.y <= 1200, `AP ${ap.id} y out of bounds: ${ap.y}`);
  assert.ok(
    ap.pctX >= 0 && ap.pctX <= 100,
    `AP ${ap.id} pctX out of bounds: ${ap.pctX}`,
  );
  assert.ok(
    ap.pctY >= 0 && ap.pctY <= 100,
    `AP ${ap.id} pctY out of bounds: ${ap.pctY}`,
  );
  assert.strictEqual(ap.x, ap.pixelX, `AP ${ap.id} x and pixelX must match`);
  assert.strictEqual(ap.y, ap.pixelY, `AP ${ap.id} y and pixelY must match`);
}
console.log(
  `✓ Access Points valid: ${apConfig.accessPoints.length} APs passed.`,
);

// 2. Validate Locales
const languages = ["ar", "en", "ru", "de"];
const localeData = {};
for (const lang of languages) {
  const lPath = path.resolve(__dirname, `../locales/${lang}.json`);
  assert.ok(fs.existsSync(lPath), `locales/${lang}.json must exist`);
  localeData[lang] = JSON.parse(fs.readFileSync(lPath, "utf8"));
}

const arKeys = Object.keys(localeData.ar).sort();
console.log(`✓ Arabic locale contains ${arKeys.length} translation keys.`);

for (const lang of ["en", "ru", "de"]) {
  const langKeys = Object.keys(localeData[lang]).sort();
  assert.strictEqual(
    langKeys.length,
    arKeys.length,
    `${lang} key count (${langKeys.length}) does not match ar (${arKeys.length})`,
  );
  console.log(`✓ Locale ${lang} verified with identical key count.`);
}

// 3. Validate .env.example
const envExPath = path.resolve(__dirname, "../.env.example");
assert.ok(fs.existsSync(envExPath), ".env.example must exist");
const envContent = fs.readFileSync(envExPath, "utf8");
assert.ok(
  envContent.includes("ADMIN_PASSWORD"),
  ".env.example must specify ADMIN_PASSWORD",
);
assert.ok(
  envContent.includes("JWT_SECRET"),
  ".env.example must specify JWT_SECRET",
);
assert.ok(
  envContent.includes("MIKROTIK_FEED_KEY"),
  ".env.example must specify MIKROTIK_FEED_KEY",
);
console.log("✓ .env.example contains all required security definitions.");

// 4. Validate package.json
const pkgPath = path.resolve(__dirname, "../package.json");
assert.ok(fs.existsSync(pkgPath), "package.json must exist");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
assert.ok(pkg.scripts.start, "package.json must have start script");
assert.ok(pkg.scripts.test, "package.json must have test script");
console.log("✓ package.json scripts and metadata verified.");

console.log("\n>>> ALL CONFIGURATION VALIDATIONS PASSED! <<<\n");
