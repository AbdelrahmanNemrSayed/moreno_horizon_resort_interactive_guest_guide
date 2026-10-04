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
    startPoint: { x: 251, y: 768, name: 'المبنى الرئيسي (Lobby M)', id: 'M' },
    destPoint: { x: 388, y: 353, name: 'منطقة الشاطئ والمارينا', id: '1' },
    activeRoutePath: [],
    distMeters: 0,
    walkMinutes: 0
  },

  // Player Avatar State
  player: {
    x: 251,
    y: 768,
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

  // Walkway Graph Network (Precision 74-node graph tracing exact paved walkways, bypassing pools & buildings)
  nodes: {
    // 1. Pier & Beach
    'p_pier_tip': { x: 388, y: 104, name: 'رصيف المارينا (نهاية الرصيف)', neighbors: ['p_pier_mid'] },
    'p_pier_mid': { x: 388, y: 228, name: 'ممشى المارينا الخشبي', neighbors: ['p_pier_tip', 'poi_1_beach'] },
    'poi_1_beach': { x: 388, y: 353, name: 'شاطئ البحر والمارينا (1)', neighbors: ['p_pier_mid', 'p_beach_w', 'p_beach_e', 'p_promenade_center'] },
    'p_beach_w': { x: 260, y: 353, name: 'ممشى الشاطئ الغربي', neighbors: ['poi_1_beach', 'poi_4_kids', 'poi_5_beach_bar'] },
    'p_beach_e': { x: 505, y: 353, name: 'ممشى الشاطئ الشرقي', neighbors: ['poi_1_beach', 'poi_6_oriental', 'p_east_shore'] },
    'p_east_shore': { x: 565, y: 360, name: 'ممشى الشاطئ أقصى الشرق', neighbors: ['p_beach_e', 'poi_8_lamama'] },

    // 2. Northern Strip (Diving, Aqua Park, Kids, Beach Bar, Oriental, La Mama)
    'poi_2_diving': { x: 125, y: 300, name: 'مركز الغوص (2)', neighbors: ['poi_3_aquapark', 'p_diving_access'] },
    'p_diving_access': { x: 157, y: 340, name: 'مدخل مركز الغوص', neighbors: ['poi_2_diving', 'poi_3_aquapark', 'p_aqua_promenade'] },
    'poi_3_aquapark': { x: 125, y: 408, name: 'أكوا بارك مورينو (3)', neighbors: ['poi_2_diving', 'p_diving_access', 'p_aqua_promenade', 'p_wing_n_outer_north'] },
    'p_aqua_promenade': { x: 200, y: 384, name: 'ممشى الأكوا بارك الشرقي', neighbors: ['p_diving_access', 'poi_3_aquapark', 'poi_4_kids', 'p_north_junction'] },
    'poi_4_kids': { x: 242, y: 384, name: 'منطقة ألعاب الأطفال (4)', neighbors: ['p_beach_w', 'p_aqua_promenade', 'poi_5_beach_bar', 'p_north_junction'] },
    'poi_5_beach_bar': { x: 323, y: 396, name: 'بار الشاطئ (5)', neighbors: ['p_beach_w', 'poi_4_kids', 'p_promenade_center'] },
    'p_promenade_center': { x: 388, y: 400, name: 'ملتقى الكورنيش الشمالي', neighbors: ['poi_1_beach', 'poi_5_beach_bar', 'poi_6_oriental', 'p_north_center_plaza'] },
    'poi_6_oriental': { x: 448, y: 396, name: 'المطعم الشرقي وسناك بار (6)', neighbors: ['p_beach_e', 'p_promenade_center', 'p_east_promenade', 'p_north_center_plaza'] },
    'p_east_promenade': { x: 520, y: 410, name: 'ممشى المطاعم الشرقية', neighbors: ['poi_6_oriental', 'p_east_shore', 'poi_8_lamama'] },
    'poi_8_lamama': { x: 546, y: 444, name: 'مطعم لا ماما الإيطالي (8)', neighbors: ['p_east_promenade', 'p_east_shore', 'p_wing_s_north_terrace', 'p_circle_ne_3'] },

    // 3. Central Promenade & Upper Garden Junctions
    'p_north_junction': { x: 242, y: 432, name: 'تقاطع حديقة الأطفال الشمالي', neighbors: ['p_aqua_promenade', 'poi_4_kids', 'p_wing_n_north_entry', 'p_circle_nw_1'] },
    'p_north_center_plaza': { x: 388, y: 456, name: 'ساحة مدخل الحديقة الشمالية', neighbors: ['p_promenade_center', 'poi_6_oriental', 'p_circle_n_arc'] },

    // 4. Central Circular Pool Perimeter Walkway (Paved Ring bypassing water)
    'p_circle_n_arc': { x: 388, y: 486, name: 'ممشى المسبح المركزي (شمال)', neighbors: ['p_north_center_plaza', 'p_circle_nw_1', 'p_circle_ne_1'] },
    'p_circle_nw_1': { x: 310, y: 504, name: 'ممشى المسبح (شمال غرب 1)', neighbors: ['p_north_junction', 'p_circle_n_arc', 'p_circle_nw_2'] },
    'p_circle_nw_2': { x: 280, y: 540, name: 'ممشى المسبح (شمال غرب 2)', neighbors: ['p_circle_nw_1', 'p_circle_w_mid'] },
    'p_circle_w_mid': { x: 265, y: 590, name: 'ممشى المسبح (غرب المنتصف)', neighbors: ['p_circle_nw_2', 'p_wing_n_veranda_mid', 'p_circle_sw_1'] },
    'p_circle_sw_1': { x: 280, y: 648, name: 'ممشى المسبح (جنوب غرب 1)', neighbors: ['p_circle_w_mid', 'p_circle_sw_2', 'p_garden_south_west'] },
    'p_circle_sw_2': { x: 315, y: 684, name: 'ممشى المسبح (جنوب غرب 2)', neighbors: ['p_circle_sw_1', 'p_circle_s_arc'] },

    'p_circle_ne_1': { x: 466, y: 504, name: 'ممشى المسبح (شمال شرق 1)', neighbors: ['p_circle_n_arc', 'p_circle_ne_2', 'poi_8_lamama'] },
    'p_circle_ne_2': { x: 495, y: 540, name: 'ممشى المسبح (شمال شرق 2)', neighbors: ['p_circle_ne_1', 'p_circle_ne_3'] },
    'p_circle_ne_3': { x: 511, y: 570, name: 'ممشى المسبح (شرق 1)', neighbors: ['poi_8_lamama', 'p_circle_ne_2', 'p_circle_e_mid'] },
    'p_circle_e_mid': { x: 511, y: 612, name: 'ممشى المسبح (شرق المنتصف)', neighbors: ['p_circle_ne_3', 'poi_9_spa', 'p_wing_s_veranda_mid', 'p_circle_se_1'] },
    'p_circle_se_1': { x: 495, y: 660, name: 'ممشى المسبح (جنوب شرق 1)', neighbors: ['p_circle_e_mid', 'p_circle_se_2', 'p_garden_south_east'] },
    'p_circle_se_2': { x: 466, y: 696, name: 'ممشى المسبح (جنوب شرق 2)', neighbors: ['p_circle_se_1', 'p_circle_s_arc'] },

    'p_circle_s_arc': { x: 388, y: 708, name: 'ممشى المسبح المركزي (جنوب)', neighbors: ['p_circle_sw_2', 'p_circle_se_2', 'p_garden_sirena_plaza'] },

    // 5. Wing N (North Wing Rooms & Corridors)
    'p_wing_n_outer_north': { x: 116, y: 474, name: 'الممشى الخارجي للجناح N (شمال)', neighbors: ['poi_3_aquapark', 'p_wing_n_outer_mid'] },
    'p_wing_n_outer_mid': { x: 116, y: 600, name: 'الممشى الخارجي للجناح N (وسط)', neighbors: ['p_wing_n_outer_north', 'p_wing_n_outer_south', 'poi_13_parking1'] },
    'p_wing_n_outer_south': { x: 116, y: 690, name: 'الممشى الخارجي للجناح N (جنوب)', neighbors: ['p_wing_n_outer_mid', 'poi_13_parking1', 'p_west_service_road'] },

    'p_wing_n_north_entry': { x: 188, y: 468, name: 'مدخل غرف الجناح الشمالي (شمال)', neighbors: ['p_north_junction', 'poi_n_wing', 'p_wing_n_veranda_north'] },
    'p_wing_n_veranda_north': { x: 215, y: 520, name: 'رواق الجناح الشمالي 1', neighbors: ['p_wing_n_north_entry', 'p_circle_nw_1', 'poi_n_wing'] },
    'poi_n_wing': { x: 179, y: 588, name: 'المبنى الشمالي (Wing N)', neighbors: ['p_wing_n_north_entry', 'p_wing_n_veranda_north', 'p_wing_n_veranda_mid', 'p_wing_n_south_exit', 'p_wing_n_outer_mid'] },
    'p_wing_n_veranda_mid': { x: 224, y: 590, name: 'رواق الجناح الشمالي 2', neighbors: ['poi_n_wing', 'p_circle_w_mid', 'p_wing_n_veranda_south'] },
    'p_wing_n_veranda_south': { x: 224, y: 660, name: 'رواق الجناح الشمالي 3', neighbors: ['p_wing_n_veranda_mid', 'p_garden_south_west', 'p_wing_n_south_exit'] },
    'p_wing_n_south_exit': { x: 188, y: 696, name: 'مخرج غرف الجناح الشمالي (جنوب)', neighbors: ['poi_n_wing', 'p_wing_n_veranda_south', 'p_west_service_road', 'p_lobby_north_walk'] },

    // 6. Wing S (South Wing Rooms, Terrace & Spa)
    'p_wing_s_north_terrace': { x: 573, y: 480, name: 'تراس الجناح الجنوبي (شمال)', neighbors: ['poi_8_lamama', 'poi_s_wing', 'p_wing_s_veranda_north'] },
    'p_wing_s_veranda_north': { x: 546, y: 528, name: 'رواق الجناح الجنوبي 1', neighbors: ['p_wing_s_north_terrace', 'poi_9_spa', 'poi_s_wing'] },
    'poi_9_spa': { x: 511, y: 552, name: 'النادي الصحي والسبا والجيم (9)', neighbors: ['p_circle_e_mid', 'p_wing_s_veranda_north', 'p_wing_s_veranda_mid'] },
    'poi_s_wing': { x: 573, y: 600, name: 'المبنى الجنوبي (Wing S)', neighbors: ['p_wing_s_north_terrace', 'p_wing_s_veranda_north', 'p_wing_s_veranda_mid', 'p_wing_s_south_exit', 'p_wing_s_outer_mid'] },
    'p_wing_s_veranda_mid': { x: 546, y: 612, name: 'رواق الجناح الجنوبي 2', neighbors: ['poi_s_wing', 'poi_9_spa', 'p_circle_e_mid', 'p_wing_s_veranda_south'] },
    'p_wing_s_veranda_south': { x: 546, y: 672, name: 'رواق الجناح الجنوبي 3', neighbors: ['p_wing_s_veranda_mid', 'p_garden_south_east', 'p_wing_s_south_exit', 'p_tennis_entry'] },
    'p_wing_s_south_exit': { x: 573, y: 696, name: 'مخرج غرف الجناح الجنوبي (جنوب)', neighbors: ['poi_s_wing', 'p_wing_s_veranda_south', 'p_wing_s_outer_south', 'p_tennis_entry'] },

    'p_wing_s_outer_mid': { x: 636, y: 600, name: 'الممشى الخارجي للجناح S (وسط)', neighbors: ['poi_s_wing', 'p_wing_s_outer_south'] },
    'p_wing_s_outer_south': { x: 636, y: 684, name: 'الممشى الخارجي للجناح S (جنوب)', neighbors: ['p_wing_s_outer_mid', 'p_wing_s_south_exit', 'poi_10_tennis'] },

    // 7. South Garden, Sirena Restaurant & Central Lobby Walkways
    'p_garden_south_west': { x: 260, y: 696, name: 'ممشى الحديقة الجنوبي الغربي', neighbors: ['p_circle_sw_1', 'p_wing_n_veranda_south', 'p_lobby_north_walk', 'p_garden_sirena_plaza'] },
    'p_garden_south_east': { x: 511, y: 708, name: 'ممشى الحديقة الجنوبي الشرقي', neighbors: ['p_circle_se_1', 'p_wing_s_veranda_south', 'p_garden_sirena_plaza', 'p_sirena_east_walk'] },
    'p_garden_sirena_plaza': { x: 388, y: 732, name: 'ساحة مطعم سيرينا الشمالية', neighbors: ['p_circle_s_arc', 'p_garden_south_west', 'p_garden_south_east', 'poi_12_sirena'] },
    'poi_12_sirena': { x: 388, y: 768, name: 'مطعم سيرينا الرئيسي (12)', neighbors: ['p_garden_sirena_plaza', 'p_lobby_terrace_east', 'p_sirena_east_walk'] },
    'p_sirena_east_walk': { x: 448, y: 768, name: 'ممر سيرينا الشرقي', neighbors: ['p_garden_south_east', 'poi_12_sirena', 'p_sirena_terrace_south'] },
    'p_sirena_terrace_south': { x: 430, y: 816, name: 'تراس سيرينا الجنوبي', neighbors: ['p_sirena_east_walk', 'poi_12_sirena', 'p_lobby_terrace_east', 'p_lobby_south_porte'] },

    // 8. Main Lobby Complex (Lobby M, Terraces, Porte-Cochere)
    'p_lobby_north_walk': { x: 224, y: 732, name: 'ممشى مدخل اللوبي الشمالي', neighbors: ['p_wing_n_south_exit', 'p_garden_south_west', 'poi_m_lobby'] },
    'poi_m_lobby': { x: 251, y: 768, name: 'المبنى الرئيسي (Lobby M)', neighbors: ['p_lobby_north_walk', 'p_lobby_terrace_east', 'p_lobby_west_exit', 'p_lobby_south_porte'] },
    'p_lobby_terrace_east': { x: 331, y: 768, name: 'تراس اللوبي الشرقي المطل على المسبح', neighbors: ['poi_m_lobby', 'poi_12_sirena', 'p_sirena_terrace_south', 'p_lobby_south_porte'] },
    'p_lobby_west_exit': { x: 206, y: 804, name: 'مخرج اللوبي الغربي', neighbors: ['poi_m_lobby', 'p_west_service_road', 'p_lobby_south_porte'] },
    'p_lobby_south_porte': { x: 287, y: 840, name: 'بهو الاستقبال ومدخل السيارات (Porte-Cochère)', neighbors: ['poi_m_lobby', 'p_lobby_terrace_east', 'p_lobby_west_exit', 'p_sirena_terrace_south', 'p_entrance_plaza_main'] },

    // 9. Tennis, Lotus Pool & Southeastern Area
    'p_tennis_entry': { x: 573, y: 720, name: 'مدخل ملاعب التنس', neighbors: ['p_wing_s_south_exit', 'p_wing_s_veranda_south', 'poi_10_tennis', 'p_lotus_north_walk'] },
    'poi_10_tennis': { x: 618, y: 708, name: 'ملاعب التنس (10)', neighbors: ['p_wing_s_outer_south', 'p_tennis_entry', 'p_lotus_north_walk'] },
    'p_lotus_north_walk': { x: 590, y: 756, name: 'ممشى مسبح لوتس الشمالي', neighbors: ['p_tennis_entry', 'poi_10_tennis', 'poi_11_lotus_pool'] },
    'poi_11_lotus_pool': { x: 591, y: 804, name: 'مسبح لوتس (11)', neighbors: ['p_lotus_north_walk', 'p_lotus_south_deck'] },
    'p_lotus_south_deck': { x: 591, y: 852, name: 'رصيف مسبح لوتس الجنوبي', neighbors: ['poi_11_lotus_pool', 'p_parking2_access', 'p_avenue_east_junction'] },

    // 10. South Grand Avenue & Plazas (Mosque, Clinic, MLS, Gates)
    'p_entrance_plaza_main': { x: 331, y: 876, name: 'ساحة الاستقبال والمدخل الداخلي', neighbors: ['p_lobby_south_porte', 'p_grand_avenue_west', 'p_clinic_north_walk', 'p_grand_avenue_center'] },
    'p_grand_avenue_west': { x: 242, y: 876, name: 'طريق المنتجع الداخلي (غرب)', neighbors: ['p_entrance_plaza_main', 'p_west_service_road', 'p_mls_north_walk'] },
    'p_grand_avenue_center': { x: 421, y: 888, name: 'طريق المنتجع الداخلي (وسط)', neighbors: ['p_entrance_plaza_main', 'p_mosque_north_walk', 'p_avenue_east_junction'] },
    'p_avenue_east_junction': { x: 520, y: 888, name: 'طريق المنتجع الداخلي (شرق)', neighbors: ['p_grand_avenue_center', 'p_lotus_south_deck', 'p_parking2_access', 'p_main_gate_approach'] },

    'p_parking2_access': { x: 573, y: 912, name: 'طريق موقف السيارات 2', neighbors: ['p_lotus_south_deck', 'p_avenue_east_junction', 'poi_17_parking2'] },
    'poi_17_parking2': { x: 564, y: 936, name: 'موقف السيارات 2 (17)', neighbors: ['p_parking2_access', 'p_main_gate_approach'] },

    'p_main_gate_approach': { x: 573, y: 984, name: 'طريق البوابة الرئيسية', neighbors: ['p_avenue_east_junction', 'poi_17_parking2', 'poi_18_main_gate', 'p_mosque_east_walk'] },
    'poi_18_main_gate': { x: 573, y: 1044, name: 'البوابة الرئيسية (18)', neighbors: ['p_main_gate_approach', 'poi_16_mosque'] },

    'p_mosque_north_walk': { x: 421, y: 936, name: 'ممشى المسجد الشمالي', neighbors: ['p_grand_avenue_center', 'poi_16_mosque', 'p_clinic_east_walk'] },
    'p_mosque_east_walk': { x: 475, y: 996, name: 'ممشى المسجد الشرقي', neighbors: ['p_mosque_north_walk', 'poi_16_mosque', 'p_main_gate_approach'] },
    'poi_16_mosque': { x: 421, y: 1008, name: 'مسجد المنتجع (16)', neighbors: ['p_mosque_north_walk', 'p_mosque_east_walk', 'poi_18_main_gate', 'poi_15_clinic'] },

    'p_clinic_north_walk': { x: 349, y: 936, name: 'ممشى العيادة الشمالي', neighbors: ['p_entrance_plaza_main', 'poi_15_clinic', 'p_clinic_east_walk'] },
    'p_clinic_east_walk': { x: 385, y: 984, name: 'الممشى بين المسجد والعيادة', neighbors: ['p_clinic_north_walk', 'p_mosque_north_walk', 'poi_15_clinic'] },
    'poi_15_clinic': { x: 349, y: 1008, name: 'العيادة والصيدلية (15)', neighbors: ['p_clinic_north_walk', 'p_clinic_east_walk', 'poi_16_mosque', 'p_clinic_west_walk'] },
    'p_clinic_west_walk': { x: 287, y: 1008, name: 'الممشى بين العيادة والمول', neighbors: ['poi_15_clinic', 'poi_mls_mall', 'p_mls_north_walk'] },

    'p_mls_north_walk': { x: 179, y: 936, name: 'ممشى مول MLS الشمالي', neighbors: ['p_grand_avenue_west', 'p_clinic_west_walk', 'poi_mls_mall'] },
    'poi_mls_mall': { x: 179, y: 1008, name: 'المبنى التجاري (MLS Mall)', neighbors: ['p_mls_north_walk', 'p_clinic_west_walk', 'p_side_gate_access', 'poi_14_side_gate'] },

    'p_west_service_road': { x: 116, y: 804, name: 'طريق الخدمة الغربي', neighbors: ['p_wing_n_outer_south', 'p_wing_n_south_exit', 'p_lobby_west_exit', 'p_grand_avenue_west', 'poi_13_parking1', 'p_side_gate_access'] },
    'poi_13_parking1': { x: 54, y: 684, name: 'موقف السيارات 1 (13)', neighbors: ['p_wing_n_outer_mid', 'p_wing_n_outer_south', 'p_west_service_road', 'p_side_gate_access'] },

    'p_side_gate_access': { x: 54, y: 936, name: 'طريق البوابة الجانبية', neighbors: ['p_west_service_road', 'poi_13_parking1', 'poi_mls_mall', 'poi_14_side_gate'] },
    'poi_14_side_gate': { x: 45, y: 1008, name: 'البوابة الجانبية (14)', neighbors: ['p_side_gate_access', 'poi_mls_mall'] }
  },

  // POI Key to Node Key
  poiToNodeMap: {
    '1': 'poi_1_beach',
    '2': 'poi_2_diving',
    '3': 'poi_3_aquapark',
    '4': 'poi_4_kids',
    '5': 'poi_5_beach_bar',
    '6': 'poi_6_oriental',
    '8': 'poi_8_lamama',
    '9': 'poi_9_spa',
    '10': 'poi_10_tennis',
    '11': 'poi_11_lotus_pool',
    '12': 'poi_12_sirena',
    '13': 'poi_13_parking1',
    '14': 'poi_14_side_gate',
    '15': 'poi_15_clinic',
    '16': 'poi_16_mosque',
    '17': 'poi_17_parking2',
    '18': 'poi_18_main_gate',
    'N': 'poi_n_wing',
    'S': 'poi_s_wing',
    'M': 'poi_m_lobby',
    'MLS': 'poi_mls_mall'
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

    const graphPath = this.findPath(startKey, destKey) || [];
    const waypoints = [{ x: this.nav.startPoint.x, y: this.nav.startPoint.y }];
    for (const node of graphPath) {
      if (node && typeof node.x === 'number' && typeof node.y === 'number') {
        waypoints.push({ x: node.x, y: node.y });
      }
    }
    waypoints.push({ x: this.nav.destPoint.x, y: this.nav.destPoint.y });

    // Clean out redundant or close adjacent points
    const cleanPath = waypoints.filter((pt, idx) => idx === 0 || Math.hypot(pt.x - waypoints[idx - 1].x, pt.y - waypoints[idx - 1].y) > 2.5);

    this.nav.activeRoutePath = cleanPath;
    this.drawDynamicRoute(cleanPath);

    // Calculate distance & time
    let meters = 0;
    for (let i = 1; i < cleanPath.length; i++) {
      meters += Math.hypot(cleanPath[i].x - cleanPath[i-1].x, cleanPath[i].y - cleanPath[i-1].y);
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
      const fallback = this.nodes[startKey] || this.nodes[targetKey];
      return fallback ? [fallback] : [];
    }

    if (startKey === targetKey) {
      return [this.nodes[startKey]];
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
        if (!unvisited.has(nKey) || !this.nodes[nKey]) continue;

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

    if (path.length > 0 && path[0] !== this.nodes[startKey]) {
      return [this.nodes[startKey], this.nodes[targetKey]];
    }

    return path;
  },

  getNearestNodeKey(x, y) {
    let nearestKey = 'poi_m_lobby';
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
    glow.setAttribute('stroke-linejoin', 'round');
    bg.setAttribute('stroke-linejoin', 'round');
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
