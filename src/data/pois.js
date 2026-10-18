/**
 * Moreno Horizon Spa & Resort - Points of Interest (POIs) Module
 * Official resort landmark destinations, zones, and building coordinates
 * Perfectly aligned with VirtualResortMap 896x1200 canvas and walkway routing graph.
 */

export const resortPois = [
  {
    id: "1",
    num: "1",
    category: "relax",
    categoryNameAr: "استكشاف واسترخاء (Explore & Relax)",
    nameAr: "منطقة الشاطئ والمارينا (Beach Area)",
    nameEn: "Beach Area & Marina Pier",
    nameRu: "Пляжная зона и пирс марины",
    nameDe: "Strandbereich & Marina-Steg",
    tagAr: "شاطئ رملي ومظلات وممشى مارينا",
    hours: "07:00 - غروب الشمس",
    locAr: "الواجهة البحرية المباشرة على البحر الأحمر",
    descriptionAr:
      "شاطئ رملي خاص مجهز بأسرّة استلقاء ومظلات شمسية مع رصيف المارينا لليخوت وممارسة السنوركلينج.",
    coords: { x: 42.52, y: 23.42 },
    badgeColor: "bg-sky-600",
    image: "assets/images/beach_marina.jpg",
  },
  {
    id: "2",
    num: "2",
    category: "wellness",
    categoryNameAr: "صحة وأنشطة (Wellness & Activities)",
    nameAr: "مركز الغوص والرياضات البحرية (Diving Center)",
    nameEn: "Diving & Watersports Center",
    nameRu: "Дайвинг-центр и водный спорт",
    nameDe: "Tauch- & Wassersportzentrum",
    tagAr: "دورات غوص PADI ورحلات بحرية",
    hours: "08:30 - 17:30",
    locAr: "بجوار مسبح الأكوا بارك الشمالي",
    descriptionAr:
      "فريق غواصين محترف يقدم رحلات يومية إلى جزيرة جفتون، سنوركلينج، ودورات غوص PADI للمبتدئين والمحترفين.",
    coords: { x: 16.74, y: 28.5 },
    badgeColor: "bg-purple-600",
    image: "assets/images/diving_center.jpg",
  },
  {
    id: "3",
    num: "3",
    category: "relax",
    categoryNameAr: "استكشاف واسترخاء (Explore & Relax)",
    nameAr: "أكوا بارك مورينو (Aqua Park)",
    nameEn: "Moreno Aqua Park",
    nameRu: "Аквапарк Moreno",
    nameDe: "Moreno Aquapark",
    tagAr: "زلاجات مائية لجميع الأعمار",
    hours: "10:00 - 12:30 | 14:30 - 17:00",
    locAr: "الطرف الشمالي للقرية بجوار المبنى N",
    descriptionAr:
      "مجموعة من الزلاجات المائية السريعة، برك مائية آمنة مزودة بفريق إنقاذ معتمد ومظلات شمسية عائلية.",
    coords: { x: 16.18, y: 34.83 },
    badgeColor: "bg-cyan-500",
    image: "assets/images/aquapark_pool.jpg",
  },
  {
    id: "4",
    num: "4",
    category: "wellness",
    categoryNameAr: "صحة وأنشطة (Wellness & Activities)",
    nameAr: "منطقة ألعاب الأطفال (Kids Area)",
    nameEn: "Kids Play Area & Mini Club",
    nameRu: "Детская игровая зона и клуб",
    nameDe: "Kinderspielbereich & Miniclub",
    tagAr: "ألعاب آمنة وميني كلوب ترفيهي",
    hours: "09:30 - 12:30 | 15:00 - 17:30",
    locAr: "الحدائق الخضراء بين الأكوا بارك وبار الشاطئ",
    descriptionAr:
      "مساحة مخصصة ومظللة للأطفال تضم زلاجات ومراجيح وبرامج رسم وأنشطة يومية تحت إشراف فريق متخصص.",
    coords: { x: 29.69, y: 34.67 },
    badgeColor: "bg-sky-500",
    image: "assets/images/kids_club.jpg",
  },
  {
    id: "5",
    num: "5",
    category: "relax",
    categoryNameAr: "استكشاف واسترخاء (Explore & Relax)",
    nameAr: "بار الشاطئ (Beach Bar)",
    nameEn: "Beach Bar & Lounge",
    nameRu: "Пляжный бар и лаундж",
    nameDe: "Strandbar & Lounge",
    tagAr: "مشروبات منعشة وكوكتيلات مثلجة",
    hours: "10:00 - 18:00 (حتى الغروب)",
    locAr: "بمحاذاة شاطئ البحر",
    descriptionAr:
      "يقدم العصائر الطازجة، المشروبات الباردة والساخنة، والكوكتيلات الاستوائية بإطلالة ساحرة على المارينا.",
    coords: { x: 37.39, y: 35.92 },
    badgeColor: "bg-amber-600",
    image: "assets/images/beach_bar.jpg",
  },
  {
    id: "6",
    num: "6",
    category: "dine",
    categoryNameAr: "مطاعم وتجارب طعام (Dine & Indulge)",
    nameAr: "المطعم الشرقي وسناك بار (Oriental Restaurant)",
    nameEn: "Al-Sharq Oriental Cuisine & Snack Bar",
    nameRu: "Восточный ресторан и снэк-бар",
    nameDe: "Orientalisches Restaurant & Snackbar",
    tagAr: "مشويات شرقية وسناكس طازجة",
    hours: "12:00 - 17:00 (سناكس) | 19:00 - 22:30 (عشاء)",
    locAr: "حدائق الكورنيش بين الشاطئ ومسبح لوتس",
    descriptionAr:
      "يقدم تجربة طعام شرقية غنية بالمشويات على الفحم، ساندوتشات شاطئ خفيفة، ومأكولات بدوية أصيلة.",
    coords: { x: 48.55, y: 35.92 },
    badgeColor: "bg-orange-600",
    image: "assets/images/sirena_buffet.jpg",
  },
  {
    id: "7",
    num: "7",
    category: "relax",
    categoryNameAr: "استكشاف واسترخاء (Explore & Relax)",
    nameAr: "بيانو بار ولوبي لاوندج (Piano Bar)",
    nameEn: "Piano Bar & Lounge",
    nameRu: "Пиано-бар и лаундж",
    nameDe: "Piano Bar & Lounge",
    tagAr: "مشروبات راقية وأجواء هادئة خلف مطعم سيرينا",
    hours: "10:00 - 00:00",
    locAr: "خلف مطعم سيرينا (12) بالممشى الأوسط",
    descriptionAr:
      "بار كلاسيكي أنيق يقع خلف مطعم سيرينا، يقدم أرقى المشروبات والعصائر والكوكتيلات والقهوة مع أنغام البيانو الهادئة.",
    descriptionEn:
      "An elegant classic piano bar located behind Sirena Restaurant, serving fine beverages, specialty coffee, and evening cocktails with soothing melodies.",
    descriptionRu:
      "Элегантный классический пиано-бар за рестораном Sirena с изысканными напитками, кофе и коктейлями под звуки живого фортепиано.",
    descriptionDe:
      "Elegante Piano Bar hinter dem Restaurant Sirena mit feinen Getränken, Cocktails und Kaffee bei sanften Klaviermelodien.",
    coords: { x: 47.88, y: 71.25 },
    badgeColor: "bg-amber-700",
    icon: "🎹",
    image: "assets/images/resort_lobby.jpg",
  },
  {
    id: "snack_beach",
    num: "🥪",
    category: "dine",
    categoryNameAr: "مطاعم وتجارب طعام (Dine & Indulge)",
    nameAr: "سناكس بيتش (Beach Snack Bar)",
    nameEn: "Beach Snack Bar",
    nameRu: "Снэк-бар на пляже",
    nameDe: "Strand-Snackbar",
    tagAr: "ساندوتشات شاطئ وسناكس طازجة طوال اليوم",
    hours: "12:00 - 17:00",
    locAr: "بجوار بار الشاطئ (5) على ممشى الكورنيش",
    descriptionAr:
      "يقدم تشكيلة شهية من السناكس السريعة وساندوتشات البرجر والبطاطس المقرمشة والمشروبات الباردة بجوار بار الشاطئ مباشرة.",
    descriptionEn:
      "Delicious beachside bites, fresh sandwiches, burgers, crispy fries, and refreshing cold drinks right next to Beach Bar 5.",
    descriptionRu:
      "Аппетитные пляжные закуски, сэндвичи, бургеры, картофель фри и прохладительные напитки рядом с пляжным баром.",
    descriptionDe:
      "Köstliche Strand-Snacks, frische Sandwiches, Burger, Pommes und kühle Getränke direkt neben der Strandbar.",
    coords: { x: 40.18, y: 35.92 },
    badgeColor: "bg-amber-600",
    icon: "🥪",
    image: "assets/images/beach_bar.jpg",
  },
  {
    id: "snack_aqua",
    num: "🌭",
    category: "dine",
    categoryNameAr: "مطاعم وتجارب طعام (Dine & Indulge)",
    nameAr: "سناكس أكوا بارك (Aqua Snack Bar)",
    nameEn: "Aqua Park Snack Bar",
    nameRu: "Снэк-бар Аквапарк",
    nameDe: "Aquapark Snackbar",
    tagAr: "سناكس ومأكولات خفيفة للألعاب المائية",
    hours: "12:00 - 17:00",
    locAr: "بجوار مسبح وزلاجات الأكوا بارك (3)",
    descriptionAr:
      "محطة سناكس مميزة تقع بجوار الأكوا بارك، تقدم الهوت دوج والبيتزا سلايس والمشروبات المثلجة للأطفال والعائلات.",
    descriptionEn:
      "Fun snack station located right beside the Aqua Park slides, serving hot dogs, pizza slices, and ice-cold refreshments for families.",
    descriptionRu:
      "Закусочная у аквапарка: хот-доги, свежая пицца и холодные напитки для детей и всей семьи.",
    descriptionDe:
      "Snack-Station direkt am Aquapark mit Hot Dogs, Pizza-Schnitten und Erfrischungsgetränken für die ganze Familie.",
    coords: { x: 19.53, y: 34.83 },
    badgeColor: "bg-cyan-600",
    icon: "🌭",
    image: "assets/images/aquapark_pool.jpg",
  },
  {
    id: "8",
    num: "8",
    category: "dine",
    categoryNameAr: "مطاعم وتجارب طعام (Dine & Indulge)",
    nameAr: "مطعم لا ماما الإيطالي (La Mama Italian)",
    nameEn: "La Mama Italian Restaurant",
    nameRu: "Итальянский ресторан La Mama",
    nameDe: "Italienisches Restaurant La Mama",
    tagAr: "بيتزا حطب وباستا إيطالية طازجة",
    hours: "13:00 - 23:00",
    locAr: "الممشى الشرقي بجوار المبنى الجنوبي S",
    descriptionAr:
      "يقدم أشهى أطباق المطبخ الإيطالي: بيتزا مخبوزة على الحطب، باستا إيطالية أصيلة، وحلويات التيراميسو الشهيرة.",
    coords: { x: 60.04, y: 39.58 },
    badgeColor: "bg-red-600",
    image: "assets/images/la_mama.jpg",
  },
  {
    id: "9",
    num: "9",
    category: "wellness",
    categoryNameAr: "صحة وأنشطة (Wellness & Activities)",
    nameAr: "النادي الصحي والسبا (Spa & Wellness)",
    nameEn: "Horus Royal Spa & Turkish Bath",
    nameRu: "Королевский спа-комплекс и хаммам",
    nameDe: "Horus Royal Spa & Türkisches Bad",
    tagAr: "مساج وسونا وحمام تركي وجاكوزي",
    hours: "09:00 - 20:00",
    locAr: "الجناح الشرقي بجوار المبنى الجنوبي S",
    descriptionAr:
      "مركز استرخاء متكامل يقدم جلسات مساج الأحجار الساخنة، حمام تركي تقليدي، غرف بخار وساونا وجاكوزي مائي خاص.",
    coords: { x: 68.64, y: 49.0 },
    badgeColor: "bg-teal-600",
    image: "assets/images/spa_wellness.jpg",
  },
  {
    id: "10",
    num: "10",
    category: "wellness",
    categoryNameAr: "صحة وأنشطة (Wellness & Activities)",
    nameAr: "ملاعب التنس والرياضة (Tennis Courts)",
    nameEn: "Championship Tennis Courts",
    nameRu: "Теннисные корты",
    nameDe: "Tennisplätze",
    tagAr: "ملاعب مضاءة ومضارب متوفرة",
    hours: "08:00 - 22:00",
    locAr: "المنطقة الرياضية الشرقية بجوار مسبح لوتس",
    descriptionAr:
      "ملعبا تنس أرضي مجهزان بإضاءة ليلية متقدمة، مع إمكانية استعارة المضارب والكرات وتوفر مدربين محترفين.",
    coords: { x: 68.97, y: 61.0 },
    badgeColor: "bg-emerald-500",
    image: "assets/images/tennis_courts.jpg",
  },
  {
    id: "11",
    num: "11",
    category: "relax",
    categoryNameAr: "استكشاف واسترخاء (Explore & Relax)",
    nameAr: "مسبح لوتس بول والبحيرة (Lotus Pool)",
    nameEn: "Lotus Central Pool & Swim-up Bar",
    nameRu: "Бассейн Lotus и водный бар",
    nameDe: "Lotus-Pool & Swim-up-Bar",
    tagAr: "مسبح رئيسي هادئ مع بار مائي",
    hours: "08:00 - 18:00",
    locAr: "الجهة الشرقية أمام المبنى الجنوبي S",
    descriptionAr:
      "أكبر بحيرات المسبح بالمنتجع، مياه متدرجة العمق، بار كوكتيل داخل الماء، كبائن استرخاء وأسرّة شمسية فاخرة.",
    descriptionEn:
      "The resort's largest lagoon pool featuring zero-entry depths, an integrated swim-up cocktail bar, and luxury sun cabanas.",
    descriptionRu:
      "Самый большой бассейн курорта с плавным заходом в воду, баром прямо в бассейне и шезлонгами.",
    descriptionDe:
      "Der größte Lagunenpool des Resorts mit flachem Einstieg, integrierter Swim-up-Bar und luxuriösen Sonnenliegen.",
    coords: { x: 69.2, y: 70.83 },
    badgeColor: "bg-blue-600",
    icon: "🏊",
    image: "assets/images/lotus_pool.jpg",
  },
  {
    id: "12",
    num: "12",
    category: "dine",
    categoryNameAr: "مطاعم وتجارب طعام (Dine & Indulge)",
    nameAr: "مطعم سيرينا الرئيسي (Sirena Restaurant)",
    nameEn: "Sirena International Buffet",
    nameRu: "Главный ресторан Sirena (шведский стол)",
    nameDe: "Sirena Hauptrestaurant (Buffet)",
    tagAr: "بوفيه مفتوح ومحطات طهي حي يومياً",
    hours: "07:00-10:30 (إفطار) | 13:00-15:00 (غداء) | 19:00-22:00 (عشاء)",
    locAr: "المبنى الرئيسي مطل على حدائق اللوتس",
    descriptionAr:
      "المطعم الرئيسي للمنتجع يقدم أشهى الأطباق العالمية والمصرية مع محطات شواء حية وركن خاص للأطفال.",
    coords: { x: 47.88, y: 68.33 },
    badgeColor: "bg-emerald-600",
    image: "assets/images/sirena_buffet.jpg",
  },
  {
    id: "13",
    num: "13",
    category: "services",
    categoryNameAr: "مرافق وخدمات (Facilities & Services)",
    nameAr: "موقف السيارات 1 (Parking 1)",
    nameEn: "Parking Area 1",
    nameRu: "Парковка 1 (Северная)",
    nameDe: "Parkplatz 1 (Nord)",
    tagAr: "مواقف مجانية مؤمنة للنزلاء 24/7",
    hours: "متاح 24 ساعة",
    locAr: "الجهة الشمالية الغربية بجوار المبنى N",
    descriptionAr:
      "موقف سيارات مظلل وخاص بنزلاء الجناح الشمالي مزود بكاميرات مراقبة وحراسة أمنية دائمة.",
    coords: { x: 7.25, y: 60.58 },
    badgeColor: "bg-slate-700",
    image: "assets/images/resort_gate.jpg",
  },
  {
    id: "14",
    num: "14",
    category: "services",
    categoryNameAr: "المداخل والبوابات (Entrances)",
    nameAr: "البوابة الجانبية (Side Gate)",
    nameEn: "Resort Side Gate",
    nameRu: "Боковые ворота курорта",
    nameDe: "Seitentor des Resorts",
    tagAr: "مدخل جانبي قريب من المبنى التجاري",
    hours: "متاح 24 ساعة",
    locAr: "الركن الجنوبي الغربي للمنتجع قرب MLS",
    descriptionAr:
      "بوابة دخول وخروج جانبية للمشاة والسيارات تخدم منطقة المبنى التجاري MLS والمحلات.",
    coords: { x: 5.47, y: 86.92 },
    badgeColor: "bg-blue-800",
    image: "assets/images/resort_gate.jpg",
  },
  {
    id: "15",
    num: "15",
    category: "services",
    categoryNameAr: "مرافق وخدمات (Facilities & Services)",
    nameAr: "العيادة الطبية (Resort Medical Clinic)",
    nameEn: "Resort 24/7 Medical Clinic",
    nameRu: "Круглосуточная медицинская клиника",
    nameDe: "24/7 Resort-Klinik",
    tagAr: "طوارئ، إسعافات، وطبيب مقيم 24 ساعة",
    hours: "متاح 24 ساعة",
    locAr: "داخل المبنى الرئيسي بجوار بهو الاستقبال واللوبي (Lobby M)",
    descriptionAr:
      "عيادة طبية مجهزة للطوارئ والإسعافات الأولية تقع داخل المبنى الرئيسي بجوار الريسيبشن مع طبيب مقيم 24 ساعة.",
    descriptionEn:
      "Fully equipped medical clinic inside the Main Building right next to Reception (Lobby M), staffed with a resident physician 24/7.",
    descriptionRu:
      "Оборудованная медицинская клиника внутри главного здания рядом с рецепцией (Lobby M), дежурный врач 24/7.",
    descriptionDe:
      "Voll ausgestattete 24/7-Klinik im Hauptgebäude neben der Rezeption (Lobby M) mit Notfallversorgung und Bereitschaftsarzt.",
    coords: { x: 34.6, y: 69.58 },
    badgeColor: "bg-rose-600",
    icon: "🩺",
    image: "assets/images/resort_clinic.jpg",
  },
  {
    id: "pharmacy",
    num: "💊",
    category: "services",
    categoryNameAr: "مرافق وخدمات (Facilities & Services)",
    nameAr: "صيدلية المنتجع (Resort Pharmacy)",
    nameEn: "Resort Pharmacy",
    nameRu: "Аптека курорта",
    nameDe: "Resort-Apotheke",
    tagAr: "أدوية ومستلزمات طبية وعناية بالبشرة",
    hours: "09:00 - 23:00",
    locAr: "بجوار مسجد المنتجع مباشرة (16)",
    descriptionAr:
      "صيدلية متكاملة تقع بجوار المسجد، توفر الأدوية والمستلزمات الطبية ومستحضرات الحماية من الشمس والإسعافات الأولية.",
    descriptionEn:
      "Fully stocked resort pharmacy located right next to the Mosque (16), offering prescription medicines, suncare, and first aid supplies.",
    descriptionRu:
      "Аптека курорта рядом с мечетью (16): медикаменты, солнцезащитные средства и средства первой помощи.",
    descriptionDe:
      "Voll ausgestattete Resort-Apotheke direkt neben der Moschee (16) mit Medikamenten, Sonnenschutz und Erste-Hilfe-Artikeln.",
    coords: { x: 51.34, y: 86.67 },
    badgeColor: "bg-emerald-600",
    icon: "💊",
    image: "assets/images/resort_clinic.jpg",
  },
  {
    id: "16",
    num: "16",
    category: "services",
    categoryNameAr: "مرافق وخدمات (Facilities & Services)",
    nameAr: "مسجد المنتجع (Resort Mosque)",
    nameEn: "Resort Mosque",
    nameRu: "Мечеть курорта",
    nameDe: "Resort-Moschee",
    tagAr: "صلوات خمس وصلاة الجمعة",
    hours: "مفتوح في أوقات الصلوات",
    locAr: "الجهة الجنوبية بجوار العيادة والبوابة الرئيسية",
    descriptionAr:
      "مسجد مجهز لأداء الصلوات الخمس وصلاة الجمعة مع مصلى للرجال وآخر للسيدات وأماكن وضوء مهيأة.",
    coords: { x: 47.54, y: 86.67 },
    badgeColor: "bg-teal-700",
    image: "assets/images/resort_clinic.jpg",
  },
  {
    id: "17",
    num: "17",
    category: "services",
    categoryNameAr: "مرافق وخدمات (Facilities & Services)",
    nameAr: "موقف السيارات 2 (Parking 2)",
    nameEn: "Parking Area 2 (Main Gate)",
    nameRu: "Парковка 2 (Главные ворота)",
    nameDe: "Parkplatz 2 (Haupttor)",
    tagAr: "مواقف قريبة من اللوبي والبوابة الرئيسية",
    hours: "متاح 24 ساعة",
    locAr: "الجهة الجنوبية الشرقية قرب البوابة الرئيسية",
    descriptionAr:
      "موقف واسع ومظلل لسيارات النزلاء والزوار قريب من بهو الاستقبال وبوابة الدخول الرئيسية.",
    coords: { x: 67.29, y: 80.58 },
    badgeColor: "bg-slate-700",
    image: "assets/images/resort_gate.jpg",
  },
  {
    id: "18",
    num: "18",
    category: "services",
    categoryNameAr: "المداخل والبوابات (Entrances)",
    nameAr: "البوابة الرئيسية للمنتجع (Main Entrance Gate)",
    nameEn: "Main Entrance Gate & Security Center",
    nameRu: "Главные ворота курорта и служба охраны",
    nameDe: "Haupttor & Sicherheitszentrum",
    tagAr: "بوابة الوصول الرسمية واستقبال الباصات",
    hours: "متاح 24 ساعة",
    locAr: "المدخل الجنوبي الشرقي الرسمي للقرية",
    descriptionAr:
      "البوابة الرسمية لدخول النزلاء، استقبال باصات الرحلات، حجز الليموزين، ومكتب الأمن الرئيسي 24/7.",
    coords: { x: 69.75, y: 89.33 },
    badgeColor: "bg-amber-600",
    image: "assets/images/resort_gate.jpg",
  },
  {
    id: "N",
    num: "N",
    category: "buildings",
    categoryNameAr: "دليل المباني الفندقية (Building Directory)",
    nameAr: "المبنى الشمالي الفندقي (North Wing - N)",
    nameEn: "North Accommodation Wing N",
    nameRu: "Северный жилой корпус (Wing N)",
    nameDe: "Nordflügel Unterkünfte (Wing N)",
    tagAr:
      "الغرف: 1501-1548 (طابق 1) | 1601-1648 (طابق 2) | 1701-1748 (طابق 3) | 1801-1848 (طابق 4) | 1901-1948 (طابق 5)",
    hours: "متاح 24 ساعة للنزلاء",
    locAr: "الجهة الشمالية الغربية مطلاً على الأكوا بارك والحدائق",
    descriptionAr:
      "جناح الإقامة الشمالي الفاخر ويضم غرفاً عائلية وأجنحة مطلة على مسبح الأكوا بارك والحدائق مع مصاعد حديثة.",
    coords: { x: 27.9, y: 51.25 },
    badgeColor: "bg-cyan-600",
    isBuilding: true,
    image: "assets/images/luxury_room.jpg",
    rooms: [
      { min: 1501, max: 1548, floor: "الطابق الأول (Floor 1)" },
      { min: 1601, max: 1648, floor: "الطابق الثاني (Floor 2)" },
      { min: 1701, max: 1748, floor: "الطابق الثالث (Floor 3)" },
      { min: 1801, max: 1848, floor: "الطابق الرابع (Floor 4)" },
      { min: 1901, max: 1948, floor: "الطابق الخامس (Floor 5)" },
    ],
  },
  {
    id: "S",
    num: "S",
    category: "buildings",
    categoryNameAr: "دليل المباني الفندقية (Building Directory)",
    nameAr: "المبنى الجنوبي الفندقي (South Wing - S)",
    nameEn: "South Accommodation Wing S",
    nameRu: "Южный жилой корпус (Wing S)",
    nameDe: "Südflügel Unterkünfte (Wing S)",
    tagAr:
      "الغرف: 2001-2021 (طابق 1) | 2101-2144 (طابق 2) | 2201-2244 (طابق 3) | 2301-2344 (طابق 4) | 2401-2441 (طابق 5)",
    hours: "متاح 24 ساعة للنزلاء",
    locAr: "الجهة الجنوبية الشرقية مطلاً على مسبح لوتس والحدائق",
    descriptionAr:
      "جناح الإقامة الجنوبي الأنيق بإطلالات ساحرة على مسبح لوتس والممشى وملاعب التنس ومزود بمصاعد سريعة.",
    coords: { x: 63.11, y: 54.2 },
    badgeColor: "bg-amber-600",
    isBuilding: true,
    image: "assets/images/luxury_room.jpg",
    rooms: [
      { min: 2001, max: 2021, floor: "الطابق الأول (Floor 1)" },
      { min: 2101, max: 2144, floor: "الطابق الثاني (Floor 2)" },
      { min: 2201, max: 2244, floor: "الطابق الثالث (Floor 3)" },
      { min: 2301, max: 2344, floor: "الطابق الرابع (Floor 4)" },
      { min: 2401, max: 2441, floor: "الطابق الخامس (Floor 5)" },
    ],
  },
  {
    id: "M",
    num: "M",
    category: "buildings",
    categoryNameAr: "دليل المباني الفندقية (Building Directory)",
    nameAr: "المبنى الرئيسي واللوبي (Main Building - Lobby M)",
    nameEn: "Main Building (Lobby Wing M)",
    nameRu: "Главный корпус и лобби (Lobby Wing M)",
    nameDe: "Hauptgebäude & Lobby (Flügel M)",
    tagAr:
      "الغرف: 1001-1020 (طابق 1) | 1101-1160 (طابق 2) | 1201-1260 (طابق 3)",
    hours: "الاستقبال والكونسيرج 24 ساعة",
    locAr: "قلب المنتجع بجوار اللوبي ومطعم سيرينا",
    descriptionAr:
      "المبنى المركزي الذي يحتضن بهو الاستقبال الرئيسي، مطعم سيرينا، الصالون التنفيذي، ومكاتب خدمة النزلاء.",
    coords: { x: 37.95, y: 69.58 },
    badgeColor: "bg-rose-700",
    isBuilding: true,
    image: "assets/images/resort_lobby.jpg",
    rooms: [
      { min: 1001, max: 1020, floor: "الطابق الأول (Floor 1)" },
      { min: 1101, max: 1160, floor: "الطابق الثاني (Floor 2)" },
      { min: 1201, max: 1260, floor: "الطابق الثالث (Floor 3)" },
    ],
  },
  {
    id: "MLS",
    num: "MLS",
    category: "buildings",
    categoryNameAr: "دليل المباني الفندقية (Building Directory)",
    nameAr: "المبنى التجاري (Commercial Building - MLS)",
    nameEn: "Commercial Complex (Wing MLS)",
    nameRu: "Коммерческий комплекс (Wing MLS)",
    nameDe: "Gewerbekomplex (Flügel MLS)",
    tagAr:
      "الغرف والمحلات: 2601-2654 (طابق 1) | 2701-2748 (طابق 2) | 2801-2848 (طابق 3) | 2901-2948 (طابق 4)",
    hours: "09:00 - 23:00",
    locAr: "المبنى الدائري الأيقوني بالركن الجنوبي الغربي",
    descriptionAr:
      "مجمع البازار والمحلات التجارية، محمص القهوة الإيطالية، مكاتب الرحلات السياحية وتأجير السيارات.",
    coords: { x: 17.86, y: 77.33 },
    badgeColor: "bg-emerald-600",
    isBuilding: true,
    image: "assets/images/resort_mall.jpg",
    rooms: [
      { min: 2601, max: 2654, floor: "الطابق الأول (Floor 1)" },
      { min: 2701, max: 2748, floor: "الطابق الثاني (Floor 2)" },
      { min: 2801, max: 2848, floor: "الطابق الثالث (Floor 3)" },
      { min: 2901, max: 2948, floor: "الطابق الرابع (Floor 4)" },
    ],
  },
];

