/**
 * Unit Tests for I18n Engine & ICU formatting
 */

import { test, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import I18nEngine from "../js/core/i18n-engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ar = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../locales/ar.json"), "utf8"),
);
const en = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../locales/en.json"), "utf8"),
);

I18nEngine.registerLocale("ar", ar);
I18nEngine.registerLocale("en", en);

test("I18nEngine - Basic translation key lookup", () => {
  const arWelcome = I18nEngine.t("guest_welcome", null, "ar");
  expect(arWelcome).toContain("مرحباً بك");

  const enWelcome = I18nEngine.t("guest_welcome", null, "en");
  expect(enWelcome).toContain("Welcome");
});

test("I18nEngine - Parameter interpolation ({name}, {room})", () => {
  const res = I18nEngine.t("guest_greeting_name", { name: "عمر" }, "ar");
  expect(res).toContain("عمر");
});

test("I18nEngine - ICU Plural formatting in Arabic", () => {
  const pattern =
    "{count, plural, zero {لا توجد غرف} one {غرفة واحدة} two {غرفتان} few {# غرف} many {# غرفة} other {# غرفة}}";

  expect(I18nEngine.formatMessage(pattern, { count: 0 }, "ar")).toBe(
    "لا توجد غرف",
  );
  expect(I18nEngine.formatMessage(pattern, { count: 1 }, "ar")).toBe(
    "غرفة واحدة",
  );
  expect(I18nEngine.formatMessage(pattern, { count: 2 }, "ar")).toBe("غرفتان");
  expect(I18nEngine.formatMessage(pattern, { count: 3 }, "ar")).toBe("3 غرف");
  expect(I18nEngine.formatMessage(pattern, { count: 12 }, "ar")).toBe(
    "12 غرفة",
  );
});

test("I18nEngine - Fallback to Arabic when key is missing in other languages", () => {
  const res = I18nEngine.t("guest_welcome", null, "non_existent_lang");
  expect(res).toContain("مرحباً بك");
});

test("I18nEngine - ICU Plural formatting in English", () => {
  const pattern = "{count, plural, one {# room} other {# rooms}}";
  expect(I18nEngine.formatMessage(pattern, { count: 1 }, "en")).toBe("1 room");
  expect(I18nEngine.formatMessage(pattern, { count: 5 }, "en")).toBe("5 rooms");
});

test("I18nEngine - setLanguage updates current language", () => {
  I18nEngine.setLanguage("en");
  expect(I18nEngine.currentLang).toBe("en");
  I18nEngine.setLanguage("ar");
  expect(I18nEngine.currentLang).toBe("ar");
});

test("I18nEngine - Wayfinder & Debug keys exist in English and Arabic", () => {
  expect(I18nEngine.t("wf_tab_both", null, "en")).toBe("✨ Both");
  expect(I18nEngine.t("wf_tab_both", null, "ar")).toBe("✨ كلاهما");
  expect(I18nEngine.t("wf_card_room_title", null, "en")).toBe("Instant Room Locator");
  expect(I18nEngine.t("wf_card_route_title", null, "en")).toBe("Walking Route Planner (From ➔ To)");
  expect(I18nEngine.t("layer_ap_debug", null, "en")).toBe("Calibrate APs (Debug)");
  expect(I18nEngine.t("sample_room_north_1520", null, "en")).toBe("1520 (North)");
  expect(I18nEngine.t("omni_search_btn", null, "en")).toBe("Search");
  expect(I18nEngine.t("omni_search_btn", null, "ar")).toBe("بحث");
});

