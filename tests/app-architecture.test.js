/**
 * Tests for Application Architecture, Dual Compatibility, and Bundle Integrity
 */

import { test, expect } from "vitest";
import App from "../js/app.js";
import AppModular from "../src/features/app-controller.js";
import {
  UIManager,
  ServiceHandler,
  AudioManager,
  ThemeManager,
  PWAManager,
  WeatherManager,
} from "../src/features/index.js";
import * as legacyData from "../js/data.js";
import * as modularData from "../src/data/compendium.js";

test("App Architecture - Unified App controller has all required APIs", () => {
  expect(App).toBeDefined();
  expect(typeof App.init).toBe("function");
  expect(typeof App.changeLanguage).toBe("function");
  expect(typeof App.playBeep).toBe("function");
  expect(typeof App.playChime).toBe("function");
  expect(typeof App.toggleSound).toBe("function");
  expect(typeof App.toggleTheme).toBe("function");
  expect(typeof App.showToast).toBe("function");
  expect(typeof App.openEmergencyDrawer).toBe("function");
  expect(typeof App.openVoiceNavigator).toBe("function");
  expect(typeof App.addToCart).toBe("function");
  expect(typeof App.removeFromCart).toBe("function");
  expect(typeof App.updateCartBadge).toBe("function");
  expect(typeof App.saveGuestRoom).toBe("function");
});

test("App Architecture - Modular Feature Managers instantiated correctly", () => {
  const ui = new UIManager();
  expect(typeof ui.openModal).toBe("function");
  expect(typeof ui.closeModal).toBe("function");
  expect(typeof ui.showToast).toBe("function");

  const srv = new ServiceHandler();
  expect(srv.cart).toEqual([]);
  srv.addToCart({ id: "t1", name: "Drink" });
  expect(srv.cart.length).toBe(1);

  const audio = new AudioManager();
  expect(audio.isMuted).toBe(false);

  const theme = new ThemeManager();
  expect(theme.currentTheme).toBe("dark");

  const pwa = new PWAManager();
  expect(pwa.isInstalled).toBe(false);

  const weather = new WeatherManager();
  expect(weather.cacheTtl).toBe(30 * 60 * 1000);
});

test("App Architecture - Modular App Controller exports correctly", () => {
  expect(AppModular).toBeDefined();
  expect(typeof AppModular.init).toBe("function");
  expect(typeof AppModular.changeLanguage).toBe("function");
});

test("Data Bundle - js/data.js exports complete dataset", () => {
  expect(legacyData).toBeDefined();
  expect(Array.isArray(legacyData.resortPois)).toBe(true);
  expect(legacyData.resortPois.length).toBeGreaterThan(10);
  expect(Array.isArray(legacyData.resortActivities)).toBe(true);
  expect(Array.isArray(legacyData.resortSpaTreatments)).toBe(true);
  expect(Array.isArray(legacyData.diningSchedules)).toBe(true);
  expect(Array.isArray(legacyData.resortExtensions)).toBe(true);
  expect(Array.isArray(legacyData.localFaqKb)).toBe(true);
  expect(legacyData.resortContactConfig).toBeDefined();
  expect(legacyData.compendiumData).toBeDefined();

  // Localization helpers
  expect(typeof legacyData.getLocalizedPoi).toBe("function");
  const poi = legacyData.resortPois[0];
  expect(legacyData.getLocalizedPoi(poi, "en").name).toBeTruthy();
  expect(legacyData.getLocalizedPoi(poi, "ar").name).toBeTruthy();
});

test("Data Bundle - src/data/compendium.js exports named and default compendiumData", () => {
  expect(modularData.compendiumData).toBeDefined();
  expect(modularData.resortExtensions).toBeDefined();
  expect(modularData.resortContactConfig).toBeDefined();
});
