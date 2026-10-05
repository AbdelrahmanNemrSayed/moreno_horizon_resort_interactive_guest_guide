/**
 * Moreno Horizon Spa & Resort - Contextual Geofencing & Smart Alerts Service
 * 
 * Capabilities:
 * - Calibrated Geofence Zones (1m = 2.381px, 0.42m/px) mapped around resort facilities.
 * - Dynamic Zone State Transition Tracking (onEnter / onExit with hysteresis).
 * - Debounce & Cooldown Engine (5 minutes per zone to prevent repetitive spam).
 * - Smart Contextual Status Matcher based on resort operating hours, meal schedules & daytime/nighttime.
 * - Glassmorphic Luxury Toast Notification UI with Action Triggers (View Details / Dismiss).
 */

const GeofenceService = {
  CANVAS_WIDTH: 896,
  CANVAS_HEIGHT: 1200,
  SCALE_RATIO: 2.381, // 1 meter = 2.381 pixels
  METERS_PER_PIXEL: 0.42,
  COOLDOWN_MS: 5 * 60 * 1000, // 5 minutes debounce per facility

  zones: [],
  activeInsideZones: new Set(),
  lastZoneNotificationTimes: new Map(),
  activeToastTimer: null,
  activeToastEl: null,
  isInitialized: false,

  // Radius configurations tailored to facility spatial footprints (in meters)
  zoneFootprintsMeters: {
    '1': 20,   // Beach Area & Marina Pier (large outdoor shoreline)
    '2': 14,   // Diving Center & Watersports
    '3': 18,   // Aqua Park & Splash Slides
    '4': 14,   // Kids Play Area & Mini Club
    '5': 14,   // Beach Bar & Lounge
    '6': 15,   // Oriental Restaurant & Snack Bar
    '8': 14,   // La Mama Italian Restaurant
    '9': 16,   // Spa, Steam, Sauna & Massage
    '10': 16,  // Pro Tennis Courts
    '11': 20,  // Lotus Swimming Pool & Central Lagoon
    '12': 18,  // Sirena Main International Buffet
    '13': 16,  // Parking 1 & North Gate
    '15': 12,  // 24/7 Clinic & Urgent Care Pharmacy
    '16': 14,  // Resort Mosque
    '17': 16,  // Parking 2
    '18': 18,  // Main Southern Gate & Security
    'M': 18,   // Main Lobby & Reception
    'N': 18,   // North Building (Wing N)
    'S': 18,   // South Building (Wing S)
    'MLS': 18  // Commercial Shopping Complex & Roastery
  },

  init() {
    if (this.isInitialized) return;
    this.registerZones();
    this.createToastContainer();
    this.isInitialized = true;
    console.log(`[GeofenceService] Initialized with ${this.zones.length} active geofence zones.`);
  },

  registerZones() {
    if (typeof resortPois === 'undefined' || !Array.isArray(resortPois)) {
      console.warn('[GeofenceService] resortPois not loaded yet. Retrying in 200ms...');
      setTimeout(() => this.registerZones(), 200);
      return;
    }

    this.zones = resortPois.map(poi => {
      const radiusMeters = this.zoneFootprintsMeters[poi.id] || 14;
      const radiusPx = radiusMeters * this.SCALE_RATIO;
      const centerPx = {
        x: (poi.coords.x / 100) * this.CANVAS_WIDTH,
        y: (poi.coords.y / 100) * this.CANVAS_HEIGHT
      };

      return {
        id: poi.id,
        poi,
        radiusMeters,
        radiusPx,
        centerPx,
        nameAr: poi.nameAr,
        nameEn: poi.nameEn || poi.nameAr
      };
    });
  },

  createToastContainer() {
    let container = document.getElementById('geofenceToastContainer');
    const viewport = document.getElementById('mapViewport');
    if (!container && viewport) {
      container = document.createElement('div');
      container.id = 'geofenceToastContainer';
      container.className = 'geofence-toast-container';
      viewport.appendChild(container);
    }
  },

  /**
   * Main location hook called by MapEngine.updateGuestLiveLocation(pctX, pctY)
   */
  updatePosition(pctX, pctY) {
    if (!this.zones || this.zones.length === 0) {
      if (!this.isInitialized) this.init();
      if (!this.zones || this.zones.length === 0) return;
    }

    const curPxX = (pctX / 100) * this.CANVAS_WIDTH;
    const curPxY = (pctY / 100) * this.CANVAS_HEIGHT;

    for (const zone of this.zones) {
      const distPx = Math.hypot(zone.centerPx.x - curPxX, zone.centerPx.y - curPxY);
      const distMeters = distPx * this.METERS_PER_PIXEL;
      const wasInside = this.activeInsideZones.has(zone.id);

      // Entry trigger: within defined radius
      if (!wasInside && distPx <= zone.radiusPx) {
        this.activeInsideZones.add(zone.id);
        this.onEnter(zone, distMeters);
      } 
      // Exit trigger with 15% hysteresis margin to prevent edge-chattering
      else if (wasInside && distPx > (zone.radiusPx * 1.15)) {
        this.activeInsideZones.delete(zone.id);
        this.onExit(zone, distMeters);
      }
    }
  },

  onEnter(zone, distMeters) {
    console.log(`[Geofence] ENTER zone: ${zone.poi.nameEn} (ID: ${zone.id}) at ${distMeters.toFixed(1)}m`);

    // Debounce / Cooldown Check (5 minutes)
    const now = Date.now();
    const lastNotified = this.lastZoneNotificationTimes.get(zone.id) || 0;
    if (now - lastNotified < this.COOLDOWN_MS) {
      console.log(`[Geofence] Zone ${zone.id} in cooldown (${Math.round((this.COOLDOWN_MS - (now - lastNotified)) / 1000)}s remaining).`);
      return;
    }

    this.lastZoneNotificationTimes.set(zone.id, now);

    // Audio chime cue
    if (typeof App !== 'undefined' && App.playBeep) {
      App.playBeep(880);
      setTimeout(() => App.playBeep(1174), 160);
    }

    const lang = (typeof App !== 'undefined' && App.currentLang) ? App.currentLang : 'ar';
    const statusData = this.getStatusForPoi(zone.poi, lang);
    this.showContextualToast(zone.poi, statusData, lang);
  },

  onExit(zone, distMeters) {
    console.log(`[Geofence] EXIT zone: ${zone.poi.nameEn} (ID: ${zone.id}) at ${distMeters.toFixed(1)}m`);
  },

  /**
   * Evaluates current local time and returns contextual real-time status and advice
   */
  getStatusForPoi(poi, lang = 'ar') {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const timeDec = currentHour + (currentMin / 60);

    const isAr = lang === 'ar';
    const isRu = lang === 'ru';
    const isDe = lang === 'de';

    let statusText = '';
    let badgeLabel = '';
    let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    let icon = '📍';

    switch (poi.id) {
      // 1. Sirena Main International Buffet
      case '12': {
        icon = '🍽️';
        if (timeDec >= 7.0 && timeDec <= 10.5) {
          badgeLabel = isAr ? 'بوفيه الإفطار الصباحي' : isRu ? 'Завтрак' : isDe ? 'Frühstück' : 'Breakfast Buffet';
          statusText = isAr 
            ? 'بوفيه الإفطار الصباحي مفتوح الآن: مخبوزات فرنسية ساخنة، ركن أجبان ومحطات بيض حسب الطلب.'
            : isRu ? 'Шведский стол на завтрак открыт: свежая выпечка, сыры и омлеты на заказ.'
            : isDe ? 'Frühstücksbuffet geöffnet: frisches Gebäck, Käseauswahl und Eierstation.'
            : 'Morning Breakfast Buffet is now open: fresh French pastries and live egg stations.';
        } else if (timeDec > 10.5 && timeDec < 13.0) {
          badgeLabel = isAr ? 'تحضير الغداء' : isRu ? 'Подготовка' : isDe ? 'Vorbereitung' : 'Lunch Prep';
          badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
          statusText = isAr 
            ? 'المطعم في فترة تجهيز بوفيه الغداء، يفتح رسمياً الساعة 13:00 (سناكس متوفر في بار الشاطئ).'
            : isRu ? 'Подготовка к обеду, открытие в 13:00 (закуски доступны в пляжном баре).'
            : isDe ? 'Vorbereitung auf das Mittagsbuffet, Öffnung um 13:00 Uhr.'
            : 'Preparing for Lunch Buffet, opens at 13:00 (light snacks available at Beach Bar).';
        } else if (timeDec >= 13.0 && timeDec <= 15.0) {
          badgeLabel = isAr ? 'بوفيه الغداء الملكي' : isRu ? 'Обед' : isDe ? 'Mittagsbuffet' : 'Royal Lunch Buffet';
          statusText = isAr 
            ? 'بوفيه الغداء مفتوح الآن: تشكيلة أطباق عالمية وشرقية ومحطة باستا طازجة وركن حلويات.'
            : isRu ? 'Обеденный шведский стол открыт: блюда международной кухни, паста и десерты.'
            : isDe ? 'Mittagsbuffet geöffnet: internationale Gerichte, frische Pasta und Desserts.'
            : 'Lunch Buffet is open: international dishes, artisan pasta, and fresh desserts.';
        } else if (timeDec > 15.0 && timeDec < 19.0) {
          badgeLabel = isAr ? 'استراحة بعد الظهيرة' : isRu ? 'Перерыв' : isDe ? 'Pause' : 'Afternoon Break';
          badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
          statusText = isAr 
            ? 'استراحة الشيف، يبدأ بوفيه العشاء الساعة 19:00، يتوفر شاي وكيك وسناكس في بار الشاطئ.'
            : isRu ? 'Перерыв: ужин начнется в 19:00, чай и закуски доступны в баре у пляжа.'
            : isDe ? 'Pause: Abendbuffet ab 19:00 Uhr, Tee und Kuchen an der Beach Bar.'
            : 'Afternoon break: Dinner buffet opens at 19:00; tea and light bites at Beach Bar.';
        } else if (timeDec >= 19.0 && timeDec <= 22.0) {
          badgeLabel = isAr ? 'بوفيه العشاء العالمي' : isRu ? 'Ужин' : isDe ? 'Abendbuffet' : 'Dinner Buffet';
          statusText = isAr 
            ? 'بوفيه العشاء مفتوح الآن: محطات شواء حية على الفحم، أسماك البحر الأحمر وحلويات شرقية.'
            : isRu ? 'Ужин открыт: гриль-станции, свежая рыба и восточные сладости.'
            : isDe ? 'Abendbuffet geöffnet: Live-Grillstationen, frischer Fisch und Desserts.'
            : 'Dinner Buffet is open: live charcoal grills, fresh Red Sea fish, and oriental sweets.';
        } else {
          badgeLabel = isAr ? 'مغلق حالياً' : isRu ? 'Закрыто' : isDe ? 'Geschlossen' : 'Currently Closed';
          badgeColor = 'bg-slate-500/20 text-slate-300 border-slate-500/30';
          statusText = isAr 
            ? 'المطعم مغلق حالياً، مواعيد الخدمة: الإفطار 07:00 | الغداء 13:00 | العشاء 19:00.'
            : isRu ? 'Ресторан закрыт. Часы работы: завтрак 07:00, обед 13:00, ужин 19:00.'
            : isDe ? 'Geschlossen. Zeiten: Frühstück 07:00, Mittag 13:00, Abend 19:00.'
            : 'Restaurant closed. Hours: Breakfast 07:00 | Lunch 13:00 | Dinner 19:00.';
        }
        break;
      }

      // 2. Lotus Pool & Central Lagoon
      case '11': {
        icon = '🏊‍♂️';
        if (timeDec >= 8.0 && timeDec <= 18.0) {
          badgeLabel = isAr ? 'المسبح مفتوح' : isRu ? 'Бассейн открыт' : isDe ? 'Pool geöffnet' : 'Pool Open';
          statusText = isAr 
            ? 'محطة المناشف المجانية وكراسي الاستلقاء متوفرة الآن، عمق المسبح من 90سم إلى 160سم.'
            : isRu ? 'Бесплатные полотенца и шезлонги доступны, глубина от 90см до 160см.'
            : isDe ? 'Kostenlose Handtücher und Liegen verfügbar, Tiefe 90cm bis 160cm.'
            : 'Complimentary beach towels & sun loungers available. Depth: 90cm to 160cm.';
        } else {
          badgeLabel = isAr ? 'مغلق للصيانة' : isRu ? 'Закрыт' : isDe ? 'Geschlossen' : 'Pool Closed';
          badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
          statusText = isAr 
            ? 'المسبح مغلق بعد الغروب لدورة الفلترة والكلورة الدورية لحماية النزلاء.'
            : isRu ? 'Бассейн закрыт после заката на ночную фильтрацию воды.'
            : isDe ? 'Pool nach Sonnenuntergang für die Wasserreinigung geschlossen.'
            : 'Pool closed after sunset for scheduled filtration & water purification.';
        }
        break;
      }

      // 3. Beach Area & Marina Pier
      case '1': {
        icon = '🏖️';
        if (timeDec >= 7.0 && timeDec <= 18.0) {
          badgeLabel = isAr ? 'الشاطئ مفتوح' : isRu ? 'Пляж открыт' : isDe ? 'Strand geöffnet' : 'Beach Open';
          statusText = isAr 
            ? 'الشاطئ والمارينا متاحان، تتوفر المظلات ومعدات السنوركلينج برصيف المارينا.'
            : isRu ? 'Пляж и пирс открыты: зонтики, шезлонги и снорклинг у рифа.'
            : isDe ? 'Strand und Pier geöffnet: Schirme, Liegen und Schnorcheln am Riff.'
            : 'Beach & Marina open: complimentary sunbeds, shade umbrellas & reef snorkeling.';
        } else {
          badgeLabel = isAr ? 'ممشى مسائي' : isRu ? 'Вечерний пирс' : isDe ? 'Abendspaziergang' : 'Evening Pier';
          badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
          statusText = isAr 
            ? 'السباحة في البحر مغلقة بعد الغروب، الممشى الخشبي مضاء ومتاح للتنزه والاسترخاء.'
            : isRu ? 'Купание после заката закрыто, пирс освещен для приятных прогулок.'
            : isDe ? 'Baden nach Sonnenuntergang beendet, Holzsteg beleuchtet für Spaziergänge.'
            : 'Swimming closed after sunset; illuminated marina pier open for relaxing strolls.';
        }
        break;
      }

      // 4. Aqua Park & Water Slides
      case '3': {
        icon = '🛝';
        const isAquaActive = (timeDec >= 10.0 && timeDec <= 12.5) || (timeDec >= 14.5 && timeDec <= 17.0);
        if (isAquaActive) {
          badgeLabel = isAr ? 'الزلاجات تعمل' : isRu ? 'Горки работают' : isDe ? 'Rutschen aktiv' : 'Slides Active';
          statusText = isAr 
            ? 'جميع الزلاجات المائية تعمل بكامل طاقتها مع فريق إنقاذ معتمد وإجراءات أمان متكاملة.'
            : isRu ? 'Все водные горки работают в штатном режиме под присмотром спасателей.'
            : isDe ? 'Alle Wasserrutschen in Betrieb mit zertifizierten Rettungsschwimmern.'
            : 'All water slides are active in full fun mode with certified lifeguards on duty.';
        } else {
          badgeLabel = isAr ? 'استراحة الأكوا بارك' : isRu ? 'Перерыв' : isDe ? 'Pause' : 'Aqua Break';
          badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
          statusText = isAr 
            ? 'الأكوا بارك في استراحة، مواعيد التشغيل اليومية: 10:00-12:30 و 14:30-17:00.'
            : isRu ? 'Перерыв в аквапарке. Часы работы: 10:00-12:30 и 14:30-17:00.'
            : isDe ? 'Aquapark Pause. Betriebszeiten: 10:00-12:30 und 14:30-17:00.'
            : 'Aqua Park on break. Operating times: 10:00-12:30 and 14:30-17:00.';
        }
        break;
      }

      // 5. Beach Bar & Lounge
      case '5': {
        icon = '🍹';
        if (timeDec >= 10.0 && timeDec <= 18.0) {
          badgeLabel = isAr ? 'البار مفتوح' : isRu ? 'Бар открыт' : isDe ? 'Bar geöffnet' : 'Bar Open';
          statusText = isAr 
            ? 'يقدم العصائر الطازجة والكوكتيلات الاستوائية والمشروبات الباردة والساخنة حتى الغروب.'
            : isRu ? 'Свежевыжатые соки, тропические коктейли и кофе до заката.'
            : isDe ? 'Frische Säfte, tropische Cocktails und Kaffeespezialitäten bis Sonnenuntergang.'
            : 'Serving fresh tropical juices, iced coffee, and cold mocktails until sunset.';
        } else {
          badgeLabel = isAr ? 'مغلق' : isRu ? 'Закрыто' : isDe ? 'Geschlossen' : 'Closed';
          badgeColor = 'bg-slate-500/20 text-slate-300 border-slate-500/30';
          statusText = isAr 
            ? 'بار الشاطئ يغلق مع غروب الشمس، المشروبات متاحة في بهو اللوبي الرئيسي 24/7.'
            : isRu ? 'Бар у пляжа закрыт до утра. Напитки доступны в главном лобби круглосуточно.'
            : isDe ? 'Beach Bar bis morgens geschlossen. Getränke in der Lobby 24/7 verfügbar.'
            : 'Beach Bar closes at sunset. Beverages available at Main Lobby Lounge 24/7.';
        }
        break;
      }

      // 6. Oriental Restaurant & Snack Bar
      case '6': {
        icon = '🍢';
        if (timeDec >= 12.0 && timeDec <= 17.0) {
          badgeLabel = isAr ? 'سناك بار جاهز' : isRu ? 'Снэк-бар' : isDe ? 'Snackbar' : 'Snacks Active';
          statusText = isAr 
            ? 'يقدم البيتزا الساخنة، الشاورما، السندوتشات والمقبلات الخفيفة بإطلالة البحر.'
            : isRu ? 'Свежая пицца, шаурма и аппетитные закуски с видом на море.'
            : isDe ? 'Frische Pizza, Döner und Snacks mit direktem Meerblick.'
            : 'Serving hot pizza, shawarma baskets, and crispy finger food by the beach.';
        } else if (timeDec >= 19.0 && timeDec <= 22.5) {
          badgeLabel = isAr ? 'عشاء شرقي فاخر' : isRu ? 'Восточный ужин' : isDe ? 'Orientalisch' : 'Oriental Dinner';
          statusText = isAr 
            ? 'مشاوي ملكية على الفحم، كباب وكفتة وشيش طاووق مع أجواء شرقية أصيلة.'
            : isRu ? 'Королевский шашлык, кебаб на углях и традиционная восточная атмосфера.'
            : isDe ? 'Königlicher Holzkohlegrill, Kebab und orientalische Spezialitäten.'
            : 'Royal charcoal grilled kebabs, shish tawook, and authentic oriental delights.';
        } else {
          badgeLabel = isAr ? 'مواعيد الخدمة' : isRu ? 'Часы работы' : isDe ? 'Öffnungszeiten' : 'Schedule';
          badgeColor = 'bg-slate-500/20 text-slate-300 border-slate-500/30';
          statusText = isAr 
            ? 'مواعيد العمل: سناكس 12:00-17:00 | عشاء شرقي 19:00-22:30.'
            : isRu ? 'Часы работы: снэки 12:00-17:00 | ужин 19:00-22:30.'
            : isDe ? 'Öffnungszeiten: Snacks 12:00-17:00 | Abendessen 19:00-22:30.'
            : 'Operating hours: Snacks 12:00-17:00 | Oriental Dinner 19:00-22:30.';
        }
        break;
      }

      // 7. La Mama Italian Restaurant
      case '8': {
        icon = '🍕';
        if (timeDec >= 18.5 && timeDec <= 22.5) {
          badgeLabel = isAr ? 'المطعم يستقبلكم' : isRu ? 'Открыто' : isDe ? 'Geöffnet' : 'Now Open';
          statusText = isAr 
            ? 'أفران الحطب الإيطالية جاهزة: بيتزا نابوليتان أصلية، باستا طازجة وحلويات إيطالية فاخرة.'
            : isRu ? 'Дровяная печь растоплена: неаполитанская пицца, свежая паста и тирамису.'
            : isDe ? 'Steinofen angeheizt: neapolitanische Pizza, frische Pasta und Tiramisu.'
            : 'Wood-fired oven active: authentic Neapolitan pizza, handmade pasta & tiramisu.';
        } else {
          badgeLabel = isAr ? 'حجز مسبق للعشاء' : isRu ? 'По записи' : isDe ? 'Reservierung' : 'Dinner Only';
          badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
          statusText = isAr 
            ? 'يفتح للعشاء من 18:30 إلى 22:30، يرجى التنسيق المسبق مع مكتب الاستقبال للحجز.'
            : isRu ? 'Открыт на ужин с 18:30 до 22:30. Бронирование столиков на ресепшен.'
            : isDe ? 'Geöffnet von 18:30 bis 22:30 Uhr. Tischreservierung an der Rezeption.'
            : 'Dinner only (18:30 - 22:30). Advance table booking recommended at Reception.';
        }
        break;
      }

      // 8. Spa & Health Club
      case '9': {
        icon = '💆';
        if (timeDec >= 9.0 && timeDec <= 20.0) {
          badgeLabel = isAr ? 'السبا مفتوح' : isRu ? 'Спа открыт' : isDe ? 'Spa geöffnet' : 'Spa Open';
          statusText = isAr 
            ? 'غرف البخار، الساونا، الجاكوزي وجلسات المساج والاسترخاء جاهزة لاستقبالك.'
            : isRu ? 'Парная, сауна, джакузи и расслабляющий массаж ждут вас.'
            : isDe ? 'Dampfbad, Sauna, Whirlpool und Entspannungsmassagen stehen bereit.'
            : 'Steam bath, sauna, jacuzzi, and relaxing massage therapies ready for you.';
        } else {
          badgeLabel = isAr ? 'مغلق' : isRu ? 'Закрыто' : isDe ? 'Geschlossen' : 'Spa Closed';
          badgeColor = 'bg-slate-500/20 text-slate-300 border-slate-500/30';
          statusText = isAr 
            ? 'السبا يستقبلكم يومياً من 09:00 صباحاً حتى 20:00 مساءً.'
            : isRu ? 'Спа-центр работает ежедневно с 09:00 до 20:00.'
            : isDe ? 'Spa täglich von 09:00 bis 20:00 Uhr geöffnet.'
            : 'Spa center welcomes guests daily from 09:00 AM to 08:00 PM.';
        }
        break;
      }

      // 9. 24/7 Clinic & Pharmacy
      case '15': {
        icon = '🩺';
        badgeLabel = isAr ? 'متاح 24/7' : isRu ? 'Круглосуточно' : isDe ? '24/7 Notdienst' : 'Available 24/7';
        statusText = isAr 
            ? 'طبيب الطوارئ وصيدلية الإسعافات متوفران على مدار الساعة (اتصل بالتحويلة 15).'
            : isRu ? 'Дежурный врач и аптечный пункт доступны 24/7 (внутренний номер 15).'
            : isDe ? 'Bereitschaftsarzt und Notfallapotheke rund um die Uhr da (Durchwahl 15).'
            : 'On-duty emergency physician and pharmacy ready 24/7 (dial extension 15).';
        break;
      }

      // 10. Resort Mosque
      case '16': {
        icon = '🕌';
        badgeLabel = isAr ? 'مفتوح للصلوات' : isRu ? 'Мечеть открыта' : isDe ? 'Geöffnet' : 'Open for Prayer';
        statusText = isAr 
            ? 'المسجد مكيف بالكامل ومجهز بمصلى سيدات وأماكن وضوء لجميع الصلوات الخمس.'
            : isRu ? 'Мечеть с кондиционером и залом для омовения открыта для всех молитв.'
            : isDe ? 'Klimatisierte Moschee mit separatem Frauenbereich für alle Gebete geöffnet.'
            : 'Air-conditioned mosque with dedicated women\'s prayer hall open for all daily prayers.';
        break;
      }

      // 11. Main Lobby & Reception
      case 'M': {
        icon = '🛎️';
        badgeLabel = isAr ? 'خدمة 24 ساعة' : isRu ? '24/7 Консьерж' : isDe ? '24h Rezeption' : '24/7 Concierge';
        statusText = isAr 
            ? 'أهلاً بك في بهو الاستقبال! مكتب خدمة النزلاء والكونسيرج وصرف العملات في خدمتكم دائماً.'
            : isRu ? 'Добро пожаловать в главное лобби! Консьерж и обмен валют к вашим услугам.'
            : isDe ? 'Willkommen in der Hauptlobby! Gästeservice und Concierge stehen bereit.'
            : 'Welcome to Main Lobby! Concierge desk, currency exchange & guest care at your service.';
        break;
      }

      default: {
        const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr, hours: poi.hours };
        badgeLabel = isAr ? 'مرفق المنتجع' : isRu ? 'Объект' : isDe ? 'Einrichtung' : 'Resort Facility';
        statusText = isAr 
            ? `أهلاً بك في ${loc.name}. مواعيد التشغيل: ${loc.hours || poi.hours || 'متاح للنزلاء'}.`
            : `Welcome to ${loc.name}. Operating hours: ${loc.hours || poi.hours || 'Open for guests'}.`;
        break;
      }
    }

    return {
      statusText,
      badgeLabel,
      badgeColor,
      icon
    };
  },

  /**
   * Displays the sleek glassmorphic smart contextual toast
   */
  showContextualToast(poi, statusData, lang = 'ar') {
    this.createToastContainer();
    const container = document.getElementById('geofenceToastContainer');
    if (!container) return;

    if (this.activeToastTimer) {
      clearTimeout(this.activeToastTimer);
      this.activeToastTimer = null;
    }

    const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr };
    const viewBtnText = (lang === 'ar') ? 'عرض التفاصيل' : (lang === 'ru') ? 'Подробнее' : (lang === 'de') ? 'Details' : 'View Details';
    const dismissText = (lang === 'ar') ? 'تجاهل' : (lang === 'ru') ? 'Закрыть' : (lang === 'de') ? 'Schließen' : 'Dismiss';
    const arrivalTag = (lang === 'ar') ? 'أنت الآن في محيط:' : (lang === 'ru') ? 'Вы находитесь около:' : (lang === 'de') ? 'Sie befinden sich bei:' : 'You are near:';

    const toast = document.createElement('div');
    toast.className = 'geofence-smart-toast animate-geofenceEnter';
    toast.innerHTML = `
      <div class="geofence-toast-body">
        <div class="geofence-toast-icon-wrap ${poi.badgeColor || 'bg-amber-500'}">
          <span class="text-xl select-none">${statusData.icon}</span>
          <div class="geofence-toast-icon-radar"></div>
        </div>
        
        <div class="geofence-toast-content">
          <div class="flex items-center justify-between gap-1.5 mb-0.5">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${arrivalTag}</span>
            <span class="text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${statusData.badgeColor}">
              ${statusData.badgeLabel}
            </span>
          </div>

          <h4 class="text-xs sm:text-sm font-black text-white leading-tight mb-1 truncate">${loc.name}</h4>
          <p class="text-[11px] sm:text-xs text-slate-200 leading-snug line-clamp-2">${statusData.statusText}</p>

          <div class="flex items-center gap-2 mt-2.5 pt-2 border-t border-white/10">
            <button 
              onclick="event.stopPropagation(); GeofenceService.onInspectPoi('${poi.id}')"
              class="tap-effect flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow-md"
            >
              <span>ℹ️</span>
              <span class="truncate">${viewBtnText}</span>
            </button>
            <button 
              onclick="event.stopPropagation(); GeofenceService.dismissToast()"
              class="tap-effect py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold text-xs transition"
            >
              ${dismissText}
            </button>
          </div>
        </div>
      </div>

      <!-- 6-Second Auto Dismiss Progress Bar -->
      <div class="geofence-toast-progress-track">
        <div class="geofence-toast-progress-fill" style="animation-duration: 6s;"></div>
      </div>
    `;

    // Clear previous toast
    container.innerHTML = '';
    container.appendChild(toast);
    this.activeToastEl = toast;

    // Auto-dismiss after 6 seconds
    this.activeToastTimer = setTimeout(() => {
      this.dismissToast();
    }, 6000);
  },

  onInspectPoi(poiId) {
    this.dismissToast();
    if (typeof App !== 'undefined' && App.openPoiModal && typeof resortPois !== 'undefined') {
      const poi = resortPois.find(p => p.id === poiId);
      if (poi) App.openPoiModal(poi);
    }
  },

  dismissToast() {
    if (this.activeToastTimer) {
      clearTimeout(this.activeToastTimer);
      this.activeToastTimer = null;
    }
    const toast = this.activeToastEl;
    if (toast && toast.parentElement) {
      toast.classList.remove('animate-geofenceEnter');
      toast.classList.add('animate-geofenceExit');
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
        if (this.activeToastEl === toast) this.activeToastEl = null;
      }, 250);
    }
  }
};

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GeofenceService.init());
  } else {
    GeofenceService.init();
  }
}

if (typeof window !== 'undefined') {
  window.GeofenceService = GeofenceService;
}
