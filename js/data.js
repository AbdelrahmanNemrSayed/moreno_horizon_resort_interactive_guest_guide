/**
 * Moreno Horizon Spa & Resort - Data Layer
 * Contains POIs, Digital Menus, Excursions, Compendium, Building ranges, activities, i18n, and FAQ KB.
 */

// Multi-Language Dictionary (AR, EN, RU, DE)
const i18n = {
  ar: {
    // Brand
    resort_tagline: "منتجع وسبا • الغردقة",

    // Top Bar
    nav_search: "بحث",
    nav_pass: "بطاقتي",
    nav_qibla: "القبلة",
    nav_feedback: "تقييم",
    nav_beach_mode: "وضع الشاطئ",
    nav_pass_title: "بطاقة النزيل الرقمية",
    nav_qibla_title: "مواقيت الصلاة والقبلة",
    nav_feedback_title: "تقييم الإقامة",
    nav_beach_mode_title: "وضع الشاطئ عالي التباين تحت الشمس",
    nav_audio_title: "كتم / تشغيل المؤثرات الصوتية",
    nav_dark_mode_title: "تبديل المظهر الداكن / الفاتح",
    nav_lang_title: "اختيار لغة العرض",

    // Status & Clock
    resort_time: "🕒 توقيت الغردقة:",
    greeting_morning: "صباح الخير والبهجة ☀️ نتمنى لك يوماً استثنائياً",
    greeting_afternoon: "طاب يومك الساحر 🏖️ استمتع بأجواء البحر الأحمر",
    greeting_sunset: "مساء الخير والغروب 🌅 وقت مثالي لجلسة الشاطئ",
    greeting_night: "سهرة ممتعة وليلة سعيدة 🌙 استمتع بأجواء المنتجع",

    // Weather Bar
    wlblTemp: "طقس الغردقة اليوم",
    wvalTemp: "—",
    wlblSea: "حالة البحر المتوقعة",
    wvalSea: "—",
    wlblUv: "مؤشر الشمس (UV)",
    wvalUv: "—",
    wlblSunset: "غروب الشمس بالمارينا",
    wvalSunset: "—",
    weather_temperature: "{temp}°م • {condition}",
    weather_wave: "الموج {value}م",
    weather_sea_temp: "سطح البحر {value}°م",
    weather_uv: "أعلى مؤشر UV اليوم: {value}",
    weather_updated: "تحديث بيانات الطقس {time}",
    weather_cached: "آخر بيانات محفوظة من {time} (قديمة)",
    weather_unavailable: "بيانات الطقس غير متاحة حالياً",
    weather_source_note: "المصدر: Open-Meteo وDWD. بيانات تقريبية؛ ليست إرشاداً للسباحة أو الملاحة.",
    weather_clear: "صحو",
    weather_partly_cloudy: "غائم جزئياً",
    weather_cloudy: "غائم",
    weather_fog: "ضباب",
    weather_rain: "أمطار",
    weather_storm: "عاصفة رعدية",

    // Hero Section
    heroBadge: "دليل النزلاء الذكي الشامل • خدمة 24/7",
    heroTitle: "أهلاً بك في مورينو",
    heroSubtitle: "استكشف خريطة المنتجع ودليل المرافق والمطاعم، واعثر على المباني والغرف ضمن البيانات المتاحة.",
    wifi_label: "📶 واي فاي:",
    btn_copy: "نسخ 📋",
    btn_copied: "تم النسخ!",
    heroAiBtn: "أسئلة المنتجع",
    heroTourBtn: "جولة سينمائية",
    heroPromoVideoBtn: "فيديو العرض الترويجي",
    nav_promo_video: "فيديو الفندق",
    nav_promo_video_title: "عرض الفيديو الترويجي السينمائي للمنتجع",
    heroSpaBtn: "حجز السبا",
    heroPassBtn: "بطاقة الغرفة",
    heroGalleryBtn: "معرض الصور",
    heroCompendiumBtn: "دليل الإقامة",

    // Wayfinder
    wfTitle: "دليل الغرف والمسارات الذكي (Wayfinder 2.0)",
    wfTitleText: "دليل الغرف والمسارات الذكي (Wayfinder 2.0)",
    wfSubtitle: "اكتب رقم غرفتك لنحدد لك المبنى والطابق ونسلط الضوء على مكانه بالخريطة فورياً.",
    wfSampleLbl: "غرف تجريبية:",
    room_placeholder: "اكتب رقم غرفتك (مثلاً: 2015)...",
    wfBtnGo: "حدد غرفتي",
    wfBtnDraw: "توجيه",
    wf_reset_title: "إعادة ضبط",
    wf_room_found: "✓ تم تحديد موقع الغرفة",
    wf_approx_distance: "⏱️ المسافة التقريبية:",
    wf_meters: "متراً",
    wf_minutes_walk: "دقيقة سيراً عبر الممشى المظلل",
    wf_preview_map: "معاينة المسار بالخريطة 🗺️",
    wf_room_not_found: "رقم الغرفة غير مسجل في نطاقات الغرف الحالية. يرجى مراجعة موظف الاستقبال على تحويلة (0).",
    wf_direct_route: "مسار سير مباشر متصل بالخريطة:",
    wf_from_to: "من",
    wf_to: "إلى",
    wf_show_route: "أرني المسار 🗺️",
    wf_select_dest_prompt: "يرجى اختيار الوجهة المطلوبة أولاً 🎯",
    wf_your_location: "موقعك",

    // Map Section
    mapTitle: "🗺️ خريطة منتجع مورينو هورايزون التفاعلية (Resort Guide Map)",
    mapTitleText: "🗺️ خريطة منتجع مورينو هورايزون التفاعلية (Resort Guide Map)",
    mapSub: "خريطة توضيحية للمنتجع مع منظور مائل بصري. خرائط الطوابق الداخلية تحتاج مخططات معتمدة غير متوفرة حالياً.",
    map_location_reference: "موقع المنتجع المرجعي • ليس موقعك الحالي",
    map_view_2d: "خريطة توضيحية 2D",
    map_view_3d: "منظور مائل بصري",
    map_zoom_level: "مستوى التكبير:",
    mapOrbitBtn: "طيران 360°",
    mapTourBtn: "جولة المعالم",
    mapResetTxt: "إعادة الضبط",
    layer_illustrated: "الخريطة المعتمدة",
    layer_satellite: "قمر صناعي",
    layer_night: "رؤية ليلية",
    map_compass_n: "شمال",
    map_active_badge_default: "انقر على أي نقطة في الخريطة لمعاينة التفاصيل",
    map_pick_location: "حدد موقعي التقريبي",
    map_pick_location_hint: "انقر على أقرب معلم لمكانك الحالي لتعيين نقطة بداية تقريبية.",
    map_pick_location_saved: "نقطة البداية قرب {name}. الموقع تقريبي وليس GPS.",
    map_pick_location_cancel: "تم إلغاء اختيار نقطة البداية.",
    map_touch_hint: "🌍 اسحب للتنقل • تحكم بالإمالة 3D والبوصلة",
    map_zoom_in: "تكبير",
    map_zoom_out: "تصغير",
    map_fullscreen: "ملء الشاشة",
    map_search_placeholder: "ابحث في الخريطة: مطعم، مسبح، شاطئ، سبا، رقم المعلم...",
    map_quick_landmarks: "وجهات سريعة:",
    nav_rooms: "المسار والغرف",
    nav_dining: "المطاعم",
    nav_shuttle: "الجولف كار",
    nav_concierge: "الكونسيرج",
    nav_my_room_btn: "الملاحة إلى غرفتي",

    // Map Filters
    mf_all: "🌟 الكل",
    mf_open_now: "⚡ مفتوح الآن",
    mf_dine: "🍽️ المطاعم",
    mf_relax: "🏖️ الشاطئ والمسابح",
    mf_wellness: "💆 السبا والأنشطة",
    mf_services: "🛎️ الخدمات والمرافق",
    mf_buildings: "🏢 مباني الغرف",

    // Category Tags
    cat_dine: "🍽️ المطاعم والتغذية",
    cat_relax: "🏖️ الشاطئ والمسابح",
    cat_wellness: "🎾 الرياضة والسبا",
    cat_services: "🛎️ المرافق والخدمات",
    cat_buildings: "🏢 المباني والأجنحة الفندقية",

    // Live Schedule
    schedTitle: "فعاليات وترفيه اليوم (Live Animation & Sports)",
    schedTitleText: "فعاليات وترفيه اليوم (Live Animation & Sports)",
    schedSub: "برنامج ترفيهي ورياضي متجدد على مدار اليوم لجميع أفراد الأسرة.",
    live_now: "مباشر الآن 🟢",
    btn_remind: "🔔 ذكّرني",

    // Directory
    directory_title: "📖 دليل المرافق والمطاعم (Directory & Services)",
    tab_all: "الكل",
    tab_food: "أين آكل؟ (Dine & Indulge)",
    tab_activities: "الشاطئ والمسابح (Explore & Relax)",
    tab_wellness: "الرياضة والسبا (Wellness)",
    tab_services: "المرافق والخدمات (Facilities)",
    tab_buildings: "مباني الغرف (Rooms & Wings)",
    tab_excursions: "رحلات الغردقة (Excursions)",

    // Card Actions
    btn_map: "🗺️ الخريطة",
    btn_menu: "📜 القائمة الرقمية",
    btn_book_table: "🍽️ حجز طاولة",
    btn_details: "ℹ️ التفاصيل",
    btn_book_excursion: "حجز واستفسار فوري 🛥️",
    time_lbl: "⏱️ الموعد:",
    hours_lbl: "⏰ المواعيد:",
    loc_lbl: "📍 الموقع:",
    walkingTime: "دقيقة سيراً",

    // Mobile Navigation
    nav_home: "الرئيسية",
    nav_map: "الخريطة",
    nav_smart_hub: "المساعد",
    nav_services: "الخدمات",
    nav_search_tab: "بحث",
    nav_whatsapp: "واتساب",

    // Common Modals
    modal_close: "إغلاق",
    modal_ok: "حسناً",
    btn_route: "🚀 رسم المسار",
    cartTitle: "سلة طلبات وتناول الطعام بالغرفة",
    cartSub: "خدمة التوصيل السريع لغرفتك",
    cartEmpty: "سلة الطلبات فارغة حالياً.",
    orderNow: "إرسال الطلب للغرفة",
    totalPrice: "الإجمالي",
    view_cart: "🛒 عرض سلة الطلبات",
    btn_add_order: "+ طلب",
    egp_currency: "جنيه",

    // Table Reservation Modal
    booking_modal_title: "حجز طاولة مطعم",
    booking_modal_sub: "تأكيد حجزك الفوري لدى طاقم الضيافة",
    lbl_room_number: "رقم الغرفة:",
    lbl_guest_name: "اسم النزيل الكريم:",
    lbl_guest_count: "عدد الأفراد:",
    lbl_dinner_time: "موعد العشاء:",
    opt_2_guests: "شخصان (2)",
    opt_3_guests: "3 أشخاص",
    opt_4_guests: "4 أشخاص",
    opt_5_guests: "5 أشخاص أو أكثر",
    btn_confirm_table: "تأكيد حجز الطاولة الفوري",
    ph_room_num: "مثلاً: 2015",
    ph_guest_name: "الاسم ثلاثي",
    booking_confirmed_title: "تم تأكيد حجز الطاولة بنجاح! 🍷",
    booking_confirmed_msg: "أهلاً بك، تم تأكيد حجز طاولتك في ({rest}) لغرفة [{room}] في تمام الساعة {time}. طاقم المطعم بانتظاركم.",

    // Guest Services Modal
    srv_modal_title: "خدمات وطلبات الغرف السريعة",
    srv_modal_sub: "طلب بضغطة زر واحدة يصل فوراً لطاقم الإشراف الداخلي",
    srv_lbl_room: "رقم الغرفة المسجل:",
    srv_ph_room: "أدخل رقم غرفتك (مثلاً 2015)...",
    srv_btn_towels: "🏖️ طلب مناشف شاطئ إضافية",
    srv_btn_clean: "🧹 تنظيف وترتيب الغرفة الآن",
    srv_btn_water: "💧 تزويد مياه شرب ومستلزمات شاي",
    srv_btn_pillows: "🛏️ طلب وسائد أو أغطية مريحة",
    srv_free: "متاح مجاناً",
    srv_instant: "فوري",
    srv_available: "متوفر",

    // VIP Hub
    vip_hub_title: "مركز خدمات النزلاء والكونسيرج الفوري (VIP Guest Hub)",
    vip_hub_sub: "طلبات فورية ومباشرة لطاقم الضيافة والغرف 24/7",
    vip_golf_car: "طلب سيارة جولف كار",
    vip_golf_sub: "للتنقل للشاطئ أو اللوبي",
    vip_luggage: "نقل وحمل الحقائب (Bellman)",
    vip_luggage_sub: "عند الوصول أو المغادرة",
    vip_housekeeping: "تنظيف الغرفة (Housekeeping)",
    vip_housekeeping_sub: "تغيير المناشف والمفارش",
    vip_water: "مياه شرب ومستلزمات شاي",
    vip_water_sub: "تزويد مجاني فوري",
    vip_wakeup: "منبه إيقاظ هاتفي",
    vip_wakeup_sub: "إيقاظ صباحي لرحلات الغوص",
    vip_late_co: "تمديد المغادرة (Late Checkout)",
    vip_late_co_sub: "تنسيق مع مكتب الاستقبال",
    vip_order_received: "تم تسجيل طلب:",
    vip_for_room: "للغرفة رقم",
    vip_eta: "الوقت المتوقع للوصول: 10-15 دقيقة",
    vip_step1: "1. تم الاستلام ✓",
    vip_step2: "2. جاري التجهيز ⏳",
    vip_step3: "3. في الطريق لغرفتك",
    vip_btn_wa: "محادثة الاستقبال واتساب 💬",

    // AI Concierge
    ai_chat_title: "الأسئلة الشائعة للمنتجع",
    ai_chat_online: "إجابات محلية محفوظة، تعمل دون اتصال",
    ai_chip_meals: "🍽️ مواعيد الوجبات",
    ai_chip_wifi: "📶 الواي فاي",
    ai_chip_clinic: "🩺 العيادة (15)",
    ai_chip_aqua: "🌊 الأكوا بارك",
    ai_welcome_msg: "👋 قاعدة أسئلة شائعة محلية للمعلومات الأساسية. إذا لم تجد إجابتك، يرجى التواصل مع مكتب الاستقبال.",
    ai_ph_input: "اكتب سؤالك هنا...",
    ai_btn_send: "إرسال",
    ai_fallback_response: "أهلاً بك! فريق الكونسيرج ومكتب الاستقبال متاح دائماً على مدار الساعة لمساعدتك. يمكنك الاتصال فورياً على تحويلة (0) من هاتف غرفتك، أو التوجه لمكتب الاستقبال باللوبي الرئيسي M.",
    request_not_sent_title: "لم يُرسل الطلب",
    request_not_sent: "هذا الدليل غير متصل حالياً بأنظمة الفندق. لم يتم إرسال الطلب أو الحجز؛ يرجى التواصل مع الاستقبال للتأكيد.",

    // AI Itinerary
    itin_title: "مخطط اليوم المخصص بالذكاء الاصطناعي",
    itin_sub: "اختر نمط إقامتك لنصنع لك برنامجاً ترفيهياً متكاملاً",
    itin_lbl_type: "نوع الإقامة والاهتمام:",
    itin_opt_family: "عائلة مع أطفال (Family & Fun)",
    itin_opt_couples: "شهر عسل واسترخاء (Couples & Romance)",
    itin_opt_adventure: "رياضة ومغامرات بحرية وغوص (Adventure & Diving)",
    itin_btn_create: "إنشاء خطة يومي الآن ✨",

    // Compendium
    comp_title: "دليل خدمات المنتجع ونظام الإقامة",
    comp_sub: "Resort Compendium & All-Inclusive Guide",
    comp_ai_title: "🌟 ما يشمله نظام الإقامة الشاملة (All-Inclusive):",
    comp_ai_items: "• وجبات بوفيه مفتوح كامل بمطعم سيرينا الرئيسي.<br>• سناكس ومقبلات ومشروبات مثلجة طوال اليوم ببار الشاطئ.<br>• دخول مجاني غير محدود لأكوا بارك مورينو ومسبح لوتس.<br>• ملاعب التنس، الجيم الرياضي، والميني كلوب للأطفال.",
    comp_ext_title: "📞 أرقام التحويلات الداخلية السريعة:",
    comp_hours_title: "⏰ مواعيد الوصول والمغادرة:",
    comp_hours_items: "• تسجيل الوصول (Check-in): من الساعة 02:00 ظهراً.<br>• تسجيل المغادرة (Check-out): حتى الساعة 12:00 ظهراً.<br>• لطلب مد الإقامة يرجى التنسيق مع الاستقبال الداخلي (0).",

    // Room Pass
    pass_title: "بطاقة النزيل الرقمية (Digital Room Pass)",
    pass_sub: "تصريح الإقامة والدخول الذكي",
    pass_vip_badge: "VIP ALL-INCLUSIVE",
    pass_room_lbl: "رقم الغرفة:",
    pass_guest_lbl: "اسم النزيل:",
    pass_guest_val: "النزيل الكريم (VIP Guest)",
    pass_wifi_lbl: "الواي فاي:",
    pass_pass_lbl: "كلمة المرور:",
    pass_scan_lbl: "امسح لتحديد المسار السريع:",
    pass_share_wa: "📲 مشاركة عبر واتساب",

    // Spa Booking
    spa_title: "حجز جلسات السبا والنادي الصحي الملكي",
    spa_sub: "Moreno Horizon Luxury Spa & Wellness",
    spa_lbl_treatment: "اختر نوع الجلسة العلاجية:",
    spa_lbl_duration: "مدة الجلسة والسعر:",
    spa_lbl_therapist: "تفضيل المعالج:",
    spa_therapist_f: "أخصائية مساج (Female Therapist)",
    spa_therapist_m: "أخصائي مساج (Male Therapist)",
    spa_therapist_any: "أي معالج متاح (First Available)",
    spa_lbl_time: "وقت الموعد المطلوب:",
    spa_lbl_room: "رقم الغرفة:",
    spa_btn_confirm: "تأكيد حجز موعد السبا الفوري ✨",
    spa_confirmed_msg: "تم تأكيد موعد السبا ({treatment}) لغرفة [{room}] الساعة {time} بنجاح! 💆",

    // Qibla & Prayer Times
    prayer_title: "مواقيت الصلاة واتجاه القبلة بالغردقة",
    prayer_sub: "مسجد المنتجع (نقطة 16) متاح لجميع الصلوات",
    prayer_angle_text: "زاوية القبلة من الغردقة: 137° (جنوب شرق)",
    prayer_distance_text: "المسافة إلى مكة المكرمة: حوالي 860 كم",

    // Feedback
    feedback_title: "تقييم مستوى الإقامة والخدمة",
    feedback_sub: "رأيك يصنع الفرق؛ نحن هنا لضمان إقامة مثالية لك",
    fb_clean_lbl: "نظافة المنتجع والغرف:",
    fb_food_lbl: "جودة وتنوع وجبات الطعام:",
    fb_service_lbl: "سرعة ولطف طاقم الضيافة:",
    fb_room_lbl: "رقم الغرفة المسجل:",
    fb_ph_room: "مثلاً: 2015",
    fb_comment_lbl: "ملاحظاتك أو مقترحاتك:",
    fb_ph_comment: "اكتب لنا أي اقتراح أو طلب خاص...",
    fb_btn_submit: "إرسال التقييم للإدارة الفندقية 🌟",
    fb_thank_you: "شكراً لك أستاذنا الكريم! يسعدنا جداً تقييمك الرائع لغرفة [{room}] 🌟",
    fb_apology: "نعتذر عن أي تقصير. تم توجيه تنبيه مباشر لمشرف خدمة النزلاء لغرفة [{room}] لمتابعة طلبك فوراً!",

    // Spotlight
    spotlight_ph: "ابحث عن أي شيء بالمنتجع (مثلاً: بيتزا، مساج، غرفة 2015، واي فاي، سيرينا)...",
    spotlight_hint: "اكتب للبحث الفوري في الخريطة، المطاعم، الأطباق، الفعاليات، وأرقام الغرف...",
    spotlight_heading_pois: "📍 معالم ومرافق المنتجع",
    spotlight_heading_food: "🍽️ قائمة الطعام والمشروبات",
    spotlight_heading_faq: "💡 معلومات وإرشادات سريعة",
    spotlight_no_results: "لم يتم العثور على نتائج لـ",
    spotlight_view: "عرض ➔",

    // Gallery
    gallery_title: "معرض لقطات منتجع مورينو هورايزون",
    gallery_sub: "جولة بصرية في أرجاء المنتجع الفاخر",
    gallery_cap1: "إطلالة جوية بانورامية على الشاطئ والمسبح",
    gallery_cap2: "مطعم لا ماما الإيطالي والمخبوزات",
    gallery_cap3: "النادي الصحي والسبا وجلسات الاسترخاء",
    gallery_cap4: "المخطط الجوي الثلاثي الأبعاد المعتمد",
    gallery_close: "إغلاق المعرض",

    // Tour HUD
    tour_started: "بدأت جولة المنتجع السينمائية الاستكشافية 🎬",
    tour_completed: "اكتملت جولة المنتجع بنجاح! مرحباً بك 🌴",
    tour_next: "التالي ➔",
    tour_finish: "إنهاء الجولة",

    // Smart Guest Experience & Turn-by-Turn Extensions
    "fab_hub_title": "مركز الخدمات الفورية الذكي",
    "fab_my_room": "خذني إلى غرفتي 🏠",
    "fab_shuttle": "طلب جولف كار 🛺",
    "fab_where_am_i": "أين أنا الآن؟ 📍",
    "fab_wifi": "واي فاي المنتجع 📶",
    "fab_whatsapp": "واتساب الاستقبال 💬",
    "save_room_title": "تحديد رقم غرفتك",
    "save_room_sub": "احفظ رقم غرفتك لتتمكن من العودة إليها بنقرة واحدة وطلب الخدمات الفورية",
    "save_room_lbl": "رقم الغرفة:",
    "save_room_ph": "مثال: 1204 أو 2015",
    "save_room_btn": "حفظ وتوجيهي فوراً 🎯",
    "save_room_success": "تم حفظ غرفتك بنجاح! يمكنك الآن الضغط على 'خذني لغرفتي' من أي مكان.",
    "save_room_change": "تغيير رقم الغرفة",
    "shuttle_modal_title": "طلب عربة نقل جولف كار (Resort Shuttle)",
    "shuttle_sub": "خدمة نقل مجانية وسريعة لنقل النزلاء والأمتعة وكبار السن بين أرجاء المنتجع",
    "shuttle_pickup_lbl": "نقطة الركوب (موقعك الحالي):",
    "shuttle_dest_lbl": "الوجهة المطلوبة:",
    "shuttle_passengers_lbl": "عدد الركاب:",
    "shuttle_notes_lbl": "ملاحظات خاصة (كراسي أطفال / حقائب):",
    "shuttle_notes_ph": "اكتب أي ملاحظة للمكتب...",
    "shuttle_req_btn": "طلب العربة الآن 🛺",
    "shuttle_dispatched_title": "تم تأكيد طلب عربة الجولف بنجاح!",
    "shuttle_dispatched_desc": "عربة النقل رقم 3 تحركت في طريقها إليك. الكابتن 'أحمد' سيتواجد خلال دقائق.",
    "shuttle_eta": "الوقت المتوقع للوصول: 3 دقائق",
    "wai_title": "تحديد موقعي في المنتجع (Where Am I?)",
    "wai_sub": "اختر أقرب معلم يدوياً؛ لا يستخدم هذا الخيار GPS أو يحدد موقع الهاتف.",
    "wai_select_lbl": "أنا أقف حالياً بالقرب من:",
    "wai_set_btn": "تأكيد موقعي على الخريطة 📍",
    "wai_my_location_set": "تم اختيار المعلم يدوياً كنقطة انطلاق؛ لم يُحدَّد موقع الهاتف.",
    "wai_nearest_facilities": "أقرب الخدمات المحيطة بك:",
    "wai_near_pool": "أقرب مسبح",
    "wai_near_bar": "أقرب مشروبات",
    "wai_near_wc": "أقرب دورة مياه",
    "wai_near_beach": "الشاطئ والمارينا",
    "wifi_modal_title": "واي فاي المنتجع فائق السرعة (Resort Wi-Fi)",
    "wifi_modal_sub": "شبكة إنترنت مجانية وسريعة تغطي جميع الغرف والمطاعم والشاطئ",
    "wifi_network_name": "اسم الشبكة (SSID):",
    "wifi_password_lbl": "كلمة المرور (Password):",
    "wifi_qr_desc": "امسح رمز QR بكاميرا هاتفك للاتصال المباشر دون كتابة الباسورد",
    "wifi_connected_toast": "تم نسخ كلمة المرور إلى الحافظة!",
    "nav_turn_title": "الملاحة الحية خطوة بخطوة (Live Walk Guide)",
    "nav_step_of": "الخطوة {current} من {total}",
    "nav_step_next": "الخطوة التالية ➔",
    "nav_step_prev": "⬅️ السابقة",
    "nav_step_finish": "إنهاء الملاحة ✓",
    "nav_accessible_label": "مسار ميسر بدون سلالم ♿",
    "nav_start_walk_btn": "ابدأ الملاحة خطوة بخطوة 🚶‍♂️",
    "nav_arrived_title": "🎉 لقد وصلت إلى وجهتك بنجاح!",
    "nav_arrived_desc": "أنت الآن أمام {destination}. نتمنى لك وقتاً ممتعاً!",
    nav_route_start_title: "ابدأ من",
    nav_route_start_instruction: "اتبع خط المسار المرسوم على الممرات حتى نقطة الانعطاف التالية.",
    nav_route_accessibility_notice: "المسار تقريبي؛ يرجى التأكد من خلوه من الدرج مع الاستقبال قبل الانطلاق.",
    nav_route_turn_title: "انعطف {direction} عند الممر",
    nav_route_turn_instruction: "اتبع الممر {direction} حتى الانعطاف التالي.",
    nav_route_left: "يساراً",
    nav_route_right: "يميناً",
    nav_route_arrive_title: "وصلت إلى {destination}",
    nav_route_arrive_instruction: "أنت الآن عند {destination}.",
    "mf_open_now": "⚡ مفتوح الآن",
    "beach_flag_safe": "🟢 راية الشاطئ: هادئ وآمن للسباحة والسنوركلينج",
    "sea_temp_lbl": "حرارة البحر: 26°C",
    "golden_hour_badge": "📸 ساعة الغروب الذهبية تبدأ 05:25 م (أفضل زاوية: المارينا)"
  },

  en: {
    // Brand
    resort_tagline: "SPA & RESORT • HURGHADA",

    // Top Bar
    nav_search: "Search",
    nav_pass: "My Pass",
    nav_qibla: "Qibla",
    nav_feedback: "Feedback",
    nav_beach_mode: "Beach Mode",
    nav_pass_title: "Digital Room Pass",
    nav_qibla_title: "Prayer Times & Qibla Direction",
    nav_feedback_title: "Guest Experience Feedback",
    nav_beach_mode_title: "High-Contrast Outdoor Beach Mode",
    nav_audio_title: "Mute / Unmute Audio FX",
    nav_dark_mode_title: "Toggle Dark / Light Mode",
    nav_lang_title: "Select display language",

    // Status & Clock
    resort_time: "🕒 Hurghada Time:",
    greeting_morning: "Good morning ☀️ Wishing you an extraordinary day",
    greeting_afternoon: "Good afternoon 🏖️ Enjoy the coastal Red Sea breeze",
    greeting_sunset: "Good evening 🌅 Perfect time for a marina stroll",
    greeting_night: "Have a wonderful night 🌙 Enjoy your resort stay",

    // Weather Bar
    wlblTemp: "Hurghada Weather",
    wvalTemp: "—",
    wlblSea: "Red Sea Conditions",
    wvalSea: "—",
    wlblUv: "UV Sun Index",
    wvalUv: "—",
    wlblSunset: "Marina Sunset",
    wvalSunset: "—",
    weather_temperature: "{temp}°C • {condition}",
    weather_wave: "Waves {value} m",
    weather_sea_temp: "Sea surface {value}°C",
    weather_uv: "Today's maximum UV: {value}",
    weather_updated: "Weather updated at {time}",
    weather_cached: "Last saved weather: {time} (stale)",
    weather_unavailable: "Weather data is currently unavailable",
    weather_source_note: "Source: Open-Meteo and DWD. Estimates only; not swimming or navigation advice.",
    weather_clear: "Clear",
    weather_partly_cloudy: "Partly cloudy",
    weather_cloudy: "Cloudy",
    weather_fog: "Fog",
    weather_rain: "Rain",
    weather_storm: "Thunderstorm",

    // Hero Section
    heroBadge: "Smart Guest Guide • 24/7 Excellence",
    heroTitle: "Welcome to Your Coastal Luxury Haven",
    heroSubtitle: "Explore the resort map, facility and dining directory, and find buildings and rooms covered by the available data.",
    wifi_label: "📶 Wi-Fi:",
    btn_copy: "Copy 📋",
    btn_copied: "Copied!",
    heroAiBtn: "Resort FAQs",
    heroTourBtn: "Cinematic Tour",
    heroPromoVideoBtn: "Promo Video",
    nav_promo_video: "Resort Video",
    nav_promo_video_title: "Watch Cinematic Resort Promo Tour",
    heroSpaBtn: "Book Spa",
    heroPassBtn: "Room Pass",
    heroGalleryBtn: "Gallery",
    heroCompendiumBtn: "Hotel Guide",

    // Wayfinder
    wfTitle: "Smart Room & Path Wayfinder 2.0",
    wfTitleText: "Smart Room & Path Wayfinder 2.0",
    wfSubtitle: "Enter your room number for instant building, floor, and map pinpointing.",
    wfSampleLbl: "Sample Rooms:",
    room_placeholder: "Enter room number (e.g. 2015)...",
    wfBtnGo: "Find Room",
    wfBtnDraw: "Route",
    wf_reset_title: "Reset Wayfinder",
    wf_room_found: "✓ Room location identified",
    wf_approx_distance: "⏱️ Approximate Distance:",
    wf_meters: "meters",
    wf_minutes_walk: "min walk via shaded promenade",
    wf_preview_map: "Preview Route on Map 🗺️",
    wf_room_not_found: "Room number is not registered in our current wings. Please contact reception at extension (0).",
    wf_direct_route: "Direct walking route linked to map:",
    wf_from_to: "From",
    wf_to: "To",
    wf_show_route: "Show Route 🗺️",
    wf_select_dest_prompt: "Please select a destination first 🎯",
    wf_your_location: "Your Location",

    // Map Section
    mapTitle: "🗺️ Moreno Horizon Interactive Resort Map",
    mapTitleText: "🗺️ Moreno Horizon Interactive Resort Map",
    mapSub: "Illustrated resort map with a visual tilt effect. Indoor floor maps require verified plans that are not available yet.",
    map_location_reference: "Resort reference point • not your location",
    map_view_2d: "Illustrated 2D map",
    map_view_3d: "Visual tilt effect",
    map_zoom_level: "Zoom level:",
    mapOrbitBtn: "360° Flyover",
    mapTourBtn: "Resort Tour",
    mapResetTxt: "Reset View",
    layer_illustrated: "Resort Map",
    layer_satellite: "Satellite",
    layer_night: "Night Lights",
    map_compass_n: "North",
    map_active_badge_default: "Tap any pin on the map to preview details",
    map_pick_location: "Set approximate location",
    map_pick_location_hint: "Tap the nearest landmark to set an approximate starting point.",
    map_pick_location_saved: "Starting point set near {name}. This is approximate, not GPS.",
    map_pick_location_cancel: "Location selection cancelled.",
    map_touch_hint: "🌍 Drag to pan • Control 3D Tilt & Compass",
    map_zoom_in: "Zoom In",
    map_zoom_out: "Zoom Out",
    map_fullscreen: "Fullscreen",
    map_search_placeholder: "Search map: restaurant, pool, beach, spa, point #...",
    map_quick_landmarks: "Quick Destinations:",
    nav_rooms: "Rooms & Path",
    nav_dining: "Dining",
    nav_shuttle: "Golf Cart",
    nav_concierge: "Concierge",
    nav_my_room_btn: "Navigate to My Room",

    // Map Filters
    mf_all: "🌟 All",
    mf_open_now: "⚡ Open Now",
    mf_dine: "🍽️ Dining",
    mf_relax: "🏖️ Beach & Pools",
    mf_wellness: "🎾 Wellness & Spa",
    mf_services: "🛎️ Facilities",
    mf_buildings: "🏢 Hotel Wings",

    // Category Tags
    cat_dine: "🍽️ Dining & Food",
    cat_relax: "🏖️ Beach & Pools",
    cat_wellness: "🎾 Wellness & Activities",
    cat_services: "🛎️ Guest Facilities & Services",
    cat_buildings: "🏢 Hotel Wings & Rooms",

    // Live Schedule
    schedTitle: "Today's Live Entertainment & Activities",
    schedTitleText: "Today's Live Entertainment & Activities",
    schedSub: "Daily supervised entertainment and sports all day long.",
    live_now: "Live Now 🟢",
    btn_remind: "🔔 Remind Me",

    // Directory
    directory_title: "📖 Resort Directory & Services",
    tab_all: "All",
    tab_food: "Where to Dine (Dine & Indulge)",
    tab_activities: "Beach & Pools (Explore & Relax)",
    tab_wellness: "Wellness & Spa",
    tab_services: "Facilities & Care",
    tab_buildings: "Rooms & Wings",
    tab_excursions: "Excursions",

    // Card Actions
    btn_map: "🗺️ Map",
    btn_menu: "📜 Digital Menu",
    btn_book_table: "🍽️ Book Table",
    btn_details: "ℹ️ Details",
    btn_book_excursion: "Instant Reservation 🛥️",
    time_lbl: "⏱️ Schedule:",
    hours_lbl: "⏰ Hours:",
    loc_lbl: "📍 Location:",
    walkingTime: "min walk",

    // Mobile Navigation
    nav_home: "Home",
    nav_map: "Map",
    nav_smart_hub: "Smart Hub",
    nav_services: "Services",
    nav_search_tab: "Search",
    nav_whatsapp: "WhatsApp",

    // Common Modals
    modal_close: "Close",
    modal_ok: "OK",
    btn_route: "🚀 Draw Route",
    cartTitle: "In-Room Dining Cart",
    cartSub: "Fast room delivery service",
    cartEmpty: "Your cart is currently empty.",
    orderNow: "Place Room Order",
    totalPrice: "Total",
    view_cart: "🛒 View Cart",
    btn_add_order: "+ Order",
    egp_currency: "EGP",

    // Table Reservation Modal
    booking_modal_title: "Restaurant Table Booking",
    booking_modal_sub: "Instant reservation with our hospitality team",
    lbl_room_number: "Room Number:",
    lbl_guest_name: "Guest Full Name:",
    lbl_guest_count: "Number of Guests:",
    lbl_dinner_time: "Dinner Time:",
    opt_2_guests: "2 Guests",
    opt_3_guests: "3 Guests",
    opt_4_guests: "4 Guests",
    opt_5_guests: "5+ Guests",
    btn_confirm_table: "Confirm Table Reservation",
    ph_room_num: "e.g. 2015",
    ph_guest_name: "Full name",
    booking_confirmed_title: "Table Booking Confirmed! 🍷",
    booking_confirmed_msg: "Welcome, your table at ({rest}) for room [{room}] at {time} has been confirmed. Our team looks forward to welcoming you.",

    // Guest Services Modal
    srv_modal_title: "Quick Guest & Room Requests",
    srv_modal_sub: "One-tap requests dispatched directly to housekeeping",
    srv_lbl_room: "Registered Room Number:",
    srv_ph_room: "Enter room number (e.g. 2015)...",
    srv_btn_towels: "🏖️ Request Extra Beach Towels",
    srv_btn_clean: "🧹 Clean & Make Up Room Now",
    srv_btn_water: "💧 Bottled Water & Tea Amenities",
    srv_btn_pillows: "🛏️ Extra Pillows & Blankets",
    srv_free: "Free of charge",
    srv_instant: "Instant",
    srv_available: "Available",

    // VIP Hub
    vip_hub_title: "VIP Guest Hub & Instant Concierge",
    vip_hub_sub: "Instant 24/7 requests directly to hotel staff",
    vip_golf_car: "Request Golf Cart",
    vip_golf_sub: "Shuttle to beach or lobby",
    vip_luggage: "Bellman & Luggage Assistance",
    vip_luggage_sub: "For arrival or departure",
    vip_housekeeping: "Room Housekeeping",
    vip_housekeeping_sub: "Change towels & beddings",
    vip_water: "Bottled Water & Tea Supplies",
    vip_water_sub: "Complimentary replenishment",
    vip_wakeup: "Wake-up Call",
    vip_wakeup_sub: "Morning alarm for diving trips",
    vip_late_co: "Late Checkout Request",
    vip_late_co_sub: "Coordinate with front desk",
    vip_order_received: "Request Logged:",
    vip_for_room: "For Room",
    vip_eta: "Estimated Arrival: 10-15 minutes",
    vip_step1: "1. Received ✓",
    vip_step2: "2. Preparing ⏳",
    vip_step3: "3. On the way to room",
    vip_btn_wa: "Chat with Reception on WhatsApp 💬",

    // AI Concierge
    ai_chat_title: "Resort FAQs",
    ai_chat_online: "Saved local answers, available offline",
    ai_chip_meals: "🍽️ Meal Times",
    ai_chip_wifi: "📶 Wi-Fi Password",
    ai_chip_clinic: "🩺 Clinic (15)",
    ai_chip_aqua: "🌊 Aqua Park Hours",
    ai_welcome_msg: "👋 This local FAQ covers basic resort information. If you cannot find an answer, please contact reception.",
    ai_ph_input: "Type your question here...",
    ai_btn_send: "Send",
    ai_fallback_response: "Welcome! Our 24/7 concierge and front desk team are always delighted to help. Dial (0) from your room phone, or visit the front desk in Lobby M.",
    request_not_sent_title: "Request not sent",
    request_not_sent: "This guide is not connected to hotel systems. Your request or booking was not sent; please contact reception to confirm.",

    // AI Itinerary
    itin_title: "AI Custom Day Itinerary Planner",
    itin_sub: "Choose your travel style to generate a tailored day schedule",
    itin_lbl_type: "Stay Style & Interests:",
    itin_opt_family: "Family with Kids (Family & Fun)",
    itin_opt_couples: "Couples & Relaxation (Romance)",
    itin_opt_adventure: "Adventure & Watersports (Diving)",
    itin_btn_create: "Create My Day Plan ✨",

    // Compendium
    comp_title: "Resort Services & Stay Compendium",
    comp_sub: "Resort Compendium & All-Inclusive Guide",
    comp_ai_title: "🌟 What is included in All-Inclusive:",
    comp_ai_items: "• Full open buffet meals at Sirena Main Restaurant.<br>• Snacks, refreshments, and iced drinks all day at the Beach Bar.<br>• Free unlimited access to Moreno Aqua Park and Lotus Pool.<br>• Tennis courts, fitness gym, and Kids Mini Club.",
    comp_ext_title: "📞 Quick Internal Phone Extensions:",
    comp_hours_title: "⏰ Check-in & Check-out Hours:",
    comp_hours_items: "• Check-in: from 02:00 PM.<br>• Check-out: until 12:00 PM (Noon).<br>• For late check-out requests, please contact reception (0).",

    // Room Pass
    pass_title: "Digital Room Pass (Apple Wallet Style)",
    pass_sub: "Smart Stay & Room Authorization Pass",
    pass_vip_badge: "VIP ALL-INCLUSIVE",
    pass_room_lbl: "Room Number:",
    pass_guest_lbl: "Guest Name:",
    pass_guest_val: "Honored Guest (VIP)",
    pass_wifi_lbl: "Wi-Fi Network:",
    pass_pass_lbl: "Password:",
    pass_scan_lbl: "Scan for quick route guidance:",
    pass_share_wa: "📲 Share via WhatsApp",

    // Spa Booking
    spa_title: "Royal Spa & Wellness Center Booking",
    spa_sub: "Moreno Horizon Luxury Spa & Wellness",
    spa_lbl_treatment: "Select Treatment Type:",
    spa_lbl_duration: "Duration & Price:",
    spa_lbl_therapist: "Therapist Preference:",
    spa_therapist_f: "Female Therapist",
    spa_therapist_m: "Male Therapist",
    spa_therapist_any: "First Available Therapist",
    spa_lbl_time: "Preferred Appointment Time:",
    spa_lbl_room: "Room Number:",
    spa_btn_confirm: "Confirm Spa Appointment ✨",
    spa_confirmed_msg: "Spa appointment ({treatment}) for room [{room}] at {time} has been confirmed! 💆",

    // Qibla & Prayer Times
    prayer_title: "Hurghada Prayer Times & Qibla Compass",
    prayer_sub: "Resort Mosque (Point 16) is open for all prayers",
    prayer_angle_text: "Qibla angle from Hurghada: 137° (South-East)",
    prayer_distance_text: "Distance to Holy Mecca: approx. 860 km",

    // Feedback
    feedback_title: "Guest Satisfaction & Stay Feedback",
    feedback_sub: "Your feedback shapes our excellence; we are here for you",
    fb_clean_lbl: "Resort & Room Cleanliness:",
    fb_food_lbl: "Food Quality & Variety:",
    fb_service_lbl: "Staff Hospitality & Speed:",
    fb_room_lbl: "Registered Room Number:",
    fb_ph_room: "e.g. 2015",
    fb_comment_lbl: "Comments or Suggestions:",
    fb_ph_comment: "Share your experience or special requests with us...",
    fb_btn_submit: "Submit Feedback to Management 🌟",
    fb_thank_you: "Thank you so much! We are delighted by your wonderful review for room [{room}] 🌟",
    fb_apology: "We apologize for any inconvenience. An alert has been dispatched to guest relations for room [{room}] to follow up immediately!",

    // Spotlight
    spotlight_ph: "Search anything in the resort (pizza, massage, room 2015, wifi, Serena)...",
    spotlight_hint: "Type to search map, restaurants, dishes, activities, and room numbers...",
    spotlight_heading_pois: "📍 Resort Landmarks & Facilities",
    spotlight_heading_food: "🍽️ Food & Beverage Menu",
    spotlight_heading_faq: "💡 Quick Tips & Info",
    spotlight_no_results: "No results found for",
    spotlight_view: "View ➔",

    // Gallery
    gallery_title: "Moreno Horizon Resort Gallery",
    gallery_sub: "A visual tour across our coastal sanctuary",
    gallery_cap1: "Panoramic aerial view of beach and main pool",
    gallery_cap2: "La Mama Italian Restaurant and artisanal bakery",
    gallery_cap3: "Wellness Gym & Spa relaxing therapy suites",
    gallery_cap4: "Official verified 3D aerial resort masterplan",
    gallery_close: "Close Gallery",

    // Tour HUD
    tour_started: "Cinematic resort tour started 🎬",
    tour_completed: "Resort tour completed! Welcome to Moreno Horizon 🌴",
    tour_next: "Next ➔",
    tour_finish: "End Tour",

    // Smart Guest Experience & Turn-by-Turn Extensions
    "fab_hub_title": "Smart Guest Quick Hub",
    "fab_my_room": "Take Me to My Room 🏠",
    "fab_shuttle": "Call Golf Cart 🛺",
    "fab_where_am_i": "Where Am I Now? 📍",
    "fab_wifi": "Resort Wi-Fi 📶",
    "fab_whatsapp": "Reception WhatsApp 💬",
    "save_room_title": "Set Your Room Number",
    "save_room_sub": "Save your room number once to get 1-tap navigation back and quick services",
    "save_room_lbl": "Room Number:",
    "save_room_ph": "e.g., 1204 or 2015",
    "save_room_btn": "Save & Guide Me Now 🎯",
    "save_room_success": "Room saved successfully! You can now tap 'Take Me to My Room' anytime.",
    "save_room_change": "Change Room Number",
    "shuttle_modal_title": "Request Golf Cart Shuttle",
    "shuttle_sub": "Complimentary resort shuttle service for guests, luggage, and accessibility",
    "shuttle_pickup_lbl": "Pickup Point (Your Location):",
    "shuttle_dest_lbl": "Drop-off Destination:",
    "shuttle_passengers_lbl": "Number of Guests:",
    "shuttle_notes_lbl": "Special Notes (Luggage / Stroller):",
    "shuttle_notes_ph": "Any special instructions...",
    "shuttle_req_btn": "Request Shuttle Now 🛺",
    "shuttle_dispatched_title": "Golf Cart Shuttle Confirmed!",
    "shuttle_dispatched_desc": "Shuttle Cart #3 has been dispatched. Driver 'Ahmed' will arrive shortly.",
    "shuttle_eta": "Estimated Arrival: 3 Minutes",
    "wai_title": "Pin My Location (Where Am I?)",
    "wai_sub": "Choose a nearby landmark manually; this does not use GPS or locate your phone.",
    "wai_select_lbl": "I am currently standing near:",
    "wai_set_btn": "Set My Position on Map 📍",
    "wai_my_location_set": "Landmark selected manually as the starting point; your phone location was not detected.",
    "wai_nearest_facilities": "Nearest Amenities to You:",
    "wai_near_pool": "Nearest Pool",
    "wai_near_bar": "Nearest Bar / Drink",
    "wai_near_wc": "Nearest Restroom",
    "wai_near_beach": "Beach & Pier",
    "wifi_modal_title": "High-Speed Resort Wi-Fi",
    "wifi_modal_sub": "Complimentary high-speed internet across all rooms, restaurants, and the beach",
    "wifi_network_name": "Network Name (SSID):",
    "wifi_password_lbl": "Password:",
    "wifi_qr_desc": "Scan the QR code with your mobile camera to connect instantly",
    "wifi_connected_toast": "Wi-Fi password copied to clipboard!",
    "nav_turn_title": "Live Turn-by-Turn Walk Guide",
    "nav_step_of": "Step {current} of {total}",
    "nav_step_next": "Next Step ➔",
    "nav_step_prev": "⬅️ Previous",
    "nav_step_finish": "Finish Walk ✓",
    "nav_accessible_label": "Step-Free Accessible Route ♿",
    "nav_start_walk_btn": "Start Walk Guide 🚶‍♂️",
    "nav_arrived_title": "🎉 You have arrived at your destination!",
    "nav_arrived_desc": "You are now at {destination}. Enjoy your time!",
    nav_route_start_title: "Start from",
    nav_route_start_instruction: "Follow the route drawn along the walkways to the next turn.",
    nav_route_accessibility_notice: "This route is approximate. Confirm it is step-free with reception before setting off.",
    nav_route_turn_title: "Turn {direction} at the walkway",
    nav_route_turn_instruction: "Follow the walkway {direction} to the next turn.",
    nav_route_left: "left",
    nav_route_right: "right",
    nav_route_arrive_title: "Arrive at {destination}",
    nav_route_arrive_instruction: "You are now at {destination}.",
    "mf_open_now": "⚡ Open Now",
    "beach_flag_safe": "🟢 Beach Flag: Safe for Swimming & Snorkeling",
    "sea_temp_lbl": "Sea Temp: 26°C",
    "golden_hour_badge": "📸 Golden Hour Sunset starts at 05:25 PM (Best view: Marina Pier)"
  },

  ru: {
    // Brand
    resort_tagline: "СПА И КУРОРТ • ХУРГАДА",

    // Top Bar
    nav_search: "Поиск",
    nav_pass: "Мой пропуск",
    nav_qibla: "Кибла",
    nav_feedback: "Отзыв",
    nav_beach_mode: "Пляжный режим",
    nav_pass_title: "Электронный ключ-пропуск",
    nav_qibla_title: "Время молитвы и направление Киблы",
    nav_feedback_title: "Оценка качества отдыха",
    nav_beach_mode_title: "Контрастный режим для яркого солнца",
    nav_audio_title: "Звуковые эффекты",
    nav_dark_mode_title: "Переключить темную / светлую тему",
    nav_lang_title: "Выбор языка интерфейса",

    // Status & Clock
    resort_time: "🕒 Время в Хургаде:",
    greeting_morning: "Доброе утро ☀️ Желаем вам прекрасного дня",
    greeting_afternoon: "Добрый день 🏖️ Наслаждайтесь бризом Красного моря",
    greeting_sunset: "Добрый вечер 🌅 Идеальное время для прогулки у марины",
    greeting_night: "Приятного вечера и спокойной ночи 🌙 Отдыхайте с комфортом",

    // Weather Bar
    wlblTemp: "Погода в Хургаде",
    wvalTemp: "—",
    wlblSea: "Красное море",
    wvalSea: "—",
    wlblUv: "УФ-индекс солнца",
    wvalUv: "—",
    wlblSunset: "Закат в марине",
    wvalSunset: "—",
    weather_temperature: "{temp}°C • {condition}",
    weather_wave: "Волны {value} м",
    weather_sea_temp: "Температура моря {value}°C",
    weather_uv: "Максимальный УФ-индекс сегодня: {value}",
    weather_updated: "Погода обновлена в {time}",
    weather_cached: "Последние сохранённые данные: {time} (устарели)",
    weather_unavailable: "Данные о погоде сейчас недоступны",
    weather_source_note: "Источник: Open-Meteo и DWD. Прогноз приблизительный; не является рекомендацией для купания или навигации.",
    weather_clear: "Ясно",
    weather_partly_cloudy: "Переменная облачность",
    weather_cloudy: "Облачно",
    weather_fog: "Туман",
    weather_rain: "Дождь",
    weather_storm: "Гроза",

    // Hero Section
    heroBadge: "Интерактивный путеводитель 24/7",
    heroTitle: "Добро пожаловать в роскошный оазис",
    heroSubtitle: "Изучите карту курорта, справочник заведений и доступные данные о зданиях и номерах.",
    wifi_label: "📶 Wi-Fi:",
    btn_copy: "Копировать 📋",
    btn_copied: "Скопировано!",
    heroAiBtn: "Вопросы об отеле",
    heroTourBtn: "3D-Тур",
    heroPromoVideoBtn: "Промо-видео",
    nav_promo_video: "Видео отеля",
    nav_promo_video_title: "Смотреть промо-видео курорта",
    heroSpaBtn: "Заказ СПА",
    heroPassBtn: "Ключ-карта",
    heroGalleryBtn: "Галерея",
    heroCompendiumBtn: "Гид по отелю",

    // Wayfinder
    wfTitle: "Умная навигация 2.0 (Поиск номера)",
    wfTitleText: "Умная навигация 2.0 (Поиск номера)",
    wfSubtitle: "Введите номер комнаты для отображения корпуса, этажа и маршрута на карте.",
    wfSampleLbl: "Примеры:",
    room_placeholder: "Номер комнаты (напр. 2015)...",
    wfBtnGo: "Найти",
    wfBtnDraw: "Маршрут",
    wf_reset_title: "Сброс навигации",
    wf_room_found: "✓ Номер найден",
    wf_approx_distance: "⏱️ Примерное расстояние:",
    wf_meters: "метров",
    wf_minutes_walk: "мин пешком по тенистой аллее",
    wf_preview_map: "Показать маршрут на карте 🗺️",
    wf_room_not_found: "Номер не найден в текущих корпусах отеля. Обратитесь на ресепшн (внутр. 0).",
    wf_direct_route: "Прямой пешеходный маршрут:",
    wf_from_to: "От",
    wf_to: "До",
    wf_show_route: "Показать маршрут 🗺️",
    wf_select_dest_prompt: "Сначала выберите пункт назначения 🎯",
    wf_your_location: "Ваше местоположение",

    // Map Section
    mapTitle: "🗺️ Интерактивная карта курорта",
    mapTitleText: "🗺️ Интерактивная карта курорта",
    mapSub: "Схематичная карта с визуальным наклоном. Для карт этажей нужны проверенные планы, которых пока нет.",
    map_location_reference: "Ориентир курорта • не ваше местоположение",
    map_view_2d: "Схематичная карта 2D",
    map_view_3d: "Визуальный наклон",
    map_zoom_level: "Масштаб:",
    mapOrbitBtn: "Облет 360°",
    mapTourBtn: "Тур",
    mapResetTxt: "Сброс",
    map_compass_n: "Север",
    map_active_badge_default: "Нажмите на объект на карте для просмотра деталей",
    map_pick_location: "Указать примерное место",
    map_pick_location_hint: "Нажмите на ближайший объект, чтобы указать примерную начальную точку.",
    map_pick_location_saved: "Начальная точка рядом с «{name}». Это примерное место, не GPS.",
    map_pick_location_cancel: "Выбор начальной точки отменён.",
    map_touch_hint: "🌍 Перетаскивайте для перемещения • 3D наклон и компас",
    map_zoom_in: "Приблизить",
    layer_illustrated: "Карта курорта",
    layer_satellite: "Спутник",
    layer_night: "Ночной вид",
    map_zoom_out: "Отдалить",
    map_fullscreen: "Полный экран",
    map_search_placeholder: "Поиск на карте: ресторан, бассейн, пляж, спа, номер...",
    map_quick_landmarks: "Быстрые локации:",
    nav_rooms: "Номера и путь",
    nav_dining: "Рестораны",
    nav_shuttle: "Гольф-кар",
    nav_concierge: "Консьерж",
    nav_my_room_btn: "Маршрут к номеру",

    // Map Filters
    mf_all: "🌟 Все",
    mf_open_now: "⚡ Открыто сейчас",
    mf_dine: "🍽️ Рестораны",
    mf_relax: "🏖️ Пляж и бассейны",
    mf_wellness: "🎾 СПА и спорт",
    mf_services: "🛎️ Услуги",
    mf_buildings: "🏢 Корпуса",

    // Category Tags
    cat_dine: "🍽️ Рестораны и бары",
    cat_relax: "🏖️ Пляж и бассейны",
    cat_wellness: "🎾 Спорт и СПА",
    cat_services: "🛎️ Услуги и сервис",
    cat_buildings: "🏢 Жилые корпуса и номера",

    // Live Schedule
    schedTitle: "Программа анимации и спорта",
    schedTitleText: "Программа анимации и спорта",
    schedSub: "Дневные и вечерние спортивно-развлекательные мероприятия на каждый день.",
    live_now: "Сейчас идет 🟢",
    btn_remind: "🔔 Напомнить",

    // Directory
    directory_title: "📖 Справочник отеля и рестораны",
    tab_all: "Все",
    tab_food: "Рестораны (Dine & Indulge)",
    tab_activities: "Пляж и бассейны (Explore & Relax)",
    tab_wellness: "СПА и спорт (Wellness)",
    tab_services: "Услуги (Facilities)",
    tab_buildings: "Корпуса и номера",
    tab_excursions: "Экскурсии (Excursions)",

    // Card Actions
    btn_map: "🗺️ На карте",
    btn_menu: "📜 Меню",
    btn_book_table: "🍽️ Заказать столик",
    btn_details: "ℹ️ Подробнее",
    btn_book_excursion: "Забронировать экскурсию 🛥️",
    time_lbl: "⏱️ Время:",
    hours_lbl: "⏰ Часы работы:",
    loc_lbl: "📍 Расположение:",
    walkingTime: "мин пешком",

    // Mobile Navigation
    nav_home: "Главная",
    nav_map: "Карта",
    nav_smart_hub: "Хаб",
    nav_services: "Услуги",
    nav_search_tab: "Поиск",
    nav_whatsapp: "WhatsApp",

    // Common Modals
    modal_close: "Закрыть",
    modal_ok: "Понятно",
    btn_route: "🚀 Маршрут",
    cartTitle: "Заказ еды и напитков в номер",
    cartSub: "Быстрая доставка прямо в ваш номер",
    cartEmpty: "Корзина пуста.",
    orderNow: "Оформить заказ",
    totalPrice: "Итого",
    view_cart: "🛒 Открыть корзину",
    btn_add_order: "+ Заказ",
    egp_currency: "EGP",

    // Table Reservation Modal
    booking_modal_title: "Бронирование столика в ресторане",
    booking_modal_sub: "Моментальное подтверждение службой сервиса",
    lbl_room_number: "Номер комнаты:",
    lbl_guest_name: "Имя гостя:",
    lbl_guest_count: "Количество персон:",
    lbl_dinner_time: "Время ужина:",
    opt_2_guests: "2 персоны",
    opt_3_guests: "3 персоны",
    opt_4_guests: "4 персоны",
    opt_5_guests: "5+ персон",
    btn_confirm_table: "Подтвердить бронирование столика",
    ph_room_num: "напр. 2015",
    ph_guest_name: "ФИО гостя",
    booking_confirmed_title: "Столик успешно забронирован! 🍷",
    booking_confirmed_msg: "Добро пожаловать! Ваш столик в ({rest}) для номера [{room}] на {time} подтвержден. Ждем вас!",

    // Guest Services Modal
    srv_modal_title: "Быстрый вызов службы номеров",
    srv_modal_sub: "Запрос в одно касание моментально поступает горничным",
    srv_lbl_room: "Зарегистрированный номер комнаты:",
    srv_ph_room: "Введите номер комнаты (напр. 2015)...",
    srv_btn_towels: "🏖️ Дополнительные пляжные полотенца",
    srv_btn_clean: "🧹 Уборка номера прямо сейчас",
    srv_btn_water: "💧 Питьевая вода, чай и сахар",
    srv_btn_pillows: "🛏️ Дополнительные подушки или одеяла",
    srv_free: "Бесплатно",
    srv_instant: "Срочно",
    srv_available: "В наличии",

    // VIP Hub
    vip_hub_title: "VIP-центр услуг и консьерж-сервис",
    vip_hub_sub: "Прямые запросы персоналу курорта 24/7",
    vip_golf_car: "Вызов гольф-кара",
    vip_golf_sub: "Поездка на пляж или в лобби",
    vip_luggage: "Помощь с багажом (Bellman)",
    vip_luggage_sub: "При заезде или выезде",
    vip_housekeeping: "Уборка номера (Housekeeping)",
    vip_housekeeping_sub: "Смена белья и полотенец",
    vip_water: "Вода и чайные наборы",
    vip_water_sub: "Бесплатное пополнение",
    vip_wakeup: "Звонок-будильник",
    vip_wakeup_sub: "Утренний подъем на экскурсии",
    vip_late_co: "Поздний выезд (Late Checkout)",
    vip_late_co_sub: "Согласование со стойкой регистрации",
    vip_order_received: "Запрос принят:",
    vip_for_room: "Для комнаты",
    vip_eta: "Ожидаемое время: 10-15 минут",
    vip_step1: "1. Принят ✓",
    vip_step2: "2. Выполняется ⏳",
    vip_step3: "3. В пути к номеру",
    vip_btn_wa: "Чат с ресепшн в WhatsApp 💬",

    // AI Concierge
    ai_chat_title: "Частые вопросы об отеле",
    ai_chat_online: "Сохранённые ответы работают офлайн",
    ai_chip_meals: "🍽️ Расписание питания",
    ai_chip_wifi: "📶 Пароль Wi-Fi",
    ai_chip_clinic: "🩺 Клиника и аптека (15)",
    ai_chip_aqua: "🌊 Часы аквапарка",
    ai_welcome_msg: "👋 Эта локальная база содержит основную информацию об отеле. Если ответа нет, обратитесь на ресепшен.",
    ai_ph_input: "Напишите ваш вопрос здесь...",
    ai_btn_send: "Отправить",
    ai_fallback_response: "Служба консьержа и ресепшн работают круглосуточно. Наберите (0) со своего гостиничного телефона или обратитесь на ресепшн в главном лобби M.",
    request_not_sent_title: "Запрос не отправлен",
    request_not_sent: "Приложение не подключено к системам отеля. Запрос или бронирование не отправлены; свяжитесь с ресепшен для подтверждения.",

    // AI Itinerary
    itin_title: "ИИ-Планировщик идеального дня",
    itin_sub: "Выберите стиль отдыха для составления персональной программы",
    itin_lbl_type: "Тип отдыха и предпочтения:",
    itin_opt_family: "Семья с детьми (Family & Fun)",
    itin_opt_couples: "Романтический отдых (Couples & Romance)",
    itin_opt_adventure: "Спорт, приключения и дайвинг (Adventure)",
    itin_btn_create: "Составить план на день ✨",

    // Compendium
    comp_title: "Справочник услуг и правила проживания",
    comp_sub: "Resort Compendium & All-Inclusive Guide",
    comp_ai_title: "🌟 Что входит в систему All-Inclusive:",
    comp_ai_items: "• Трехразовый «шведский стол» в главном ресторане Sirena.<br>• Закуски, десерты и прохладительные напитки в течение дня в Beach Bar.<br>• Бесплатный доступ в аквапарк Moreno и центральный бассейн Lotus.<br>• Теннисные корты, тренажерный зал и детский клуб.",
    comp_ext_title: "📞 Внутренние телефонные номера:",
    comp_hours_title: "⏰ Время заезда и выезда:",
    comp_hours_items: "• Время заезда (Check-in): с 14:00.<br>• Время выезда (Check-out): до 12:00.<br>• Для продления номера обратитесь на ресепшн (0).",

    // Room Pass
    pass_title: "Электронная ключ-карта гостя",
    pass_sub: "Электронный пропуск и удостоверение гостя",
    pass_vip_badge: "VIP ALL-INCLUSIVE",
    pass_room_lbl: "Номер комнаты:",
    pass_guest_lbl: "Имя гостя:",
    pass_guest_val: "Уважаемый гость (VIP)",
    pass_wifi_lbl: "Сеть Wi-Fi:",
    pass_pass_lbl: "Пароль:",
    pass_scan_lbl: "Отсканируйте для навигации:",
    pass_share_wa: "📲 Отправить в WhatsApp",

    // Spa Booking
    spa_title: "Запись на процедуры в Королевский СПА",
    spa_sub: "Moreno Horizon Luxury Spa & Wellness",
    spa_lbl_treatment: "Выберите процедуру:",
    spa_lbl_duration: "Длительность и стоимость:",
    spa_lbl_therapist: "Предпочтение специалиста:",
    spa_therapist_f: "Массажист-женщина",
    spa_therapist_m: "Массажист-мужчина",
    spa_therapist_any: "Первый свободный мастер",
    spa_lbl_time: "Желаемое время:",
    spa_lbl_room: "Номер комнаты:",
    spa_btn_confirm: "Подтвердить запись в СПА ✨",
    spa_confirmed_msg: "Запись в СПА ({treatment}) для комнаты [{room}] на {time} успешно оформлена! 💆",

    // Qibla & Prayer Times
    prayer_title: "Время молитв и направление Киблы",
    prayer_sub: "Мечеть отеля (объект 16) открыта для всех молитв",
    prayer_angle_text: "Направление Киблы из Хургады: 137° (юго-восток)",
    prayer_distance_text: "Расстояние до Мекки: около 860 км",

    // Feedback
    feedback_title: "Оценка качества обслуживания",
    feedback_sub: "Ваше мнение помогает нам становиться лучше",
    fb_clean_lbl: "Чистота отеля и номеров:",
    fb_food_lbl: "Качество и разнообразие питания:",
    fb_service_lbl: "Внимательность и скорость персонала:",
    fb_room_lbl: "Номер комнаты:",
    fb_ph_room: "напр. 2015",
    fb_comment_lbl: "Ваши пожелания и предложения:",
    fb_ph_comment: "Напишите ваши впечатления или просьбы...",
    fb_btn_submit: "Отправить отзыв руководству 🌟",
    fb_thank_you: "Большое спасибо! Нам очень приятно получить вашу высокую оценку номера [{room}] 🌟",
    fb_apology: "Приносим искренние извинения. Администратор службы сервиса уже уведомлен по номеру [{room}] для немедленного решения вопроса!",

    // Spotlight
    spotlight_ph: "Поиск по курорту (пицца, массаж, комната 2015, wifi, Serena)...",
    spotlight_hint: "Ищите по карте, блюдам меню, развлечениям и номерам комнат...",
    spotlight_heading_pois: "📍 Объекты и инфраструктура курорта",
    spotlight_heading_food: "🍽️ Меню еды и напитков",
    spotlight_heading_faq: "💡 Полезная информация и советы",
    spotlight_no_results: "Ничего не найдено по запросу",
    spotlight_view: "Открыть ➔",

    // Gallery
    gallery_title: "Фотогалерея Moreno Horizon Resort",
    gallery_sub: "Визуальная прогулка по курортному комплексу",
    gallery_cap1: "Панорамный вид с высоты птичьего полета на пляж и бассейн",
    gallery_cap2: "Итальянский ресторан La Mama и свежая выпечка",
    gallery_cap3: "Оздоровительный СПА-центр и зоны релаксации",
    gallery_cap4: "Официальный 3D-план территории отеля",
    gallery_close: "Закрыть галерею",

    // Tour HUD
    tour_started: "Начался 3D-тур по территории отеля 🎬",
    tour_completed: "Тур завершен! Приятного отдыха в Moreno Horizon 🌴",
    tour_next: "Далее ➔",
    tour_finish: "Завершить тур",

    // Smart Guest Experience & Turn-by-Turn Extensions
    "fab_hub_title": "Центр быстрых услуг для гостей",
    "fab_my_room": "В мой номер 🏠",
    "fab_shuttle": "Вызвать гольф-кар 🛺",
    "fab_where_am_i": "Где я сейчас? 📍",
    "fab_wifi": "Wi-Fi курорта 📶",
    "fab_whatsapp": "WhatsApp ресепшн 💬",
    "save_room_title": "Укажите номер вашей комнаты",
    "save_room_sub": "Сохраните номер комнаты для быстрого возвращения в 1 клик и заказа услуг",
    "save_room_lbl": "Номер комнаты:",
    "save_room_ph": "например, 1204 или 2015",
    "save_room_btn": "Сохранить и проложить маршрут 🎯",
    "save_room_success": "Номер комнаты успешно сохранен! Нажимайте 'В мой номер' в любое время.",
    "save_room_change": "Изменить номер комнаты",
    "shuttle_modal_title": "Вызов трансфера на гольф-каре",
    "shuttle_sub": "Бесплатная доставка гостей, багажа и гостей с колясками по территории курорта",
    "shuttle_pickup_lbl": "Место посадки (где вы находитесь):",
    "shuttle_dest_lbl": "Куда доставить:",
    "shuttle_passengers_lbl": "Количество гостей:",
    "shuttle_notes_lbl": "Примечания (багаж / коляска):",
    "shuttle_notes_ph": "Дополнительные пожелания...",
    "shuttle_req_btn": "Вызвать гольф-кар 🛺",
    "shuttle_dispatched_title": "Трансфер на гольф-каре подтвержден!",
    "shuttle_dispatched_desc": "Гольф-кар №3 отправлен. Водитель 'Ахмед' прибудет через несколько минут.",
    "shuttle_eta": "Ожидаемое время прибытия: 3 минуты",
    "wai_title": "Где я сейчас? (Отметить локацию)",
    "wai_sub": "Выберите ориентир вручную; GPS и местоположение телефона не используются.",
    "wai_select_lbl": "Я сейчас нахожусь около:",
    "wai_set_btn": "Отметить на карте 📍",
    "wai_my_location_set": "Ориентир вручную выбран как начальная точка; местоположение телефона не определялось.",
    "wai_nearest_facilities": "Ближайшие удобства рядом с вами:",
    "wai_near_pool": "Ближайший бассейн",
    "wai_near_bar": "Ближайший бар",
    "wai_near_wc": "Ближайший туалет",
    "wai_near_beach": "Пляж и пирс",
    "wifi_modal_title": "Скоростной Wi-Fi курорта",
    "wifi_modal_sub": "Бесплатный высокоскоростной интернет в номерах, ресторанах и на пляже",
    "wifi_network_name": "Имя сети (SSID):",
    "wifi_password_lbl": "Пароль:",
    "wifi_qr_desc": "Отсканируйте QR-код камерой телефона для мгновенного подключения",
    "wifi_connected_toast": "Пароль от Wi-Fi скопирован в буфер обмена!",
    "nav_turn_title": "Пошаговая живая навигация",
    "nav_step_of": "Шаг {current} из {total}",
    "nav_step_next": "Следующий шаг ➔",
    "nav_step_prev": "⬅️ Предыдущий",
    "nav_step_finish": "Завершить маршрут ✓",
    "nav_accessible_label": "Маршрут без ступеней (доступный) ♿",
    "nav_start_walk_btn": "Начать пошаговый гид 🚶‍♂️",
    "nav_arrived_title": "🎉 Вы прибыли в пункт назначения!",
    "nav_arrived_desc": "Вы находитесь около {destination}. Приятного отдыха!",
    nav_route_start_title: "Начните от точки",
    nav_route_start_instruction: "Следуйте по маршруту вдоль дорожек до следующего поворота.",
    nav_route_accessibility_notice: "Маршрут примерный. Перед выходом уточните на ресепшене, есть ли на нём ступени.",
    nav_route_turn_title: "Поверните {direction} на дорожке",
    nav_route_turn_instruction: "Следуйте по дорожке {direction} до следующего поворота.",
    nav_route_left: "налево",
    nav_route_right: "направо",
    nav_route_arrive_title: "Вы прибыли: {destination}",
    nav_route_arrive_instruction: "Вы находитесь у объекта «{destination}».",
    "mf_open_now": "⚡ Открыто сейчас",
    "beach_flag_safe": "🟢 Флаг на пляже: Безопасно для купания и снорклинга",
    "sea_temp_lbl": "Температура моря: 26°C",
    "golden_hour_badge": "📸 Золотой час заката начинается в 17:25 (Лучший вид: Пирс марины)"
  },

  de: {
    // Brand
    resort_tagline: "SPA & RESORT • HURGHADA",

    // Top Bar
    nav_search: "Suche",
    nav_pass: "Mein Pass",
    nav_qibla: "Qibla",
    nav_feedback: "Bewertung",
    nav_beach_mode: "Strandmodus",
    nav_pass_title: "Digitaler Zimmerpass",
    nav_qibla_title: "Gebetszeiten & Gebetsrichtung",
    nav_feedback_title: "Gästezufriedenheit & Feedback",
    nav_beach_mode_title: "Kontrastreicher Sonnen-Strandmodus",
    nav_audio_title: "Soundeffekte ein/ausschalten",
    nav_dark_mode_title: "Dunkel-/Hellmodus umschalten",
    nav_lang_title: "Sprache auswählen",

    // Status & Clock
    resort_time: "🕒 Hurghada Zeit:",
    greeting_morning: "Guten Morgen ☀️ Wir wünschen Ihnen einen traumhaften Tag",
    greeting_afternoon: "Guten Tag 🏖️ Genießen Sie die Meeresbrise des Roten Meeres",
    greeting_sunset: "Guten Abend 🌅 Perfekte Zeit für einen Spaziergang an der Marina",
    greeting_night: "Angenehmen Abend und gute Nacht 🌙 Genießen Sie Ihren Aufenthalt",

    // Weather Bar
    wlblTemp: "Hurghada Wetter",
    wvalTemp: "—",
    wlblSea: "Rotes Meer",
    wvalSea: "—",
    wlblUv: "UV-Sonnenindex",
    wvalUv: "—",
    wlblSunset: "Sonnenuntergang",
    wvalSunset: "—",
    weather_temperature: "{temp}°C • {condition}",
    weather_wave: "Wellen {value} m",
    weather_sea_temp: "Meerestemperatur {value}°C",
    weather_uv: "UV-Höchstwert heute: {value}",
    weather_updated: "Wetter aktualisiert um {time}",
    weather_cached: "Zuletzt gespeicherte Wetterdaten: {time} (veraltet)",
    weather_unavailable: "Wetterdaten sind derzeit nicht verfügbar",
    weather_source_note: "Quelle: Open-Meteo und DWD. Schätzwerte; keine Bade- oder Navigationshinweise.",
    weather_clear: "Klar",
    weather_partly_cloudy: "Teilweise bewölkt",
    weather_cloudy: "Bewölkt",
    weather_fog: "Nebel",
    weather_rain: "Regen",
    weather_storm: "Gewitter",

    // Hero Section
    heroBadge: "Smarter Gästeführer • 24/7 Luxusservice",
    heroTitle: "Willkommen in Ihrem Küstenparadies",
    heroSubtitle: "Entdecken Sie den Resortplan, das Verzeichnis von Einrichtungen und Restaurants sowie verfügbare Gebäude- und Zimmerdaten.",
    wifi_label: "📶 WLAN:",
    btn_copy: "Kopieren 📋",
    btn_copied: "Kopiert!",
    heroAiBtn: "Hotel-FAQ",
    heroTourBtn: "3D-Rundgang",
    heroPromoVideoBtn: "Promo-Video",
    nav_promo_video: "Hotelvideo",
    nav_promo_video_title: "Cinematic Promo-Video ansehen",
    heroSpaBtn: "Spa buchen",
    heroPassBtn: "Zimmerkarte",
    heroGalleryBtn: "Galerie",
    heroCompendiumBtn: "Hotel-ABC",

    // Wayfinder
    wfTitle: "Smarte Zimmer- & Wege-Navigation 2.0",
    wfTitleText: "Smarte Zimmer- & Wege-Navigation 2.0",
    wfSubtitle: "Geben Sie Ihre Zimmernummer ein für Flügel, Etage und Kartenansicht.",
    wfSampleLbl: "Beispiele:",
    room_placeholder: "Zimmernummer (z.B. 2015)...",
    wfBtnGo: "Finden",
    wfBtnDraw: "Route",
    wf_reset_title: "Navigation zurücksetzen",
    wf_room_found: "✓ Zimmerstandort ermittelt",
    wf_approx_distance: "⏱️ Ungefähre Entfernung:",
    wf_meters: "Meter",
    wf_minutes_walk: "Minuten Fußweg über schattige Promenade",
    wf_preview_map: "Route auf Karte anzeigen 🗺️",
    wf_room_not_found: "Zimmernummer nicht in aktuellen Gebäudeflügeln gefunden. Bitte Rezeption kontaktieren (App. 0).",
    wf_direct_route: "Direkter Fußweg auf der Karte:",
    wf_from_to: "Von",
    wf_to: "Nach",
    wf_show_route: "Route anzeigen 🗺️",
    wf_select_dest_prompt: "Bitte wählen Sie zuerst ein Ziel 🎯",
    wf_your_location: "Ihr Standort",

    // Map Section
    mapTitle: "🗺️ Interaktiver Resortplan",
    mapTitleText: "🗺️ Interaktiver Resortplan",
    mapSub: "Schematischer Resortplan mit visueller Neigung. Etagenpläne benötigen geprüfte Gebäudepläne, die derzeit fehlen.",
    map_location_reference: "Resort-Referenzpunkt • nicht Ihr Standort",
    map_view_2d: "Schematischer 2D-Plan",
    map_view_3d: "Visueller Neigungseffekt",
    map_zoom_level: "Zoomstufe:",
    mapOrbitBtn: "360° Rundflug",
    mapTourBtn: "Tour",
    mapResetTxt: "Zurücksetzen",
    map_compass_n: "Nord",
    map_active_badge_default: "Tippen Sie auf einen Punkt auf der Karte für Details",
    map_pick_location: "Ungefähren Standort festlegen",
    map_pick_location_hint: "Tippen Sie auf den nächsten Orientierungspunkt, um einen ungefähren Startpunkt festzulegen.",
    map_pick_location_saved: "Startpunkt nahe {name} gesetzt. Dies ist eine Näherung, kein GPS.",
    map_pick_location_cancel: "Standortauswahl abgebrochen.",
    map_touch_hint: "🌍 Zum Bewegen ziehen • 3D Neigung & Kompass",
    map_zoom_in: "Vergrößern",
    layer_illustrated: "Resort-Karte",
    layer_satellite: "Satellit",
    layer_night: "Nachtansicht",
    map_zoom_out: "Verkleinern",
    map_fullscreen: "Vollbild",
    map_search_placeholder: "Karte durchsuchen: Restaurant, Pool, Strand, Spa, Punkt #...",
    map_quick_landmarks: "Schnellziele:",
    nav_rooms: "Zimmer & Route",
    nav_dining: "Restaurants",
    nav_shuttle: "Golf-Cart",
    nav_concierge: "Concierge",
    nav_my_room_btn: "Route zu meinem Zimmer",

    // Map Filters
    mf_all: "🌟 Alle",
    mf_open_now: "⚡ Jetzt geöffnet",
    mf_dine: "🍽️ Restaurants",
    mf_relax: "🏖️ Strand & Pools",
    mf_wellness: "🎾 Wellness & Sport",
    mf_services: "🛎️ Einrichtungen",
    mf_buildings: "🏢 Hotelgebäude",

    // Category Tags
    cat_dine: "🍽️ Restaurants & Speisen",
    cat_relax: "🏖️ Strand & Pools",
    cat_wellness: "🎾 Wellness & Sport",
    cat_services: "🛎️ Gästeservice & Einrichtungen",
    cat_buildings: "🏢 Hotelgebäude & Zimmer",

    // Live Schedule
    schedTitle: "Heutiges Animations- & Sportprogramm",
    schedTitleText: "Heutiges Animations- & Sportprogramm",
    schedSub: "Abwechslungsreiches Sport- und Unterhaltungsprogramm für die ganze Familie.",
    live_now: "Jetzt aktiv 🟢",
    btn_remind: "🔔 Erinnern",

    // Directory
    directory_title: "📖 Hotelverzeichnis & Angebote",
    tab_all: "Alle",
    tab_food: "Restaurants (Dine & Indulge)",
    tab_activities: "Strand & Pools (Explore & Relax)",
    tab_wellness: "Wellness & Sport",
    tab_services: "Einrichtungen",
    tab_buildings: "Zimmer & Gebäude",
    tab_excursions: "Ausflüge",

    // Card Actions
    btn_map: "🗺️ Karte",
    btn_menu: "📜 Speisekarte",
    btn_book_table: "🍽️ Tisch buchen",
    btn_details: "ℹ️ Details",
    btn_book_excursion: "Ausflug anfragen 🛥️",
    time_lbl: "⏱️ Zeit:",
    hours_lbl: "⏰ Öffnungszeiten:",
    loc_lbl: "📍 Standort:",
    walkingTime: "Min. Gehzeit",

    // Mobile Navigation
    nav_home: "Startseite",
    nav_map: "Karte",
    nav_smart_hub: "Smart Hub",
    nav_services: "Service",
    nav_search_tab: "Suche",
    nav_whatsapp: "WhatsApp",

    // Common Modals
    modal_close: "Schließen",
    modal_ok: "Verstanden",
    btn_route: "🚀 Route zeigen",
    cartTitle: "Zimmerservice-Warenkorb",
    cartSub: "Schneller Lieferservice direkt auf Ihr Zimmer",
    cartEmpty: "Ihr Warenkorb ist leer.",
    orderNow: "Bestellung aufgeben",
    totalPrice: "Gesamt",
    view_cart: "🛒 Warenkorb ansehen",
    btn_add_order: "+ Bestellen",
    egp_currency: "EGP",

    // Table Reservation Modal
    booking_modal_title: "Tischreservierung im Restaurant",
    booking_modal_sub: "Sofortige Bestätigung durch unser Serviceteam",
    lbl_room_number: "Zimmernummer:",
    lbl_guest_name: "Name des Gastes:",
    lbl_guest_count: "Anzahl Personen:",
    lbl_dinner_time: "Uhrzeit des Abendessens:",
    opt_2_guests: "2 Personen",
    opt_3_guests: "3 Personen",
    opt_4_guests: "4 Personen",
    opt_5_guests: "5+ Personen",
    btn_confirm_table: "Tisch jetzt verbindlich reservieren",
    ph_room_num: "z.B. 2015",
    ph_guest_name: "Vollständiger Name",
    booking_confirmed_title: "Tischreservierung bestätigt! 🍷",
    booking_confirmed_msg: "Herzlich willkommen! Ihr Tisch im ({rest}) für Zimmer [{room}] um {time} Uhr ist bestätigt. Unser Team freut sich auf Sie.",

    // Guest Services Modal
    srv_modal_title: "Schneller Zimmerservice & Wünsche",
    srv_modal_sub: "Mit einem Klick direkt an das Housekeeping übermittelt",
    srv_lbl_room: "Registrierte Zimmernummer:",
    srv_ph_room: "Zimmernummer eingeben (z.B. 2015)...",
    srv_btn_towels: "🏖️ Zusätzliche Strandhandtücher anfordern",
    srv_btn_clean: "🧹 Zimmer jetzt reinigen & herrichten",
    srv_btn_water: "💧 Trinkwasser & Teezubehör auffüllen",
    srv_btn_pillows: "🛏️ Zusätzliche Kissen oder Decken",
    srv_free: "Kostenlos",
    srv_instant: "Sofort",
    srv_available: "Verfügbar",

    // VIP Hub
    vip_hub_title: "VIP-Gästezentrum & Concierge-Service",
    vip_hub_sub: "Direkte Wünsche an unser Hotelpersonal rund um die Uhr",
    vip_golf_car: "Golf-Cart anfordern",
    vip_golf_sub: "Transfer zum Strand oder Lobby",
    vip_luggage: "Gepäckservice (Bellman)",
    vip_luggage_sub: "Bei Anreise oder Abreise",
    vip_housekeeping: "Zimmerreinigung (Housekeeping)",
    vip_housekeeping_sub: "Bettwäsche & Handtücher wechseln",
    vip_water: "Trinkwasser & Tee-Auffüllung",
    vip_water_sub: "Kostenfreie Bereitstellung",
    vip_wakeup: "Telefonischer Weckruf",
    vip_wakeup_sub: "Morgendlicher Weckservice für Ausflüge",
    vip_late_co: "Später Check-out (Late Checkout)",
    vip_late_co_sub: "Abstimmung mit der Rezeption",
    vip_order_received: "Anfrage erfasst:",
    vip_for_room: "Für Zimmer",
    vip_eta: "Geschätzte Ankunft: 10-15 Minuten",
    vip_step1: "1. Erhalten ✓",
    vip_step2: "2. In Bearbeitung ⏳",
    vip_step3: "3. Auf dem Weg zum Zimmer",
    vip_btn_wa: "Rezeption per WhatsApp kontaktieren 💬",

    // AI Concierge
    ai_chat_title: "Häufige Fragen zum Resort",
    ai_chat_online: "Gespeicherte Antworten, offline verfügbar",
    ai_chip_meals: "🍽️ Essenszeiten",
    ai_chip_wifi: "📶 WLAN-Passwort",
    ai_chip_clinic: "🩺 Arztpraxis (15)",
    ai_chip_aqua: "🌊 Aquapark-Zeiten",
    ai_welcome_msg: "👋 Diese lokale FAQ enthält grundlegende Resortinformationen. Wenn Sie keine Antwort finden, wenden Sie sich bitte an die Rezeption.",
    ai_ph_input: "Schreiben Sie Ihre Frage hier...",
    ai_btn_send: "Senden",
    ai_fallback_response: "Herzlich willkommen! Unser Concierge- und Rezeptionsteam ist rund um die Uhr für Sie da. Wählen Sie die (0) von Ihrem Zimmertelefon oder besuchen Sie die Rezeption im Hauptgebäude M.",
    request_not_sent_title: "Anfrage nicht gesendet",
    request_not_sent: "Dieser Guide ist nicht mit den Hotelsystemen verbunden. Ihre Anfrage oder Buchung wurde nicht gesendet; bitte wenden Sie sich zur Bestätigung an die Rezeption.",

    // AI Itinerary
    itin_title: "KI-Tagesplaner nach Maß",
    itin_sub: "Wählen Sie Ihren Reisestil für ein maßgeschneidertes Tagesprogramm",
    itin_lbl_type: "Urlaubsstil & Interessen:",
    itin_opt_family: "Familie mit Kindern (Family & Fun)",
    itin_opt_couples: "Paare & Erholung (Romantik)",
    itin_opt_adventure: "Sport, Abenteuer & Tauchen (Adventure)",
    itin_btn_create: "Tagesplan jetzt erstellen ✨",

    // Compendium
    comp_title: "Hotel-ABC & Serviceverzeichnis",
    comp_sub: "Resort Compendium & All-Inclusive Guide",
    comp_ai_title: "🌟 Was Ihr All-Inclusive beinhaltet:",
    comp_ai_items: "• Reichhaltiges Buffet im Hauptrestaurant Sirena.<br>• Snacks, Erfrischungen und Eiskreationen ganztägig an der Strandbar.<br>• Freier unbegrenzter Zugang zum Moreno Aquapark und Lotus-Pool.<br>• Tennisplätze, Fitnessstudio und Kids Mini Club.",
    comp_ext_title: "📞 Wichtige interne Durchwahlnummern:",
    comp_hours_title: "⏰ An- & Abreisezeiten:",
    comp_hours_items: "• Check-in: ab 14:00 Uhr.<br>• Check-out: bis 12:00 Uhr mittags.<br>• Für Late Check-out bitte die Rezeption kontaktieren (0).",

    // Room Pass
    pass_title: "Digitaler Zimmerpass (Apple Wallet Stil)",
    pass_sub: "Smarte Aufenthalts- und Zimmerberechtigung",
    pass_vip_badge: "VIP ALL-INCLUSIVE",
    pass_room_lbl: "Zimmernummer:",
    pass_guest_lbl: "Name des Gastes:",
    pass_guest_val: "Sehr geehrter Gast (VIP)",
    pass_wifi_lbl: "WLAN-Netzwerk:",
    pass_pass_lbl: "Passwort:",
    pass_scan_lbl: "QR-Code scannen für Direktnavigation:",
    pass_share_wa: "📲 Per WhatsApp teilen",

    // Spa Booking
    spa_title: "Königliches Spa & Wellnesszentrum buchen",
    spa_sub: "Moreno Horizon Luxury Spa & Wellness",
    spa_lbl_treatment: "Behandlung wählen:",
    spa_lbl_duration: "Dauer & Preis:",
    spa_lbl_therapist: "Therapeuten-Präferenz:",
    spa_therapist_f: "Therapeutin (weiblich)",
    spa_therapist_m: "Therapeut (männlich)",
    spa_therapist_any: "Erster verfügbarer Therapeut",
    spa_lbl_time: "Gewünschte Uhrzeit:",
    spa_lbl_room: "Zimmernummer:",
    spa_btn_confirm: "Spa-Termin jetzt buchen ✨",
    spa_confirmed_msg: "Ihr Spa-Termin ({treatment}) für Zimmer [{room}] um {time} Uhr wurde erfolgreich reserviert! 💆",

    // Qibla & Prayer Times
    prayer_title: "Hurghada Gebetszeiten & Qibla-Kompass",
    prayer_sub: "Die Hotel-Moschee (Punkt 16) ist für alle Gebete geöffnet",
    prayer_angle_text: "Qibla-Winkel von Hurghada: 137° (Südost)",
    prayer_distance_text: "Entfernung nach Mekka: ca. 860 km",

    // Feedback
    feedback_title: "Bewertung von Aufenthalt & Service",
    feedback_sub: "Ihre Meinung zählt; wir sorgen für einen perfekten Aufenthalt",
    fb_clean_lbl: "Sauberkeit von Anlage & Zimmern:",
    fb_food_lbl: "Qualität & Vielfalt der Speisen:",
    fb_service_lbl: "Freundlichkeit & Schnelligkeit des Personals:",
    fb_room_lbl: "Zimmernummer:",
    fb_ph_room: "z.B. 2015",
    fb_comment_lbl: "Ihre Anmerkungen oder Wünsche:",
    fb_ph_comment: "Teilen Sie uns Ihre Wünsche oder Vorschläge mit...",
    fb_btn_submit: "Bewertung an Hotelmanagement senden 🌟",
    fb_thank_you: "Herzlichen Dank! Wir freuen uns sehr über Ihre fantastische Bewertung für Zimmer [{room}] 🌟",
    fb_apology: "Wir entschuldigen uns für eventuelle Unannehmlichkeiten. Ein Betreuer wurde für Zimmer [{room}] informiert, um Ihr Anliegen umgehend zu klären!",

    // Spotlight
    spotlight_ph: "Alles im Resort suchen (Pizza, Massage, Zimmer 2015, WLAN, Serena)...",
    spotlight_hint: "Tippen Sie zur Sofortsuche in Karte, Speisekarten, Aktivitäten und Zimmern...",
    spotlight_heading_pois: "📍 Einrichtungen & Orte des Resorts",
    spotlight_heading_food: "🍽️ Speisen & Getränkekarte",
    spotlight_heading_faq: "💡 Tipps & nützliche Hinweise",
    spotlight_no_results: "Keine Ergebnisse gefunden für",
    spotlight_view: "Ansehen ➔",

    // Gallery
    gallery_title: "Fotogalerie Moreno Horizon Resort",
    gallery_sub: "Ein visueller Rundgang durch unser Luxusresort",
    gallery_cap1: "Panoramablick aus der Luft auf Strand und Hauptpool",
    gallery_cap2: "Italienisches Restaurant La Mama und Holzofen-Spezialitäten",
    gallery_cap3: "Wellness-Gym & Spa Entspannungsbereiche",
    gallery_cap4: "Offizieller 3D-Lageplan des Resorts",
    gallery_close: "Galerie schließen",

    // Tour HUD
    tour_started: "3D-Resort-Rundgang gestartet 🎬",
    tour_completed: "Rundgang abgeschlossen! Herzlich willkommen im Moreno Horizon 🌴",
    tour_next: "Weiter ➔",
    tour_finish: "Tour beenden",

    // Smart Guest Experience & Turn-by-Turn Extensions
    "fab_hub_title": "Smarter Gäste-Schnellzugriff",
    "fab_my_room": "Zu meinem Zimmer 🏠",
    "fab_shuttle": "Golf-Cart rufen 🛺",
    "fab_where_am_i": "Wo bin ich jetzt? 📍",
    "fab_wifi": "Resort WLAN 📶",
    "fab_whatsapp": "Rezeption WhatsApp 💬",
    "save_room_title": "Zimmernummer festlegen",
    "save_room_sub": "Speichern Sie Ihre Zimmernummer für 1-Klick-Navigation und schnellen Service",
    "save_room_lbl": "Zimmernummer:",
    "save_room_ph": "z.B. 1204 oder 2015",
    "save_room_btn": "Speichern & Navigieren 🎯",
    "save_room_success": "Zimmernummer erfolgreich gespeichert! Tippen Sie jederzeit auf 'Zu meinem Zimmer'.",
    "save_room_change": "Zimmernummer ändern",
    "shuttle_modal_title": "Golf-Cart Shuttle rufen",
    "shuttle_sub": "Kostenloser Shuttleservice für Gäste, Gepäck und barrierefreien Transport",
    "shuttle_pickup_lbl": "Abholort (Ihr Standort):",
    "shuttle_dest_lbl": "Zielort:",
    "shuttle_passengers_lbl": "Anzahl Personen:",
    "shuttle_notes_lbl": "Besondere Hinweise (Gepäck / Kinderwagen):",
    "shuttle_notes_ph": "Besondere Wünsche...",
    "shuttle_req_btn": "Shuttle jetzt anfordern 🛺",
    "shuttle_dispatched_title": "Golf-Cart Shuttle bestätigt!",
    "shuttle_dispatched_desc": "Shuttle-Wagen #3 ist unterwegs. Fahrer 'Ahmed' trifft in Kürze ein.",
    "shuttle_eta": "Geschätzte Ankunftszeit: 3 Minuten",
    "wai_title": "Meinen Standort festlegen (Wo bin ich?)",
    "wai_sub": "Wählen Sie manuell einen Orientierungspunkt; GPS und der Telefonstandort werden nicht verwendet.",
    "wai_select_lbl": "Ich stehe derzeit in der Nähe von:",
    "wai_set_btn": "Standort auf Karte markieren 📍",
    "wai_my_location_set": "Orientierungspunkt manuell als Startpunkt gewählt; der Telefonstandort wurde nicht ermittelt.",
    "wai_nearest_facilities": "Nächste Einrichtungen in Ihrer Nähe:",
    "wai_near_pool": "Nächster Pool",
    "wai_near_bar": "Nächste Bar",
    "wai_near_wc": "Nächstes WC",
    "wai_near_beach": "Strand & Steg",
    "wifi_modal_title": "High-Speed Resort WLAN",
    "wifi_modal_sub": "Kostenloses schnelles WLAN in allen Zimmern, Restaurants und am Strand",
    "wifi_network_name": "Netzwerkname (SSID):",
    "wifi_password_lbl": "Passwort:",
    "wifi_qr_desc": "QR-Code mit dem Smartphone scannen für direkte Verbindung",
    "wifi_connected_toast": "WLAN-Passwort in die Zwischenablage kopiert!",
    "nav_turn_title": "Live Schritt-für-Schritt Wegweiser",
    "nav_step_of": "Schritt {current} von {total}",
    "nav_step_next": "Nächster Schritt ➔",
    "nav_step_prev": "⬅️ Vorheriger",
    "nav_step_finish": "Wegweiser beenden ✓",
    "nav_accessible_label": "Stufenfreier barrierefreier Weg ♿",
    "nav_start_walk_btn": "Schritt-für-Schritt starten 🚶‍♂️",
    "nav_arrived_title": "🎉 Sie haben Ihr Ziel erreicht!",
    "nav_arrived_desc": "Sie befinden sich jetzt bei {destination}. Viel Vergnügen!",
    nav_route_start_title: "Start bei",
    nav_route_start_instruction: "Folgen Sie der eingezeichneten Route auf den Wegen bis zur nächsten Abbiegung.",
    nav_route_accessibility_notice: "Die Route ist ungefähr. Bitte fragen Sie an der Rezeption, ob sie stufenfrei ist.",
    nav_route_turn_title: "Am Weg {direction} abbiegen",
    nav_route_turn_instruction: "Folgen Sie dem Weg {direction} bis zur nächsten Abbiegung.",
    nav_route_left: "links",
    nav_route_right: "rechts",
    nav_route_arrive_title: "Ziel erreicht: {destination}",
    nav_route_arrive_instruction: "Sie sind jetzt bei {destination}.",
    "mf_open_now": "⚡ Jetzt geöffnet",
    "beach_flag_safe": "🟢 Strandflagge: Sicher zum Schwimmen & Schnorcheln",
    "sea_temp_lbl": "Meerestemperatur: 26°C",
    "golden_hour_badge": "📸 Golden Hour Sonnenuntergang ab 17:25 Uhr (Bester Blick: Marina Steg)"
  }
};

