/**
 * Moreno Horizon Spa & Resort - WiFi Indoor Positioning Service
 * Based on MikroTik RouterOS RSSI data (/interface/wireless/registration-table)
 * 
 * Features:
 * 1. Log-Distance Path Loss Model (RSSI -> distance in meters & canvas pixels)
 * 2. Weighted Linear Least Squares + Gauss-Newton 2D Trilateration (N >= 3 APs)
 * 3. Adaptive Exponential Smoothing (EMA) + Velocity Limiter (Jitter-free tracking)
 * 4. MikroTik Registration-Table Batch Ingestion & Device State Store
 */

const fs = require('fs');
const path = require('path');

// Default AP configuration path
const CONFIG_PATH = path.resolve(__dirname, '../config/accessPoints.json');

class IndoorLocationService {
  constructor(configPath = CONFIG_PATH) {
    this.configPath = configPath;
    this.loadConfig();

    // In-memory tracked devices cache: MAC -> DeviceState
    this.deviceStates = new Map();

    // Event listeners for real-time SSE / WebSocket streaming
    this.subscribers = new Set();

    // Periodically clean up devices inactive for > 15 minutes
    this.cleanupInterval = setInterval(() => this.pruneInactiveDevices(), 60000);
  }

  /**
   * Load or reload Access Points from JSON configuration
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(raw);
      } else {
        console.warn(`[IndoorLocation] Config not found at ${this.configPath}, using defaults.`);
        this.config = {
          mapWidth: 896,
          mapHeight: 1200,
          pixelsPerMeter: 2.381,
          metersPerPixel: 0.42,
          defaultModel: {
            refRssi1m: -48.0,
            pathLossN: 2.75,
            minDistanceMeters: 0.5,
            maxDistanceMeters: 120.0
          },
          accessPoints: []
        };
      }

      this.mapWidth = this.config.mapWidth || 896;
      this.mapHeight = this.config.mapHeight || 1200;
      this.pixelsPerMeter = this.config.pixelsPerMeter || 2.381;
      this.metersPerPixel = this.config.metersPerPixel || 0.42;

      // Index APs by normalized BSSID and ID
      this.apByBssid = new Map();
      this.apById = new Map();

      for (const ap of (this.config.accessPoints || [])) {
        if (!ap.enabled) continue;
        const normBssid = this.normalizeMac(ap.bssid);
        this.apByBssid.set(normBssid, ap);
        this.apById.set(ap.id.toUpperCase(), ap);
      }

      console.log(`[IndoorLocation] Loaded ${this.apByBssid.size} active Access Points for resort map.`);
    } catch (err) {
      console.error('[IndoorLocation] Failed to load AP configuration:', err);
    }
  }

  normalizeMac(mac) {
    if (!mac) return '';
    return String(mac).trim().toLowerCase().replace(/[:-]/g, ':');
  }

  /**
   * 1. Log-Distance Path Loss Model
   * RSSI = A - 10 * n * log10(d)
   * => d = 10 ^ ((A - RSSI) / (10 * n))
   * 
   * @param {number} rssi - Signal strength in dBm (e.g. -65)
   * @param {number} refRssi1m - Reference RSSI at 1 meter (A, e.g. -48 dBm)
   * @param {number} pathLossN - Path loss exponent (n, e.g. 2.75)
   * @returns {number} distance in meters
   */
  rssiToDistance(rssi, refRssi1m = null, pathLossN = null) {
    const A = refRssi1m != null ? refRssi1m : (this.config.defaultModel.refRssi1m || -48.0);
    const n = pathLossN != null ? pathLossN : (this.config.defaultModel.pathLossN || 2.75);
    const minD = this.config.defaultModel.minDistanceMeters || 0.5;
    const maxD = this.config.defaultModel.maxDistanceMeters || 120.0;

    // Safety checks for abnormal signal readings
    const cleanRssi = Math.min(-15, Math.max(-110, Number(rssi)));

    // Power calculation
    const exponent = (A - cleanRssi) / (10.0 * n);
    const distMeters = Math.pow(10.0, exponent);

    return Math.min(maxD, Math.max(minD, distMeters));
  }

