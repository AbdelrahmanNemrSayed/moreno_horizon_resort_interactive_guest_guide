/**
 * Unit Tests for Modular Data Architecture (src/data/*)
 */

import { test, expect } from "vitest";
import { resortPois } from "../src/data/pois.js";
import { dailyActivities, resortExcursions } from "../src/data/activities.js";
import { resortSpaTreatments, diningSchedules } from "../src/data/menu.js";
import {
  resortExtensions,
  localFaqKb,
  resortContactConfig,
} from "../src/data/compendium.js";

test("Data Modules - POIs catalog contains required landmarks", () => {
  expect(Array.isArray(resortPois)).toBe(true);
  expect(resortPois.length).toBeGreaterThanOrEqual(15);

  const lobby = resortPois.find((p) => p.id === "M");
  expect(lobby).toBeTruthy();
  expect(lobby.coords.x).toBeGreaterThan(0);
  expect(lobby.coords.y).toBeGreaterThan(0);

  const beach = resortPois.find((p) => p.id === "1");
  expect(beach).toBeTruthy();
  expect(beach.nameAr).toContain("الشاطئ");
});

test("Data Modules - Activities and Excursions structure", () => {
  expect(dailyActivities.length).toBeGreaterThanOrEqual(5);
  expect(resortExcursions.length).toBeGreaterThanOrEqual(3);

  for (const act of dailyActivities) {
    expect(act.time).toBeTruthy();
    expect(act.titleAr).toBeTruthy();
    expect(act.icon).toBeTruthy();
  }
});

test("Data Modules - Menus and Spa treatments", () => {
  expect(resortSpaTreatments.length).toBeGreaterThanOrEqual(4);
  expect(diningSchedules.length).toBeGreaterThanOrEqual(3);

  const hotStone = resortSpaTreatments.find((s) => s.id === "hot_stone");
  expect(hotStone).toBeTruthy();
  expect(hotStone.durations.length).toBeGreaterThanOrEqual(1);
});

test("Data Modules - Compendium contacts and FAQ KB", () => {
  expect(resortExtensions.length).toBeGreaterThanOrEqual(5);
  expect(localFaqKb.length).toBeGreaterThanOrEqual(5);
  expect(resortContactConfig.emergencyContacts.length).toBeGreaterThanOrEqual(
    4,
  );
});

test("Data Modules - Building wings and room lookup integrity", () => {
  const buildings = resortPois.filter((p) => p.isBuilding);
  expect(buildings.length).toBe(4);

  // Wing S (South Building - المبنى الجنوبي)
  const wingS = resortPois.find((p) => p.id === "S");
  expect(wingS).toBeDefined();
  expect(wingS.isBuilding).toBe(true);
  expect(wingS.coords.x).toBeCloseTo(54.13, 1);
  expect(wingS.coords.y).toBeCloseTo(51.25, 1);
  expect(wingS.nameAr).toContain("الجنوبي");

  // Wing N (North Building - المبنى الشمالي)
  const wingN = resortPois.find((p) => p.id === "N");
  expect(wingN).toBeDefined();
  expect(wingN.isBuilding).toBe(true);
  expect(wingN.coords.x).toBeCloseTo(27.9, 1);
  expect(wingN.coords.y).toBeCloseTo(51.25, 1);
  expect(wingN.nameAr).toContain("الشمالي");

  // Wing M (Main Building / Lobby)
  const wingM = resortPois.find((p) => p.id === "M");
  expect(wingM).toBeDefined();
  expect(wingM.isBuilding).toBe(true);
  expect(wingM.coords.x).toBeCloseTo(37.95, 1);
  expect(wingM.coords.y).toBeCloseTo(69.58, 1);

  // Wing MLS (Commercial Complex)
  const wingMls = resortPois.find((p) => p.id === "MLS");
  expect(wingMls).toBeDefined();
  expect(wingMls.isBuilding).toBe(true);
  expect(wingMls.coords.x).toBeCloseTo(17.86, 1);
  expect(wingMls.coords.y).toBeCloseTo(77.33, 1);

  // Helper function to resolve room to building
  function resolveRoom(roomNum) {
    for (const b of buildings) {
      for (const r of b.rooms) {
        const isMatch = r.exact
          ? r.exact.includes(roomNum)
          : roomNum >= r.min && roomNum <= r.max;
        if (isMatch) return { building: b.id, floor: r.floor };
      }
    }
    return null;
  }

  // Verify room matching
  expect(resolveRoom(2015)?.building).toBe("S");
  expect(resolveRoom(2210)?.building).toBe("S");
  expect(resolveRoom(1520)?.building).toBe("N");
  expect(resolveRoom(1830)?.building).toBe("N");
  expect(resolveRoom(1012)?.building).toBe("M");
  expect(resolveRoom(1150)?.building).toBe("M");
  expect(resolveRoom(2620)?.building).toBe("MLS");
  expect(resolveRoom(2815)?.building).toBe("MLS");
});