const poiTranslations = {
  "1": {
    en: { name: "Beach Area & Marina Pier", loc: "Direct Red Sea Waterfront", tag: "Sandy beach, loungers & marina pier", desc: "Private sandy beach with comfortable sun loungers, beach umbrellas, and a private marina pier for yacht excursions and snorkeling." },
    ru: { name: "Пляжная зона и пирс марины", loc: "Первая линия Красного моря", tag: "Песчаный пляж, шезлонги и пирс", desc: "Собственный песчаный пляж с шезлонгами, солнцезащитными зонтиками и собственным пирсом для яхт и снорклинга." },
    de: { name: "Strandbereich & Marina-Steg", loc: "Direkte Lage am Roten Meer", tag: "Sandstrand, Liegestühle & Steg", desc: "Privater Sandstrand mit Sonnenliegen, Schirmen und eigenem Steg für Bootsausflüge und Schnorcheln." }
  },
  "2": {
    en: { name: "Diving & Watersports Center", loc: "Next to North Aqua Park Pool", tag: "PADI dive courses & sea safaris", desc: "Certified professional dive instructors offering daily boat trips to Giftun Island, snorkeling safaris, and full PADI dive certifications." },
    ru: { name: "Дайвинг-центр и водный спорт", loc: "Рядом с северным аквапарком", tag: "Курсы PADI и морские экскурсии", desc: "Профессиональная команда инструкторов предлагает морские прогулки на остров Гифтун, снорклинг и курсы дайвинга PADI." },
    de: { name: "Tauch- & Wassersportzentrum", loc: "Neben dem nördlichen Aquapark", tag: "PADI-Tauchkurse & Bootstouren", desc: "Zertifizierte Tauchlehrer bieten tägliche Fahrten zur Giftun-Insel, Schnorcheltouren und vollständige PADI-Kurse an." }
  },
  "3": {
    en: { name: "Moreno Aqua Park", loc: "North Resort Wing near Building N", tag: "Thrilling slides for all family members", desc: "Multi-lane water slide complex, splash pools with certified lifeguards on duty, and comfortable family sun loungers." },
    ru: { name: "Аквапарк Moreno", loc: "Северная часть курорта у корпуса N", tag: "Водные горки для всех возрастов", desc: "Комплекс скоростных водных горок, безопасные бассейны с дежурными спасателями и семейные зоны отдыха." },
    de: { name: "Moreno Aquapark", loc: "Nordflügel nahe Gebäude N", tag: "Wasserrutschen für die ganze Familie", desc: "Große Rutschenanlage mit Erlebnisbecken, zertifizierten Rettungsschwimmern und Familien-Sonnendecks." }
  },
  "4": {
    en: { name: "Kids Play Area & Mini Club", loc: "Lush gardens between Aqua Park and Beach Bar", tag: "Safe playground & entertaining mini club", desc: "Shaded children's playground with slides, swings, arts & crafts workshops, and daily supervised animation activities." },
    ru: { name: "Детская площадка и мини-клуб", loc: "Зеленый сад между аквапарком и пляжным баром", tag: "Безопасная площадка и мини-клуб", desc: "Затененная игровая зона с горками, качелями, развивающими играми и ежедневной анимацией под присмотром воспитателей." },
    de: { name: "Kinderspielplatz & Miniclub", loc: "Gartenanlage zwischen Aquapark und Strandbar", tag: "Sicherer Spielplatz & Miniclub", desc: "Schattiger Spielplatz mit Schaukeln, Rutschen, Bastelworkshops und täglicher professioneller Kinderbetreuung." }
  },
  "5": {
    en: { name: "Beach Bar & Lounge", loc: "Directly on the beach boardwalk", tag: "Fresh juices, chilled cocktails & iced coffees", desc: "Serves freshly squeezed juices, iced beverages, craft cocktails, and premium barista coffees with stunning sea views." },
    ru: { name: "Пляжный бар и лаунж", loc: "На набережной у песчаного пляжа", tag: "Свежие соки, коктейли и кофе", desc: "Освежающие соки, тропические коктейли, холодный кофе и напитки с великолепным видом на Красное море и марину." },
    de: { name: "Strandbar & Lounge", loc: "Direkt an der Strandpromenade", tag: "Frische Säfte, Cocktails & Eiskaffee", desc: "Bietet frisch gepresste Säfte, kühle Erfrischungen, tropische Cocktails und Kaffeespezialitäten mit Panoramablick." }
  },
  "6": {
    en: { name: "Oriental Restaurant & Snack Bar", loc: "Next to Beach Bar (Building 6)", tag: "Charcoal grill & afternoon snacks", desc: "Authentic Egyptian mixed grills, charcoal kebab, freshly baked pizza, warm sandwiches, and mezze platters all afternoon." },
    ru: { name: "Восточный ресторан и снек-бар", loc: "Рядом с пляжным баром (здание 6)", tag: "Блюда на углях и дневные закуски", desc: "Традиционные восточные блюда на гриле, кебабы, свежая пицца, горячие сэндвичи и холодные закуски мезе." },
    de: { name: "Orientalisches Restaurant & Snackbar", loc: "Neben der Strandbar (Gebäude 6)", tag: "Holzkohlegrill & Nachmittagssnacks", desc: "Orientalische Grillspezialitäten, Kebab, ofenfrische Pizza, warme Sandwiches und traditionelle Vorspeisen." }
  },
  "7": {
    en: { name: "Sunken Ship Reef Snorkeling Spot", loc: "15 meters off the Marina Pier", tag: "Exotic corals & tropical marine life", desc: "Famous crystal-clear lagoon with historic submerged ship structure bustling with colorful butterflyfish, rays, and dolphins." },
    ru: { name: "Риф «Затонувший корабль» для снорклинга", loc: "15 метров от пирса марины", tag: "Кораллы и тропические рыбы", desc: "Живописная рифовая лагуна с фрагментами затонувшего судна, изобилующая кораллами, скатами и разноцветными рыбами." },
    de: { name: "Schnorchel-Riff „Gesunkenes Schiff“", loc: "15 Meter vom Marina-Steg entfernt", tag: "Bunte Korallen & tropische Fische", desc: "Kristallklare Lagune mit Teilen eines historischen Wracks, reich an Korallenformationen und bunten Meeresbewohnern." }
  },
  "8": {
    en: { name: "La Mama Italian Restaurant", loc: "Northeast Wing overlooking the pool", tag: "Wood-fired pizza, pasta & romantic dining", desc: "Authentic Italian wood-fired pizza, fresh handmade artisan pastas, premium seafood specialties, and fine Italian desserts." },
    ru: { name: "Итальянский ресторан La Mama", loc: "Северо-восточное крыло с видом на бассейн", tag: "Пицца из дровяной печи и паста", desc: "Аутентичная пицца на дровах, свежая паста ручной работы, морепродукты и романтическая вечерняя атмосфера." },
    de: { name: "Italienisches Restaurant La Mama", loc: "Nordostflügel mit Poolblick", tag: "Steinofenpizza, Pasta & Romantik", desc: "Echte Pizza aus dem Steinofen, handgemachte Pasta, feine Meeresfrüchte und italienische Desserts bei Kerzenschein." }
  },
  "9": {
    en: { name: "Moreno Spa & Wellness Center", loc: "Ground Floor, Central Wing near Clinic", tag: "Turkish hammam, massage & sauna", desc: "Luxury wellness sanctuary featuring authentic Turkish hammam, Swedish & hot stone massage suites, jacuzzi, and steam rooms." },
    ru: { name: "СПА и велнес-центр Moreno", loc: "1 этаж центрального корпуса у клиники", tag: "Турецкий хаммам, массаж и сауна", desc: "Премиальный спа-комплекс с турецким хаммамом, шведским массажем, сауной, джакузи и ритуалами красоты." },
    de: { name: "Moreno Spa & Wellnesscenter", loc: "Erdgeschoss, Zentralflügel nahe Klinik", tag: "Türkischer Hammam, Massage & Sauna", desc: "Luxuriöse Wellness-Oase mit traditionellem türkischem Hammam, Massagen, Sauna, Whirlpool und Dampfbad." }
  },
  "10": {
    en: { name: "Tennis & Padel Courts", loc: "South Garden, adjacent to Wing S", tag: "Floodlit tennis courts & equipment rental", desc: "High-grade tennis courts equipped with evening floodlights, racket rental, and private coaching sessions upon request." },
    ru: { name: "Теннисные корты", loc: "Южный сад, рядом с корпусом S", tag: "Корты с освещением и прокат ракеток", desc: "Профессиональные теннисные корты с вечерним освещением, арендой экипировки и индивидуальными тренировками." },
    de: { name: "Tennis- & Padel-Plätze", loc: "Südgarten, direkt am Flügel S", tag: "Flutlichtplätze & Schlägerverleih", desc: "Tennisplätze mit abendlichem Flutlicht, Ausrüstungsverleih und Trainerstunden auf Voranmeldung." }
  },
  "11": {
    en: { name: "Central Lotus Pool & Swim-up Bar", loc: "Resort Core surrounded by Wing M & S", tag: "Heated swimming pool & swim-up bar", desc: "Expansive heated main swimming pool with in-water lounge seating, water aerobics, and a swim-up cocktail bar." },
    ru: { name: "Центральный бассейн Lotus и бар", loc: "В центре курорта между корпусами M и S", tag: "Подогреваемый бассейн и бар в воде", desc: "Большой подогреваемый бассейн с шезлонгами, аквааэробикой и баром прямо в воде для коктейлей и напитков." },
    de: { name: "Zentraler Lotus-Pool & Swim-up-Bar", loc: "Im Herzen der Anlage bei Flügel M & S", tag: "Beheizter Pool & Swim-up-Bar", desc: "Großer beheizter Hauptpool mit Sonnenliegen, Wassergymnastik und Bar im Wasser für kühle Getränke." }
  },
  "12": {
    en: { name: "Serena Main Buffet Restaurant", loc: "Main Lobby Building (Wing M), 1st Floor", tag: "International lavish breakfast, lunch & dinner", desc: "Lavish international buffet featuring live cooking stations, Egyptian delicacies, fresh bakery, and themed culinary nights." },
    ru: { name: "Главный ресторан-шведский стол Serena", loc: "Главное здание (корпус M), 1 этаж", tag: "Международный шведский стол (завтрак, обед, ужин)", desc: "Богатый шведский стол с кулинарными станциями, египетскими блюдами, свежей выпечкой и тематическими вечерами." },
    de: { name: "Hauptbuffet-Restaurant Serena", loc: "Hauptgebäude (Flügel M), 1. Etage", tag: "Internationale Buffets für alle Mahlzeiten", desc: "Großes internationales Buffet mit Live-Cooking-Stationen, ägyptischen Spezialitäten und Themenabenden." }
  },
  "13": {
    en: { name: "Amphitheater & Evening Shows", loc: "Between Commercial Wing MLS and Main Lawn", tag: "Folklore shows, live music & kids disco", desc: "Open-air theater hosting nightly entertainment, kids mini-disco, Egyptian folklore dancers, fire shows, and live music bands." },
    ru: { name: "Амфитеатр и вечерние шоу", loc: "Между торговым корпусом MLS и лужайкой", tag: "Фольклорные шоу, живая музыка и мини-диско", desc: "Театр под открытым небом с ежедневной вечерней программой: детская дискотека, танцы с огнем и живая музыка." },
    de: { name: "Amphitheater & Abendshows", loc: "Zwischen Flügel MLS und Liegewiese", tag: "Folklore, Live-Musik & Minidisco", desc: "Freilichtbühne mit abendlichem Unterhaltungsprogramm, Minidisco, Feuershows und Live-Bands." }
  },
  "14": {
    en: { name: "Gym & Fitness Club", loc: "Wellness Wing, adjacent to Serena Restaurant", tag: "Technogym cardio & strength equipment", desc: "Modern fitness studio equipped with Technogym cardio machines, free weights, resistance equipment, and air conditioning." },
    ru: { name: "Фитнес-клуб и тренажерный зал", loc: "Оздоровительное крыло, рядом с рестораном Serena", tag: "Тренажеры Technogym и кардиозона", desc: "Современный зал с кардиотренажерами Technogym, свободными весами, силовыми станциями и кондиционером." },
    de: { name: "Fitnessstudio & Gym", loc: "Wellnessflügel, neben Restaurant Serena", tag: "Technogym Cardio- & Kraftgeräte", desc: "Modernes klimatisiertes Fitnesscenter mit Technogym-Geräten, Freihanteln und Ausdauerstationen." }
  },
  "15": {
    en: { name: "Clinic & Medical Center", loc: "Near Main Gate and Mosque (Point 15)", tag: "24/7 on-call doctor & urgent pharmacy care", desc: "Fully equipped medical clinic with 24-hour on-duty physician, first aid supplies, pharmacy medicines, and multilingual care." },
    ru: { name: "Медицинская клиника и аптека", loc: "Рядом с главными воротами и мечетью (объект 15)", tag: "Круглосуточный врач и аптечный пункт", desc: "Оснащенный медицинский пункт с дежурным врачом 24/7, первой помощью и необходимыми медикаментами." },
    de: { name: "Klinik & Ärztezentrum", loc: "Nahe Haupttor und Moschee (Punkt 15)", tag: "24/7 Notarzt & Apothekenservice", desc: "Voll ausgestattete Arztpraxis mit 24-Stunden-Bereitschaftsarzt, Erste-Hilfe-Versorgung und Apotheke." }
  },
  "16": {
    en: { name: "Resort Mosque", loc: "Next to Clinic and Commercial Complex", tag: "Air-conditioned mosque for all daily prayers", desc: "Peaceful, air-conditioned mosque accommodating up to 150 worshippers with dedicated women's prayer hall and ablution facilities." },
    ru: { name: "Мечеть курорта", loc: "Рядом с клиникой и торговым комплексом", tag: "Кондиционированная мечеть для молитв", desc: "Вместительная мечеть с кондиционером на 150 человек, отдельным женским залом и комнатой для омовения." },
    de: { name: "Resort-Moschee", loc: "Neben Klinik und Einkaufszentrum", tag: "Klimatisierte Gebetsstätte für alle Gebete", desc: "Ruhige, klimatisierte Moschee für bis zu 150 Betende mit separatem Damenbereich und Waschräumen." }
  },
  "17": {
    en: { name: "Parking Area 2", loc: "Southeast perimeter adjacent to Wing S", tag: "Shaded private guest vehicle parking", desc: "Spacious shaded parking area serving guests staying in the South Building and visitors arriving via the main resort entrance." },
    ru: { name: "Парковка 2", loc: "Юго-восточная зона рядом с корпусом S", tag: "Затененная охраняемая парковка", desc: "Просторная затененная парковка для гостей южного корпуса и посетителей курорта." },
    de: { name: "Parkplatz 2", loc: "Südöstlicher Bereich am Flügel S", tag: "Schattige Gästeparkplätze", desc: "Großer schattiger Parkplatz für Gäste des Südgebäudes und Besucher nahe dem Haupttor." }
  },
  "18": {
    en: { name: "Resort Main Gate & Security", loc: "Main Southern Resort Entrance", tag: "Official entrance, security & taxi dispatch", desc: "24-hour manned resort entrance, valet parking, limousine and taxi coordination, and arrival greeting desk." },
    ru: { name: "Главные ворота и охрана", loc: "Главный южный въезд на территорию", tag: "Официальный въезд, охрана и вызов такси", desc: "Круглосуточный пропускной пункт, служба парковки (valet), заказ такси и трансферов в аэропорт." },
    de: { name: "Haupteingang & Sicherheitsdienst", loc: "Südlicher Haupteingang des Resorts", tag: "Offizielles Eingangstor & Taxi-Service", desc: "Rund um die Uhr besetztes Eingangstor, Parkservice, Taxiservice und Begrüßung der Gäste." }
  },
  "N": {
    en: { name: "North Building (Wing N)", loc: "North wing overlooking Aqua Park & Beach", tag: "Rooms: 1501-1548 (Fl 1) to 1901-1948 (Fl 5)", desc: "Quiet hotel suites with panoramic views of the water park gardens and the Red Sea. 5 guest accommodation floors (1501-1948)." },
    ru: { name: "Северный корпус (Wing N)", loc: "Северная часть с видом на аквапарк и пляж", tag: "Номера: 1501-1548 (1 эт.) до 1901-1948 (5 эт.)", desc: "Тихие гостиничные номера с прямым видом на сады аквапарка и Красное море. 5 основных жилых этажей (1501-1948)." },
    de: { name: "Nordflügel (Gebäude N)", loc: "Nordflügel mit Blick auf Aquapark & Strand", tag: "Zimmer: 1501-1548 (1. Et.) bis 1901-1948 (5. Et.)", desc: "Ruhige Hotelzimmer mit Blick auf die Gärten des Aquaparks und das Rote Meer auf 5 Hauptetagen (1501-1948)." }
  },
  "S": {
    en: { name: "South Building (Wing S)", loc: "Eastern wing overlooking Lotus Pool & Tennis", tag: "Rooms: 2001-2016 (Floor 1) | 2101-2144 (Floor 2) | 2201-2244 (Floor 3) | 2301-2344 (Floor 4) | 2401-2444 (Floor 5)", desc: "Luxurious rooms offering panoramic vistas across the Lotus swimming pool, beach shoreline, and tennis courts." },
    ru: { name: "Южный корпус (Wing S)", loc: "Восточная зона с видом на бассейн Lotus и корты", tag: "Номера: 2001-2016 (1 этаж) | 2101-2144 (2 этаж) | 2201-2244 (3 этаж) | 2301-2344 (4 этаж) | 2401-2444 (5 этаж)", desc: "Комфортабельные номера с панорамным видом на бассейн Lotus, пляж и теннисные корты." },
    de: { name: "Südflügel (Gebäude S)", loc: "Ostseite mit Blick auf Lotus-Pool & Tennisplätze", tag: "Zimmer: 2001-2016 (1. Etage) | 2101-2144 (2. Etage) | 2201-2244 (3. Etage) | 2301-2344 (4. Etage) | 2401-2444 (5. Etage)", desc: "Elegante Zimmer mit Panoramablick auf den Lotus-Pool, die Strandpromenade und die Tennisplätze." }
  },
  "M": {
    en: { name: "Main Building (Lobby Wing M)", loc: "Heart of the resort near Lobby & Serena", tag: "Rooms: 1001-1020 (Floor 1) | 1101-1160 (Floor 2) | 1201-1260 (Floor 3)", desc: "Central building hosting the grand reception lobby, Serena Restaurant, executive lounge, and 24-hour guest concierge." },
    ru: { name: "Главный корпус (Лобби Wing M)", loc: "Центр курорта рядом с лобби и рестораном Serena", tag: "Номера: 1001-1020 (1 этаж) | 1101-1160 (2 этаж) | 1201-1260 (3 этаж)", desc: "Центральное здание с главным лобби, рестораном Serena, лаунджем и круглосуточной службой консьержа." },
    de: { name: "Hauptgebäude (Lobby Flügel M)", loc: "Zentrum des Resorts bei Lobby & Restaurant Serena", tag: "Zimmer: 1001-1020 (1. Etage) | 1101-1160 (2. Etage) | 1201-1260 (3. Etage)", desc: "Zentraler Trakt mit Hauptrezeption, Restaurant Serena, Lounge und Gästeservice rund um die Uhr." }
  },
  "MLS": {
    en: { name: "Commercial Complex (Wing MLS)", loc: "Iconic circular building at southwest corner", tag: "Rooms & Shops: 2601-2654 (Floor 1) | 2701-2748 (Floor 2) | 2801-2848 (Floor 3) | 2901-2948 (Floor 4)", desc: "Iconic circular complex housing the shopping bazaar, Italian espresso roastery, tour operators, and car rental agency." },
    ru: { name: "Торговый комплекс (Wing MLS)", loc: "Круглое здание в юго-западной части курорта", tag: "Номера и магазины: 2601-2654 (1 этаж) | 2701-2748 (2 этаж) | 2801-2848 (3 этаж) | 2901-2948 (4 этаж)", desc: "Круглый торговый комплекс с восточным базаром, кофейней, экскурсионными агентствами и прокатом автомобилей." },
    de: { name: "Einkaufszentrum (Flügel MLS)", loc: "Rundbau in der südwestlichen Ecke des Resorts", tag: "Zimmer & Shops: 2601-2654 (1. Etage) | 2701-2748 (2. Etage) | 2801-2848 (3. Etage) | 2901-2948 (4. Etage)", desc: "Markanter Rundbau mit Basar, Boutiquen, italienischer Kaffeerösterei, Ausflugsbüros und Autovermietung." }
  }
};

