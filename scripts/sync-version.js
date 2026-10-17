/**
 * Moreno Horizon Spa & Resort - Version Synchronization Script
 * Synchronizes cacheVersion and asset query params across sw.js, index.html, and admin.html.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const versionPath = path.join(rootDir, 'config', 'version.json');
if (!fs.existsSync(versionPath)) {
  console.error('[sync-version] Error: config/version.json not found!');
  process.exit(1);
}

const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
const rawVersion = versionData.cacheVersion || '57.0';
const cleanVersion = rawVersion.replace(/^v/, '');
const majorVersion = cleanVersion.split('.')[0];
const cacheName = `moreno-guide-v${majorVersion}`;

console.log(`--- Syncing Version to ${cleanVersion} (Cache Name: ${cacheName}) ---`);

// 1. Update sw.js
const swPath = path.join(rootDir, 'sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Replace CACHE_NAME
  swContent = swContent.replace(
    /const\s+CACHE_NAME\s*=\s*["'][^"']+["'];/,
    `const CACHE_NAME = "${cacheName}";`
  );

  // Replace query param ?v=... in ASSETS_TO_CACHE
  swContent = swContent.replace(
    /((?:\.\/)?(?:css|js|shared)\/[^"'\s]+\.(?:js|css))\?v=[a-zA-Z0-9._-]+/g,
    `$1?v=${cleanVersion}`
  );

  fs.writeFileSync(swPath, swContent, 'utf8');
  console.log(`✓ sw.js updated successfully.`);
}

// 2. Update index.html
const indexPath = path.join(rootDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  indexContent = indexContent.replace(
    /((?:css|js|shared)\/[^"'\s>]+\.(?:js|css))\?v=[a-zA-Z0-9._-]+/g,
    `$1?v=${cleanVersion}`
  );

  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log(`✓ index.html updated successfully.`);
}

// 3. Update admin.html
const adminPath = path.join(rootDir, 'admin.html');
if (fs.existsSync(adminPath)) {
  let adminContent = fs.readFileSync(adminPath, 'utf8');
  
  adminContent = adminContent.replace(
    /((?:css|js|shared)\/[^"'\s>]+\.(?:js|css))\?v=[a-zA-Z0-9._-]+/g,
    `$1?v=${cleanVersion}`
  );

  fs.writeFileSync(adminPath, adminContent, 'utf8');
  console.log(`✓ admin.html updated successfully.`);
}

console.log(`>>> Version Synchronization Complete: v${cleanVersion} <<<\n`);
