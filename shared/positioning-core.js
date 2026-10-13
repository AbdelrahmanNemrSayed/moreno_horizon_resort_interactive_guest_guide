/**
 * Moreno Horizon Spa & Resort - Universal Positioning Core
 * Shared mathematical foundation for WiFi indoor trilateration, signal modeling, and spatial conversions.
 * Works seamlessly in both Node.js (CommonJS) and browser runtime environments.
 */

const root = typeof globalThis !== "undefined" ? globalThis : this;
const factory = function () {
  "use strict";

  const CANVAS_WIDTH = 896;
  const CANVAS_HEIGHT = 1200;
  const PIXELS_PER_METER = 2.381;
  const METERS_PER_PIXEL = 0.42;

  const DEFAULT_REF_RSSI_1M = -48.0;
  const DEFAULT_PATH_LOSS_N = 2.75;
  const DEFAULT_MIN_DISTANCE_M = 0.5;
  const DEFAULT_MAX_DISTANCE_M = 120.0;

  /**
   * Convert measured signal strength (dBm) to estimated distance in meters
   */
  function rssiToDistance(
    rssi,
    refRssi1m = DEFAULT_REF_RSSI_1M,
    pathLossN = DEFAULT_PATH_LOSS_N,
  ) {
    if (typeof rssi !== "number" || isNaN(rssi)) return DEFAULT_MAX_DISTANCE_M;
    const exponent = (refRssi1m - rssi) / (10.0 * pathLossN);
    const dist = Math.pow(10.0, exponent);
    return Math.max(
      DEFAULT_MIN_DISTANCE_M,
      Math.min(DEFAULT_MAX_DISTANCE_M, dist),
    );
  }

  /**
   * Convert distance in meters to theoretical signal strength in dBm
   */
  function distanceToRssi(
    distMeters,
    refRssi1m = DEFAULT_REF_RSSI_1M,
    pathLossN = DEFAULT_PATH_LOSS_N,
  ) {
    const d = Math.max(
      DEFAULT_MIN_DISTANCE_M,
      distMeters || DEFAULT_MIN_DISTANCE_M,
    );
    return refRssi1m - 10.0 * pathLossN * Math.log10(d);
  }

  /**
   * Spatial transformations between pixels and percentages
   */
  function pixelsToPercent(x, y, w = CANVAS_WIDTH, h = CANVAS_HEIGHT) {
    return {
      pctX: Number(((x / w) * 100).toFixed(2)),
      pctY: Number(((y / h) * 100).toFixed(2)),
    };
  }

  function percentToPixels(pctX, pctY, w = CANVAS_WIDTH, h = CANVAS_HEIGHT) {
    return {
      x: Math.round((pctX / 100) * w),
      y: Math.round((pctY / 100) * h),
    };
  }

  function pixelsToMeters(px) {
    return (px || 0) * METERS_PER_PIXEL;
  }

  function metersToPixels(meters) {
    return (meters || 0) * PIXELS_PER_METER;
  }

  /**
   * Weighted Least Squares (WLS) 2D Trilateration
   * Solves: (x - xi)^2 + (y - yi)^2 = di^2 for N >= 3 points
   * @param {Array<{x: number, y: number, distancePx: number, weight?: number}>} points
   * @returns {{x: number, y: number, residual: number}|null}
   */
  function solveTrilateration(points) {
    if (!points || points.length < 3) return null;

    // Use first point as origin reference
    const p1 = points[0];
    const x1 = p1.x;
    const y1 = p1.y;
    const r1 = p1.distancePx;

    let AtA_00 = 0,
      AtA_01 = 0,
      AtA_10 = 0,
      AtA_11 = 0;
    let Atb_0 = 0,
      Atb_1 = 0;

    for (let i = 1; i < points.length; i++) {
      const pi = points[i];
      const xi = pi.x;
      const yi = pi.y;
      const ri = pi.distancePx;
      const w = pi.weight !== undefined ? pi.weight : 1.0 / Math.max(1.0, ri);

      const A_row_x = 2 * (xi - x1);
      const A_row_y = 2 * (yi - y1);
      const b_val =
        xi * xi - x1 * x1 + (yi * yi - y1 * y1) - (ri * ri - r1 * r1);

      // Normal equations: (A^T * W * A) * [x, y]^T = A^T * W * b
      AtA_00 += w * A_row_x * A_row_x;
      AtA_01 += w * A_row_x * A_row_y;
      AtA_10 += w * A_row_y * A_row_x;
      AtA_11 += w * A_row_y * A_row_y;

      Atb_0 += w * A_row_x * b_val;
      Atb_1 += w * A_row_y * b_val;
    }

    const det = AtA_00 * AtA_11 - AtA_01 * AtA_10;
    if (Math.abs(det) < 1e-9) return null;

    const estX = (AtA_11 * Atb_0 - AtA_01 * Atb_1) / det;
    const estY = (-AtA_10 * Atb_0 + AtA_00 * Atb_1) / det;

    // Clamping to map bounds
    const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, estX));
    const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, estY));

    // Calculate mean distance residual
    let residualSum = 0;
    for (const p of points) {
      const actualDist = Math.hypot(clampedX - p.x, clampedY - p.y);
      residualSum += Math.abs(actualDist - p.distancePx);
    }

    return {
      x: clampedX,
      y: clampedY,
      residualPx: residualSum / points.length,
      residualMeters: (residualSum / points.length) * METERS_PER_PIXEL,
    };
  }

  /**
   * Exponential Moving Average (EMA) position smoothing filter
   */
  function applyEma(prevPos, newPos, alpha = 0.35) {
    if (!prevPos) return { ...newPos };
    const a = Math.max(0.01, Math.min(1.0, alpha));
    const x = prevPos.x + a * (newPos.x - prevPos.x);
    const y = prevPos.y + a * (newPos.y - prevPos.y);
    const pcts = pixelsToPercent(x, y);

    return {
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      pctX: pcts.pctX,
      pctY: pcts.pctY,
    };
  }

  /**
   * Compute Euclidean RSSI vector distance for k-NN fingerprint matching
   */
  function computeRssiVectorDistance(
    readingsA,
    readingsB,
    penaltyUnmatched = 24.0,
  ) {
    const keysA = Object.keys(readingsA);
    const keysB = Object.keys(readingsB);
    const allAps = new Set([...keysA, ...keysB]);

    let sumSq = 0;
    let matchCount = 0;

    for (const apId of allAps) {
      const valA = readingsA[apId];
      const valB = readingsB[apId];

      if (valA !== undefined && valB !== undefined) {
        const diff = valA - valB;
        sumSq += diff * diff;
        matchCount++;
      } else {
        sumSq += penaltyUnmatched * penaltyUnmatched;
      }
    }

    return {
      distance: Math.sqrt(sumSq / Math.max(1, allAps.size)),
      matchedAps: matchCount,
      totalAps: allAps.size,
    };
  }

  return {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    PIXELS_PER_METER,
    METERS_PER_PIXEL,
    DEFAULT_REF_RSSI_1M,
    DEFAULT_PATH_LOSS_N,
    DEFAULT_MIN_DISTANCE_M,
    DEFAULT_MAX_DISTANCE_M,
    rssiToDistance,
    distanceToRssi,
    pixelsToPercent,
    percentToPixels,
    pixelsToMeters,
    metersToPixels,
    solveTrilateration,
    applyEma,
    computeRssiVectorDistance,
  };
};

const PositioningCore = factory();
if (typeof root !== "undefined") {
  root.PositioningCore = PositioningCore;
}
if (typeof globalThis !== "undefined") {
  globalThis.PositioningCore = PositioningCore;
}

export default PositioningCore;
export { PositioningCore };