export function getLocalizedPoi(poi, lang = 'ar') {
  if (!poi) return { name: '', desc: '' };
  let name = poi.nameAr;
  let desc = poi.descAr || poi.descriptionAr || '';
  if (lang === 'en') {
    name = poi.nameEn || poi.nameAr;
    desc = poi.descEn || poi.descriptionEn || desc;
  } else if (lang === 'ru') {
    name = poi.nameRu || poi.nameAr;
    desc = poi.descRu || poi.descriptionRu || desc;
  } else if (lang === 'de') {
    name = poi.nameDe || poi.nameAr;
    desc = poi.descDe || poi.descriptionDe || desc;
  }
  return { name, desc };
}

export function getLocalizedFloor(floorCode, lang = 'ar') {
  if (!floorCode) return '';
  const floorDict = {
    G: { ar: 'الطابق الأرضي (Ground)', en: 'Ground Floor', ru: 'Первый этаж (Ground)', de: 'Erdgeschoss (Ground)' },
    1: { ar: 'الطابق الأول (1st Floor)', en: '1st Floor', ru: 'Второй этаж (1st Floor)', de: '1. Etage' },
    2: { ar: 'الطابق الثاني (2nd Floor)', en: '2nd Floor', ru: 'Третий этаж (2nd Floor)', de: '2. Etage' },
    3: { ar: 'الطابق الثالث (3rd Floor)', en: '3rd Floor', ru: 'Четвертый этаж (3rd Floor)', de: '3. Etage' },
    4: { ar: 'الطابق الرابع (4th Floor)', en: '4th Floor', ru: 'Пятый этаж (4th Floor)', de: '4. Etage' },
    5: { ar: 'الطابق الخامس (5th Floor)', en: '5th Floor', ru: 'Шестой этаж (5th Floor)', de: '5. Etage' }
  };
  if (floorDict[floorCode] && floorDict[floorCode][lang]) {
    return floorDict[floorCode][lang];
  }
  return floorCode;
}

export default resortPois;
