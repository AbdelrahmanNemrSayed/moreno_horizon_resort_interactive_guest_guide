/**
 * Moreno Horizon Spa & Resort - Interactive Walkway & Navigation Engine
 * Features:
 * - Dynamic Start & Destination Selection (User selects origin & destination anywhere on map)
 * - Pure Resort Shapes & Pathways extracted from the original resort map (No promotional text/sidebars)
 * - Layer Switcher: Pure Vector Shapes Mode | Official Map Overlay Mode | Satellite Mode | Night Mode
 * - Interactive Player Avatar (You / Guest) with Live Walking Animation & Footsteps
 * - Direction Swap (⇄) and Instant Tap-to-Walk
 * - Ambient Web Audio API Synthesizer (Footsteps & Arrival Chime)
 * - Synchronized with Wayfinder 2.0 Room Lookup & Directory Cards
 */

const VirtualResortMap = {
  WIDTH: 896,
  HEIGHT: 1200,

  // Display Mode: 'shapes_only' | 'map_overlay' | 'satellite' | 'night'
  viewMode: 'shapes_only',
  isSoundEnabled: false,
  moveSpeed: 1.0,

  // Navigation Selection State
  nav: {
    selectionMode: 'start', // 'start' | 'dest' | 'idle'
    startPoint: { x: 282, y: 780, name: 'المبنى الرئيسي (Lobby M)', id: 'M' },
    destPoint: { x: 390, y: 340, name: 'منطقة الشاطئ والمارينا', id: '1' },
    activeRoutePath: [],
    distMeters: 0,
    walkMinutes: 0
  },

  // Player Avatar State
  player: {
    x: 282,
    y: 780,
    targetX: null,
    targetY: null,
    isWalking: false,
    path: [],
    currentPathIdx: 0,
    heading: 0,
    facingLeft: false,
    walkFrame: 0,
    onArrival: null
  },

  // Walkway Graph Network (Traces the exact paths and shapes from the resort map)
  nodes: {
    // 1. Sea & Pier
    'poi_pier_tip': { x: 390, y: 110, name: 'رصيف المارينا (نهاية الرصيف)', neighbors: ['hub_pier_mid'] },
    'hub_pier_mid': { x: 390, y: 220, name: 'ممشى المارينا الخشبي', neighbors: ['poi_pier_tip', 'hub_beach_shore'] },
    'hub_beach_shore': { x: 390, y: 340, name: 'شاطئ البحر والمارينا (1)', neighbors: ['hub_pier_mid', 'poi_beach_bar', 'poi_oriental', 'hub_kids_area'] },
    'poi_beach_area': { x: 390, y: 340, name: 'شاطئ البحر والمارينا (1)', neighbors: ['hub_beach_shore'] },

    // Northern Promenade (Diving, Aqua Park, Kids, Bars, La Mama)
    'poi_diving': { x: 140, y: 290, name: 'مركز الغوص (2)', neighbors: ['poi_aquapark', 'hub_kids_area'] },
    'poi_aquapark': { x: 140, y: 380, name: 'أكوا بارك مورينو (3)', neighbors: ['poi_diving', 'hub_kids_area', 'hub_wing_n_north'] },
    'hub_kids_area': { x: 250, y: 380, name: 'منطقة ألعاب الأطفال (4)', neighbors: ['poi_aquapark', 'poi_diving', 'hub_beach_shore', 'poi_beach_bar', 'hub_garden_north'] },
    'poi_beach_bar': { x: 320, y: 390, name: 'بار الشاطئ (5)', neighbors: ['hub_kids_area', 'hub_beach_shore', 'hub_garden_north', 'poi_oriental'] },
    'poi_oriental': { x: 440, y: 390, name: 'المطعم الشرقي وسناك بار (6)', neighbors: ['hub_beach_shore', 'poi_beach_bar', 'hub_garden_north', 'poi_lamama'] },
    'poi_lamama': { x: 530, y: 440, name: 'مطعم لا ماما الإيطالي (8)', neighbors: ['poi_oriental', 'hub_garden_east', 'poi_sirena'] },

    // Central Garden Paths around the Central Circular Pool
    'hub_garden_north': { x: 390, y: 490, name: 'ممشى الحديقة الشمالي', neighbors: ['hub_kids_area', 'poi_beach_bar', 'poi_oriental', 'hub_garden_west', 'hub_garden_east'] },
    'poi_sirena': { x: 385, y: 770, name: 'مطعم سيرينا الرئيسي (12)', neighbors: ['hub_garden_south', 'poi_lobby_m', 'hub_entrance_plaza', 'hub_garden_east'] },
    'hub_garden_west': { x: 290, y: 600, name: 'ممشى الحديقة الغربي (مسبح)', neighbors: ['hub_garden_north', 'poi_wing_n', 'hub_garden_south', 'poi_lobby_m'] },
    'hub_garden_east': { x: 490, y: 600, name: 'ممشى الحديقة الشرقي (مسبح)', neighbors: ['hub_garden_north', 'poi_lamama', 'hub_garden_south', 'poi_wing_s', 'poi_sirena'] },
    'hub_garden_south': { x: 390, y: 690, name: 'ممشى الحديقة الجنوبي', neighbors: ['hub_garden_west', 'hub_garden_east', 'poi_lobby_m', 'poi_sirena', 'hub_entrance_plaza'] },

    // Wing N (North Wing)
    'hub_wing_n_north': { x: 190, y: 490, name: 'ممر الجناح الشمالي', neighbors: ['poi_aquapark', 'poi_wing_n', 'hub_parking_1'] },
    'poi_wing_n': { x: 190, y: 610, name: 'المبنى الشمالي (Wing N)', neighbors: ['hub_wing_n_north', 'hub_garden_west', 'poi_lobby_m', 'hub_parking_1'] },
    'hub_parking_1': { x: 60, y: 670, name: 'موقف السيارات 1 (13)', neighbors: ['hub_wing_n_north', 'poi_wing_n', 'poi_mls', 'poi_side_gate'] },

    // Wing S (South Wing) & Lotus Pool
    'poi_wing_s': { x: 550, y: 610, name: 'المبنى الجنوبي (Wing S)', neighbors: ['hub_garden_east', 'poi_tennis', 'hub_parking_2'] },
    'poi_tennis': { x: 610, y: 690, name: 'ملاعب التنس (10)', neighbors: ['poi_wing_s', 'poi_lotus_pool', 'hub_parking_2'] },
    'poi_lotus_pool': { x: 610, y: 800, name: 'مسبح لوتس (11)', neighbors: ['poi_tennis', 'hub_parking_2', 'poi_main_gate'] },

    // Lobby M (Central Palace)
    'poi_lobby_m': { x: 282, y: 780, name: 'المبنى الرئيسي واللوبي (Lobby M)', neighbors: ['hub_garden_west', 'hub_garden_south', 'poi_wing_n', 'hub_entrance_plaza'] },
    'hub_entrance_plaza': { x: 340, y: 840, name: 'ساحة الاستقبال الرئيسية', neighbors: ['poi_lobby_m', 'hub_garden_south', 'poi_clinic', 'poi_mosque', 'hub_avenue_mid'] },

    // Southern Entrances, Mosque, Clinic & MLS
    'hub_avenue_mid': { x: 470, y: 920, name: 'طريق المنتجع الداخلي', neighbors: ['hub_entrance_plaza', 'poi_mosque', 'hub_parking_2', 'poi_main_gate'] },
    'hub_parking_2': { x: 580, y: 910, name: 'موقف السيارات 2 (17)', neighbors: ['poi_wing_s', 'poi_tennis', 'poi_lotus_pool', 'hub_avenue_mid', 'poi_main_gate'] },
    'poi_main_gate': { x: 610, y: 1020, name: 'البوابة الرئيسية (18)', neighbors: ['hub_parking_2', 'hub_avenue_mid', 'poi_mosque'] },
    'poi_mosque': { x: 420, y: 1000, name: 'مسجد المنتجع (16)', neighbors: ['hub_entrance_plaza', 'hub_avenue_mid', 'poi_main_gate', 'poi_clinic'] },
    'poi_clinic': { x: 360, y: 1000, name: 'العيادة والصيدلية (15)', neighbors: ['hub_entrance_plaza', 'poi_mosque', 'poi_mls'] },
    'poi_mls': { x: 160, y: 980, name: 'المبنى التجاري (MLS Mall)', neighbors: ['hub_parking_1', 'poi_clinic', 'poi_side_gate'] },
    'poi_side_gate': { x: 50, y: 990, name: 'البوابة الجانبية (14)', neighbors: ['poi_mls', 'hub_parking_1'] }
  },

  // POI Key to Node Key
  poiToNodeMap: {
    '1': 'poi_beach_area',
    '2': 'poi_diving',
    '3': 'poi_aquapark',
    '4': 'hub_kids_area',
    '5': 'poi_beach_bar',
    '6': 'poi_oriental',
    '8': 'poi_lamama',
    '9': 'hub_garden_east',
    '10': 'poi_tennis',
    '11': 'poi_lotus_pool',
    '12': 'poi_sirena',
    '13': 'hub_parking_1',
    '14': 'poi_side_gate',
    '15': 'poi_clinic',
    '16': 'poi_mosque',
    '17': 'hub_parking_2',
    '18': 'poi_main_gate',
    'N': 'poi_wing_n',
    'S': 'poi_wing_s',
    'M': 'poi_lobby_m',
    'MLS': 'poi_mls'
  },

  // Audio Context
  audioCtx: null,

  // Animation Loop ID
  animFrameId: null,
  lastTimestamp: 0,

  /**
   * Initialize Virtual Map
   */
  init() {
    this.renderCanvasWorld();
    this.startAnimationLoop();
    this.initAudio();
    this.populateNavigatorSelectors();
    this.updateRouteBetweenStartAndDest(false);
  },

  /**
   * Render the Canvas and SVG Elements
   */
  renderCanvasWorld() {
    const container = document.getElementById('mapCanvasWrapper');
    if (!container) return;

    container.style.width = `${this.WIDTH}px`;
    container.style.height = `${this.HEIGHT}px`;
    container.style.position = 'relative';

    container.innerHTML = `
      <!-- Optional Background Image (Illustrated Map Photo without directory text) -->
      <img id="resortMapIllustrated" src="moreno_resort_map_new.png" alt="Moreno Horizon Map"
           class="earth-layer-img ${this.viewMode === 'map_overlay' ? 'active' : 'inactive'}" draggable="false">

      <!-- Optional Satellite Photo -->
      <img id="resortMapSatellite" src="assets/images/moreno_earth_day.jpg" alt="Satellite Map" 
           class="earth-layer-img ${this.viewMode === 'satellite' ? 'active' : 'inactive'}" draggable="false">

      <!-- Optional Night Photo -->
      <img id="resortMapNight" src="assets/images/moreno_earth_night.jpg" alt="Night Map" 
           class="earth-layer-img ${this.viewMode === 'night' ? 'active' : 'inactive'}" draggable="false">

      <!-- Master SVG Resort World: Shapes, Pathways, Avatar, Markers -->
      <svg id="virtualResortSvg" viewBox="0 0 ${this.WIDTH} ${this.HEIGHT}" 
           class="absolute inset-0 w-full h-full pointer-events-auto z-20 select-none overflow-visible">
        
        <defs>
          <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="70%" stop-color="#0ea5e9" />
            <stop offset="100%" stop-color="#38bdf8" />
          </linearGradient>

          <linearGradient id="poolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" />
            <stop offset="50%" stop-color="#22d3ee" />
            <stop offset="100%" stop-color="#0284c7" />
          </linearGradient>

          <linearGradient id="pathGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="50%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#00f0ff" />
          </linearGradient>

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="dropShadow25D" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#020617" flood-opacity="0.35" />
          </filter>
        </defs>

        <!-- PURE RESORT SHAPES LAYER (Drawn from the Old Map) -->
        <g id="layerResortShapes" class="${this.viewMode === 'shapes_only' ? 'opacity-100' : 'opacity-25'} transition-opacity duration-300">
          <!-- 1. Resort Grounds & Lawn Base -->
          <rect x="0" y="0" width="${this.WIDTH}" height="${this.HEIGHT}" fill="#15803d" />
          
          <!-- 2. The Red Sea & Coastline (Top Zone) -->
          <rect x="0" y="0" width="${this.WIDTH}" height="250" fill="url(#seaGrad)" />
          <path d="M 0 230 Q 380 260 896 230 L 896 255 L 0 255 Z" fill="#bae6fd" opacity="0.75" />

          <!-- 3. Golden Sand Beach Area -->
          <path d="M 0 250 Q 380 270 896 250 L 896 320 Q 380 340 0 320 Z" fill="#fde047" />

          <!-- 4. Wooden Marina Pier extending into the sea -->
          <g filter="url(#dropShadow25D)">
            <rect x="378" y="60" width="24" height="230" rx="4" fill="#a16207" />
            <rect x="381" y="62" width="18" height="226" fill="#ca8a04" />
            <rect x="355" y="50" width="70" height="35" rx="6" fill="#a16207" />
            <text x="390" y="72" text-anchor="middle" font-size="10" font-weight="900" fill="#451a03">🛥️ MARINA PIER</text>
            <!-- Moored Yacht -->
            <polygon points="415,80 435,70 455,80 450,110 420,110" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
          </g>

          <!-- 5. Aqua Park with Multi-Colored Spiral Slides -->
          <g transform="translate(140, 360)" filter="url(#dropShadow25D)">
            <ellipse cx="0" cy="0" rx="55" ry="35" fill="url(#poolGrad)" stroke="#ffffff" stroke-width="2" />
            <!-- Spiral Slides -->
            <path d="M -30 -30 C 10 -20, 20 0, -10 15 L 0 22" fill="none" stroke="#eab308" stroke-width="7" stroke-linecap="round" />
            <path d="M -25 -35 C -40 -15, -10 0, -25 18" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" />
            <text x="0" y="32" text-anchor="middle" font-size="9" font-weight="900" fill="#ffffff">AQUA PARK</text>
          </g>

          <!-- 6. Central Circular / Oval Pool Lagoon -->
          <g transform="translate(390, 580)" filter="url(#dropShadow25D)">
            <ellipse cx="0" cy="0" rx="85" ry="58" fill="#fed7aa" />
            <ellipse cx="0" cy="0" rx="78" ry="52" fill="url(#poolGrad)" stroke="#ffffff" stroke-width="2" />
            <!-- Center Palm Island -->
            <ellipse cx="0" cy="0" rx="22" ry="14" fill="#fef08a" />
            <circle cx="0" cy="-2" r="8" fill="#15803d" />
            <text x="0" y="1" text-anchor="middle" font-size="8">🌴</text>
            <text x="0" y="38" text-anchor="middle" font-size="9" font-weight="900" fill="#ffffff">CENTRAL POOL</text>
          </g>

          <!-- 7. Lotus Pool (Rectangular pool on right side) -->
          <g transform="translate(610, 800)" filter="url(#dropShadow25D)">
            <rect x="-22" y="-55" width="44" height="110" rx="8" fill="url(#poolGrad)" stroke="#ffffff" stroke-width="2" />
            <text x="0" y="4" text-anchor="middle" font-size="9" font-weight="900" fill="#ffffff" transform="rotate(-90, 0, 4)">LOTUS POOL</text>
          </g>

          <!-- 8. Tennis Courts -->
          <g transform="translate(610, 690)" filter="url(#dropShadow25D)">
            <rect x="-35" y="-22" width="70" height="44" rx="4" fill="#16a34a" stroke="#ffffff" stroke-width="1.5" />
            <line x1="0" y1="-22" x2="0" y2="22" stroke="#ffffff" stroke-width="2" stroke-dasharray="2 2" />
            <text x="0" y="4" text-anchor="middle" font-size="10">🎾</text>
          </g>

          <!-- 9. Building M (Main Palace & Lobby) -->
          <g transform="translate(282, 780)" filter="url(#dropShadow25D)">
            <rect x="-65" y="-35" width="130" height="70" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
            <path d="M -25 -35 C -25 -65, 25 -65, 25 -35 Z" fill="#d97706" />
            <rect x="-65" y="-42" width="130" height="10" fill="#ea580c" rx="3" />
            <text x="0" y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#0b2545">LOBBY M</text>
            <text x="0" y="18" text-anchor="middle" font-size="8" font-weight="800" fill="#d97706">المبنى الرئيسي</text>
          </g>

          <!-- 10. Wing N (North Building) -->
          <g transform="translate(190, 610)" filter="url(#dropShadow25D)">
            <rect x="-45" y="-55" width="90" height="110" rx="8" fill="#f8fafc" stroke="#0284c7" stroke-width="2" />
            <rect x="-45" y="-62" width="90" height="10" fill="#0284c7" rx="3" />
            <text x="0" y="-8" text-anchor="middle" font-size="11" font-weight="900" fill="#0284c7">WING N</text>
            <text x="0" y="8" text-anchor="middle" font-size="8" font-weight="800" fill="#475569">المبنى الشمالي</text>
          </g>

          <!-- 11. Wing S (South Building) -->
          <g transform="translate(550, 610)" filter="url(#dropShadow25D)">
            <rect x="-45" y="-55" width="90" height="110" rx="8" fill="#f8fafc" stroke="#d97706" stroke-width="2" />
            <rect x="-45" y="-62" width="90" height="10" fill="#d97706" rx="3" />
            <text x="0" y="-8" text-anchor="middle" font-size="11" font-weight="900" fill="#d97706">WING S</text>
            <text x="0" y="8" text-anchor="middle" font-size="8" font-weight="800" fill="#475569">المبنى الجنوبي</text>
          </g>

          <!-- 12. MLS Mall (Circular Complex) -->
          <g transform="translate(160, 980)" filter="url(#dropShadow25D)">
            <circle cx="0" cy="0" r="42" fill="#f8fafc" stroke="#047857" stroke-width="2" />
            <circle cx="0" cy="0" r="32" fill="#d97706" opacity="0.8" />
            <circle cx="0" cy="0" r="18" fill="#047857" />
            <text x="0" y="3" text-anchor="middle" font-size="9" font-weight="900" fill="#ffffff">MLS</text>
          </g>

          <!-- 13. Mosque & Clinic & Gate -->
          <g transform="translate(420, 1000)" filter="url(#dropShadow25D)">
            <rect x="-24" y="-18" width="48" height="36" rx="6" fill="#f8fafc" stroke="#047857" stroke-width="1.5" />
            <text x="0" y="4" text-anchor="middle" font-size="12">🕌</text>
          </g>
          <g transform="translate(360, 1000)" filter="url(#dropShadow25D)">
            <rect x="-24" y="-18" width="48" height="36" rx="6" fill="#f8fafc" stroke="#ef4444" stroke-width="1.5" />
            <text x="0" y="4" text-anchor="middle" font-size="12">🏥</text>
          </g>
          <g transform="translate(610, 1020)" filter="url(#dropShadow25D)">
            <rect x="-30" y="-14" width="60" height="28" rx="6" fill="#0b2545" stroke="#dda15e" stroke-width="2" />
            <text x="0" y="4" text-anchor="middle" font-size="8" font-weight="900" fill="#ffffff">MAIN GATE</text>
          </g>
        </g>

        <!-- 2. WALKWAY NETWORK PATHS (Clean Sandstone Paths Matching Old Map) -->
        <g id="layerWalkwayPaths">
          ${this.generateWalkwayLines()}
        </g>

        <!-- 3. DYNAMIC ACTIVE ROUTE TRAIL (Glowing Path connecting Start -> Destination) -->
        <g id="layerActiveRoute" filter="url(#glowFilter)">
          <path id="activeRouteBackground" d="" fill="none" stroke="#000000" stroke-width="8" stroke-opacity="0.4" stroke-linecap="round" stroke-linejoin="round" />
          <path id="activeRouteGlow" d="" fill="none" stroke="url(#pathGlowGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" class="route-line-dynamic" />
        </g>

        <!-- 4. DESTINATION TARGET MARKER (🎯 الوجهة) -->
        <g id="markerDestination" transform="translate(${this.nav.destPoint.x}, ${this.nav.destPoint.y})">
          <circle cx="0" cy="0" r="18" fill="#ef4444" fill-opacity="0.25" class="player-pulse-ring" />
          <circle cx="0" cy="0" r="8" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
          <g transform="translate(0, -26)">
            <rect x="-36" y="-11" width="72" height="18" rx="9" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" filter="url(#dropShadow25D)" />
            <text x="0" y="2" text-anchor="middle" font-size="8.5" font-weight="900" fill="#ffffff">🎯 الوجهة</text>
          </g>
        </g>

        <!-- 5. PLAYER AVATAR (🟢 البداية: أنت هنا) -->
        <g id="actorPlayer" transform="translate(${this.player.x}, ${this.player.y})" filter="url(#dropShadow25D)">
          ${this.renderAvatarSvg()}
        </g>

        <!-- 6. INTERACTIVE 3D PINS -->
        <g id="layerPins">
          ${this.generateInteractivePins()}
        </g>

        <!-- 7. TAP HIT AREA -->
        <rect id="svgHitLayer" x="0" y="0" width="${this.WIDTH}" height="${this.HEIGHT}" fill="transparent" class="cursor-pointer" />
      </svg>
    `;

    // Click handler for Setting Start/Dest or Walking
    const hitArea = document.getElementById('svgHitLayer');
    if (hitArea) {
      hitArea.addEventListener('click', (e) => this.handleMapClick(e));
    }
  },

  generateWalkwayLines() {
    let out = '';
    const visited = new Set();

    for (const [key, node] of Object.entries(this.nodes)) {
      for (const nKey of node.neighbors) {
        const neighbor = this.nodes[nKey];
        if (!neighbor) continue;

        const edgeId = [key, nKey].sort().join('--');
        if (visited.has(edgeId)) continue;
        visited.add(edgeId);

        out += `
          <!-- Walkway segment -->
          <line x1="${node.x}" y1="${node.y}" x2="${neighbor.x}" y2="${neighbor.y}" 
                stroke="#fed7aa" stroke-width="10" stroke-linecap="round" stroke-opacity="0.85" />
          <line x1="${node.x}" y1="${node.y}" x2="${neighbor.x}" y2="${neighbor.y}" 
                stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 6" stroke-opacity="0.6" />
        `;
      }
    }
    return out;
  },

  generateInteractivePins() {
    if (typeof resortPois === 'undefined') return '';
    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';

    return resortPois.map(poi => {
      // Map node key
      const nodeKey = this.poiToNodeMap[poi.id];
      const node = this.nodes[nodeKey];
      const px = node ? node.x : (poi.coords.x / 100) * this.WIDTH;
      const py = node ? node.y : (poi.coords.y / 100) * this.HEIGHT;
      const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr };

      return `
        <g id="vpin-${poi.id}" onclick="VirtualResortMap.onPinClick('${poi.id}')" class="virtual-resort-pin cursor-pointer tap-effect" transform="translate(${px}, ${py})">
          <line x1="0" y1="0" x2="0" y2="-18" stroke="#ffffff" stroke-width="2" />
          <g transform="translate(0, -20)">
            <circle cx="0" cy="0" r="12" fill="#0b2545" stroke="#ffffff" stroke-width="1.5" />
            <circle cx="0" cy="0" r="10" fill="${poi.isBuilding ? '#d97706' : '#0284c7'}" />
            <text x="0" y="3.5" text-anchor="middle" font-size="8.5" font-weight="900" fill="#ffffff">${poi.num}</text>
          </g>
          <g class="vpin-label opacity-0 hover:opacity-100 transition-opacity pointer-events-none" transform="translate(0, -38)">
            <rect x="-40" y="-10" width="80" height="18" rx="9" fill="#0f172a" stroke="#fbbf24" stroke-width="1" />
            <text x="0" y="2" text-anchor="middle" font-size="8" font-weight="800" fill="#ffffff">${loc.name}</text>
          </g>
        </g>
      `;
    }).join('');
  },

  renderAvatarSvg() {
    return `
      <!-- Location Pulse Ring -->
      <circle cx="0" cy="8" r="18" fill="#10b981" fill-opacity="0.35" class="player-pulse-ring" />
      <ellipse cx="0" cy="8" rx="12" ry="5" fill="#020617" opacity="0.45" />

      <!-- Human Character (You / Guest) -->
      <g id="playerBodyGroup">
        <line x1="-3" y1="2" x2="-3" y2="8" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
        <line x1="3" y1="2" x2="3" y2="8" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
        <rect x="-7" y="-8" width="14" height="11" rx="2" fill="#0284c7" stroke="#ffffff" stroke-width="1" />
        <line x1="-6" y1="-8" x2="4" y2="3" stroke="#fbbf24" stroke-width="1.5" />
        <circle cx="0" cy="-14" r="7" fill="#fed7aa" stroke="#ffffff" stroke-width="1" />
        <rect x="-4" y="-16" width="8" height="3" rx="1" fill="#0f172a" />
        <ellipse cx="0" cy="-19" rx="9" ry="3" fill="#fbbf24" />
        <path d="M -5 -19 C -5 -24, 5 -24, 5 -19 Z" fill="#d97706" />
      </g>

      <!-- Badge "أنت هنا • You" -->
      <g transform="translate(0, -32)" class="pointer-events-none">
        <rect x="-38" y="-10" width="76" height="17" rx="8.5" fill="#0b2545" stroke="#10b981" stroke-width="1.5" />
        <text x="0" y="2" text-anchor="middle" font-size="8.5" font-weight="900" fill="#10b981">🟢 البداية: أنت هنا</text>
      </g>
    `;
  },

  /* ================= INTERACTIVE DUAL-POINT NAVIGATION ================= */

  /**
   * Set Start Location (Where you stand)
   */
  setStartLocation(x, y, name, id = null) {
    this.nav.startPoint = { x, y, name, id };
    this.player.x = x;
    this.player.y = y;
    this.player.isWalking = false;

    const el = document.getElementById('actorPlayer');
    if (el) el.setAttribute('transform', `translate(${x}, ${y})`);

    // Sync dropdown
    const select = document.getElementById('guestOriginSelect');
    if (select && id) select.value = id;

    // Recalculate route to destination
    this.updateRouteBetweenStartAndDest(false);

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`🟢 تم تحديد نقطة البداية: ${name}`);
    }
  },

  /**
   * Set Destination Location (Where to go)
   */
  setDestination(x, y, name, id = null) {
    this.nav.destPoint = { x, y, name, id };

    const marker = document.getElementById('markerDestination');
    if (marker) marker.setAttribute('transform', `translate(${x}, ${y})`);

    // Sync dropdown
    const select = document.getElementById('guestDestSelect');
    if (select && id) select.value = id;

    // Recalculate route to destination
    this.updateRouteBetweenStartAndDest(true);

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`🎯 تم تحديد الوجهة: ${name}`);
    }
  },

  /**
   * Calculate Shortest Path between Start & Destination
   */
  updateRouteBetweenStartAndDest(autoStartWalk = false) {
    const startKey = this.getNearestNodeKey(this.nav.startPoint.x, this.nav.startPoint.y);
    const destKey = this.getNearestNodeKey(this.nav.destPoint.x, this.nav.destPoint.y);

    const path = this.findPath(startKey, destKey);
    path.push({ x: this.nav.destPoint.x, y: this.nav.destPoint.y });

    this.nav.activeRoutePath = path;
    this.drawDynamicRoute(path);

    // Calculate distance & time
    let meters = 0;
    for (let i = 1; i < path.length; i++) {
      meters += Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y);
    }
    this.nav.distMeters = Math.round(meters * 0.38);
    this.nav.walkMinutes = Math.max(1, Math.round(this.nav.distMeters / (this.moveSpeed > 1.5 ? 95 : 60)));

    // Update Telemetry HUD
    this.renderRouteInfoHud();

    if (autoStartWalk) {
      this.startWalkingRoute();
    }
  },

  renderRouteInfoHud() {
    const badge = document.getElementById('activePoiText');
    if (badge) {
      badge.innerHTML = `🟢 <strong>${this.nav.startPoint.name}</strong> ➔ 🎯 <strong>${this.nav.destPoint.name}</strong> • ⏱️ ${this.nav.distMeters} م (~${this.nav.walkMinutes} دقيقة مشي)`;
    }
  },

  /**
   * Start Walking Along Route
   */
  startWalkingRoute() {
    if (!this.nav.activeRoutePath || this.nav.activeRoutePath.length === 0) {
      this.updateRouteBetweenStartAndDest(false);
    }

    this.player.path = [...this.nav.activeRoutePath];
    this.player.currentPathIdx = 0;
    this.player.isWalking = true;
    this.nav.selectionMode = 'idle';

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`🚶‍♂️ بدأ النزيل بالسير من [${this.nav.startPoint.name}] إلى [${this.nav.destPoint.name}]`);
    }
  },

  swapPoints() {
    const temp = { ...this.nav.startPoint };
    this.setStartLocation(this.nav.destPoint.x, this.nav.destPoint.y, this.nav.destPoint.name, this.nav.destPoint.id);
    this.setDestination(temp.x, temp.y, temp.name, temp.id);
  },

  setSelectionMode(mode) {
    this.nav.selectionMode = mode;
    const btnStart = document.getElementById('btnModeSetStart');
    const btnDest = document.getElementById('btnModeSetDest');

    if (btnStart) btnStart.classList.toggle('active-mode', mode === 'start');
    if (btnDest) btnDest.classList.toggle('active-mode', mode === 'dest');

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(mode === 'start' ? '🟢 انقر على الخريطة لتحديد مكان البداية' : '🎯 انقر على الخريطة لتحديد الوجهة');
    }
  },

  handleMapClick(e) {
    const svg = document.getElementById('virtualResortSvg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * this.WIDTH;
    const clickY = ((e.clientY - rect.top) / rect.height) * this.HEIGHT;

    if (this.nav.selectionMode === 'start') {
      this.setStartLocation(clickX, clickY, 'نقطة البداية المحددة');
      // Prompt user to pick destination next
      this.setSelectionMode('dest');
      return;
    }

    if (this.nav.selectionMode === 'dest') {
      this.setDestination(clickX, clickY, 'الوجهة المحددة');
      this.nav.selectionMode = 'idle';
      this.startWalkingRoute();
      return;
    }

    // Default tap: set destination directly and walk!
    this.setDestination(clickX, clickY, 'الموقع المحدد على الممشى');
    this.startWalkingRoute();
  },

  onPinClick(poiId) {
    const poi = resortPois.find(p => p.id === poiId);
    if (!poi) return;

    const nodeKey = this.poiToNodeMap[poiId];
    const node = this.nodes[nodeKey];
    const px = node ? node.x : (poi.coords.x / 100) * this.WIDTH;
    const py = node ? node.y : (poi.coords.y / 100) * this.HEIGHT;

    if (this.nav.selectionMode === 'start') {
      this.setStartLocation(px, py, poi.nameAr, poi.id);
      this.setSelectionMode('dest');
      return;
    }

    // Otherwise set as destination and walk!
    this.setDestination(px, py, poi.nameAr, poi.id);
    this.startWalkingRoute();
  },

  /* ================= PATHFINDING & ANIMATION LOOP ================= */

  findPath(startKey, targetKey) {
    if (!this.nodes[startKey] || !this.nodes[targetKey]) {
      return [this.nodes[startKey] || this.nodes[targetKey]];
    }

    const distances = {};
    const previous = {};
    const unvisited = new Set(Object.keys(this.nodes));

    for (const key of unvisited) {
      distances[key] = Infinity;
      previous[key] = null;
    }
    distances[startKey] = 0;

    while (unvisited.size > 0) {
      let current = null;
      let minDistance = Infinity;
      for (const key of unvisited) {
        if (distances[key] < minDistance) {
          minDistance = distances[key];
          current = key;
        }
      }

      if (!current || distances[current] === Infinity) break;
      if (current === targetKey) break;

      unvisited.delete(current);

      const neighbors = this.nodes[current].neighbors || [];
      for (const nKey of neighbors) {
        if (!unvisited.has(nKey)) continue;

        const currNode = this.nodes[current];
        const nextNode = this.nodes[nKey];
        const dist = Math.hypot(nextNode.x - currNode.x, nextNode.y - currNode.y);
        const alt = distances[current] + dist;

        if (alt < distances[nKey]) {
          distances[nKey] = alt;
          previous[nKey] = current;
        }
      }
    }

    const path = [];
    let u = targetKey;
    while (u) {
      path.unshift(this.nodes[u]);
      u = previous[u];
    }
    return path;
  },

  getNearestNodeKey(x, y) {
    let nearestKey = 'poi_lobby_m';
    let minDistance = Infinity;

    for (const [key, node] of Object.entries(this.nodes)) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist < minDistance) {
        minDistance = dist;
        nearestKey = key;
      }
    }
    return nearestKey;
  },

  drawDynamicRoute(path) {
    const glow = document.getElementById('activeRouteGlow');
    const bg = document.getElementById('activeRouteBackground');
    if (!glow || !bg) return;

    if (!path || path.length < 2) {
      glow.setAttribute('d', '');
      bg.setAttribute('d', '');
      return;
    }

    let d = `M ${path[0].x} ${path[0].y}`;
    for (let i = 1; i < path.length; i++) {
      d += ` L ${path[i].x} ${path[i].y}`;
    }

    glow.setAttribute('d', d);
    bg.setAttribute('d', d);
  },

  startAnimationLoop() {
    const loop = (timestamp) => {
      const dt = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.1) : 0.016;
      this.lastTimestamp = timestamp;

      this.updatePlayerWalking(dt);

      this.animFrameId = requestAnimationFrame(loop);
    };

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame(loop);
  },

  updatePlayerWalking(dt) {
    if (!this.player.isWalking || !this.player.path.length) return;

    const path = this.player.path;
    const currentTarget = path[this.player.currentPathIdx];
    if (!currentTarget) {
      this.finishWalking();
      return;
    }

    const dx = currentTarget.x - this.player.x;
    const dy = currentTarget.y - this.player.y;
    const distance = Math.hypot(dx, dy);

    const speed = 135 * this.moveSpeed;
    const step = speed * dt;

    if (distance <= step) {
      this.player.x = currentTarget.x;
      this.player.y = currentTarget.y;
      this.player.currentPathIdx++;

      if (this.player.currentPathIdx >= path.length) {
        this.finishWalking();
      }
    } else {
      this.player.x += (dx / distance) * step;
      this.player.y += (dy / distance) * step;

      this.player.facingLeft = dx < 0;
      this.player.heading = Math.atan2(dy, dx) * (180 / Math.PI);
    }

    this.player.walkFrame += dt * 8 * this.moveSpeed;
    const bounceY = Math.sin(this.player.walkFrame) * 3.5;

    const avatarEl = document.getElementById('actorPlayer');
    if (avatarEl) {
      avatarEl.setAttribute('transform', `translate(${this.player.x}, ${this.player.y + bounceY}) scale(${this.player.facingLeft ? -1 : 1}, 1)`);
    }

    if (Math.sin(this.player.walkFrame) > 0.88) {
      this.playFootstepSound();
    }
  },

  finishWalking() {
    this.player.isWalking = false;
    this.player.path = [];
    this.nav.startPoint = { ...this.nav.destPoint }; // Now at destination

    this.playArrivalChime();

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`🎉 وصلت بحمد الله إلى وجهتك: ${this.nav.destPoint.name}`);
    }

    // Open detail modal if it's a POI
    const poi = resortPois.find(p => p.id === this.nav.destPoint.id);
    if (poi && typeof App !== 'undefined' && App.openPoiModal) {
      App.openPoiModal(poi);
    }
  },

  /* ================= LAYER & DISPLAY SWITCHER ================= */

  setViewMode(mode) {
    this.viewMode = mode;

    const shapesLayer = document.getElementById('layerResortShapes');
    const illusImg = document.getElementById('resortMapIllustrated');
    const satImg = document.getElementById('resortMapSatellite');
    const nightImg = document.getElementById('resortMapNight');

    document.querySelectorAll('.map-layer-pill').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`layerBtn_${mode}`);
    if (btn) btn.classList.add('active');

    if (mode === 'shapes_only') {
      if (shapesLayer) shapesLayer.classList.remove('opacity-25');
      if (shapesLayer) shapesLayer.classList.add('opacity-100');
      if (illusImg) illusImg.className = 'earth-layer-img inactive';
      if (satImg) satImg.className = 'earth-layer-img inactive';
      if (nightImg) nightImg.className = 'earth-layer-img inactive';
    } else if (mode === 'map_overlay') {
      if (shapesLayer) shapesLayer.classList.add('opacity-25');
      if (illusImg) illusImg.className = 'earth-layer-img active';
      if (satImg) satImg.className = 'earth-layer-img inactive';
      if (nightImg) nightImg.className = 'earth-layer-img inactive';
    } else if (mode === 'satellite') {
      if (shapesLayer) shapesLayer.classList.add('opacity-25');
      if (illusImg) illusImg.className = 'earth-layer-img inactive';
      if (satImg) satImg.className = 'earth-layer-img active';
      if (nightImg) nightImg.className = 'earth-layer-img inactive';
    } else if (mode === 'night') {
      if (shapesLayer) shapesLayer.classList.add('opacity-25');
      if (illusImg) illusImg.className = 'earth-layer-img inactive';
      if (satImg) satImg.className = 'earth-layer-img inactive';
      if (nightImg) nightImg.className = 'earth-layer-img active';
    }

    if (typeof App !== 'undefined' && App.showToast) {
      const titles = {
        shapes_only: '🎨 عرض الأشكال والمسارات الصافية فقط',
        map_overlay: '🗺️ عرض مع الخريطة المصورة الأصلية',
        satellite: '🛰️ عرض القمر الصناعي',
        night: '🌙 عرض الرؤية الليلية'
      };
      App.showToast(titles[mode]);
    }
  },

  populateNavigatorSelectors() {
    const originSelect = document.getElementById('guestOriginSelect');
    const destSelect = document.getElementById('guestDestSelect');
    if (!originSelect || !destSelect || typeof resortPois === 'undefined') return;

    const optionsHtml = resortPois.map(p => `<option value="${p.id}">${p.num} - ${p.nameAr}</option>`).join('');
    originSelect.innerHTML = optionsHtml;
    destSelect.innerHTML = optionsHtml;

    originSelect.value = 'M';
    destSelect.value = '1';
  },

  onOriginSelectChange(val) {
    const poi = resortPois.find(p => p.id === val);
    if (!poi) return;
    const nodeKey = this.poiToNodeMap[val];
    const node = this.nodes[nodeKey];
    const px = node ? node.x : (poi.coords.x / 100) * this.WIDTH;
    const py = node ? node.y : (poi.coords.y / 100) * this.HEIGHT;
    this.setStartLocation(px, py, poi.nameAr, val);
  },

  onDestSelectChange(val) {
    const poi = resortPois.find(p => p.id === val);
    if (!poi) return;
    const nodeKey = this.poiToNodeMap[val];
    const node = this.nodes[nodeKey];
    const px = node ? node.x : (poi.coords.x / 100) * this.WIDTH;
    const py = node ? node.y : (poi.coords.y / 100) * this.HEIGHT;
    this.setDestination(px, py, poi.nameAr, val);
  },

  quickWalkTo(poiId) {
    const poi = resortPois.find(p => p.id === poiId);
    if (!poi) return;
    const nodeKey = this.poiToNodeMap[poiId];
    const node = this.nodes[nodeKey];
    const px = node ? node.x : (poi.coords.x / 100) * this.WIDTH;
    const py = node ? node.y : (poi.coords.y / 100) * this.HEIGHT;
    this.setDestination(px, py, poi.nameAr, poiId);
    this.startWalkingRoute();
  },

  quickWalkToRoom() {
    const savedRoom = localStorage.getItem('moreno_guest_room');
    if (!savedRoom) {
      if (typeof App !== 'undefined' && App.openSaveRoomModal) App.openSaveRoomModal();
      return;
    }

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
      this.quickWalkTo(matchedBuilding.id);
    }
  },

  walkToPoi(poiId) {
    this.quickWalkTo(poiId);
  },

  toggleSpeed() {
    this.moveSpeed = this.moveSpeed > 1.5 ? 1.0 : 2.2;
    const btn = document.getElementById('speedToggleBtn');
    if (btn) {
      btn.innerHTML = this.moveSpeed > 1.5 ? '⚡ ركض سريع' : '🚶‍♂️ سير عادي';
      btn.classList.toggle('active-mode', this.moveSpeed > 1.5);
    }
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(this.moveSpeed > 1.5 ? '⚡ سرعة الركض مفعلة' : '🚶‍♂️ السير الطبيعي');
    }
  },

  initAudio() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
    } catch (e) {}
  },

  toggleSound() {
    if (!this.audioCtx) this.initAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
    this.isSoundEnabled = !this.isSoundEnabled;
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
      btn.classList.toggle('active-mode', this.isSoundEnabled);
      btn.innerHTML = this.isSoundEnabled ? '🔊 الأصوات تعمل' : '🔇 المؤثرات مكتومة';
    }
  },

  playFootstepSound() {
    if (!this.isSoundEnabled || !this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140 + Math.random() * 20, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.025, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch (e) {}
  },

  playArrivalChime() {
    if (!this.isSoundEnabled || !this.audioCtx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(this.audioCtx.currentTime + idx * 0.1);
        osc.stop(this.audioCtx.currentTime + idx * 0.1 + 0.35);
      });
    } catch (e) {}
  }
};

// Expose globally
if (typeof window !== 'undefined') {
  window.VirtualResortMap = VirtualResortMap;
}
