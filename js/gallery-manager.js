/**
 * Moreno Horizon Spa & Resort - Gallery & Promo Video Manager
 * Full Interactive Photo Gallery + Lightbox Viewer + 4K Cinema Stories Player
 */
(function (root) {
  'use strict';

  // ==========================================
  // Real Resort Photography Dataset (49 Photos)
  // ==========================================
  const RESORT_PHOTOS = [
    // Premier Landmark Highlights
    { src: 'assets/images/hero_resort.jpg', category: 'beach', titleAr: 'بانوراما شاطئ البحر الأحمر والمنتجع', titleEn: 'Red Sea Panoramic Resort View', captionAr: 'إطلالة جوية ساحرة على مياه البحر الصافية ومرافق مورينو الفاخرة' },
    { src: 'assets/images/resort_lobby.jpg', category: 'rooms', titleAr: 'بهو الاستقبال الملكي (Lobby)', titleEn: 'Grand Royal Lobby', captionAr: 'أجواء الترحيب والضيافة المصرية الأصيلة على مدار 24 ساعة' },
    { src: 'assets/images/lotus_pool.jpg', category: 'pools', titleAr: 'مسبح لوتس بول الفيروزي', titleEn: 'Lotus Turquoise Pool', captionAr: 'استرخاء متكامل تحت شمس الغردقة مع كراسي التشميس المريحة' },
    { src: 'assets/images/aquapark_pool.jpg', category: 'pools', titleAr: 'الأكوا بارك والألعاب المائية', titleEn: 'Giant Aqua Park & Water Slides', captionAr: 'منزلقات مائية ضخمة وألعاب ترفيهية تناسب جميع أفراد العائلة' },
    { src: 'assets/images/sirena_buffet.jpg', category: 'dining', titleAr: 'المطعم الرئيسي سيرينا (Sirena)', titleEn: 'Sirena Main Buffet Restaurant', captionAr: 'تشكيلة بوفيه مفتوح يومية من أشهى المأكولات العالمية والشرقية' },
    { src: 'assets/images/la_mama.jpg', category: 'dining', titleAr: 'مطعم لا ماما الإيطالي', titleEn: 'La Mama Italian Restaurant', captionAr: 'أشهى أطباق البيتزا والباستا الطازجة في أجواء إيطالية ساحرة' },
    { src: 'assets/images/beach_bar.jpg', category: 'dining', titleAr: 'بار الشاطئ وسناكس بيتش', titleEn: 'Beach Bar & Refreshing Snacks', captionAr: 'مشروبات وكوكتيلات مثلجة وسناكس خفيفة مباشرة على رمال البحر' },
    { src: 'assets/images/beach_marina.jpg', category: 'beach', titleAr: 'المارينا وممشى البحر الخاص', titleEn: 'Private Sea Marina & Promenade', captionAr: 'ممشى بحري هادئ لغروب الشمس وانطلاق الرحلات البحرية واليخوت' },
    { src: 'assets/images/spa_wellness.jpg', category: 'spa', titleAr: 'مركز السبا والاستجمام (Spa & Wellness)', titleEn: 'Luxury Spa & Wellness Sanctuary', captionAr: 'جلسات مساج، ساونا، جاكوزي، وحمام بخار لتجديد الحيوية والنشاط' },
    { src: 'assets/images/luxury_room.jpg', category: 'rooms', titleAr: 'الغرف والأجنحة الفندقية الفاخرة', titleEn: 'Luxury Resort Guest Rooms & Suites', captionAr: 'تصميم عصري راقٍ مع شرفات مطلة وتجهيزات فندقية خمس نجوم' },
    { src: 'assets/images/diving_center.jpg', category: 'beach', titleAr: 'مركز الغوص والرياضات البحرية', titleEn: 'PADI Diving Center & Water Sports', captionAr: 'رحلات غوص واستكشاف أندر الشعاب المرجانية والأسماك الملونة' },
    { src: 'assets/images/kids_club.jpg', category: 'entertainment', titleAr: 'نادي الأطفال الترفيهي', titleEn: 'Kids Club & Entertainment', captionAr: 'أنشطة ترفيهية وألعاب آمنة ومسابقات يومية بإشراف فريق متخصص' },
    { src: 'assets/images/night_show.jpg', category: 'entertainment', titleAr: 'المسرح والعروض الليلية', titleEn: 'Evening Amphitheater Shows', captionAr: 'عروض فنية استعراضية وموسيقى حية وفقرات ممتعة كل مساء' },
    { src: 'assets/images/oriental_grill.jpg', category: 'dining', titleAr: 'المشويات الشرقية والجلسات البدوية', titleEn: 'Oriental Grill & Bedouin Evenings', captionAr: 'نكهات المشويات الشرقية الشهية مع إطلالة مسائية مميزة' }
  ];

  // Dynamically add the 35 verified gallery collection photos
  for (let i = 1; i <= 35; i++) {
    const pad = String(i).padStart(2, '0');
    let cat = 'beach';
    let title = `لقطة حصرية من مورينو هورايزون #${i}`;
    let titleEn = `Exclusive Moreno Horizon Capture #${i}`;
    if (i >= 8 && i <= 15) {
      cat = 'pools';
      title = `المسابح وأجواء الاستجمام #${i}`;
      titleEn = `Pools & Relaxation Ambience #${i}`;
    } else if (i >= 16 && i <= 23) {
      cat = 'dining';
      title = `تجارب الضيافة والمطاعم #${i}`;
      titleEn = `Dining & Culinary Experience #${i}`;
    } else if (i >= 24 && i <= 30) {
      cat = 'rooms';
      title = `الأجنحة والغرف الفندقية #${i}`;
      titleEn = `Resort Suites & Accommodations #${i}`;
    } else if (i >= 31) {
      cat = 'spa';
      title = `السبا والهدوء والاسترخاء #${i}`;
      titleEn = `Spa, Wellness & Serenity #${i}`;
    }

    RESORT_PHOTOS.push({
      src: `assets/images/gallery/gallery-${pad}.jpg`,
      category: cat,
      titleAr: title,
      titleEn: titleEn,
      captionAr: 'لقطة وثائقية تجسد فخامة الطبيعة وجمال الضيافة في منتجع مورينو هورايزون الغردقة'
    });
  }

  // ==========================================
  // Gallery Manager Engine
  // ==========================================
  const GalleryManager = {
    photos: RESORT_PHOTOS,
    filteredPhotos: RESORT_PHOTOS,
    currentCategory: 'all',
    lightboxIndex: 0,
    isOpen: false,

    init() {
      // Bind keyboard events for lightbox
      window.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('galleryLightboxModal');
        if (lightbox && !lightbox.classList.contains('hidden')) {
          if (e.key === 'Escape') this.closeLightbox();
          if (e.key === 'ArrowRight') this.nextLightbox();
          if (e.key === 'ArrowLeft') this.prevLightbox();
        }
      });
    },

    open(category = 'all') {
      this.isOpen = true;
      this.currentCategory = category;
      const modal = document.getElementById('resortGalleryModal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      this.filter(category);

      if (typeof App !== 'undefined' && App.playBeep) {
        App.playBeep(600, 80);
      }
    },

    close() {
      this.isOpen = false;
      const modal = document.getElementById('resortGalleryModal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      this.closeLightbox();
    },

    filter(category) {
      this.currentCategory = category;

      // Update active tab styles
      const filterBar = document.getElementById('galleryFilterBar');
      if (filterBar) {
        filterBar.querySelectorAll('.gallery-tab-btn').forEach((btn) => {
          const btnCat = btn.getAttribute('data-category');
          if (btnCat === category) {
            btn.classList.add('active', 'bg-amber-500', 'text-slate-950', 'border-amber-400', 'shadow-sm');
            btn.classList.remove('text-slate-600', 'dark:text-slate-300', 'bg-slate-100', 'dark:bg-slate-800');
          } else {
            btn.classList.remove('active', 'bg-amber-500', 'text-slate-950', 'border-amber-400', 'shadow-sm');
            btn.classList.add('text-slate-600', 'dark:text-slate-300', 'bg-slate-100', 'dark:bg-slate-800');
          }
        });
      }

      // Filter photos
      if (category === 'all') {
        this.filteredPhotos = this.photos;
      } else {
        this.filteredPhotos = this.photos.filter((p) => p.category === category);
      }

      this.renderGrid();
    },

    renderGrid() {
      const grid = document.getElementById('galleryPhotoGrid');
      if (!grid) return;

      const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
      grid.innerHTML = '';

      if (this.filteredPhotos.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400">
            <span class="text-3xl block mb-2">📷</span>
            <p class="text-sm font-bold">لا توجد صور متطابقة في هذا القسم حالياً</p>
          </div>
        `;
        return;
      }

      const fragment = document.createDocumentFragment();

      this.filteredPhotos.forEach((photo, idx) => {
        const title = lang === 'ar' ? photo.titleAr : photo.titleEn;
        const card = document.createElement('div');
        card.className = 'gallery-card group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md cursor-pointer aspect-4/3';
        card.setAttribute('onclick', `GalleryManager.openLightbox(${idx})`);

        card.innerHTML = `
          <img
            src="${photo.src}"
            alt="${title}"
            loading="lazy"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
            <h4 class="text-xs sm:text-sm font-black truncate">${title}</h4>
            <span class="text-[10px] text-amber-300 font-bold mt-0.5 flex items-center gap-1">
              <span>🔍</span> انقر للمعاينة بحجم كامل
            </span>
          </div>
          <div class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-white/10 pointer-events-none">
            #${idx + 1}
          </div>
        `;

        fragment.appendChild(card);
      });

      grid.appendChild(fragment);
    },

    openLightbox(index) {
      if (index < 0 || index >= this.filteredPhotos.length) return;
      this.lightboxIndex = index;

      const photo = this.filteredPhotos[index];
      const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
      const title = lang === 'ar' ? photo.titleAr : photo.titleEn;

      const lightbox = document.getElementById('galleryLightboxModal');
      const mainImg = document.getElementById('lightboxMainImg');
      const counter = document.getElementById('lightboxCounter');
      const titleEl = document.getElementById('lightboxTitle');
      const captionTitle = document.getElementById('lightboxCaptionTitle');
      const captionDesc = document.getElementById('lightboxCaptionDesc');

      if (lightbox && mainImg) {
        mainImg.src = photo.src;
        mainImg.alt = title;
        if (counter) counter.textContent = `${index + 1} / ${this.filteredPhotos.length}`;
        if (titleEl) titleEl.textContent = title;
        if (captionTitle) captionTitle.textContent = title;
        if (captionDesc) captionDesc.textContent = photo.captionAr || '';

        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
      }

      if (typeof App !== 'undefined' && App.playBeep) {
        App.playBeep(700, 60);
      }
    },

    closeLightbox() {
      const lightbox = document.getElementById('galleryLightboxModal');
      if (lightbox) {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
      }
    },

    nextLightbox() {
      const next = (this.lightboxIndex + 1) % this.filteredPhotos.length;
      this.openLightbox(next);
    },

    prevLightbox() {
      const prev = (this.lightboxIndex - 1 + this.filteredPhotos.length) % this.filteredPhotos.length;
      this.openLightbox(prev);
    }
  };

  // ==========================================
  // 4K Cinema Stories Player Engine (PromoVideoPlayer)
  // ==========================================
  const PROMO_SCENES = [
    {
      img: 'assets/images/hero_resort.jpg',
      badge: '🌟 5-Star Coastal Sanctuary',
      title: 'منتجع مورينو هورايزون سبا & ريزورت',
      desc: 'واحتك الساحلية ذات الخمس نجوم على ساحل البحر الأحمر الساحر. مزيج متناغم من الفخامة، والضيافة المصرية الأصيلة، والإطلالات البانورامية الخلابة.',
      poiId: 'M'
    },
    {
      img: 'assets/images/resort_lobby.jpg',
      badge: '👑 Royal Arrival & 24/7 Concierge',
      title: 'البهو الملكي وخدمة النزلاء المتميزة',
      desc: 'تجربة استقبال استثنائية تعكس أصول الضيافة الفاخرة مع أطقم متخصصة لتلبية كافة رغباتك وتيسير إقامتك لحظة بلحظة.',
      poiId: 'M'
    },
    {
      img: 'assets/images/lotus_pool.jpg',
      badge: '🏊 Sparkling Lagoon & Lotus Pools',
      title: 'مسابح لوتس الفيروزية الساحرة',
      desc: 'استمتع بالسباحة والاسترخاء في مياه لوتس الصافية المحاطة بأشجار النخيل وأرقى جلسات التشميس المريحة تحت أشعة الشمس الذهبية.',
      poiId: '11'
    },
    {
      img: 'assets/images/aquapark_pool.jpg',
      badge: '🛝 World of Family Fun & Aqua Parks',
      title: 'عالم الألعاب المائية والأكوا بارك',
      desc: 'ألعاب مائية متعددة المستويات، منزلقات سريعة وممتعة، وأجواء عائلية مفعمة بالحيوية والانتعاش لجميع الأعمار.',
      poiId: '3'
    },
    {
      img: 'assets/images/sirena_buffet.jpg',
      badge: '🍽️ International Gourmet Buffet',
      title: 'مطعم سيرينا وبوفيه الطهي الحي',
      desc: 'رحلة تذوق يومية تجمع أرقى المأكولات العالمية والشرقية والمخبوزات الطازجة ومحطات الطهي المباشر بأيدي أمهر الطهاة.',
      poiId: '12'
    },
    {
      img: 'assets/images/la_mama.jpg',
      badge: '🍕 Authentic Italian Trattoria',
      title: 'مطعم لا ماما الإيطالي الأصيل',
      desc: 'نكهات إيطالية أصيلة من قلب البحر الأبيض المتوسط، بيتزا مخبوزة على الحجر وباستا طازجة في أجواء رومانسية دافئة.',
      poiId: '8'
    },
    {
      img: 'assets/images/beach_marina.jpg',
      badge: '🌊 Crystal Waters & Private Marina',
      title: 'شاطئ البحر الأحمر والمارينا الخاصة',
      desc: 'مياه فيروزية كريستالية، شعاب مرجانية نادرة، وممشى بحري خاص لليخوت والرياضات المائية واستكشاف أعماق البحر.',
      poiId: '1'
    },
    {
      img: 'assets/images/spa_wellness.jpg',
      badge: '💆 Ultimate Wellness & Harmony',
      title: 'مركز السبا والاستجمام الفاخر',
      desc: 'ملاذ متكامل للهدوء واستعادة النشاط مع جلسات التدليك الاسترخائي، الساونا، الجاكوزي، وأرقى برامج العناية بالجسم.',
      poiId: '9'
    }
  ];

  const PromoVideoPlayer = {
    scenes: PROMO_SCENES,
    currentIndex: 0,
    isPlaying: false,
    timer: null,
    stepDuration: 5500, // 5.5s per scene
    isAudioOn: true,
    activeLayer: 'A',

    open() {
      const modal = document.getElementById('promoVideoModal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      this.currentIndex = 0;
      this.isPlaying = true;
      this.renderProgressBars();
      this.showScene(0);

      if (typeof App !== 'undefined' && App.playBeep) {
        App.playBeep(800, 100);
      }
    },

    close() {
      this.isPlaying = false;
      if (this.timer) clearTimeout(this.timer);

      const modal = document.getElementById('promoVideoModal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    },

    renderProgressBars() {
      const track = document.getElementById('promoProgressBarTrack');
      if (!track) return;
      track.innerHTML = '';
      this.scenes.forEach((_, idx) => {
        const bar = document.createElement('div');
        bar.className = 'h-1 bg-white/20 rounded-full overflow-hidden';
        bar.innerHTML = `<div id="promoBarFill-${idx}" class="h-full bg-amber-400 w-0 transition-all duration-100 ease-linear"></div>`;
        track.appendChild(bar);
      });
    },

    showScene(index) {
      if (index < 0 || index >= this.scenes.length) {
        this.close();
        return;
      }
      this.currentIndex = index;

      const scene = this.scenes[index];
      const layerA = document.getElementById('promoSceneLayerA');
      const layerB = document.getElementById('promoSceneLayerB');

      // Crossfade layers
      if (this.activeLayer === 'A') {
        if (layerB) {
          layerB.style.backgroundImage = `url('${scene.img}')`;
          layerB.style.opacity = '1';
        }
        if (layerA) layerA.style.opacity = '0';
        this.activeLayer = 'B';
      } else {
        if (layerA) {
          layerA.style.backgroundImage = `url('${scene.img}')`;
          layerA.style.opacity = '1';
        }
        if (layerB) layerB.style.opacity = '0';
        this.activeLayer = 'A';
      }

      // Update Text HUD
      const badge = document.getElementById('promoSceneCategory');
      const title = document.getElementById('promoSceneTitle');
      const desc = document.getElementById('promoSceneDesc');
      const counter = document.getElementById('promoSceneCounter');

      if (badge) badge.textContent = scene.badge;
      if (title) title.textContent = scene.title;
      if (desc) desc.textContent = scene.desc;
      if (counter) counter.textContent = `${index + 1} / ${this.scenes.length}`;

      // Update progress bars
      this.updateProgressTrack(index);

      // Start timer for auto-advance
      if (this.timer) clearTimeout(this.timer);
      if (this.isPlaying) {
        this.timer = setTimeout(() => {
          this.next();
        }, this.stepDuration);
      }
    },

    updateProgressTrack(activeIndex) {
      this.scenes.forEach((_, idx) => {
        const fill = document.getElementById(`promoBarFill-${idx}`);
        if (!fill) return;
        if (idx < activeIndex) {
          fill.style.width = '100%';
        } else if (idx === activeIndex) {
          fill.style.width = '0%';
          setTimeout(() => {
            if (this.isPlaying) fill.style.width = '100%';
          }, 50);
        } else {
          fill.style.width = '0%';
        }
      });
    },

    next() {
      if (this.currentIndex + 1 < this.scenes.length) {
        this.showScene(this.currentIndex + 1);
      } else {
        this.close();
      }
    },

    prev() {
      if (this.currentIndex > 0) {
        this.showScene(this.currentIndex - 1);
      } else {
        this.showScene(0);
      }
    },

    togglePlayPause() {
      this.isPlaying = !this.isPlaying;
      const icon = document.getElementById('promoPlayPauseIcon');
      const text = document.getElementById('promoPlayPauseText');
      if (icon) icon.textContent = this.isPlaying ? '⏸️' : '▶️';
      if (text) text.textContent = this.isPlaying ? 'إيقاف مؤقت' : 'تشغيل';

      if (this.isPlaying) {
        this.showScene(this.currentIndex);
      } else {
        if (this.timer) clearTimeout(this.timer);
      }
    },

    toggleAudio() {
      this.isAudioOn = !this.isAudioOn;
      const icon = document.getElementById('promoAudioIcon');
      if (icon) icon.textContent = this.isAudioOn ? '🔊' : '🔇';
    },

    toggleFullscreen() {
      const modal = document.getElementById('promoVideoModal');
      if (!modal) return;
      if (!document.fullscreenElement) {
        modal.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    },

    linkToMap() {
      const scene = this.scenes[this.currentIndex];
      this.close();
      if (scene && scene.poiId && typeof MapEngine !== 'undefined') {
        MapEngine.focusPreset(scene.poiId);
      }
    },

    linkToFeature() {
      const scene = this.scenes[this.currentIndex];
      this.close();
      if (scene && scene.poiId && typeof App !== 'undefined') {
        const poi = (typeof resortPois !== 'undefined' && resortPois.find(p => String(p.id) === String(scene.poiId))) || null;
        if (poi) App.openPoiModal(poi);
      }
    }
  };

  // Expose to global window
  root.GalleryManager = GalleryManager;
  root.PromoVideoPlayer = PromoVideoPlayer;

  // Auto initialize on load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => GalleryManager.init());
    } else {
      GalleryManager.init();
    }
  }

})(typeof globalThis !== 'undefined' ? globalThis : window);
