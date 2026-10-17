/**
 * Moreno Horizon Spa & Resort - Indoor Mathematical Positioning Engine
 *
 * Features:
 * 1. Log-Distance Path Loss Model (RSSI -> Distance in meters & pixels)
 * 2. Robust 2D Trilateration via Weighted Least Squares (WLS) & Gauss-Newton Optimization
 * 3. Exponential Moving Average (EMA) & Velocity Clamping Filter (alpha = 0.35)
 * 4. Coordinate Transformation between canvas pixels (896x1200) and percentages (0..100)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PositioningCore from "../../shared/positioning-core.js";
import envConfig from "../../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CONFIG_PATH = path.resolve(
  __dirname,
  "../../config/accessPoints.json",
);

class PositioningEngine {
  constructor(configPath = DEFAULT_CONFIG_PATH) {
    this.configPath = configPath;
    this.loadConfig();

    // EMA smoothing state per client MAC: mac -> { pixelX, pixelY, pctX, pctY, accuracyRadiusMeters, lastTime, sampleCount }
    this.filterState = new Map();

    // Packet Cache for the last 100 Mikrotik packets
    this.packetCache = [];
    this.MAX_CACHE_SIZE = envConfig.mikrotik.maxPacketCache || 100;

    // AP Stats: AP_ID -> { connectedDevices: Set, lastRssiSamples: Array, load: Number }
    this.apStats = new Map();

    // Last successful Mikrotik update timestamp
    this.lastSuccessfulUpdate = 0;
    this.connectionTimeoutSeconds = envConfig.mikrotik.connectionTimeoutSeconds || 30;

    // Configurable EMA smoothing factor (alpha ~ 0.35)
    this.alpha = 0.35;
  }

  /**
   * Log advanced packet and check for connection alerts
   */
  logPacket(packet) {
    this.packetCache.push({ ...packet, receivedAt: Date.now() });
    if (this.packetCache.length > this.MAX_CACHE_SIZE) {
      this.packetCache.shift();
    }
    this.lastSuccessfulUpdate = Date.now();
  }

  /**
   * Check for connection timeout
   */
  isConnectionLost() {
    if (this.lastSuccessfulUpdate === 0) return false;
    return (Date.now() - this.lastSuccessfulUpdate) / 1000 > this.connectionTimeoutSeconds;
  }

  /**
   * Update AP metrics
   */
  updateApStats(apId, mac, rssi, snr = null) {
    if (!this.apStats.has(apId)) {
      this.apStats.set(apId, {
        connectedDevices: new Set(),
        rssiSamples: [],
        snrSamples: [],
        load: 0,
      });
    }
    const stats = this.apStats.get(apId);
    stats.connectedDevices.add(mac);

    // Maintain a small sliding window of RSSI/SNR for load/quality calculation
    stats.rssiSamples.push(rssi);
    if (snr !== null) stats.snrSamples.push(snr);

    if (stats.rssiSamples.length > 20) stats.rssiSamples.shift();
    if (stats.snrSamples.length > 20) stats.snrSamples.shift();

    // Load is a heuristic: number of devices + signal density
    stats.load = stats.connectedDevices.size;
  }

  /**
   * Prune stale devices from AP stats periodically
   */
  pruneApStats() {
    const now = Date.now();
    const ttl = 60000; // 1 minute
    for (const stats of this.apStats.values()) {
      // In a real implementation we'd need timestamps per device in the Set
      // For now, let's just clear if we haven't seen updates for a while
      if (now - this.lastSuccessfulUpdate > ttl) {
        stats.connectedDevices.clear();
        stats.load = 0;
      }
    }
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, "utf8");
        this.config = JSON.parse(raw);
      } else {
        this.config = {
          canvasWidth: 896,
          canvasHeight: 1200,
          metersToPixelsRatio: 2.381,
          pixelsToMetersRatio: 0.42,
          defaultTxPower: -41.0,
          defaultPathLossExponent: 2.4,
          accessPoints: [],
        };
      }

      this.canvasWidth = this.config.canvasWidth || 896;
      this.canvasHeight = this.config.canvasHeight || 1200;
      this.metersToPixelsRatio = this.config.metersToPixelsRatio || 2.381; // 1 m = 2.381 px
      this.pixelsToMetersRatio = this.config.pixelsToMetersRatio || 0.42; // 1 px = 0.42 m
      this.defaultTxPower = this.config.defaultTxPower || -41.0;
      this.defaultPathLossExponent = this.config.defaultPathLossExponent || 2.4;

      // Index Access Points by BSSID and ID
      this.apMap = new Map();
      for (const ap of this.config.accessPoints || []) {
        if (!ap.enabled) continue;
        const normBssid = this.normalizeMac(ap.bssid);
        const normId = String(ap.id).toUpperCase();

        const enrichedAp = {
          ...ap,
          pixelX:
            ap.pixelX !== null && ap.pixelX !== undefined
              ? ap.pixelX
              : Math.round((ap.xPct / 100) * this.canvasWidth),
          pixelY:
            ap.pixelY !== null && ap.pixelY !== undefined
              ? ap.pixelY
              : Math.round((ap.yPct / 100) * this.canvasHeight),
          txPower: ap.txPower !== null && ap.txPower !== undefined ? ap.txPower : this.defaultTxPower,
          pathLossExponent:
            ap.pathLossExponent !== null && ap.pathLossExponent !== undefined
              ? ap.pathLossExponent
              : this.defaultPathLossExponent,
        };

        this.apMap.set(normBssid, enrichedAp);
        this.apMap.set(normId, enrichedAp);
      }
    } catch (err) {
      console.error("[PositioningEngine] Failed to load config:", err);
    }
  }

  normalizeMac(mac) {
    if (!mac) return "";
    return String(mac).trim().toLowerCase().replace(/[:-]/g, ":");
  }

  /**
   * 1. Log-Distance Path Loss Formula
   * distanceInMeters = 10 ** ((txPower - rssi) / (10 * n))
   *
   * @param {number} rssi - Measured signal strength in dBm
   * @param {number} txPower - Calibrated RSSI at 1 meter (default -41.0 dBm)
   * @param {number} pathLossExponent - Environmental path loss factor (default 2.4)
   * @returns {number} distance in meters
   */
  rssiToDistance(rssi, txPower = null, pathLossExponent = null) {
    const p0 = txPower !== null && txPower !== undefined ? Number(txPower) : this.defaultTxPower;
    const n =
      pathLossExponent !== null && pathLossExponent !== undefined
        ? Number(pathLossExponent)
        : this.defaultPathLossExponent;
    return PositioningCore.rssiToDistance(rssi, p0, n);
  }

  /**
   * Convert meters to map canvas pixels
   */
  distanceToPixels(distanceInMeters) {
    return distanceInMeters * this.metersToPixelsRatio;
  }

  /**
   * Convert pixels to physical meters
   */
  pixelsToMeters(distanceInPixels) {
    return distanceInPixels * this.pixelsToMetersRatio;
  }

  /**
   * 2. Robust 2D Trilateration Algorithm
   * Computes intersecting point (pixelX, pixelY) from Access Point measurements.
   * If >= 3 APs: uses Weighted Least Squares (WLS) where weight = 1 / distance,
   * followed by Gauss-Newton non-linear refinement for sub-meter convergence.
   *
   * @param {Array<{apId: string, bssid: string, x: number, y: number, distanceInMeters: number, distanceInPixels: number, weight?: number}>} aps
   */
  trilaterate(aps) {
    if (!Array.isArray(aps) || aps.length === 0) {
      return { success: false, reason: "no_ap_signals", apCount: 0 };
    }

    // Single AP: Proximity estimate
    if (aps.length === 1) {
      const p = aps[0];
      return {
        success: true,
        pixelX: p.x,
        pixelY: p.y,
        accuracyRadiusMeters: Number(p.distanceInMeters.toFixed(1)),
        method: "single_ap_proximity",
        apCount: 1,
      };
    }

    // Two APs: Weighted centroid along the baseline
    if (aps.length === 2) {
      const [p1, p2] = aps;
      const w1 = 1 / Math.max(0.5, p1.distanceInMeters);
      const w2 = 1 / Math.max(0.5, p2.distanceInMeters);
      const sumW = w1 + w2;

      const x = (p1.x * w1 + p2.x * w2) / sumW;
      const y = (p1.y * w1 + p2.y * w2) / sumW;
      const baselineMeters =
        Math.hypot(p2.x - p1.x, p2.y - p1.y) * this.pixelsToMetersRatio;
      const accuracy = Math.max(
        p1.distanceInMeters,
        p2.distanceInMeters,
        baselineMeters * 0.5,
      );

      return {
        success: true,
        pixelX: Math.round(x),
        pixelY: Math.round(y),
        accuracyRadiusMeters: Number(accuracy.toFixed(1)),
        method: "barycenter_2ap",
        apCount: 2,
      };
    }

    // 3+ APs: Weighted Least Squares (WLS)
    // Weight inversely proportional to distance: weight = 1 / distance
    const apList = aps.map((ap) => ({
      x: ap.x,
      y: ap.y,
      d: ap.distanceInPixels,
      dMeters: ap.distanceInMeters,
      weight:
        ap.weight !== null && ap.weight !== undefined
          ? ap.weight
          : 1.0 / Math.max(0.5, ap.distanceInMeters),
    }));

    // Choose reference AP as the one with smallest distance (strongest signal)
    let refIdx = 0;
    let minD = apList[0].d;
    for (let i = 1; i < apList.length; i++) {
      if (apList[i].d < minD) {
        minD = apList[i].d;
        refIdx = i;
      }
    }
    const ref = apList[refIdx];

    // Linear system: A * [x, y]^T = b
    // 2*(x_i - x_ref)*x + 2*(y_i - y_ref)*y = (x_i^2 - x_ref^2) + (y_i^2 - y_ref^2) + (d_ref^2 - d_i^2)
    let m11 = 0,
      m12 = 0,
      m22 = 0;
    let v1 = 0,
      v2 = 0;

    for (let i = 0; i < apList.length; i++) {
      if (i === refIdx) continue;
      const p = apList[i];
      const a1 = 2 * (p.x - ref.x);
      const a2 = 2 * (p.y - ref.y);
      const b =
        p.x * p.x -
        ref.x * ref.x +
        (p.y * p.y - ref.y * ref.y) +
        (ref.d * ref.d - p.d * p.d);
      const w = Math.sqrt(p.weight * ref.weight);

      m11 += a1 * a1 * w;
      m12 += a1 * a2 * w;
      m22 += a2 * a2 * w;
      v1 += a1 * b * w;
      v2 += a2 * b * w;
    }

    const det = m11 * m22 - m12 * m12;
    let estX = 0;
    let estY = 0;

    if (Math.abs(det) > 1e-6) {
      estX = (m22 * v1 - m12 * v2) / det;
      estY = (m11 * v2 - m12 * v1) / det;
    } else {
      // Degenerate/collinear case: fallback to weighted centroid
      let sumW = 0,
        sumX = 0,
        sumY = 0;
      for (const p of apList) {
        sumW += p.weight;
        sumX += p.x * p.weight;
        sumY += p.y * p.weight;
      }
      estX = sumX / sumW;
      estY = sumY / sumW;
    }

    // Clamp initial estimate to canvas boundaries
    estX = Math.min(this.canvasWidth - 15, Math.max(15, estX));
    estY = Math.min(this.canvasHeight - 15, Math.max(15, estY));

    // Non-linear Gauss-Newton optimization (3-5 iterations) for high precision
    let curX = estX;
    let curY = estY;

    for (let iter = 0; iter < 4; iter++) {
      let j11 = 0,
        j12 = 0,
        j22 = 0;
      let r1 = 0,
        r2 = 0;

      for (const p of apList) {
        const dx = curX - p.x;
        const dy = curY - p.y;
        const dist = Math.max(1.0, Math.hypot(dx, dy));
        const residual = dist - p.d;

        const u1 = dx / dist;
        const u2 = dy / dist;
        const w = p.weight;

        j11 += u1 * u1 * w;
        j12 += u1 * u2 * w;
        j22 += u2 * u2 * w;

        r1 += u1 * residual * w;
        r2 += u2 * residual * w;
      }

      // Levenberg-Marquardt damping factor
      j11 += 0.05;
      j22 += 0.05;

      const jDet = j11 * j22 - j12 * j12;
      if (Math.abs(jDet) < 1e-6) break;

      const dxStep = -(j22 * r1 - j12 * r2) / jDet;
      const dyStep = -(j11 * r2 - j12 * r1) / jDet;

      curX += dxStep;
      curY += dyStep;

      if (Math.hypot(dxStep, dyStep) < 0.8) break;
    }

    // Final boundary clamp
    curX = Math.min(this.canvasWidth - 15, Math.max(15, curX));
    curY = Math.min(this.canvasHeight - 15, Math.max(15, curY));

    // Calculate Root Mean Square Error (RMSE) in meters
    let sumSqErr = 0;
    for (const p of apList) {
      const calcDistMeters =
        Math.hypot(curX - p.x, curY - p.y) * this.pixelsToMetersRatio;
      const diff = calcDistMeters - p.dMeters;
      sumSqErr += diff * diff;
    }
    const rmseMeters = Math.sqrt(sumSqErr / apList.length);
    const accuracyRadiusMeters = Number(
      Math.max(1.5, Math.min(25.0, rmseMeters * 1.2)).toFixed(1),
    );

    return {
      success: true,
      pixelX: Math.round(curX),
      pixelY: Math.round(curY),
      accuracyRadiusMeters,
      method: `wls_trilateration_${apList.length}ap`,
      apCount: apList.length,
    };
  }

  /**
   * 3. Exponential Moving Average (EMA) & Velocity Clamping Filter
   * currentPos = alpha * newPos + (1 - alpha) * prevPos (alpha ~ 0.35)
   *
   * @param {string} mac - Normalized device MAC address
   * @param {number} rawX - Calculated raw pixel X
   * @param {number} rawY - Calculated raw pixel Y
   * @param {number} accuracyRadiusMeters - Accuracy radius
   * @param {number} timestamp - Current timestamp in ms
   */
  applyFilter(mac, rawX, rawY, accuracyRadiusMeters, timestamp = Date.now()) {
    const normMac = this.normalizeMac(mac);
    let state = this.filterState.get(normMac);

    if (!state) {
      // First observation
      state = {
        mac: normMac,
        pixelX: rawX,
        pixelY: rawY,
        pctX: Number(((rawX / this.canvasWidth) * 100).toFixed(2)),
        pctY: Number(((rawY / this.canvasHeight) * 100).toFixed(2)),
        accuracyRadiusMeters,
        lastTime: timestamp,
        firstTime: timestamp,
        sampleCount: 1,
      };
      this.filterState.set(normMac, state);
      return state;
    }

    const dt = Math.max(0.1, (timestamp - state.lastTime) / 1000);
    state.lastTime = timestamp;
    state.sampleCount++;

    // Velocity check in meters per second
    const jumpPixels = Math.hypot(rawX - state.pixelX, rawY - state.pixelY);
    const jumpMeters = jumpPixels * this.pixelsToMetersRatio;
    const speedMps = jumpMeters / dt;

    // Adaptive alpha tuning
    let effAlpha = this.alpha; // default 0.35
    if (speedMps > 4.5) {
      // Suppress teleportation glitch caused by multipath interference
      effAlpha = 0.15;
    } else if (speedMps < 0.4) {
      // High smoothing when user is sitting or stationary
      effAlpha = 0.25;
    }

    // EMA formula: currentPos = alpha * newPos + (1 - alpha) * prevPos
    state.pixelX = effAlpha * rawX + (1.0 - effAlpha) * state.pixelX;
    state.pixelY = effAlpha * rawY + (1.0 - effAlpha) * state.pixelY;

    state.pctX = Number(((state.pixelX / this.canvasWidth) * 100).toFixed(2));
    state.pctY = Number(((state.pixelY / this.canvasHeight) * 100).toFixed(2));

    // Smooth accuracy
    state.accuracyRadiusMeters = Number(
      (state.accuracyRadiusMeters * 0.7 + accuracyRadiusMeters * 0.3).toFixed(
        1,
      ),
    );

    return state;
  }

  /**
   * 4. Full Pipeline: Resolve client position from raw MikroTik signal readings
   *
   * @param {string} mac - Client device MAC address
   * @param {Array<{bssid?: string, apId?: string, rssi: number|string}>} rawReadings
   * @param {number} timestamp - Observation timestamp
   */
  calculatePosition(mac, rawReadings, timestamp = Date.now()) {
    const normMac = this.normalizeMac(mac);
    if (!normMac || !Array.isArray(rawReadings) || rawReadings.length === 0) {
      return null;
    }

    // Map raw readings to known Access Points
    const mappedAps = [];

    for (const r of rawReadings) {
      this.logPacket(r); // Log to cache

      const bssid = this.normalizeMac(r.bssid || r["ap-bssid"]);
      const apId = String(r.apId || r.ap || r["ap-id"] || "").toUpperCase();

      let ap = this.apMap.get(bssid);
      if (!ap && apId) {
        ap = this.apMap.get(apId);
      }

      if (!ap) continue;

      // Extract RSSI integer
      const rssiStr = String(
        r.rssi !== null && r.rssi !== undefined ? r.rssi : r["signal-strength"] || "-90",
      );
      const match = rssiStr.match(/(-?\d+)/);
      if (!match) continue;
      const rssi = parseInt(match[1], 10);

      // RSSI Validation: Ignore extreme outliers
      if (isNaN(rssi) || rssi < -105 || rssi > -15) continue;

      // Extract SNR if available (Mikrotik sometimes provides signal-to-noise)
      let snr = null;
      if (r["signal-to-noise"]) {
        snr = parseInt(r["signal-to-noise"], 10);
      } else if (r.snr) {
        snr = parseInt(r.snr, 10);
      }

      // Update AP statistics
      this.updateApStats(ap.id, normMac, rssi, snr);

      const distanceInMeters = this.rssiToDistance(
        rssi,
        ap.txPower,
        ap.pathLossExponent,
      );
      const distanceInPixels = this.distanceToPixels(distanceInMeters);

      mappedAps.push({
        apId: ap.id,
        bssid: ap.bssid,
        name: ap.name,
        x: ap.pixelX,
        y: ap.pixelY,
        rssi,
        distanceInMeters,
        distanceInPixels,
        weight: 1.0 / Math.max(0.5, distanceInMeters),
      });
    }

    if (mappedAps.length === 0) {
      return null;
    }

    // Sort by signal strength (strongest first) and take top 6 to prune distant noisy multipath
    mappedAps.sort((a, b) => b.rssi - a.rssi);
    const activeAps = mappedAps.slice(0, 6);

    // Run 2D trilateration
    const triResult = this.trilaterate(activeAps);
    if (!triResult.success) {
      return null;
    }

    // Run EMA jitter smoothing filter
    const smoothed = this.applyFilter(
      normMac,
      triResult.pixelX,
      triResult.pixelY,
      triResult.accuracyRadiusMeters,
      timestamp,
    );

    return {
      mac: normMac,
      pixelX: Math.round(smoothed.pixelX),
      pixelY: Math.round(smoothed.pixelY),
      pctX: smoothed.pctX,
      pctY: smoothed.pctY,
      accuracyRadiusMeters: smoothed.accuracyRadiusMeters,
      apCount: activeAps.length,
      method: triResult.method,
      timestamp,
      isConnectionLost: this.isConnectionLost(),
      activeAps: activeAps.map((a) => {
        const stats = this.apStats.get(a.apId);
        return {
          id: a.apId,
          rssi: a.rssi,
          distanceMeters: Number(a.distanceInMeters.toFixed(1)),
          load: stats ? stats.load : 0,
          snr: stats && stats.snrSamples.length > 0 ? stats.snrSamples[stats.snrSamples.length - 1] : null
        };
      }),
    };
  }

  /**
   * Return overall system statistics and connection status
   */
  getSystemStats() {
    const aps = [];
    for (const [id, stats] of this.apStats.entries()) {
      aps.push({
        id,
        load: stats.load,
        avgRssi: stats.rssiSamples.length > 0 ? (stats.rssiSamples.reduce((a, b) => a + b, 0) / stats.rssiSamples.length).toFixed(1) : null,
        avgSnr: stats.snrSamples.length > 0 ? (stats.snrSamples.reduce((a, b) => a + b, 0) / stats.snrSamples.length).toFixed(1) : null
      });
    }

    return {
      isConnectionLost: this.isConnectionLost(),
      lastUpdate: this.lastSuccessfulUpdate,
      activeDevices: this.filterState.size,
      packetCacheCount: this.packetCache.length,
      apStats: aps
    };
  }

  /**
   * Retrieve cached position for a given MAC
   */
  getPosition(mac) {
    const normMac = this.normalizeMac(mac);
    const state = this.filterState.get(normMac);
    if (!state) return null;

    return {
      mac: state.mac,
      pixelX: Math.round(state.pixelX),
      pixelY: Math.round(state.pixelY),
      pctX: state.pctX,
      pctY: state.pctY,
      accuracyRadiusMeters: state.accuracyRadiusMeters,
      timestamp: state.lastTime,
      sampleCount: state.sampleCount,
    };
  }

  /**
   * Return all known Access Points
   */
  getAccessPoints() {
    const unique = new Map();
    for (const ap of this.apMap.values()) {
      unique.set(ap.id, ap);
    }
    return Array.from(unique.values());
  }
}

// Export class & default singleton instance
const positioningEngine = new PositioningEngine();

export { PositioningEngine, positioningEngine };
export default positioningEngine;
