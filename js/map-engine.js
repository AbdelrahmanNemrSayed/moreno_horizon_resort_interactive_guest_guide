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

  init() {
    this.renderPins();
    this.bindEvents();
    this.setLayer(this.currentLayer);

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

    // Calculate approximate walking distance from lobby or saved room
    const savedRoom = localStorage.getItem('moreno_guest_room');
    let originPoi = resortPois.find(p => p.id === 'M');
    if (savedRoom) {
      const roomNum = parseInt(savedRoom);
      const b = resortPois.filter(p => p.isBuilding).find(b => b.rooms.some(r => r.exact ? r.exact.includes(roomNum) : (roomNum >= r.min && roomNum <= r.max)));
      if (b) originPoi = b;
    }
    const originCoords = originPoi ? originPoi.coords : { x: 31.55, y: 68.36 };
    const distPx = Math.hypot((poi.coords.x - originCoords.x) * (this.CANVAS_WIDTH / 100), (poi.coords.y - originCoords.y) * (this.CANVAS_HEIGHT / 100));
    const distMeters = Math.round(distPx * 0.42);
    const walkMin = Math.max(1, Math.round(distMeters / 65));

    const popover = document.createElement('div');
    popover.id = 'activeMapPopover';
    popover.className = 'map-bottom-sheet-card';

    const imgUrl = poi.image || 'assets/images/hero_resort.jpg';
    const walkBtnText = (lang === 'ar') ? 'تحديد المسار والملاحة الحية 🚶‍♂️' : (lang === 'ru') ? 'Живой маршрут 🚶‍♂️' : (lang === 'de') ? 'Live Route 🚶‍♂️' : 'Live Route & Walk 🚶‍♂️';
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
        <button onclick="event.stopPropagation(); MapEngine.navigateDirectTo('${poi.id}')" class="tap-effect py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110">
          <span>🚶‍♂️</span>
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

    // Check if guest has saved room
    const savedRoom = localStorage.getItem('moreno_guest_room');
    const pinnedOrigin = resortPois.find(p => p.id === this.guestLocationPoiId);
    let originPoi = pinnedOrigin || resortPois.find(p => p.id === 'M');
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

    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const locDest = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(destPoi, lang) : { name: destPoi.nameAr };
    const locOrigin = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(originPoi, lang) : { name: originPoi.nameAr };

    this.drawRoute(originPoi.coords, destPoi.coords, locOrigin.name, locDest.name);
    this.startTurnByTurn(originPoi, destPoi, false);
  },

  drawRoute(originCoords, destCoords, originTitle, destTitle, isAccessible = false) {
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

    // Center and zoom map view to focus the full route
    const midPctX = (originCoords.x + destCoords.x) / 2;
    const midPctY = (originCoords.y + destCoords.y) / 2;
    this.focusCoordinate(midPctX, midPctY, 1.25);

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
    const origin = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(originPoi, lang) : { name: originPoi.nameAr };
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
            <span class="text-xs sm:text-sm font-black text-amber-300 font-mono">${minutes} دقيقة (${meters} م)</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">مسار حي</span>
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
    this.simSpeed = 1;
    this.is3D = true;
    this.set3DButtonsActive(true);

    const viewport = document.getElementById('mapViewport');
    if (viewport) viewport.classList.add('mode-3d');

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
        <div class="sim-walker-aura"></div>
        <div class="sim-walker-dot">🚶‍♂️</div>
      `;
      overlay.appendChild(walker);
    }
    if (walker) walker.style.display = 'block';

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
    const speedPxPerSec = 75; // ~30m/s baseline pace

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

      simHud.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center animate-subtle-float">
              🚶‍♂️
            </span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-white">${t.wf_start_simulation || 'محاكاة السير الحي'}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">GPS Live</span>
              </div>
              <p class="text-[11px] text-amber-300 font-bold mt-0.5">
                ${remainingMeters > 5 ? `${remainingMeters} ${t.wf_meters || 'متر متبقي'} • ${estMin} دقيقة` : (t.wf_sim_arrived || 'وصلت إلى وجهتك 🎉')}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button onclick="MapEngine.toggleSimSpeed()" class="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 text-xs font-bold transition tap-effect">
              ⚡ ${this.simSpeed}x
            </button>
            <button onclick="MapEngine.stopLiveWalkSimulation()" class="w-7 h-7 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center transition tap-effect" title="${t.wf_stop_simulation || 'إنهاء'}">
              ✕
            </button>
          </div>
        </div>

        <div class="w-full bg-white/15 h-1.5 rounded-full overflow-hidden mt-0.5">
          <div class="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-150" style="width: ${pct}%"></div>
        </div>
      `;
    };

    const animateWalk = (now) => {
      if (!this.isWalkingSimulating) return;

      const dt = (now - lastTime) / 1000;
      lastTime = now;

      progressPx += speedPxPerSec * this.simSpeed * dt;

      if (progressPx >= totalDistPx) {
        progressPx = totalDistPx;
        const endPoint = points[points.length - 1];
        if (walker) {
          walker.style.left = `${(endPoint.x / this.CANVAS_WIDTH) * 100}%`;
          walker.style.top = `${(endPoint.y / this.CANVAS_HEIGHT) * 100}%`;
        }
        updateHud(0);

        if (typeof PromoAudioEngine !== 'undefined') {
          PromoAudioEngine.playTransitionChime();
        }
        if (typeof ConciergeAudioGuide !== 'undefined' && !ConciergeAudioGuide.isMuted) {
          ConciergeAudioGuide.speak(t.wf_sim_arrived || 'لقد وصلت إلى وجهتك بنجاح', lang);
        }

        setTimeout(() => {
          this.stopLiveWalkSimulation();
        }, 3500);
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

      const angleRad = Math.atan2(p2.x - p1.x, -(p2.y - p1.y));
      const targetBearing = (angleRad * 180) / Math.PI;

      const curPctX = (curX / this.CANVAS_WIDTH) * 100;
      const curPctY = (curY / this.CANVAS_HEIGHT) * 100;
      if (walker) {
        walker.style.left = `${curPctX}%`;
        walker.style.top = `${curPctY}%`;
      }

      this.flyToWalk(curPctX, curPctY, 1.85, 54, targetBearing);

      const remainingMeters = Math.max(0, Math.round((totalDistPx - progressPx) * 0.42));
      updateHud(remainingMeters);

      this.simRafId = requestAnimationFrame(animateWalk);
    };

    updateHud(totalMeters);
    this.simRafId = requestAnimationFrame(animateWalk);
  },

  flyToWalk(pctX, pctY, targetScale = 1.85, targetPitch = 54, targetBearing = 0) {
    const viewport = document.getElementById('mapViewport');
    const canvas = document.getElementById('mapCanvasWrapper');
    if (!viewport || !canvas) return;

    this.scale = targetScale;
    this.pitch = targetPitch;
    this.bearing = targetBearing;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    const cx = this.CANVAS_WIDTH / 2;
    const cy = this.CANVAS_HEIGHT / 2;

    const targetPixelX = (pctX / 100) * this.CANVAS_WIDTH;
    const targetPixelY = (pctY / 100) * this.CANVAS_HEIGHT;

    const dx = targetPixelX - cx;
    const dy = targetPixelY - cy;

    const radZ = (this.bearing * Math.PI) / 180;
    const radX = (this.pitch * Math.PI) / 180;

    const x1 = dx * Math.cos(radZ) - dy * Math.sin(radZ);
    const y1 = dx * Math.sin(radZ) + dy * Math.cos(radZ);

    const x2 = x1;
    const y2 = y1 * Math.cos(radX);
    const z2 = -y1 * Math.sin(radX);

    const D = 1200;
    const k = D / (D - z2);

    const projX = x2 * k * this.scale;
    const projY = y2 * k * this.scale;

    const desiredScreenX = vw / 2;
    const desiredScreenY = vh * 0.52;

    this.panX = desiredScreenX - cx - projX;
    this.panY = desiredScreenY - cy - projY;

    canvas.style.transition = 'none';
    canvas.style.transformOrigin = '50% 50%';
    canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale}) rotateX(${this.pitch}deg) rotateZ(${this.bearing}deg)`;

    this.updatePinBillboards();
    this.updateCompassUI();
  },

  toggleSimSpeed() {
    this.simSpeed = this.simSpeed === 1 ? 2 : (this.simSpeed === 2 ? 3 : 1);
  },

  stopLiveWalkSimulation() {
    this.isWalkingSimulating = false;
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
      originPoi = resortPois.find(p => p.id === 'M') || { coords: { x: 31.55, y: 68.36 }, nameAr: 'المبنى الرئيسي (Lobby M)' };
    }
    if (!targetPoi) return;

    const steps = this.buildWalkwaySteps(originPoi, targetPoi, lang, isAccessible);
    
    // Draw route path and retrieve calculated metrics
    const routeInfo = this.drawRoute(originPoi.coords, targetPoi.coords, originPoi.nameAr, targetPoi.nameAr, isAccessible);

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

    // Place initial walker marker at the starting coordinate
    this.initWalkerMarker(originPoi.coords);

    this.renderTurnStep(recenterCamera);
    if (recenterCamera) {
      this.scrollToMap();
    }
  },

  renderTurnStep(recenterCamera = true) {
    if (!this.activeNavigation) return;
    const nav = this.activeNavigation;
    const step = nav.steps[nav.currentStepIdx];
    const total = nav.steps.length;
    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    const hud = document.getElementById('turnNavHud');
    if (!hud) return;

    const progressPct = this.isSimulatingWalk
      ? (this.walkProgress * 100)
      : (((nav.currentStepIdx + 1) / total) * 100);

    const stepOfText = (t.nav_step_of || 'الخطوة {current} من {total}')
      .replace('{current}', nav.currentStepIdx + 1)
      .replace('{total}', total);

    const isLastStep = nav.currentStepIdx === total - 1;

    const simBtnText = this.isSimulatingWalk
      ? (lang === 'ar' ? 'إيقاف مؤقت' : lang === 'ru' ? 'Пауза' : lang === 'de' ? 'Pause' : 'Pause')
      : this.walkProgress >= 1
      ? (lang === 'ar' ? 'إعادة السير' : lang === 'ru' ? 'Заново' : lang === 'de' ? 'Neustart' : 'Restart')
      : (lang === 'ar' ? 'محاكاة السير الحي' : lang === 'ru' ? 'Живая ходьба' : lang === 'de' ? 'Live-Simulation' : 'Live Walk');

    const simBtnIcon = this.isSimulatingWalk ? '⏸️' : this.walkProgress >= 1 ? '🔄' : '▶️';
    const simBtnClass = this.isSimulatingWalk
      ? 'bg-amber-500 text-slate-950 font-black'
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
          <span class="text-[10px] font-mono text-cyan-300">
            ⏱️ ${nav.minutes} د (${nav.meters}م)
          </span>
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
        <button onclick="MapEngine.toggleWalkSpeed()" class="tap-effect py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-xs" title="سرعة المحاكاة">
          ${this.walkSpeed === 2 ? '2x ⚡' : '1x'}
        </button>
        <button onclick="MapEngine.prevTurnStep()" ${nav.currentStepIdx === 0 ? 'disabled' : ''} class="tap-effect py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-25 text-white font-bold text-xs" title="السابقة">
          ⬅️
        </button>
        <button onclick="${isLastStep ? 'MapEngine.endTurnByTurn()' : 'MapEngine.nextTurnStep()'}" class="tap-effect py-1.5 px-3 rounded-xl ${isLastStep ? 'bg-emerald-500 text-white font-black' : 'bg-white/15 hover:bg-white/25 text-white font-bold'} text-xs">
          ${isLastStep ? (t.nav_step_finish || 'إنهاء ✓') : (t.nav_step_next || 'التالية ➔')}
        </button>
      </div>
    `;

    // Recenter camera on step coordinates if not currently simulating walk
    if (recenterCamera && !this.isSimulatingWalk && step.coords) {
      this.focusCoordinate(step.coords.x, step.coords.y, 1.45);
      this.updateWalkerBeacon(step.coords);
    }
  },

  // Interactive Live Walk Simulation Methods
  toggleLiveWalkSimulation() {
    if (this.isWalkingSimulating) {
      this.stopLiveWalkSimulation();
    } else {
      this.startLiveWalkSimulation();
    }
  },

  startTurnByTurnSimulation() {
    if (!this.activeNavigation) return;
    const pathEl = document.getElementById('liveRouteSvgPath');
    if (!pathEl) {
      // Fallback: draw route again to ensure path is loaded
      this.drawRoute(this.activeNavigation.originPoi.coords, this.activeNavigation.targetPoi.coords, '', '', this.activeNavigation.isAccessible);
    }
    const targetPath = document.getElementById('liveRouteSvgPath');
    if (!targetPath) return;

    this.isSimulatingWalk = true;
    if (this.walkProgress >= 1) {
      this.walkProgress = 0;
      this.activeNavigation.currentStepIdx = 0;
    }
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(900);

    const totalLength = targetPath.getTotalLength();
    const durationMs = Math.max(7000, (this.activeNavigation.meters || 120) * 75);
    let lastTime = null;

    const loop = (now) => {
      if (!this.isSimulatingWalk) return;
      if (lastTime === null) {
        lastTime = now;
        this.walkAnimFrame = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(100, Math.max(0, now - lastTime));
      lastTime = now;

      this.walkProgress = Math.min(1, Math.max(0,
        this.walkProgress + (dt / durationMs) * (this.walkSpeed || 1)
      ));
      if (this.walkProgress >= 1) {
        this.walkProgress = 1;
        this.updateWalkerMarker(targetPath, totalLength, 1);
        this.onWalkSimulationComplete();
        return;
      }

      this.updateWalkerMarker(targetPath, totalLength, this.walkProgress);

      // Auto step advancement based on path milestone
      const steps = this.activeNavigation.steps;
      if (steps && steps.length > 0) {
        const targetStep = Math.min(steps.length - 1, Math.max(0, Math.floor(this.walkProgress * steps.length)));
        if (targetStep !== this.activeNavigation.currentStepIdx) {
          this.activeNavigation.currentStepIdx = targetStep;
          this.renderTurnStep(false);
          if (typeof App !== 'undefined' && App.playBeep) App.playBeep(850);
        }
      }

      this.walkAnimFrame = requestAnimationFrame(loop);
    };

    if (this.walkAnimFrame) cancelAnimationFrame(this.walkAnimFrame);
    this.walkAnimFrame = requestAnimationFrame(loop);
    this.renderTurnStep(false);
  },

  pauseLiveWalkSimulation() {
    this.isSimulatingWalk = false;
    if (this.walkAnimFrame) {
      cancelAnimationFrame(this.walkAnimFrame);
      this.walkAnimFrame = null;
    }
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(650);
    this.renderTurnStep(false);
  },

  toggleWalkSpeed() {
    this.walkSpeed = this.walkSpeed === 1 ? 2 : 1;
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(750);
    this.renderTurnStep(false);
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
    this.walkProgress = 0;
    document.body.classList.remove('turn-navigation-active');

    const hud = document.getElementById('turnNavHud');
    if (hud) hud.classList.add('hidden');
    const beacon = document.getElementById('walkerBeacon');
    if (beacon) beacon.remove();
    const marker = document.getElementById('liveWalkerMarker');
    if (marker) marker.remove();
    this.removeRoomBeacon();
  }
};

// Global Window Attachment
if (typeof window !== 'undefined') {
  window.MapEngine = MapEngine;
}