  /**
   * Inverse path loss (useful for synthetic testing and validation)
   */
  distanceToRssi(distMeters, refRssi1m = null, pathLossN = null) {
    const A = refRssi1m != null ? refRssi1m : (this.config.defaultModel.refRssi1m || -48.0);
    const n = pathLossN != null ? pathLossN : (this.config.defaultModel.pathLossN || 2.75);
    const d = Math.max(0.2, Number(distMeters));
    return A - 10.0 * n * Math.log10(d);
  }

  /**
   * 2. Robust 2D Trilateration
   * Calculates (x, y) coordinates on the 896x1200 resort map from 3+ Access Points.
   * Uses Weighted Linear Least Squares followed by Gauss-Newton optimization.
   * 
   * @param {Array<{x: number, y: number, distanceMeters: number, weight?: number, id?: string}>} points
   * @returns {{x: number, y: number, pctX: number, pctY: number, accuracyMeters: number, method: string}}
   */
  trilaterate(points) {
    if (!Array.isArray(points) || points.length === 0) {
      return null;
    }

    // 1 AP: Return AP coordinate with its measured distance as uncertainty radius
    if (points.length === 1) {
      const p = points[0];
      return {
        x: p.x,
        y: p.y,
        pctX: Number(((p.x / this.mapWidth) * 100).toFixed(2)),
        pctY: Number(((p.y / this.mapHeight) * 100).toFixed(2)),
        accuracyMeters: Number(p.distanceMeters.toFixed(1)),
        method: 'single_ap_proximity'
      };
    }

    // 2 APs: Weighted midpoint along the baseline between the two APs
    if (points.length === 2) {
      const [p1, p2] = points;
      const d1 = p1.distanceMeters;
      const d2 = p2.distanceMeters;
      const w1 = 1 / Math.max(0.5, d1);
      const w2 = 1 / Math.max(0.5, d2);
      const sumW = w1 + w2;

      const x = (p1.x * w1 + p2.x * w2) / sumW;
      const y = (p1.y * w1 + p2.y * w2) / sumW;
      const baseline = Math.hypot(p2.x - p1.x, p2.y - p1.y) * this.metersPerPixel;
      const accuracy = Math.max(d1, d2, baseline * 0.5);

      return {
        x: Math.round(x),
        y: Math.round(y),
        pctX: Number(((x / this.mapWidth) * 100).toFixed(2)),
        pctY: Number(((y / this.mapHeight) * 100).toFixed(2)),
        accuracyMeters: Number(accuracy.toFixed(1)),
        method: 'weighted_barycenter_2ap'
      };
    }

    // 3+ APs: Full Trilateration
    // Convert distance from meters to canvas pixels: dPx = dMeters * pixelsPerMeter
    const ppm = this.pixelsPerMeter;
    const apList = points.map(pt => ({
      x: pt.x,
      y: pt.y,
      d: pt.distanceMeters * ppm,
      dMeters: pt.distanceMeters,
      weight: pt.weight || (1.0 / Math.max(1.0, Math.pow(pt.distanceMeters, 2)))
    }));

    // Step A: Linearized Weighted Least Squares (Reference AP is chosen as the strongest signal = smallest d)
    // Find AP with smallest distance as reference
    let refIdx = 0;
    let minD = apList[0].d;
    for (let i = 1; i < apList.length; i++) {
      if (apList[i].d < minD) {
        minD = apList[i].d;
        refIdx = i;
      }
    }
    const refAP = apList[refIdx];

    // Form linear system: A * [x, y]^T = b
    // 2*(x_i - x_ref)*x + 2*(y_i - y_ref)*y = (x_i^2 - x_ref^2) + (y_i^2 - y_ref^2) + (d_ref^2 - d_i^2)
    const rows = [];
    for (let i = 0; i < apList.length; i++) {
      if (i === refIdx) continue;
      const p = apList[i];
      const a1 = 2 * (p.x - refAP.x);
      const a2 = 2 * (p.y - refAP.y);
      const b = (p.x * p.x - refAP.x * refAP.x) +
                (p.y * p.y - refAP.y * refAP.y) +
                (refAP.d * refAP.d - p.d * p.d);
      const w = Math.sqrt(p.weight * refAP.weight);
      rows.push({ a1, a2, b, w });
    }

    // Solve (A^T * W * A) * [x, y]^T = A^T * W * b
    let m11 = 0, m12 = 0, m22 = 0;
    let v1 = 0, v2 = 0;

    for (const r of rows) {
      const w = r.w;
      m11 += (r.a1 * r.a1) * w;
      m12 += (r.a1 * r.a2) * w;
      m22 += (r.a2 * r.a2) * w;
      v1 += (r.a1 * r.b) * w;
      v2 += (r.a2 * r.b) * w;
    }

    const det = m11 * m22 - m12 * m12;
    let initX = 0;
    let initY = 0;

    if (Math.abs(det) > 1e-6) {
      // Invert 2x2 matrix
      initX = (m22 * v1 - m12 * v2) / det;
      initY = (m11 * v2 - m12 * v1) / det;
    } else {
      // Fallback if APs are collinear: weighted centroid
      let sumW = 0, sumX = 0, sumY = 0;
      for (const p of apList) {
        sumW += p.weight;
        sumX += p.x * p.weight;
        sumY += p.y * p.weight;
      }
      initX = sumX / sumW;
      initY = sumY / sumW;
    }

    // Clamp initial estimate to map area with 20px padding
    initX = Math.min(this.mapWidth - 20, Math.max(20, initX));
    initY = Math.min(this.mapHeight - 20, Math.max(20, initY));

    // Step B: Non-linear Gauss-Newton Refinement (4 iterations)
    let curX = initX;
    let curY = initY;

    for (let iter = 0; iter < 4; iter++) {
      let j11 = 0, j12 = 0, j22 = 0;
      let res1 = 0, res2 = 0;

      for (const p of apList) {
        const dx = curX - p.x;
        const dy = curY - p.y;
        const calcDist = Math.max(1.0, Math.hypot(dx, dy));
        const residual = calcDist - p.d; // f_i = distance_estimate - measured_distance

        const u1 = dx / calcDist; // Jacobian wrt x
        const u2 = dy / calcDist; // Jacobian wrt y
        const w = p.weight;

        j11 += (u1 * u1) * w;
        j12 += (u1 * u2) * w;
        j22 += (u2 * u2) * w;

        res1 += (u1 * residual) * w;
        res2 += (u2 * residual) * w;
      }

      // Levenberg-Marquardt damping factor for stability
      const damping = 0.05;
      j11 += damping;
      j22 += damping;

      const jDet = j11 * j22 - j12 * j12;
      if (Math.abs(jDet) < 1e-6) break;

      const deltaX = -(j22 * res1 - j12 * res2) / jDet;
      const deltaY = -(j11 * res2 - j12 * res1) / jDet;

      curX += deltaX;
      curY += deltaY;

      if (Math.hypot(deltaX, deltaY) < 1.0) break; // converged
    }

    // Clamp final coordinates within resort bounds
    curX = Math.min(this.mapWidth - 15, Math.max(15, curX));
    curY = Math.min(this.mapHeight - 15, Math.max(15, curY));

    // Calculate Root Mean Square Error (RMSE) in meters as accuracy metric
    let sumSqErr = 0;
    for (const p of apList) {
      const dCalculated = Math.hypot(curX - p.x, curY - p.y) * this.metersPerPixel;
      const err = dCalculated - p.dMeters;
      sumSqErr += err * err;
    }
    const rmseMeters = Math.sqrt(sumSqErr / apList.length);
    const accuracyMeters = Number(Math.max(1.5, Math.min(25.0, rmseMeters * 1.25)).toFixed(1));

    return {
      x: Math.round(curX),
      y: Math.round(curY),
      pctX: Number(((curX / this.mapWidth) * 100).toFixed(2)),
      pctY: Number(((curY / this.mapHeight) * 100).toFixed(2)),
      accuracyMeters,
      method: `trilateration_${apList.length}ap`
    };
  }