// Helper: Get fully localized POI object
function getLocalizedCategory(category, lang = 'ar') {
  const t = i18n[lang] || i18n.ar;
  const key = 'cat_' + category;
  return t[key] || category;
}

function getLocalizedFloor(floorStr, lang = 'ar') {
  if (lang === 'ar' || !floorStr) return floorStr;
  if (/الأرضي|Ground/i.test(floorStr)) {
    return lang === 'ru' ? 'Первый этаж (Ground Floor)' : (lang === 'de' ? 'Erdgeschoss' : 'Ground Floor');
  }
  if (/الأول|Floor 1/i.test(floorStr)) {
    return lang === 'ru' ? '1-й этаж (Floor 1)' : (lang === 'de' ? '1. Etage (Floor 1)' : '1st Floor');
  }
  if (/الثاني|Floor 2/i.test(floorStr)) {
    return lang === 'ru' ? '2-й этаж (Floor 2)' : (lang === 'de' ? '2. Etage (Floor 2)' : '2nd Floor');
  }
  if (/الثالث|Floor 3/i.test(floorStr)) {
    return lang === 'ru' ? '3-й этаж (Floor 3)' : (lang === 'de' ? '3. Etage (Floor 3)' : '3rd Floor');
  }
  if (/الرابع|Floor 4/i.test(floorStr)) {
    return lang === 'ru' ? '4-й этаж (Floor 4)' : (lang === 'de' ? '4. Etage (Floor 4)' : '4th Floor');
  }
  if (/الخامس|Floor 5/i.test(floorStr)) {
    return lang === 'ru' ? '5-й этаж (Floor 5)' : (lang === 'de' ? '5. Etage (Floor 5)' : '5th Floor');
  }
  return floorStr;
}

