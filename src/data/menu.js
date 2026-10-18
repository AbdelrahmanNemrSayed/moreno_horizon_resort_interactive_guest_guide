/**
 * Moreno Horizon Spa & Resort - Dining Menus & Spa Treatments Catalog Module
 */

export const resortSpaTreatments = [
  {
    id: "hot_stone",
    titleAr: "مساج الأحجار البركانية الساخنة (Hot Stone Therapy)",
    descAr:
      "أحجار بازلت دافئة مع زيوت عطرية لفك توتر العضلات وتجديد الطاقة الحيوية.",
    durations: [
      { min: 50, price: 850 },
      { min: 80, price: 1200 },
    ],
    icon: "💆",
  },
  {
    id: "turkish_bath",
    titleAr: "الحمام التركي الملكي التراثي (Sultan Turkish Hammam)",
    descAr:
      "غرفة بخار دافئة، تقشير كيسة بالصابون المغربي وزيت الغار، وتدليك بالرغوة الغنية.",
    durations: [
      { min: 60, price: 950 },
      { min: 90, price: 1350 },
    ],
    icon: "🧖",
  },
  {
    id: "aromatherapy",
    titleAr: "جلسة المساج السويدي والعلاج العطري (Aromatherapy Massage)",
    descAr:
      "تدليك كامل بزيوت اللافندر والنعناع العطرية المهدئة للأعصاب مع تدليك فروة الرأس.",
    durations: [
      { min: 45, price: 700 },
      { min: 60, price: 900 },
    ],
    icon: "🌸",
  },
  {
    id: "private_jacuzzi",
    titleAr: "جلسة الجاكوزي الخاصة بالأعشاب وأملاح البحر الأحمر",
    descAr:
      "مغطس مائي دافئ خاص بالأعشاب الطبيعية وأملاح البحر الأحمر لتنشيط الدورة الدموية.",
    durations: [{ min: 40, price: 500 }],
    icon: "🛁",
  },
];

export const diningSchedules = [
  {
    restaurant: "مطعم سيرينا الرئيسي (Sirena Buffet)",
    meals: [
      { name: "الإفطار (Breakfast)", time: "07:00 - 10:30" },
      { name: "الغداء (Lunch)", time: "13:00 - 15:00" },
      { name: "العشاء (Dinner)", time: "19:00 - 22:00" },
    ],
  },
  {
    restaurant: "مطعم لا ماما الإيطالي (La Mama Italian)",
    meals: [{ name: "الغداء والعشاء (Lunch & Dinner)", time: "13:00 - 23:00" }],
  },
  {
    restaurant: "المطعم الشرقي (Al-Sharq Oriental)",
    meals: [{ name: "العشاء (Dinner)", time: "19:00 - 22:30" }],
  },
  {
    restaurant: "بار الشاطئ (Beach Bar)",
    meals: [
      {
        name: "مشروبات ومثلجات (Drinks & Ice Cream)",
        time: "10:00 - 18:00 (حتى الغروب)",
      },
    ],
  },
  {
    restaurant: "سناكس بيتش (Beach Snack Bar)",
    meals: [
      {
        name: "ساندوتشات وسناكس سريعة وبطاطس مقرمشة",
        time: "12:00 - 17:00",
      },
    ],
  },
  {
    restaurant: "سناكس أكوا بارك (Aqua Snack Bar)",
    meals: [
      {
        name: "هوت دوج وبيتزا سلايس وسناكس أطفال ومشروبات",
        time: "12:00 - 17:00",
      },
    ],
  },
  {
    restaurant: "بيانو بار ولوبي لاوندج (Piano Bar & Lounge)",
    meals: [
      {
        name: "مشروبات ساخنة وباردة وعصائر وكوكتيلات مسائية",
        time: "10:00 - 00:00",
      },
    ],
  },
];

export default {
  resortSpaTreatments,
  diningSchedules,
};