  /**
   * 3. Temporal Jitter Smoothing Filter (EMA + Velocity Clamping)
   * Eliminates rapid jumps and multipath noise
   * 
   * @param {string} mac - Device MAC address
   * @param {{x: number, y: number, accuracyMeters: number}} rawPos - Raw position from trilateration
   * @param {number} timestamp - Millisecond timestamp
   */
  smoothDevicePosition(mac, rawPos, timestamp = Date.now()) {
    const normMac = this.normalizeMac(mac);
    let state = this.deviceStates.get(normMac);

    if (!state) {
      // First observation: initialize state
      state = {
        mac: normMac,
        smoothedX: rawPos.x,
        smoothedY: rawPos.y,
        smoothedPctX: Number(((rawPos.x / this.mapWidth) * 100).toFixed(2)),
        smoothedPctY: Number(((rawPos.y / this.mapHeight) * 100).toFixed(2)),
        rawX: rawPos.x,
        rawY: rawPos.y,
        accuracyMeters: rawPos.accuracyMeters,
        lastTimestamp: timestamp,
        firstSeen: timestamp,
        updateCount: 1,
        rssiPerAp: new Map()
      };
      this.deviceStates.set(normMac, state);
      return state;
    }

    const dt = Math.max(0.1, (timestamp - state.lastTimestamp) / 1000); // delta in seconds
    state.lastTimestamp = timestamp;
    state.updateCount++;

    // Distance jumped in meters
    const dxPx = rawPos.x - state.smoothedX;
    const dyPx = rawPos.y - state.smoothedY;
    const jumpDistanceMeters = Math.hypot(dxPx, dyPx) * this.metersPerPixel;
    const speedMps = jumpDistanceMeters / dt;

    // Adaptive smoothing factor alpha (0 < alpha <= 1)
    // Normal walking pace is 1.2 - 1.6 m/s. If velocity > 4.5 m/s, it's likely a multipath glitch.
    let alpha = 0.38; // Default balanced smoothing

    if (speedMps > 4.5) {
      // Outlier jump suppression: heavily damp sudden leaps
      alpha = 0.15;
    } else if (speedMps < 0.3) {
      // Stationary jitter suppression: very high smoothing when still
      alpha = 0.22;
    } else {
      // Normal motion: responsive tracking
      alpha = 0.50;
    }

    // Apply Exponential Moving Average
    state.smoothedX = state.smoothedX + alpha * (rawPos.x - state.smoothedX);
    state.smoothedY = state.smoothedY + alpha * (rawPos.y - state.smoothedY);

    state.smoothedPctX = Number(((state.smoothedX / this.mapWidth) * 100).toFixed(2));
    state.smoothedPctY = Number(((state.smoothedY / this.mapHeight) * 100).toFixed(2));
    state.rawX = rawPos.x;
    state.rawY = rawPos.y;

    // Smooth accuracy estimate
    state.accuracyMeters = Number((state.accuracyMeters * 0.7 + rawPos.accuracyMeters * 0.3).toFixed(1));

    return state;
  }

