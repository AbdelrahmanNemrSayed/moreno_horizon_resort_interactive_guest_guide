/**
 * Moreno Horizon Spa & Resort - Activities & Excursions Module
 * Daily animation, sports schedules, and Hurghada marine excursions
 */

export const activityTranslations = {
  0: {
    en: "Aqua Gym at Lotus Pool",
    ru: "Аквагимнастика в бассейне Lotus",
    de: "Aqua-Gymnastik im Lotus-Pool",
  },
  1: {
    en: "Kids Splash & Slide Challenge",
    ru: "Водные игры и горки в аквапарке",
    de: "Wasserspiele im Aquapark",
  },
  2: {
    en: "Beach Volleyball Tournament",
    ru: "Пляжный волейбол у марины",
    de: "Beachvolleyball-Turnier an der Marina",
  },
  3: {
    en: "Sunset Yoga on the Beach",
    ru: "Йога на закате у пляжного бара",
    de: "Sonnenuntergangs-Yoga am Strand",
  },
  4: {
    en: "Kids Mini Disco & Animation Show",
    ru: "Детская мини-дискотека и шоу",
    de: "Kinder Mini-Disco & Show",
  },
  5: {
    en: "Egyptian Folklore Gala & Latin Night",
    ru: "Египетский фольклор и латино-шоу",
    de: "Ägyptische Folklore & Latein-Show",
  },
};

export function getLocalizedActivityTitle(act, index, lang = "ar") {
  if (lang === "ar" || !lang) return act.titleAr;
  const trans =
    activityTranslations[index] && activityTranslations[index][lang];
  return trans || act.titleEn || act.titleAr;
}

export const dailyActivities = [
  {
    time: "10:30 ص",
    titleAr: "أكوا جيم وتمارين مائية في مسبح لوتس",
    titleEn: "Aqua Gym at Lotus Pool",
    loc: "Lotus Pool (11)",
    icon: "🏊",
  },
  {
    time: "11:45 ص",
    titleAr: "مسابقات الأكوا بارك المائية وتحدي الزلاجات",
    titleEn: "Kids Splash Challenge",
    loc: "Aqua Park (3)",
    icon: "💦",
  },
  {
    time: "04:30 م",
    titleAr: "بطولة الكرة الطائرة الشاطئية عند المارينا",
    titleEn: "Beach Volleyball Tourney",
    loc: "Beach Area (1)",
    icon: "🏐",
  },
  {
    time: "05:15 م",
    titleAr: "يوغا واسترخاء وقت الغروب على الشاطئ",
    titleEn: "Sunset Beach Yoga",
    loc: "Beach Bar (5)",
    icon: "🧘",
  },
  {
    time: "08:30 م",
    titleAr: "ميني ديسكو وفقرات استعراضية للأطفال",
    titleEn: "Kids Mini Disco Show",
    loc: "Main Stage (M)",
    icon: "🪩",
  },
  {
    time: "09:30 م",
    titleAr: "أمسية الفلكلور المصري والشو اللاتيني",
    titleEn: "Egyptian Folklore Gala",
    loc: "Amphitheater",
    icon: "🎭",
  },
];

export const resortExcursions = [
  {
    titleAr: "رحلة جزيرة جفتون والسنوركلينج باليخت",
    titleEn: "Giftun Island VIP Yacht Cruise",
    descAr:
      "رحلة بحرية يومية شاملة الغداء والمشروبات ومعدات السنوركلينج لمشاهدة الشعاب المرجانية والدلافين.",
    price: "35$ / فرد",
    duration: "08:30 ص - 04:30 م",
    icon: "🛥️",
    image: "assets/images/giftun_island.jpg",
  },
  {
    titleAr: "سفاري صحراء الغردقة والبيتش باجي",
    titleEn: "Desert Quad Safari & Bedouin Dinner",
    descAr:
      "مغامرة ركوب الدراجات الرباعية في صحراء البحر الأحمر ومشاهدة الغروب مع عشاء بدوي وشو شرقي.",
    price: "28$ / فرد",
    duration: "02:00 م - 07:30 م",
    icon: "🏜️",
    image: "assets/images/hero_resort.jpg",
  },
  {
    titleAr: "جولة الغواصة البحرية سندباد",
    titleEn: "Sindbad Submarine Deep Dive",
    descAr:
      "غوص حقيقي على عمق 22 متراً تحت سطح البحر الأحمر لمشاهدة الكائنات البحرية النادرة بأمان للأطفال والعائلات.",
    price: "40$ / فرد",
    duration: "ساعتان",
    icon: "🤿",
    image: "assets/images/diving_center.jpg",
  },
];

export const resortActivities = dailyActivities;

export default {
  activityTranslations,
  getLocalizedActivityTitle,
  dailyActivities,
  resortActivities,
  resortExcursions,
};
