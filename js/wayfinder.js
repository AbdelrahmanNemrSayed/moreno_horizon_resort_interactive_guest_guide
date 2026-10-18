/**
 * Moreno Horizon Spa & Resort - Wayfinder Engine
 * Handles Room search, Floor matching, and Destination Route Guidance.
 */

const Wayfinder = {
  lookupRoom() {
    App.playBeep(800);
    const lang = (typeof App !== "undefined" && App.currentLang) || "ar";
    const t = typeof i18n !== "undefined" && i18n[lang] ? i18n[lang] : i18n.ar;

    let input = document.getElementById("roomSearchInput");
    let rawVal = input ? input.value.trim() : "";
    if (!rawVal) {
      const altInput = document.getElementById("mapRoomSearchInput");
      if (altInput && altInput.value.trim()) {
        rawVal = altInput.value.trim();
        if (input) input.value = rawVal;
      }
    }

    if (!rawVal) {
      if (typeof App !== "undefined" && typeof App.showToast === "function") {
        App.showToast(t.wf_enter_room_prompt || "يرجى كتابة رقم الغرفة أولاً 🚪", "ℹ️");
      }
      if (input) input.focus();
      return;
    }

    // Normalize Eastern Arabic numerals (٢٠١٥ -> 2015)
    const normalized = rawVal.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    const roomNum = parseInt(normalized);
    if (isNaN(roomNum)) {
      if (typeof App !== "undefined" && typeof App.showToast === "function") {
        App.showToast(t.wf_room_not_found || "رقم الغرفة غير صحيح", "⚠️");
      }
      return;
    }

    // Populate inputs if currently active, without persisting as guest room
    const srvInput = document.getElementById("srvRoomNumberInput");
    if (srvInput && !srvInput.value) srvInput.value = roomNum;
    const bkTblInput = document.getElementById("bookRoomNum");
    if (bkTblInput && !bkTblInput.value) bkTblInput.value = roomNum;

    // Match against official building ranges
    const buildings = resortPois.filter((p) => p.isBuilding);
    let matchedBuilding = null;
    let matchedFloor = "";

    for (const b of buildings) {
      for (const r of b.rooms) {
        const isMatch = r.exact
          ? r.exact.includes(roomNum)
          : roomNum >= r.min && roomNum <= r.max;
        if (isMatch) {
          matchedBuilding = b;
          matchedFloor = r.floor;
          break;
        }
      }
      if (matchedBuilding) break;
    }

    const banner = document.getElementById("routeResultBanner");
    if (banner) banner.classList.remove("hidden");

    if (matchedBuilding) {
      const locBuilding =
        typeof getLocalizedPoi === "function"
          ? getLocalizedPoi(matchedBuilding, lang)
          : { name: matchedBuilding.nameAr };
      const locFloor =
        typeof getLocalizedFloor === "function"
          ? getLocalizedFloor(matchedFloor, lang)
          : matchedFloor;

      MapEngine.closePopover();

      // Highlight the building pin without scrolling yet
      MapEngine.selectPoi(matchedBuilding.id, false);
      MapEngine.closePopover(); // keep popover closed so room beacon & map remain completely clear

      // Draw animated SVG route from Main Lobby (M) to Matched Building
      const currentPoi = resortPois.find(
        (p) => p.id === MapEngine.guestLocationPoiId,
      );
      const originPoi = currentPoi ||
        resortPois.find((p) => p.id === "M") || {
          coords: { x: 31.55, y: 68.36 },
        };
      const locOrigin =
        typeof getLocalizedPoi === "function"
          ? getLocalizedPoi(originPoi, lang)
          : { name: originPoi.nameAr || "Main Lobby" };
      const routeInfo = MapEngine.drawRoute(
        originPoi.coords,
        matchedBuilding.coords,
        locOrigin.name,
        locBuilding.name,
      );

      // 1. Drop prominent bouncing golden room beacon right on the matched building coordinate
      MapEngine.dropRoomBeacon(
        matchedBuilding.coords,
        roomNum,
        locBuilding.name,
        locFloor,
      );

      // 2. Start turn-by-turn navigation HUD outside the map, but DON'T recenter camera on lobby
      MapEngine.startTurnByTurn(originPoi, matchedBuilding, false, false);

      // 3. Laser-focus camera directly onto the guest's room building with clear zoom (1.85x)
      MapEngine.focusCoordinate(
        matchedBuilding.coords.x,
        matchedBuilding.coords.y,
        1.85,
        true,
      );

      // 4. Accurately scroll to map viewport framed directly below the sticky header
      MapEngine.scrollToMap();

      banner.innerHTML = `
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="w-12 h-12 rounded-2xl ${matchedBuilding.badgeColor} text-white font-black text-xl flex items-center justify-center shadow-lg">
              ${matchedBuilding.num}
            </span>
            <div>
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">${t.wf_room_found || "✓ تم تحديد موقع الغرفة"} (${roomNum})</span>
              <h4 class="font-black text-sm sm:text-base text-slate-900 dark:text-white">${locBuilding.name} - ${locFloor}</h4>
              <p class="text-xs text-slate-500 mt-0.5">${t.wf_approx_distance || "⏱️ المسافة التقريبية:"} ${routeInfo.meters} ${t.wf_meters || "متراً"} • ${routeInfo.minutes} ${t.wf_minutes_walk || "دقيقة سيراً عبر الممشى المظلل"}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button onclick="MapEngine.scrollToMap(); MapEngine.startLiveWalkSimulation();" class="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black text-xs whitespace-nowrap shadow-sm tap-effect">
              ${t.wf_live_walk_btn || "بدء محاكاة السير 🚶‍♂️"}
            </button>
            <button onclick="MapEngine.scrollToMap()" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs whitespace-nowrap">
              ${t.wf_preview_map || "الخريطة 🗺️"}
            </button>
          </div>
        </div>
      `;
    } else {
      MapEngine.clearRoute();
      banner.innerHTML = `
        <div class="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
          <span>⚠️</span> ${t.wf_room_not_found || "رقم الغرفة غير مسجل في نطاقات الغرف الحالية. يرجى مراجعة موظف الاستقبال على تحويلة (0)."} (${roomNum})
        </div>
      `;
    }
  },

  quickSelectRoom(num) {
    document.getElementById("roomSearchInput").value = num;
    const box = document.getElementById("roomSuggestionsBox");
    if (box) box.classList.add("hidden");
    this.lookupRoom();
  },

  onRoomInput(val) {
    const box = document.getElementById("roomSuggestionsBox");
    if (!box) return;
    const clean = (val || "")
      .trim()
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    if (!clean || clean.length < 2) {
      box.classList.add("hidden");
      return;
    }

    const buildings = resortPois.filter((p) => p.isBuilding);
    const matches = [];

    for (const b of buildings) {
      for (const r of b.rooms) {
        if (r.exact) {
          const hits = r.exact.filter((num) => String(num).startsWith(clean));
          hits.forEach((h) =>
            matches.push({ room: h, building: b, floor: r.floor }),
          );
        } else if (r.min && r.max) {
          const minS = String(r.min);
          const maxS = String(r.max);
          if (
            minS.startsWith(clean) ||
            maxS.startsWith(clean) ||
            (parseInt(clean) >= Math.floor(r.min / 10) &&
              parseInt(clean) <= Math.floor(r.max / 10))
          ) {
            matches.push({
              sample: `${r.min} - ${r.max}`,
              building: b,
              floor: r.floor,
              range: true,
            });
          }
        }
      }
    }

    if (matches.length === 0) {
      box.classList.add("hidden");
      return;
    }

    const lang = (typeof App !== "undefined" && App.currentLang) || "ar";
    box.innerHTML = matches
      .slice(0, 4)
      .map((m) => {
        const locB =
          typeof getLocalizedPoi === "function"
            ? getLocalizedPoi(m.building, lang)
            : { name: m.building.nameAr };
        if (m.range) {
          const firstNum = m.sample.split(" - ")[0];
          return `
          <button type="button" onclick="document.getElementById('roomSearchInput').value='${firstNum}'; Wayfinder.lookupRoom(); document.getElementById('roomSuggestionsBox').classList.add('hidden');" class="w-full text-start p-2 rounded-xl hover:bg-amber-500/10 dark:hover:bg-slate-800 transition flex items-center justify-between text-xs tap-effect">
            <span class="font-bold text-slate-800 dark:text-slate-200">غرف ${m.sample}</span>
            <span class="text-[11px] font-semibold text-amber-600 dark:text-amber-400">${locB.name}</span>
          </button>
        `;
        } else {
          return `
          <button type="button" onclick="document.getElementById('roomSearchInput').value='${m.room}'; Wayfinder.lookupRoom(); document.getElementById('roomSuggestionsBox').classList.add('hidden');" class="w-full text-start p-2 rounded-xl hover:bg-amber-500/10 dark:hover:bg-slate-800 transition flex items-center justify-between text-xs tap-effect">
            <span class="font-bold text-slate-800 dark:text-slate-200">غرفة #${m.room}</span>
            <span class="text-[11px] font-semibold text-amber-600 dark:text-amber-400">${locB.name}</span>
          </button>
        `;
        }
      })
      .join("");
    box.classList.remove("hidden");
  },

  reset() {
    document.getElementById("roomSearchInput").value = "";
    const box = document.getElementById("roomSuggestionsBox");
    if (box) box.classList.add("hidden");
    document.getElementById("selectDestination").value = "";
    document.getElementById("routeResultBanner").classList.add("hidden");
    MapEngine.clearRoute();
    MapEngine.resetTransform();
    MapEngine.endTurnByTurn();
  },

  calculateRoute() {
    App.playBeep(800);
    const lang = (typeof App !== "undefined" && App.currentLang) || "ar";
    const t = typeof i18n !== "undefined" && i18n[lang] ? i18n[lang] : i18n.ar;

    const originSelect = document.getElementById("selectOrigin");
    const originId = originSelect ? originSelect.value : "M";
    const destinationSelect = document.getElementById("selectDestination");
    const destination = destinationSelect ? destinationSelect.value : "";
    const banner = document.getElementById("routeResultBanner");

    if (!destination) {
      App.showToast(
        t.wf_select_dest_prompt || "يرجى اختيار الوجهة المطلوبة أولاً 🎯",
      );
      return;
    }

    let originPoi;
    let originText;

    if (originId === "LIVE_GUEST_LOCATION" && MapEngine.lastGuestPosition) {
      originPoi = {
        id: "LIVE_GUEST_LOCATION",
        nameAr: lang === "ar" ? "موقعي الحالي" : "My Live Location",
        nameEn: "My Live Location",
        nameRu: "Мое местоположение",
        nameDe: "Mein Standort",
        coords: {
          x: MapEngine.lastGuestPosition.pctX,
          y: MapEngine.lastGuestPosition.pctY,
        },
        isLiveLocation: true,
      };
      originText = lang === "ar" ? "📍 موقعي الحالي" : "📍 My Live Location";
      MapEngine.activeLiveNavDestination = resortPois.find(
        (p) => p.id === destination,
      );
    } else {
      originPoi =
        resortPois.find((p) => p.id === originId) ||
        resortPois.find((p) => p.id === "M");
      const originOpt =
        originSelect && originSelect.options && originSelect.selectedIndex >= 0
          ? originSelect.options[originSelect.selectedIndex]
          : null;
      originText = originOpt
        ? originOpt.text.replace(/^[📍🏨\s]+/, "")
        : t.wf_your_location || "موقعك";
      MapEngine.activeLiveNavDestination = null;
    }

    const targetPoi = resortPois.find((p) => p.id === destination);
    if (!targetPoi) return;

    const locTarget =
      typeof getLocalizedPoi === "function"
        ? getLocalizedPoi(targetPoi, lang)
        : { name: targetPoi.nameAr };

    MapEngine.selectPoi(destination);
    MapEngine.closePopover();
    MapEngine.focusCoordinate(targetPoi.coords.x, targetPoi.coords.y, 1.45);

    // Draw animated route & auto start live turn-by-turn navigation
    const routeInfo = MapEngine.drawRoute(
      originPoi.coords,
      targetPoi.coords,
      originText,
      locTarget.name,
      false,
      true,
    );
    MapEngine.startTurnByTurn(originPoi, targetPoi, false, true);

    banner.classList.remove("hidden");
    banner.innerHTML = `
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-2xl ${targetPoi.badgeColor} text-white font-black flex items-center justify-center shadow">
            ${targetPoi.num}
          </span>
          <div>
            <span class="text-[11px] font-bold text-slate-500">${t.wf_direct_route || "مسار سير مباشر متصل بالخريطة:"}</span>
            <h4 class="font-extrabold text-sm text-slate-900 dark:text-white">${t.wf_from_to || "من"} [${originText}] ${t.wf_to || "إلى"} ➔ ${locTarget.name}</h4>
            <p class="text-xs text-emerald-600 font-semibold mt-0.5">⏱️ ${t.wf_approx_distance || "المسافة:"} ${routeInfo.meters} ${t.wf_meters || "متراً"} • ${routeInfo.minutes} ${t.walkingTime || "دقيقة سيراً"}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button onclick="MapEngine.scrollToMap(); MapEngine.startLiveWalkSimulation();" class="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black text-xs whitespace-nowrap shadow-sm tap-effect">
            ${t.wf_live_walk_btn || "بدء محاكاة السير 🚶‍♂️"}
          </button>
          <button onclick="MapEngine.scrollToMap()" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs whitespace-nowrap">
            ${t.wf_show_route || "الخريطة 🗺️"}
          </button>
        </div>
      </div>
    `;
  },

  // 1-Tap "Take Me to My Room"
  takeMeToMyRoom() {
    App.playBeep(900);
    const savedRoom = localStorage.getItem("moreno_guest_room");
    const lang = (typeof App !== "undefined" && App.currentLang) || "ar";
    const t = typeof i18n !== "undefined" && i18n[lang] ? i18n[lang] : i18n.ar;

    if (!savedRoom) {
      if (typeof App !== "undefined" && typeof App.openSaveRoomModal === "function") {
        App.openSaveRoomModal();
      } else {
        const input = document.getElementById("roomSearchInput");
        if (input) {
          input.focus();
          if (typeof App !== "undefined" && App.showToast) {
            App.showToast(t.enter_room_first || "يرجى كتابة رقم غرفتك أولاً", "ℹ️");
          }
        }
      }
      return;
    }

    const input = document.getElementById("roomSearchInput");
    if (input) input.value = savedRoom;

    this.lookupRoom();
    App.showToast(
      `🏠 ${t.nav_turn_title || "الملاحة الحية إلى غرفتك"} (${savedRoom})`,
    );
  },

  /**
   * Dynamically populate selectOrigin and selectDestination with fully localized POI and Building titles
   */
  populateDropdowns(lang = "ar") {
    const originSelect = document.getElementById("selectOrigin");
    const destSelect = document.getElementById("selectDestination");
    if (!originSelect && !destSelect) return;

    const t =
      (typeof window !== "undefined" && window.i18n && window.i18n[lang])
        ? window.i18n[lang]
        : (typeof i18n !== "undefined" && i18n[lang]
            ? i18n[lang]
            : (typeof window !== "undefined" && window.i18n && window.i18n.ar
                ? window.i18n.ar
                : {}));

    const currentOriginVal = originSelect ? originSelect.value : "M";
    const currentDestVal = destSelect ? destSelect.value : "";

    const poisList =
      (typeof window !== "undefined" && Array.isArray(window.resortPois) && window.resortPois) ||
      (typeof resortPois !== "undefined" && Array.isArray(resortPois) && resortPois) ||
      [];

    const getPoiName = (poi) => {
      if (!poi) return "";
      const locFn =
        (typeof window !== "undefined" && typeof window.getLocalizedPoi === "function" && window.getLocalizedPoi) ||
        (typeof getLocalizedPoi === "function" ? getLocalizedPoi : null);
      if (locFn) {
        try {
          const loc = locFn(poi, lang);
          if (loc && loc.name) return loc.name;
        } catch (e) {}
      }
      if (lang === "en") return poi.nameEn || poi.nameAr;
      if (lang === "ru") return poi.nameRu || poi.nameAr;
      if (lang === "de") return poi.nameDe || poi.nameAr;
      return poi.nameAr;
    };

    // 1. Populate Origin Select
    if (originSelect) {
      let originHtml = "";
      const liveLabel =
        lang === "ar"
          ? "📍 موقعي الحالي (Live Blue Dot)"
          : (lang === "ru"
              ? "📍 Моё текущее положение (Live)"
              : (lang === "de"
                  ? "📍 Mein Standort (Live)"
                  : "📍 My Live Location (Live Blue Dot)"));
      originHtml += `<option value="LIVE_GUEST_LOCATION">${liveLabel}</option>`;

      if (poisList.length > 0) {
        const buildings = poisList.filter((p) => p.isBuilding);
        const landmarks = poisList.filter((p) => !p.isBuilding);

        buildings.forEach((poi) => {
          const name = getPoiName(poi);
          originHtml += `<option value="${poi.id}">🏨 ${name} (${poi.num})</option>`;
        });
        landmarks.forEach((poi) => {
          const name = getPoiName(poi);
          originHtml += `<option value="${poi.id}">📍 ${name} (${poi.num})</option>`;
        });
      }
      originSelect.innerHTML = originHtml;
      if (currentOriginVal) {
        originSelect.value = currentOriginVal;
      }
      if (!originSelect.value && originSelect.options.length > 1) {
        originSelect.value = "M";
      }
    }

    // 2. Populate Destination Select
    if (destSelect) {
      const placeholderText =
        t.wf_dest_placeholder_opt ||
        (lang === "ru"
          ? "🎯 Пункт назначения: выберите объект или корпус..."
          : (lang === "de"
              ? "🎯 Ziel: Einrichtung oder Gebäude wählen..."
              : (lang === "en"
                  ? "🎯 Destination: choose a facility or building..."
                  : "🎯 الوجهة: اختر مرفقاً أو مبنى...")));

      let destHtml = `<option value="">${placeholderText}</option>`;
      if (poisList.length > 0) {
        const buildings = poisList.filter((p) => p.isBuilding);
        const landmarks = poisList.filter((p) => !p.isBuilding);

        buildings.forEach((poi) => {
          const name = getPoiName(poi);
          destHtml += `<option value="${poi.id}">🏨 ${name} (${poi.num})</option>`;
        });
        landmarks.forEach((poi) => {
          const name = getPoiName(poi);
          destHtml += `<option value="${poi.id}">📍 ${name} (${poi.num})</option>`;
        });
      }
      destSelect.innerHTML = destHtml;
      if (currentDestVal) {
        destSelect.value = currentDestVal;
      }
    }
  },

  swapPoints() {
    if (typeof App !== "undefined" && typeof App.playBeep === "function") {
      App.playBeep(700, 60);
    }
    const origin = document.getElementById("selectOrigin");
    const dest = document.getElementById("selectDestination");
    if (!origin || !dest) return;
    const prevOrigin = origin.value;
    const prevDest = dest.value;
    if (prevDest) origin.value = prevDest;
    if (prevOrigin && prevOrigin !== "LIVE_GUEST_LOCATION") dest.value = prevOrigin;
    if (dest.value) {
      this.calculateRoute();
    }
  },

  setTab(tab) {
    if (typeof App !== "undefined" && typeof App.playBeep === "function") {
      App.playBeep(650, 40);
    }
    const roomCard = document.getElementById("wfRoomCard");
    const routeCard = document.getElementById("wfRouteCard");
    const grid = document.getElementById("wfMainGrid");
    const bRoom = document.getElementById("wfTabRoom");
    const bRoute = document.getElementById("wfTabRoute");
    const bBoth = document.getElementById("wfTabBoth");

    const activeCls = "tap-effect px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500 text-slate-950 shadow-md transition";
    const inactiveCls = "tap-effect px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-300 transition";

    if (bRoom) bRoom.className = tab === "room" ? activeCls : inactiveCls;
    if (bRoute) bRoute.className = tab === "route" ? activeCls : inactiveCls;
    if (bBoth) bBoth.className = tab === "both" ? activeCls : inactiveCls;

    if (tab === "room") {
      if (roomCard) roomCard.classList.remove("hidden");
      if (routeCard) routeCard.classList.add("hidden");
      if (grid) grid.className = "relative z-10 grid grid-cols-1 gap-4 mb-3";
    } else if (tab === "route") {
      if (roomCard) roomCard.classList.add("hidden");
      if (routeCard) routeCard.classList.remove("hidden");
      if (grid) grid.className = "relative z-10 grid grid-cols-1 gap-4 mb-3";
    } else {
      if (roomCard) roomCard.classList.remove("hidden");
      if (routeCard) routeCard.classList.remove("hidden");
      if (grid) grid.className = "relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3";
    }
  },
};