function getLocalizedPoi(poi, lang = 'ar') {
  const cat = getLocalizedCategory(poi.category, lang);
  if (lang === 'ar' || !lang) {
    return {
      name: poi.nameAr,
      loc: poi.locAr,
      tag: poi.tagAr,
      desc: poi.descriptionAr,
      category: cat || poi.categoryNameAr,
      hours: poi.hours
    };
  }
  const trans = poiTranslations[poi.id] && poiTranslations[poi.id][lang];
  if (trans) {
    return {
      name: trans.name,
      loc: trans.loc,
      tag: trans.tag,
      desc: trans.desc,
      category: cat || poi.categoryNameAr,
      hours: poi.hours
    };
  }
  const enTrans = poiTranslations[poi.id] && poiTranslations[poi.id]['en'];
  return {
    name: (enTrans && enTrans.name) || poi.nameEn || poi.nameAr,
    loc: (enTrans && enTrans.loc) || poi.locAr,
    tag: (enTrans && enTrans.tag) || poi.tagAr,
    desc: (enTrans && enTrans.desc) || poi.descriptionAr,
    category: cat || poi.categoryNameAr,
    hours: poi.hours
  };
}

// Excursions Localization
const excursionTranslations = {
  0: {
    en: { title: "Giftun Island VIP Yacht Cruise", desc: "Full-day marine cruise with lunch, drinks, and snorkeling equipment to explore vibrant coral reefs and wild dolphins.", price: "$35 / person", duration: "08:30 AM - 04:30 PM" },
    ru: { title: "Морской круиз на яхте на остров Гифтун", desc: "Однодневная морская прогулка с обедом, напитками и снорклингом у коралловых рифов и дельфинов.", price: "35$ / чел", duration: "08:30 - 16:30" },
    de: { title: "Giftun-Insel VIP-Yachttour & Schnorcheln", desc: "Ganztägige Bootstour inklusive Mittagessen, Getränken und Schnorchelausrüstung zu bunten Korallenriffen.", price: "35$ / Person", duration: "08:30 - 16:30 Uhr" }
  },
  1: {
    en: { title: "Desert Quad Safari & Bedouin Dinner", desc: "Thrilling ATV quad bike adventure across desert dunes, sunset panorama, authentic Bedouin barbecue and show.", price: "$28 / person", duration: "02:00 PM - 07:30 PM" },
    ru: { title: "Сафари на квадроциклах и ужин у бедуинов", desc: "Катание на квадроциклах по песчаным дюнам, закат в пустыне, бедуинский ужин и восточное шоу.", price: "28$ / чел", duration: "14:00 - 19:30" },
    de: { title: "Wüsten-Quad-Safari & Beduinenabend", desc: "Spannende Quad-Fahrt durch die Wüstendünen, Sonnenuntergang, orientalisches BBQ und Beduinenshow.", price: "28$ / Person", duration: "14:00 - 19:30 Uhr" }
  },
  2: {
    en: { title: "Sindbad Submarine Deep Sea Dive", desc: "Real submarine descent 22 meters below the Red Sea to witness exotic coral reefs and marine life safely for all ages.", price: "$40 / person", duration: "2 Hours" },
    ru: { title: "Погружение на подводной лодке Синдбад", desc: "Настоящее погружение на глубину 22 метра под воду для безопасного наблюдения за подводным миром всей семьей.", price: "40$ / чел", duration: "2 часа" },
    de: { title: "Sindbad U-Boot Tiefseetauchgang", desc: "Echte U-Boot-Fahrt 22 Meter unter den Meeresspiegel zur sicheren Beobachtung exotischer Unterwasserwelten.", price: "40$ / Person", duration: "2 Stunden" }
  }
};

