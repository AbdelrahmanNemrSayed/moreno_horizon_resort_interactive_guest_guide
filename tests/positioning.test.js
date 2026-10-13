/**
 * Unit Tests for Universal Positioning Core
 */

import { test, expect } from "vitest";
import PositioningCore from "../shared/positioning-core.js";

test("PositioningCore - RSSI and distance inverse relationship", () => {
  const testDist = 10.0; // 10 meters
  const rssi = PositioningCore.distanceToRssi(testDist, -48.0, 2.75);
  const calculatedDist = PositioningCore.rssiToDistance(rssi, -48.0, 2.75);

  expect(Math.abs(calculatedDist - testDist)).toBeLessThan(0.05);
});

test("PositioningCore - Coordinates to Percentage conversion", () => {
  const p = PositioningCore.pixelsToPercent(448, 600, 896, 1200);
  expect(p.pctX).toBe(50.0);
  expect(p.pctY).toBe(50.0);

  const back = PositioningCore.percentToPixels(50.0, 50.0, 896, 1200);
  expect(back.x).toBe(448);
  expect(back.y).toBe(600);
});

test("PositioningCore - 2D Trilateration solving", () => {
  // Known true point: (300, 400)
  const trueX = 300;
  const trueY = 400;

  const anchors = [
    { x: 100, y: 100 },
    { x: 500, y: 150 },
    { x: 320, y: 700 },
    { x: 150, y: 600 },
  ];

  const points = anchors.map((a) => ({
    x: a.x,
    y: a.y,
    distancePx: Math.hypot(trueX - a.x, trueY - a.y),
  }));

  const solution = PositioningCore.solveTrilateration(points);
  expect(solution).not.toBeNull();
  expect(Math.abs(solution.x - trueX)).toBeLessThan(1.0);
  expect(Math.abs(solution.y - trueY)).toBeLessThan(1.0);
});

test("PositioningCore - EMA smoothing filter", () => {
  const prev = { x: 100, y: 100 };
  const next = { x: 200, y: 200 };
  const smoothed = PositioningCore.applyEma(prev, next, 0.5);

  expect(smoothed.x).toBe(150.0);
  expect(smoothed.y).toBe(150.0);
});

test("PositioningCore - rssiToDistance clamps to bounds", () => {
  // Very strong signal (close to AP)
  const closeDist = PositioningCore.rssiToDistance(-30, -48.0, 2.75);
  expect(closeDist).toBeGreaterThanOrEqual(
    PositioningCore.DEFAULT_MIN_DISTANCE_M,
  );
  expect(closeDist).toBeLessThan(1.0);

  // Very weak signal (far from AP)
  const farDist = PositioningCore.rssiToDistance(-100, -48.0, 2.75);
  expect(farDist).toBeLessThanOrEqual(PositioningCore.DEFAULT_MAX_DISTANCE_M);
});

test("PositioningCore - distanceToRssi inverse of rssiToDistance", () => {
  const distances = [1, 5, 10, 20, 50];
  for (const d of distances) {
    const rssi = PositioningCore.distanceToRssi(d, -48.0, 2.75);
    const back = PositioningCore.rssiToDistance(rssi, -48.0, 2.75);
    expect(Math.abs(back - d)).toBeLessThan(0.1);
  }
});

test("PositioningCore - solveTrilateration returns null for < 3 points", () => {
  const points = [
    { x: 100, y: 100, distancePx: 50 },
    { x: 200, y: 200, distancePx: 50 },
  ];
  expect(PositioningCore.solveTrilateration(points)).toBeNull();
});

test("PositioningCore - computeRssiVectorDistance handles unmatched APs", () => {
  const a = { "AP-1": -50, "AP-2": -60 };
  const b = { "AP-1": -55, "AP-3": -70 };
  const result = PositioningCore.computeRssiVectorDistance(a, b);
  expect(result.distance).toBeGreaterThan(0);
  expect(result.matchedAps).toBe(1);
  expect(result.totalAps).toBe(3);
});

test("PositioningCore - pixelsToMeters and metersToPixels inverse", () => {
  const meters = 10;
  const px = PositioningCore.metersToPixels(meters);
  const back = PositioningCore.pixelsToMeters(px);
  expect(Math.abs(back - meters)).toBeLessThan(0.01);
});
