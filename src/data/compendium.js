/**
 * Moreno Horizon Spa & Resort - Compendium & Guest Knowledge Base Module
 * Extensions, Emergency Contacts, FAQ KB, and Hurghada Schedules
 */

export const resortExtensions = [
  {
    name: "الاستقبال واللوبي (Front Desk)",
    num: "0",
    desc: "خدمة النزلاء والاستفسارات 24 ساعة",
  },
  {
    name: "العيادة والطبيب المقيم (Clinic)",
    num: "15",
    desc: "طوارئ ورعاية طبية على مدار الساعة",
  },
  {
    name: "خدمة الغرف والأغذية (Room Service)",
    num: "120",
    desc: "طلب الطعام والمشروبات للغرف",
  },
  {
    name: "الإشراف الداخلي والمناشف (Housekeeping)",
    num: "130",
    desc: "تنظيف الغرف ومستلزمات الحمام",
  },
  {
    name: "النادي الصحي والسبا (Spa & Wellness)",
    num: "9",
    desc: "حجز جلسات المساج والحمام التركي",
  },
  {
    name: "مكتب الأنشطة والرحلات (Excursions)",
    num: "140",
    desc: "حجز رحلات اليخوت والغطس والسفاري",
  },
];

export const localFaqKb = [
  {
    keywords: ["واي فاي", "wifi", "انترنت", "باسورد", "password"],
    answer:
      "شبكة الواي فاي المجانية بالمنتجع هي 'Moreno Free' وكلمة المرور هي: Moreno@2026 وهي متاحة في جميع الغرف واللوبي والشاطئ.",
  },
  {
    keywords: [
      "مواعيد",
      "وجبات",
      "اكل",
      "طعام",
      "فطار",
      "غدا",
      "عشا",
      "سيرينا",
      "buffet",
    ],
    answer:
      "مواعيد بوفيه مطعم سيرينا الرئيسي: الإفطار من 07:00 حتى 10:30 صباحاً | الغداء من 13:00 حتى 15:00 عصراً | العشاء من 19:00 حتى 22:00 مساءً.",
  },
  {
    keywords: ["اكوا بارك", "زحاليق", "العاب مائية", "aqua"],
    answer:
      "أكوا بارك مورينو (نقطة 3) تعمل يومياً على فترتين: الفترة الصباحية من 10:00 إلى 12:30 ظهراً، والفترة المسائية من 14:30 إلى 17:00 عصراً.",
  },
  {
    keywords: [
      "عيادة",
      "دكتور",
      "طبيب",
      "صيدلية",
      "صداع",
      "clinic",
      "pharmacy",
    ],
    answer:
      "العيادة الطبية والصيدلية (نقطة 15) متوفرة 24 ساعة قرب البوابة الرئيسية والمسجد، ويمكنك الاتصال بالطبيب المقيم مباشرة عبر تحويلة الغرفة (15).",
  },
  {
    keywords: ["مناشف", "كارت", "فوطة", "towel"],
    answer:
      "يمكنك استلام وتغيير مناشف الشاطئ والمسبح مجاناً بكارت المنشفة في محطة مسبح لوتس ومحطة الشاطئ من 08:00 صباحاً وحتى غروب الشمس.",
  },
  {
    keywords: ["خروج", "مغادرة", "تسجيل خروج", "check out"],
    answer:
      "موعد تسجيل المغادرة (Check-out) الرسمي هو الساعة 12:00 ظهراً. لطلب مد الإقامة (Late Check-out) يرجى التنسيق مع مكتب الاستقبال الداخلي (0).",
  },
  {
    keywords: ["شامل", "all inclusive", "شامل كليا"],
    answer:
      "يشمل نظام الإقامة الشاملة: جميع الوجبات في بوفيه سيرينا، سناكس الشاطئ، المشروبات طوال اليوم، الأكوا بارك، مسبح لوتس، الجيم، وملاعب التنس مجاناً. المساج والسبا ورحلات الغوص برسوم إضافية.",
  },
];

export const hurghadaPrayerSchedule = [
  { nameAr: "الفجر (Fajr)", time: "04:18 ص", icon: "🌌" },
  { nameAr: "الشروق (Sunrise)", time: "05:38 ص", icon: "🌅" },
  { nameAr: "الظهر (Dhuhr)", time: "11:46 ص", icon: "☀️" },
  { nameAr: "العصر (Asr)", time: "03:12 م", icon: "🌤️" },
  { nameAr: "المغرب (Maghrib)", time: "05:54 م", icon: "🌇" },
  { nameAr: "العشاء (Isha)", time: "07:10 م", icon: "🌙" },
];

export const resortContactConfig = {
  hotspotLoginUrl: "http://192.1.1.1/login",
  emergencyContacts: [
    {
      id: "reception",
      nameAr: "مكتب الاستقبال الرئيسي والكونسيرج",
      nameEn: "Reception Desk & Concierge",
      nameRu: "Стойка регистрации и консьерж",
      nameDe: "Hauptrezeption & Concierge",
      icon: "🏛️",
      roleAr: "استفسارات عامة، طلبات النزلاء، تسجيل المغادرة",
      roleEn: "General inquiries, checkout, luggage service",
      phone: "+201099887701",
      extension: "0 / 100",
      badgeColor: "bg-amber-500",
    },
    {
      id: "clinic",
      nameAr: "عيادة المنتجع والطوارئ الطبية",
      nameEn: "Resort Clinic & Medical Emergency",
      nameRu: "Клиника курорта и скорая помощь",
      nameDe: "Resort-Klinik & Medizinischer Notdienst",
      icon: "🩺",
      roleAr: "طبيب مقيم 24 ساعة، إسعافات أولية، طوارئ صحية",
      roleEn: "Resident doctor 24/7, first aid, medical care",
      phone: "+201099887703",
      extension: "150",
      badgeColor: "bg-rose-600",
    },
    {
      id: "security",
      nameAr: "الأمن والسلامة وحرس الشاطئ",
      nameEn: "Security & Beach Lifeguards",
      nameRu: "Служба безопасности и спасатели",
      nameDe: "Sicherheitsdienst & Strandrettung",
      icon: "🛡️",
      roleAr: "دوريات أمنية مدار الساعة، مفقودات، سلامة الشاطئ",
      roleEn: "24/7 Security patrol, lost & found, beach safety",
      phone: "+201099887702",
      extension: "200",
      badgeColor: "bg-blue-600",
    },
    {
      id: "room_service",
      nameAr: "خدمة الغرف وعلاقات النزلاء",
      nameEn: "In-Room Dining & Guest Relations",
      nameRu: "Обслуживание в номерах и сервис",
      nameDe: "Zimmerservice & Gästebetreuung",
      icon: "🛎️",
      roleAr: "قائمة الطعام بالغرفة، صيانة، تنظيف الغرف",
      roleEn: "Room dining orders, housekeeping, maintenance",
      phone: "+201099887704",
      extension: "300",
      badgeColor: "bg-emerald-600",
    },
  ],
};

export const compendiumData = {
  resortExtensions,
  localFaqKb,
  hurghadaPrayerSchedule,
  resortContactConfig,
};

export default compendiumData;