function getLocalizedExcursion(ex, index, lang = 'ar') {
  if (lang === 'ar' || !lang) {
    return { title: ex.titleAr, desc: ex.descAr, price: ex.price, duration: ex.duration };
  }
  const trans = excursionTranslations[index] && excursionTranslations[index][lang];
  if (trans) return trans;
  const enTrans = excursionTranslations[index] && excursionTranslations[index]['en'];
  return enTrans || { title: ex.titleEn || ex.titleAr, desc: ex.descAr, price: ex.price, duration: ex.duration };
}

// Activity Titles Localization
const activityTranslations = {
  0: { en: "Aqua Gym at Lotus Pool", ru: "Аквагимнастика в бассейне Lotus", de: "Aqua-Gymnastik im Lotus-Pool" },
  1: { en: "Kids Splash & Slide Challenge", ru: "Водные игры и горки в аквапарке", de: "Wasserspiele im Aquapark" },
  2: { en: "Beach Volleyball Tournament", ru: "Пляжный волейбол у марины", de: "Beachvolleyball-Turnier an der Marina" },
  3: { en: "Sunset Yoga on the Beach", ru: "Йога на закате у пляжного бара", de: "Sonnenuntergangs-Yoga am Strand" },
  4: { en: "Kids Mini Disco & Animation Show", ru: "Детская мини-дискотека и шоу", de: "Kinder Mini-Disco & Show" },
  5: { en: "Egyptian Folklore Gala & Latin Night", ru: "Египетский фольклор и латино-шоу", de: "Ägyptische Folklore & Latein-Show" }
};

