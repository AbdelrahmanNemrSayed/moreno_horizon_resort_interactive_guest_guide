/**
 * Moreno Horizon Spa & Resort - Wayfinder Engine
 * Handles Room search, Floor matching, and Destination Route Guidance.
 */

const Wayfinder = {
  lookupRoom() {
    App.playBeep(800);
    const input = document.getElementById('roomSearchInput');
    const rawVal = input ? input.value.trim() : '';
    if (!rawVal) return;

    // Normalize Eastern Arabic numerals (٢٠١٥ -> 2015)
    const normalized = rawVal.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    const roomNum = parseInt(normalized);
    if (isNaN(roomNum)) return;

    // Save room number to localStorage
    localStorage.setItem('moreno_guest_room', roomNum);
    const srvInput = document.getElementById('srvRoomNumberInput');
    if (srvInput) srvInput.value = roomNum;
    const bkTblInput = document.getElementById('bookRoomNum');
    if (bkTblInput) bkTblInput.value = roomNum;

    // Match against official building ranges
    const buildings = resortPois.filter(p => p.isBuilding);
    let matchedBuilding = null;
    let matchedFloor = "";

    for (const b of buildings) {
      for (const r of b.rooms) {
        const isMatch = r.exact ? r.exact.includes(roomNum) : (roomNum >= r.min && roomNum <= r.max);
        if (isMatch) {
          matchedBuilding = b;
          matchedFloor = r.floor;
          break;
        }
      }
      if (matchedBuilding) break;
    }

    const banner = document.getElementById('routeResultBanner');
    banner.classList.remove('hidden');

    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    if (matchedBuilding) {
      MapEngine.selectPoi(matchedBuilding.id);
      MapEngine.closePopover();
      MapEngine.focusCoordinate(matchedBuilding.coords.x, matchedBuilding.coords.y, 1.45);

      const locBuilding = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(matchedBuilding, lang) : { name: matchedBuilding.nameAr };
      const locFloor = (typeof getLocalizedFloor === 'function') ? getLocalizedFloor(matchedFloor, lang) : matchedFloor;

      // Draw animated SVG route from Main Lobby (M) to Matched Building & start live navigation
      const lobbyPoi = resortPois.find(p => p.id === 'M') || { coords: { x: 31.55, y: 68.36 } };
      const locLobby = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(lobbyPoi, lang) : { name: 'Main Lobby' };
      const routeInfo = MapEngine.drawRoute(lobbyPoi.coords, matchedBuilding.coords, locLobby.name, locBuilding.name);
      MapEngine.startTurnByTurn(lobbyPoi, matchedBuilding, false);

      banner.innerHTML = `
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="w-12 h-12 rounded-2xl ${matchedBuilding.badgeColor} text-white font-black text-xl flex items-center justify-center shadow-lg">
              ${matchedBuilding.num}
            </span>
            <div>
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">${t.wf_room_found || '✓ تم تحديد موقع الغرفة'} (${roomNum})</span>
              <h4 class="font-black text-sm sm:text-base text-slate-900 dark:text-white">${locBuilding.name} - ${locFloor}</h4>
              <p class="text-xs text-slate-500 mt-0.5">${t.wf_approx_distance || '⏱️ المسافة التقريبية:'} ${routeInfo.meters} ${t.wf_meters || 'متراً'} • ${routeInfo.minutes} ${t.wf_minutes_walk || 'دقيقة سيراً عبر الممشى المظلل'}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button onclick="MapEngine.scrollToMap(); MapEngine.startLiveWalkSimulation();" class="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black text-xs whitespace-nowrap shadow-sm tap-effect">
              ${t.wf_live_walk_btn || 'بدء محاكاة السير 🚶‍♂️'}
            </button>
            <button onclick="MapEngine.scrollToMap()" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs whitespace-nowrap">
              ${t.wf_preview_map || 'الخريطة 🗺️'}
            </button>
          </div>
        </div>
      `;
    } else {
      MapEngine.clearRoute();
      banner.innerHTML = `
        <div class="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
          <span>⚠️</span> ${t.wf_room_not_found || 'رقم الغرفة غير مسجل في نطاقات الغرف الحالية. يرجى مراجعة موظف الاستقبال على تحويلة (0).'} (${roomNum})
        </div>
      `;
    }
  },

  quickSelectRoom(num) {
    document.getElementById('roomSearchInput').value = num;
    const box = document.getElementById('roomSuggestionsBox');
    if (box) box.classList.add('hidden');
    this.lookupRoom();
  },

  onRoomInput(val) {
    const box = document.getElementById('roomSuggestionsBox');
    if (!box) return;
    const clean = (val || '').trim().replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    if (!clean || clean.length < 2) {
      box.classList.add('hidden');
      return;
    }

    const buildings = resortPois.filter(p => p.isBuilding);
    const matches = [];

    for (const b of buildings) {
      for (const r of b.rooms) {
        if (r.exact) {
          const hits = r.exact.filter(num => String(num).startsWith(clean));
          hits.forEach(h => matches.push({ room: h, building: b, floor: r.floor }));
        } else if (r.min && r.max) {
          const minS = String(r.min);
          const maxS = String(r.max);
          if (minS.startsWith(clean) || maxS.startsWith(clean) || (parseInt(clean) >= Math.floor(r.min / 10) && parseInt(clean) <= Math.floor(r.max / 10))) {
            matches.push({ sample: `${r.min} - ${r.max}`, building: b, floor: r.floor, range: true });
          }
        }
      }
    }

    if (matches.length === 0) {
      box.classList.add('hidden');
      return;
    }

    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    box.innerHTML = matches.slice(0, 4).map(m => {
      const locB = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(m.building, lang) : { name: m.building.nameAr };
      if (m.range) {
        const firstNum = m.sample.split(' - ')[0];
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
    }).join('');
    box.classList.remove('hidden');
  },

  reset() {
    document.getElementById('roomSearchInput').value = '';
    const box = document.getElementById('roomSuggestionsBox');
    if (box) box.classList.add('hidden');
    document.getElementById('selectDestination').value = '';
    document.getElementById('routeResultBanner').classList.add('hidden');
    MapEngine.clearRoute();
    MapEngine.resetTransform();
    MapEngine.endTurnByTurn();
  },

  calculateRoute() {
    App.playBeep(800);
    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    const originSelect = document.getElementById('selectOrigin');
    const originId = originSelect ? originSelect.value : 'M';
    const originOpt = originSelect && originSelect.options && originSelect.selectedIndex >= 0 ? originSelect.options[originSelect.selectedIndex] : null;
    const originText = originOpt ? originOpt.text.replace(/^[📍\s]+/, '') : (t.wf_your_location || 'موقعك');
    const destinationSelect = document.getElementById('selectDestination');
    const destination = destinationSelect ? destinationSelect.value : '';
    const banner = document.getElementById('routeResultBanner');

    if (!destination) {
      App.showToast(t.wf_select_dest_prompt || 'يرجى اختيار الوجهة المطلوبة أولاً 🎯');
      return;
    }

    const originPoi = resortPois.find(p => p.id === originId) || resortPois.find(p => p.id === 'M');
    const targetPoi = resortPois.find(p => p.id === destination);
    if (!targetPoi) return;

    const locTarget = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(targetPoi, lang) : { name: targetPoi.nameAr };

    MapEngine.selectPoi(destination);
    MapEngine.closePopover();
    MapEngine.focusCoordinate(targetPoi.coords.x, targetPoi.coords.y, 1.45);

    // Draw animated route & auto start live turn-by-turn navigation
    const routeInfo = MapEngine.drawRoute(originPoi.coords, targetPoi.coords, originText, locTarget.name);
    MapEngine.startTurnByTurn(originPoi, targetPoi, false);

    banner.classList.remove('hidden');
    banner.innerHTML = `
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-2xl ${targetPoi.badgeColor} text-white font-black flex items-center justify-center shadow">
            ${targetPoi.num}
          </span>
          <div>
            <span class="text-[11px] font-bold text-slate-500">${t.wf_direct_route || 'مسار سير مباشر متصل بالخريطة:'}</span>
            <h4 class="font-extrabold text-sm text-slate-900 dark:text-white">${t.wf_from_to || 'من'} [${originText}] ${t.wf_to || 'إلى'} ➔ ${locTarget.name}</h4>
            <p class="text-xs text-emerald-600 font-semibold mt-0.5">⏱️ ${t.wf_approx_distance || 'المسافة:'} ${routeInfo.meters} ${t.wf_meters || 'متراً'} • ${routeInfo.minutes} ${t.walkingTime || 'دقيقة سيراً'}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button onclick="MapEngine.scrollToMap(); MapEngine.startLiveWalkSimulation();" class="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black text-xs whitespace-nowrap shadow-sm tap-effect">
            ${t.wf_live_walk_btn || 'بدء محاكاة السير 🚶‍♂️'}
          </button>
          <button onclick="MapEngine.scrollToMap()" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs whitespace-nowrap">
            ${t.wf_show_route || 'الخريطة 🗺️'}
          </button>
        </div>
      </div>
    `;
  },

  // 1-Tap "Take Me to My Room"
  takeMeToMyRoom() {
    App.playBeep(900);
    const savedRoom = localStorage.getItem('moreno_guest_room');
    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    if (!savedRoom) {
      App.openSaveRoomModal();
      return;
    }

    const input = document.getElementById('roomSearchInput');
    if (input) input.value = savedRoom;

    this.lookupRoom();

    // Auto-launch turn-by-turn navigation
    const roomNum = parseInt(savedRoom);
    const buildings = resortPois.filter(p => p.isBuilding);
    let matchedBuilding = null;
    for (const b of buildings) {
      for (const r of b.rooms) {
        const isMatch = r.exact ? r.exact.includes(roomNum) : (roomNum >= r.min && roomNum <= r.max);
        if (isMatch) {
          matchedBuilding = b;
          break;
        }
      }
      if (matchedBuilding) break;
    }

    if (matchedBuilding) {
      const lobbyPoi = resortPois.find(p => p.id === 'M');
      MapEngine.startTurnByTurn(lobbyPoi, matchedBuilding, false);
      App.showToast(`🏠 ${t.nav_turn_title || 'الملاحة الحية إلى غرفتك'} (${savedRoom})`);
    }
  }
};

if (typeof window !== 'undefined') {
  window.Wayfinder = Wayfinder;
}
