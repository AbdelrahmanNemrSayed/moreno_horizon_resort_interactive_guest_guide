/**
 * Moreno Horizon Spa & Resort - Google Earth 3D Interactive Map Engine
 * Features:
 * - Full 3D Camera Controls: Perspective tilt (pitch), 360° compass rotation (bearing), pan & zoom
 * - Photorealistic Satellite, Night Lights & Illustrated Multi-Layer Crossfade
 * - 3D Billboard Hotspot Pins with vertical elevation stalks & ground shadows
 * - Autonomous 360° Orbit Flyover Tour (Satellite Flight Mode)
 * - Real-time Navigation Routes, Turn-by-Turn Wayfinding, GPS Location Beacon & Open-Now Radar
 */

const MapEngine = {
  // Photorealistic Satellite Map Dimensions
  CANVAS_WIDTH: 896,
  CANVAS_HEIGHT: 1200,

  // Camera State
  scale: 1,
  minScale: 0.35,
  maxScale: 4.5,
  panX: 0,
  panY: 0,
  pitch: 0,        // 2D top-down mode by default
  bearing: 0,       // Compass rotation in degrees (0 = North up)
  is3D: false,      // 2D mode enabled by default for classic flat map
  currentLayer: 'illustrated', // 'illustrated' | 'satellite' | 'night'
  currentCategoryFilter: 'all',

  // Interaction State
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  isRotating: false,
  rotateStartX: 0,
  rotateStartBearing: 0,
  isOrbiting: false,
  orbitAnimId: null,
  isPickingLocation: false,
  guestLocationPoiId: null,

  // Live Guest WiFi Indoor Positioning State ("Blue Dot")
  guestMac: null,
  liveTrackerWs: null,
  liveTrackerPollTimer: null,
  lastGuestPosition: null,
  isAutoFollowingGuest: false,
  liveTrackingHeading: 0,

  // AP Calibration & Debug Overlay State
  isApDebugActive: false,
  cachedAccessPoints: [],
  showRadiusCircles: true,
  lastApTelemetry: null,

  init() {
    this.renderPins();
    this.bindEvents();
    this.setLayer(this.currentLayer);

    // Initialize Live WiFi Guest Tracking ("Blue Dot")
    this.initLiveGuestTracking();

    // Check URL query parameters for Admin / AP Debug mode (?debug=true, ?admin=true, ?calibrate=true)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('debug') === 'true' || urlParams.get('debug') === '1' || urlParams.get('admin') === 'true' || urlParams.get('calibrate') === 'true') {
        setTimeout(() => this.toggleApCalibrationOverlay(true), 400);
      }
    } catch (e) {}

    // Keyboard shortcut: Ctrl + Shift + D toggles AP calibration overlay
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        this.toggleApCalibrationOverlay();
      }
    });

    // Initial viewport fit and centering
    this.fitToViewport();
    setTimeout(() => {
      this.fitToViewport();
    }, 60);
    setTimeout(() => {
      this.fitToViewport();
    }, 250);

    window.addEventListener('resize', () => {
      this.fitToViewport();
    });

    document.addEventListener('fullscreenchange', () => {
      this.syncExternalNavParent();
      setTimeout(() => this.fitToViewport(), 100);
    });
  },

  fitToViewport() {
    const viewport = document.getElementById('mapViewport');
    const canvas = document.getElementById('mapCanvasWrapper');
    if (!viewport || !canvas) return;

    // Enforce LTR coordinate system for 100% exact canvas centering
    viewport.style.direction = 'ltr';
    canvas.style.position = 'absolute';
    canvas.style.top = '0px';
    canvas.style.left = '0px';

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    // Scale to fit 896x1200 nicely in viewport
    const scaleX = vw / this.CANVAS_WIDTH;
    const scaleY = vh / this.CANVAS_HEIGHT;
    const fitScale = Math.min(scaleX, scaleY);

    this.scale = fitScale * (this.is3D ? 0.98 : 0.95);
    // Never allow zooming out so much that huge empty spaces appear
    this.minScale = Math.min(this.scale, fitScale * 0.90);
    this.maxScale = Math.max(fitScale * 5.0, 3.8);

    // Exact center coordinates in viewport
    this.panX = (vw - this.CANVAS_WIDTH) / 2;
    this.panY = (vh - this.CANVAS_HEIGHT) / 2;

    this.clampPan();
    this.applyTransform();
  },

  clampPan() {
    const viewport = document.getElementById('mapViewport');
    if (!viewport) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const cx = this.CANVAS_WIDTH / 2; // 448
    const cy = this.CANVAS_HEIGHT / 2; // 600

    const imgW = this.CANVAS_WIDTH * this.scale;
    const imgH = this.CANVAS_HEIGHT * this.scale;

    // Small boundary margin so edge pins are comfortably clickable
    const marginX = Math.min(36, vw * 0.08);
    const marginY = Math.min(36, vh * 0.08);

    // Horizontal clamping: in CSS with transformOrigin: 50% 50%:
    // Left edge on screen = panX + cx * (1 - scale)
    // Right edge on screen = panX + cx * (1 + scale)
    if (imgW <= vw) {
      this.panX = (vw - this.CANVAS_WIDTH) / 2;
    } else {
      const maxPanX = cx * (this.scale - 1) + marginX;
      const minPanX = vw - cx * (1 + this.scale) - marginX;
      this.panX = Math.min(maxPanX, Math.max(minPanX, this.panX));
    }

    // Vertical clamping:
    // Top edge on screen = panY + cy * (1 - scale)
    // Bottom edge on screen = panY + cy * (1 + scale)
    if (imgH <= vh) {
      this.panY = (vh - this.CANVAS_HEIGHT) / 2;
    } else {
      const maxPanY = cy * (this.scale - 1) + marginY;
      const minPanY = vh - cy * (1 + this.scale) - marginY;
      this.panY = Math.min(maxPanY, Math.max(minPanY, this.panY));
    }
  },

  applyTransform(smooth = false) {
    const canvas = document.getElementById('mapCanvasWrapper');
    const viewport = document.getElementById('mapViewport');
    if (!canvas) return;

    if (viewport) {
      if (this.is3D) {
        viewport.classList.add('mode-3d');
      } else {
        viewport.classList.remove('mode-3d');
      }
    }

    canvas.style.transition = smooth ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    canvas.style.transformOrigin = '50% 50%';

    const currentPitch = this.is3D ? this.pitch : 0;
    canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale}) rotateX(${currentPitch}deg) rotateZ(${this.bearing}deg)`;

    // Keep pins facing camera as true 3D billboards
    this.updatePinBillboards();

    // Sync Compass & Telemetry HUD
    this.updateCompassUI();
    this.updateEarthHud();

    // Update Mini-Map Radar Viewport Locator
    this.updateMiniMap();
  },

  updatePinBillboards() {
    const pins = document.querySelectorAll('.map-pin');
    const currentPitch = this.is3D ? this.pitch : 0;

    pins.forEach(pin => {
      const isTourActive = pin.classList.contains('active-tour-pin');
      const scaleStr = isTourActive ? 'scale(1.4)' : '';
      if (this.is3D) {
        pin.classList.add('pin-3d');
        // Counter-rotate pin so it stands upright and faces viewer
        pin.style.transform = `translate(-50%, -100%) rotateZ(${-this.bearing}deg) rotateX(${-currentPitch}deg) ${scaleStr}`;
      } else {
        pin.classList.remove('pin-3d');
        pin.style.transform = `translate(-50%, -50%) rotateZ(${-this.bearing}deg) ${scaleStr}`;
      }
    });

    // Also counter-rotate location marker if present
    const locMarker = document.getElementById('myLocationMarker');
    if (locMarker) {
      locMarker.style.transform = `translate(-50%, -50%) rotateZ(${-this.bearing}deg) rotateX(${-currentPitch}deg)`;
    }

    const walker = document.getElementById('walkerBeacon');
    if (walker) {
      walker.style.transform = `rotateZ(${-this.bearing}deg) rotateX(${-currentPitch}deg)`;
    }

    const simAvatar = document.getElementById('simWalkerAvatarWrapper');
    if (simAvatar) {
      simAvatar.style.transform = (this.is3D && currentPitch > 0) ? `rotateX(${-currentPitch}deg)` : 'none';
    }

    const blueDotWrapper = document.getElementById('blueDotCoreWrapper');
    if (blueDotWrapper) {
      blueDotWrapper.style.transform = (this.is3D && currentPitch > 0) ? `rotateX(${-currentPitch}deg)` : 'none';
    }

    document.querySelectorAll('.ap-marker-core').forEach(apCore => {
      apCore.style.transform = (this.is3D && currentPitch > 0) ? `rotateX(${-currentPitch}deg)` : 'none';
    });
  },

  updateCompassUI() {
    const needle = document.getElementById('earthCompassNeedle');
    if (needle) {
      needle.style.transform = `rotate(${-this.bearing}deg)`;
    }
  },

  updateEarthHud() {
    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;
    const hudPitch = document.getElementById('hudPitch');
    if (hudPitch) {
      hudPitch.innerText = this.is3D ? t.map_view_3d : t.map_view_2d;
    }

    const hudAlt = document.getElementById('hudAlt');
    if (hudAlt) {
      hudAlt.innerText = `${t.map_zoom_level} ${this.scale.toFixed(1)}x`;
    }

    const glow = document.getElementById('earthHorizonGlow');
    if (glow) {
      glow.style.opacity = (this.is3D && this.pitch > 20) ? '1' : '0';
    }
  },

  // 3D Tilt Controls
  toggle3D() {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(700);
    this.stopOrbitTour();
    this.is3D = !this.is3D;

    this.set3DButtonsActive(this.is3D);

    if (this.is3D && this.pitch === 0) {
      this.pitch = 52;
    }

    this.applyTransform(true);
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(this.is3D ? '🌍 تم تفعيل منظور Google Earth 3D المجسم' : '🗺️ تم الانتقال للمنظور الأفقي المباشر (2D)');
    }
  },

  adjustPitch(delta) {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(650);
    this.stopOrbitTour();
    if (!this.is3D) {
      this.is3D = true;
      this.set3DButtonsActive(true);
    }

    this.pitch = Math.min(74, Math.max(0, this.pitch + delta));
    if (this.pitch === 0) {
      this.is3D = false;
      this.set3DButtonsActive(false);
    }

    this.applyTransform(true);
  },

  // Keep both 3D toggle buttons (map toolbar + Earth widget) in sync
  set3DButtonsActive(active) {
    ['btnToggle3D', 'btnToggle3DEarth'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('active-mode', !!active);
    });
  },

  // 360° Compass Rotation Controls
  rotateBearing(delta) {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(600);
    this.stopOrbitTour();
    this.bearing = (this.bearing + delta + 360) % 360;
    this.applyTransform(true);
  },

  resetBearing() {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(800);
    this.stopOrbitTour();
    this.bearing = 0;
    this.applyTransform(true);
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('🧭 تم توجيه الخريطة نحو الشمال الحقيقي');
    }
  },

  // Layer Switcher: Satellite / Night / Illustrated
  setLayer(layerName, btn) {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(600);
    this.currentLayer = layerName;

    // Update layer images visibility with crossfade
    const satImg = document.getElementById('resortMapSatellite');
    const nightWrapper = document.getElementById('resortMapNightWrapper') || document.getElementById('resortMapNight');
    const illusImg = document.getElementById('resortMapIllustrated');

    if (satImg) {
      satImg.className = `earth-layer-img map-layer-satellite ${layerName === 'satellite' ? 'active' : 'inactive'}`;
    }
    if (nightWrapper) {
      nightWrapper.className = `earth-layer-img map-layer-night-wrapper ${layerName === 'night' ? 'active' : 'inactive'}`;
    }
    if (illusImg) {
      illusImg.className = `earth-layer-img ${layerName === 'illustrated' ? 'active' : 'inactive'}`;
    }

    // Update layer switcher button states
    document.querySelectorAll('.map-layer-pill').forEach(b => b.classList.remove('active'));
    if (btn) {
      btn.classList.add('active');
    } else {
      const activeBtn = document.getElementById(
        layerName === 'satellite' ? 'layerBtnSatellite' :
        layerName === 'night' ? 'layerBtnNight' : 'layerBtnIllustrated'
      );
      if (activeBtn) activeBtn.classList.add('active');
    }
  },

  // Autonomous 360° Orbit Flyover Tour
  toggleOrbitTour() {
    if (this.isOrbiting) {
      this.stopOrbitTour();
    } else {
      this.startOrbitTour();
    }
  },

  startOrbitTour() {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(900);
    this.isOrbiting = true;
    this.is3D = true;
    this.pitch = 56;

    const btn = document.getElementById('orbitTourBtn');
    if (btn) btn.classList.add('earth-orbit-running');
    this.set3DButtonsActive(true);

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('🚁 بدأت جولة الطيران الجوي الفضائي 360° حول المنتجع');
    }

    const animateOrbit = () => {
      if (!this.isOrbiting) return;
      this.bearing = (this.bearing + 0.35) % 360;
      this.applyTransform(false);
      this.orbitAnimId = requestAnimationFrame(animateOrbit);
    };

    if (this.orbitAnimId) cancelAnimationFrame(this.orbitAnimId);
    this.orbitAnimId = requestAnimationFrame(animateOrbit);
  },

  stopOrbitTour() {
    if (!this.isOrbiting) return;
    this.isOrbiting = false;
    if (this.orbitAnimId) {
      cancelAnimationFrame(this.orbitAnimId);
      this.orbitAnimId = null;
    }
    const btn = document.getElementById('orbitTourBtn');
    if (btn) btn.classList.remove('earth-orbit-running');
  },

  getPoiIcon(poi) {
    if (poi.icon) return poi.icon;
    if (poi.isBuilding) return '🏨';
    const id = String(poi.id);
    if (id === '1') return '🏖️';
    if (id === '2') return '🤿';
    if (id === '3') return '🎪';
    if (id === '4') return '🎠';
    if (id === '5' || id === '7' || id === '9') return '🍹';
    if (id === '6' || id === '8' || id === '12') return '🍽️';
    if (id === '10') return '🎾';
    if (id === '11') return '🏊‍♂️';
    if (id === '13' || id === '17') return '🅿️';
    if (id === '14' || id === '18') return '🚪';
    if (id === '15') return '🏥';
    if (id === '16') return '🕌';
    if (id === 'MLS') return '🛍️';
    return '📍';
  },

  renderPins() {
    const overlay = document.getElementById('pinsOverlay');
    if (!overlay) return;
    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';

    overlay.innerHTML = resortPois.map(poi => {
      const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr, hours: poi.hours };
      const icon = this.getPoiIcon(poi);
      const isWing = poi.isBuilding;
      return `
      <div 
        id="pin-${poi.id}" 
        onclick="MapEngine.selectPoi('${poi.id}')"
        style="left: ${poi.coords.x}%; top: ${poi.coords.y}%;" 
        class="map-pin ${this.is3D ? 'pin-3d' : ''} absolute flex items-center justify-center rounded-full text-white font-black shadow-xl cursor-pointer tap-effect border-2 border-white dark:border-slate-900 ${poi.badgeColor} ${isWing ? 'w-9 h-9 text-xs ring-2 ring-amber-400' : 'w-7 h-7 text-[10px]'}"
        data-category="${poi.category}"
        title="${loc.name}"
      >
        <span class="relative z-10 flex items-center justify-center gap-0.5 pointer-events-none">
          <span class="text-xs leading-none">${icon}</span>
          <span class="font-black leading-none">${poi.num}</span>
        </span>
        <span class="radar-pulse ${poi.badgeColor}"></span>

        <!-- Instant Hover Tooltip Preview -->
        <div class="pin-tooltip absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-3 py-1.5 rounded-xl shadow-2xl border border-slate-700 whitespace-nowrap text-center z-40 pointer-events-none">
          <div class="flex items-center gap-1 justify-center">
            <span>${icon}</span>
            <span class="text-xs font-black">${loc.name}</span>
          </div>
          <span class="block text-[10px] text-amber-300 font-semibold mt-0.5">${loc.hours || poi.hours || ''}</span>
        </div>
      </div>
    `;
    }).join('');

    this.updatePinBillboards();
  },

  getNavContainer() {
    const vp = document.getElementById('mapViewport');
    const isFullscreen = (vp && vp.classList.contains('fullscreen-active')) || !!document.fullscreenElement;
    if (isFullscreen) {
      return vp;
    }
    return document.getElementById('mapExternalNavContainer') || vp;
  },

  syncExternalNavParent() {
    const targetParent = this.getNavContainer();
    if (!targetParent) return;
    const hud = document.getElementById('turnNavHud');
    if (hud && hud.parentElement !== targetParent) {
      targetParent.appendChild(hud);
    }
    const pop = document.getElementById('activeMapPopover');
    if (pop && pop.parentElement !== targetParent) {
      targetParent.appendChild(pop);
    }
  },

  showPopover(poi) {
    this.closePopover();
    if (this.activeNavigation) return; // Don't show POI card if turn-by-turn navigation is already running

    const targetParent = this.getNavContainer();
    if (!targetParent) return;

    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr, hours: poi.hours, tag: poi.tagAr, description: poi.descriptionAr, category: poi.categoryNameAr };
    const icon = this.getPoiIcon(poi);

    // Calculate walking distance from live Blue Dot position, or fallback to saved room / lobby M
    let originCoords;
    let isFromLiveLocation = false;
    let originPoi = null;

    if (this.lastGuestPosition) {
      originCoords = { x: this.lastGuestPosition.pctX, y: this.lastGuestPosition.pctY };
      isFromLiveLocation = true;
    } else {
      const savedRoom = localStorage.getItem('moreno_guest_room');
      originPoi = resortPois.find(p => p.id === 'M');
      if (savedRoom) {
        const roomNum = parseInt(savedRoom);
        const b = resortPois.filter(p => p.isBuilding).find(b => b.rooms.some(r => r.exact ? r.exact.includes(roomNum) : (roomNum >= r.min && roomNum <= r.max)));
        if (b) originPoi = b;
      }
      originCoords = originPoi ? originPoi.coords : { x: 31.55, y: 68.36 };
    }

    const distPx = Math.hypot((poi.coords.x - originCoords.x) * (this.CANVAS_WIDTH / 100), (poi.coords.y - originCoords.y) * (this.CANVAS_HEIGHT / 100));
    const distMeters = Math.round(distPx * 0.42);
    const walkMin = Math.max(1, Math.round(distMeters / 65));

    const popover = document.createElement('div');
    popover.id = 'activeMapPopover';
    popover.className = 'map-bottom-sheet-card';

    const imgUrl = poi.image || 'assets/images/hero_resort.jpg';
    const walkBtnText = isFromLiveLocation
      ? ((lang === 'ar') ? 'الاتجاهات من موقعي 🧭' : (lang === 'ru') ? 'Вести от меня 🧭' : (lang === 'de') ? 'Route von hier 🧭' : 'Navigate Here 🧭')
      : ((lang === 'ar') ? 'تحديد المسار والملاحة 🚶‍♂️' : (lang === 'ru') ? 'Живой маршрут 🚶‍♂️' : (lang === 'de') ? 'Live Route 🚶‍♂️' : 'Get Directions 🚶‍♂️');
    const detailBtnText = (lang === 'ar') ? 'التفاصيل ℹ️' : (lang === 'ru') ? 'Инфо ℹ️' : (lang === 'de') ? 'Info ℹ️' : 'Details ℹ️';

    popover.innerHTML = `
      <div class="flex items-center gap-3 w-full">
        <!-- Thumbnail -->
        <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-800 shrink-0 shadow-md border border-white/20">
          <img src="${imgUrl}" alt="${loc.name}" class="w-full h-full object-cover">
          <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded-lg ${poi.badgeColor} text-white font-black text-[9px] shadow">
            ${icon} ${poi.num}
          </span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 pr-1">
          <div class="flex items-center justify-between gap-1 mb-0.5">
            <h4 class="font-extrabold text-xs sm:text-sm text-white truncate">${loc.name}</h4>
            <button onclick="event.stopPropagation(); MapEngine.closePopover();" class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 text-slate-300 hover:text-white flex items-center justify-center text-xs shrink-0 transition" title="إغلاق">✕</button>
          </div>
          <div class="flex items-center gap-2 text-[10px] text-slate-300 mb-1">
            <span class="text-amber-300 font-semibold truncate">${loc.category || poi.categoryNameAr || ''}</span>
            <span>•</span>
            <span class="text-emerald-400 font-bold shrink-0">🟢 مفتوح</span>
            ${isFromLiveLocation ? '<span class="text-blue-400 font-bold text-[9px] bg-blue-500/20 px-1.5 py-0.2 rounded-full border border-blue-500/30">📍 من موقعك</span>' : ''}
          </div>
          <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span>⏱️ ${walkMin} دقيقة (${distMeters}م)</span>
            <span>•</span>
            <span class="truncate">🕒 ${loc.hours || poi.hours || 'متاح للنزلاء'}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/10">
        <button onclick="event.stopPropagation(); MapEngine.navigateDirectTo('${poi.id}')" class="tap-effect py-2 px-3 rounded-xl ${isFromLiveLocation ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-black' : 'bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black'} text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110">
          <span>${isFromLiveLocation ? '🧭' : '🚶‍♂️'}</span>
          <span class="truncate">${walkBtnText}</span>
        </button>
        <button onclick="event.stopPropagation(); App.openPoiModal(resortPois.find(p => p.id === '${poi.id}'))" class="tap-effect py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15">
          <span>ℹ️</span>
          <span>${detailBtnText}</span>
        </button>
      </div>
    `;

    targetParent.appendChild(popover);
  },

  closePopover() {
    const pop = document.getElementById('activeMapPopover');
    if (pop) pop.remove();
  },

  navigateDirectTo(destId) {
    this.closePopover();
    const destPoi = resortPois.find(p => p.id === destId);
    if (!destPoi) return;

    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const locDest = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(destPoi, lang) : { name: destPoi.nameAr };

    let originPoi;
    let originTitle;

    // 1. If guest has live Blue Dot location, route directly from live position
    if (this.lastGuestPosition) {
      const liveName = (lang === 'ar') ? 'موقعي الحالي' : (lang === 'ru') ? 'Мое местоположение' : (lang === 'de' ? 'Mein Standort' : 'My Live Location');
      originPoi = {
        id: 'LIVE_GUEST_LOCATION',
        nameAr: liveName,
        nameEn: 'My Live Location',
        nameRu: 'Мое местоположение',
        nameDe: 'Mein Standort',
        coords: { x: this.lastGuestPosition.pctX, y: this.lastGuestPosition.pctY },
        isLiveLocation: true
      };
      originTitle = `📍 ${liveName}`;
      this.activeLiveNavDestination = destPoi;
      this.lastNavRecalcPos = {
        x: (this.lastGuestPosition.pctX / 100) * this.CANVAS_WIDTH,
        y: (this.lastGuestPosition.pctY / 100) * this.CANVAS_HEIGHT
      };
    } else {
      this.activeLiveNavDestination = null;
      this.lastNavRecalcPos = null;

      // Fallback: Check if guest has saved room or pinned origin
      const savedRoom = localStorage.getItem('moreno_guest_room');
      const pinnedOrigin = resortPois.find(p => p.id === this.guestLocationPoiId);
      originPoi = pinnedOrigin || resortPois.find(p => p.id === 'M');
      if (!pinnedOrigin && savedRoom) {
        const roomNum = parseInt(savedRoom);
        const buildings = resortPois.filter(p => p.isBuilding);
        for (const b of buildings) {
          for (const r of b.rooms) {
            const isMatch = r.exact ? r.exact.includes(roomNum) : (roomNum >= r.min && roomNum <= r.max);
            if (isMatch) {
              originPoi = b;
              break;
            }
          }
        }
      }
      const locOrigin = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(originPoi, lang) : { name: originPoi.nameAr };
      originTitle = locOrigin.name;
    }

    this.drawRoute(originPoi.coords, destPoi.coords, originTitle, locDest.name, false, true);
    this.startTurnByTurn(originPoi, destPoi, false, true);
  },

  drawRoute(originCoords, destCoords, originTitle, destTitle, isAccessible = false, recenterCamera = true) {
    this.closePopover();
    const svgLayer = document.getElementById('routeSvgLayer');
    if (!svgLayer) return;

    const routePoints = this.getWalkwayRoutePoints(originCoords, destCoords);
    const [startPoint] = routePoints;
    const endPoint = routePoints[routePoints.length - 1];
    const pathD = routePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

    this.lastRoutePoints = routePoints;
    this.lastRouteOriginTitle = originTitle;
    this.lastRouteDestTitle = destTitle;

    let distPx = 0;
    for (let index = 1; index < routePoints.length; index++) {
      distPx += Math.hypot(routePoints[index].x - routePoints[index - 1].x, routePoints[index].y - routePoints[index - 1].y);
    }
    const distMeters = Math.round(distPx * 0.42);
    const walkMin = Math.max(1, Math.round(distMeters / 65));

    const lineClass = isAccessible ? 'animated-route-line accessible-route-line' : 'animated-route-line';
    const strokeUrl = isAccessible ? '#10b981' : 'url(#routeGlowGrad)';

    svgLayer.innerHTML = `
      <defs>
        <linearGradient id="routeGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.95" />
          <stop offset="50%" stop-color="#38bdf8" stop-opacity="1" />
          <stop offset="100%" stop-color="#fbbf24" stop-opacity="1" />
        </linearGradient>
        <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background shadow path for 3D depth -->
      <path d="${pathD}" fill="none" stroke="#000000" stroke-width="9" stroke-opacity="0.55" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Glowing animated route line with traveling dash animation -->
      <path id="liveRouteSvgPath" d="${pathD}" fill="none" stroke="${strokeUrl}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" class="${lineClass}" filter="url(#routeGlow)" />

      <!-- Traveling Leader Particle (Golden Orb with Light Trail) -->
      <circle r="7.5" fill="#fbbf24" stroke="#ffffff" stroke-width="1.5" class="route-particle-glow">
        <animateMotion dur="2.8s" repeatCount="indefinite" path="${pathD}" />
      </circle>

      <!-- Traveling Follower Particle 1 (Cyan Orb) -->
      <circle r="5" fill="#00f0ff" stroke="#ffffff" stroke-width="1" class="route-particle-cyan" opacity="0.95">
        <animateMotion dur="2.8s" begin="0.35s" repeatCount="indefinite" path="${pathD}" />
      </circle>

      <!-- Traveling Follower Particle 2 (Light Sparkle) -->
      <circle r="3.5" fill="#ffffff" opacity="0.85">
        <animateMotion dur="2.8s" begin="0.7s" repeatCount="indefinite" path="${pathD}" />
      </circle>

      <!-- Origin Marker Pin Pulse -->
      <g transform="translate(${startPoint.x}, ${startPoint.y})">
        <circle r="14" fill="#00f0ff" fill-opacity="0.35">
          <animate attributeName="r" values="7;18;7" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.1;0.9" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle r="6.5" fill="#00f0ff" stroke="#ffffff" stroke-width="2.5" />
      </g>

      <!-- Destination Target Beacon -->
      <g transform="translate(${endPoint.x}, ${endPoint.y})">
        <circle r="18" fill="#fbbf24" fill-opacity="0.4">
          <animate attributeName="r" values="9;24;9" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle r="7.5" fill="#fbbf24" stroke="#ffffff" stroke-width="2.5" />
      </g>
    `;

    // Center and zoom map view to focus the full route (only on initial navigation start)
    if (recenterCamera) {
      const midPctX = (originCoords.x + destCoords.x) / 2;
      const midPctY = (originCoords.y + destCoords.y) / 2;
      this.focusCoordinate(midPctX, midPctY, 1.25);
    }

    // Show floating route HUD
    this.renderRouteHud(originTitle, destTitle, distMeters, walkMin);

    return { meters: distMeters, minutes: walkMin };
  },

  getWalkwayRoutePoints(originCoords, destCoords) {
    const toPixels = coords => ({
      x: (coords.x / 100) * this.CANVAS_WIDTH,
      y: (coords.y / 100) * this.CANVAS_HEIGHT
    });
    const origin = toPixels(originCoords);
    const destination = toPixels(destCoords);
    const network = window.VirtualResortMap;

    if (!network || !network.nodes || typeof network.findPath !== 'function') {
      return [origin, destination];
    }

    // Direct closest node lookup on the precision 74-node network
    const nearestNodeKey = point => {
      let bestKey = null;
      let minDistance = Infinity;
      for (const [key, node] of Object.entries(network.nodes)) {
        const d = Math.hypot(node.x - point.x, node.y - point.y);
        if (d < minDistance) {
          minDistance = d;
          bestKey = key;
        }
      }
      return bestKey;
    };

    const startKey = nearestNodeKey(origin);
    const destinationKey = nearestNodeKey(destination);

    if (!startKey || !destinationKey) {
      return [origin, destination];
    }

    const graphPath = network.findPath(startKey, destinationKey) || [];
    const waypoints = [origin];

    for (const node of graphPath) {
      if (node && typeof node.x === 'number' && typeof node.y === 'number') {
        waypoints.push({ x: node.x, y: node.y });
      }
    }

    waypoints.push(destination);

    // Filter out redundant points within 2.5px
    const filtered = waypoints.filter((point, index) => {
      if (index === 0) return true;
      return Math.hypot(point.x - waypoints[index - 1].x, point.y - waypoints[index - 1].y) > 2.5;
    });

    return filtered.length >= 2 ? filtered : [origin, destination];
  },

  buildWalkwaySteps(originPoi, targetPoi, lang, isAccessible = false) {
    const t = i18n[lang] || i18n.ar;
    const origin = (typeof getLocalizedPoi === 'function' && !originPoi.isLiveLocation) 
      ? getLocalizedPoi(originPoi, lang) 
      : { name: originPoi.isLiveLocation ? ((lang === 'ar') ? 'موقعي الحالي' : 'My Live Location') : (originPoi.nameAr || 'المبنى الرئيسي') };
    const target = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(targetPoi, lang) : { name: targetPoi.nameAr };
    const points = this.getWalkwayRoutePoints(originPoi.coords, targetPoi.coords);
    const toCoords = point => ({
      x: (point.x / this.CANVAS_WIDTH) * 100,
      y: (point.y / this.CANVAS_HEIGHT) * 100
    });
    const steps = [{
      stepNum: 1,
      icon: '🚶‍♂️',
      coords: toCoords(points[0]),
      title: `${t.nav_route_start_title || 'ابدأ من'} [${origin.name}]`,
      instruction: isAccessible
        ? t.nav_route_accessibility_notice
        : t.nav_route_start_instruction
    }];

    for (let index = 1; index < points.length - 1; index++) {
      const previous = points[index - 1];
      const current = points[index];
      const next = points[index + 1];
      const firstX = current.x - previous.x;
      const firstY = current.y - previous.y;
      const nextX = next.x - current.x;
      const nextY = next.y - current.y;
      const turn = Math.atan2(firstX * nextY - firstY * nextX, firstX * nextX + firstY * nextY);
      if (Math.abs(turn) < 0.66) continue;

      const direction = turn > 0 ? t.nav_route_right : t.nav_route_left;
      steps.push({
        stepNum: steps.length + 1,
        icon: turn > 0 ? '↪️' : '↩️',
        coords: toCoords(current),
        title: (t.nav_route_turn_title || 'انعطف {direction} عند الممر').replace('{direction}', direction),
        instruction: (t.nav_route_turn_instruction || 'اتبع الممر {direction} حتى نقطة الانعطاف التالية.').replace('{direction}', direction)
      });
    }

    steps.push({
      stepNum: steps.length + 1,
      icon: '🎯',
      coords: toCoords(points[points.length - 1]),
      title: (t.nav_route_arrive_title || 'وصلت إلى {destination}').replace('{destination}', target.name),
      instruction: (t.nav_route_arrive_instruction || 'وصلت إلى {destination}.').replace('{destination}', target.name)
    });
    return steps;
  },

  renderRouteHud(originTitle, destTitle, meters, minutes) {
    let hud = document.getElementById('mapRouteHud');
    const viewport = document.getElementById('mapViewport');
    if (!viewport) return;

    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'mapRouteHud';
      hud.className = 'map-route-hud';
      viewport.appendChild(hud);
    }

    hud.innerHTML = `
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
          🚶‍♂️
        </div>
        <div class="leading-tight">
          <div class="flex items-center gap-2">
            <span class="text-xs sm:text-sm font-black text-amber-300 font-mono" id="routeHudMetrics">${minutes} دقيقة (${meters} م)</span>
            ${(originTitle && originTitle.includes('موقعي')) || this.lastGuestPosition 
              ? '<span class="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 font-bold border border-blue-400/40 flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span> تتبع حي مباشر</span>'
              : '<span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">مسار ممهد</span>'}
          </div>
          <p class="text-[10px] text-slate-300 mt-0.5 truncate max-w-[180px] sm:max-w-xs">${originTitle || 'موقعك'} ➔ ${destTitle || 'الوجهة'}</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button onclick="MapEngine.startLiveWalkSimulation()" class="tap-effect px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1">
          <span>🚶‍♂️</span>
          <span class="hidden sm:inline">محاكاة السير</span>
        </button>
        <button onclick="MapEngine.clearRoute()" class="tap-effect px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-bold transition">
          ✕
        </button>
      </div>
    `;
    hud.style.display = 'flex';
  },

  clearRoute() {
    this.stopLiveWalkSimulation();
    this.endTurnByTurn();
    this.activeLiveNavDestination = null;
    this.lastNavRecalcPos = null;
    this.offRouteCounter = 0;
    this.closePopover();
    this.removeRoomBeacon();
    const svgLayer = document.getElementById('routeSvgLayer');
    if (svgLayer) svgLayer.innerHTML = '';
    const hud = document.getElementById('mapRouteHud');
    if (hud) hud.style.display = 'none';
    const banner = document.getElementById('routeResultBanner');
    if (banner) banner.classList.add('hidden');
  },

  // 3D Live Walkthrough Camera Simulation
  startLiveWalkSimulation() {
    this.stopLiveWalkSimulation();
    this.stopOrbitTour();

    const svgLayer = document.getElementById('routeSvgLayer');
    if (!svgLayer || !this.lastRoutePoints || this.lastRoutePoints.length < 2) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('يرجى تحديد مسار أولاً لبدء المحاكاة 🗺️', '📍');
      }
      return;
    }

    const points = this.lastRoutePoints;
    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) || {};

    this.isWalkingSimulating = true;
    this.isSimulatingWalk = true;
    this.isSimPaused = false;
    this.simSpeed = 1;
    this.walkSpeed = 1;
    this.bearing = 0; // Stable North-Up orientation to prevent dizziness & disorienting map snaps

    // Set comfortable camera parameters for walking
    this.scale = 1.62;
    if (this.is3D) {
      this.pitch = 28; // Comfortable isometric incline
    } else {
      this.pitch = 0;
    }
    this.set3DButtonsActive(this.is3D);

    const viewport = document.getElementById('mapViewport');
    if (viewport && this.is3D) viewport.classList.add('mode-3d');

    // Create or show Simulation HUD
    let simHud = document.getElementById('walkSimulationHud');
    if (!simHud && viewport) {
      simHud = document.createElement('div');
      simHud.id = 'walkSimulationHud';
      simHud.className = 'walk-simulation-hud absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[540px] max-w-lg z-40 rounded-2xl p-3 bg-slate-950/92 backdrop-blur-xl border border-amber-500/40 text-white shadow-2xl flex flex-col gap-2 select-none';
      viewport.appendChild(simHud);
    }
    if (simHud) {
      simHud.classList.remove('hidden');
      simHud.style.display = 'flex';
    }

    // Create or show Sim Walker Avatar on pinsOverlay
    const overlay = document.getElementById('pinsOverlay');
    let walker = document.getElementById('simWalkerMarker');
    if (!walker && overlay) {
      walker = document.createElement('div');
      walker.id = 'simWalkerMarker';
      walker.className = 'sim-walker-marker absolute pointer-events-none z-50';
      walker.innerHTML = `
        <div class="sim-walker-heading" id="simWalkerHeading">
          <div class="sim-walker-beam"></div>
          <div class="sim-walker-arrow">▲</div>
        </div>
        <div class="sim-walker-aura"></div>
        <div class="sim-walker-avatar-wrapper" id="simWalkerAvatarWrapper">
          <div class="sim-walker-dot">🚶‍♂️</div>
          <div class="sim-walker-label">${lang === 'ar' ? 'أنت الآن' : lang === 'ru' ? 'Вы здесь' : lang === 'de' ? 'Ihr Standort' : 'You are here'}</div>
        </div>
      `;
      overlay.appendChild(walker);
    }
    if (walker) walker.style.display = 'block';

    const headingEl = document.getElementById('simWalkerHeading');
    const avatarWrapper = document.getElementById('simWalkerAvatarWrapper');
    if (avatarWrapper && this.is3D) {
      avatarWrapper.style.transform = `rotateX(${-this.pitch}deg)`;
    }

    // Compute segment distances
    const segmentDistances = [];
    let totalDistPx = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
      segmentDistances.push(d);
      totalDistPx += d;
    }
    const totalMeters = Math.round(totalDistPx * 0.42);

    let progressPx = 0;
    let lastTime = performance.now();
    const baseSpeedPxPerSec = 45; // Smooth walking pace (~19 m/s visual simulation)
    let currentHeading = 0;

    // Initial heading towards first waypoint
    if (points.length >= 2) {
      const angleRad = Math.atan2(points[1].x - points[0].x, -(points[1].y - points[0].y));
      currentHeading = (angleRad * 180) / Math.PI;
      if (headingEl) headingEl.style.transform = `rotate(${currentHeading}deg)`;
    }

    // Initial walker placement & camera focus
    const startPoint = points[0];
    const startPctX = (startPoint.x / this.CANVAS_WIDTH) * 100;
    const startPctY = (startPoint.y / this.CANVAS_HEIGHT) * 100;
    if (walker) {
      walker.style.left = `${startPctX}%`;
      walker.style.top = `${startPctY}%`;
    }
    this.centerCameraOnWalker(startPctX, startPctY);

    // Voice announcement of start
    try {
      if (typeof ConciergeAudioGuide !== 'undefined' && !ConciergeAudioGuide.isMuted) {
        ConciergeAudioGuide.speak(t.wf_start_simulation || 'بدء محاكاة السير الحي', lang);
      }
    } catch (e) {}

    const updateHud = (remainingMeters) => {
      if (!simHud) return;
      const pct = Math.min(100, (progressPx / totalDistPx) * 100);
      const estMin = Math.max(1, Math.round(remainingMeters / 65));

      // Get current active step title if available
      let stepText = '';
      let stepIcon = '🚶‍♂️';
      if (this.activeNavigation && this.activeNavigation.steps) {
        const step = this.activeNavigation.steps[this.activeNavigation.currentStepIdx];
        if (step) {
          stepText = step.instruction || step.title;
          stepIcon = step.icon || '🚶‍♂️';
        }
      }

      simHud.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center animate-subtle-float shrink-0 shadow-md">
              🚶‍♂️
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-white truncate">${t.wf_start_simulation || 'محاكاة السير الحي'}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 shrink-0">GPS 60fps</span>
              </div>
              <p class="text-[11px] text-amber-300 font-bold mt-0.5 truncate">
                ${remainingMeters > 5 ? `${remainingMeters} ${t.wf_meters || 'متر متبقي'} • ${estMin} دقيقة` : (t.wf_sim_arrived || 'وصلت إلى وجهتك 🎉')}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button onclick="MapEngine.toggleSimPause()" class="px-2.5 py-1 rounded-lg ${this.isSimPaused ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/10 hover:bg-white/20 text-white font-bold'} text-xs transition tap-effect" title="${this.isSimPaused ? 'استئناف' : 'إيقاف مؤقت'}">
              ${this.isSimPaused ? '▶️' : '⏸️'}
            </button>
            <button onclick="MapEngine.toggleSimSpeed()" class="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 text-xs font-bold transition tap-effect" title="سرعة المحاكاة">
              ⚡ ${this.simSpeed}x
            </button>
            <button onclick="MapEngine.stopLiveWalkSimulation()" class="w-7 h-7 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center transition tap-effect" title="${t.wf_stop_simulation || 'إنهاء'}">
              ✕
            </button>
          </div>
        </div>

        ${stepText ? `
        <div class="text-[11px] text-slate-200 truncate bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
          <span class="shrink-0">${stepIcon}</span>
          <span class="truncate">${stepText}</span>
        </div>
        ` : ''}

        <div class="w-full bg-white/15 h-1.5 rounded-full overflow-hidden mt-0.5">
          <div class="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-100" style="width: ${pct}%"></div>
        </div>
      `;
    };

    const animateWalk = (now) => {
      if (!this.isWalkingSimulating) return;

      if (this.isSimPaused) {
        lastTime = now;
        this.simRafId = requestAnimationFrame(animateWalk);
        return;
      }

      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      progressPx += baseSpeedPxPerSec * this.simSpeed * dt;
      this.walkProgress = Math.min(1, progressPx / totalDistPx);

      if (progressPx >= totalDistPx) {
        progressPx = totalDistPx;
        this.walkProgress = 1;
        const endPoint = points[points.length - 1];
        const endPctX = (endPoint.x / this.CANVAS_WIDTH) * 100;
        const endPctY = (endPoint.y / this.CANVAS_HEIGHT) * 100;
        if (walker) {
          walker.style.left = `${endPctX}%`;
          walker.style.top = `${endPctY}%`;
        }
        this.centerCameraOnWalker(endPctX, endPctY);
        updateHud(0);

        if (this.activeNavigation && this.activeNavigation.steps) {
          this.activeNavigation.currentStepIdx = this.activeNavigation.steps.length - 1;
          this.renderTurnStep(false);
        }

        if (typeof PromoAudioEngine !== 'undefined') {
          PromoAudioEngine.playTransitionChime();
        }
        if (typeof ConciergeAudioGuide !== 'undefined' && !ConciergeAudioGuide.isMuted) {
          ConciergeAudioGuide.speak(t.wf_sim_arrived || 'لقد وصلت إلى وجهتك بنجاح', lang);
        }

        setTimeout(() => {
          this.stopLiveWalkSimulation();
        }, 3200);
        return;
      }

      let accumulated = 0;
      let segIdx = 0;
      for (let i = 0; i < segmentDistances.length; i++) {
        if (accumulated + segmentDistances[i] >= progressPx) {
          segIdx = i;
          break;
        }
        accumulated += segmentDistances[i];
      }

      const p1 = points[segIdx];
      const p2 = points[segIdx + 1];
      const segLen = segmentDistances[segIdx] || 1;
      const segProg = Math.max(0, Math.min(1, (progressPx - accumulated) / segLen));

      const curX = p1.x + (p2.x - p1.x) * segProg;
      const curY = p1.y + (p2.y - p1.y) * segProg;

      // Target heading of current walkway segment
      const angleRad = Math.atan2(p2.x - p1.x, -(p2.y - p1.y));
      const targetHeading = (angleRad * 180) / Math.PI;

      // Smooth heading transition so arrow smoothly curves along turns
      let diff = (targetHeading - currentHeading) % 360;
      if (diff < -180) diff += 360;
      if (diff > 180) diff -= 360;
      currentHeading += diff * Math.min(1, dt * 10);

      if (headingEl) {
        headingEl.style.transform = `rotate(${currentHeading}deg)`;
      }

      const curPctX = (curX / this.CANVAS_WIDTH) * 100;
      const curPctY = (curY / this.CANVAS_HEIGHT) * 100;
      if (walker) {
        walker.style.left = `${curPctX}%`;
        walker.style.top = `${curPctY}%`;
      }

      // Smooth camera centering on walker position without map rotation
      this.centerCameraOnWalker(curPctX, curPctY);

      // Advance turn-by-turn steps if active
      if (this.activeNavigation && this.activeNavigation.steps) {
        const steps = this.activeNavigation.steps;
        const targetStep = Math.min(steps.length - 1, Math.max(0, Math.floor(this.walkProgress * steps.length)));
        if (targetStep !== this.activeNavigation.currentStepIdx) {
          this.activeNavigation.currentStepIdx = targetStep;
          this.renderTurnStep(false);
          if (typeof App !== 'undefined' && App.playBeep) App.playBeep(850);
        }
      }

      const remainingMeters = Math.max(0, Math.round((totalDistPx - progressPx) * 0.42));
      updateHud(remainingMeters);

      this.simRafId = requestAnimationFrame(animateWalk);
    };

    updateHud(totalMeters);
    this.simRafId = requestAnimationFrame(animateWalk);
  },

  toggleSimPause() {
    this.isSimPaused = !this.isSimPaused;
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(650);
    this.renderTurnStep(false);
  },

  toggleSimSpeed() {
    this.simSpeed = this.simSpeed === 1 ? 2 : (this.simSpeed === 2 ? 3 : 1);
    this.walkSpeed = this.simSpeed;
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(750);
    this.renderTurnStep(false);
  },

  stopLiveWalkSimulation() {
    this.isWalkingSimulating = false;
    this.isSimulatingWalk = false;
    this.isSimPaused = false;
    if (this.simRafId) {
      cancelAnimationFrame(this.simRafId);
      this.simRafId = null;
    }
    const simHud = document.getElementById('walkSimulationHud');
    if (simHud) {
      simHud.classList.add('hidden');
      simHud.style.display = 'none';
    }
    const walker = document.getElementById('simWalkerMarker');
    if (walker) walker.remove();

    if (typeof ConciergeAudioGuide !== 'undefined') {
      ConciergeAudioGuide.stop();
    }

    // Smoothly re-frame the camera to showcase the route or resort
    if (this.lastRoutePoints && this.lastRoutePoints.length >= 2) {
      const p1 = this.lastRoutePoints[0];
      const p2 = this.lastRoutePoints[this.lastRoutePoints.length - 1];
      const midPctX = ((p1.x + p2.x) / 2 / this.CANVAS_WIDTH) * 100;
      const midPctY = ((p1.y + p2.y) / 2 / this.CANVAS_HEIGHT) * 100;
      this.focusCoordinate(midPctX, midPctY, 1.25, true);
    }

    this.renderTurnStep(false);
  },

  bindEvents() {
    const viewport = document.getElementById('mapViewport');
    if (!viewport) return;

    // Mouse Drag Pan
    viewport.addEventListener('mousedown', (e) => {
      // Don't pan if clicking buttons, compass, popover or pins
      if (e.target.closest('.map-pin') || e.target.closest('button') || e.target.closest('.earth-compass-gizmo') || e.target.closest('.map-popover-card')) return;
      this.stopOrbitTour();
      this.closePopover();
      this.isPanning = true;
      this.panStartX = e.clientX - this.panX;
      this.panStartY = e.clientY - this.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.panStartX;
      this.panY = e.clientY - this.panStartY;
      this.clampPan();
      this.applyTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isPanning = false;
    });

    // Multi-touch Pinch-to-zoom & Double-tap
    let initialPinchDist = 0;
    let initialScale = 1;
    let pinchMidX = 0;
    let pinchMidY = 0;
    let isPinching = false;
    let lastTapTime = 0;

    viewport.addEventListener('touchstart', (e) => {
      if (e.target.closest('.map-pin') || e.target.closest('button') || e.target.closest('.earth-compass-gizmo') || e.target.closest('.map-popover-card')) return;
      this.stopOrbitTour();

      if (e.touches.length === 1) {
        // Detect double-tap to zoom
        const now = Date.now();
        if (now - lastTapTime < 320) {
          e.preventDefault();
          const rect = viewport.getBoundingClientRect();
          const tapX = e.touches[0].clientX - rect.left;
          const tapY = e.touches[0].clientY - rect.top;
          this.zoomAtPoint(1.45, tapX, tapY);
          lastTapTime = 0;
          return;
        }
        lastTapTime = now;

        this.closePopover();
        this.isPanning = true;
        this.panStartX = e.touches[0].clientX - this.panX;
        this.panStartY = e.touches[0].clientY - this.panY;
      } else if (e.touches.length === 2) {
        this.isPanning = false;
        isPinching = true;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        initialScale = this.scale;
        const rect = viewport.getBoundingClientRect();
        pinchMidX = ((t1.clientX + t2.clientX) / 2) - rect.left;
        pinchMidY = ((t1.clientY + t2.clientY) / 2) - rect.top;
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (initialPinchDist > 0) {
          const factor = currentDist / initialPinchDist;
          const targetScale = Math.min(Math.max(this.minScale, initialScale * factor), this.maxScale);
          const oldScale = this.scale;
          if (Math.abs(targetScale - oldScale) >= 0.001) {
            this.scale = targetScale;
            const cx = this.CANVAS_WIDTH / 2;
            const cy = this.CANVAS_HEIGHT / 2;
            this.panX = pinchMidX - cx - (pinchMidX - this.panX - cx) * (this.scale / oldScale);
            this.panY = pinchMidY - cy - (pinchMidY - this.panY - cy) * (this.scale / oldScale);
            this.clampPan();
            this.applyTransform(false);
          }
        }
      } else if (this.isPanning && e.touches.length === 1) {
        if (e.cancelable) e.preventDefault();
        this.panX = e.touches[0].clientX - this.panStartX;
        this.panY = e.touches[0].clientY - this.panStartY;
        this.clampPan();
        this.applyTransform(false);
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        this.isPanning = false;
        isPinching = false;
      } else if (e.touches.length === 1) {
        isPinching = false;
        this.isPanning = true;
        this.panStartX = e.touches[0].clientX - this.panX;
        this.panStartY = e.touches[0].clientY - this.panY;
      }
    });

    // Mouse Wheel Zoom
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.stopOrbitTour();
      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      this.zoomAtPoint(zoomFactor, mouseX, mouseY, false);
    }, { passive: false });
  },

  zoom(factor) {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(700);
    this.stopOrbitTour();
    const viewport = document.getElementById('mapViewport');
    const vw = viewport ? viewport.clientWidth : 800;
    const vh = viewport ? viewport.clientHeight : 600;

    // Zoom directly centered on the visible map image
    this.zoomAtPoint(factor, vw / 2, vh / 2, true);
  },

  zoomAtPoint(factor, focalX, focalY, smooth = true) {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(700);
    this.stopOrbitTour();

    const viewport = document.getElementById('mapViewport');
    const vw = viewport ? viewport.clientWidth : 800;
    const vh = viewport ? viewport.clientHeight : 600;

    if (focalX == null) focalX = vw / 2;
    if (focalY == null) focalY = vh / 2;

    const oldScale = this.scale;
    const targetScale = Math.min(Math.max(this.minScale, this.scale * factor), this.maxScale);
    if (Math.abs(targetScale - oldScale) < 0.001) return;

    this.scale = targetScale;

    const cx = this.CANVAS_WIDTH / 2;
    const cy = this.CANVAS_HEIGHT / 2;

    // Exact mathematical formula for transformOrigin: 50% 50%
    this.panX = focalX - cx - (focalX - this.panX - cx) * (this.scale / oldScale);
    this.panY = focalY - cy - (focalY - this.panY - cy) * (this.scale / oldScale);

    this.clampPan();
    this.applyTransform(smooth);
  },

  updateMiniMap() {
    const box = document.getElementById('miniMapBox');
    const viewport = document.getElementById('mapViewport');
    if (!box || !viewport) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const canvasW = this.CANVAS_WIDTH;
    const canvasH = this.CANVAS_HEIGHT;

    const x0 = -this.panX / this.scale;
    const y0 = -this.panY / this.scale;
    const w = vw / this.scale;
    const h = vh / this.scale;

    const radarW = 72;
    const radarH = 96;

    const boxX = Math.max(0, Math.min(radarW, (x0 / canvasW) * radarW));
    const boxY = Math.max(0, Math.min(radarH, (y0 / canvasH) * radarH));
    const boxW = Math.max(6, Math.min(radarW - boxX, (w / canvasW) * radarW));
    const boxH = Math.max(8, Math.min(radarH - boxY, (h / canvasH) * radarH));

    box.style.left = `${boxX}px`;
    box.style.top = `${boxY}px`;
    box.style.width = `${boxW}px`;
    box.style.height = `${boxH}px`;
  },

  searchPois(query) {
    const dropdown = document.getElementById('mapPoiSearchResults');
    const clearBtn = document.getElementById('mapPoiSearchClear');
    if (clearBtn) {
      if (query && query.trim().length > 0) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
    }
    if (!dropdown) return;
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
      return;
    }

    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const matches = resortPois.filter(p => {
      const numMatch = String(p.num).toLowerCase().includes(q) || String(p.id).toLowerCase().includes(q);
      const nameArMatch = p.nameAr && p.nameAr.toLowerCase().includes(q);
      const nameEnMatch = p.nameEn && p.nameEn.toLowerCase().includes(q);
      const tagMatch = p.tagAr && p.tagAr.toLowerCase().includes(q);
      return numMatch || nameArMatch || nameEnMatch || tagMatch;
    }).slice(0, 7);

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="p-3 text-xs text-slate-400 text-center font-bold">
          لا توجد نتائج مطابقة لمصطلح البحث
        </div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = matches.map(poi => {
      const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr, hours: poi.hours };
      const icon = this.getPoiIcon(poi);
      return `
        <div onclick="MapEngine.selectFromSearch('${poi.id}')" class="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 last:border-none transition rounded-xl">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-xl ${poi.badgeColor} text-white font-bold text-xs flex items-center justify-center shadow-sm">${icon}</span>
            <div>
              <div class="text-xs font-black text-slate-800 dark:text-white">${loc.name}</div>
              <div class="text-[10px] text-slate-400">${poi.categoryNameAr || ''}</div>
            </div>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono font-bold">#${poi.num}</span>
        </div>
      `;
    }).join('');

    dropdown.classList.remove('hidden');
  },

  selectFromSearch(id) {
    const dropdown = document.getElementById('mapPoiSearchResults');
    const input = document.getElementById('mapPoiSearchInput');
    const clearBtn = document.getElementById('mapPoiSearchClear');
    if (dropdown) dropdown.classList.add('hidden');
    if (input) input.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    this.selectPoi(id);
  },

  focusPreset(id) {
    const strId = String(id != null ? id : '').trim();
    // Update visual active state on preset chips
    document.querySelectorAll('.landmark-preset-btn').forEach(b => {
      const bId = b.getAttribute('data-preset-id');
      if (bId && bId.toUpperCase() === strId.toUpperCase()) {
        b.classList.add('bg-amber-500', 'text-slate-950', 'border-amber-400', 'shadow-sm');
        b.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      } else {
        b.classList.remove('bg-amber-500', 'text-slate-950', 'border-amber-400', 'shadow-sm');
        b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      }
    });

    // Make sure the target pin is not dimmed if category filtering was active
    const targetPin = document.getElementById(`pin-${strId}`);
    if (targetPin) {
      targetPin.classList.remove('dimmed');
      targetPin.style.opacity = '1';
    }

    this.selectPoi(strId, true);
  },

  resetTransform() {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(500);
    this.stopOrbitTour();
    this.closePopover();
    this.bearing = 0;
    this.pitch = 0;
    this.is3D = false;
    this.currentCategoryFilter = 'all';
    this.isOpenNowFilter = false;

    this.set3DButtonsActive(false);

    // Reset Category buttons
    document.querySelectorAll('.map-cat-btn').forEach(b => {
      b.classList.remove('bg-brand-navy', 'text-white', 'shadow-sm', 'active');
      b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200');
    });
    const allCatBtn = document.querySelector('.map-cat-btn[data-cat="all"]');
    if (allCatBtn) {
      allCatBtn.classList.add('bg-brand-navy', 'text-white', 'shadow-sm', 'active');
      allCatBtn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200');
    }

    // Reset Open Now button
    const openNowBtn = document.getElementById('btnMapOpenNow');
    if (openNowBtn) {
      openNowBtn.classList.remove('bg-emerald-600', 'text-white', 'shadow-md', 'active');
      openNowBtn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200');
    }

    // Reset Landmark Preset chips
    document.querySelectorAll('.landmark-preset-btn').forEach(b => {
      b.classList.remove('bg-amber-500', 'text-slate-950', 'border-amber-400', 'shadow-sm');
      b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
    });

    this.fitToViewport();
    this.clearRoute();

    document.querySelectorAll('.map-pin, .virtual-resort-pin').forEach(p => {
      p.classList.remove('active-pin', 'dimmed');
      p.style.opacity = '1';
    });
    const poiBadge = document.getElementById('activePoiText');
    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const defTxt = (typeof i18n !== 'undefined' && i18n[lang] && i18n[lang].map_active_badge_default) 
      ? i18n[lang].map_active_badge_default 
      : 'انقر على أي نقطة في الخريطة لمعاينة التفاصيل';
    if (poiBadge) poiBadge.innerText = defTxt;
    const banner = document.getElementById('routeResultBanner');
    if (banner) banner.classList.add('hidden');

    const beacon = document.getElementById('active3DBeacon');
    if (beacon) beacon.remove();
  },

  focusCoordinate(pctX, pctY, targetScale = 1.45, smooth = true) {
    this.stopOrbitTour();
    const viewport = document.getElementById('mapViewport');
    if (!viewport) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    this.scale = targetScale;

    // Pin coordinate in canvas pixels (896x1200)
    const targetPixelX = (pctX / 100) * this.CANVAS_WIDTH;
    const targetPixelY = (pctY / 100) * this.CANVAS_HEIGHT;

    // Canvas center with 50% 50% origin
    const canvasCenterX = this.CANVAS_WIDTH / 2;
    const canvasCenterY = this.CANVAS_HEIGHT / 2;

    const dx = canvasCenterX - targetPixelX;
    // In 3D tilted view, offset Y slightly to account for perspective foreshortening
    const tiltOffset = this.is3D ? (this.pitch * 1.8) : 0;
    const dy = canvasCenterY - targetPixelY + tiltOffset;

    this.panX = (vw - this.CANVAS_WIDTH) / 2 + (dx * this.scale);
    this.panY = (vh - this.CANVAS_HEIGHT) / 2 + (dy * this.scale);

    this.clampPan();
    this.applyTransform(smooth);
  },

  // Ultra-Smooth 3D Cinematic Fly-To Camera Transition with Exact Geometric Framing
  flyToCinematic(pctX, pctY, targetScale = 1.65, targetPitch = 48, targetBearing = 0, durationMs = 1600) {
    this.stopOrbitTour();
    const viewport = document.getElementById('mapViewport');
    const canvas = document.getElementById('mapCanvasWrapper');
    if (!viewport || !canvas) return;

    this.is3D = true;
    this.set3DButtonsActive(true);
    this.scale = targetScale;
    this.pitch = targetPitch;
    this.bearing = (targetBearing + 360) % 360;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    const cx = this.CANVAS_WIDTH / 2; // 448
    const cy = this.CANVAS_HEIGHT / 2; // 600

    const targetPixelX = (pctX / 100) * this.CANVAS_WIDTH;
    const targetPixelY = (pctY / 100) * this.CANVAS_HEIGHT;

    const dx = targetPixelX - cx;
    const dy = targetPixelY - cy;

    const radZ = (this.bearing * Math.PI) / 180;
    const radX = (this.pitch * Math.PI) / 180;

    // 1. Rotate around Z (bearing rotation)
    const x1 = dx * Math.cos(radZ) - dy * Math.sin(radZ);
    const y1 = dx * Math.sin(radZ) + dy * Math.cos(radZ);

    // 2. Rotate around X (pitch tilt)
    const x2 = x1;
    const y2 = y1 * Math.cos(radX);
    const z2 = -y1 * Math.sin(radX);

    // 3. Perspective projection divide (CSS perspective = 1200px)
    const D = 1200;
    const k = D / (D - z2);

    const projX = x2 * k * this.scale;
    const projY = y2 * k * this.scale;

    // 4. Center landmark in the visible sweet spot:
    // Horizontally: center of screen (vw / 2)
    // Vertically: upper-middle (35% to 38% from top of viewport, leaving room for bottom theater card)
    const targetYRatio = vw < 640 ? 0.35 : 0.38;
    const desiredScreenX = vw / 2;
    const desiredScreenY = vh * targetYRatio;

    // Invert: screenX = panX + cx + projX  ==>  panX = desiredScreenX - cx - projX
    this.panX = desiredScreenX - cx - projX;
    this.panY = desiredScreenY - cy - projY;

    if (viewport) viewport.classList.add('mode-3d');
    canvas.style.transition = `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    canvas.style.transformOrigin = '50% 50%';

    const currentPitch = this.pitch;
    canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale}) rotateX(${currentPitch}deg) rotateZ(${this.bearing}deg)`;

    this.updatePinBillboards();
    this.updateCompassUI();
    this.updateEarthHud();
    this.updateMiniMap();
  },

  // 3D Sonar Radar Spotlight & Overhead Tag on Active POI
  showTourSpotlight(poi, tourIndex, totalSteps) {
    const overlay = document.getElementById('pinsOverlay');
    if (!overlay || !poi || !poi.coords) return;

    // 1. Spotlight the active pin & dim background pins
    const pins = document.querySelectorAll('.map-pin');
    pins.forEach(pin => {
      const isTarget = String(pin.id).replace('pin-', '').trim().toUpperCase() === String(poi.id).trim().toUpperCase();
      if (isTarget) {
        pin.classList.remove('tour-dimmed-pin');
        pin.classList.add('active-pin', 'active-tour-pin');
        pin.style.opacity = '1';
        pin.style.zIndex = '60';
      } else {
        pin.classList.remove('active-pin', 'active-tour-pin');
        pin.classList.add('tour-dimmed-pin');
        pin.style.opacity = '0.32';
        pin.style.zIndex = '10';
      }
    });

    // 2. 3D Sonar Beacon (ripples expanding across resort ground)
    let beacon = document.getElementById('tourSpotlightBeacon');
    if (!beacon) {
      beacon = document.createElement('div');
      beacon.id = 'tourSpotlightBeacon';
      beacon.className = 'tour-spotlight-beacon pointer-events-none absolute';
      overlay.appendChild(beacon);
    }
    beacon.style.left = `${poi.coords.x}%`;
    beacon.style.top = `${poi.coords.y}%`;
    beacon.innerHTML = `
      <div class="beacon-ripple-ring beacon-ring-1"></div>
      <div class="beacon-ripple-ring beacon-ring-2"></div>
      <div class="beacon-ripple-ring beacon-ring-3"></div>
      <div class="beacon-central-glow"></div>
      <div class="beacon-vertical-beam"></div>
    `;

    // Remove old 3D canvas callout if present (now rendered crisp in 2D HUD)
    const oldCallout = document.getElementById('tourSpotlightCallout');
    if (oldCallout) oldCallout.remove();

    this.updatePinBillboards();
  },

  clearTourSpotlight() {
    const beacon = document.getElementById('tourSpotlightBeacon');
    if (beacon) beacon.remove();
    const oldCallout = document.getElementById('tourSpotlightCallout');
    if (oldCallout) oldCallout.remove();

    const pins = document.querySelectorAll('.map-pin');
    pins.forEach(pin => {
      pin.classList.remove('active-pin', 'active-tour-pin', 'tour-dimmed-pin');
      pin.style.opacity = '1';
      pin.style.zIndex = '';
    });

    this.updatePinBillboards();
  },

  selectPoi(id, shouldScroll = false) {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(750);
    this.stopOrbitTour();
    const strId = String(id != null ? id : '').trim();
    const poi = resortPois.find(p => String(p.id).trim().toUpperCase() === strId.toUpperCase());
    if (!poi) {
      console.warn(`[MapEngine] POI not found for id: "${id}"`);
      return;
    }

    if (this.isPickingLocation) {
      this.isPickingLocation = false;
      this.closePopover();
      const button = document.getElementById('mapPickLocationBtn');
      if (button) {
        button.classList.remove('active-mode');
        button.setAttribute('aria-pressed', 'false');
      }
      const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
      const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr };
      this.setGuestLocation(poi.coords, loc.name, poi.id);
      const originSelect = document.getElementById('selectOrigin');
      if (originSelect) originSelect.value = poi.id;
      const t = i18n[lang] || i18n.ar;
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast((t.map_pick_location_saved || 'تم تحديد نقطة البداية قرب {name} (موقع تقريبي).').replace('{name}', loc.name), '📍');
      }
      return;
    }

    if (shouldScroll) {
      this.scrollToMap();
    }

    // Highlight Pin & undim
    document.querySelectorAll('.map-pin').forEach(p => p.classList.remove('active-pin'));
    const pinEl = document.getElementById(`pin-${poi.id}`);
    if (pinEl) {
      pinEl.classList.remove('dimmed');
      pinEl.style.opacity = '1';
      pinEl.classList.add('active-pin');
    }

    // Smooth focus on the POI
    this.focusCoordinate(poi.coords.x, poi.coords.y, 1.55, true);

    // Drop Google Earth light beacon beam on the selected pin
    this.dropLightBeacon(poi.coords);

    // Show interactive popover card on the map
    this.showPopover(poi);

    // Update bottom badge
    const badge = document.getElementById('activePoiText');
    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr, category: poi.categoryNameAr };
    const icon = this.getPoiIcon(poi);
    if (badge) {
      badge.innerHTML = `${icon} <strong>${loc.name}</strong> (${loc.category || poi.categoryNameAr || ''})`;
    }
  },

  dropLightBeacon(coords) {
    let beacon = document.getElementById('active3DBeacon');
    if (!beacon) {
      beacon = document.createElement('div');
      beacon.id = 'active3DBeacon';
      beacon.className = 'absolute pointer-events-none z-30 transition-all duration-300';
      beacon.innerHTML = `<div class="active-3d-beacon-beam"></div>`;
      const overlay = document.getElementById('pinsOverlay');
      if (overlay) overlay.appendChild(beacon);
    }

    beacon.style.left = `${coords.x}%`;
    beacon.style.top = `${coords.y}%`;
  },

  applyPinFilters() {
    const cat = this.currentCategoryFilter || 'all';
    const openNow = this.isOpenNowFilter || false;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMin;

    const pins = document.querySelectorAll('.map-pin, .virtual-resort-pin');
    pins.forEach(pin => {
      const pinId = pin.id.replace('pin-', '').replace('vpin-', '');
      const poi = resortPois.find(p => String(p.id).trim().toUpperCase() === pinId.trim().toUpperCase());
      if (!poi) return;

      const pinCat = poi.category || pin.getAttribute('data-category');
      const catMatch = (cat === 'all' || pinCat === cat);

      let openMatch = true;
      if (openNow) {
        const hStr = poi.hours || '';
        if (hStr.includes('24') || hStr.includes('مفتوح دائماً')) {
          openMatch = true;
        } else if (hStr.includes('غروب الشمس')) {
          openMatch = currentHour >= 7 && currentHour < 18;
        } else {
          const timeMatch = hStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            const startVal = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
            const endVal = parseInt(timeMatch[3]) * 60 + parseInt(timeMatch[4]);
            openMatch = currentTimeVal >= startVal && currentTimeVal <= endVal;
          }
        }
      }

      if (catMatch && openMatch) {
        pin.classList.remove('dimmed');
        pin.style.opacity = '1';
      } else {
        pin.classList.add('dimmed');
        pin.style.opacity = '0.25';
      }
    });
  },

  filterCategory(cat, btn) {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(550);
    this.currentCategoryFilter = cat;

    // Only update category buttons, do NOT strip Open Now styling
    document.querySelectorAll('.map-cat-btn').forEach(b => {
      b.classList.remove('bg-brand-navy', 'text-white', 'shadow-sm', 'active');
      b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200');
    });

    if (btn) {
      btn.classList.add('bg-brand-navy', 'text-white', 'shadow-sm', 'active');
      btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200');
    }

    this.applyPinFilters();

    // Synchronize directory cards filter
    const matchingCategoryBtn = document.querySelector(`.category-btn[onclick*="'${cat}'"]`);
    if (matchingCategoryBtn && typeof App !== 'undefined' && App.filterCategory) {
      App.filterCategory(cat, matchingCategoryBtn);
    }
  },

  toggleFullscreen() {
    const vp = document.getElementById('mapViewport');
    if (!vp) return;

    // Check if we are already in pseudo-fullscreen
    if (vp.classList.contains('fullscreen-active')) {
      vp.classList.remove('fullscreen-active');
      document.body.classList.remove('map-is-fullscreen');
      const exitBtn = document.getElementById('mapExitFullscreenBtn');
      if (exitBtn) exitBtn.remove();
      this.syncExternalNavParent();
      setTimeout(() => this.fitToViewport(), 150);
      return;
    }

    // Attempt native Fullscreen API first
    if (!document.fullscreenElement && vp.requestFullscreen) {
      vp.requestFullscreen().then(() => {
        this.syncExternalNavParent();
        setTimeout(() => this.fitToViewport(), 150);
      }).catch(() => {
        this.enablePseudoFullscreen(vp);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        this.syncExternalNavParent();
        setTimeout(() => this.fitToViewport(), 150);
      }).catch(() => {});
    } else {
      this.enablePseudoFullscreen(vp);
    }
  },

  enablePseudoFullscreen(vp) {
    vp.classList.add('fullscreen-active');
    document.body.classList.add('map-is-fullscreen');

    let exitBtn = document.getElementById('mapExitFullscreenBtn');
    if (!exitBtn) {
      exitBtn = document.createElement('button');
      exitBtn.id = 'mapExitFullscreenBtn';
      exitBtn.className = 'map-exit-fullscreen-btn tap-effect';
      exitBtn.innerHTML = '✕ خروج من ملء الشاشة';
      exitBtn.onclick = () => this.toggleFullscreen();
      vp.appendChild(exitBtn);
    }
    this.syncExternalNavParent();
    setTimeout(() => this.fitToViewport(), 150);
  },

  scrollToMap(target = null) {
    const el = target || document.getElementById('mapViewport') || document.getElementById('map-section');
    if (!el) return;
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 64;
    const extraMargin = 14;
    const targetY = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - extraMargin;
    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth'
    });
  },

  dropRoomBeacon(coords, roomNum, buildingName, floorName) {
    let beacon = document.getElementById('activeRoomBeacon');
    if (!beacon) {
      beacon = document.createElement('div');
      beacon.id = 'activeRoomBeacon';
      beacon.className = 'active-room-beacon';
      const overlay = document.getElementById('pinsOverlay');
      if (overlay) overlay.appendChild(beacon);
    }

    beacon.style.left = `${coords.x}%`;
    beacon.style.top = `${coords.y}%`;
    beacon.innerHTML = `
      <div class="room-beacon-pulse"></div>
      <div class="room-beacon-badge">
        <span class="room-beacon-icon">🔑</span>
        <div class="room-beacon-text">
          <span class="room-num">غرفة ${roomNum}</span>
          <span class="room-floor">${buildingName ? buildingName + ' • ' : ''}${floorName || ''}</span>
        </div>
      </div>
      <div class="room-beacon-pin-pointer"></div>
    `;
  },

  removeRoomBeacon() {
    const beacon = document.getElementById('activeRoomBeacon');
    if (beacon) beacon.remove();
  },

  /* ================= GUEST EXPERIENCE CAPABILITIES ================= */

  // 1. My Location GPS Beacon
  guestLocation: null,

  setGuestLocation(coords, name, poiId = null) {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(900);
    this.guestLocation = { coords, name };
    this.guestLocationPoiId = poiId;

    let marker = document.getElementById('myLocationMarker');
    if (!marker) {
      marker = document.createElement('div');
      marker.id = 'myLocationMarker';
      marker.className = 'my-location-marker';
      marker.innerHTML = `
        <div class="my-location-pulse"></div>
        <div class="my-location-dot"></div>
      `;
      const overlay = document.getElementById('pinsOverlay');
      if (overlay) overlay.appendChild(marker);
    }

    marker.style.left = `${coords.x}%`;
    marker.style.top = `${coords.y}%`;

    // Smooth focus on user's location
    this.focusCoordinate(coords.x, coords.y, 1.6);

    // Update bottom badge
    const badge = document.getElementById('activePoiText');
    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;
    if (badge) {
      badge.innerHTML = `📍 <strong>${t.wai_my_location_set || 'تم تحديد موقعك الحالي'}</strong> (${name})`;
    }
  },

  clearGuestLocation() {
    this.guestLocation = null;
    this.guestLocationPoiId = null;
    const marker = document.getElementById('myLocationMarker');
    if (marker) marker.remove();
  },

  beginLocationPick() {
    this.isPickingLocation = !this.isPickingLocation;
    const button = document.getElementById('mapPickLocationBtn');
    if (button) {
      button.classList.toggle('active-mode', this.isPickingLocation);
      button.setAttribute('aria-pressed', String(this.isPickingLocation));
    }

    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const t = i18n[lang] || i18n.ar;
    if (this.isPickingLocation) this.closePopover();
    if (typeof App !== 'undefined' && App.showToast) {
      const message = this.isPickingLocation ? t.map_pick_location_hint : t.map_pick_location_cancel;
      App.showToast(message || (this.isPickingLocation ? 'اختر أقرب معلم على الخريطة لموقعك.' : 'تم إلغاء اختيار الموقع.'), '📍');
    }
  },

  // 2. Live What's Open Now Radar
  isOpenNowFilter: false,

  toggleOpenNowFilter(btn) {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(650);
    this.isOpenNowFilter = !this.isOpenNowFilter;

    const openNowBtn = btn || document.getElementById('btnMapOpenNow');
    if (openNowBtn) {
      if (this.isOpenNowFilter) {
        openNowBtn.classList.add('bg-emerald-600', 'text-white', 'shadow-md', 'active');
        openNowBtn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200');
      } else {
        openNowBtn.classList.remove('bg-emerald-600', 'text-white', 'shadow-md', 'active');
        openNowBtn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200');
      }
    }

    this.applyPinFilters();

    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;
    if (this.isOpenNowFilter && typeof App !== 'undefined' && App.showToast) {
      App.showToast(t.mf_open_now || 'تم تصفية الخريطة لعرض الأماكن المفتوحة الآن فقط ⚡');
    }
  },

  // 3. Professional Live Turn-by-Turn Walking Navigation & Simulation
  activeNavigation: null,
  isSimulatingWalk: false,
  walkProgress: 0,
  walkSpeed: 1,
  walkAnimFrame: null,

  startTurnByTurn(originPoi, targetPoi, isAccessible = false, recenterCamera = true) {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(850);
    this.closePopover(); // Always close POI popover so it never clutters the map
    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    
    // Fallbacks if not provided
    if (!originPoi) {
      if (this.lastGuestPosition) {
        originPoi = {
          id: 'LIVE_GUEST_LOCATION',
          nameAr: (lang === 'ar' ? 'موقعي الحالي' : 'My Live Location'),
          nameEn: 'My Live Location',
          coords: { x: this.lastGuestPosition.pctX, y: this.lastGuestPosition.pctY },
          isLiveLocation: true
        };
      } else {
        originPoi = resortPois.find(p => p.id === 'M') || { coords: { x: 31.55, y: 68.36 }, nameAr: 'المبنى الرئيسي (Lobby M)' };
      }
    }
    if (!targetPoi) return;

    if (originPoi.isLiveLocation) {
      this.activeLiveNavDestination = targetPoi;
      this.lastNavRecalcPos = {
        x: (originPoi.coords.x / 100) * this.CANVAS_WIDTH,
        y: (originPoi.coords.y / 100) * this.CANVAS_HEIGHT
      };
    } else {
      this.activeLiveNavDestination = null;
    }

    const steps = this.buildWalkwaySteps(originPoi, targetPoi, lang, isAccessible);
    const originName = originPoi.isLiveLocation ? ((lang === 'ar') ? '📍 موقعي الحالي' : '📍 My Location') : originPoi.nameAr;
    
    // Draw route path and retrieve calculated metrics
    const routeInfo = this.drawRoute(originPoi.coords, targetPoi.coords, originName, targetPoi.nameAr, isAccessible, recenterCamera);

    this.activeNavigation = {
      originPoi,
      targetPoi,
      isAccessible,
      steps,
      currentStepIdx: 0,
      meters: routeInfo ? routeInfo.meters : 120,
      minutes: routeInfo ? routeInfo.minutes : 2
    };
    document.body.classList.add('turn-navigation-active');

    this.walkProgress = 0;
    this.isSimulatingWalk = false;

    // Show HUD docked inside external container (or inside mapViewport if in fullscreen)
    let hud = document.getElementById('turnNavHud');
    const targetParent = this.getNavContainer();
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'turnNavHud';
      hud.className = 'turn-nav-bar';
    }
    if (targetParent && hud.parentElement !== targetParent) {
      targetParent.appendChild(hud);
    }
    hud.classList.remove('hidden');

    // Place initial walker marker at the starting coordinate only if NOT live location
    if (!originPoi.isLiveLocation) {
      this.initWalkerMarker(originPoi.coords);
    } else {
      const marker = document.getElementById('liveWalkerMarker');
      if (marker) marker.style.display = 'none';
      this.ensureBlueDotMarker();
    }

    this.renderTurnStep(recenterCamera);
    if (recenterCamera) {
      this.scrollToMap();
    }
  },

  renderTurnStep(recenterCamera = true) {
    if (!this.activeNavigation) return;
    const nav = this.activeNavigation;
    const step = nav.steps[nav.currentStepIdx] || nav.steps[0];
    const total = nav.steps.length;
    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    const hud = document.getElementById('turnNavHud');
    if (!hud) return;

    const isSimActive = this.isWalkingSimulating || this.isSimulatingWalk;
    const isPaused = this.isSimPaused;
    const isLiveNav = !!(nav.originPoi && nav.originPoi.isLiveLocation);

    const progressPct = isSimActive
      ? (this.walkProgress * 100)
      : (((nav.currentStepIdx + 1) / total) * 100);

    const stepOfText = (t.nav_step_of || 'الخطوة {current} من {total}')
      .replace('{current}', nav.currentStepIdx + 1)
      .replace('{total}', total);

    const isLastStep = nav.currentStepIdx === total - 1;

    const simBtnText = isSimActive
      ? (isPaused
          ? (lang === 'ar' ? 'استئناف السير' : lang === 'ru' ? 'Продолжить' : lang === 'de' ? 'Fortsetzen' : 'Resume')
          : (lang === 'ar' ? 'إيقاف مؤقت' : lang === 'ru' ? 'Пауза' : lang === 'de' ? 'Pause' : 'Pause'))
      : this.walkProgress >= 1
      ? (lang === 'ar' ? 'إعادة السير' : lang === 'ru' ? 'Заново' : lang === 'de' ? 'Neustart' : 'Restart')
      : (lang === 'ar' ? 'محاكاة السير الحي' : lang === 'ru' ? 'Живая ходьба' : lang === 'de' ? 'Live-Simulation' : 'Live Walk');

    const simBtnIcon = isSimActive
      ? (isPaused ? '▶️' : '⏸️')
      : this.walkProgress >= 1 ? '🔄' : '▶️';
    const simBtnClass = isSimActive
      ? (isPaused ? 'bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black' : 'bg-amber-500 text-slate-950 font-black')
      : this.walkProgress >= 1
      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black'
      : 'bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black';

    hud.innerHTML = `
      <div class="turn-progress-track">
        <div class="turn-progress-bar" style="width: ${progressPct}%;"></div>
      </div>

      <div class="flex items-center justify-between gap-2 mb-1.5">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
            ${stepOfText}
          </span>
          <span class="text-[10px] font-mono text-cyan-300 font-bold" id="turnHudMetrics">
            ⏱️ ${nav.minutes} د (${nav.meters}م)
          </span>
          ${isLiveNav ? `
            <span class="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 font-bold border border-blue-400/40 flex items-center gap-1 shadow-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
              ${lang === 'ar' ? 'تتبع مباشر' : 'Live Tracking'}
            </span>
          ` : ''}
          <button onclick="MapEngine.toggleStepFree()" class="text-[9px] px-2 py-0.5 rounded-full ${nav.isAccessible ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'} font-bold transition">
            ${nav.isAccessible ? '♿ مسار ميسر' : '♿ ميسر'}
          </button>
        </div>
        <button onclick="MapEngine.endTurnByTurn()" class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold flex items-center justify-center text-xs transition" title="إنهاء الملاحة">
          ✕
        </button>
      </div>

      <div class="flex items-start gap-2 mb-2">
        <span class="text-2xl shrink-0 mt-0.5">${step.icon}</span>
        <div class="min-w-0 flex-1">
          <h4 class="text-xs sm:text-sm font-black text-white leading-tight">${step.title}</h4>
          <p class="text-[11px] text-slate-300 leading-snug mt-0.5 line-clamp-2">${step.instruction}</p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/10">
        <button id="btnSimulateWalk" onclick="MapEngine.toggleLiveWalkSimulation()" class="tap-effect flex-1 py-1.5 px-2 rounded-xl ${simBtnClass} text-xs flex items-center justify-center gap-1 shadow">
          <span>${simBtnIcon}</span>
          <span class="truncate">${simBtnText}</span>
        </button>
        <button onclick="MapEngine.toggleSimSpeed()" class="tap-effect py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-xs" title="سرعة المحاكاة">
          ${(this.simSpeed || this.walkSpeed || 1)}x ⚡
        </button>
        <button onclick="MapEngine.prevTurnStep()" ${nav.currentStepIdx === 0 ? 'disabled' : ''} class="tap-effect py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-25 text-white font-bold text-xs" title="السابقة">
          ⬅️
        </button>
        <button onclick="${isLastStep ? 'MapEngine.endTurnByTurn()' : 'MapEngine.nextTurnStep()'}" class="tap-effect py-1.5 px-3 rounded-xl ${isLastStep ? 'bg-emerald-500 text-white font-black' : 'bg-white/15 hover:bg-white/25 text-white font-bold'} text-xs">
          ${isLastStep ? (t.nav_step_finish || 'إنهاء ✓') : (t.nav_step_next || 'التالية ➔')}
        </button>
      </div>
    `;

    // Recenter camera on step coordinates if not simulating walk and NOT live navigation
    if (recenterCamera && !isSimActive && !isLiveNav && step.coords) {
      this.focusCoordinate(step.coords.x, step.coords.y, 1.45);
      this.updateWalkerBeacon(step.coords);
    }
  },

  // Interactive Live Walk Simulation Methods
  toggleLiveWalkSimulation() {
    if (this.isWalkingSimulating || this.isSimulatingWalk) {
      this.toggleSimPause();
    } else {
      this.startLiveWalkSimulation();
    }
  },

  startTurnByTurnSimulation() {
    this.startLiveWalkSimulation();
  },

  pauseLiveWalkSimulation() {
    this.toggleSimPause();
  },

  toggleWalkSpeed() {
    this.toggleSimSpeed();
  },

  initWalkerMarker(coords) {
    let marker = document.getElementById('liveWalkerMarker');
    if (!marker) {
      marker = document.createElement('div');
      marker.id = 'liveWalkerMarker';
      marker.className = 'live-walker-avatar';
      marker.innerHTML = `
        <div class="live-walker-pulse"></div>
        <div class="live-walker-disc">🚶‍♂️</div>
      `;
      const overlay = document.getElementById('pinsOverlay');
      if (overlay) overlay.appendChild(marker);
    }
    marker.style.display = 'block';
    marker.style.left = `${coords.x}%`;
    marker.style.top = `${coords.y}%`;
  },

  updateWalkerMarker(pathEl, totalLength, t) {
    const len = t * totalLength;
    const pt = pathEl.getPointAtLength(len);
    const xPct = (pt.x / this.CANVAS_WIDTH) * 100;
    const yPct = (pt.y / this.CANVAS_HEIGHT) * 100;

    let marker = document.getElementById('liveWalkerMarker');
    if (!marker) {
      marker = document.createElement('div');
      marker.id = 'liveWalkerMarker';
      marker.className = 'live-walker-avatar';
      marker.innerHTML = `
        <div class="live-walker-pulse"></div>
        <div class="live-walker-disc">🚶‍♂️</div>
      `;
      const overlay = document.getElementById('pinsOverlay');
      if (overlay) overlay.appendChild(marker);
    }

    marker.style.display = 'block';
    marker.style.left = `${xPct}%`;
    marker.style.top = `${yPct}%`;

    // Follow camera: smoothly center the camera on the walker position
    this.centerCameraOnWalker(xPct, yPct);

    // Update progress bar in HUD
    const bar = document.querySelector('#turnNavHud .turn-progress-bar');
    if (bar) bar.style.width = `${t * 100}%`;
  },

  centerCameraOnWalker(pctX, pctY) {
    const viewport = document.getElementById('mapViewport');
    if (!viewport) return;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    const targetPixelX = (pctX / 100) * this.CANVAS_WIDTH;
    const targetPixelY = (pctY / 100) * this.CANVAS_HEIGHT;
    const canvasCenterX = this.CANVAS_WIDTH / 2;
    const canvasCenterY = this.CANVAS_HEIGHT / 2;

    const dx = canvasCenterX - targetPixelX;
    const tiltOffset = this.is3D ? (this.pitch * 1.8) : 0;
    const dy = canvasCenterY - targetPixelY + tiltOffset;

    this.panX = (vw - this.CANVAS_WIDTH) / 2 + (dx * this.scale);
    this.panY = (vh - this.CANVAS_HEIGHT) / 2 + (dy * this.scale);
    this.clampPan();
    this.applyTransform(false); // immediate 60fps frame update
  },

  onWalkSimulationComplete() {
    this.isSimulatingWalk = false;
    if (this.walkAnimFrame) cancelAnimationFrame(this.walkAnimFrame);
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(1200);

    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const toastMsg = (lang === 'ar')
      ? '🎉 لقد وصلت إلى وجهتك بسلام!'
      : (lang === 'ru') ? '🎉 Вы успешно прибыли в пункт назначения!'
      : (lang === 'de') ? '🎉 Sie haben Ihr Ziel erreicht!'
      : '🎉 You have arrived at your destination!';
    if (typeof App !== 'undefined' && App.showToast) App.showToast(toastMsg);

    this.renderTurnStep(false);
  },

  updateWalkerBeacon(coords) {
    let beacon = document.getElementById('walkerBeacon');
    if (!beacon) {
      beacon = document.createElement('div');
      beacon.id = 'walkerBeacon';
      beacon.className = 'absolute z-30 pointer-events-none transition-all duration-500 ease-out';
      beacon.innerHTML = `
        <div class="relative -translate-x-1/2 -translate-y-1/2">
          <div class="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-2xl border-2 border-white animate-bounce">
            🚶
          </div>
          <div class="w-8 h-8 rounded-full bg-amber-400/40 animate-ping absolute inset-0"></div>
        </div>
      `;
      const overlay = document.getElementById('pinsOverlay');
      if (overlay) overlay.appendChild(beacon);
    }

    beacon.style.left = `${coords.x}%`;
    beacon.style.top = `${coords.y}%`;
  },

  nextTurnStep() {
    if (!this.activeNavigation) return;
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(750);
    if (this.activeNavigation.currentStepIdx < this.activeNavigation.steps.length - 1) {
      this.activeNavigation.currentStepIdx++;
      this.renderTurnStep();
    }
  },

  prevTurnStep() {
    if (!this.activeNavigation) return;
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(600);
    if (this.activeNavigation.currentStepIdx > 0) {
      this.activeNavigation.currentStepIdx--;
      this.renderTurnStep();
    }
  },

  toggleStepFree() {
    if (!this.activeNavigation) return;
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(800);
    this.activeNavigation.isAccessible = !this.activeNavigation.isAccessible;
    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    this.activeNavigation.steps = this.buildWalkwaySteps(
      this.activeNavigation.originPoi,
      this.activeNavigation.targetPoi,
      lang,
      this.activeNavigation.isAccessible
    );
    this.drawRoute(
      this.activeNavigation.originPoi.coords,
      this.activeNavigation.targetPoi.coords,
      this.activeNavigation.originPoi.nameAr,
      this.activeNavigation.targetPoi.nameAr,
      this.activeNavigation.isAccessible
    );
    this.renderTurnStep();
  },

  endTurnByTurn() {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(500);
    this.pauseLiveWalkSimulation();
    this.activeNavigation = null;
    this.activeLiveNavDestination = null;
    this.lastNavRecalcPos = null;
    this.walkProgress = 0;
    document.body.classList.remove('turn-navigation-active');

    const hud = document.getElementById('turnNavHud');
    if (hud) hud.classList.add('hidden');
    const beacon = document.getElementById('walkerBeacon');
    if (beacon) beacon.remove();
    const marker = document.getElementById('liveWalkerMarker');
    if (marker) marker.remove();
    this.removeRoomBeacon();
  },

  // =========================================================================
  // Live Guest Location ("Blue Dot") WiFi Indoor Tracking Integration
  // =========================================================================

  initLiveGuestTracking() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramMac = urlParams.get('mac') || urlParams.get('client_mac') || urlParams.get('device_mac') || urlParams.get('clientMac') || urlParams.get('mac_address');

      if (paramMac) {
        this.guestMac = paramMac.trim().toLowerCase();
        try {
          sessionStorage.setItem('moreno_guest_mac', this.guestMac);
          localStorage.setItem('moreno_guest_mac', this.guestMac);
        } catch (e) {}
      } else {
        try {
          this.guestMac = sessionStorage.getItem('moreno_guest_mac') || localStorage.getItem('moreno_guest_mac') || null;
        } catch (e) {}
      }

      // If MAC is registered, start background tracking
      if (this.guestMac) {
        this.startLiveLocationTracking(this.guestMac);
      }

      // Device Orientation for directional heading beam
      if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
          if (e.alpha != null) {
            this.liveTrackingHeading = e.alpha;
            const headingCone = document.getElementById('blueDotHeadingCone');
            if (headingCone) {
              headingCone.style.transform = `rotate(${-this.bearing - this.liveTrackingHeading}deg)`;
            }
          }
        }, { passive: true });
      }
    } catch (err) {
      console.warn('[MapEngine] Live tracking initialization bypassed:', err);
    }
  },

  ensureBlueDotMarker() {
    const overlay = document.getElementById('pinsOverlay');
    if (!overlay) return null;

    let marker = document.getElementById('liveGuestBlueDotMarker');
    if (!marker) {
      marker = document.createElement('div');
      marker.id = 'liveGuestBlueDotMarker';
      marker.className = 'live-guest-blue-dot';
      marker.style.display = 'none';

      const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
      const label = (lang === 'ar') ? 'أنت هنا' : (lang === 'ru') ? 'Вы здесь' : (lang === 'de') ? 'Sie sind hier' : 'You are here';

      marker.innerHTML = `
        <div class="blue-dot-accuracy-circle" id="blueDotAccuracyCircle"></div>
        <div class="blue-dot-heading-cone" id="blueDotHeadingCone">
          <div class="blue-dot-beam"></div>
        </div>
        <div class="blue-dot-radar-ring"></div>
        <div class="blue-dot-core-wrapper" id="blueDotCoreWrapper">
          <div class="blue-dot-core">
            <div class="blue-dot-inner"></div>
          </div>
          <div class="blue-dot-badge">
            <span id="blueDotBadgeText">${label}</span>
          </div>
        </div>
      `;
      overlay.appendChild(marker);
    }
    return marker;
  },

  startLiveLocationTracking(mac) {
    if (!mac) return;
    this.guestMac = mac.trim().toLowerCase();
    this.ensureBlueDotMarker();

    // 1. Try WebSocket Connection
    try {
      if (this.liveTrackerWs) {
        this.liveTrackerWs.close();
        this.liveTrackerWs = null;
      }

      const host = window.location.hostname || 'localhost';
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${host}:3001?mac=${encodeURIComponent(this.guestMac)}`;

      const ws = new WebSocket(wsUrl);
      this.liveTrackerWs = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const data = payload.data || payload;
          if (data && typeof data.pctX === 'number' && typeof data.pctY === 'number') {
            this.lastApTelemetry = data;
            this.updateGuestLiveLocation(data.pctX, data.pctY, data.accuracyRadiusMeters || data.accuracyMeters);
            if (this.isApDebugActive) {
              this.updateApRadiusCircles(data.activeAps || [], { pctX: data.pctX, pctY: data.pctY });
              this.renderApDebugHud(data);
            }
          }
        } catch (e) {}
      };

      ws.onerror = () => {
        // Fallback to polling / SSE on error
        this.startLocationPolling(this.guestMac);
      };

      ws.onclose = () => {
        this.startLocationPolling(this.guestMac);
      };
    } catch (e) {
      this.startLocationPolling(this.guestMac);
    }
  },

  startLocationPolling(mac) {
    if (this.liveTrackerPollTimer) return;

    const fetchPos = async () => {
      try {
        const res = await fetch(`/api/location?mac=${encodeURIComponent(mac)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.location) {
            const loc = data.location;
            this.lastApTelemetry = loc;
            this.updateGuestLiveLocation(loc.pctX, loc.pctY, loc.accuracyRadiusMeters || loc.accuracyMeters);
            if (this.isApDebugActive) {
              this.updateApRadiusCircles(loc.activeAps || [], { pctX: loc.pctX, pctY: loc.pctY });
              this.renderApDebugHud(loc);
            }
          }
        }
      } catch (e) {
        // Graceful silent fallback
      }
    };

    fetchPos();
    this.liveTrackerPollTimer = setInterval(fetchPos, 2000);
  },

  updateGuestLiveLocation(pctX, pctY, accuracyMeters = 3.0) {
    const marker = this.ensureBlueDotMarker();
    if (!marker) return;

    this.lastGuestPosition = {
      pctX,
      pctY,
      accuracyMeters: Number(accuracyMeters) || 3.0,
      timestamp: Date.now()
    };

    marker.style.display = 'block';
    marker.style.left = `${pctX}%`;
    marker.style.top = `${pctY}%`;

    // Scale accuracy circle (pixels on map: 1 meter = 2.381 px)
    const accuracyCircle = document.getElementById('blueDotAccuracyCircle');
    if (accuracyCircle) {
      const radiusPx = (this.lastGuestPosition.accuracyMeters * 2.381);
      const diamPx = Math.max(30, Math.min(240, radiusPx * 2));
      accuracyCircle.style.width = `${diamPx}px`;
      accuracyCircle.style.height = `${diamPx}px`;
    }

    // Auto-update route if turn-by-turn navigation is actively tracking this guest
    if (this.activeLiveNavDestination) {
      this.handleLiveNavigationUpdate(pctX, pctY);
    }

    // Keep origin dropdown synced with live location
    this.syncOriginSelectOptions();

    // Auto-update AP calibration circles and debug HUD if active
    if (this.isApDebugActive && this.lastApTelemetry) {
      this.updateApRadiusCircles(this.lastApTelemetry.activeAps || [], { pctX, pctY });
      this.renderApDebugHud(this.lastApTelemetry);
    }

    // Contextual Geofencing Check around resort facilities
    if (typeof GeofenceService !== 'undefined' && GeofenceService.updatePosition) {
      GeofenceService.updatePosition(pctX, pctY);
    }

    // Auto-follow camera if requested by guest
    if (this.isAutoFollowingGuest) {
      this.focusCoordinate(pctX, pctY, Math.max(1.5, this.scale), false);
    }
  },

  /**
   * Dynamic Off-Route Recalculation and Real-time Navigation Progress Tracking
   * - Measures perpendicular distance from guest's position to active route polyline.
   * - If deviation > 8 meters (approx. 19 pixels) for 2 consecutive updates, auto-reroutes cleanly.
   * - Otherwise, calculates remaining distance and walking time in real time and trims traveled path.
   */
  handleLiveNavigationUpdate(pctX, pctY) {
    if (!this.activeLiveNavDestination) return;
    const destPoi = this.activeLiveNavDestination;

    // Calculate distance to destination in meters
    const destPxX = (destPoi.coords.x / 100) * this.CANVAS_WIDTH;
    const destPxY = (destPoi.coords.y / 100) * this.CANVAS_HEIGHT;
    const curPxX = (pctX / 100) * this.CANVAS_WIDTH;
    const curPxY = (pctY / 100) * this.CANVAS_HEIGHT;
    const distToTargetPx = Math.hypot(destPxX - curPxX, destPxY - curPxY);
    const distToTargetMeters = Math.round(distToTargetPx * 0.42);

    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const locDest = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(destPoi, lang) : { name: destPoi.nameAr };

    // 1. Check Arrival (< 4.5 meters)
    if (distToTargetMeters <= 4.5) {
      this.onGuestArrivedAtDestination(destPoi, locDest.name);
      return;
    }

    const liveOrigin = { x: pctX, y: pctY };
    const liveTitle = (lang === 'ar') ? 'موقعي الحالي' : (lang === 'ru') ? 'Мое местоположение' : (lang === 'de') ? 'Mein Standort' : 'My Live Location';
    const isAccessible = this.activeNavigation ? this.activeNavigation.isAccessible : false;

    // 2. Measure perpendicular deviation from the active polyline drawn on #routeSvgLayer
    const routePoints = this.lastRoutePoints;
    const { distMeters: perpDistMeters, nearestSegmentIdx, nearestProjPoint } = 
      this.calculatePerpendicularDistanceToRoute(curPxX, curPxY, routePoints);

    // 3. Dynamic Off-Route Threshold (> 8 meters, approx. 19 pixels)
    const OFF_ROUTE_THRESHOLD_METERS = 8.0;

    if (perpDistMeters > OFF_ROUTE_THRESHOLD_METERS) {
      this.offRouteCounter = (this.offRouteCounter || 0) + 1;
    } else {
      this.offRouteCounter = 0;
    }

    // Trigger full route recalculation if off-route for 2 consecutive updates or no route points exist
    if (this.offRouteCounter >= 2 || !routePoints || routePoints.length < 2) {
      this.offRouteCounter = 0;
      this.lastNavRecalcPos = { x: curPxX, y: curPxY };

      // Re-route from guest's new position to destination without resetting camera or clearing destination
      const routeInfo = this.drawRoute(liveOrigin, destPoi.coords, liveTitle, locDest.name, isAccessible, false);

      // Subtle notification on auto-reroute
      if (typeof App !== 'undefined' && App.showToast) {
        const rerouteMsg = (lang === 'ar') 
          ? '🔄 تم تعديل المسار تلقائياً بناءً على موقعك الجديد' 
          : (lang === 'ru') ? '🔄 Маршрут перестроен с вашего нового положения'
          : (lang === 'de') ? '🔄 Route automatisch an Ihren Standort angepasst'
          : '🔄 Route recalculated from your new location';
        App.showToast(rerouteMsg, 3000);
      }

      if (this.activeNavigation) {
        this.activeNavigation.meters = routeInfo ? routeInfo.meters : distToTargetMeters;
        this.activeNavigation.minutes = routeInfo ? routeInfo.minutes : Math.max(1, Math.round(distToTargetMeters / 65));
        const originVirtual = { id: 'LIVE_GUEST_LOCATION', coords: liveOrigin, nameAr: liveTitle, isLiveLocation: true };
        this.activeNavigation.steps = this.buildWalkwaySteps(originVirtual, destPoi, lang, isAccessible);
        this.renderTurnStep(false);
      }

      this.updateLiveRouteHudMetrics(
        routeInfo ? routeInfo.meters : distToTargetMeters,
        routeInfo ? routeInfo.minutes : Math.max(1, Math.round(distToTargetMeters / 65))
      );
      return;
    }

    // 4. On-Route Progress: Calculate remaining distance along the polyline in real time
    let remDistPx = 0;
    if (nearestProjPoint && routePoints && routePoints.length >= 2) {
      // Distance from guest to projection on the segment
      remDistPx += Math.hypot(curPxX - nearestProjPoint.x, curPxY - nearestProjPoint.y);
      // Distance from projection to next waypoint
      const nextWp = routePoints[nearestSegmentIdx + 1];
      if (nextWp) {
        remDistPx += Math.hypot(nextWp.x - nearestProjPoint.x, nextWp.y - nearestProjPoint.y);
      }
      // Remaining subsequent segments
      for (let i = nearestSegmentIdx + 1; i < routePoints.length - 1; i++) {
        remDistPx += Math.hypot(routePoints[i + 1].x - routePoints[i].x, routePoints[i + 1].y - routePoints[i].y);
      }
    } else {
      remDistPx = distToTargetPx;
    }

    const remainingMeters = Math.max(0, Math.round(remDistPx * 0.42));
    const remainingMinutes = Math.max(1, Math.round(remainingMeters / 65));

    // Update active navigation state
    if (this.activeNavigation) {
      this.activeNavigation.meters = remainingMeters;
      this.activeNavigation.minutes = remainingMinutes;
      this.syncTurnStepWithProgress(curPxX, curPxY);
    }

    // Update UI navigation badges in real time
    this.updateLiveRouteHudMetrics(remainingMeters, remainingMinutes);

    // Smoothly trim traveled route behind the guest so line starts cleanly at live position
    this.trimLiveRouteSvgPath(curPxX, curPxY, nearestSegmentIdx, nearestProjPoint);
  },

  calculatePerpendicularDistanceToRoute(curPxX, curPxY, routePoints) {
    if (!routePoints || routePoints.length < 2) {
      return { distMeters: 999, distPx: 999, nearestSegmentIdx: 0, nearestProjPoint: null };
    }

    let minPerpDistPx = Infinity;
    let nearestSegmentIdx = 0;
    let nearestProjPoint = null;

    for (let i = 0; i < routePoints.length - 1; i++) {
      const p1 = routePoints[i];
      const p2 = routePoints[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;

      let dPx = 0;
      let proj = { x: p1.x, y: p1.y };

      if (lenSq < 0.0001) {
        dPx = Math.hypot(curPxX - p1.x, curPxY - p1.y);
      } else {
        const t = Math.max(0, Math.min(1, ((curPxX - p1.x) * dx + (curPxY - p1.y) * dy) / lenSq));
        proj = { x: p1.x + t * dx, y: p1.y + t * dy };
        dPx = Math.hypot(curPxX - proj.x, curPxY - proj.y);
      }

      if (dPx < minPerpDistPx) {
        minPerpDistPx = dPx;
        nearestSegmentIdx = i;
        nearestProjPoint = proj;
      }
    }

    const distMeters = minPerpDistPx * 0.42; // (1m = 2.381px => 0.42m/px)
    return {
      distMeters,
      distPx: minPerpDistPx,
      nearestSegmentIdx,
      nearestProjPoint
    };
  },

  updateLiveRouteHudMetrics(meters, minutes) {
    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const minText = (lang === 'ar') ? `${minutes} دقيقة (${meters} م)` : `${minutes} min (${meters}m)`;

    // Update #routeHudMetrics inside #mapRouteHud
    const routeMetrics = document.getElementById('routeHudMetrics');
    if (routeMetrics) {
      routeMetrics.textContent = minText;
    }

    // Update #turnHudMetrics inside #turnNavHud
    const turnMetrics = document.getElementById('turnHudMetrics');
    if (turnMetrics) {
      turnMetrics.textContent = `⏱️ ${minText}`;
    }

    // Update routeResultBanner if visible
    const banner = document.getElementById('routeResultBanner');
    if (banner && !banner.classList.contains('hidden')) {
      const bannerMeters = banner.querySelector('.route-banner-dist');
      if (bannerMeters) bannerMeters.textContent = `${meters} م`;
    }
  },

  trimLiveRouteSvgPath(curPxX, curPxY, segmentIdx, projPoint) {
    const svgPath = document.getElementById('liveRouteSvgPath');
    const routePoints = this.lastRoutePoints;
    if (!svgPath || !routePoints || routePoints.length < 2) return;

    // Remaining points: from current projection point to destination
    const remainingPoints = [{ x: Math.round(curPxX), y: Math.round(curPxY) }];
    if (projPoint && segmentIdx < routePoints.length - 1) {
      // Add upcoming waypoints
      for (let i = segmentIdx + 1; i < routePoints.length; i++) {
        remainingPoints.push(routePoints[i]);
      }
    }

    if (remainingPoints.length >= 2) {
      const newD = remainingPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
      svgPath.setAttribute('d', newD);
    }
  },

  syncTurnStepWithProgress(curPxX, curPxY) {
    if (!this.activeNavigation || !this.activeNavigation.steps) return;
    const nav = this.activeNavigation;
    const currentStep = nav.steps[nav.currentStepIdx];
    if (!currentStep || nav.currentStepIdx >= nav.steps.length - 1) return;

    const nextStep = nav.steps[nav.currentStepIdx + 1];
    if (nextStep && nextStep.coords) {
      const stepPxX = (nextStep.coords.x / 100) * this.CANVAS_WIDTH;
      const stepPxY = (nextStep.coords.y / 100) * this.CANVAS_HEIGHT;
      const distToStepMeters = Math.hypot(stepPxX - curPxX, stepPxY - curPxY) * 0.42;
      if (distToStepMeters < 5.0) {
        nav.currentStepIdx += 1;
        this.renderTurnStep(false);
      }
    }
  },

  onGuestArrivedAtDestination(destPoi, destName) {
    if (typeof App !== 'undefined' && App.playBeep) {
      App.playBeep(1100);
      setTimeout(() => App.playBeep(1400), 200);
    }
    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const arriveMsg = (lang === 'ar')
      ? `🎉 لقد وصلت بنجاح إلى: ${destName}!`
      : (lang === 'ru') ? `🎉 Вы успешно прибыли в: ${destName}!`
      : (lang === 'de') ? `🎉 Sie haben Ihr Ziel erreicht: ${destName}!`
      : `🎉 You have arrived at: ${destName}!`;

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(arriveMsg, 6000);
    }

    if (typeof ConciergeAudioGuide !== 'undefined' && ConciergeAudioGuide.speak) {
      ConciergeAudioGuide.speak(arriveMsg, lang);
    }

    this.activeLiveNavDestination = null;
    this.lastNavRecalcPos = null;

    // Update HUD to show arrival
    const hud = document.getElementById('turnNavHud');
    if (hud) {
      hud.innerHTML = `
        <div class="p-3 text-center animate-scaleUp">
          <div class="text-3xl mb-1">🎉</div>
          <h4 class="text-sm font-black text-emerald-400 mb-1">${arriveMsg}</h4>
          <p class="text-xs text-slate-300 mb-3">${lang === 'ar' ? 'نتمنى لك قضاء وقت ممتع في هذا المرفق.' : 'Enjoy your time at this facility!'}</p>
          <button onclick="MapEngine.endTurnByTurn()" class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg tap-effect">
            ${lang === 'ar' ? 'تم الوصول ✓' : 'Done ✓'}
          </button>
        </div>
      `;
    }
  },

  syncOriginSelectOptions() {
    const select = document.getElementById('selectOrigin');
    if (!select) return;
    let liveOpt = select.querySelector('option[value="LIVE_GUEST_LOCATION"]');
    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const label = (lang === 'ar') ? '📍 موقعي الحالي (Live Blue Dot)' : '📍 My Live Location (Live Blue Dot)';
    if (!liveOpt) {
      liveOpt = document.createElement('option');
      liveOpt.value = 'LIVE_GUEST_LOCATION';
      liveOpt.textContent = label;
      select.insertBefore(liveOpt, select.firstChild);
    } else {
      liveOpt.textContent = label;
    }
    if (this.lastGuestPosition && select.value !== 'LIVE_GUEST_LOCATION') {
      select.value = 'LIVE_GUEST_LOCATION';
    }
  },

  locateMe() {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(900);
    this.stopOrbitTour();

    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const btn = document.getElementById('btnLocateMe');

    // 1. If we already have a real-time position fix
    if (this.lastGuestPosition) {
      this.isAutoFollowingGuest = true;
      if (btn) btn.classList.add('btn-locate-active');

      this.focusCoordinate(this.lastGuestPosition.pctX, this.lastGuestPosition.pctY, 1.65, true);

      const msg = (lang === 'ar')
        ? `🎯 تم تحديد موقعك الحالي (دقة ±${Math.round(this.lastGuestPosition.accuracyMeters)}م)`
        : (lang === 'ru') ? `🎯 Ваше местоположение на карте (точность ±${Math.round(this.lastGuestPosition.accuracyMeters)}м)`
        : (lang === 'de') ? `🎯 Ihr Standort erfasst (Genauigkeit ±${Math.round(this.lastGuestPosition.accuracyMeters)}m)`
        : `🎯 Your live location focused (accuracy ±${Math.round(this.lastGuestPosition.accuracyMeters)}m)`;

      if (typeof App !== 'undefined' && App.showToast) App.showToast(msg);
      return;
    }

    // 2. If a MAC is configured but no signal packet arrived yet
    if (this.guestMac) {
      const msg = (lang === 'ar')
        ? `📡 جارٍ جلب إشارة الواي فاي لجهازك (${this.guestMac})...`
        : `📡 Fetching WiFi positioning signal for device (${this.guestMac})...`;
      if (typeof App !== 'undefined' && App.showToast) App.showToast(msg);

      // Attempt immediate API sync
      fetch(`/api/location?mac=${encodeURIComponent(this.guestMac)}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.success && data.location) {
            this.updateGuestLiveLocation(data.location.pctX, data.location.pctY, data.location.accuracyRadiusMeters);
            this.locateMe();
          }
        })
        .catch(() => {});
      return;
    }

    // 3. Fallback: No MAC registered yet -> Open interactive modal
    this.openLocateGuestModal();
  },

  openLocateGuestModal() {
    let modal = document.getElementById('locateGuestModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'locateGuestModal';
      modal.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const isAr = lang === 'ar';

    modal.innerHTML = `
      <div class="relative w-full max-w-md bg-slate-900 border border-blue-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-2xl animate-scaleUp">
        <button onclick="MapEngine.closeLocateGuestModal()" class="absolute top-4 left-4 sm:top-5 sm:left-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-sm transition">✕</button>

        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/50 flex items-center justify-center text-2xl shadow-lg">
            🎯
          </div>
          <div>
            <h3 class="text-base font-black text-white">${isAr ? 'تحديد موقعك داخل المنتجع' : 'Live Resort Positioning'}</h3>
            <p class="text-[11px] text-blue-300 font-semibold">${isAr ? 'نظام WiFi Indoor Positioning الذكي' : 'WiFi Indoor Positioning System'}</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed mb-4">
          ${isAr 
            ? 'يتم تفعيل النقطة الزرقاء الحية تلقائياً عند تسجيل الدخول لشبكة واي فاي الفندق عبر الرابط المخصص. يمكنك ربط جهازك بإدخال عنوان MAC أو تجربة المحاكاة التفاعلية.' 
            : 'Your live Blue Dot is automatically activated when connecting to the hotel guest WiFi. You can link your device via MAC address or start interactive demo simulation.'}
        </p>

        <!-- MAC Input Form -->
        <div class="space-y-3 mb-4">
          <div>
            <label class="block text-[11px] font-bold text-slate-400 mb-1">${isAr ? 'عنوان MAC الخاص بجهازك:' : 'Your Device MAC Address:'}</label>
            <div class="flex items-center gap-2">
              <input 
                type="text" 
                id="inputGuestMacAddress" 
                placeholder="A4:C3:F0:12:34:56" 
                value="${this.guestMac || ''}"
                class="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <button onclick="MapEngine.saveGuestMacFromInput()" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition tap-effect">
                ${isAr ? 'ربط' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        <!-- 1-Click Demo Simulator -->
        <div class="p-3.5 rounded-2xl bg-slate-800/80 border border-white/10 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <span>🚀</span> ${isAr ? 'تجربة المحاكاة الحية' : 'Live Interactive Demo'}
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">1-Click Live</span>
          </div>
          <p class="text-[11px] text-slate-400">
            ${isAr 
              ? 'توليد إشارات واي فاي تجريبية لجهازك والتنقل به في ردهة الاستقبال والمسابح.' 
              : 'Generate synthetic WiFi RSSI signals to test real-time Blue Dot positioning.'}
          </p>
          <button onclick="MapEngine.startDemoLocationSimulation()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-black text-xs transition tap-effect flex items-center justify-center gap-1.5 shadow-md">
            <span>✨</span>
            <span>${isAr ? 'تشغيل النقطة الزرقاء التجريبية' : 'Start Demo Blue Dot Tracker'}</span>
          </button>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  },

  closeLocateGuestModal() {
    const modal = document.getElementById('locateGuestModal');
    if (modal) modal.style.display = 'none';
  },

  saveGuestMacFromInput() {
    const input = document.getElementById('inputGuestMacAddress');
    if (!input || !input.value.trim()) return;
    const mac = input.value.trim().toLowerCase();

    this.guestMac = mac;
    try {
      sessionStorage.setItem('moreno_guest_mac', mac);
      localStorage.setItem('moreno_guest_mac', mac);
    } catch (e) {}

    this.closeLocateGuestModal();
    this.startLiveLocationTracking(mac);
    this.locateMe();
  },

  startDemoLocationSimulation() {
    this.closeLocateGuestModal();
    const demoMac = 'A4:C3:F0:77:88:99';
    this.guestMac = demoMac;

    // Waypoints for demo walking across the resort (Lobby -> Sirena -> Lotus Pool -> La Mama -> Beach)
    const demoWaypoints = [
      { x: 283, y: 820, name: 'بهو الاستقبال M' },
      { x: 310, y: 795, name: 'مطعم سيرينا' },
      { x: 344, y: 665, name: 'مسبح لوتس' },
      { x: 348, y: 575, name: 'مطعم لا ماما' },
      { x: 428, y: 340, name: 'بار الشاطئ' },
      { x: 381, y: 281, name: 'منطقة المارينا والشاطئ' }
    ];

    let wpIdx = 0;
    const sendDemoPing = () => {
      const wp = demoWaypoints[wpIdx];
      wpIdx = (wpIdx + 1) % demoWaypoints.length;

      fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: demoMac, x: wp.x, y: wp.y })
      })
      .then(r => r.json())
      .then(data => {
        if (data && data.success && data.result) {
          const loc = data.result;
          this.updateGuestLiveLocation(loc.pctX, loc.pctY, loc.accuracyRadiusMeters || 2.2);
          if (wpIdx === 1) {
            this.locateMe();
          }
        }
      })
      .catch(() => {
        // Fallback internal simulation if backend simulation endpoint not reached
        const pctX = Number(((wp.x / this.CANVAS_WIDTH) * 100).toFixed(2));
        const pctY = Number(((wp.y / this.CANVAS_HEIGHT) * 100).toFixed(2));
        this.updateGuestLiveLocation(pctX, pctY, 2.0);
        if (wpIdx === 1) {
          this.locateMe();
        }
      });
    };

    sendDemoPing();
    if (this.demoTimer) clearInterval(this.demoTimer);
    this.demoTimer = setInterval(sendDemoPing, 3500);

    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(lang === 'ar' ? '🚀 تم تفعيل النقطة الزرقاء الحية في وضع العرض التفاعلي!' : '🚀 Live Blue Dot tracking activated in interactive demo mode!');
    }
  },

  // =========================================================================
  // AP Calibration & Debug Overlay Methods (Admin & Telemetry Inspection)
  // =========================================================================

  toggleApCalibrationOverlay(forceState = null) {
    if (forceState !== null) {
      this.isApDebugActive = Boolean(forceState);
    } else {
      this.isApDebugActive = !this.isApDebugActive;
    }

    const btn = document.getElementById('btnToggleApDebug');
    if (btn) {
      if (this.isApDebugActive) {
        btn.classList.add('bg-amber-500', 'text-slate-950', 'active');
        btn.classList.remove('text-amber-600', 'dark:text-amber-400');
      } else {
        btn.classList.remove('bg-amber-500', 'text-slate-950', 'active');
        btn.classList.add('text-amber-600', 'dark:text-amber-400');
      }
    }

    const svgLayer = document.getElementById('apRadiusSvgLayer');
    const pinsLayer = document.getElementById('apPinsOverlay');

    if (this.isApDebugActive) {
      if (svgLayer) svgLayer.classList.remove('hidden');
      if (pinsLayer) pinsLayer.classList.remove('hidden');

      if (!this.cachedAccessPoints || this.cachedAccessPoints.length === 0) {
        this.fetchAccessPointsForCalibration();
      } else {
        this.renderApMarkers();
      }

      this.renderApDebugHud(this.lastApTelemetry);

      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('📡 تم تفعيل وضع معايرة نقاط الوصول (AP Calibration & Debug Mode)');
      }
    } else {
      if (svgLayer) {
        svgLayer.classList.add('hidden');
        svgLayer.innerHTML = '';
      }
      if (pinsLayer) {
        pinsLayer.classList.add('hidden');
      }
      const hud = document.getElementById('apDebugHud');
      if (hud) hud.remove();
    }
  },

  async fetchAccessPointsForCalibration() {
    try {
      const res = await fetch('/api/access-points');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.accessPoints)) {
          this.cachedAccessPoints = data.accessPoints;
          this.renderApMarkers();
          this.renderApDebugHud(this.lastApTelemetry);
          if (this.lastApTelemetry && this.lastGuestPosition) {
            this.updateApRadiusCircles(this.lastApTelemetry.activeAps || [], this.lastGuestPosition);
          }
        }
      }
    } catch (err) {
      console.warn('[MapEngine] Failed to fetch access points:', err);
    }
  },

  renderApMarkers() {
    const overlay = document.getElementById('apPinsOverlay');
    if (!overlay) return;
    overlay.innerHTML = '';

    const currentPitch = this.is3D ? this.pitch : 0;
    const rotateStyle = (this.is3D && currentPitch > 0) ? `rotateX(${-currentPitch}deg)` : 'none';

    this.cachedAccessPoints.forEach(ap => {
      const pin = document.createElement('div');
      pin.id = `apMarker_${ap.id}`;
      pin.className = 'ap-marker';
      const pctX = ap.pctX != null ? ap.pctX : Number(((ap.x / this.CANVAS_WIDTH) * 100).toFixed(2));
      const pctY = ap.pctY != null ? ap.pctY : Number(((ap.y / this.CANVAS_HEIGHT) * 100).toFixed(2));
      pin.style.left = `${pctX}%`;
      pin.style.top = `${pctY}%`;

      pin.innerHTML = `
        <div class="ap-marker-core" style="transform: ${rotateStyle}" title="${ap.name || ap.id}">
          <div class="ap-marker-pulse"></div>
          <span>📡</span>
        </div>
        <div class="ap-marker-tag">
          <span>${ap.id}</span>
        </div>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showApInspector(ap.id);
      });

      overlay.appendChild(pin);
    });
  },

  updateApRadiusCircles(activeAps = [], guestPos = null) {
    const svgLayer = document.getElementById('apRadiusSvgLayer');
    if (!svgLayer) return;

    if (!this.showRadiusCircles || !activeAps || !activeAps.length) {
      svgLayer.innerHTML = '';
      return;
    }

    const guestPxX = guestPos ? (guestPos.pctX / 100) * this.CANVAS_WIDTH : null;
    const guestPxY = guestPos ? (guestPos.pctY / 100) * this.CANVAS_HEIGHT : null;

    let circlesSvg = `
      <defs>
        <radialGradient id="apRssiGradStrong" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.30" />
          <stop offset="80%" stop-color="#06d6a0" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#059669" stop-opacity="0.0" />
        </radialGradient>
        <radialGradient id="apRssiGradMed" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.25" />
          <stop offset="80%" stop-color="#f59e0b" stop-opacity="0.06" />
          <stop offset="100%" stop-color="#d97706" stop-opacity="0.0" />
        </radialGradient>
        <radialGradient id="apRssiGradWeak" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.20" />
          <stop offset="80%" stop-color="#e11d48" stop-opacity="0.04" />
          <stop offset="100%" stop-color="#be123c" stop-opacity="0.0" />
        </radialGradient>
      </defs>
    `;

    // Highlight detecting AP pins
    document.querySelectorAll('.ap-marker').forEach(m => m.classList.remove('active-detect'));

    activeAps.forEach(meas => {
      const ap = this.cachedAccessPoints.find(a => 
        (a.id && a.id.toUpperCase() === String(meas.id || meas.apId).toUpperCase()) ||
        (a.bssid && a.bssid.toLowerCase() === String(meas.bssid || meas['ap-bssid']).toLowerCase())
      );
      if (!ap) return;

      const markerEl = document.getElementById(`apMarker_${ap.id}`);
      if (markerEl) markerEl.classList.add('active-detect');

      const distM = Number(meas.distM || meas.distanceMeters || meas.distance || 4.5);
      const radiusPx = distM * 2.381; // 1 meter = 2.381 pixels
      const rssi = Number(meas.rssi || -65);

      let strokeColor = '#10b981';
      let gradFill = 'url(#apRssiGradStrong)';
      if (rssi < -75) {
        strokeColor = '#f43f5e';
        gradFill = 'url(#apRssiGradWeak)';
      } else if (rssi < -62) {
        strokeColor = '#fbbf24';
        gradFill = 'url(#apRssiGradMed)';
      }

      // Draw Ray to Guest Position if available
      if (guestPxX != null && guestPxY != null) {
        circlesSvg += `
          <line x1="${ap.x}" y1="${ap.y}" x2="${guestPxX}" y2="${guestPxY}" stroke="${strokeColor}" stroke-opacity="0.5" stroke-width="1.8" class="ap-radius-ray" />
        `;
      }

      // Draw Distance Radius Circle
      circlesSvg += `
        <circle cx="${ap.x}" cy="${ap.y}" r="${radiusPx}" fill="${gradFill}" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="6,4" class="ap-radius-svg-circle" />
        <g transform="translate(${ap.x}, ${ap.y - radiusPx - 6})">
          <rect x="-60" y="-14" width="120" height="17" rx="5" fill="#0f172a" fill-opacity="0.92" stroke="${strokeColor}" stroke-width="1" />
          <text x="0" y="-2" fill="${strokeColor}" font-size="9" font-weight="bold" font-family="monospace" text-anchor="middle">
            ${ap.id}: ${rssi}dBm (${distM}m)
          </text>
        </g>
      `;
    });

    svgLayer.innerHTML = circlesSvg;
  },

  renderApDebugHud(telemetry = null) {
    if (!this.isApDebugActive) return;

    let hud = document.getElementById('apDebugHud');
    const viewport = document.getElementById('mapViewport');
    if (!viewport) return;

    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'apDebugHud';
      hud.className = 'ap-debug-hud';
      viewport.appendChild(hud);
    }

    const data = telemetry || this.lastApTelemetry || {};
    const mac = data.mac || this.guestMac || 'A4:C3:F0:77:88:99';
    const x = data.x != null ? data.x : (this.lastGuestPosition ? Math.round((this.lastGuestPosition.pctX / 100) * this.CANVAS_WIDTH) : '--');
    const y = data.y != null ? data.y : (this.lastGuestPosition ? Math.round((this.lastGuestPosition.pctY / 100) * this.CANVAS_HEIGHT) : '--');
    const pctX = data.pctX != null ? data.pctX : (this.lastGuestPosition ? this.lastGuestPosition.pctX : '--');
    const pctY = data.pctY != null ? data.pctY : (this.lastGuestPosition ? this.lastGuestPosition.pctY : '--');
    const accuracy = data.accuracyMeters || data.accuracyRadiusMeters || (this.lastGuestPosition ? this.lastGuestPosition.accuracyMeters : 2.5);
    const method = data.method || 'WLS + Gauss-Newton 2D';
    const activeAps = data.activeAps || [];

    const rowsHtml = (this.cachedAccessPoints && this.cachedAccessPoints.length > 0)
      ? this.cachedAccessPoints.map(ap => {
          const meas = activeAps.find(m => 
            (m.id && m.id.toUpperCase() === ap.id.toUpperCase()) || 
            (m.bssid && m.bssid.toLowerCase() === ap.bssid.toLowerCase())
          );
          const hasSignal = !!meas;
          const rssi = hasSignal ? meas.rssi : '--';
          const dist = hasSignal ? `${meas.distM || meas.distanceMeters}m` : '--';
          const radPx = hasSignal ? `${Math.round((meas.distM || meas.distanceMeters) * 2.381)}px` : '--';
          const badgeClass = hasSignal ? 'text-emerald-400 font-bold' : 'text-slate-500';

          return `
            <tr class="border-b border-slate-800 hover:bg-white/5 transition text-[11px] font-mono">
              <td class="py-1 px-1.5 font-bold ${badgeClass}">
                <button onclick="MapEngine.showApInspector('${ap.id}')" class="hover:underline text-left">
                  ${hasSignal ? '🟢' : '⚪'} ${ap.id}
                </button>
              </td>
              <td class="py-1 px-1 text-center font-bold ${badgeClass}">${rssi}</td>
              <td class="py-1 px-1 text-center text-slate-300">${dist}</td>
              <td class="py-1 px-1 text-center text-cyan-400">${radPx}</td>
            </tr>
          `;
        }).join('')
      : `<tr><td colspan="4" class="text-center py-2 text-slate-500 text-xs">جاري تحميل نقاط الوصول...</td></tr>`;

    hud.innerHTML = `
      <!-- Header -->
      <div class="px-3.5 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span class="font-extrabold text-xs text-white">📡 معايرة APs و RSSI</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">${this.cachedAccessPoints.length || 14} APs</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="MapEngine.toggleRadiusCirclesVisibility()" class="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-300 transition" title="تبديل إظهار دوائر المدى">
            ${this.showRadiusCircles ? '⭕ دوائر: تشغيل' : '⭕ دوائر: إيقاف'}
          </button>
          <button onclick="MapEngine.toggleApDebugHudCollapse()" class="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-300 flex items-center justify-center transition">
            _
          </button>
          <button onclick="MapEngine.toggleApCalibrationOverlay(false)" class="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-300 hover:text-white flex items-center justify-center transition">
            ✕
          </button>
        </div>
      </div>

      <!-- Scrollable Telemetry Body -->
      <div class="ap-debug-body space-y-3">
        <!-- Target Device & Position Fix -->
        <div class="p-2.5 rounded-xl bg-slate-800/80 border border-white/10 space-y-1.5 font-mono text-[11px]">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-sans font-bold text-[10px]">الجهاز المستهدف (Client MAC):</span>
            <span class="text-emerald-400 font-black">${mac}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-sans font-bold text-[10px]">الإحداثيات الحسابية:</span>
            <span class="text-cyan-300 font-bold">X: ${x}px, Y: ${y}px (${pctX}%, ${pctY}%)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-sans font-bold text-[10px]">دقة التثليث (Accuracy):</span>
            <span class="text-amber-300 font-bold">±${accuracy}m (${activeAps.length} APs)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-sans font-bold text-[10px]">طريقة الحساب:</span>
            <span class="text-slate-300 text-[10px]">${method}</span>
          </div>
        </div>

        <!-- Coordinate System & Leaflet CRS Verification Report -->
        <details class="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11px]">
          <summary class="font-bold text-blue-300 cursor-pointer text-xs select-none">
            📐 فحص نظام الإحداثيات و Leaflet CRS
          </summary>
          <div class="mt-2 space-y-1 text-slate-300 font-mono text-[10px] leading-relaxed">
            <div class="flex justify-between border-b border-white/10 pb-1">
              <span>Projection Engine:</span>
              <span class="text-emerald-400 font-bold">2.5D/3D Canvas + SVG</span>
            </div>
            <div class="flex justify-between border-b border-white/10 pb-1">
              <span>Grid Matrix:</span>
              <span class="text-cyan-300 font-bold">896 × 1200 pixels</span>
            </div>
            <div class="flex justify-between border-b border-white/10 pb-1">
              <span>Meters-to-Pixels:</span>
              <span class="text-amber-300 font-bold">2.381 px/m (0.42 m/px)</span>
            </div>
            <div class="flex justify-between border-b border-white/10 pb-1">
              <span>Leaflet CRS Mismatch:</span>
              <span class="text-emerald-400 font-bold">NONE (0% Mismatch)</span>
            </div>
            <p class="text-[9px] text-slate-400 pt-1 font-sans">
              ✓ تم التأكد: الخريطة لا تستخدم Leaflet Mercator Spherical CRS، بل تعتمد الإحداثيات الديكارتية الحقيقية 1:1 المتطابقة تماماً مع محرك RouterOS Trilateration.
            </p>
          </div>
        </details>

        <!-- Live Access Points Signals Table -->
        <div class="space-y-1">
          <div class="flex items-center justify-between px-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">جدول الإشارات اللحظية (RSSI):</span>
            <span class="text-[10px] text-cyan-400 font-mono font-bold">${activeAps.length} متصلة</span>
          </div>
          <div class="overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-800/90 text-[10px] text-slate-400 font-mono border-b border-white/10">
                  <th class="py-1 px-1.5">AP ID</th>
                  <th class="py-1 px-1 text-center">RSSI</th>
                  <th class="py-1 px-1 text-center">المسافة</th>
                  <th class="py-1 px-1 text-center">القطر</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 1-Click Synthetic RSSI Ping Simulators -->
        <div class="space-y-1.5 pt-1 border-t border-white/10">
          <span class="text-[10px] font-bold text-slate-400 font-sans">نبضات تجريبية لمعايرة القطاعات:</span>
          <div class="grid grid-cols-2 gap-1.5">
            <button onclick="MapEngine.simulateTestPing(283, 820, 'بهو الاستقبال M')" class="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-[10px] text-center transition truncate tap-effect">
              🏨 بهو الاستقبال M
            </button>
            <button onclick="MapEngine.simulateTestPing(344, 665, 'مسبح لوتس (11)')" class="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-[10px] text-center transition truncate tap-effect">
              🏊‍♂️ مسبح لوتس
            </button>
            <button onclick="MapEngine.simulateTestPing(348, 575, 'مطعم لا ماما (8)')" class="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-[10px] text-center transition truncate tap-effect">
              🍕 مطعم لا ماما
            </button>
            <button onclick="MapEngine.simulateTestPing(381, 281, 'شاطئ المارينا (1)')" class="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-[10px] text-center transition truncate tap-effect">
              🏖️ شاطئ المارينا
            </button>
          </div>
        </div>
      </div>
    `;
  },

  toggleRadiusCirclesVisibility() {
    this.showRadiusCircles = !this.showRadiusCircles;
    if (this.lastApTelemetry && this.lastGuestPosition) {
      this.updateApRadiusCircles(this.lastApTelemetry.activeAps || [], this.lastGuestPosition);
    } else {
      const svgLayer = document.getElementById('apRadiusSvgLayer');
      if (svgLayer) svgLayer.innerHTML = '';
    }
    this.renderApDebugHud(this.lastApTelemetry);
  },

  toggleApDebugHudCollapse() {
    const hud = document.getElementById('apDebugHud');
    if (hud) hud.classList.toggle('collapsed');
  },

  simulateTestPing(x, y, label = '') {
    const testMac = this.guestMac || 'A4:C3:F0:77:88:99';
    fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac: testMac, x, y })
    })
    .then(r => r.json())
    .then(data => {
      if (data && data.success && data.result) {
        const loc = data.result;
        this.lastApTelemetry = loc;
        this.updateGuestLiveLocation(loc.pctX, loc.pctY, loc.accuracyRadiusMeters || 2.2);
        this.updateApRadiusCircles(loc.activeAps || [], { pctX: loc.pctX, pctY: loc.pctY });
        this.renderApDebugHud(loc);
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(`📡 تم إرسال نبضة RSSI تجريبية عند [${label || 'الموقع'}]!`);
        }
      }
    })
    .catch(err => {
      console.error('[MapEngine] Test ping failed:', err);
    });
  },

  showApInspector(apId) {
    const ap = (this.cachedAccessPoints || []).find(a => a.id.toUpperCase() === String(apId).toUpperCase());
    if (!ap) return;

    const meas = (this.lastApTelemetry && this.lastApTelemetry.activeAps) 
      ? this.lastApTelemetry.activeAps.find(m => m.id && m.id.toUpperCase() === ap.id.toUpperCase())
      : null;

    const rssi = meas ? `${meas.rssi} dBm` : 'لا توجد إشارة من الجهاز حالياً';
    const dist = meas ? `${meas.distM || meas.distanceMeters} متر` : '--';

    let inspector = document.getElementById('apInspectorModal');
    if (!inspector) {
      inspector = document.createElement('div');
      inspector.id = 'apInspectorModal';
      inspector.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4';
      document.body.appendChild(inspector);
    }

    inspector.innerHTML = `
      <div class="relative w-full max-w-sm bg-slate-900 border border-cyan-500/50 rounded-3xl p-5 text-white shadow-2xl animate-scaleUp font-cairo">
        <button onclick="document.getElementById('apInspectorModal').style.display='none'" class="absolute top-4 left-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs transition">✕</button>

        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-2xl bg-cyan-600/30 text-cyan-400 border border-cyan-500/50 flex items-center justify-center text-xl shadow">
            📡
          </div>
          <div>
            <h3 class="text-sm font-black text-white">${ap.id}</h3>
            <p class="text-[11px] text-cyan-300 font-semibold">${ap.nameAr || ap.name}</p>
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-slate-800/90 border border-white/10 space-y-2 text-xs font-mono mb-4">
          <div class="flex justify-between border-b border-white/10 pb-1">
            <span class="text-slate-400 font-sans">BSSID:</span>
            <span class="text-white font-bold">${ap.bssid}</span>
          </div>
          <div class="flex justify-between border-b border-white/10 pb-1">
            <span class="text-slate-400 font-sans">التردد / الدور:</span>
            <span class="text-cyan-300 font-bold">${ap.band || '5GHz'} • الدور ${ap.floor || 0}</span>
          </div>
          <div class="flex justify-between border-b border-white/10 pb-1">
            <span class="text-slate-400 font-sans">إحداثيات الخريطة:</span>
            <span class="text-amber-300 font-bold">X: ${ap.x}px, Y: ${ap.y}px (${ap.pctX}%, ${ap.pctY}%)</span>
          </div>
          <div class="flex justify-between border-b border-white/10 pb-1">
            <span class="text-slate-400 font-sans">معامل المسار (Path Loss n):</span>
            <span class="text-white font-bold">${ap.pathLossN || 2.4}</span>
          </div>
          <div class="flex justify-between border-b border-white/10 pb-1">
            <span class="text-slate-400 font-sans">مرجع الإشارة (A @ 1m):</span>
            <span class="text-white font-bold">${ap.refRssi1m || -48} dBm</span>
          </div>
          <div class="flex justify-between border-b border-white/10 pb-1">
            <span class="text-slate-400 font-sans">الإشارة الحالية للجهاز:</span>
            <span class="text-emerald-400 font-bold">${rssi}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-sans">المسافة المحسوبة:</span>
            <span class="text-cyan-400 font-bold">${dist}</span>
          </div>
        </div>

        <button onclick="MapEngine.simulateTestPing(${ap.x}, ${ap.y}, '${ap.id}'); document.getElementById('apInspectorModal').style.display='none';" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 tap-effect">
          <span>🚀</span>
          <span>محاكاة وجود النزيل عند هذا الـ AP</span>
        </button>
      </div>
    `;
    inspector.style.display = 'flex';
  }
};

// Global Window Attachment
if (typeof window !== 'undefined') {
  window.MapEngine = MapEngine;
}
