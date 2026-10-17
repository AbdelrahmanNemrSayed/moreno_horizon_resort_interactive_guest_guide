/**
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

  var resortPois = [
  {
    "id": "1",
    "num": "1",
    "category": "relax",
    "categoryNameAr": "استكشاف واسترخاء (Explore & Relax)",
    "nameAr": "منطقة الشاطئ والمارينا (Beach Area)",
    "nameEn": "Beach Area & Marina Pier",
    "nameRu": "Пляжная зона и пирс марины",
    "nameDe": "Strandbereich & Marina-Steg",
    "tagAr": "شاطئ رملي ومظلات وممشى مارينا",
    "hours": "07:00 - غروب الشمس",
    "locAr": "الواجهة البحرية المباشرة على البحر الأحمر",
    "descriptionAr": "شاطئ رملي خاص مجهز بأسرّة استلقاء ومظلات شمسية مع رصيف المارينا لليخوت وممارسة السنوركلينج.",
    "coords": {
      "x": 42.52,
      "y": 23.42
    },
    "badgeColor": "bg-sky-600",
    "image": "assets/images/beach_marina.jpg"
  },
  {
    "id": "2",
    "num": "2",
    "category": "wellness",
    "categoryNameAr": "صحة وأنشطة (Wellness & Activities)",
    "nameAr": "مركز الغوص والرياضات البحرية (Diving Center)",
    "nameEn": "Diving & Watersports Center",
    "nameRu": "Дайвинг-центр и водный спорт",
    "nameDe": "Tauch- & Wassersportzentrum",
    "tagAr": "دورات غوص PADI ورحلات بحرية",
    "hours": "08:30 - 17:30",
    "locAr": "بجوار مسبح الأكوا بارك الشمالي",
    "descriptionAr": "فريق غواصين محترف يقدم رحلات يومية إلى جزيرة جفتون، سنوركلينج، ودورات غوص PADI للمبتدئين والمحترفين.",
    "coords": {
      "x": 16.74,
      "y": 28.5
    },
    "badgeColor": "bg-purple-600",
    "image": "assets/images/diving_center.jpg"
  },
  {
    "id": "3",
    "num": "3",
    "category": "relax",
    "categoryNameAr": "استكشاف واسترخاء (Explore & Relax)",
    "nameAr": "أكوا بارك مورينو (Aqua Park)",
    "nameEn": "Moreno Aqua Park",
    "nameRu": "Аквапарк Moreno",
    "nameDe": "Moreno Aquapark",
    "tagAr": "زلاجات مائية لجميع الأعمار",
    "hours": "10:00 - 12:30 | 14:30 - 17:00",
    "locAr": "الطرف الشمالي للقرية بجوار المبنى N",
    "descriptionAr": "مجموعة من الزلاجات المائية السريعة، برك مائية آمنة مزودة بفريق إنقاذ معتمد ومظلات شمسية عائلية.",
    "coords": {
      "x": 16.18,
      "y": 34.83
    },
    "badgeColor": "bg-cyan-500",
    "image": "assets/images/aquapark_pool.jpg"
  },
  {
    "id": "4",
    "num": "4",
    "category": "wellness",
    "categoryNameAr": "صحة وأنشطة (Wellness & Activities)",
    "nameAr": "منطقة ألعاب الأطفال (Kids Area)",
    "nameEn": "Kids Play Area & Mini Club",
    "nameRu": "Детская игровая зона и клуб",
    "nameDe": "Kinderspielbereich & Miniclub",
    "tagAr": "ألعاب آمنة وميني كلوب ترفيهي",
    "hours": "09:30 - 12:30 | 15:00 - 17:30",
    "locAr": "الحدائق الخضراء بين الأكوا بارك وبار الشاطئ",
    "descriptionAr": "مساحة مخصصة ومظللة للأطفال تضم زلاجات ومراجيح وبرامج رسم وأنشطة يومية تحت إشراف فريق متخصص.",
    "coords": {
      "x": 29.69,
      "y": 34.67
    },
    "badgeColor": "bg-sky-500",
    "image": "assets/images/kids_club.jpg"
  },
  {
    "id": "5",
    "num": "5",
    "category": "relax",
    "categoryNameAr": "استكشاف واسترخاء (Explore & Relax)",
    "nameAr": "بار الشاطئ (Beach Bar)",
    "nameEn": "Beach Bar & Lounge",
    "nameRu": "Пляжный бар и лаундж",
    "nameDe": "Strandbar & Lounge",
    "tagAr": "مشروبات منعشة وكوكتيلات مثلجة",
    "hours": "10:00 - 18:00 (حتى الغروب)",
    "locAr": "بمحاذاة شاطئ البحر",
    "descriptionAr": "يقدم العصائر الطازجة، المشروبات الباردة والساخنة، والكوكتيلات الاستوائية بإطلالة ساحرة على المارينا.",
    "coords": {
      "x": 37.39,
      "y": 35.92
    },
    "badgeColor": "bg-amber-600",
    "image": "assets/images/beach_bar.jpg"
  },
  {
    "id": "6",
    "num": "6",
    "category": "dine",
    "categoryNameAr": "مطاعم وتجارب طعام (Dine & Indulge)",
    "nameAr": "المطعم الشرقي وسناك بار (Oriental Restaurant)",
    "nameEn": "Al-Sharq Oriental Cuisine & Snack Bar",
    "nameRu": "Восточный ресторан и снэк-бар",
    "nameDe": "Orientalisches Restaurant & Snackbar",
    "tagAr": "مشويات شرقية وسناكس طازجة",
    "hours": "12:00 - 17:00 (سناكس) | 19:00 - 22:30 (عشاء)",
    "locAr": "حدائق الكورنيش بين الشاطئ ومسبح لوتس",
    "descriptionAr": "يقدم تجربة طعام شرقية غنية بالمشويات على الفحم، ساندوتشات شاطئ خفيفة، ومأكولات بدوية أصيلة.",
    "coords": {
      "x": 48.55,
      "y": 35.92
    },
    "badgeColor": "bg-orange-600",
    "image": "assets/images/sirena_buffet.jpg"
  },
  {
    "id": "8",
    "num": "8",
    "category": "dine",
    "categoryNameAr": "مطاعم وتجارب طعام (Dine & Indulge)",
    "nameAr": "مطعم لا ماما الإيطالي (La Mama Italian)",
    "nameEn": "La Mama Italian Restaurant",
    "nameRu": "Итальянский ресторан La Mama",
    "nameDe": "Italienisches Restaurant La Mama",
    "tagAr": "بيتزا حطب وباستا إيطالية طازجة",
    "hours": "13:00 - 23:00",
    "locAr": "الممشى الشرقي بجوار المبنى الجنوبي S",
    "descriptionAr": "يقدم أشهى أطباق المطبخ الإيطالي: بيتزا مخبوزة على الحطب، باستا إيطالية أصيلة، وحلويات التيراميسو الشهيرة.",
    "coords": {
      "x": 60.04,
      "y": 39.58
    },
    "badgeColor": "bg-red-600",
    "image": "assets/images/la_mama.jpg"
  },
  {
    "id": "9",
    "num": "9",
    "category": "wellness",
    "categoryNameAr": "صحة وأنشطة (Wellness & Activities)",
    "nameAr": "النادي الصحي والسبا (Spa & Wellness)",
    "nameEn": "Horus Royal Spa & Turkish Bath",
    "nameRu": "Королевский спа-комплекс и хаммам",
    "nameDe": "Horus Royal Spa & Türkisches Bad",
    "tagAr": "مساج وسونا وحمام تركي وجاكوزي",
    "hours": "09:00 - 20:00",
    "locAr": "الجناح الشرقي بجوار المبنى الجنوبي S",
    "descriptionAr": "مركز استرخاء متكامل يقدم جلسات مساج الأحجار الساخنة، حمام تركي تقليدي، غرف بخار وساونا وجاكوزي مائي خاص.",
    "coords": {
      "x": 68.64,
      "y": 49
    },
    "badgeColor": "bg-teal-600",
    "image": "assets/images/spa_wellness.jpg"
  },
  {
    "id": "10",
    "num": "10",
    "category": "wellness",
    "categoryNameAr": "صحة وأنشطة (Wellness & Activities)",
    "nameAr": "ملاعب التنس والرياضة (Tennis Courts)",
    "nameEn": "Championship Tennis Courts",
    "nameRu": "Теннисные корты",
    "nameDe": "Tennisplätze",
    "tagAr": "ملاعب مضاءة ومضارب متوفرة",
    "hours": "08:00 - 22:00",
    "locAr": "المنطقة الرياضية الشرقية بجوار مسبح لوتس",
    "descriptionAr": "ملعبا تنس أرضي مجهزان بإضاءة ليلية متقدمة، مع إمكانية استعارة المضارب والكرات وتوفر مدربين محترفين.",
    "coords": {
      "x": 68.97,
      "y": 61
    },
    "badgeColor": "bg-emerald-500",
    "image": "assets/images/tennis_courts.jpg"
  },
  {
    "id": "11",
    "num": "11",
    "category": "relax",
    "categoryNameAr": "استكشاف واسترخاء (Explore & Relax)",
    "nameAr": "مسبح لوتس والبحيرة (Lotus Pool)",
    "nameEn": "Lotus Central Pool & Swim-up Bar",
    "nameRu": "Бассейн Lotus и водный бар",
    "nameDe": "Lotus-Pool & Swim-up-Bar",
    "tagAr": "مسبح رئيسي هادئ مع بار مائي",
    "hours": "08:00 - 18:00",
    "locAr": "الجهة الشرقية أمام المبنى الجنوبي S",
    "descriptionAr": "أكبر بحيرات المسبح بالمنتجع، مياه متدرجة العمق، بار كوكتيل داخل الماء، كبائن استرخاء وأسرّة شمسية فاخرة.",
    "coords": {
      "x": 69.2,
      "y": 70.83
    },
    "badgeColor": "bg-blue-600",
    "image": "assets/images/lotus_pool.jpg"
  },
  {
    "id": "12",
    "num": "12",
    "category": "dine",
    "categoryNameAr": "مطاعم وتجارب طعام (Dine & Indulge)",
    "nameAr": "مطعم سيرينا الرئيسي (Sirena Restaurant)",
    "nameEn": "Sirena International Buffet",
    "nameRu": "Главный ресторан Sirena (шведский стол)",
    "nameDe": "Sirena Hauptrestaurant (Buffet)",
    "tagAr": "بوفيه مفتوح ومحطات طهي حي يومياً",
    "hours": "07:00-10:30 (إفطار) | 13:00-15:00 (غداء) | 19:00-22:00 (عشاء)",
    "locAr": "المبنى الرئيسي مطل على حدائق اللوتس",
    "descriptionAr": "المطعم الرئيسي للمنتجع يقدم أشهى الأطباق العالمية والمصرية مع محطات شواء حية وركن خاص للأطفال.",
    "coords": {
      "x": 47.88,
      "y": 68.33
    },
    "badgeColor": "bg-emerald-600",
    "image": "assets/images/sirena_buffet.jpg"
  },
  {
    "id": "13",
    "num": "13",
    "category": "services",
    "categoryNameAr": "مرافق وخدمات (Facilities & Services)",
    "nameAr": "موقف السيارات 1 (Parking 1)",
    "nameEn": "Parking Area 1",
    "nameRu": "Парковка 1 (Северная)",
    "nameDe": "Parkplatz 1 (Nord)",
    "tagAr": "مواقف مجانية مؤمنة للنزلاء 24/7",
    "hours": "متاح 24 ساعة",
    "locAr": "الجهة الشمالية الغربية بجوار المبنى N",
    "descriptionAr": "موقف سيارات مظلل وخاص بنزلاء الجناح الشمالي مزود بكاميرات مراقبة وحراسة أمنية دائمة.",
    "coords": {
      "x": 7.25,
      "y": 60.58
    },
    "badgeColor": "bg-slate-700",
    "image": "assets/images/resort_gate.jpg"
  },
  {
    "id": "14",
    "num": "14",
    "category": "services",
    "categoryNameAr": "المداخل والبوابات (Entrances)",
    "nameAr": "البوابة الجانبية (Side Gate)",
    "nameEn": "Resort Side Gate",
    "nameRu": "Боковые ворота курорта",
    "nameDe": "Seitentor des Resorts",
    "tagAr": "مدخل جانبي قريب من المبنى التجاري",
    "hours": "متاح 24 ساعة",
    "locAr": "الركن الجنوبي الغربي للمنتجع قرب MLS",
    "descriptionAr": "بوابة دخول وخروج جانبية للمشاة والسيارات تخدم منطقة المبنى التجاري MLS والمحلات.",
    "coords": {
      "x": 5.47,
      "y": 86.92
    },
    "badgeColor": "bg-blue-800",
    "image": "assets/images/resort_gate.jpg"
  },
  {
    "id": "15",
    "num": "15",
    "category": "services",
    "categoryNameAr": "مرافق وخدمات (Facilities & Services)",
    "nameAr": "العيادة الطبية والصيدلية (Resort Clinic)",
    "nameEn": "Resort 24/7 Medical Clinic & Pharmacy",
    "nameRu": "Круглосуточная клиника и аптека",
    "nameDe": "24/7 Resort-Klinik & Apotheke",
    "tagAr": "طوارئ، إسعافات، وطبيب مقيم 24 ساعة",
    "hours": "متاح 24 ساعة",
    "locAr": "الجهة الجنوبية الشرقية بجوار المسجد",
    "descriptionAr": "عيادة طبية مجهزة للطوارئ والإسعافات الأولية وصيدلية تقدم الرعاية الصحية الفورية لجميع نزلاء المنتجع.",
    "coords": {
      "x": 41.29,
      "y": 83.33
    },
    "badgeColor": "bg-rose-600",
    "image": "assets/images/resort_clinic.jpg"
  },
  {
    "id": "16",
    "num": "16",
    "category": "services",
    "categoryNameAr": "مرافق وخدمات (Facilities & Services)",
    "nameAr": "مسجد المنتجع (Resort Mosque)",
    "nameEn": "Resort Mosque",
    "nameRu": "Мечеть курорта",
    "nameDe": "Resort-Moschee",
    "tagAr": "صلوات خمس وصلاة الجمعة",
    "hours": "مفتوح في أوقات الصلوات",
    "locAr": "الجهة الجنوبية بجوار العيادة والبوابة الرئيسية",
    "descriptionAr": "مسجد مجهز لأداء الصلوات الخمس وصلاة الجمعة مع مصلى للرجال وآخر للسيدات وأماكن وضوء مهيأة.",
    "coords": {
      "x": 47.54,
      "y": 86.67
    },
    "badgeColor": "bg-teal-700",
    "image": "assets/images/resort_clinic.jpg"
  },
  {
    "id": "17",
    "num": "17",
    "category": "services",
    "categoryNameAr": "مرافق وخدمات (Facilities & Services)",
    "nameAr": "موقف السيارات 2 (Parking 2)",
    "nameEn": "Parking Area 2 (Main Gate)",
    "nameRu": "Парковка 2 (Главные ворота)",
    "nameDe": "Parkplatz 2 (Haupttor)",
    "tagAr": "مواقف قريبة من اللوبي والبوابة الرئيسية",
    "hours": "متاح 24 ساعة",
    "locAr": "الجهة الجنوبية الشرقية قرب البوابة الرئيسية",
    "descriptionAr": "موقف واسع ومظلل لسيارات النزلاء والزوار قريب من بهو الاستقبال وبوابة الدخول الرئيسية.",
    "coords": {
      "x": 67.29,
      "y": 80.58
    },
    "badgeColor": "bg-slate-700",
    "image": "assets/images/resort_gate.jpg"
  },
  {
    "id": "18",
    "num": "18",
    "category": "services",
    "categoryNameAr": "المداخل والبوابات (Entrances)",
    "nameAr": "البوابة الرئيسية للمنتجع (Main Entrance Gate)",
    "nameEn": "Main Entrance Gate & Security Center",
    "nameRu": "Главные ворота курорта и служба охраны",
    "nameDe": "Haupttor & Sicherheitszentrum",
    "tagAr": "بوابة الوصول الرسمية واستقبال الباصات",
    "hours": "متاح 24 ساعة",
    "locAr": "المدخل الجنوبي الشرقي الرسمي للقرية",
    "descriptionAr": "البوابة الرسمية لدخول النزلاء، استقبال باصات الرحلات، حجز الليموزين، ومكتب الأمن الرئيسي 24/7.",
    "coords": {
      "x": 69.75,
      "y": 89.33
    },
    "badgeColor": "bg-amber-600",
    "image": "assets/images/resort_gate.jpg"
  },
  {
    "id": "N",
    "num": "N",
    "category": "buildings",
    "categoryNameAr": "دليل المباني الفندقية (Building Directory)",
    "nameAr": "المبنى الشمالي الفندقي (North Wing - N)",
    "nameEn": "North Accommodation Wing N",
    "nameRu": "Северный жилой корпус (Wing N)",
    "nameDe": "Nordflügel Unterkünfte (Wing N)",
    "tagAr": "الغرف: 1501-1548 (طابق 1) | 1601-1648 (طابق 2) | 1701-1748 (طابق 3) | 1801-1848 (طابق 4) | 1901-1948 (طابق 5)",
    "hours": "متاح 24 ساعة للنزلاء",
    "locAr": "الجهة الشمالية الغربية مطلاً على الأكوا بارك والحدائق",
    "descriptionAr": "جناح الإقامة الشمالي الفاخر ويضم غرفاً عائلية وأجنحة مطلة على مسبح الأكوا بارك والحدائق مع مصاعد حديثة.",
    "coords": {
      "x": 27.9,
      "y": 51.25
    },
    "badgeColor": "bg-cyan-600",
    "isBuilding": true,
    "image": "assets/images/luxury_room.jpg",
    "rooms": [
      {
        "min": 1501,
        "max": 1548,
        "floor": "الطابق الأول (Floor 1)"
      },
      {
        "min": 1601,
        "max": 1648,
        "floor": "الطابق الثاني (Floor 2)"
      },
      {
        "min": 1701,
        "max": 1748,
        "floor": "الطابق الثالث (Floor 3)"
      },
      {
        "min": 1801,
        "max": 1848,
        "floor": "الطابق الرابع (Floor 4)"
      },
      {
        "min": 1901,
        "max": 1948,
        "floor": "الطابق الخامس (Floor 5)"
      }
    ]
  },
  {
    "id": "S",
    "num": "S",
    "category": "buildings",
    "categoryNameAr": "دليل المباني الفندقية (Building Directory)",
    "nameAr": "المبنى الجنوبي الفندقي (South Wing - S)",
    "nameEn": "South Accommodation Wing S",
    "nameRu": "Южный жилой корпус (Wing S)",
    "nameDe": "Südflügel Unterkünfte (Wing S)",
    "tagAr": "الغرف: 2001-2021 (طابق 1) | 2101-2144 (طابق 2) | 2201-2244 (طابق 3) | 2301-2344 (طابق 4) | 2401-2441 (طابق 5)",
    "hours": "متاح 24 ساعة للنزلاء",
    "locAr": "الجهة الجنوبية الشرقية مطلاً على مسبح لوتس والحدائق",
    "descriptionAr": "جناح الإقامة الجنوبي الأنيق بإطلالات ساحرة على مسبح لوتس والممشى وملاعب التنس ومزود بمصاعد سريعة.",
    "coords": {
      "x": 54.13,
      "y": 51.25
    },
    "badgeColor": "bg-amber-600",
    "isBuilding": true,
    "image": "assets/images/luxury_room.jpg",
    "rooms": [
      {
        "min": 2001,
        "max": 2021,
        "floor": "الطابق الأول (Floor 1)"
      },
      {
        "min": 2101,
        "max": 2144,
        "floor": "الطابق الثاني (Floor 2)"
      },
      {
        "min": 2201,
        "max": 2244,
        "floor": "الطابق الثالث (Floor 3)"
      },
      {
        "min": 2301,
        "max": 2344,
        "floor": "الطابق الرابع (Floor 4)"
      },
      {
        "min": 2401,
        "max": 2441,
        "floor": "الطابق الخامس (Floor 5)"
      }
    ]
  },
  {
    "id": "M",
    "num": "M",
    "category": "buildings",
    "categoryNameAr": "دليل المباني الفندقية (Building Directory)",
    "nameAr": "المبنى الرئيسي واللوبي (Main Building - Lobby M)",
    "nameEn": "Main Building (Lobby Wing M)",
    "nameRu": "Главный корпус и лобби (Lobby Wing M)",
    "nameDe": "Hauptgebäude & Lobby (Flügel M)",
    "tagAr": "الغرف: 1001-1020 (طابق 1) | 1101-1160 (طابق 2) | 1201-1260 (طابق 3)",
    "hours": "الاستقبال والكونسيرج 24 ساعة",
    "locAr": "قلب المنتجع بجوار اللوبي ومطعم سيرينا",
    "descriptionAr": "المبنى المركزي الذي يحتضن بهو الاستقبال الرئيسي، مطعم سيرينا، الصالون التنفيذي، ومكاتب خدمة النزلاء.",
    "coords": {
      "x": 37.95,
      "y": 69.58
    },
    "badgeColor": "bg-rose-700",
    "isBuilding": true,
    "image": "assets/images/resort_lobby.jpg",
    "rooms": [
      {
        "min": 1001,
        "max": 1020,
        "floor": "الطابق الأول (Floor 1)"
      },
      {
        "min": 1101,
        "max": 1160,
        "floor": "الطابق الثاني (Floor 2)"
      },
      {
        "min": 1201,
        "max": 1260,
        "floor": "الطابق الثالث (Floor 3)"
      }
    ]
  },
  {
    "id": "MLS",
    "num": "MLS",
    "category": "buildings",
    "categoryNameAr": "دليل المباني الفندقية (Building Directory)",
    "nameAr": "المبنى التجاري (Commercial Building - MLS)",
    "nameEn": "Commercial Complex (Wing MLS)",
    "nameRu": "Коммерческий комплекс (Wing MLS)",
    "nameDe": "Gewerbekomplex (Flügel MLS)",
    "tagAr": "الغرف والمحلات: 2601-2654 (طابق 1) | 2701-2748 (طابق 2) | 2801-2848 (طابق 3) | 2901-2948 (طابق 4)",
    "hours": "09:00 - 23:00",
    "locAr": "المبنى الدائري الأيقوني بالركن الجنوبي الغربي",
    "descriptionAr": "مجمع البازار والمحلات التجارية، محمص القهوة الإيطالية، مكاتب الرحلات السياحية وتأجير السيارات.",
    "coords": {
      "x": 17.86,
      "y": 77.33
    },
    "badgeColor": "bg-emerald-600",
    "isBuilding": true,
    "image": "assets/images/resort_mall.jpg",
    "rooms": [
      {
        "min": 2601,
        "max": 2654,
        "floor": "الطابق الأول (Floor 1)"
      },
      {
        "min": 2701,
        "max": 2748,
        "floor": "الطابق الثاني (Floor 2)"
      },
      {
        "min": 2801,
        "max": 2848,
        "floor": "الطابق الثالث (Floor 3)"
      },
      {
        "min": 2901,
        "max": 2948,
        "floor": "الطابق الرابع (Floor 4)"
      }
    ]
  }
];
  var resortCategories = [
  "all",
  "dining",
  "pools",
  "relax",
  "wellness",
  "rooms",
  "services",
  "buildings"
];
  var activityTranslations = {
  "0": {
    "en": "Aqua Gym at Lotus Pool",
    "ru": "Аквагимнастика в бассейне Lotus",
    "de": "Aqua-Gymnastik im Lotus-Pool"
  },
  "1": {
    "en": "Kids Splash & Slide Challenge",
    "ru": "Водные игры и горки в аквапарке",
    "de": "Wasserspiele im Aquapark"
  },
  "2": {
    "en": "Beach Volleyball Tournament",
    "ru": "Пляжный волейбол у марины",
    "de": "Beachvolleyball-Turnier an der Marina"
  },
  "3": {
    "en": "Sunset Yoga on the Beach",
    "ru": "Йога на закате у пляжного бара",
    "de": "Sonnenuntergangs-Yoga am Strand"
  },
  "4": {
    "en": "Kids Mini Disco & Animation Show",
    "ru": "Детская мини-дискотека и шоу",
    "de": "Kinder Mini-Disco & Show"
  },
  "5": {
    "en": "Egyptian Folklore Gala & Latin Night",
    "ru": "Египетский фольклор и латино-шоу",
    "de": "Ägyptische Folklore & Latein-Show"
  }
};
  var dailyActivities = [
  {
    "time": "10:30 ص",
    "titleAr": "أكوا جيم وتمارين مائية في مسبح لوتس",
    "titleEn": "Aqua Gym at Lotus Pool",
    "loc": "Lotus Pool (11)",
    "icon": "🏊"
  },
  {
    "time": "11:45 ص",
    "titleAr": "مسابقات الأكوا بارك المائية وتحدي الزلاجات",
    "titleEn": "Kids Splash Challenge",
    "loc": "Aqua Park (3)",
    "icon": "💦"
  },
  {
    "time": "04:30 م",
    "titleAr": "بطولة الكرة الطائرة الشاطئية عند المارينا",
    "titleEn": "Beach Volleyball Tourney",
    "loc": "Beach Area (1)",
    "icon": "🏐"
  },
  {
    "time": "05:15 م",
    "titleAr": "يوغا واسترخاء وقت الغروب على الشاطئ",
    "titleEn": "Sunset Beach Yoga",
    "loc": "Beach Bar (5)",
    "icon": "🧘"
  },
  {
    "time": "08:30 م",
    "titleAr": "ميني ديسكو وفقرات استعراضية للأطفال",
    "titleEn": "Kids Mini Disco Show",
    "loc": "Main Stage (M)",
    "icon": "🪩"
  },
  {
    "time": "09:30 م",
    "titleAr": "أمسية الفلكلور المصري والشو اللاتيني",
    "titleEn": "Egyptian Folklore Gala",
    "loc": "Amphitheater",
    "icon": "🎭"
  }
];
  var resortActivities = [
  {
    "time": "10:30 ص",
    "titleAr": "أكوا جيم وتمارين مائية في مسبح لوتس",
    "titleEn": "Aqua Gym at Lotus Pool",
    "loc": "Lotus Pool (11)",
    "icon": "🏊"
  },
  {
    "time": "11:45 ص",
    "titleAr": "مسابقات الأكوا بارك المائية وتحدي الزلاجات",
    "titleEn": "Kids Splash Challenge",
    "loc": "Aqua Park (3)",
    "icon": "💦"
  },
  {
    "time": "04:30 م",
    "titleAr": "بطولة الكرة الطائرة الشاطئية عند المارينا",
    "titleEn": "Beach Volleyball Tourney",
    "loc": "Beach Area (1)",
    "icon": "🏐"
  },
  {
    "time": "05:15 م",
    "titleAr": "يوغا واسترخاء وقت الغروب على الشاطئ",
    "titleEn": "Sunset Beach Yoga",
    "loc": "Beach Bar (5)",
    "icon": "🧘"
  },
  {
    "time": "08:30 م",
    "titleAr": "ميني ديسكو وفقرات استعراضية للأطفال",
    "titleEn": "Kids Mini Disco Show",
    "loc": "Main Stage (M)",
    "icon": "🪩"
  },
  {
    "time": "09:30 م",
    "titleAr": "أمسية الفلكلور المصري والشو اللاتيني",
    "titleEn": "Egyptian Folklore Gala",
    "loc": "Amphitheater",
    "icon": "🎭"
  }
];
  var resortExcursions = [
  {
    "titleAr": "رحلة جزيرة جفتون والسنوركلينج باليخت",
    "titleEn": "Giftun Island VIP Yacht Cruise",
    "descAr": "رحلة بحرية يومية شاملة الغداء والمشروبات ومعدات السنوركلينج لمشاهدة الشعاب المرجانية والدلافين.",
    "price": "35$ / فرد",
    "duration": "08:30 ص - 04:30 م",
    "icon": "🛥️",
    "image": "assets/images/giftun_island.jpg"
  },
  {
    "titleAr": "سفاري صحراء الغردقة والبيتش باجي",
    "titleEn": "Desert Quad Safari & Bedouin Dinner",
    "descAr": "مغامرة ركوب الدراجات الرباعية في صحراء البحر الأحمر ومشاهدة الغروب مع عشاء بدوي وشو شرقي.",
    "price": "28$ / فرد",
    "duration": "02:00 م - 07:30 م",
    "icon": "🏜️",
    "image": "assets/images/hero_resort.jpg"
  },
  {
    "titleAr": "جولة الغواصة البحرية سندباد",
    "titleEn": "Sindbad Submarine Deep Dive",
    "descAr": "غوص حقيقي على عمق 22 متراً تحت سطح البحر الأحمر لمشاهدة الكائنات البحرية النادرة بأمان للأطفال والعائلات.",
    "price": "40$ / فرد",
    "duration": "ساعتان",
    "icon": "🤿",
    "image": "assets/images/diving_center.jpg"
  }
];
  var resortSpaTreatments = [
  {
    "id": "hot_stone",
    "titleAr": "مساج الأحجار البركانية الساخنة (Hot Stone Therapy)",
    "descAr": "أحجار بازلت دافئة مع زيوت عطرية لفك توتر العضلات وتجديد الطاقة الحيوية.",
    "durations": [
      {
        "min": 50,
        "price": 850
      },
      {
        "min": 80,
        "price": 1200
      }
    ],
    "icon": "💆"
  },
  {
    "id": "turkish_bath",
    "titleAr": "الحمام التركي الملكي التراثي (Sultan Turkish Hammam)",
    "descAr": "غرفة بخار دافئة، تقشير كيسة بالصابون المغربي وزيت الغار، وتدليك بالرغوة الغنية.",
    "durations": [
      {
        "min": 60,
        "price": 950
      },
      {
        "min": 90,
        "price": 1350
      }
    ],
    "icon": "🧖"
  },
  {
    "id": "aromatherapy",
    "titleAr": "جلسة المساج السويدي والعلاج العطري (Aromatherapy Massage)",
    "descAr": "تدليك كامل بزيوت اللافندر والنعناع العطرية المهدئة للأعصاب مع تدليك فروة الرأس.",
    "durations": [
      {
        "min": 45,
        "price": 700
      },
      {
        "min": 60,
        "price": 900
      }
    ],
    "icon": "🌸"
  },
  {
    "id": "private_jacuzzi",
    "titleAr": "جلسة الجاكوزي الخاصة بالأعشاب وأملاح البحر الأحمر",
    "descAr": "مغطس مائي دافئ خاص بالأعشاب الطبيعية وأملاح البحر الأحمر لتنشيط الدورة الدموية.",
    "durations": [
      {
        "min": 40,
        "price": 500
      }
    ],
    "icon": "🛁"
  }
];
  var diningSchedules = [
  {
    "restaurant": "مطعم سيرينا الرئيسي (Sirena Buffet)",
    "meals": [
      {
        "name": "الإفطار (Breakfast)",
        "time": "07:00 - 10:30"
      },
      {
        "name": "الغداء (Lunch)",
        "time": "13:00 - 15:00"
      },
      {
        "name": "العشاء (Dinner)",
        "time": "19:00 - 22:00"
      }
    ]
  },
  {
    "restaurant": "مطعم لا ماما الإيطالي (La Mama Italian)",
    "meals": [
      {
        "name": "الغداء والعشاء (Lunch & Dinner)",
        "time": "13:00 - 23:00"
      }
    ]
  },
  {
    "restaurant": "المطعم الشرقي (Al-Sharq Oriental)",
    "meals": [
      {
        "name": "العشاء (Dinner)",
        "time": "19:00 - 22:30"
      }
    ]
  },
  {
    "restaurant": "بار الشاطئ وسناكس المسبح (Beach & Pool Bars)",
    "meals": [
      {
        "name": "مشروبات ومثلجات (Drinks & Ice Cream)",
        "time": "10:00 - غروب الشمس"
      },
      {
        "name": "سناكس بعد الظهر (Afternoon Snacks)",
        "time": "15:00 - 17:00"
      }
    ]
  }
];
  var resortExtensions = [
  {
    "name": "الاستقبال واللوبي (Front Desk)",
    "num": "0",
    "desc": "خدمة النزلاء والاستفسارات 24 ساعة"
  },
  {
    "name": "العيادة والطبيب المقيم (Clinic)",
    "num": "15",
    "desc": "طوارئ ورعاية طبية على مدار الساعة"
  },
  {
    "name": "خدمة الغرف والأغذية (Room Service)",
    "num": "120",
    "desc": "طلب الطعام والمشروبات للغرف"
  },
  {
    "name": "الإشراف الداخلي والمناشف (Housekeeping)",
    "num": "130",
    "desc": "تنظيف الغرف ومستلزمات الحمام"
  },
  {
    "name": "النادي الصحي والسبا (Spa & Wellness)",
    "num": "9",
    "desc": "حجز جلسات المساج والحمام التركي"
  },
  {
    "name": "مكتب الأنشطة والرحلات (Excursions)",
    "num": "140",
    "desc": "حجز رحلات اليخوت والغطس والسفاري"
  }
];
  var localFaqKb = [
  {
    "keywords": [
      "واي فاي",
      "wifi",
      "انترنت",
      "باسورد",
      "password"
    ],
    "answer": "شبكة الواي فاي المجانية بالمنتجع هي 'Moreno Free' وكلمة المرور هي: Moreno@2026 وهي متاحة في جميع الغرف واللوبي والشاطئ."
  },
  {
    "keywords": [
      "مواعيد",
      "وجبات",
      "اكل",
      "طعام",
      "فطار",
      "غدا",
      "عشا",
      "سيرينا",
      "buffet"
    ],
    "answer": "مواعيد بوفيه مطعم سيرينا الرئيسي: الإفطار من 07:00 حتى 10:30 صباحاً | الغداء من 13:00 حتى 15:00 عصراً | العشاء من 19:00 حتى 22:00 مساءً."
  },
  {
    "keywords": [
      "اكوا بارك",
      "زحاليق",
      "العاب مائية",
      "aqua"
    ],
    "answer": "أكوا بارك مورينو (نقطة 3) تعمل يومياً على فترتين: الفترة الصباحية من 10:00 إلى 12:30 ظهراً، والفترة المسائية من 14:30 إلى 17:00 عصراً."
  },
  {
    "keywords": [
      "عيادة",
      "دكتور",
      "طبيب",
      "صيدلية",
      "صداع",
      "clinic",
      "pharmacy"
    ],
    "answer": "العيادة الطبية والصيدلية (نقطة 15) متوفرة 24 ساعة قرب البوابة الرئيسية والمسجد، ويمكنك الاتصال بالطبيب المقيم مباشرة عبر تحويلة الغرفة (15)."
  },
  {
    "keywords": [
      "مناشف",
      "كارت",
      "فوطة",
      "towel"
    ],
    "answer": "يمكنك استلام وتغيير مناشف الشاطئ والمسبح مجاناً بكارت المنشفة في محطة مسبح لوتس ومحطة الشاطئ من 08:00 صباحاً وحتى غروب الشمس."
  },
  {
    "keywords": [
      "خروج",
      "مغادرة",
      "تسجيل خروج",
      "check out"
    ],
    "answer": "موعد تسجيل المغادرة (Check-out) الرسمي هو الساعة 12:00 ظهراً. لطلب مد الإقامة (Late Check-out) يرجى التنسيق مع مكتب الاستقبال الداخلي (0)."
  },
  {
    "keywords": [
      "شامل",
      "all inclusive",
      "شامل كليا"
    ],
    "answer": "يشمل نظام الإقامة الشاملة: جميع الوجبات في بوفيه سيرينا، سناكس الشاطئ، المشروبات طوال اليوم، الأكوا بارك، مسبح لوتس، الجيم، وملاعب التنس مجاناً. المساج والسبا ورحلات الغوص برسوم إضافية."
  }
];
  var hurghadaPrayerSchedule = [
  {
    "nameAr": "الفجر (Fajr)",
    "time": "04:18 ص",
    "icon": "🌌"
  },
  {
    "nameAr": "الشروق (Sunrise)",
    "time": "05:38 ص",
    "icon": "🌅"
  },
  {
    "nameAr": "الظهر (Dhuhr)",
    "time": "11:46 ص",
    "icon": "☀️"
  },
  {
    "nameAr": "العصر (Asr)",
    "time": "03:12 م",
    "icon": "🌤️"
  },
  {
    "nameAr": "المغرب (Maghrib)",
    "time": "05:54 م",
    "icon": "🌇"
  },
  {
    "nameAr": "العشاء (Isha)",
    "time": "07:10 م",
    "icon": "🌙"
  }
];
  var resortContactConfig = {
  "hotspotLoginUrl": "http://192.1.1.1/login",
  "emergencyContacts": [
    {
      "id": "reception",
      "nameAr": "مكتب الاستقبال الرئيسي والكونسيرج",
      "nameEn": "Reception Desk & Concierge",
      "nameRu": "Стойка регистрации и консьерж",
      "nameDe": "Hauptrezeption & Concierge",
      "icon": "🏛️",
      "roleAr": "استفسارات عامة، طلبات النزلاء، تسجيل المغادرة",
      "roleEn": "General inquiries, checkout, luggage service",
      "phone": "+201099887701",
      "extension": "0 / 100",
      "badgeColor": "bg-amber-500"
    },
    {
      "id": "clinic",
      "nameAr": "عيادة المنتجع والطوارئ الطبية",
      "nameEn": "Resort Clinic & Medical Emergency",
      "nameRu": "Клиника курорта и скорая помощь",
      "nameDe": "Resort-Klinik & Medizinischer Notdienst",
      "icon": "🩺",
      "roleAr": "طبيب مقيم 24 ساعة، إسعافات أولية، طوارئ صحية",
      "roleEn": "Resident doctor 24/7, first aid, medical care",
      "phone": "+201099887703",
      "extension": "150",
      "badgeColor": "bg-rose-600"
    },
    {
      "id": "security",
      "nameAr": "الأمن والسلامة وحرس الشاطئ",
      "nameEn": "Security & Beach Lifeguards",
      "nameRu": "Служба безопасности и спасатели",
      "nameDe": "Sicherheitsdienst & Strandrettung",
      "icon": "🛡️",
      "roleAr": "دوريات أمنية مدار الساعة، مفقودات، سلامة الشاطئ",
      "roleEn": "24/7 Security patrol, lost & found, beach safety",
      "phone": "+201099887702",
      "extension": "200",
      "badgeColor": "bg-blue-600"
    },
    {
      "id": "room_service",
      "nameAr": "خدمة الغرف وعلاقات النزلاء",
      "nameEn": "In-Room Dining & Guest Relations",
      "nameRu": "Обслуживание в номерах и сервис",
      "nameDe": "Zimmerservice & Gästebetreuung",
      "icon": "🛎️",
      "roleAr": "قائمة الطعام بالغرفة، صيانة، تنظيف الغرف",
      "roleEn": "Room dining orders, housekeeping, maintenance",
      "phone": "+201099887704",
      "extension": "300",
      "badgeColor": "bg-emerald-600"
    }
  ]
};
  var compendiumData = {
  "resortExtensions": [
    {
      "name": "الاستقبال واللوبي (Front Desk)",
      "num": "0",
      "desc": "خدمة النزلاء والاستفسارات 24 ساعة"
    },
    {
      "name": "العيادة والطبيب المقيم (Clinic)",
      "num": "15",
      "desc": "طوارئ ورعاية طبية على مدار الساعة"
    },
    {
      "name": "خدمة الغرف والأغذية (Room Service)",
      "num": "120",
      "desc": "طلب الطعام والمشروبات للغرف"
    },
    {
      "name": "الإشراف الداخلي والمناشف (Housekeeping)",
      "num": "130",
      "desc": "تنظيف الغرف ومستلزمات الحمام"
    },
    {
      "name": "النادي الصحي والسبا (Spa & Wellness)",
      "num": "9",
      "desc": "حجز جلسات المساج والحمام التركي"
    },
    {
      "name": "مكتب الأنشطة والرحلات (Excursions)",
      "num": "140",
      "desc": "حجز رحلات اليخوت والغطس والسفاري"
    }
  ],
  "localFaqKb": [
    {
      "keywords": [
        "واي فاي",
        "wifi",
        "انترنت",
        "باسورد",
        "password"
      ],
      "answer": "شبكة الواي فاي المجانية بالمنتجع هي 'Moreno Free' وكلمة المرور هي: Moreno@2026 وهي متاحة في جميع الغرف واللوبي والشاطئ."
    },
    {
      "keywords": [
        "مواعيد",
        "وجبات",
        "اكل",
        "طعام",
        "فطار",
        "غدا",
        "عشا",
        "سيرينا",
        "buffet"
      ],
      "answer": "مواعيد بوفيه مطعم سيرينا الرئيسي: الإفطار من 07:00 حتى 10:30 صباحاً | الغداء من 13:00 حتى 15:00 عصراً | العشاء من 19:00 حتى 22:00 مساءً."
    },
    {
      "keywords": [
        "اكوا بارك",
        "زحاليق",
        "العاب مائية",
        "aqua"
      ],
      "answer": "أكوا بارك مورينو (نقطة 3) تعمل يومياً على فترتين: الفترة الصباحية من 10:00 إلى 12:30 ظهراً، والفترة المسائية من 14:30 إلى 17:00 عصراً."
    },
    {
      "keywords": [
        "عيادة",
        "دكتور",
        "طبيب",
        "صيدلية",
        "صداع",
        "clinic",
        "pharmacy"
      ],
      "answer": "العيادة الطبية والصيدلية (نقطة 15) متوفرة 24 ساعة قرب البوابة الرئيسية والمسجد، ويمكنك الاتصال بالطبيب المقيم مباشرة عبر تحويلة الغرفة (15)."
    },
    {
      "keywords": [
        "مناشف",
        "كارت",
        "فوطة",
        "towel"
      ],
      "answer": "يمكنك استلام وتغيير مناشف الشاطئ والمسبح مجاناً بكارت المنشفة في محطة مسبح لوتس ومحطة الشاطئ من 08:00 صباحاً وحتى غروب الشمس."
    },
    {
      "keywords": [
        "خروج",
        "مغادرة",
        "تسجيل خروج",
        "check out"
      ],
      "answer": "موعد تسجيل المغادرة (Check-out) الرسمي هو الساعة 12:00 ظهراً. لطلب مد الإقامة (Late Check-out) يرجى التنسيق مع مكتب الاستقبال الداخلي (0)."
    },
    {
      "keywords": [
        "شامل",
        "all inclusive",
        "شامل كليا"
      ],
      "answer": "يشمل نظام الإقامة الشاملة: جميع الوجبات في بوفيه سيرينا، سناكس الشاطئ، المشروبات طوال اليوم، الأكوا بارك، مسبح لوتس، الجيم، وملاعب التنس مجاناً. المساج والسبا ورحلات الغوص برسوم إضافية."
    }
  ],
  "hurghadaPrayerSchedule": [
    {
      "nameAr": "الفجر (Fajr)",
      "time": "04:18 ص",
      "icon": "🌌"
    },
    {
      "nameAr": "الشروق (Sunrise)",
      "time": "05:38 ص",
      "icon": "🌅"
    },
    {
      "nameAr": "الظهر (Dhuhr)",
      "time": "11:46 ص",
      "icon": "☀️"
    },
    {
      "nameAr": "العصر (Asr)",
      "time": "03:12 م",
      "icon": "🌤️"
    },
    {
      "nameAr": "المغرب (Maghrib)",
      "time": "05:54 م",
      "icon": "🌇"
    },
    {
      "nameAr": "العشاء (Isha)",
      "time": "07:10 م",
      "icon": "🌙"
    }
  ],
  "resortContactConfig": {
    "hotspotLoginUrl": "http://192.1.1.1/login",
    "emergencyContacts": [
      {
        "id": "reception",
        "nameAr": "مكتب الاستقبال الرئيسي والكونسيرج",
        "nameEn": "Reception Desk & Concierge",
        "nameRu": "Стойка регистрации и консьерж",
        "nameDe": "Hauptrezeption & Concierge",
        "icon": "🏛️",
        "roleAr": "استفسارات عامة، طلبات النزلاء، تسجيل المغادرة",
        "roleEn": "General inquiries, checkout, luggage service",
        "phone": "+201099887701",
        "extension": "0 / 100",
        "badgeColor": "bg-amber-500"
      },
      {
        "id": "clinic",
        "nameAr": "عيادة المنتجع والطوارئ الطبية",
        "nameEn": "Resort Clinic & Medical Emergency",
        "nameRu": "Клиника курорта и скорая помощь",
        "nameDe": "Resort-Klinik & Medizinischer Notdienst",
        "icon": "🩺",
        "roleAr": "طبيب مقيم 24 ساعة، إسعافات أولية، طوارئ صحية",
        "roleEn": "Resident doctor 24/7, first aid, medical care",
        "phone": "+201099887703",
        "extension": "150",
        "badgeColor": "bg-rose-600"
      },
      {
        "id": "security",
        "nameAr": "الأمن والسلامة وحرس الشاطئ",
        "nameEn": "Security & Beach Lifeguards",
        "nameRu": "Служба безопасности и спасатели",
        "nameDe": "Sicherheitsdienst & Strandrettung",
        "icon": "🛡️",
        "roleAr": "دوريات أمنية مدار الساعة، مفقودات، سلامة الشاطئ",
        "roleEn": "24/7 Security patrol, lost & found, beach safety",
        "phone": "+201099887702",
        "extension": "200",
        "badgeColor": "bg-blue-600"
      },
      {
        "id": "room_service",
        "nameAr": "خدمة الغرف وعلاقات النزلاء",
        "nameEn": "In-Room Dining & Guest Relations",
        "nameRu": "Обслуживание в номерах и сервис",
        "nameDe": "Zimmerservice & Gästebetreuung",
        "icon": "🛎️",
        "roleAr": "قائمة الطعام بالغرفة، صيانة، تنظيف الغرف",
        "roleEn": "Room dining orders, housekeeping, maintenance",
        "phone": "+201099887704",
        "extension": "300",
        "badgeColor": "bg-emerald-600"
      }
    ]
  }
};

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