  /**
   * 4. Ingest MikroTik Registration Table Dump
   * Accepts JSON payload from MikroTik API / script
   * 
   * @param {Array<Object>} feedRows
   * Format example:
   * [
   *   {
   *     "mac-address": "A4:C3:F0:12:34:56",
   *     "signal-strength": "-58", // or "-58dBm@6Mbps"
   *     "ap-bssid": "48:8f:5a:01:a1:01", // or "ap-id": "AP-LOBBY-01"
   *     "interface": "wlan1"
   *   }
   * ]
   */
  processMikroTikFeed(feedRows) {
    if (!Array.isArray(feedRows)) {
      throw new Error('Expected feedRows to be an array');
    }

    const now = Date.now();
    const updatedDevices = new Map(); // MAC -> Array of AP measurements

    for (const row of feedRows) {
      const rawMac = row['mac-address'] || row.mac || row['mac_address'];
      if (!rawMac) continue;
      const mac = this.normalizeMac(rawMac);

      // Clean signal strength (strip dBm, rate suffixes)
      const rawSig = String(row['signal-strength'] || row.signal || row.rssi || '-90');
      const match = rawSig.match(/(-?\d+)/);
      if (!match) continue;
      const rssi = parseInt(match[1], 10);
      if (isNaN(rssi) || rssi < -110 || rssi > -10) continue;

      // Identify Access Point
      const rawBssid = this.normalizeMac(row['ap-bssid'] || row.bssid || row['ap_bssid']);
      const rawApId = String(row['ap-id'] || row.ap || row['ap_id'] || '').toUpperCase();

      let ap = this.apByBssid.get(rawBssid);
      if (!ap && rawApId) {
        ap = this.apById.get(rawApId);
      }

      if (!ap) continue; // Unknown AP, skip

      // Convert RSSI to distance
      const distanceMeters = this.rssiToDistance(rssi, ap.refRssi1m, ap.pathLossN);

      if (!updatedDevices.has(mac)) {
        updatedDevices.set(mac, []);
      }

      updatedDevices.get(mac).push({
        apId: ap.id,
        bssid: ap.bssid,
        name: ap.name,
        nameAr: ap.nameAr,
        x: ap.x,
        y: ap.y,
        pctX: ap.pctX,
        pctY: ap.pctY,
        rssi,
        distanceMeters
      });
    }

    const results = [];

    // Trilaterate and smooth each device in this batch
    for (const [mac, measurements] of updatedDevices.entries()) {
      // Sort APs by signal strength (strongest first)
      measurements.sort((a, b) => b.rssi - a.rssi);

      // Use up to top 6 APs for trilateration to avoid distant noise
      const activeAps = measurements.slice(0, 6);

      const rawPos = this.trilaterate(activeAps);
      if (!rawPos) continue;

      const smoothedState = this.smoothDevicePosition(mac, rawPos, now);
      smoothedState.activeAps = activeAps.map(a => ({
        id: a.apId,
        rssi: a.rssi,
        distM: Number(a.distanceMeters.toFixed(1))
      }));

      const out = {
        mac,
        x: Math.round(smoothedState.smoothedX),
        y: Math.round(smoothedState.smoothedY),
        pctX: smoothedState.smoothedPctX,
        pctY: smoothedState.smoothedPctY,
        accuracyMeters: smoothedState.accuracyMeters,
        apCount: activeAps.length,
        method: rawPos.method,
        lastSeen: now,
        activeAps: smoothedState.activeAps
      };

      results.push(out);

      // Notify real-time subscribers (SSE / WebSocket)
      this.broadcastLocationUpdate(out);
    }

    return results;
  }