function getLocalizedActivityTitle(act, index, lang = 'ar') {
  if (lang === 'ar' || !lang) return act.titleAr;
  const trans = activityTranslations[index] && activityTranslations[index][lang];
  return trans || act.titleEn || act.titleAr;
}

// Official Resort POIs matching User's 3D Illustrated Map
const resortPois = [
  {
    id: "1",
    num: "1",
    category: "relax",
    categoryNameAr: "استكشاف واسترخاء (Explore & Relax)",
    nameAr: "منطقة الشاطئ والمارينا (Beach Area)",
    nameEn: "Beach Area & Marina Pier",
    tagAr: "شاطئ رملي ومظلات وممشى مارينا",
    hours: "07:00 - غروب الشمس",
    locAr: "الواجهة البحرية المباشرة على البحر الأحمر",
    descriptionAr: "شاطئ رملي خاص مجهز بأسرّة استلقاء ومظلات شمسية مع رصيف المارينا لليخوت وممارسة السنوركلينج.",
    coords: { x: 42.48, y: 23.44 },
    badgeColor: "bg-sky-600",
    image: "assets/images/beach_marina.jpg"
  },
  {
    id: "2",
    num: "2",
    category: "wellness",
    categoryNameAr: "صحة وأنشطة (Wellness & Activities)",
    nameAr: "مركز الغوص والرياضات البحرية (Diving Center)",
    nameEn: "Diving & Watersports Center",
    tagAr: "دورات غوص PADI ورحلات بحرية",
    hours: "08:30 - 17:30",
    locAr: "بجوار مسبح الأكوا بارك الشمالي",
    descriptionAr: "فريق غواصين محترف يقدم رحلات يومية إلى جزيرة جفتون، سنوركلينج، ودورات غوص PADI للمبتدئين والمحترفين.",
    coords: { x: 16.75, y: 28.52 },
    badgeColor: "bg-purple-600",
    image: "assets/images/diving_center.jpg"
  },
  {
    id: "3",
    num: "3",
    category: "relax",
    categoryNameAr: "استكشاف واسترخاء (Explore & Relax)",
    nameAr: "أكوا بارك مورينو (Aqua Park)",
    nameEn: "Moreno Aqua Park",
    tagAr: "زلاجات مائية لجميع الأعمار",
    hours: "10:00 - 12:30 | 14:30 - 17:00",
    locAr: "الطرف الشمالي للقرية بجوار المبنى N",
    descriptionAr: "مجموعة من الزلاجات المائية السريعة، برك مائية آمنة مزودة بفريق إنقاذ معتمد ومظلات شمسية عائلية.",
    coords: { x: 16.14, y: 34.86 },
    badgeColor: "bg-cyan-500",
    image: "assets/images/aquapark_pool.jpg"
  },
  {
    id: "4",
    num: "4",
    category: "wellness",
    categoryNameAr: "صحة وأنشطة (Wellness & Activities)",
    nameAr: "منطقة ألعاب الأطفال (Kids Area)",
    nameEn: "Kids Play Area & Mini Club",
    tagAr: "ألعاب آمنة وميني كلوب ترفيهي",
    hours: "09:30 - 12:30 | 15:00 - 17:30",
    locAr: "الحدائق الخضراء بين الأكوا بارك وبار الشاطئ",
    descriptionAr: "مساحة مخصصة ومظللة للأطفال تضم زلاجات ومراجيح وبرامج رسم وأنشطة يومية تحت إشراف فريق متخصص.",
    coords: { x: 29.73, y: 34.67 },
    badgeColor: "bg-sky-500",
    image: "assets/images/kids_club.jpg"
  },
  {
    id: "5",
    num: "5",
    category: "relax",
    categoryNameAr: "استكشاف واسترخاء (Explore & Relax)",
    nameAr: "بار الشاطئ (Beach Bar)",
    nameEn: "Beach Bar & Lounge",
    tagAr: "مشروبات منعشة وكوكتيلات مثلجة",
    hours: "10:00 - 18:00 (حتى الغروب)",
    locAr: "بمحاذاة شاطئ البحر",
    descriptionAr: "يقدم العصائر الطازجة، المشروبات الباردة والساخنة، والكوكتيلات الاستوائية بإطلالة ساحرة على المارينا.",
    coords: { x: 37.38, y: 35.94 },
    badgeColor: "bg-rose-600",
    image: "assets/images/beach_bar.jpg",
    menuItems: [
      { name: "عصير مانجو فريش مثلج", price: 85, desc: "مانجو طازجة مع قطع الثلج", icon: "🥭" },
      { name: "آيس سبانش لاتيه", price: 95, desc: "إسبريسو بالحليب المكثف المحلى", icon: "☕" },
      { name: "فيرجن موهيتو بالنعناع والليمون", price: 90, desc: "مشروب صودا منعش بالليمون والنعناع", icon: "🍹" },
      { name: "سموذي توت بري استوائي", price: 90, desc: "توت وفراولة طازجة مخفوقة", icon: "🫐" }
    ]
  },
  {
    id: "6",
    num: "6",
    category: "dine",
    categoryNameAr: "مطاعم وتجارب طعام (Dine & Indulge)",
    nameAr: "المطعم الشرقي وسناك بار (Oriental & Snack Bar)",
    nameEn: "Oriental Restaurant & Snack Bar",
    tagAr: "مشاوي فحم ومأكولات خفيفة طوال الظهيرة",
    hours: "12:00 - 17:00 (سناكس) | 19:00 - 22:30 (عشاء)",
    locAr: "بجوار بار الشاطئ (المبنى 6)",
    descriptionAr: "أطباق شرقية ومشاوي على الفحم، بيتزا وسندوتشات ساخنة ومقبلات طازجة.",
    coords: { x: 48.54, y: 35.94 },
    badgeColor: "bg-purple-700",
    image: "assets/images/oriental_grill.jpg",
    menuItems: [
      { name: "طبق المشاوي المشكلة الملكي", price: 320, desc: "كباب وكفتة وشيش طاووق مع أرز بالخلطة", icon: "🥩" },
      { name: "سلة شاورما لحم ومقبلات", price: 180, desc: "شاورما بتتبيلة شرقية مع بطاطس مقرمشة", icon: "🌯" },
      { name: "تشكيلة مقبلات باردة وساخنة", price: 130, desc: "حمص، متبل، سمبوسك بالجبنة وورق عنب", icon: "🥗" }
    ]
  },
  {
    id: "8",
    num: "8",
    category: "dine",
    categoryNameAr: "مطاعم وتجارب طعام (Dine & Indulge)",
    nameAr: "مطعم لا ماما الإيطالي (La Mama Italian)",
    nameEn: "La Mama Italian Restaurant",
    tagAr: "بيتزا حطب، باستا فاخرة وأجواء رومانسية",
    hours: "18:30 - 22:30 (حجز مسبق)",
    locAr: "الجناح الشمالي الشرقي المطل على المسبح",
    descriptionAr: "بيتزا أصلية من أفران الحطب، باستا إيطالية طازجة محضرة يدوياً، وتشكيلة حلويات فاخرة.",
    coords: { x: 60.07, y: 39.55 },
    badgeColor: "bg-amber-600",
    canBookTable: true,
    image: "assets/images/la_mama.jpg",
    menuItems: [
      { name: "بيتزا تروفل وبورشيني نابوليتان", price: 240, desc: "جبن الموزاريلا الطازجة وفطر الكمأة في فرن الحطب", icon: "🍕" },
      { name: "مارجريتا دي بوفالا الكلاسيكية", price: 190, desc: "صلصة طماطم سان مارزانو، بوفالو وريحان طازج", icon: "🍕" },
      { name: "فيتوتشيني روبيان ألفريدو", price: 290, desc: "باستا يدوية مع الروبيان وصوص الكريمة الإيطالية", icon: "🍝" },
      { name: "تيراميسو ماسكاربوني كلاسيكي", price: 140, desc: "بسكويت سافوياردي مشبع بالقهوة الإيطالية", icon: "🍰" }
    ]
  },
  {
    id: "9",
    num: "9",
    category: "wellness",
    categoryNameAr: "صحة وأنشطة (Wellness & Activities)",
    nameAr: "النادي الصحي والسبا (Gym & Spa)",
    nameEn: "Wellness Gym & Spa Center",
    tagAr: "مساج، ساونا، حمام تركي وجيم مجهز",
    hours: "08:00 - 20:00",
    locAr: "مبنى الخدمات الملاصق للحدائق الوسطى",
    descriptionAr: "جلسات استرخاء ومساج تايلاندي وسويدي، حمام بخار وجاكوزي، وصالة تدريب بدني حديثة بإطلالة خضراء.",
    coords: { x: 57.5, y: 46.5 },
    badgeColor: "bg-teal-700",
    image: "assets/images/spa_wellness.jpg",
    menuItems: [
      { name: "جلسة مساج استرخائي بالأحجار الساخنة (60 دقيقة)", price: 850, desc: "أحجار بركانية ساخنة وزيوت عطرية لتخفيف التوتر", icon: "💆" },
      { name: "الحمام التركي التقليدي الكامل", price: 750, desc: "بخار، تقشير كيسة، وتدليك بالرغوة والصابون الطبيعي", icon: "🧖" },
      { name: "جلسة جاكوزي خاصة بالأعشاب الطبيعية", price: 450, desc: "مغطس مائي دافئ مع زيوت اللافندر والنعناع", icon: "🛁" }
    ]
  },
  {
    id: "10",
    num: "10",
    category: "wellness",
    categoryNameAr: "صحة وأنشطة (Wellness & Activities)",
    nameAr: "ملاعب التنس (Tennis Courts)",
    nameEn: "Pro Tennis Courts",
    tagAr: "ملاعب احترافية مضاءة مع مضارب مجانية",
    hours: "08:00 - 22:00",
    locAr: "الجناح الشرقي بجوار المبنى S",
    descriptionAr: "ملاعب أرضية صلبة مطابقة للمواصفات، تتوفر مضارب وكرات مجانية في مكتب الأنشطة، مع إمكانية حجز حصص تدريب.",
    coords: { x: 68.93, y: 61.04 },
    badgeColor: "bg-amber-500",
    image: "assets/images/tennis_courts.jpg"
  },
  {
    id: "11",
    num: "11",
    category: "relax",
    categoryNameAr: "استكشاف واسترخاء (Explore & Relax)",
    nameAr: "مسبح لوتس والبحيرة المركزية (Lotus Pool)",
    nameEn: "Lotus Pool & Central Lagoon",
    tagAr: "مسبح هادئ وبحيرة استجمام مع محطة مناشف",
    hours: "08:00 - 18:00 (حتى الغروب)",
    locAr: "قلب المنتجع محاط بالنخيل والحدائق",
    descriptionAr: "أكبر بحيرات المسبح بالمنتجع بمياه كريستالية متدرجة العمق، محاطة بأسرّة شمسية فاخرة ومحطة مناشف مجانية.",
    coords: { x: 69.17, y: 70.8 },
    badgeColor: "bg-blue-600",
    image: "assets/images/lotus_pool.jpg"
  },
  {
    id: "12",
    num: "12",
    category: "dine",
    categoryNameAr: "مطاعم وتجارب طعام (Dine & Indulge)",
    nameAr: "مطعم سيرينا الرئيسي (Sirena Restaurant)",
    nameEn: "Sirena International Buffet",
    tagAr: "بوفيه مفتوح ومحطات طهي حي يومياً",
    hours: "07:00-10:30 (إفطار) | 13:00-15:00 (غداء) | 19:00-22:00 (عشاء)",
    locAr: "المبنى الرئيسي مطل على حدائق اللوتس",
    descriptionAr: "المطعم الرئيسي للمنتجع يقدم أشهى الأطباق العالمية والمصرية مع محطات شواء حية وركن خاص للأطفال.",
    coords: { x: 52.79, y: 46.39 },
    badgeColor: "bg-emerald-600",
    image: "assets/images/sirena_buffet.jpg"
  },
  {
    id: "13",
    num: "13",
    category: "services",
    categoryNameAr: "مرافق وخدمات (Facilities & Services)",
    nameAr: "موقف السيارات 1 (Parking 1)",
    nameEn: "Parking Area 1",
    tagAr: "مواقف مجانية مؤمنة للنزلاء 24/7",
    hours: "متاح 24 ساعة",
    locAr: "الجهة الشمالية بجوار المبنى N",
    descriptionAr: "موقف سيارات مظلل وخاص بنزلاء الجناح الشمالي مزود بكاميرات مراقبة وحراسة أمنية دائمة.",
    coords: { x: 7.28, y: 60.55 },
    badgeColor: "bg-slate-700",
    image: "assets/images/resort_gate.jpg"
  },
  {
    id: "14",
    num: "14",
    category: "services",
    categoryNameAr: "المداخل والبوابات (Entrances)",
    nameAr: "البوابة الجانبية (Side Gate)",
    nameEn: "Resort Side Gate",
    tagAr: "مدخل جانبي قريب من المبنى التجاري",
    hours: "متاح 24 ساعة",
    locAr: "الركن الجنوبي الغربي للمنتجع",
    descriptionAr: "بوابة دخول وخروج جانبية للمشاة والسيارات تخدم منطقة المبنى التجاري MLS والمحلات.",
    coords: { x: 5.46, y: 86.91 },
    badgeColor: "bg-blue-800",
    image: "assets/images/resort_gate.jpg"
  },
  {
    id: "15",
    num: "15",
    category: "services",
    categoryNameAr: "مرافق وخدمات (Facilities & Services)",
    nameAr: "الصيدلية والعيادة الطبية (Pharmacy / Clinic)",
    nameEn: "Medical Clinic & 24/7 Pharmacy",
    tagAr: "طبيب مقيم ورعاية طبية طارئة 24 ساعة",
    hours: "متاح 24 ساعة (تحويلة داخلية 15)",
    locAr: "المدخل الرئيسي بجوار المسجد",
    descriptionAr: "عيادة طبية متكاملة بإشراف طبيب مقيم، أدوية سياحية وتجميلية، واقيات شمس ومستلزمات الأطفال.",
    coords: { x: 41.26, y: 87.4 },
    badgeColor: "bg-red-600",
    image: "assets/images/resort_clinic.jpg"
  },
  {
    id: "16",
    num: "16",
    category: "services",
    categoryNameAr: "مرافق وخدمات (Facilities & Services)",
    nameAr: "مسجد المنتجع (Resort Mosque)",
    nameEn: "Resort Mosque",
    tagAr: "مقام ومكيف لإقامة كافة الصلوات",
    hours: "مفتوح دائماً لجميع الصلوات",
    locAr: "بجوار العيادة والمركز التجاري",
    descriptionAr: "مسجد مكيف يتسع لـ 150 مصلي مع مصلى مخصص للسيدات ومكان وضوء مجهز ونظيف.",
    coords: { x: 47.57, y: 87.4 },
    badgeColor: "bg-emerald-700",
    image: "assets/images/resort_mosque.jpg"
  },
  {
    id: "17",
    num: "17",
    category: "services",
    categoryNameAr: "مرافق وخدمات (Facilities & Services)",
    nameAr: "موقف السيارات 2 (Parking 2)",
    nameEn: "Parking Area 2",
    tagAr: "مواقف مظللة بجوار البوابة الرئيسية",
    hours: "متاح 24 ساعة",
    locAr: "الجهة الجنوبية الشرقية بجوار المبنى S",
    descriptionAr: "موقف سيارات واسع يخدم الجناح الجنوبي والبوابة الرئيسية للمنتجع.",
    coords: { x: 67.35, y: 80.57 },
    badgeColor: "bg-slate-700",
    image: "assets/images/resort_gate.jpg"
  },
  {
    id: "18",
    num: "18",
    category: "services",
    categoryNameAr: "المداخل والبوابات (Entrances)",
    nameAr: "البوابة الرئيسية (Main Gate)",
    nameEn: "Resort Main Gate & Security",
    tagAr: "المدخل الرسمي للمنتجع واستقبال سيارات الليموزين",
    hours: "متاح 24 ساعة",
    locAr: "الواجهة الجنوبية الرئيسية للمنتجع",
    descriptionAr: "البوابة الرئيسية لاستقبال وصول النزلاء، خدمة صف السيارات (Valet)، وتنسيق سيارات الأجرة وليموزين المطار.",
    coords: { x: 69.78, y: 89.36 },
    badgeColor: "bg-red-700",
    image: "assets/images/resort_gate.jpg"
  },

  // Official Hotel Buildings from Map Directory
  {
    id: "N",
    num: "N",
    category: "buildings",
    categoryNameAr: "دليل المباني الفندقية (Building Directory)",
    nameAr: "المبنى الشمالي (North Building - Wing N)",
    nameEn: "North Building (Wing N)",
    tagAr: "الغرف: 1501-1548 (طابق 1) حتى 1901-1948 (طابق 5)",
    hours: "خدمة الغرف 24 ساعة",
    locAr: "الطرف الشمالي مطل على الأكوا بارك والشاطئ",
    descriptionAr: "أجنحة وغرف فندقية هادئة بإطلالات مباشرة على حدائق الأكوا بارك والبحر الأحمر. يضم 5 طوابق للنزلاء (من 1501 حتى 1948).",
    coords: { x: 22.45, y: 55.18 },
    badgeColor: "bg-cyan-600",
    isBuilding: true,
    image: "assets/images/luxury_room.jpg",
    rooms: [
      { min: 1501, max: 1548, floor: "الطابق الأول (Floor 1)" },
      { min: 1601, max: 1648, floor: "الطابق الثاني (Floor 2)" },
      { min: 1701, max: 1748, floor: "الطابق الثالث (Floor 3)" },
      { min: 1801, max: 1848, floor: "الطابق الرابع (Floor 4)" },
      { min: 1901, max: 1948, floor: "الطابق الخامس (Floor 5)" }
    ]
  },
  {
    id: "S",
    num: "S",
    category: "buildings",
    categoryNameAr: "دليل المباني الفندقية (Building Directory)",
    nameAr: "المبنى الجنوبي (South Building - Wing S)",
    nameEn: "South Building (Wing S)",
    tagAr: "الغرف: 2001-2016 (طابق 1) | 2101-2144 (طابق 2) | 2201-2244 (طابق 3) | 2301-2344 (طابق 4) | 2401-2444 (طابق 5)",
    hours: "خدمة الغرف 24 ساعة",
    locAr: "الطرف الشرقي مطل على مسبح لوتس وملاعب التنس",
    descriptionAr: "غرف فاخرة بإطلالات بانورامية على مسبح لوتس والواجهة الشاطئية الشرقية وملاعب التنس. يضم 5 طوابق للنزلاء (من 2001 حتى 2444).",
    coords: { x: 63.11, y: 54.2 },
    badgeColor: "bg-amber-500",
    isBuilding: true,
    image: "assets/images/luxury_room.jpg",
    rooms: [
      { min: 2001, max: 2016, floor: "الطابق الأول (Floor 1)" },
      { min: 2101, max: 2144, floor: "الطابق الثاني (Floor 2)" },
      { min: 2201, max: 2244, floor: "الطابق الثالث (Floor 3)" },
      { min: 2301, max: 2344, floor: "الطابق الرابع (Floor 4)" },
      { min: 2401, max: 2444, floor: "الطابق الخامس (Floor 5)" }
    ]
  },
  {
    id: "M",
    num: "M",
    category: "buildings",
    categoryNameAr: "دليل المباني الفندقية (Building Directory)",
    nameAr: "المبنى الرئيسي واللوبي (Main Building - Lobby M)",
    nameEn: "Main Building (Lobby Wing M)",
    tagAr: "الغرف: 1001-1020 (طابق 1) | 1101-1160 (طابق 2) | 1201-1260 (طابق 3)",
    hours: "الاستقبال والكونسيرج 24 ساعة",
    locAr: "قلب المنتجع بجوار اللوبي ومطعم سيرينا",
    descriptionAr: "المبنى المركزي الذي يحتضن بهو الاستقبال الرئيسي، مطعم سيرينا، الصالون التنفيذي، ومكاتب خدمة النزلاء.",
    coords: { x: 31.55, y: 68.36 },
    badgeColor: "bg-rose-700",
    isBuilding: true,
    image: "assets/images/resort_lobby.jpg",
    rooms: [
      { min: 1001, max: 1020, floor: "الطابق الأول (Floor 1)" },
      { min: 1101, max: 1160, floor: "الطابق الثاني (Floor 2)" },
      { min: 1201, max: 1260, floor: "الطابق الثالث (Floor 3)" }
    ]
  },
  {
    id: "MLS",
    num: "MLS",
    category: "buildings",
    categoryNameAr: "دليل المباني الفندقية (Building Directory)",
    nameAr: "المبنى التجاري (Commercial Building - MLS)",
    nameEn: "Commercial Complex (Wing MLS)",
    tagAr: "الغرف والمحلات: 2601-2654 (طابق 1) | 2701-2748 (طابق 2) | 2801-2848 (طابق 3) | 2901-2948 (طابق 4)",
    hours: "09:00 - 23:00",
    locAr: "المبنى الدائري الأيقوني بالركن الجنوبي الغربي",
    descriptionAr: "مجمع البازار والمحلات التجارية، محمص القهوة الإيطالية، مكاتب الرحلات السياحية وتأجير السيارات.",
    coords: { x: 18.2, y: 86.43 },
    badgeColor: "bg-emerald-600",
    isBuilding: true,
    image: "assets/images/resort_mall.jpg",
    rooms: [
      { min: 2601, max: 2654, floor: "الطابق الأول (Floor 1)" },
      { min: 2701, max: 2748, floor: "الطابق الثاني (Floor 2)" },
      { min: 2801, max: 2848, floor: "الطابق الثالث (Floor 3)" },
      { min: 2901, max: 2948, floor: "الطابق الرابع (Floor 4)" }
    ]
  }
];

