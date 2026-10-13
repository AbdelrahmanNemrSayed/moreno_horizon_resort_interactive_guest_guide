import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { resortPois } from "../src/data/pois.js";
import {
  activityTranslations,
  dailyActivities,
  resortActivities,
  resortExcursions,
} from "../src/data/activities.js";
import {
  resortSpaTreatments,
  diningSchedules,
} from "../src/data/menu.js";
import {
  resortExtensions,
  localFaqKb,
  hurghadaPrayerSchedule,
  resortContactConfig,
  compendiumData,
} from "../src/data/compendium.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resortCategories = [
  "all",
  "dining",
  "pools",
  "relax",
  "wellness",
  "rooms",
  "services",
  "buildings",
];

const bundleCode = `/**
 * Moreno Horizon Spa & Resort - Unified Data Layer
 * Auto-generated from src/data/* for high-performance zero-waterfall loading in browser
 * and seamless dual compatibility with ES Modules / Node.js.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var data = factory();
    if (typeof window !== 'undefined') {
      window.resortPois = data.resortPois;
      window.resortCategories = data.resortCategories;
      window.getLocalizedPoi = data.getLocalizedPoi;
      window.getLocalizedFloor = data.getLocalizedFloor;
      window.dailyActivities = data.dailyActivities;
      window.resortActivities = data.resortActivities;
      window.activityTranslations = data.activityTranslations;
      window.getLocalizedActivityTitle = data.getLocalizedActivityTitle;
      window.resortExcursions = data.resortExcursions;
      window.resortSpaTreatments = data.resortSpaTreatments;
      window.diningSchedules = data.diningSchedules;
      window.resortExtensions = data.resortExtensions;
      window.localFaqKb = data.localFaqKb;
      window.hurghadaPrayerSchedule = data.hurghadaPrayerSchedule;
      window.resortContactConfig = data.resortContactConfig;
      window.compendiumData = data.compendiumData;
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  var resortPois = ${JSON.stringify(resortPois, null, 2)};
  var resortCategories = ${JSON.stringify(resortCategories, null, 2)};
  var activityTranslations = ${JSON.stringify(activityTranslations, null, 2)};
  var dailyActivities = ${JSON.stringify(dailyActivities, null, 2)};
  var resortActivities = ${JSON.stringify(resortActivities, null, 2)};
  var resortExcursions = ${JSON.stringify(resortExcursions, null, 2)};
  var resortSpaTreatments = ${JSON.stringify(resortSpaTreatments, null, 2)};
  var diningSchedules = ${JSON.stringify(diningSchedules, null, 2)};
  var resortExtensions = ${JSON.stringify(resortExtensions, null, 2)};
  var localFaqKb = ${JSON.stringify(localFaqKb, null, 2)};
  var hurghadaPrayerSchedule = ${JSON.stringify(hurghadaPrayerSchedule, null, 2)};
  var resortContactConfig = ${JSON.stringify(resortContactConfig, null, 2)};
  var compendiumData = ${JSON.stringify(compendiumData, null, 2)};

  function getLocalizedPoi(poi, lang) {
    if (!poi) return { name: '', desc: '' };
    lang = lang || 'ar';
    var name = poi.nameAr;
    var desc = poi.descAr;
    if (lang === 'en') {
      name = poi.nameEn || poi.nameAr;
      desc = poi.descEn || poi.descAr;
    } else if (lang === 'ru') {
      name = poi.nameRu || poi.nameAr;
      desc = poi.descRu || poi.descAr;
    } else if (lang === 'de') {
      name = poi.nameDe || poi.nameAr;
      desc = poi.descDe || poi.descAr;
    }
    return { name: name, desc: desc };
  }

  function getLocalizedFloor(floorCode, lang) {
    if (!floorCode) return '';
    lang = lang || 'ar';
    var floorDict = {
      G: { ar: 'الطابق الأرضي (Ground)', en: 'Ground Floor', ru: 'Первый этаж (Ground)', de: 'Erdgeschoss (Ground)' },
      1: { ar: 'الطابق الأول (1st Floor)', en: '1st Floor', ru: 'Второй этаж (1st Floor)', de: '1. Etage' },
      2: { ar: 'الطابق الثاني (2nd Floor)', en: '2nd Floor', ru: 'Третий этаж (2nd Floor)', de: '2. Etage' },
      3: { ar: 'الطابق الثالث (3rd Floor)', en: '3rd Floor', ru: 'Четвертый этаж (3rd Floor)', de: '3. Etage' }
    };
    if (floorDict[floorCode] && floorDict[floorCode][lang]) {
      return floorDict[floorCode][lang];
    }
    return floorCode;
  }

  function getLocalizedActivityTitle(act, index, lang) {
    lang = lang || 'ar';
    if (lang === 'ar' || !lang) return act.titleAr;
    var trans = activityTranslations[index] && activityTranslations[index][lang];
    return trans || act.titleEn || act.titleAr;
  }

  return {
    resortPois: resortPois,
    resortCategories: resortCategories,
    getLocalizedPoi: getLocalizedPoi,
    getLocalizedFloor: getLocalizedFloor,
    activityTranslations: activityTranslations,
    getLocalizedActivityTitle: getLocalizedActivityTitle,
    dailyActivities: dailyActivities,
    resortActivities: resortActivities,
    resortExcursions: resortExcursions,
    resortSpaTreatments: resortSpaTreatments,
    diningSchedules: diningSchedules,
    resortExtensions: resortExtensions,
    localFaqKb: localFaqKb,
    hurghadaPrayerSchedule: hurghadaPrayerSchedule,
    resortContactConfig: resortContactConfig,
    compendiumData: compendiumData
  };
});
`;

const outputPath = path.resolve(__dirname, "../js/data.js");
fs.writeFileSync(outputPath, bundleCode, "utf8");
console.log(`Successfully generated ${outputPath}`);
