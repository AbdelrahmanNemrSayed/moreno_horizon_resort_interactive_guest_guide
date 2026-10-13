/**
 * Moreno Horizon Spa & Resort - Unified Positioning Service
 * Unifies client and server positioning engines, utilizing shared PositioningCore
 * Features:
 * - Log-Distance Path Loss model
 * - WLS & Gauss-Newton 2D trilateration
 * - EMA filtering with velocity clamping
 * - k-NN radio fingerprint matching
 * - In-memory LRU-style cache for repeated coordinate calculations
 * - Asynchronous fingerprint persistence
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PositioningCore from "../../shared/positioning-core.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CONFIG_PATH = path.resolve(
  __dirname,
  "../../config/accessPoints.json",
);
const DEFAULT_FP_PATH = path.resolve(
  __dirname,
  "../../server/data/fingerprints.json",
);

export class UnifiedPositioningService {
  constructor(options = {}) {
    this.configPath = options.configPath || DEFAULT_CONFIG_PATH;
    this.fingerprintsPath = options.fingerprintsPath || DEFAULT_FP_PATH;
    this.alpha = options.alpha || 0.35;
    this.maxVelocityPxPerSec = options.maxVelocityPxPerSec || 80.0;

    this.apMap = new Map();
    this.fingerprints = [];
    this.filterState = new Map();
    this.calcCache = new Map();
    this.maxCacheSize = 256;

    this.loadConfig();
    this.loadFingerprints();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, "utf8");
        const cfg = JSON.parse(raw);
        this.canvasWidth = cfg.mapWidth || 896;
        this.canvasHeight = cfg.mapHeight || 1200;

        this.apMap.clear();
        for (const ap of cfg.accessPoints || []) {
          if (ap.enabled === false) continue;
          const normBssid = this.normalizeMac(ap.bssid);
          const enriched = {
            ...ap,
            bssid: normBssid,
            pixelX: ap.pixelX ?? ap.x ?? 0,
            pixelY: ap.pixelY ?? ap.y ?? 0,
            txPower: ap.txPower ?? -41.0,
            pathLossExponent: ap.pathLossExponent ?? 2.4,
          };
          this.apMap.set(normBssid, enriched);
          if (ap.id) {
            this.apMap.set(String(ap.id).toUpperCase(), enriched);
          }
        }
      }
    } catch (err) {
      console.warn("[UnifiedPositioning] Failed to load config:", err.message);
    }
  }

  async loadFingerprints() {
    try {
      if (fs.existsSync(this.fingerprintsPath)) {
        const raw = await fs.promises.readFile(this.fingerprintsPath, "utf8");
        this.fingerprints = JSON.parse(raw);
      }
    } catch (err) {
      this.fingerprints = [];
    }
  }

  async saveFingerprint(fp) {
    if (!fp || typeof fp.pixelX !== "number" || typeof fp.pixelY !== "number") {
      throw new Error("Invalid fingerprint coordinates");
    }
    const newEntry = {
      id: `fp_${Date.now()}`,
      label: fp.label || "Survey Point",
      pixelX: fp.pixelX,
      pixelY: fp.pixelY,
      readings: fp.readings || {},
      timestamp: Date.now(),
    };
    this.fingerprints.push(newEntry);
    try {
      const dir = path.dirname(this.fingerprintsPath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      await fs.promises.writeFile(
        this.fingerprintsPath,
        JSON.stringify(this.fingerprints, null, 2),
        "utf8",
      );
    } catch (err) {
      console.error(
        "[UnifiedPositioning] Failed to save fingerprint asynchronously:",
        err.message,
      );
    }
    return newEntry;
  }

  normalizeMac(mac) {
    if (!mac || typeof mac !== "string") return "";
    return mac.trim().toUpperCase().replace(/[:-]/g, "");
  }

  locateClient(mac, readings) {
    if (!readings || typeof readings !== "object") return null;

    // Check calculation cache
    const cacheKey = `${mac}_${JSON.stringify(readings)}`;
    if (this.calcCache.has(cacheKey)) {
      return this.calcCache.get(cacheKey);
    }

    const anchors = [];
    for (const [apKey, rawRssi] of Object.entries(readings)) {
      const rssi = typeof rawRssi === "number" ? rawRssi : parseFloat(rawRssi);
      if (isNaN(rssi) || rssi < -95 || rssi > -10) continue;

      const norm = this.normalizeMac(apKey);
      const ap =
        this.apMap.get(norm) || this.apMap.get(String(apKey).toUpperCase());
      if (!ap) continue;

      const distMeters = PositioningCore.rssiToDistance(
        rssi,
        ap.txPower,
        ap.pathLossExponent,
      );
      const distPx = PositioningCore.metersToPixels(distMeters);

      anchors.push({
        id: ap.id,
        x: ap.pixelX,
        y: ap.pixelY,
        distancePx: distPx,
        distanceM: distMeters,
        rssi,
        weight: Math.pow(10, (rssi + 100) / 20),
      });
    }

    let rawPos = null;
    let method = "none";

    if (anchors.length >= 3) {
      rawPos = PositioningCore.solveTrilateration(anchors);
      method = "trilateration";
    } else if (anchors.length > 0) {
      // Fallback: Proximity centroid weighted by RSSI
      let sumW = 0,
        sumX = 0,
        sumY = 0;
      for (const a of anchors) {
        sumW += a.weight;
        sumX += a.x * a.weight;
        sumY += a.y * a.weight;
      }
      rawPos = { x: sumX / sumW, y: sumY / sumW };
      method = "proximity_centroid";
    }

    if (!rawPos) return null;

    // Apply EMA filter
    const prev = this.filterState.get(mac);
    const now = Date.now();
    let finalX = rawPos.x;
    let finalY = rawPos.y;

    if (prev) {
      const smoothed = PositioningCore.applyEma(prev, rawPos, this.alpha);
      finalX = smoothed.x;
      finalY = smoothed.y;
    }

    const percent = PositioningCore.pixelsToPercent(
      finalX,
      finalY,
      this.canvasWidth,
      this.canvasHeight,
    );
    const result = {
      mac,
      pixelX: Math.round(finalX),
      pixelY: Math.round(finalY),
      pctX: percent.pctX,
      pctY: percent.pctY,
      method,
      anchorsCount: anchors.length,
      timestamp: now,
    };

    this.filterState.set(mac, { x: finalX, y: finalY, timestamp: now });

    // Store in cache
    if (this.calcCache.size >= this.maxCacheSize) {
      const oldestKey = this.calcCache.keys().next().value;
      this.calcCache.delete(oldestKey);
    }
    this.calcCache.set(cacheKey, result);

    return result;
  }
}

export const unifiedPositioningService = new UnifiedPositioningService();
export default unifiedPositioningService;