// Hurghada Excursions & Marine Adventures
const resortExcursions = [
  {
    titleAr: "رحلة جزيرة جفتون والسنوركلينج باليخت",
    titleEn: "Giftun Island VIP Yacht Cruise",
    descAr: "رحلة بحرية يومية شاملة الغداء والمشروبات ومعدات السنوركلينج لمشاهدة الشعاب المرجانية والدلافين.",
    price: "35$ / فرد",
    duration: "08:30 ص - 04:30 م",
    icon: "🛥️",
    image: "assets/images/giftun_island.jpg"
  },
  {
    titleAr: "سفاري صحراء الغردقة والبيتش باجي",
    titleEn: "Desert Quad Safari & Bedouin Dinner",
    descAr: "مغامرة ركوب الدراجات الرباعية في صحراء البحر الأحمر ومشاهدة الغروب مع عشاء بدوي وشو شرقي.",
    price: "28$ / فرد",
    duration: "02:00 م - 07:30 م",
    icon: "🏜️",
    image: "assets/images/hero_resort.jpg"
  },
  {
    titleAr: "جولة الغواصة البحرية سندباد",
    titleEn: "Sindbad Submarine Deep Dive",
    descAr: "غوص حقيقي على عمق 22 متراً تحت سطح البحر الأحمر لمشاهدة الكائنات البحرية النادرة بأمان للأطفال والعائلات.",
    price: "40$ / فرد",
    duration: "ساعتان",
    icon: "🤿",
    image: "assets/images/diving_center.jpg"
  }
];

// Live Animation Activities
const dailyActivities = [
  { time: "10:30 ص", titleAr: "أكوا جيم وتمارين مائية في مسبح لوتس", titleEn: "Aqua Gym at Lotus Pool", loc: "Lotus Pool (11)", icon: "🏊" },
  { time: "11:45 ص", titleAr: "مسابقات الأكوا بارك المائية وتحدي الزلاجات", titleEn: "Kids Splash Challenge", loc: "Aqua Park (3)", icon: "💦" },
  { time: "04:30 م", titleAr: "بطولة الكرة الطائرة الشاطئية عند المارينا", titleEn: "Beach Volleyball Tourney", loc: "Beach Area (1)", icon: "🏐" },
  { time: "05:15 م", titleAr: "يوغا واسترخاء وقت الغروب على الشاطئ", titleEn: "Sunset Beach Yoga", loc: "Beach Bar (5)", icon: "🧘" },
  { time: "08:30 م", titleAr: "ميني ديسكو وفقرات استعراضية للأطفال", titleEn: "Kids Mini Disco Show", loc: "Main Stage (M)", icon: "🪩" },
  { time: "09:30 م", titleAr: "أمسية الفلكلور المصري والشو اللاتيني", titleEn: "Egyptian Folklore Gala", loc: "Amphitheater", icon: "🎭" }
];

// Fast Speed Dial Extensions
const resortExtensions = [
  { name: "الاستقبال واللوبي (Front Desk)", num: "0", desc: "خدمة النزلاء والاستفسارات 24 ساعة" },
  { name: "العيادة والطبيب المقيم (Clinic)", num: "15", desc: "طوارئ ورعاية طبية على مدار الساعة" },
  { name: "خدمة الغرف والأغذية (Room Service)", num: "120", desc: "طلب الطعام والمشروبات للغرف" },
  { name: "الإشراف الداخلي والمناشف (Housekeeping)", num: "130", desc: "تنظيف الغرف ومستلزمات الحمام" },
  { name: "النادي الصحي والسبا (Spa & Wellness)", num: "9", desc: "حجز جلسات المساج والحمام التركي" },
  { name: "مكتب الأنشطة والرحلات (Excursions)", num: "140", desc: "حجز رحلات اليخوت والغطس والسفاري" }
];

// Instant Offline Concierge FAQ Knowledge Base
const localFaqKb = [
  { keywords: ["واي فاي", "wifi", "انترنت", "باسورد", "password"], answer: "شبكة الواي فاي المجانية بالمنتجع هي 'Moreno Free' وكلمة المرور هي: Moreno@2026 وهي متاحة في جميع الغرف واللوبي والشاطئ." },
  { keywords: ["مواعيد", "وجبات", "اكل", "طعام", "فطار", "غدا", "عشا", "سيرينا", "buffet"], answer: "مواعيد بوفيه مطعم سيرينا الرئيسي: الإفطار من 07:00 حتى 10:30 صباحاً | الغداء من 13:00 حتى 15:00 عصراً | العشاء من 19:00 حتى 22:00 مساءً." },
  { keywords: ["اكوا بارك", "زحاليق", "العاب مائية", "aqua"], answer: "أكوا بارك مورينو (نقطة 3) تعمل يومياً على فترتين: الفترة الصباحية من 10:00 إلى 12:30 ظهراً، والفترة المسائية من 14:30 إلى 17:00 عصراً." },
  { keywords: ["عيادة", "دكتور", "طبيب", "صيدلية", "صداع", "clinic", "pharmacy"], answer: "العيادة الطبية والصيدلية (نقطة 15) متوفرة 24 ساعة قرب البوابة الرئيسية والمسجد، ويمكنك الاتصال بالطبيب المقيم مباشرة عبر تحويلة الغرفة (15)." },
  { keywords: ["مناشف", "كارت", "فوطة", "towel"], answer: "يمكنك استلام وتغيير مناشف الشاطئ والمسبح مجاناً بكارت المنشفة في محطة مسبح لوتس ومحطة الشاطئ من 08:00 صباحاً وحتى غروب الشمس." },
  { keywords: ["خروج", "مغادرة", "تسجيل خروج", "check out"], answer: "موعد تسجيل المغادرة (Check-out) الرسمي هو الساعة 12:00 ظهراً. لطلب مد الإقامة (Late Check-out) يرجى التنسيق مع مكتب الاستقبال الداخلي (0)." },
  { keywords: ["شامل", "all inclusive", "شامل كليا"], answer: "يشمل نظام الإقامة الشاملة: جميع الوجبات في بوفيه سيرينا، سناكس الشاطئ، المشروبات طوال اليوم، الأكوا بارك، مسبح لوتس، الجيم، وملاعب التنس مجاناً. المساج والسبا ورحلات الغوص برسوم إضافية." }
];

// Luxury Spa & Wellness Treatments Catalog
const resortSpaTreatments = [
  {
    id: "hot_stone",
    titleAr: "مساج الأحجار البركانية الساخنة (Hot Stone Therapy)",
    descAr: "أحجار بازلت دافئة مع زيوت عطرية لفك توتر العضلات وتجديد الطاقة الحيوية.",
    durations: [
      { min: 50, price: 850 },
      { min: 80, price: 1200 }
    ],
    icon: "💆"
  },
  {
    id: "turkish_bath",
    titleAr: "الحمام التركي الملكي التراثي (Sultan Turkish Hammam)",
    descAr: "غرفة بخار دافئة، تقشير كيسة بالصابون المغربي وزيت الغار، وتدليك بالرغوة الغنية.",
    durations: [
      { min: 60, price: 950 },
      { min: 90, price: 1350 }
    ],
    icon: "🧖"
  },
  {
    id: "aromatherapy",
    titleAr: "جلسة المساج السويدي والعلاج العطري (Aromatherapy Massage)",
    descAr: "تدليك كامل بزيوت اللافندر والنعناع العطرية المهدئة للأعصاب مع تدليك فروة الرأس.",
    durations: [
      { min: 45, price: 700 },
      { min: 60, price: 900 }
    ],
    icon: "🌸"
  },
  {
    id: "private_jacuzzi",
    titleAr: "جلسة الجاكوزي الخاصة بالأعشاب وأملاح البحر الأحمر",
    descAr: "مغطس مائي دافئ خاص بالأعشاب الطبيعية وأملاح البحر الأحمر لتنشيط الدورة الدموية.",
    durations: [
      { min: 40, price: 500 }
    ],
    icon: "🛁"
  }
];

