/**
 * Moreno Horizon Spa & Resort - Environment & Security Configuration Loader
 * Loads .env safely and validates critical runtime secrets.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvironmentFile() {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    if (typeof process.loadEnvFile === "function") {
      try {
        process.loadEnvFile(envPath);
        return;
      } catch {
        // Fallback to manual parsing if process.loadEnvFile throws
      }
    }

    // Lightweight zero-dependency .env parser fallback
    try {
      const content = fs.readFileSync(envPath, "utf8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      });
    } catch (err) {
      console.warn("[Env] Warning: Could not read .env file:", err.message);
    }
  }
}

loadEnvironmentFile();

const isProduction = process.env.NODE_ENV === "production";

// Critical Secrets & Validations
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  process.env.ADMIN_KEY ||
  (isProduction ? null : "Moreno@2026!");
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (isProduction ? null : "moreno-resort-secret-key-change-in-production");
const MIKROTIK_FEED_KEY =
  process.env.MIKROTIK_FEED_KEY ||
  (isProduction ? null : "moreno-mikrotik-secure-feed-key");

if (isProduction && (!ADMIN_PASSWORD || !JWT_SECRET || !MIKROTIK_FEED_KEY)) {
  console.error(
    "FATAL: Missing critical security secrets in production! ADMIN_PASSWORD, JWT_SECRET, and MIKROTIK_FEED_KEY must be set in .env or environment.",
  );
  process.exit(1);
}

if (!isProduction && ADMIN_PASSWORD === "Moreno@2026!") {
  console.log(
    "[Security] Notice: Running in development mode with default admin credentials.",
  );
}

const config = Object.freeze({
  isProduction,
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 8080,

  security: {
    adminPassword: ADMIN_PASSWORD,
    jwtSecret: JWT_SECRET,
    mikrotikFeedKey: MIKROTIK_FEED_KEY,
    devAdminPassword: !isProduction
      ? (process.env.DEV_ADMIN_PASSWORD || "admin123")
      : null,
  },

  mikrotik: {
    host: process.env.MIKROTIK_HOST || "192.168.88.1",
    port: parseInt(process.env.MIKROTIK_PORT, 10) || 8728,
    user: process.env.MIKROTIK_USER || "api_user",
    pass: process.env.MIKROTIK_PASS || "moreno_mikrotik_secret",
    pollIntervalMs: parseInt(process.env.MIKROTIK_POLL_INTERVAL_MS, 10) || 1000,
    connectionTimeoutSeconds: parseInt(process.env.MIKROTIK_TIMEOUT_SEC, 10) || 30,
    maxPacketCache: parseInt(process.env.MIKROTIK_CACHE_SIZE, 10) || 100,
  },
});

export default config;
export { config };
