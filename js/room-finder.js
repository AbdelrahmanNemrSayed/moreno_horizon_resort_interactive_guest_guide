/**
 * Moreno Horizon Spa & Resort - Room Finder & Corridor Pathfinding
 * 
 * Capabilities:
 * 1. Room Number Lookup:
 *    - Maps numeric room numbers to their respective building wings:
 *      * Wing N (North Building): 1501-1948 (5 floors)
 *      * Wing S (South Building): 2001-2444 (5 floors)
 *      * Wing M (Main Building / Lobby): 1001-1260 (3 floors)
 *      * Wing MLS (Commercial Complex): 2601-2948 (4 floors)
 * 2. Corridor Guidance:
 *    - Computes floor level, corridor side (odd/even), and step-by-step indoor directions.
 * 3. Outdoor-to-Indoor Pathfinding:
 *    - Traces path from guest's live blue dot location (or selected start) to designated wing entrance.
 * 4. Sleek Summary Route Banner & 1-Tap "Save My Room".
 */

const RoomFinder = {
  isInitialized: false,

  // Building Wings Configuration
  WINGS: {
    N: {
      id: 'N',
      num: 'N',
      nameAr: 'المبنى الشمالي (Wing N)',
      nameEn: 'North Building (Wing N)',
      nameRu: 'Северный корпус (Wing N)',
      nameDe: 'Nordflügel (Wing N)',
      coords: { x: 22.45, y: 55.18 },
      canvasCoords: { x: 201, y: 662 },
      badgeColor: 'bg-cyan-600',
      icon: '🏨',
      floors: [
        { floorNum: 1, min: 1501, max: 1548, nameAr: 'الطابق الأول', nameEn: 'Floor 1', nameRu: '1-й этаж', nameDe: '1. Etage' },
        { floorNum: 2, min: 1601, max: 1648, nameAr: 'الطابق الثاني', nameEn: 'Floor 2', nameRu: '2-й этаж', nameDe: '2. Etage' },
        { floorNum: 3, min: 1701, max: 1748, nameAr: 'الطابق الثالث', nameEn: 'Floor 3', nameRu: '3-й этаж', nameDe: '3. Etage' },
        { floorNum: 4, min: 1801, max: 1848, nameAr: 'الطابق الرابع', nameEn: 'Floor 4', nameRu: '4-й этаж', nameDe: '4. Etage' },
        { floorNum: 5, min: 1901, max: 1948, nameAr: 'الطابق الخامس', nameEn: 'Floor 5', nameRu: '5-й этаж', nameDe: '5. Etage' }
      ]
    },
    S: {
      id: 'S',
      num: 'S',
      nameAr: 'المبنى الجنوبي (Wing S)',
      nameEn: 'South Building (Wing S)',
      nameRu: 'Южный корпус (Wing S)',
      nameDe: 'Südflügel (Wing S)',
      coords: { x: 63.11, y: 54.2 },
      canvasCoords: { x: 565, y: 650 },
      badgeColor: 'bg-amber-500',
      icon: '🏨',
      floors: [
        { floorNum: 1, min: 2001, max: 2016, nameAr: 'الطابق الأول', nameEn: 'Floor 1', nameRu: '1-й этаж', nameDe: '1. Etage' },
        { floorNum: 2, min: 2101, max: 2144, nameAr: 'الطابق الثاني', nameEn: 'Floor 2', nameRu: '2-й этаж', nameDe: '2. Etage' },
        { floorNum: 3, min: 2201, max: 2244, nameAr: 'الطابق الثالث', nameEn: 'Floor 3', nameRu: '3-й этаж', nameDe: '3. Etage' },
        { floorNum: 4, min: 2301, max: 2344, nameAr: 'الطابق الرابع', nameEn: 'Floor 4', nameRu: '4-й этаж', nameDe: '4. Etage' },
        { floorNum: 5, min: 2401, max: 2444, nameAr: 'الطابق الخامس', nameEn: 'Floor 5', nameRu: '5-й этаж', nameDe: '5. Etage' }
      ]
    },
    M: {
      id: 'M',
      num: 'M',
      nameAr: 'المبنى الرئيسي (Lobby Wing M)',
      nameEn: 'Main Building (Lobby Wing M)',
      nameRu: 'Главный корпус (Lobby Wing M)',
      nameDe: 'Hauptgebäude (Lobby Flügel M)',
      coords: { x: 31.55, y: 68.36 },
      canvasCoords: { x: 283, y: 820 },
      badgeColor: 'bg-rose-700',
      icon: '🏛️',
      floors: [
        { floorNum: 1, min: 1001, max: 1020, nameAr: 'الطابق الأول (اللوبي)', nameEn: 'Floor 1 (Lobby)', nameRu: '1-й этаж (Лобби)', nameDe: '1. Etage (Lobby)' },
        { floorNum: 2, min: 1101, max: 1160, nameAr: 'الطابق الثاني', nameEn: 'Floor 2', nameRu: '2-й этаж', nameDe: '2. Etage' },
        { floorNum: 3, min: 1201, max: 1260, nameAr: 'الطابق الثالث', nameEn: 'Floor 3', nameRu: '3-й этаж', nameDe: '3. Etage' }
      ]
    },
    MLS: {
      id: 'MLS',
      num: 'MLS',
      nameAr: 'المبنى التجاري (Wing MLS)',
      nameEn: 'Commercial Complex (Wing MLS)',
      nameRu: 'Коммерческий комплекс (Wing MLS)',
      nameDe: 'Gewerbekomplex (Flügel MLS)',
      coords: { x: 18.2, y: 86.43 },
      canvasCoords: { x: 163, y: 1037 },
      badgeColor: 'bg-emerald-600',
      icon: '🛍️',
      floors: [
        { floorNum: 1, min: 2601, max: 2654, nameAr: 'الطابق الأول', nameEn: 'Floor 1', nameRu: '1-й этаж', nameDe: '1. Etage' },
        { floorNum: 2, min: 2701, max: 2748, nameAr: 'الطابق الثاني', nameEn: 'Floor 2', nameRu: '2-й этаж', nameDe: '2. Etage' },
        { floorNum: 3, min: 2801, max: 2848, nameAr: 'الطابق الثالث', nameEn: 'Floor 3', nameRu: '3-й этаж', nameDe: '3. Etage' },
        { floorNum: 4, min: 2901, max: 2948, nameAr: 'الطابق الرابع', nameEn: 'Floor 4', nameRu: '4-й этаж', nameDe: '4. Etage' }
      ]
    }
  },

  init() {
    if (this.isInitialized) return;
    this.bindSearchEvents();
    this.isInitialized = true;
    console.log('[RoomFinder] Room Lookup & Corridor Pathfinding initialized.');
  },

  getCurrentLang() {
    if (typeof App !== 'undefined' && App.currentLang) {
      return App.currentLang;
    }
    return 'ar';
  },

  /**
   * Resolves a room number to its wing, floor, and corridor side
   * @param {string|number} rawQuery - E.g. "2015", "Room 1520", "غرفة 1124"
   * @returns {Object|null} Resolution details
   */
  resolveRoom(rawQuery) {
    if (!rawQuery) return null;
    const match = String(rawQuery).match(/\d+/);
    if (!match) return null;
    const roomNum = parseInt(match[0], 10);

    for (const [wingKey, wing] of Object.entries(this.WINGS)) {
      for (const fl of wing.floors) {
        if (roomNum >= fl.min && roomNum <= fl.max) {
          const isOdd = roomNum % 2 !== 0;
          const roomIndexOnFloor = roomNum - fl.min + 1;
          const isNearElevator = roomIndexOnFloor <= 8;

          // Corridor instructions generator
          const instructions = this.generateCorridorInstructions(wing, fl, isOdd, isNearElevator);

          // Get linked POI from resortPois
          let linkedPoi = null;
          if (typeof resortPois !== 'undefined' && Array.isArray(resortPois)) {
            linkedPoi = resortPois.find(p => p.id === wing.id);
          }

          return {
            roomNumber: roomNum,
            wingKey,
            wing,
            floor: fl,
            floorNum: fl.floorNum,
            isOdd,
            isNearElevator,
            instructions,
            linkedPoi: linkedPoi || {
              id: wing.id,
              coords: wing.coords,
              nameAr: wing.nameAr,
              nameEn: wing.nameEn
            }
          };
        }
      }
    }

    return null;
  },

  generateCorridorInstructions(wing, floor, isOdd, isNearElevator) {
    const lang = this.getCurrentLang();
    const sideAr = isOdd ? 'الجانب الأيمن (مطل على البحر / المسبح)' : 'الجانب الأيسر (مطل على الحدائق)';
    const sideEn = isOdd ? 'right side (Sea / Pool view)' : 'left side (Garden view)';
    const sideRu = isOdd ? 'правая сторона (вид на море/бассейн)' : 'левая сторона (вид на сад)';
    const sideDe = isOdd ? 'rechte Seite (Meer-/Poolblick)' : 'linke Seite (Gartenblick)';

    const distNoteAr = isNearElevator ? 'قريبة من المصعد الرئيسي (3-5 خطوات).' : 'في منتصف الممر الهادئ.';
    const distNoteEn = isNearElevator ? 'close to the main elevator (3-5 steps).' : 'midway along the quiet hallway.';
    const distNoteRu = isNearElevator ? 'рядом с главным лифтом (3-5 шагов).' : 'в середине тихого коридора.';
    const distNoteDe = isNearElevator ? 'nahe dem Hauptaufzug (3-5 Schritte).' : 'in der Mitte des ruhigen Flurs.';

    return {
      ar: `عند الوصول لمدخل ${wing.nameAr}: استقل المصعد أو الدرج إلى ${floor.nameAr}، اتجه في الممر، الغرفة على ${sideAr}، ${distNoteAr}`,
      en: `Upon reaching ${wing.nameEn} entrance: take the elevator or stairs to ${floor.nameEn}, proceed down the hallway, room is on the ${sideEn}, ${distNoteEn}`,
      ru: `При входе в ${wing.nameRu}: поднимитесь на лифте на ${floor.nameRu}, пройдите по коридору, номер на ${sideRu}, ${distNoteRu}`,
      de: `Am Eingang des ${wing.nameDe}: Nehmen Sie den Aufzug zur ${floor.nameDe}, folgen Sie dem Flur, Zimmer liegt auf der ${sideDe}, ${distNoteDe}`
    };
  },

  /**
   * Main Pathfinding Action:
   * Finds route from current location (or Lobby) to building entrance,
   * centers camera, and displays room guidance banner.
   */
  navigateToRoom(rawQuery) {
    const resolved = this.resolveRoom(rawQuery);
    if (!resolved) {
      const lang = this.getCurrentLang();
      const notFoundMsg = (lang === 'ar')
        ? '⚠️ رقم الغرفة غير موجود. يرجى إدخال رقم غرفة صحيح (مثل 1520 أو 2015).'
        : '⚠️ Room number not found. Please enter a valid room (e.g. 1520 or 2015).';
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(notFoundMsg);
      } else {
        alert(notFoundMsg);
      }
      return false;
    }

    const lang = this.getCurrentLang();
    const wingPoi = resolved.linkedPoi;
    const destTitle = (lang === 'ar') ? `${wingPoi.nameAr} (غرفة ${resolved.roomNumber})` : `${wingPoi.nameEn || wingPoi.nameAr} (Room ${resolved.roomNumber})`;

    let originPoi = null;
    let originTitle = '';

    // Check if live tracking location is active
    if (typeof MapEngine !== 'undefined' && MapEngine.lastGuestPosition) {
      const liveName = (lang === 'ar') ? 'موقعي الحالي' : (lang === 'ru') ? 'Мое местоположение' : (lang === 'de' ? 'Mein Standort' : 'My Live Location');
      originPoi = {
        id: 'LIVE_GUEST_LOCATION',
        nameAr: liveName,
        nameEn: 'My Live Location',
        coords: { x: MapEngine.lastGuestPosition.pctX, y: MapEngine.lastGuestPosition.pctY },
        isLiveLocation: true
      };
      originTitle = `📍 ${liveName}`;
    } else {
      // Fallback: Lobby M
      if (typeof resortPois !== 'undefined') {
        originPoi = resortPois.find(p => p.id === 'M') || { coords: { x: 31.55, y: 68.36 }, nameAr: 'بهو الاستقبال M' };
      } else {
        originPoi = { coords: { x: 31.55, y: 68.36 }, nameAr: 'بهو الاستقبال M' };
      }
      originTitle = (lang === 'ar') ? 'بهو الاستقبال الرئيسي M' : 'Main Lobby & Reception M';
    }

    // Trigger Route in MapEngine
    let routeInfo = { meters: 90, minutes: 2 };
    if (typeof MapEngine !== 'undefined') {
      routeInfo = MapEngine.drawRoute(originPoi.coords, wingPoi.coords, originTitle, destTitle, false, true);
      MapEngine.startTurnByTurn(originPoi, wingPoi, false, true);
    }

    // Focus camera
    if (typeof MapEngine !== 'undefined' && wingPoi.coords) {
      MapEngine.focusCoordinate(wingPoi.coords.x, wingPoi.coords.y, 1.45, true);
    }

    // Render Room Guidance Route Banner
    this.renderRoomRouteBanner(resolved, routeInfo);

    // Announce via VoiceConcierge if available
    if (typeof VoiceConcierge !== 'undefined' && !VoiceConcierge.isMuted) {
      const announceText = (lang === 'ar')
        ? `تم تحديد مسار الغرفة ${resolved.roomNumber} في ${resolved.wing.nameAr}، ${resolved.floor.nameAr}. المسافة ${routeInfo.meters} متراً.`
        : `Route mapped to Room ${resolved.roomNumber} in ${resolved.wing.nameEn}, ${resolved.floor.nameEn}. Distance is ${routeInfo.meters} meters.`;
      VoiceConcierge.speak(announceText);
    }

    return true;
  },

  renderRoomRouteBanner(resolved, routeInfo) {
    let banner = document.getElementById('roomRouteBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'roomRouteBanner';
      banner.className = 'fixed top-20 start-1/2 -translate-x-1/2 z-40 w-11/12 max-w-lg select-none';
      document.body.appendChild(banner);
    }

    const lang = this.getCurrentLang();
    const instr = resolved.instructions[lang] || resolved.instructions.ar;
    const wingName = (lang === 'ar') ? resolved.wing.nameAr : (lang === 'ru' ? resolved.wing.nameRu : (lang === 'de' ? resolved.wing.nameDe : resolved.wing.nameEn));
    const floorName = (lang === 'ar') ? resolved.floor.nameAr : (lang === 'ru' ? resolved.floor.nameRu : (lang === 'de' ? resolved.floor.nameDe : resolved.floor.nameEn));

    banner.innerHTML = `
      <div class="relative p-4 rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 text-white shadow-2xl animate-scaleUp">
        <button onclick="RoomFinder.closeBanner()" class="absolute top-3 end-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs font-bold transition">
          ✕
        </button>

        <!-- Room Header Badge -->
        <div class="flex items-center gap-3 mb-2.5">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-brand-gold text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shrink-0">
            🚪
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm sm:text-base font-black text-amber-300 font-mono">#${resolved.roomNumber}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full ${resolved.wing.badgeColor} text-white font-bold">${wingName}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 font-bold">${floorName}</span>
            </div>
            <p class="text-xs text-slate-300 font-semibold truncate mt-0.5">
              ⏱️ ${routeInfo.minutes} دقيقة (${routeInfo.meters} متراً من موقعك)
            </p>
          </div>
        </div>

        <!-- Corridor Instructions Card -->
        <div class="p-2.5 rounded-2xl bg-white/5 border border-white/10 mb-3 text-xs leading-relaxed text-slate-200">
          <div class="flex items-start gap-1.5">
            <span class="text-amber-400 font-bold">🚶‍♂️ إرشادات الممر:</span>
            <span>${instr}</span>
          </div>
        </div>

        <!-- Actions: Save as My Room & Start Simulation -->
        <div class="grid grid-cols-2 gap-2">
          <button onclick="RoomFinder.saveAsMyRoom(${resolved.roomNumber})" class="tap-effect py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition">
            <span>⭐</span>
            <span>${lang === 'ar' ? 'حفظ كغرفتي' : 'Save as My Room'}</span>
          </button>
          <button onclick="MapEngine.toggleLiveWalkSimulation(); RoomFinder.closeBanner();" class="tap-effect py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110">
            <span>▶️</span>
            <span>${lang === 'ar' ? 'بدء محاكاة السير' : 'Start Walk'}</span>
          </button>
        </div>
      </div>
    `;

    banner.classList.remove('hidden');
  },

  closeBanner() {
    const banner = document.getElementById('roomRouteBanner');
    if (banner) banner.classList.add('hidden');
  },

  saveAsMyRoom(roomNumber) {
    try {
      localStorage.setItem('moreno_guest_room', String(roomNumber));
      const lang = this.getCurrentLang();
      const msg = (lang === 'ar')
        ? `✅ تم حفظ الغرفة ${roomNumber} بنجاح! يمكنك العودة إليها بلمسة واحدة.`
        : `✅ Room ${roomNumber} saved! You can route back anytime with 1 tap.`;
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(msg);
      }
      this.closeBanner();
    } catch (e) {
      console.warn('[RoomFinder] Could not save room:', e);
    }
  },

  bindSearchEvents() {
    // Connect to room inputs if already in DOM
    const roomInput = document.getElementById('roomSearchInput');
    if (roomInput) {
      roomInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.navigateToRoom(roomInput.value);
        }
      });
    }
  }
};

// Global Attachments
if (typeof window !== 'undefined') {
  window.RoomFinder = RoomFinder;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => RoomFinder.init());
    } else {
      RoomFinder.init();
    }
  }
}