// Cinematic Auto-Tour Route Stops
const cinematicTourSteps = [
  {
    poiId: "1",
    titleAr: "منطقة الشاطئ والمارينا الخاصة",
    descAr: "شاطئ رملي ناعم برصيف يخوت ممتد داخل البحر الأحمر، مياه فيروزية صافية مثالية للسباحة والسنوركلينج.",
    zoom: 1.55
  },
  {
    poiId: "3",
    titleAr: "أكوا بارك مورينو للألعاب المائية",
    descAr: "مجمع الزلاجات والألعاب المائية الشيقة المخصصة لجميع أفراد الأسرة مع برك سباحة آمنة ومراقبة.",
    zoom: 1.55
  },
  {
    poiId: "8",
    titleAr: "مطعم لا ماما الإيطالي الفاخر",
    descAr: "أشهى أطباق البيتزا النابوليتان من أفران الحطب، الباستا الطازجة، وتجربة طعام راقية على ضوء الشموع.",
    zoom: 1.55
  },
  {
    poiId: "9",
    titleAr: "النادي الصحي والسبا الملكي",
    descAr: "ملاذك الخاص للاسترخاء التام؛ حمام تركي، غرف ساونا، جلسات مساج تايلاندي وسويدي، وجيم متطور.",
    zoom: 1.55
  },
  {
    poiId: "11",
    titleAr: "مسبح لوتس والبحيرة المركزية",
    descAr: "أكبر بحيرات المسبح الهادئة في قلب المنتجع، محاطة بالنخيل وأسرّة الاستلقاء الفاخرة ومحطة المناشف.",
    zoom: 1.55
  },
  {
    poiId: "M",
    titleAr: "المبنى الرئيسي واللوبي الفاخر",
    descAr: "بهو الاستقبال الملكي، مكاتب الكونسيرج 24/7، مطعم سيرينا البوفيه المفتوح، وبوابتك لبدء إقامة استثنائية.",
    zoom: 1.55
  }
];

// High-Definition Cinematic Promo Video Scenes (8 Multi-Language Interactive Scenes)
const promoVideoScenes = [
  {
    id: "welcome",
    tagAr: "مرحباً بكم في الغردقة",
    tagEn: "Welcome to Hurghada",
    tagRu: "Добро пожаловать в Хургаду",
    tagDe: "Willkommen in Hurghada",
    titleAr: "منتجع مورينو هورايزون سبا & ريزورت",
    titleEn: "Moreno Horizon Spa & Resort",
    titleRu: "Moreno Horizon Spa & Resort",
    titleDe: "Moreno Horizon Spa & Resort",
    descAr: "واحتك الساحلية ذات الخمس نجوم على ساحل البحر الأحمر الساحر. مزيج متناغم من الفخامة، والضيافة المصرية الأصيلة، والإطلالات البانورامية الخلابة.",
    descEn: "Your 5-star coastal sanctuary on the stunning Red Sea shore. A harmonious blend of luxury, authentic Egyptian hospitality, and breathtaking panoramic views.",
    descRu: "Ваш 5-звездочный прибрежный оазис на великолепном побережье Красного моря. Гармония роскоши, гостеприимства и захватывающих видов.",
    descDe: "Ihr 5-Sterne-Refugium an der atemberaubenden Küste des Roten Meeres. Luxus, authentische Gastfreundschaft und Panoramablick.",
    image: "assets/images/hero_resort.jpg",
    badge: "🌟 5-Star Luxury Resort",
    poiId: "M",
    duration: 6500
  },
  {
    id: "beach",
    tagAr: "الشاطئ والمارينا الخاصة",
    tagEn: "Private Beach & Marina",
    tagRu: "Частный пляж и марина",
    tagDe: "Privatstrand & Marina",
    titleAr: "مياه فيروزية كريستالية وشعاب مرجانية",
    titleEn: "Crystal Azure Waters & Coral Reefs",
    titleRu: "Кристально чистые бирюзовые воды",
    titleDe: "Kristallklares Wasser & Korallenriffe",
    descAr: "شاطئ رملي ناعم ممتد مع رصيف يخوت خاص يتيح لك السباحة والغطس واستكشاف أندر الشعاب المرجانية والأسماك الملونة مباشرة من رصيف الفندق.",
    descEn: "Pristine sandy beach with a private yacht pier for swimming, snorkeling, and discovering the Red Sea's most vibrant coral reefs directly from our jetty.",
    descRu: "Золотой песчаный пляж с собственным пирсом для яхт, снорклинга и исследования коралловых рифов прямо у берега.",
    descDe: "Unberührter Sandstrand mit eigenem Bootssteg zum Schwimmen und Schnorcheln an farbenprächtigen Korallenriffen.",
    image: "assets/images/beach_marina.jpg",
    badge: "🏖️ Red Sea Snorkeling Haven",
    poiId: "1",
    duration: 6500
  },
  {
    id: "aquapark",
    tagAr: "الألعاب المائية والمسابح",
    tagEn: "Aqua Park & Lagoon Pools",
    tagRu: "Аквапарк и бассейны",
    tagDe: "Wasserpark & Lagunenpools",
    titleAr: "أكوا بارك مورينو ومسبح لوتس المركزي",
    titleEn: "Moreno Aqua Park & Lotus Lagoon Pool",
    titleRu: "Аквапарк Moreno и бассейн Lotus",
    titleDe: "Moreno Aqua Park & Lotus Pool",
    descAr: "مغامرات شيقة وزلاجات مائية عملاقة تناسب الكبار والأطفال، محاطة ببحيرات السباحة الفيروزية ومسبح لوتس الدافئ مع كبائن الاسترخاء وبار المسبح.",
    descEn: "Thrilling mega water slides for all ages, surrounded by sprawling lagoon pools, the heated Lotus central pool, luxury loungers, and swim-up pool bars.",
    descRu: "Захватывающие водные горки для всех возрастов, лагунные бассейны с подогревом, шезлонги и бар прямо в воде.",
    descDe: "Spannende Wasserrutschen für jedes Alter, weitläufige Lagunenpools und beheizter Lotus-Pool mit Swim-up-Bar.",
    image: "assets/images/aquapark_pool.jpg",
    badge: "💦 Mega Family Waterpark",
    poiId: "3",
    duration: 6500
  },
  {
    id: "dining",
    tagAr: "المطاعم وتجارب الطهي",
    tagEn: "Gourmet Dining & Culinary",
    tagRu: "Изысканные рестораны",
    tagDe: "Gourmet-Restaurants",
    titleAr: "رحلة نكهات استثنائية حول العالم",
    titleEn: "An Exquisite Global Gastronomic Journey",
    titleRu: "Изысканное кулинарное путешествие",
    titleDe: "Eine exquisite gastronomische Weltreise",
    descAr: "من بوفيه مطعم سيرينا المفتوح بأصنافه الشرقية والغربية، إلى مطعم لا ماما الإيطالي ببيتزا الحطب الطازجة والباستا اليدوية، وصولاً لأشهى المأكولات البحرية على الشاطئ.",
    descEn: "Savor gourmet delights from Serena's international open buffet, La Mamma's wood-fired Neapolitan pizza and artisan pasta, to fresh Red Sea seafood grilled to perfection.",
    descRu: "Открытый буфет Serena, итальянский ресторан La Mamma с дровяной печью и свежие морепродукты на гриле у моря.",
    descDe: "Internationales Buffet Serena, italienische Spezialitäten im La Mamma und fangfrische Meeresfrüchte direkt am Strand.",
    image: "assets/images/la_mama.jpg",
    badge: "🍽️ World-Class Cuisines",
    poiId: "8",
    duration: 6500
  },
  {
    id: "spa",
    tagAr: "السبا والعافية الملكية",
    tagEn: "Horus Royal Spa & Wellness",
    tagRu: "Королевский спа-центр Horus",
    tagDe: "Horus Royal Spa & Wellness",
    titleAr: "استرخاء مطلق وتجدد للحواس",
    titleEn: "Pure Rejuvenation for Mind & Body",
    titleRu: "Полное расслабление и оздоровление",
    titleDe: "Reine Entspannung für Körper & Geist",
    descAr: "دلل نفسك في النادي الصحي والسبا الملكي؛ حمام تركي تقليدي، ساونا وبخار، جلسات مساج فرعوني وزيوت عطرية نادرة تعيد لجسمك الحيوية والنشاط.",
    descEn: "Indulge in our Horus Royal Spa: traditional Turkish hammam, sauna, steam rooms, and ancient Egyptian aromatherapy massages designed for ultimate revitalization.",
    descRu: "Традиционный турецкий хаммам, сауна, джакузи и расслабляющий массаж с натуральными аромамаслами.",
    descDe: "Traditionelles türkisches Hamam, Sauna, Dampfbäder und luxuriöse Massagebehandlungen mit aromatischen Ölen.",
    image: "assets/images/spa_wellness.jpg",
    badge: "💆 Serene Wellness Sanctuary",
    poiId: "9",
    duration: 6500
  },
  {
    id: "rooms",
    tagAr: "الغرف والأجنحة الفاخرة",
    tagEn: "Luxury Rooms & Suites",
    tagRu: "Роскошные номера и люксы",
    tagDe: "Luxuszimmer & Suiten",
    titleAr: "إقامة ملكية وإطلالات ساحلية ساحرة",
    titleEn: "Royal Comfort & Panoramic Red Sea Vistas",
    titleRu: "Королевский комфорт и панорамный вид на море",
    titleDe: "Königlicher Komfort & Panoramablick aufs Rote Meer",
    descAr: "غرف وأجنحة فندقية فسيحة بتصميم عصري راقٍ، مفروشات قطنية مصرية فاخرة، شرفات خاصة تطل على غروب البحر الأحمر، وخدمة غرف ذكية على مدار الساعة.",
    descEn: "Spacious rooms and signature suites with contemporary decor, premium Egyptian linens, private sea-facing balconies, and 24/7 smart in-room dining services.",
    descRu: "Просторные номера с панорамными балконами с видом на море, египетским хлопком и круглосуточным обслуживанием.",
    descDe: "Geräumige Zimmer mit privatem Balkon mit Meerblick, feinsten Stoffen und 24/7 Smart-Zimmerservice.",
    image: "assets/images/luxury_room.jpg",
    badge: "🛏️ Panoramic Sea-View Suites",
    poiId: "N",
    duration: 6500
  },
  {
    id: "entertainment",
    tagAr: "الفعاليات والحياة الليلية",
    tagEn: "Live Shows & Nightlife",
    tagRu: "Вечерние шоу и развлечения",
    tagDe: "Live-Shows & Nachtleben",
    titleAr: "ليالي استعراضية وعروض فلكلورية حية",
    titleEn: "Electrifying Live Shows & Sunset Beats",
    titleRu: "Яркие шоу-программы и живая музыка",
    titleDe: "Spektakuläre Abendshows & Live-Musik",
    descAr: "أجواء احتفالية يومية؛ عروض الرقص الشرقي والفلكلور المصري، عروض النار المبهرة بالمسرح الروماني المفتوح، حفلات الشاطئ الليلية، وموسيقى الساكسفون الحية.",
    descEn: "Vibrant daily entertainment: spectacular oriental folklore, fire dancers at the open-air poolside amphitheater, beach lounge parties, and live sunset saxophone.",
    descRu: "Восточные танцы, фаер-шоу у бассейна в амфитеатре, пляжные вечеринки и живая музыка каждый вечер.",
    descDe: "Orientalische Folklore, Feuershows am Pool, Strandpartys und Live-Saxophonmusik bei Sonnenuntergang.",
    image: "assets/images/night_show.jpg",
    badge: "🎭 Dazzling Night Entertainment",
    poiId: "6",
    duration: 6500
  },
  {
    id: "interactive_guide",
    tagAr: "الدليل التفاعلي الذكي",
    tagEn: "Smart Interactive Guide",
    tagRu: "Интерактивный умный гид",
    tagDe: "Interaktiver smarter Guide",
    titleAr: "كل خدمات المنتجع بين يديك 24/7",
    titleEn: "The Entire Resort at Your Fingertips 24/7",
    titleRu: "Все сервисы отеля у вас под рукой 24/7",
    titleDe: "Das gesamte Resort griffbereit rund um die Uhr",
    descAr: "خريطة تفاعلية ثلاثية الأبعاد، تحديد مسار غرفتك بالذكاء الاصطناعي، حجز فوري للمطاعم والسبا، وقوائم الطعام بلمسة واحدة. عطلة أحلامك تبدأ الآن!",
    descEn: "Explore our real 3D aerial resort map, pinpoint your room route via AI Wayfinder, book gourmet dining and spa sessions, and enjoy seamless personalized hospitality.",
    descRu: "3D-карта отеля, умная навигация до номера, бронирование столиков и спа в один клик. Отдых вашей мечты начинается здесь!",
    descDe: "3D-Resortkarte, KI-Wegweiser zum Zimmer, Tisch- und Spa-Buchungen mit einem Klick. Ihr Traumurlaub beginnt jetzt!",
    image: "assets/images/hero_resort.jpg",
    badge: "✨ Your Ultimate Red Sea Getaway",
    poiId: "all",
    duration: 7500
  }
];

// Hurghada Official Prayer Times (GPS-calculated for Hurghada 27.2579° N, 33.8116° E)
const hurghadaPrayerSchedule = [
  { nameAr: "الفجر (Fajr)", time: "04:18 ص", icon: "🌌" },
  { nameAr: "الشروق (Sunrise)", time: "05:38 ص", icon: "🌅" },
  { nameAr: "الظهر (Dhuhr)", time: "11:46 ص", icon: "☀️" },
  { nameAr: "العصر (Asr)", time: "03:12 م", icon: "🌤️" },
  { nameAr: "المغرب (Maghrib)", time: "05:54 م", icon: "🌇" },
  { nameAr: "العشاء (Isha)", time: "07:10 م", icon: "🌙" }
];



/**
 * Generates Turn-by-Turn step-by-step navigation directions
 * between origin and destination with step coordinates and accessibility info.
 */
function generateTurnByTurnSteps(originPoi, targetPoi, lang = 'ar', isStepFree = false) {
  const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;
  const locTarget = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(targetPoi, lang) : { name: targetPoi.nameAr };
  const locOrigin = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(originPoi, lang) : { name: originPoi.nameAr || 'الموقع الحالي' };

  // Coordinates
  const x1 = originPoi.coords.x;
  const y1 = originPoi.coords.y;
  const x2 = targetPoi.coords.x;
  const y2 = targetPoi.coords.y;

  // Intermediate points
  const midX = (x1 + x2) / 2 + (x2 > x1 ? -3 : 3);
  const midY = (y1 + y2) / 2 + (y2 > y1 ? -3 : 3);

  const steps = [];

  // Step 1: Start
  if (lang === 'ar') {
    steps.push({
      stepNum: 1,
      icon: "🚶‍♂️",
      coords: { x: x1, y: y1 },
      title: `انطلق من [${locOrigin.name}]`,
      instruction: isStepFree
        ? `تحرك عبر الممشى الممهد المنبسط المخصص لعربات الأطفال والكراسي المتحركة باتجاه الممشى الرئيسي المظلل.`
        : `تحرك مباشرة باتجاه الممشى الرئيسي المظلل وتجاوز الساحات المفتوحة.`
    });
  } else if (lang === 'ru') {
    steps.push({
      stepNum: 1,
      icon: "🚶‍♂️",
      coords: { x: x1, y: y1 },
      title: `Начните движение от [${locOrigin.name}]`,
      instruction: isStepFree
        ? `Двигайтесь по пологой дорожке для колясок в сторону главной тенистой аллеи.`
        : `Следуйте прямо по тенистой аллее через открытые террасы.`
    });
  } else if (lang === 'de') {
    steps.push({
      stepNum: 1,
      icon: "🚶‍♂️",
      coords: { x: x1, y: y1 },
      title: `Starten Sie bei [${locOrigin.name}]`,
      instruction: isStepFree
        ? `Folgen Sie dem stufenfreien barrierefreien Weg in Richtung der schattigen Hauptpromenade.`
        : `Gehen Sie geradeaus über die schattige Promenade in Richtung Hauptbereich.`
    });
  } else {
    steps.push({
      stepNum: 1,
      icon: "🚶‍♂️",
      coords: { x: x1, y: y1 },
      title: `Start from [${locOrigin.name}]`,
      instruction: isStepFree
        ? `Proceed along the smooth step-free ramp pathway toward the shaded central promenade.`
        : `Head straight along the shaded garden walkway past the open terrace.`
    });
  }

  // Step 2: Midway guidance
  if (lang === 'ar') {
    steps.push({
      stepNum: 2,
      icon: x2 > x1 ? "↗️" : "↖️",
      coords: { x: midX, y: midY },
      title: `متابعة السير بمحاذاة الممرات المائية والحدائق`,
      instruction: isStepFree
        ? `استمر للأمام وتجاوز المنحدر الآمن بجوار المسابح والحدائق (المسار خالي تماماً من السلالم).`
        : `استمر للأمام بمحاذاة منطقة المسابح واستمتع بنوافير المياه وأشجار النخيل.`
    });
  } else if (lang === 'ru') {
    steps.push({
      stepNum: 2,
      icon: x2 > x1 ? "↗️" : "↖️",
      coords: { x: midX, y: midY },
      title: `Продолжайте путь вдоль бассейнов и садов`,
      instruction: isStepFree
        ? `Двигайтесь по безопасному пандусу мимо бассейнов (без ступенек).`
        : `Идите вперед вдоль зоны бассейнов, наслаждаясь пальмовыми аллеями.`
    });
  } else if (lang === 'de') {
    steps.push({
      stepNum: 2,
      icon: x2 > x1 ? "↗️" : "↖️",
      coords: { x: midX, y: midY },
      title: `Weiter entlang der Pools und Gartenwege`,
      instruction: isStepFree
        ? `Folgen Sie der sanften Rampe an den Pools vorbei (vollständig stufenfrei).`
        : `Gehen Sie geradeaus an den Swimmingpools und Palmen entlang.`
    });
  } else {
    steps.push({
      stepNum: 2,
      icon: x2 > x1 ? "↗️" : "↖️",
      coords: { x: midX, y: midY },
      title: `Continue along the poolside gardens`,
      instruction: isStepFree
        ? `Follow the gentle ramp path around the pool decks (fully accessible, zero steps).`
        : `Walk straight along the poolside promenade enjoying the tropical palm trees.`
    });
  }

  // Step 3: Turn & Approach
  const nearDestX = midX + (x2 - midX) * 0.7;
  const nearDestY = midY + (y2 - midY) * 0.7;
  if (lang === 'ar') {
    steps.push({
      stepNum: 3,
      icon: "🎯",
      coords: { x: nearDestX, y: nearDestY },
      title: `الاقتراب من مدخل [${locTarget.name}]`,
      instruction: `ستشاهد لافتة الوجهة بوضوح على بعد 15 متراً أمامك.`
    });
  } else if (lang === 'ru') {
    steps.push({
      stepNum: 3,
      icon: "🎯",
      coords: { x: nearDestX, y: nearDestY },
      title: `Приближение к [${locTarget.name}]`,
      instruction: `Вы увидите вход и вывеску через 15 метров прямо перед вами.`
    });
  } else if (lang === 'de') {
    steps.push({
      stepNum: 3,
      icon: "🎯",
      coords: { x: nearDestX, y: nearDestY },
      title: `Annäherung an [${locTarget.name}]`,
      instruction: `Sie sehen das Schild und den Eingang in ca. 15 Metern vor sich.`
    });
  } else {
    steps.push({
      stepNum: 3,
      icon: "🎯",
      coords: { x: nearDestX, y: nearDestY },
      title: `Approaching [${locTarget.name}]`,
      instruction: `You will clearly see the entrance signage 15 meters ahead.`
    });
  }

  // Step 4: Arrived
  if (lang === 'ar') {
    steps.push({
      stepNum: 4,
      icon: "🎉",
      coords: { x: x2, y: y2 },
      title: `وصلت إلى وجهتك [${locTarget.name}]`,
      instruction: `أهلاً بك! لقد وصلت بنجاح إلى وجهتك. نرجو لك قضاء أمتع الأوقات.`
    });
  } else if (lang === 'ru') {
    steps.push({
      stepNum: 4,
      icon: "🎉",
      coords: { x: x2, y: y2 },
      title: `Вы прибыли в [${locTarget.name}]`,
      instruction: `Добро пожаловать! Вы успешно добрались до цели. Приятного отдыха!`
    });
  } else if (lang === 'de') {
    steps.push({
      stepNum: 4,
      icon: "🎉",
      coords: { x: x2, y: y2 },
      title: `Ziel erreicht: [${locTarget.name}]`,
      instruction: `Herzlich willkommen! Sie haben Ihr Ziel erreicht. Wir wünschen Ihnen eine wunderbare Zeit!`
    });
  } else {
    steps.push({
      stepNum: 4,
      icon: "🎉",
      coords: { x: x2, y: y2 },
      title: `Arrived at [${locTarget.name}]`,
      instruction: `Welcome! You have reached your destination. Enjoy your time!`
    });
  }

  return steps;
}