if (typeof window !== "undefined") {
  window.Wayfinder = Wayfinder;
  window.handleRoomLookup = window.handleRoomLookup || function () {
    Wayfinder.lookupRoom();
  };
  window.lookupRoom = window.lookupRoom || function () {
    Wayfinder.lookupRoom();
  };
  window.findRoom = window.findRoom || function () {
    Wayfinder.lookupRoom();
  };
  window.calculateCustomRoute = window.calculateCustomRoute || function () {
    Wayfinder.calculateRoute();
  };
  window.resetWayfinder = window.resetWayfinder || function () {
    Wayfinder.reset();
  };
  window.takeMeToMyRoom = window.takeMeToMyRoom || function () {
    Wayfinder.takeMeToMyRoom();
  };
  window.quickSelectRoom = window.quickSelectRoom || function (num) {
    Wayfinder.quickSelectRoom(num);
  };
  window.swapWayfinderPoints = window.swapWayfinderPoints || function () {
    Wayfinder.swapPoints();
  };
  window.setWayfinderTab = window.setWayfinderTab || function (tab) {
    Wayfinder.setTab(tab);
  };

  // Populate dropdowns on initial DOM ready
  const getInitialLang = () => {
    return (
      (typeof App !== "undefined" && App.currentLang) ||
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("moreno_language")) ||
      "ar"
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      Wayfinder.populateDropdowns(getInitialLang());
    });
  } else {
    Wayfinder.populateDropdowns(getInitialLang());
  }
}

