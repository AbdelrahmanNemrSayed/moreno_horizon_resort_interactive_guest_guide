/**
 * Unit Tests for Unified Positioning Service
 */

import { test, expect } from "vitest";
import { UnifiedPositioningService } from "../src/services/positioning.js";

test("UnifiedPositioningService - Initialization and AP map loading", () => {
  const service = new UnifiedPositioningService();
  expect(service.apMap.size).toBeGreaterThanOrEqual(10);
  expect(service.canvasWidth).toBe(896);
  expect(service.canvasHeight).toBe(1200);
});

test("UnifiedPositioningService - Normalizes MAC address formats", () => {
  const service = new UnifiedPositioningService();
  expect(service.normalizeMac("aa:bb:cc:dd:ee:ff")).toBe("AABBCCDDEEFF");
  expect(service.normalizeMac("AA-BB-CC-DD-EE-FF")).toBe("AABBCCDDEEFF");
});

test("UnifiedPositioningService - Solves location from 3 Access Points", () => {
  const service = new UnifiedPositioningService();
  const readings = {
    "AP-LOBBY-01": -55,
    "AP-SIRENA-01": -62,
    "AP-WING-A": -58,
  };

  const loc = service.locateClient("11:22:33:44:55:66", readings);
  expect(loc).not.toBeNull();
  expect(loc.pixelX).toBeGreaterThanOrEqual(0);
  expect(loc.pixelX).toBeLessThanOrEqual(896);
  expect(loc.pixelY).toBeGreaterThanOrEqual(0);
  expect(loc.pixelY).toBeLessThanOrEqual(1200);
  expect(loc.pctX).toBeGreaterThanOrEqual(0);
  expect(loc.pctX).toBeLessThanOrEqual(100);
  expect(loc.anchorsCount).toBe(3);
});

test("UnifiedPositioningService - Caching repeated measurements", () => {
  const service = new UnifiedPositioningService();
  const readings = {
    "AP-LOBBY-01": -50,
    "AP-SIRENA-01": -52,
    "AP-WING-A": -54,
  };

  const loc1 = service.locateClient("AA:BB:CC:DD:EE:11", readings);
  const loc2 = service.locateClient("AA:BB:CC:DD:EE:11", readings);

  expect(loc1).toBe(loc2); // Exact cached reference
});