  /**
   * Real-time Location Broadcast (SSE / WebSocket)
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  broadcastLocationUpdate(deviceLocation) {
    for (const cb of this.subscribers) {
      try {
        cb(deviceLocation);
      } catch (err) {
        console.error('[IndoorLocation] Subscriber error:', err);
      }
    }
  }

  /**
   * Query single device location by MAC
   */
  getDeviceLocation(mac) {
    const normMac = this.normalizeMac(mac);
    const state = this.deviceStates.get(normMac);
    if (!state) return null;

    return {
      mac: state.mac,
      x: Math.round(state.smoothedX),
      y: Math.round(state.smoothedY),
      pctX: state.smoothedPctX,
      pctY: state.smoothedPctY,
      accuracyMeters: state.accuracyMeters,
      rawX: state.rawX,
      rawY: state.rawY,
      lastSeen: state.lastTimestamp,
      firstSeen: state.firstSeen,
      updateCount: state.updateCount,
      activeAps: state.activeAps || []
    };
  }

  /**
   * Return all currently tracked devices
   */
  getAllDevices() {
    const list = [];
    for (const [mac] of this.deviceStates) {
      const loc = this.getDeviceLocation(mac);
      if (loc) list.push(loc);
    }
    return list;
  }

  /**
   * Return configured AP list
   */
  getAccessPoints() {
    return Array.from(this.apById.values());
  }

  /**
   * Prune inactive devices not heard from in 15 minutes
   */
  pruneInactiveDevices(ttlMs = 15 * 60 * 1000) {
    const now = Date.now();
    for (const [mac, state] of this.deviceStates.entries()) {
      if (now - state.lastTimestamp > ttlMs) {
        this.deviceStates.delete(mac);
      }
    }
  }
}

// Singleton instance
const indoorLocationService = new IndoorLocationService();

module.exports = {
  IndoorLocationService,
  indoorLocationService
};
