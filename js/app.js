/**
 * Moreno Horizon Spa & Resort - Main Application Controller
 * Handles UI interactions, Modals, Digital Dining Cart, Audio FX, i18n, Dark Mode, and PWA.
 */

const App = {
  currentLang: 'ar',
  currentCategory: 'all',
  isSoundMuted: false,
  cart: [],
  activeServiceOrder: null,

  init() {
    MapEngine.init();
    const savedLang = localStorage.getItem('moreno_language') || 'ar';
    this.changeLanguage(savedLang);
    this.loadSavedRoom();
    this.updateCartBadge();
    this.startResortClock();
    this.bindKeyboardShortcuts();
    this.registerServiceWorker();
    this.setupMobileScrollSpy();
    this.setupPwaInstall();
    this.refreshWeather();
    this._weatherInterval = setInterval(() => this.refreshWeather(), 15 * 60 * 1000);
    ConciergeAudioGuide.init();
    this.updateSunShadeWidget();
    this._sunShadeInterval = setInterval(() => this.updateSunShadeWidget(), 5 * 60 * 1000);
    VoiceNavigator.init();
  },

  readWeatherCache() {
    try {
      const cached = JSON.parse(localStorage.getItem('moreno_weather_cache') || 'null');
      return cached && Number.isFinite(cached.fetchedAt) ? cached : null;
    } catch {
      return null;
    }
  },

  formatWeatherTime(value, locale) {
    if (!value) return '—';
    const match = value.match(/T(\d{2}):(\d{2})/);
    if (!match) return '—';
    const date = new Date(Date.UTC(2000, 0, 1, Number(match[1]), Number(match[2])));
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: this.currentLang === 'ar' || this.currentLang === 'en'
    }).format(date);
  },

  renderWeather(data = this.readWeatherCache()) {
    const lang = this.currentLang || 'ar';
    const locale = ({ ar: 'ar-EG', en: 'en-GB', ru: 'ru-RU', de: 'de-DE' })[lang] || 'ar-EG';
    const t = i18n[lang] || i18n.ar;
    const values = {
      wvalTemp: document.getElementById('wvalTemp'),
      wvalSea: document.getElementById('wvalSea'),
      wvalUv: document.getElementById('wvalUv'),
      wvalSunset: document.getElementById('wvalSunset'),
      weatherStatus: document.getElementById('weatherStatus')
    };

    if (!data) {
      Object.values(values).slice(0, 4).forEach(el => { if (el) el.innerText = '—'; });
      if (values.weatherStatus) values.weatherStatus.innerText = t.weather_unavailable;
      return;
    }

    const number = value => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
    const condition = data.weatherCode === 0 ? t.weather_clear :
      ([1, 2].includes(data.weatherCode) ? t.weather_partly_cloudy :
      (data.weatherCode === 3 ? t.weather_cloudy :
      (data.weatherCode >= 45 && data.weatherCode <= 48 ? t.weather_fog :
      (data.weatherCode >= 95 ? t.weather_storm : t.weather_rain))));

    if (values.wvalTemp) values.wvalTemp.innerText = t.weather_temperature
      .replace('{temp}', number(data.temperatureC))
      .replace('{condition}', condition);

    const seaReadings = [];
    if (Number.isFinite(data.waveHeight)) seaReadings.push(t.weather_wave.replace('{value}', number(data.waveHeight)));
    if (Number.isFinite(data.seaTemperatureC)) seaReadings.push(t.weather_sea_temp.replace('{value}', number(data.seaTemperatureC)));
    if (values.wvalSea) values.wvalSea.innerText = seaReadings.join(' • ') || '—';

    if (values.wvalUv) values.wvalUv.innerText = Number.isFinite(data.uvMax)
      ? t.weather_uv.replace('{value}', number(data.uvMax))
      : '—';
    if (values.wvalSunset) values.wvalSunset.innerText = this.formatWeatherTime(data.sunset, locale);

    const updatedTime = new Intl.DateTimeFormat(locale, {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(data.fetchedAt));
    const isStale = Date.now() - data.fetchedAt > 30 * 60 * 1000;
    if (values.weatherStatus) {
      values.weatherStatus.innerText = isStale
        ? t.weather_cached.replace('{time}', updatedTime)
        : t.weather_updated.replace('{time}', updatedTime);
    }
  },

  async refreshWeather() {
    const cached = this.readWeatherCache();
    if (cached) this.renderWeather(cached);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=27.2579&longitude=33.8116&current=temperature_2m,weather_code&daily=uv_index_max,sunrise,sunset&timezone=Africa%2FCairo&forecast_days=1';
    const marineUrl = 'https://marine-api.open-meteo.com/v1/marine?latitude=27.2579&longitude=33.8116&current=wave_height,sea_surface_temperature&timezone=Africa%2FCairo';

    try {
      const responses = await Promise.all([
        fetch(weatherUrl, { signal: controller.signal, cache: 'no-store' }),
        fetch(marineUrl, { signal: controller.signal, cache: 'no-store' })
      ]);
      if (responses.some(response => !response.ok)) throw new Error('Weather service unavailable');
      const [weather, marine] = await Promise.all(responses.map(response => response.json()));
      if (!weather.current || !weather.daily || !marine.current) throw new Error('Incomplete weather response');

      const data = {
        temperatureC: weather.current.temperature_2m,
        weatherCode: weather.current.weather_code,
        uvMax: weather.daily.uv_index_max?.[0],
        sunrise: weather.daily.sunrise?.[0],
        sunset: weather.daily.sunset?.[0],
        waveHeight: marine.current.wave_height,
        seaTemperatureC: marine.current.sea_surface_temperature,
        fetchedAt: Date.now()
      };
      try {
        localStorage.setItem('moreno_weather_cache', JSON.stringify(data));
      } catch { /* Weather remains available for this page view. */ }
      this.renderWeather(data);
    } catch {
      this.renderWeather(cached);
    } finally {
      clearTimeout(timeout);
    }
  },

  // Luxury Toast Notification System
  showToast(msg, icon = '🛎️', duration = 3400) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-msg glass-card p-3 rounded-2xl border border-amber-500/30 shadow-2xl flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-white';
    const iconEl = document.createElement('span');
    iconEl.className = 'w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm shadow-sm';
    iconEl.textContent = icon;
    const messageEl = document.createElement('span');
    messageEl.className = 'flex-1';
    messageEl.textContent = msg;
    toast.append(iconEl, messageEl);

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-leave');
      setTimeout(() => toast.remove(), 320);
    }, duration);
  },

  // Personal VIP Guest Dashboard & Live Meal Schedules
  loadSavedRoom() {
    this.initGuestDashboard();
  },

  initGuestDashboard() {
    const name = localStorage.getItem('moreno_guest_name') || '';
    const room = localStorage.getItem('moreno_guest_room') || '';
    this.updateGuestDashboardUI(name, room);
    this.updateMealTimesStatus();

    if (this._mealInterval) clearInterval(this._mealInterval);
    this._mealInterval = setInterval(() => {
      this.updateMealTimesStatus();
    }, 45000);
  },

  updateGuestDashboardUI(name, room) {
    const lang = this.currentLang || 'ar';
    const t = i18n[lang] || i18n.ar;
    const nameEl = document.getElementById('guestDashName');
    const badgeEl = document.getElementById('guestDashRoomBadge');
    const roomTextEl = document.getElementById('guestDashRoomText');
    const buildingTextEl = document.getElementById('guestDashBuildingText');
    const editBtnText = document.getElementById('guestDashEditBtnText');

    if (!nameEl) return;

    if (room) {
      nameEl.textContent = name ? t.guest_greeting_name.replace('{name}', name) : t.guest_welcome;
      if (badgeEl) badgeEl.classList.remove('hidden');
      if (roomTextEl) roomTextEl.textContent = t.guest_room_label.replace('{room}', room);
      if (editBtnText) editBtnText.textContent = t.guest_edit_room;

      // Pre-fill across forms
      const roomSearch = document.getElementById('roomSearchInput');
      if (roomSearch && !roomSearch.value) roomSearch.value = room;
      const bkTblRoom = document.getElementById('bookRoomNum');
      if (bkTblRoom && !bkTblRoom.value) bkTblRoom.value = room;
      const bkTblName = document.getElementById('bookGuestName');
      if (bkTblName && name && !bkTblName.value) bkTblName.value = name;
      const vipRoom = document.getElementById('vipServiceRoomInput');
      if (vipRoom && !vipRoom.value) vipRoom.value = room;

      // Find building info from resortPois
      const buildings = (typeof resortPois !== 'undefined') ? resortPois.filter(p => p.isBuilding) : [];
      let matchedBuilding = null;
      let matchedFloor = '';
      const rNum = parseInt(room);

      for (const b of buildings) {
        if (b.rooms) {
          for (const r of b.rooms) {
            const isMatch = r.exact ? r.exact.includes(rNum) : (rNum >= r.min && rNum <= r.max);
            if (isMatch) {
              matchedBuilding = b;
              matchedFloor = r.floor;
              break;
            }
          }
        }
        if (matchedBuilding) break;
      }

      if (matchedBuilding) {
        const building = getLocalizedPoi(matchedBuilding, lang).name;
        const floor = getLocalizedFloor(matchedFloor, lang);
        if (buildingTextEl) buildingTextEl.textContent = t.guest_building_info
          .replace('{building}', building)
          .replace('{floor}', floor);
      } else {
        if (buildingTextEl) buildingTextEl.textContent = t.guest_building_general;
      }
    } else {
      nameEl.textContent = t.guest_welcome;
      if (badgeEl) badgeEl.classList.add('hidden');
      if (buildingTextEl) buildingTextEl.textContent = t.guest_building_prompt;
      if (editBtnText) editBtnText.textContent = t.guest_register_room;
    }
  },

  updateMealTimesStatus() {
    const lang = this.currentLang || 'ar';
    const t = i18n[lang] || i18n.ar;
    const now = new Date();
    const cairoDateStr = now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' });
    const cairoNow = new Date(cairoDateStr);
    const hours = cairoNow.getHours();
    const minutes = cairoNow.getMinutes();
    const curTime = hours * 60 + minutes;

    const meals = [
      { id: 'mealSlotBreakfast', name: t.guest_meal_breakfast, start: 7 * 60, end: 10 * 60 + 30, venue: t.guest_venue_main },
      { id: 'mealSlotLunch', name: t.guest_meal_lunch, start: 12 * 60 + 30, end: 15 * 60, venue: t.guest_venue_horizon },
      { id: 'mealSlotSnacks', name: t.guest_meal_snacks, start: 16 * 60, end: 17 * 60 + 30, venue: t.guest_venue_lotus_bar },
      { id: 'mealSlotDinner', name: t.guest_meal_dinner, start: 18 * 60 + 30, end: 21 * 60 + 30, venue: t.guest_venue_restaurants },
    ];

    let activeMeal = null;
    let nextMeal = null;

    meals.forEach(m => {
      const slotEl = document.getElementById(m.id);
      if (!slotEl) return;
      const badge = slotEl.querySelector('.meal-badge');

      if (curTime >= m.start && curTime <= m.end) {
        activeMeal = m;
        slotEl.className = 'p-2.5 rounded-xl bg-emerald-500/15 border-2 border-emerald-400/60 shadow-lg shadow-emerald-500/10 transition scale-[1.02]';
        if (badge) {
          badge.className = 'meal-badge text-[9px] px-1.5 py-0.5 rounded font-black bg-emerald-500 text-white animate-pulse';
          badge.innerText = t.guest_meal_available;
        }
      } else if (curTime < m.start && (!nextMeal || m.start < nextMeal.start)) {
        if (!nextMeal) nextMeal = m;
        slotEl.className = 'p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 transition';
        if (badge) {
          badge.className = 'meal-badge text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300';
          badge.innerText = t.guest_meal_upcoming;
        }
      } else {
        slotEl.className = 'p-2.5 rounded-xl bg-white/5 border border-white/10 opacity-70 transition';
        if (badge) {
          badge.className = 'meal-badge text-[9px] px-1.5 py-0.5 rounded font-bold bg-white/10 text-slate-400';
          badge.innerText = t.guest_meal_ended;
        }
      }
    });

    const statusBanner = document.getElementById('currentMealLiveStatus');
    if (statusBanner) {
      if (activeMeal) {
        statusBanner.className = 'text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/40 flex items-center gap-1';
        statusBanner.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ${t.guest_meal_active.replace('{meal}', activeMeal.name).replace('{venue}', activeMeal.venue)}`;
      } else if (nextMeal) {
        const diffMins = nextMeal.start - curTime;
        const diffHours = Math.floor(diffMins / 60);
        const remMins = diffMins % 60;
        const timeStr = diffHours > 0
          ? t.guest_time_hours.replace('{hours}', diffHours).replace('{minutes}', remMins)
          : t.guest_time_minutes.replace('{minutes}', remMins);
        statusBanner.className = 'text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30';
        statusBanner.innerText = t.guest_meal_next.replace('{meal}', nextMeal.name).replace('{time}', timeStr);
      } else {
        statusBanner.className = 'text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700';
        statusBanner.innerText = t.guest_meal_closed;
      }
    }
  },

  openGuestProfileModal() {
    this.playBeep(700);
    const modal = document.getElementById('guestProfileModal');
    if (!modal) return;
    const nameInput = document.getElementById('profGuestName');
    const roomInput = document.getElementById('profRoomNum');
    const checkoutInput = document.getElementById('profCheckoutDate');

    if (nameInput) nameInput.value = localStorage.getItem('moreno_guest_name') || '';
    if (roomInput) roomInput.value = localStorage.getItem('moreno_guest_room') || '';
    if (checkoutInput) checkoutInput.value = localStorage.getItem('moreno_guest_checkout') || '';

    this.openModal('guestProfileModal');
  },

  closeGuestProfileModal() {
    this.closeModal('guestProfileModal');
  },

  saveGuestProfile(e) {
    if (e) e.preventDefault();
    this.playBeep(850);
    const name = document.getElementById('profGuestName')?.value.trim() || '';
    const room = document.getElementById('profRoomNum')?.value.trim() || '';
    const checkout = document.getElementById('profCheckoutDate')?.value || '';

    if (name) localStorage.setItem('moreno_guest_name', name);
    if (room) {
      localStorage.setItem('moreno_guest_room', room);
      const roomInput = document.getElementById('roomSearchInput');
      if (roomInput) roomInput.value = room;
    }
    if (checkout) localStorage.setItem('moreno_guest_checkout', checkout);

    this.updateGuestDashboardUI(name, room);
    this.closeGuestProfileModal();
    this.showToast(`تم حفظ بياناتك بنجاح! أهلاً بك أ/ ${name || 'النزيل الكريم'} في غرفتك رقم ${room}`, '👑');

    if (room && typeof Wayfinder !== 'undefined') {
      setTimeout(() => {
        Wayfinder.lookupRoom();
      }, 350);
    }
  },

  requestShuttleToMyRoom() {
    const room = localStorage.getItem('moreno_guest_room');
    if (!room) {
      this.openGuestProfileModal();
      this.showToast('يرجى تسجيل رقم غرفتك أولاً لطلب عربة الجولف', '⚠️');
      return;
    }
    openGolfCartModal();
  },

  // Live Resort Hurghada Clock & Greeting
  startResortClock() {
    const updateTime = () => {
      const now = new Date();
      // Hurghada is UTC+3 (Egypt Standard Time)
      const lang = this.currentLang || 'ar';
      const locale = (lang === 'ar') ? 'ar-EG' : (lang === 'ru' ? 'ru-RU' : (lang === 'de' ? 'de-DE' : 'en-US'));
      const options = { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      const timeStr = new Intl.DateTimeFormat(locale, options).format(now);

      const clockEl = document.getElementById('resortClock');
      if (clockEl) clockEl.innerText = timeStr;

      const hour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', hour: 'numeric', hour12: false }).format(now));
      const greetingEl = document.getElementById('resortGreeting');
      if (greetingEl) {
        const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;
        if (hour >= 5 && hour < 12) {
          greetingEl.innerText = t.greeting_morning;
        } else if (hour >= 12 && hour < 17) {
          greetingEl.innerText = t.greeting_afternoon;
        } else if (hour >= 17 && hour < 21) {
          greetingEl.innerText = t.greeting_sunset;
        } else {
          greetingEl.innerText = t.greeting_night;
        }
      }
    };
    updateTime();
    if (this._clockInterval) clearInterval(this._clockInterval);
    this._clockInterval = setInterval(updateTime, 1000);
  },

  // Keyboard Shortcuts (Ctrl+K for Search, Esc to close modals)
  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openSpotlightSearch();
      } else if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  },

  // Audio FX System
  playBeep(freq = 600) {
    if (this.isSoundMuted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.04, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  },

  toggleAudio() {
    this.isSoundMuted = !this.isSoundMuted;
    ['audioIcon', 'audioModalIcon'].forEach(id => {
      const icon = document.getElementById(id);
      if (icon) icon.innerText = this.isSoundMuted ? '🔇' : '🔊';
    });
    this.showToast(this.isSoundMuted ? 'تم كتم المؤثرات الصوتية 🔇' : 'تم تفعيل المؤثرات الصوتية 🔊');
  },

  // Directory Cards Renderer with Luxury Imagery
  renderDirectory(category = 'all') {
    const grid = document.getElementById('directoryGrid');
    if (!grid) return;
    this.currentCategory = category;

    if (category === 'excursions') {
      this.renderExcursions(grid);
      return;
    }

    const filtered = category === 'all' 
      ? resortPois 
      : resortPois.filter(p => p.category === category);

    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    grid.innerHTML = filtered.map(item => {
      const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(item, lang) : { name: item.nameAr, loc: item.locAr, tag: item.tagAr, desc: item.descriptionAr, hours: item.hours };
      return `
      <div class="tap-effect glass-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all group">
        <div>
          ${item.image ? `
            <div class="relative h-44 overflow-hidden">
              <img src="${item.image}" alt="${loc.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.onerror=null; this.src='assets/images/hero_resort.jpg'">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <span class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black ${item.badgeColor} text-white shadow-md">
                ${item.num}
              </span>
              <span class="absolute bottom-2.5 right-3 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/90 text-slate-950 backdrop-blur-sm">
                ${loc.tag}
              </span>
            </div>
          ` : `
            <div class="p-4 pb-0 flex items-start justify-between gap-2 mb-2">
              <span class="w-9 h-9 rounded-2xl ${item.badgeColor} text-white flex items-center justify-center font-black text-sm shadow">
                ${item.num}
              </span>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                ${loc.tag}
              </span>
            </div>
          `}

          <div class="p-4 sm:p-5">
            <h3 class="text-base sm:text-lg font-black text-slate-800 dark:text-white">${loc.name}</h3>
            <p class="text-xs text-slate-500 flex items-center gap-1.5 mt-1">📍 ${loc.loc}</p>

            <div class="mt-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span>⏰</span> ${loc.hours}
            </div>

            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed line-clamp-2">${loc.desc}</p>
          </div>
        </div>

        <div class="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
          <button onclick="MapEngine.selectPoi('${item.id}', true)" class="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-gold hover:text-slate-950 text-xs font-bold transition">
            ${t.btn_map || '🗺️ الخريطة'}
          </button>
          ${item.menuItems ? `
            <button onclick="App.openMenuModal('${item.id}')" class="flex-1 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-900 dark:text-amber-200 hover:text-slate-950 text-xs font-black transition">
              ${t.btn_menu || '📜 القائمة الرقمية'}
            </button>
          ` : item.canBookTable ? `
            <button onclick="App.openTableBookingModal('${encodeURIComponent(loc.name)}')" class="flex-1 py-2.5 rounded-xl bg-brand-deep hover:bg-brand-navy text-white text-xs font-bold transition shadow-sm">
              ${t.btn_book_table || '🍽️ حجز طاولة'}
            </button>
          ` : `
            <button onclick="MapEngine.selectPoi('${item.id}', true)" class="flex-1 py-2.5 rounded-xl bg-brand-deep hover:bg-brand-navy text-white text-xs font-bold transition shadow-sm">
              ${t.btn_details || 'ℹ️ التفاصيل'}
            </button>
          `}
        </div>
      </div>
    `;
    }).join('');
  },

  renderExcursions(grid) {
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    grid.innerHTML = resortExcursions.map((ex, idx) => {
      const loc = (typeof getLocalizedExcursion === 'function') ? getLocalizedExcursion(ex, idx, lang) : { title: ex.titleAr, desc: ex.descAr, price: ex.price, duration: ex.duration };
      return `
      <div class="tap-effect glass-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all group">
        <div>
          ${ex.image ? `
            <div class="relative h-44 overflow-hidden">
              <img src="${ex.image}" alt="${loc.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.onerror=null; this.src='assets/images/hero_resort.jpg'">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <span class="absolute top-3 right-3 text-2xl drop-shadow-md">
                ${ex.icon}
              </span>
              <span class="absolute bottom-2.5 right-3 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-md">
                ${loc.price}
              </span>
            </div>
          ` : `
            <div class="p-5 pb-0 flex items-center justify-between mb-3">
              <span class="text-3xl">${ex.icon}</span>
              <span class="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                ${loc.price}
              </span>
            </div>
          `}
          <div class="p-5">
            <h3 class="text-base sm:text-lg font-black text-slate-800 dark:text-white">${loc.title}</h3>
            <div class="mt-2 text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <span>⏱️</span> ${t.time_lbl || 'الموعد:'} ${loc.duration}
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">${loc.desc}</p>
          </div>
        </div>

        <div class="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <button onclick="App.openExcursionBookingModal('${encodeURIComponent(loc.title)}', '${loc.price}')" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-deep to-brand-navy hover:from-brand-navy hover:to-brand-deep text-white font-black text-xs text-center shadow-md tap-effect">
            ${t.btn_book_excursion || 'حجز واستفسار فوري 🛥️'}
          </button>
        </div>
      </div>
    `;
    }).join('');
  },

  openExcursionBookingModal(rawTitle, price) {
    this.playBeep(700);
    const title = decodeURIComponent(rawTitle);
    const content = document.getElementById('modalContent');
    const savedRoom = localStorage.getItem('moreno_guest_room') || '';
    const guestName = localStorage.getItem('moreno_guest_name') || '';
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    content.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl font-black">🛥️</span>
            <div>
              <h3 class="text-base font-black text-slate-900 dark:text-white">${title}</h3>
              <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">${price || ''}</p>
            </div>
          </div>
          <button onclick="App.closeModal('detailModal')" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold">✕</button>
        </div>

        <form onsubmit="event.preventDefault(); App.confirmExcursionBooking('${encodeURIComponent(title)}');" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t.lbl_room_number || 'رقم الغرفة:'}</label>
            <input type="text" id="excursionRoom" required value="${savedRoom}" placeholder="2015" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t.lbl_guest_name || 'اسم النزيل:'}</label>
            <input type="text" id="excursionGuest" required value="${guestName}" placeholder="الاسم ثلاثي" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t.lbl_guest_count || 'عدد الأفراد:'}</label>
              <select id="excursionGuestsCount" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold">
                <option value="1">فرد واحد (1)</option>
                <option value="2" selected>فردان (2)</option>
                <option value="3">3 أفراد</option>
                <option value="4">4 أفراد أو أكثر</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الموعد المقترح:</label>
              <select id="excursionDate" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold">
                <option value="غداً صباحاً" selected>غداً صباحاً</option>
                <option value="بعد غد">بعد غد</option>
                <option value="حسب التوافر">حسب التوافر المتاح</option>
              </select>
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200">
            ℹ️ سيقوم مكتب الرحلات والكونسيرج بالتأكيد المباشر مع غرفتكم وتجهيز تصاريح المارينا.
          </div>

          <div class="pt-2 flex items-center gap-2">
            <button type="submit" class="flex-1 py-3 rounded-2xl bg-brand-deep hover:bg-brand-navy text-white text-xs font-black shadow-md transition tap-effect">
              تأكيد تسجيل طلب الرحلة ✓
            </button>
            <button type="button" onclick="App.closeModal('detailModal')" class="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold tap-effect">
              ${t.modal_close}
            </button>
          </div>
        </form>
      </div>
    `;
    this.openModal('detailModal');
  },

  confirmExcursionBooking(rawTitle) {
    this.playBeep(900);
    const title = decodeURIComponent(rawTitle);
    const room = document.getElementById('excursionRoom')?.value || '2015';
    const guest = document.getElementById('excursionGuest')?.value || 'نزيل المنتجع';

    localStorage.setItem('moreno_guest_room', room);
    if (guest) localStorage.setItem('moreno_guest_name', guest);

    this.closeModal('detailModal');
    const t = i18n[this.currentLang] || i18n.ar;
    this.showToast(t.request_not_sent, '⚠️');
  },

  filterCategory(cat, btn) {
    this.playBeep(550);
    this.currentCategory = cat;

    document.querySelectorAll('.category-btn').forEach(b => {
      b.classList.remove('bg-brand-navy', 'text-white', 'shadow-md');
      b.classList.add('bg-white', 'dark:bg-brand-cardDark', 'text-slate-700', 'dark:text-slate-200');
    });

    if (btn) {
      btn.classList.add('bg-brand-navy', 'text-white', 'shadow-md');
      btn.classList.remove('bg-white', 'dark:bg-brand-cardDark', 'text-slate-700', 'dark:text-slate-200');
    }

    // Two-way sync with MapEngine category filter
    if (typeof MapEngine !== 'undefined' && MapEngine.currentCategoryFilter !== cat) {
      const mapBtn = document.querySelector(`.map-cat-btn[data-cat="${cat}"]`);
      if (mapBtn) {
        MapEngine.currentCategoryFilter = cat;
        document.querySelectorAll('.map-cat-btn').forEach(b => {
          b.classList.remove('bg-brand-navy', 'text-white', 'shadow-sm', 'active');
          b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200');
        });
        mapBtn.classList.add('bg-brand-navy', 'text-white', 'shadow-sm', 'active');
        mapBtn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200');
        if (typeof MapEngine.applyPinFilters === 'function') {
          MapEngine.applyPinFilters();
        }
      }
    }

    this.renderDirectory(cat);
  },

  // Daily Live Activities
  renderActivities() {
    const c = document.getElementById('scheduleCardsGrid');
    if (!c) return;
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    c.innerHTML = dailyActivities.map((a, idx) => {
      const title = (typeof getLocalizedActivityTitle === 'function') ? getLocalizedActivityTitle(a, idx, lang) : (lang === 'ar' ? a.titleAr : a.titleEn);
      return `
      <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-1 mb-2">
            <span class="text-2xl">${a.icon}</span>
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-brand-deep text-white">${a.time}</span>
          </div>
          <h4 class="font-bold text-xs text-slate-800 dark:text-white">${title}</h4>
          <span class="text-[11px] text-slate-400 font-semibold mt-1 block">📍 ${a.loc}</span>
        </div>
        <button onclick="App.setReminder('${encodeURIComponent(title)}')" class="mt-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-brand-gold hover:bg-brand-gold hover:text-white transition">
          ${t.btn_remind || '🔔 ذكّرني'}
        </button>
      </div>
    `;
    }).join('');
  },

  setReminder(title) {
    this.playBeep(850);
    this.showToast(`سيتم تذكيرك قبل (${title}) بـ 15 دقيقة 🔔`, '⏰');
  },

  // Wi-Fi Fast Copy
  copyWifiPassword() {
    this.playBeep(700);
    navigator.clipboard.writeText('Moreno@2026').then(() => {
      this.showToast('تم نسخ باسورد الواي فاي: Moreno@2026 📋', '📶');
    }).catch(() => {
      this.showToast('شبكة: Moreno Free | باسورد: Moreno@2026', '📶');
    });
  },

  // Digital Menu Modal & Cart
  openMenuModal(poiId) {
    const poi = resortPois.find(p => p.id === poiId);
    if (!poi || !poi.menuItems) return;

    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const lang = this.currentLang || 'ar';
    const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr, category: poi.categoryNameAr };
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    content.innerHTML = `
      <div>
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <span class="text-xs font-bold text-brand-goldDark dark:text-brand-gold">${loc.category}</span>
            <h3 class="text-lg font-black text-slate-900 dark:text-white">${loc.name}</h3>
            <span class="text-xs text-slate-400">${t.cartSub || 'Digital Menu & Room Service'}</span>
          </div>
        </div>

        <div class="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          ${poi.menuItems.map((item, idx) => `
            <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-brand-gold/40 transition">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">${item.icon}</span>
                <div>
                  <h4 class="font-bold text-xs text-slate-900 dark:text-white">${item.name}</h4>
                  <p class="text-[11px] text-slate-500">${item.desc}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-black whitespace-nowrap border border-amber-500/20">${item.price} ${t.egp_currency || 'EGP'}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          ${poi.canBookTable ? `
            <button onclick="App.closeModal('detailModal'); App.openTableBookingModal('${encodeURIComponent(loc.name)}')" class="tap-effect px-4 py-2.5 rounded-2xl bg-brand-gold hover:bg-brand-goldDark text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5">
              <span>🍽️</span>
              <span>${t.btn_book_table || 'حجز طاولة'}</span>
            </button>
          ` : `<span></span>`}
          <button onclick="App.closeModal('detailModal')" class="tap-effect px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs">
            ${t.modal_close || 'إغلاق'}
          </button>
        </div>
      </div>
    `;

    this.openModal('detailModal');
  },

  addMenuItemToCart(poiId, idx) {},
  addSpotlightDish(encName, price, encVenue) {},
  addToCart(name, price, venue) {},
  updateCartBadge() {
    ['floatingCartBadge', 'headerCartBadge', 'bottomCartBadge'].forEach(id => {
      const badge = document.getElementById(id);
      if (badge) {
        badge.style.display = 'none';
        badge.classList.add('hidden');
      }
    });
  },
  openCartModal() {},
  removeFromCart(idx) {},
  checkoutCart() {},

  // Resort Compendium & Extensions
  openCompendiumModal() {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;
    content.innerHTML = `
      <div>
        <div class="flex items-center gap-3 mb-4">
          <span class="w-10 h-10 rounded-2xl bg-brand-deep text-brand-gold text-xl font-bold flex items-center justify-center">📘</span>
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white">${t.comp_title || 'دليل خدمات المنتجع ونظام الإقامة'}</h3>
            <span class="text-xs text-slate-500">${t.comp_sub || 'Resort Compendium & All-Inclusive Guide'}</span>
          </div>
        </div>

        <div class="space-y-3 max-h-[60vh] overflow-y-auto text-xs pr-1">
          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <h4 class="font-black text-amber-900 dark:text-amber-300 mb-1">${t.comp_ai_title || '🌟 ما يشمله نظام الإقامة الشاملة (All-Inclusive):'}</h4>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              ${t.comp_ai_items || ''}
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h4 class="font-black text-slate-900 dark:text-white mb-2">${t.comp_ext_title || '📞 أرقام التحويلات الداخلية السريعة:'}</h4>
            <div class="space-y-1.5">
              ${resortExtensions.map(e => `
                <div class="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span>${e.name}</span>
                  <a href="tel:${e.num}" class="px-2.5 py-0.5 rounded-lg bg-brand-deep text-white font-bold text-xs">${e.num}</a>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
            <h4 class="font-black text-sky-900 dark:text-sky-300 mb-1">${t.comp_hours_title || '⏰ مواعيد الوصول والمغادرة:'}</h4>
            <p class="text-slate-700 dark:text-slate-300">
              ${t.comp_hours_items || ''}
            </p>
          </div>
        </div>

        <button onclick="App.closeModal('detailModal')" class="w-full mt-4 py-3 rounded-2xl bg-brand-navy text-white text-xs font-bold">
          ${t.modal_ok || 'حسناً'}
        </button>
      </div>
    `;

    this.openModal('detailModal');
  },

  // Modals & Details
  openPoiModal(poi) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;

    const lang = this.currentLang || 'ar';
    const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr, loc: poi.locAr, tag: poi.tagAr, desc: poi.descriptionAr, hours: poi.hours };
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    content.innerHTML = `
      <div>
        ${poi.image ? `
          <div class="relative h-44 rounded-2xl overflow-hidden mb-3">
            <img src="${poi.image}" alt="${loc.name}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <span class="absolute bottom-3 right-3 text-xs font-bold text-amber-300">${loc.category || poi.categoryNameAr}</span>
          </div>
        ` : ''}

        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-10 h-10 rounded-2xl ${poi.badgeColor} text-white font-black text-sm flex items-center justify-center shadow-md">
              ${poi.num}
            </span>
            <div>
              <span class="text-[11px] font-bold text-brand-goldDark dark:text-brand-gold">${loc.category || poi.categoryNameAr}</span>
              <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">${loc.name}</h3>
              ${lang !== 'en' && poi.nameEn ? `<span class="text-[11px] text-slate-400 font-semibold">${poi.nameEn}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="space-y-2 mb-4">
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
            <span class="block font-bold text-slate-700 dark:text-slate-300">${t.loc_lbl || '📍 الموقع:'}</span>
            <span class="text-slate-500">${loc.loc}</span>
          </div>

          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
            <span class="block font-bold text-slate-700 dark:text-slate-300">${t.hours_lbl || '⏰ مواعيد العمل والخدمة:'}</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-bold">${loc.hours}</span>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed p-1">${loc.desc}</p>
        </div>

        ${poi.isBuilding && poi.rooms && poi.rooms.length > 0 ? `
          <div class="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-xs mb-4">
            <span class="font-bold text-amber-800 dark:text-amber-300 block mb-1">🏢 ${lang === 'ar' ? 'تفاصيل أرقام الغرف المعتمدة:' : (lang === 'ru' ? 'Номера комнат:' : (lang === 'de' ? 'Zimmernummern:' : 'Authorized Room Numbers:'))}</span>
            <ul class="space-y-1 text-slate-700 dark:text-slate-300">
              ${poi.rooms.map(r => `<li>• ${r.min ? `${r.min} - ${r.max}` : (r.label || r.exact.join(', '))}: ${r.floor}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Audio Concierge Speak Button -->
        <button onclick="App.speakPoiNarration('${poi.id}')" id="btnSpeakPoi_${poi.id}" class="w-full py-2.5 px-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition mb-3 shadow-sm tap-effect">
          <span class="text-sm">🎙️</span>
          <span>${t.audio_concierge_listen || 'استمع للمرشد الصوتي'}</span>
        </button>

        <div class="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          ${poi.menuItems ? `
            <button onclick="App.openMenuModal('${poi.id}')" class="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md">
              ${t.btn_menu || '📜 القائمة الرقمية'}
            </button>
          ` : poi.canBookTable ? `
            <button onclick="App.closeModal('detailModal'); App.openTableBookingModal('${encodeURIComponent(loc.name)}')" class="flex-1 py-3 rounded-2xl bg-brand-gold hover:bg-brand-goldDark text-slate-950 font-black text-xs shadow-md">
              ${t.btn_book_table || '🍽️ حجز طاولة'}
            </button>
          ` : ''}
          <button onclick="App.setAsRouteDestination('${poi.id}')" class="flex-1 py-3 rounded-2xl ${(typeof MapEngine !== 'undefined' && MapEngine.lastGuestPosition) ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-black' : 'bg-brand-deep hover:bg-brand-navy text-white font-bold'} text-xs shadow-md flex items-center justify-center gap-1.5 tap-effect">
            <span>${(typeof MapEngine !== 'undefined' && MapEngine.lastGuestPosition) ? '🧭' : '🚀'}</span>
            <span>${(typeof MapEngine !== 'undefined' && MapEngine.lastGuestPosition) ? ((lang === 'ar') ? 'الاتجاهات من موقعي' : (lang === 'ru' ? 'Вести от меня' : (lang === 'de' ? 'Route von hier' : 'Navigate Here'))) : (t.btn_route || 'رسم المسار')}</span>
          </button>
          <button onclick="App.closeModal('detailModal')" class="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs">
            ${t.modal_close || 'إغلاق'}
          </button>
        </div>
      </div>
    `;

    this.openModal('detailModal');
  },

  setAsRouteDestination(id) {
    this.closeModal('detailModal');
    if (typeof MapEngine !== 'undefined' && MapEngine.navigateDirectTo) {
      MapEngine.navigateDirectTo(id);
      return;
    }
    const select = document.getElementById('selectDestination');
    if (select) {
      select.value = id;
      Wayfinder.calculateRoute();
    }
  },

  openTableBookingModal(restName) {
    const title = document.getElementById('bookingRestTitle');
    if (title) title.innerText = `حجز طاولة: ${restName}`;
    const target = document.getElementById('bookingTargetRestaurant');
    if (target) target.value = restName;

    const savedRoom = localStorage.getItem('moreno_guest_room');
    if (savedRoom) {
      const roomInput = document.getElementById('bookRoomNum');
      if (roomInput) roomInput.value = savedRoom;
    }
    this.openModal('tableBookingModal');
  },

  confirmTableBooking(e) {
    e.preventDefault();
    const rNum = document.getElementById('bookRoomNum').value;
    const gName = document.getElementById('bookGuestName').value;
    const time = document.getElementById('bookDinnerTime').value;
    const rest = document.getElementById('bookingTargetRestaurant').value;

    this.closeModal('tableBookingModal');
    const t = i18n[this.currentLang] || i18n.ar;
    this.showNotice(t.request_not_sent_title, t.request_not_sent);
  },

  openGuestServicesModal() {
    const savedRoom = localStorage.getItem('moreno_guest_room') || '';
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    content.innerHTML = `
      <div>
        <div class="flex items-center gap-3 mb-4">
          <span class="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 text-2xl flex items-center justify-center font-bold">🛎️</span>
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white">${t.vip_hub_title}</h3>
            <span class="text-xs text-slate-500">${t.vip_hub_sub}</span>
          </div>
        </div>

        <!-- Room Number Input -->
        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-4 flex items-center justify-between gap-3">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${t.srv_lbl_room}</span>
          <input 
            type="text" 
            id="vipServiceRoomInput" 
            value="${savedRoom}" 
            placeholder="${t.ph_room_num || '2015'}" 
            class="w-28 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-xs text-center text-slate-900 dark:text-white"
          >
        </div>

        <!-- Service Request Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto mb-4 pr-1">
          <button onclick="App.requestTrackedService('${t.vip_luggage.replace(/'/g, "\\'")}', '🧳')" class="tap-effect p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left rtl:text-right transition flex items-center gap-3">
            <span class="text-2xl">🧳</span>
            <div>
              <h4 class="font-bold text-xs text-slate-900 dark:text-white">${t.vip_luggage}</h4>
              <p class="text-[10px] text-slate-500">${t.vip_luggage_sub}</p>
            </div>
          </button>

          <button onclick="App.requestTrackedService('${t.vip_housekeeping.replace(/'/g, "\\'")}', '🧹')" class="tap-effect p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left rtl:text-right transition flex items-center gap-3">
            <span class="text-2xl">🧹</span>
            <div>
              <h4 class="font-bold text-xs text-slate-900 dark:text-white">${t.vip_housekeeping}</h4>
              <p class="text-[10px] text-slate-500">${t.vip_housekeeping_sub}</p>
            </div>
          </button>

          <button onclick="App.requestTrackedService('${t.vip_water.replace(/'/g, "\\'")}', '💧')" class="tap-effect p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left rtl:text-right transition flex items-center gap-3">
            <span class="text-2xl">💧</span>
            <div>
              <h4 class="font-bold text-xs text-slate-900 dark:text-white">${t.vip_water}</h4>
              <p class="text-[10px] text-slate-500">${t.vip_water_sub}</p>
            </div>
          </button>

          <button onclick="App.requestTrackedService('${t.vip_late_co.replace(/'/g, "\\'")}', '🚪')" class="tap-effect p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left rtl:text-right transition flex items-center gap-3">
            <span class="text-2xl">🚪</span>
            <div>
              <h4 class="font-bold text-xs text-slate-900 dark:text-white">${t.vip_late_co}</h4>
              <p class="text-[10px] text-slate-500">${t.vip_late_co_sub}</p>
            </div>
          </button>
        </div>

        <!-- Live Service Status Output Container -->
        <div id="serviceTrackingBox" class="hidden mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs"></div>

        <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onclick="App.closeModal('detailModal')" class="tap-effect w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition">
            ${t.modal_close}
          </button>
        </div>
      </div>
    `;

    this.openModal('detailModal');
  },

  requestTrackedService(serviceName, icon) {
    this.playBeep(750);
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    const roomInput = document.getElementById('vipServiceRoomInput');
    const room = roomInput ? roomInput.value.trim() : localStorage.getItem('moreno_guest_room') || '2015';
    const trackBox = document.getElementById('serviceTrackingBox');
    if (!trackBox) return;

    trackBox.classList.remove('hidden');
    trackBox.textContent = t.request_not_sent;
    this.showToast(t.request_not_sent, '⚠️');
  },

  // Spotlight Global Search Engine (Ctrl+K or Header Search)
  openSpotlightSearch() {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    content.innerHTML = `
      <div>
        <div class="relative mb-3">
          <span class="absolute right-3.5 top-3.5 text-slate-400 text-sm">🔍</span>
          <input 
            type="text" 
            id="spotlightSearchInput" 
            placeholder="${t.spotlight_ph}" 
            class="w-full pr-10 pl-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
            oninput="App.handleSpotlightSearch(this.value)"
          >
        </div>

        <div id="spotlightResultsContainer" class="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          <div class="p-4 text-center text-slate-400 text-xs">
            ${t.spotlight_hint}
          </div>
        </div>
      </div>
    `;

    this.openModal('detailModal');
    setTimeout(() => {
      const input = document.getElementById('spotlightSearchInput');
      if (input) input.focus();
    }, 100);
  },

  handleSpotlightSearch(query) {
    const q = query.trim().toLowerCase();
    const container = document.getElementById('spotlightResultsContainer');
    if (!container) return;
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    if (!q) {
      container.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">${t.spotlight_hint}</div>`;
      return;
    }

    // Search POIs
    const matchedPois = resortPois.filter(p => {
      const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(p, lang) : { name: p.nameAr, desc: p.descriptionAr };
      return (
        p.nameAr.toLowerCase().includes(q) || 
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) || 
        loc.name.toLowerCase().includes(q) ||
        loc.desc.toLowerCase().includes(q)
      );
    });

    // Search Menus
    const matchedDishes = [];
    resortPois.forEach(poi => {
      if (poi.menuItems) {
        const locPoi = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr };
        poi.menuItems.forEach(item => {
          if (item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)) {
            matchedDishes.push({ ...item, venue: locPoi.name, poiId: poi.id });
          }
        });
      }
    });

    let html = '';

    if (matchedPois.length > 0) {
      html += `<div class="text-[11px] font-black text-brand-goldDark dark:text-brand-gold px-1 mt-2">${t.spotlight_heading_pois} (${matchedPois.length}):</div>`;
      html += matchedPois.map(p => {
        const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(p, lang) : { name: p.nameAr, category: p.categoryNameAr };
        return `
          <div onclick="App.closeModal('detailModal'); MapEngine.selectPoi('${p.id}');" class="tap-effect p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-brand-gold/10 border border-slate-100 dark:border-slate-800 cursor-pointer flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg ${p.badgeColor} text-white font-bold flex items-center justify-center text-xs">${p.num}</span>
              <div>
                <span class="font-bold text-slate-900 dark:text-white block">${loc.name}</span>
                <span class="text-[10px] text-slate-400">${loc.category}</span>
              </div>
            </div>
            <span class="text-brand-gold font-bold text-[11px]">${t.spotlight_view || 'عرض ➔'}</span>
          </div>
        `;
      }).join('');
    }

    if (matchedDishes.length > 0) {
      html += `<div class="text-[11px] font-black text-brand-goldDark dark:text-brand-gold px-1 mt-3">${t.spotlight_heading_food} (${matchedDishes.length}):</div>`;
      html += matchedDishes.map(d => `
        <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="text-xl">${d.icon}</span>
            <div>
              <span class="font-bold text-slate-900 dark:text-white block">${d.name}</span>
              <span class="text-[10px] text-slate-400">${d.venue}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-black text-xs border border-amber-500/30">${d.price} ${t.egp_currency || 'EGP'}</span>
          </div>
        </div>
      `).join('');
    }

    if (!html) {
      html = `<div class="p-5 text-center text-slate-400 text-xs">${t.spotlight_no_results} "${query}".</div>`;
    }

    container.innerHTML = html;
  },

  // High-Resolution Resort Visual Gallery Modal
  openGalleryModal() {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;
    const galleryItems = Array.from({ length: 35 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      const caption = (t.gallery_photo_caption || 'Resort photo {number}').replace('{number}', number);
      return `
        <figure class="relative rounded-2xl overflow-hidden h-40 shadow-sm group bg-slate-200 dark:bg-slate-800">
          <img src="assets/images/gallery/gallery-${number}.jpg" alt="${caption}" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <figcaption class="absolute bottom-2.5 right-3 text-xs font-black text-white">${caption}</figcaption>
        </figure>
      `;
    }).join('');

    content.innerHTML = `
      <div>
        <div class="flex items-center gap-3 mb-4">
          <span class="w-10 h-10 rounded-2xl bg-brand-deep text-brand-gold text-xl font-bold flex items-center justify-center">🖼️</span>
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white">${t.gallery_title}</h3>
            <span class="text-xs text-slate-500">${t.gallery_sub}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          ${galleryItems}
        </div>

        <button onclick="App.closeModal('detailModal')" class="w-full mt-4 py-3 rounded-2xl bg-brand-navy text-white text-xs font-bold">
          ${t.gallery_close}
        </button>
      </div>
    `;

    this.openModal('detailModal');
  },

  closeAllModals() {
    ['detailModal', 'tableBookingModal', 'guestServicesModal', 'aiChatModal', 'aiItineraryModal', 'guestProfileModal', 'smartHubModal'].forEach(id => {
      this.closeModal(id);
    });
    if (typeof PromoVideoPlayer !== 'undefined' && PromoVideoPlayer.isPlaying) {
      PromoVideoPlayer.close();
    }
  },

  openAiChatModal() {
    this.openModal('aiChatModal');
  },

  // Moreno AI Concierge
  sendQuickQuestion(q) {
    const input = document.getElementById('aiUserInput');
    if (input) {
      input.value = q;
      this.sendAiMessage();
    }
  },

  sendAiMessage() {
    const input = document.getElementById('aiUserInput');
    const text = input ? input.value.trim() : '';
    if (!text) return;

    const container = document.getElementById('chatMessages');
    const lang = this.currentLang || 'ar';
    const t = i18n[lang] || i18n.ar;
    const appendAnswer = answer => {
      const message = document.createElement('div');
      message.className = 'p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 text-slate-800 dark:text-slate-100';
      message.textContent = answer;
      container.appendChild(message);
      container.scrollTop = container.scrollHeight;
    };

    const userMessage = document.createElement('div');
    userMessage.className = 'p-3 rounded-2xl bg-brand-deep text-white text-left rtl:text-right font-medium';
    userMessage.textContent = text;
    container.appendChild(userMessage);
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // Check instant offline knowledge base
    const lower = text.toLowerCase();
    let instantAnswer = null;
    for (const item of localFaqKb) {
      if (item.keywords.some(k => lower.includes(k))) {
        instantAnswer = item.answer;
        break;
      }
    }

    if (instantAnswer) {
      setTimeout(() => {
        appendAnswer(instantAnswer);
      }, 300);
      return;
    }

    setTimeout(() => {
      appendAnswer(t.ai_fallback_response);
    }, 400);
  },

  generateItinerary() {
    const type = document.getElementById('itineraryType').value;
    const out = document.getElementById('itineraryOutput');
    if (!out) return;
    out.classList.remove('hidden');
    const lang = this.currentLang || 'ar';

    if (lang === 'ar') {
      if (type === 'family') {
        out.innerHTML = `
          <strong>برنامج العائلة والمرح المقترح:</strong><br>
          • 08:30 ص: إفطار عائلي غني في بوفيه سيرينا الرئيسي.<br>
          • 10:15 ص: زلاجات مائية ومسابقات للأطفال في الأكوا بارك (3).<br>
          • 01:30 م: غداء وسناكس ببار الشاطئ وساندوتشات طازجة.<br>
          • 04:00 م: استجمام بمسبح لوتس المركزي (11) وألعاب الكرة الطائرة.<br>
          • 08:30 م: حضور الميني ديسكو للأطفال ثم حفل الفلكلور المصري.
        `;
      } else if (type === 'couples') {
        out.innerHTML = `
          <strong>برنامج الرومانسية والاسترخاء:</strong><br>
          • 09:00 ص: إفطار هادئ وإطلالة على مسبح اللوتس.<br>
          • 11:00 ص: جلسة استرخاء وتشميس على رصيف المارينا والشاطئ الخاص (1).<br>
          • 03:00 م: جلسة مساج زوجي وعلاج عطري في السبا والنادي الصحي (9).<br>
          • 05:30 م: مشاهدة غروب الشمس الساحر مع مشروب في لاونج الشاطئ.<br>
          • 08:30 م: عشاء إيطالي فاخر على ضوء الشموع في مطعم لا ماما (8).
        `;
      } else {
        out.innerHTML = `
          <strong>برنامج المغامرات والرياضات البحرية:</strong><br>
          • 08:00 ص: إفطار سريع غني بالطاقة في مطعم سيرينا.<br>
          • 09:00 ص: رحلة غوص وسنوركلينج باليخت من مركز الغوص بالمارينا (2).<br>
          • 02:00 م: مشاوي طازجة وسناك بار شرقي على الشاطئ (6).<br>
          • 04:30 م: مباراة تنس حماسية في الملاعب الاحترافية (10).<br>
          • 07:30 م: سهرة مسائية وسناكس في المجمع التجاري MLS.
        `;
      }
    } else if (lang === 'ru') {
      if (type === 'family') {
        out.innerHTML = `
          <strong>Рекомендуемая семейная программа:</strong><br>
          • 08:30: Завтрак «шведский стол» в главном ресторане Sirena.<br>
          • 10:15: Водные горки и детские анимационные игры в аквапарке (3).<br>
          • 13:30: Обед и свежие закуски в баре на пляже.<br>
          • 16:00: Отдых у бассейна Lotus (11) и пляжный волейбол.<br>
          • 20:30: Мини-диско для детей и вечернее шоу.
        `;
      } else if (type === 'couples') {
        out.innerHTML = `
          <strong>Программа для пар и романтического отдыха:</strong><br>
          • 09:00: Неторопливый завтрак с видом на бассейн Lotus.<br>
          • 11:00: Загорание и отдых на приватном пирсе марины (1).<br>
          • 15:00: Парный сеанс аромамассажа в Королевском СПА (9).<br>
          • 17:30: Встреча заката с коктейлями в пляжном лаундже.<br>
          • 20:30: Итальянский романтический ужин при свечах в ресторане La Mama (8).
        `;
      } else {
        out.innerHTML = `
          <strong>Программа приключений и морского спорта:</strong><br>
          • 08:00: Энергетический завтрак в ресторане Sirena.<br>
          • 09:00: Экскурсия на катере и снорклинг с дельфинами от дайвинг-центра (2).<br>
          • 14:00: Гриль-обед на пляже в Восточном ресторане (6).<br>
          • 16:30: Матч в большой теннис на освещаемых кортах (10).<br>
          • 19:30: Вечерняя прогулка и шопинг в комплексе MLS.
        `;
      }
    } else if (lang === 'de') {
      if (type === 'family') {
        out.innerHTML = `
          <strong>Empfohlenes Familien-Tagesprogramm:</strong><br>
          • 08:30 Uhr: Großes Familienfrühstück im Restaurant Sirena.<br>
          • 10:15 Uhr: Wasserrutschen und Kinder-Animation im Aquapark (3).<br>
          • 13:30 Uhr: Mittagessen & Snacks an der Strandbar.<br>
          • 16:00 Uhr: Entspannung am Lotus-Pool (11) & Wasserballspiele.<br>
          • 20:30 Uhr: Mini-Disco für die Kleinen und ägyptische Folklore-Show.
        `;
      } else if (type === 'couples') {
        out.innerHTML = `
          <strong>Romantik- & Erholungsprogramm für Paare:</strong><br>
          • 09:00 Uhr: Gemütliches Frühstück mit Blick auf die Gärten.<br>
          • 11:00 Uhr: Sonnenbaden und Entspannen auf dem privaten Marina-Steg (1).<br>
          • 15:00 Uhr: Paarmassage und Aromatherapie im königlichen Spa (9).<br>
          • 17:30 Uhr: Sonnenuntergang an der Strandlounge mit Cocktails.<br>
          • 20:30 Uhr: Romantisches Candle-Light-Dinner im Restaurant La Mama (8).
        `;
      } else {
        out.innerHTML = `
          <strong>Abenteuer- & Wassersport-Programm:</strong><br>
          • 08:00 Uhr: Kraftvolles Frühstück im Restaurant Sirena.<br>
          • 09:00 Uhr: Tauch- & Schnorchelausflug vom Tauchcenter am Steg (2).<br>
          • 14:00 Uhr: Orientalischer Grill-Snack am Strand (6).<br>
          • 16:30 Uhr: Tennis-Match auf den Flutlicht-Courts (10).<br>
          • 19:30 Uhr: Abendbummel & Einkauf im Einkaufszentrum MLS.
        `;
      }
    } else {
      if (type === 'family') {
        out.innerHTML = `
          <strong>Suggested Family & Fun Itinerary:</strong><br>
          • 08:30 AM: Rich buffet breakfast at Sirena Main Restaurant.<br>
          • 10:15 AM: Water slides and kids entertainment games at Aqua Park (3).<br>
          • 01:30 PM: Lunch, snacks and fresh smoothies at Beach Bar.<br>
          • 04:00 PM: Relaxation at Lotus Central Pool (11) and water polo.<br>
          • 08:30 PM: Mini-Disco for children followed by live folklore performance.
        `;
      } else if (type === 'couples') {
        out.innerHTML = `
          <strong>Romance & Pure Relaxation Itinerary:</strong><br>
          • 09:00 AM: Peaceful breakfast with serene pool terrace views.<br>
          • 11:00 AM: Sunbathing on the private marina pier and beachfront (1).<br>
          • 03:00 PM: Couples Aromatherapy massage in the Royal Spa (9).<br>
          • 05:30 PM: Sunset cocktails at the Beachfront Lounge.<br>
          • 08:30 PM: Candlelight Italian dinner at La Mama Restaurant (8).
        `;
      } else {
        out.innerHTML = `
          <strong>Adventure & Red Sea Marine Sports Itinerary:</strong><br>
          • 08:00 AM: Energizing buffet breakfast at Sirena Restaurant.<br>
          • 09:00 AM: Diving and snorkeling yacht trip from Diving Center (2).<br>
          • 02:00 PM: Charcoal grilled snacks at the Oriental Beach Bar (6).<br>
          • 04:30 PM: Fast-paced tennis match on professional floodlit courts (10).<br>
          • 07:30 PM: Evening stroll and shopping bazaar at MLS Commercial Complex.
        `;
      }
    }
  },

  // Modal Utility with Display and ARIA synchronization
  openModal(id) {
    const el = (typeof id === 'string') ? document.getElementById(id) : id;
    if (el) {
      el.classList.remove('hidden');
      el.style.display = 'flex';
      el.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }
  },

  closeModal(id) {
    const el = (typeof id === 'string') ? document.getElementById(id) : id;
    if (el) {
      el.classList.add('hidden');
      el.style.display = '';
      el.setAttribute('aria-hidden', 'true');
      const openDialogs = document.querySelectorAll('[role="dialog"]:not(.hidden)');
      if (!openDialogs || openDialogs.length === 0) {
        document.body.classList.remove('modal-open');
      }
    }
  },

  showNotice(title, msg) {
    const content = document.getElementById('modalContent');
    if (!content) return;

    content.innerHTML = `
      <div class="text-center py-4">
        <div class="w-12 h-12 rounded-2xl bg-brand-deep text-brand-gold text-2xl flex items-center justify-center mx-auto mb-3 shadow">🛎️</div>
        <h3 class="text-base font-black text-slate-900 dark:text-white mb-2">${title}</h3>
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">${msg}</p>
        <button onclick="App.closeModal('detailModal')" class="w-full py-2.5 rounded-2xl bg-brand-navy text-white text-xs font-bold">
          حسناً
        </button>
      </div>
    `;
    this.openModal('detailModal');
  },

  showToast(msg) {
    let toast = document.getElementById('appGlobalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appGlobalToast';
      toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 text-white text-xs font-bold border border-amber-500/40 shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-300 opacity-0 translate-y-3';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-3');
    toast.classList.add('opacity-100', 'translate-y-0');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-3');
    }, 2800);
  },

  openHotspotLoginModal() {
    this.playBeep(650);
    this.openModal('hotspotLoginModal');
    const urlParams = new URLSearchParams(window.location.search);
    const mac = urlParams.get('mac') || localStorage.getItem('moreno_guest_mac') || '';
    const macDisplay = document.getElementById('hotspotMacDisplay');
    if (macDisplay) {
      macDisplay.textContent = mac ? `MAC: ${mac}` : (this.currentLang === 'ar' ? 'يتم الكشف التلقائي عبر الشبكة' : 'Detected via network');
    }
  },

  closeHotspotLoginModal() {
    this.closeModal('hotspotLoginModal');
  },

  openMikrotikPortal() {
    this.playBeep(800);
    const configUrl = localStorage.getItem('moreno_hotspot_url') || (window.resortContactConfig && window.resortContactConfig.hotspotLoginUrl) || 'http://192.1.1.1/login';
    const urlParams = new URLSearchParams(window.location.search);
    const mac = urlParams.get('mac') || localStorage.getItem('moreno_guest_mac') || '';
    try {
      const target = new URL(configUrl, window.location.origin);
      if (mac) target.searchParams.set('mac', mac);
      target.searchParams.set('dst', window.location.href);
      window.location.href = target.toString();
    } catch {
      window.location.href = configUrl;
    }
  },

  openEmergencyDrawer() {
    this.playBeep(520);
    this.openModal('emergencyDrawer');
  },

  closeEmergencyDrawer() {
    this.closeModal('emergencyDrawer');
  },

  async shareGuestCoordinates() {
    this.playBeep(750);
    const lang = this.currentLang || 'ar';
    let room = localStorage.getItem('moreno_guest_room') || (lang === 'ar' ? 'غير مسجل' : 'Not set');
    let zoneName = (lang === 'ar') ? 'مباني المنتجع والممشى الرئيسي' : 'Main Resort Walkways';
    let coordsText = '';

    if (window.MapEngine && MapEngine.lastGuestPosition) {
      const pos = MapEngine.lastGuestPosition;
      coordsText = `(X: ${pos.x.toFixed(1)}%, Y: ${pos.y.toFixed(1)}%)`;
      if (window.GeofenceService && typeof GeofenceService.findCurrentZone === 'function') {
        const zone = GeofenceService.findCurrentZone(pos.x, pos.y);
        if (zone) {
          zoneName = zone.nameAr || zone.nameEn || zone.id;
        }
      }
    }

    const shareUrl = window.location.href;
    const alertMessageAr = `🚨 *بلاغ استفسار وطوارئ نزيل - منتجع مورينو هورايزون*\n` +
      `🚪 رقم الغرفة: ${room}\n` +
      `📍 الموقع التقريبي الحالي: ${zoneName} ${coordsText}\n` +
      `🗺️ رابط الخريطة المباشر: ${shareUrl}\n` +
      `⏰ التوقيت: ${new Date().toLocaleTimeString('ar-EG')}`;

    const alertMessageEn = `🚨 *Guest Assistance & Emergency Notice - Moreno Horizon Resort*\n` +
      `🚪 Room Number: ${room}\n` +
      `📍 Approximate Location: ${zoneName} ${coordsText}\n` +
      `🗺️ Live Map Link: ${shareUrl}\n` +
      `⏰ Time: ${new Date().toLocaleTimeString('en-US')}`;

    const textToCopy = (lang === 'ar') ? alertMessageAr : alertMessageEn;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.showToast((lang === 'ar') ? '✅ تم نسخ موقعك وإحداثياتك للمشاركة مع الاستقبال!' : '✅ Location & coordinates copied to clipboard!');
    } catch (e) {
      console.warn('[Emergency] Clipboard write failed:', e);
      this.showToast((lang === 'ar') ? 'تم تحديد الموقع' : 'Location ready');
    }

    // Dynamic WhatsApp update
    const waBtn = document.getElementById('emergencyDrawerWaBtn');
    if (waBtn) {
      const waNumber = '201099887701';
      waBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(textToCopy)}`;
    }
  },

  // Language Switcher
  changeLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('moreno_language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    const langSelect = document.getElementById('langSelect');
    if (langSelect && langSelect.value !== lang) {
      langSelect.value = lang;
    }

    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : (typeof i18n !== 'undefined' ? i18n.ar : null);
    if (!t) return;

    // 1. Text & HTML replacement via data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (t[k]) {
        el.innerHTML = t[k];
      }
    });

    // 2. Input placeholders replacement via data-i18n-ph attributes
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const k = el.getAttribute('data-i18n-ph');
      if (t[k]) {
        el.placeholder = t[k];
      }
    });

    // 3. Tooltip / Title replacements via data-i18n-title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const k = el.getAttribute('data-i18n-title');
      if (t[k]) {
        el.title = t[k];
        if (el.hasAttribute('aria-label')) {
          el.setAttribute('aria-label', t[k]);
        }
      }
    });

    // 4. Fallback direct ID replacements
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.innerText = val;
    };

    setTxt('wlblTemp', t.wlblTemp);
    setTxt('wlblSea', t.wlblSea);
    setTxt('wlblUv', t.wlblUv);
    setTxt('wlblSunset', t.wlblSunset);
    this.renderWeather();
    this.updateSunShadeWidget();
    setTxt('heroBadge', t.heroBadge);
    setTxt('heroTitle', t.heroTitle);
    setTxt('heroSubtitle', t.heroSubtitle);
    setTxt('heroAiBtn', t.heroAiBtn);
    setTxt('wfTitleText', t.wfTitleText || t.wfTitle);
    setTxt('wfSubtitle', t.wfSubtitle);
    setTxt('wfSampleLbl', t.wfSampleLbl);
    setTxt('wfBtnGo', t.wfBtnGo);
    setTxt('wfBtnDraw', t.wfBtnDraw);
    setTxt('mapTitleText', t.mapTitleText || t.mapTitle);
    setTxt('mapSub', t.mapSub);
    setTxt('mapResetTxt', t.mapResetTxt);
    setTxt('schedTitleText', t.schedTitleText || t.schedTitle);
    setTxt('schedSub', t.schedSub);

    // 5. Update tab text spans
    document.querySelectorAll('.tab-txt').forEach(span => {
      const k = span.getAttribute('data-key');
      if (t[k]) span.innerText = t[k];
    });

    // 6. Update Wayfinder Select Options
    this.updateWayfinderSelects(lang);

    // 7. Update Compass North label
    const compassEl = document.querySelector('.map-compass span:nth-child(2)');
    if (compassEl) compassEl.innerText = t.map_compass_n || 'North';

    // 8. Update Default Active Map Pin Badge if currently default
    const activePoiText = document.getElementById('activePoiText');
    if (activePoiText && !activePoiText.querySelector('strong')) {
      activePoiText.innerText = t.map_active_badge_default || 'انقر على أي نقطة في الخريطة لمعاينة التفاصيل';
    }

    // 9. Update Sunlight Mode Button Text
    const sunBtn = document.getElementById('sunlightModeBtn');
    if (sunBtn) {
      const span = sunBtn.querySelector('span:nth-child(2)');
      if (span) span.innerText = t.nav_beach_mode || 'Beach Mode';
    }

    // 10. Update clock and greeting
    this.startResortClock();
    this.updateGuestDashboardUI(
      localStorage.getItem('moreno_guest_name') || '',
      localStorage.getItem('moreno_guest_room') || ''
    );
    this.updateMealTimesStatus();

    // 11. Re-render dynamic components
    if (typeof MapEngine !== 'undefined' && MapEngine.renderPins) {
      MapEngine.renderPins();
    }
    this.renderActivities();
    this.renderDirectory(this.currentCategory || 'all');

    // 12. If wayfinder result banner is currently visible, re-render it in new language
    const routeBanner = document.getElementById('routeResultBanner');
    if (routeBanner && !routeBanner.classList.contains('hidden')) {
      const destSelect = document.getElementById('selectDestination');
      if (destSelect && destSelect.value) {
        Wayfinder.calculateRoute();
      } else {
        const roomInput = document.getElementById('roomSearchInput');
        if (roomInput && roomInput.value.trim()) {
          Wayfinder.lookupRoom();
        }
      }
    }
  },

  updateWayfinderSelects(lang) {
    const selOrig = document.getElementById('selectOrigin');
    const selDest = document.getElementById('selectDestination');
    if (!selOrig || !selDest) return;

    const origVal = selOrig.value;
    const destVal = selDest.value;

    const origins = resortPois;
    selOrig.innerHTML = origins.map(poi => {
      const name = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang).name : poi.nameAr;
      return `<option value="${poi.id}">📍 ${name} (${poi.id})</option>`;
    }).join('');
    selOrig.value = origVal || 'M';

    const destPrompt = (lang === 'ar') ? '🎯 الوجهة: اختر مرفقاً أو مبنى...' :
      (lang === 'ru' ? '🎯 Пункт назначения: выберите объект...' :
      (lang === 'de' ? '🎯 Zielort: Einrichtung oder Flügel wählen...' : '🎯 Destination: Choose a facility or wing...'));

    const destIds = ['N', 'S', 'M', 'MLS', '1', '3', '5', '6', '8', '12', '11', '9', '10', '2', '15', '16', '18'];
    let destHtml = `<option value="">${destPrompt}</option>`;
    destIds.forEach(id => {
      const poi = resortPois.find(p => p.id === id);
      if (poi) {
        const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr };
        destHtml += `<option value="${id}">${loc.name} (${id})</option>`;
      }
    });
    selDest.innerHTML = destHtml;
    selDest.value = destVal || '';

    document.querySelectorAll('[data-preset-label]').forEach(label => {
      const id = label.getAttribute('data-preset-label');
      const poi = resortPois.find(item => String(item.id) === id);
      if (!poi) return;
      const localized = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr };
      label.textContent = `${localized.name} (${id})`;
    });
  },

  toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    this.playBeep(450);
  },

  // 1. Digital Room Pass (Apple Wallet Style)
  openRoomPassModal() {
    this.playBeep(700);
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const savedRoom = localStorage.getItem('moreno_guest_room') || '2015';
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;
    const guestName = localStorage.getItem('moreno_guest_name') || t.pass_guest_val;

    content.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-base">🎫</span>
            <div>
              <h3 class="font-black text-sm text-slate-900 dark:text-white">${t.pass_title}</h3>
              <span class="text-[11px] text-slate-400">${t.pass_sub}</span>
            </div>
          </div>
          <button onclick="App.closeModal('detailModal')" class="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
        </div>

        <!-- Apple Wallet Style Card -->
        <div class="wallet-pass rounded-3xl p-5 text-white shadow-2xl mb-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-white p-1 shrink-0 shadow-sm border border-amber-400/40 flex items-center justify-center overflow-hidden">
                <img src="assets/images/moreno_logo.jpg" alt="Moreno Logo" class="w-full h-full object-contain">
              </div>
              <div>
                <span class="font-mono text-xs font-black tracking-widest text-amber-300 block">MORENO HORIZON</span>
                <span class="text-[9px] text-slate-300">SPA & RESORT • HURGHADA</span>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
              ${t.pass_vip_badge}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div>
              <span class="text-[10px] text-slate-400 block">${t.pass_room_lbl}</span>
              <span class="text-xl font-black text-amber-300 tracking-wider">${savedRoom}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">${t.pass_guest_lbl}</span>
              <span class="font-bold text-white text-xs">${guestName}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] mb-3">
            <div>
              <span class="text-slate-400">${t.pass_wifi_lbl}</span>
              <span class="font-mono font-bold text-slate-200 block">Moreno Free</span>
            </div>
            <div>
              <span class="text-slate-400">${t.pass_pass_lbl}</span>
              <span class="font-mono font-bold text-amber-300 block">Moreno@2026</span>
            </div>
          </div>

          <!-- Dynamic SVG QR Code Simulation -->
          <div class="pt-2 border-t border-dashed border-white/15 flex items-center justify-between">
            <div>
              <span class="text-[9px] text-slate-400 block">${t.pass_scan_lbl}</span>
              <span class="text-[10px] font-mono text-slate-300">Room-Route-ID: #${savedRoom}</span>
            </div>
            <div class="bg-white p-1.5 rounded-xl shadow-md">
              <svg class="w-12 h-12 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm8-2h3v3h-3v-3zm5 0h3v3h-3v-3zm-5 5h3v3h-3v-3zm5 0h3v3h-3v-3zm-2-2h2v2h-2v-2zm-6-7h2v2h-2V7zm2 2h2v2h-2V9z"/>
              </svg>
            </div>
          </div>

          <div class="pass-notch-left"></div>
          <div class="pass-notch-right"></div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button onclick="App.shareRoomPass('${savedRoom}')" class="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 tap-effect">
            <span>${t.pass_share_wa}</span>
          </button>
          <button onclick="App.closeModal('detailModal'); if(typeof Wayfinder !== 'undefined') Wayfinder.takeMeToMyRoom();" class="py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 tap-effect">
            <span>🧭</span>
            <span>${t.nav_my_room_btn || 'الملاحة إلى غرفتي'}</span>
          </button>
        </div>
      </div>
    `;

    this.openModal('detailModal');
  },

  shareRoomPass(roomNum) {
    const text = encodeURIComponent(`مرحباً! هذه بطاقة تصريح الإقامة الرقمية لغرفة رقم [${roomNum}] في منتجع مورينو هورايزون الغردقة. شبكة الواي فاي: Moreno Free | كلمة السر: Moreno@2026`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  },

  // 2. Ultra-HD 3D Cinematic Auto-Tour Mode
  tourIndex: 0,
  tourTimer: null,
  tourProgressRaf: null,
  tourStepStartTime: 0,
  tourStepDuration: 7500,
  tourElapsedBeforePause: 0,
  isTourPlaying: false,
  isTourPaused: false,
  isTourMuted: false,
  isTourAudioNarratorActive: true,
  _tourKeyHandler: null,

  openCinematicPromoVideo() {
    this.playBeep(880);
    PromoVideoPlayer.open();
  },

  startCinematicTour() {
    this.playBeep(900);
    this.isTourPlaying = true;
    this.isTourPaused = false;
    this.tourIndex = 0;
    this.tourElapsedBeforePause = 0;

    // Scroll smoothly to map
    MapEngine.scrollToMap();

    // Start background atmospheric audio
    try {
      if (typeof PromoAudioEngine !== 'undefined') {
        PromoAudioEngine.start();
        if (this.isTourMuted) {
          PromoAudioEngine.isMuted = true;
        }
      }
    } catch (e) {
      console.warn('Atmospheric audio init:', e);
    }

    const lang = this.currentLang || 'ar';
    const welcomeMsg = lang === 'ar' ? 'بدأت جولة المنتجع السينمائية ثلاثية الأبعاد 🎬' :
      (lang === 'ru' ? 'Запущен 3D-тур по курорту 🎬' :
      (lang === 'de' ? '3D-Resort-Panoramatour gestartet 🎬' :
      '3D Cinematic Resort Tour Started 🎬'));
    this.showToast(welcomeMsg, '✨');

    // Create or unhide Tour HUD container inside viewport
    this.ensureCinematicHud();

    // Keyboard navigation (Escape = exit, Left/Right = prev/next, Space = pause)
    if (this._tourKeyHandler) window.removeEventListener('keydown', this._tourKeyHandler);
    this._tourKeyHandler = (e) => {
      if (!this.isTourPlaying) return;
      if (e.key === 'Escape') {
        this.stopCinematicTour();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (lang === 'ar') this.prevTourStep(); else this.nextTourStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (lang === 'ar') this.nextTourStep(); else this.prevTourStep();
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.toggleTourPause();
      }
    };
    window.addEventListener('keydown', this._tourKeyHandler);

    this.playTourStep();
  },

  ensureCinematicHud() {
    let hud = document.getElementById('cinematicTourHud');
    const mapViewport = document.getElementById('mapViewport');
    if (!mapViewport) return;

    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'cinematicTourHud';
      hud.className = 'cinematic-hud absolute inset-0 z-35 overflow-hidden select-none pointer-events-none';
      mapViewport.appendChild(hud);
    }
    hud.classList.remove('hidden');
    hud.style.display = 'block';
  },

  playTourStep() {
    if (!this.isTourPlaying) return;
    clearTimeout(this.tourTimer);
    if (this.tourProgressRaf) cancelAnimationFrame(this.tourProgressRaf);

    const step = cinematicTourSteps[this.tourIndex];
    if (!step) {
      this.stopCinematicTour(true);
      return;
    }

    const poi = resortPois.find(p => String(p.id).trim().toUpperCase() === String(step.poiId).trim().toUpperCase());
    if (!poi) return;

    // 1. Ultra-smooth 3D camera swoop with exact trigonometric target framing
    const zoom = step.zoom || 1.65;
    const pitch = (step.pitch !== undefined) ? step.pitch : 48;
    const bearing = (step.bearing !== undefined) ? step.bearing : 0;
    MapEngine.flyToCinematic(poi.coords.x, poi.coords.y, zoom, pitch, bearing, 1700);

    // 2. High-visibility 3D Ground Beacon & Floating Landmark Callout
    MapEngine.showTourSpotlight(poi, this.tourIndex, cinematicTourSteps.length);

    // 3. Audio transition chime & Concierge speech narration
    try {
      if (!this.isTourMuted && typeof PromoAudioEngine !== 'undefined') {
        PromoAudioEngine.playTransitionChime();
      }
    } catch (e) {}

    try {
      if (this.isTourAudioNarratorActive && typeof ConciergeAudioGuide !== 'undefined' && !ConciergeAudioGuide.isMuted) {
        const narrationText = title + '. ' + desc;
        ConciergeAudioGuide.speak(narrationText, lang);
      }
    } catch (e) {}

    // 4. Update HUD presentation
    this.renderCinematicHudContent(step, poi);

    // 5. Timer & Progress Bar
    this.tourStepStartTime = performance.now();
    this.tourElapsedBeforePause = 0;
    this.isTourPaused = false;
    this.startStepProgressAnimation();

    this.tourTimer = setTimeout(() => {
      this.nextTourStep();
    }, this.tourStepDuration);
  },

  renderCinematicHudContent(step, poi) {
    const hud = document.getElementById('cinematicTourHud');
    if (!hud) return;

    const lang = this.currentLang || 'ar';
    const langKey = lang.charAt(0).toUpperCase() + lang.slice(1);
    const title = step['title' + langKey] || step.titleAr;
    const desc = step['desc' + langKey] || step.descAr;
    const total = cinematicTourSteps.length;
    const currentNum = this.tourIndex + 1;

    // Action button setup
    let actionBtnHtml = '';
    if (step.action === 'book_table') {
      const actText = lang === 'ar' ? '🍽️ حجز طاولة بالعشاء' :
        (lang === 'ru' ? '🍽️ Забронировать столик' :
        (lang === 'de' ? '🍽️ Tisch reservieren' : '🍽️ Book Dining Table'));
      const restName = poi.id === '12' ? 'مطعم سيرينا الرئيسي' : 'مطعم لا ماما الإيطالي';
      actionBtnHtml = `<button onclick="App.stopCinematicTour(); App.openTableBookingModal('${encodeURIComponent(restName)}')" class="tap-effect px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-md whitespace-nowrap">${actText}</button>`;
    } else if (step.action === 'book_spa') {
      const actText = lang === 'ar' ? '💆 حجز جلسة بالسبا' :
        (lang === 'ru' ? '💆 Записаться в СПА' :
        (lang === 'de' ? '💆 Spa-Behandlung buchen' : '💆 Reserve Spa Session'));
      actionBtnHtml = `<button onclick="App.stopCinematicTour(); App.openSpaBookingModal()" class="tap-effect px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black text-xs shadow-md whitespace-nowrap">${actText}</button>`;
    } else if (step.action === 'book_excursion') {
      const actText = lang === 'ar' ? '🤿 استكشاف الرحلات' :
        (lang === 'ru' ? '🤿 Морские экскурсии' :
        (lang === 'de' ? '🤿 Ausflüge ansehen' : '🤿 View Sea Excursions'));
      actionBtnHtml = `<button onclick="App.stopCinematicTour(); App.openCompendiumModal()" class="tap-effect px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-xs shadow-md whitespace-nowrap">${actText}</button>`;
    } else {
      const actText = lang === 'ar' ? '🧭 رسم مسار الوصول' :
        (lang === 'ru' ? '🧭 Маршрут сюда' :
        (lang === 'de' ? '🧭 Route hierher' : '🧭 Navigate Here'));
      actionBtnHtml = `<button onclick="App.stopCinematicTour(); MapEngine.selectPoi('${poi.id}')" class="tap-effect px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black text-xs border border-white/20 shadow-md whitespace-nowrap">${actText}</button>`;
    }

    const soundIcon = this.isTourMuted ? '🔇' : '🔊';
    const pauseIcon = this.isTourPaused ? '▶️' : '⏸️';
    const stationLabel = lang === 'ar' ? `المحطة ${currentNum} من ${total}` :
      (lang === 'ru' ? `Пункт ${currentNum} из ${total}` :
      (lang === 'de' ? `Station ${currentNum} von ${total}` :
      `Station ${currentNum} of ${total}`));

    const prevDisabled = this.tourIndex === 0 ? 'opacity-40 pointer-events-none' : '';

    hud.innerHTML = `
      <!-- 1. Top Segmented Progress Bar -->
      <div class="cinematic-top-tracker absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[560px] max-w-xl px-3.5 py-2.5 rounded-2xl flex flex-col gap-2">
        <div class="flex items-center gap-1.5 w-full">
          ${cinematicTourSteps.map((s, idx) => {
            const isCompleted = idx < this.tourIndex;
            const isActive = idx === this.tourIndex;
            return `
              <div class="cinematic-step-segment ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                <div id="tourProgBar_${idx}" class="cinematic-step-progress" style="width: ${isCompleted ? '100%' : '0%'}"></div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-400/30">
              ${stationLabel}
            </span>
            <span class="text-white/80 font-bold text-xs truncate max-w-[200px] sm:max-w-xs">${step.icon || '📍'} ${title}</span>
          </div>
          <button onclick="App.stopCinematicTour()" class="w-6 h-6 rounded-lg bg-white/10 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center transition tap-effect" title="Close Tour">
            ✕
          </button>
        </div>
      </div>

      <!-- 2. Ultra-Crisp Screen-Space Landmark Target Pinpoint (100% Sharp Typography, Never Distorted in 3D) -->
      <div class="cinematic-landmark-tag absolute left-1/2 -translate-x-1/2 pointer-events-none select-none z-30" style="top: 29%;">
        <div class="flex flex-col items-center animate-subtle-float">
          <div class="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-950/95 border-2 border-amber-400 text-white shadow-2xl flex items-center gap-2 backdrop-blur-xl">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="px-2 py-0.5 rounded-lg bg-amber-500/25 text-amber-300 font-black text-[10px] sm:text-[11px] border border-amber-400/40">
              ${stationLabel}
            </span>
            <span class="text-xs sm:text-sm font-black text-white drop-shadow flex items-center gap-1.5">
              <span>${step.icon || poi.icon || '📍'}</span>
              <span>${title}</span>
            </span>
          </div>
          <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-amber-400 -mt-0.5"></div>
        </div>
      </div>

      <!-- 3. Bottom Floating Presentation Theater Card -->
      <div class="cinematic-bottom-theater absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-[94%] sm:w-[560px] max-w-xl p-3 sm:p-4 rounded-3xl text-white">
        <div class="flex items-center gap-3">
          <!-- Thumbnail with Icon Badge -->
          <div class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-800 shrink-0 shadow-xl border border-white/20">
            <img src="${step.image || poi.image || 'assets/images/hero_resort.jpg'}" alt="${title}" class="w-full h-full object-cover">
            <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded-lg bg-slate-900/85 backdrop-blur-md text-amber-300 font-black text-[10px] border border-white/15">
              ${step.icon || poi.icon || '📍'} #${poi.num}
            </span>
          </div>

          <!-- Information -->
          <div class="flex-1 min-w-0">
            <h3 class="font-black text-sm sm:text-base text-amber-300 truncate leading-snug mb-1">${title}</h3>
            <p class="text-[11px] sm:text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2.5">${desc}</p>
            
            <!-- Controls & Action Button Row -->
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5">
                <button onclick="App.prevTourStep()" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition tap-effect ${prevDisabled}" title="Previous">
                  ⏮️
                </button>
                <button id="cinematicPlayPauseBtn" onclick="App.toggleTourPause()" class="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center transition shadow tap-effect" title="Pause / Resume">
                  ${pauseIcon}
                </button>
                <button onclick="App.nextTourStep()" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition tap-effect" title="Next">
                  ⏭️
                </button>
                <button onclick="App.toggleTourMute()" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition tap-effect" title="Mute / Unmute">
                  ${soundIcon}
                </button>
                <button id="cinematicAudioGuideBtn" onclick="App.toggleTourAudioGuide()" class="px-2.5 h-8 rounded-xl ${this.isTourAudioNarratorActive ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-white/10 hover:bg-white/20 text-white'} font-bold text-xs flex items-center gap-1.5 transition tap-effect" title="Audio Concierge">
                  <span>🎙️</span>
                  <div class="flex items-end gap-0.5 h-3">
                    <span class="audio-narration-wave w-0.5 h-1.5 bg-amber-400 rounded-full ${this.isTourAudioNarratorActive && typeof ConciergeAudioGuide !== 'undefined' && ConciergeAudioGuide.isSpeaking ? 'animate-wave' : ''}"></span>
                    <span class="audio-narration-wave w-0.5 h-3 bg-amber-400 rounded-full ${this.isTourAudioNarratorActive && typeof ConciergeAudioGuide !== 'undefined' && ConciergeAudioGuide.isSpeaking ? 'animate-wave' : ''}"></span>
                    <span class="audio-narration-wave w-0.5 h-2 bg-amber-400 rounded-full ${this.isTourAudioNarratorActive && typeof ConciergeAudioGuide !== 'undefined' && ConciergeAudioGuide.isSpeaking ? 'animate-wave' : ''}"></span>
                  </div>
                </button>
              </div>

              ${actionBtnHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  startStepProgressAnimation() {
    const progBar = document.getElementById(`tourProgBar_${this.tourIndex}`);
    if (!progBar) return;

    const animate = (now) => {
      if (!this.isTourPlaying || this.isTourPaused) return;
      const elapsed = (now - this.tourStepStartTime) + this.tourElapsedBeforePause;
      const pct = Math.min(100, (elapsed / this.tourStepDuration) * 100);
      progBar.style.width = `${pct}%`;

      if (elapsed < this.tourStepDuration) {
        this.tourProgressRaf = requestAnimationFrame(animate);
      }
    };
    this.tourProgressRaf = requestAnimationFrame(animate);
  },

  toggleTourPause() {
    this.isTourPaused = !this.isTourPaused;
    const btn = document.getElementById('cinematicPlayPauseBtn');
    if (btn) btn.innerHTML = this.isTourPaused ? '▶️' : '⏸️';

    if (this.isTourPaused) {
      clearTimeout(this.tourTimer);
      if (this.tourProgressRaf) cancelAnimationFrame(this.tourProgressRaf);
      const now = performance.now();
      this.tourElapsedBeforePause += (now - this.tourStepStartTime);
    } else {
      const remainingTime = Math.max(800, this.tourStepDuration - this.tourElapsedBeforePause);
      this.tourStepStartTime = performance.now();
      this.startStepProgressAnimation();
      this.tourTimer = setTimeout(() => {
        this.nextTourStep();
      }, remainingTime);
    }
  },

  toggleTourMute() {
    this.isTourMuted = !this.isTourMuted;
    try {
      if (typeof PromoAudioEngine !== 'undefined') {
        PromoAudioEngine.isMuted = this.isTourMuted;
        if (PromoAudioEngine.waveGain && PromoAudioEngine.ctx) {
          PromoAudioEngine.waveGain.gain.setValueAtTime(this.isTourMuted ? 0 : 0.12, PromoAudioEngine.ctx.currentTime);
        }
      }
    } catch (e) {}

    const step = cinematicTourSteps[this.tourIndex];
    const poi = resortPois.find(p => p.id === step?.poiId);
    if (step && poi) {
      this.renderCinematicHudContent(step, poi);
    }
  },

  prevTourStep() {
    if (this.tourIndex <= 0) return;
    clearTimeout(this.tourTimer);
    if (this.tourProgressRaf) cancelAnimationFrame(this.tourProgressRaf);
    this.tourIndex--;
    this.playTourStep();
  },

  nextTourStep() {
    clearTimeout(this.tourTimer);
    if (this.tourProgressRaf) cancelAnimationFrame(this.tourProgressRaf);
    this.tourIndex++;
    if (this.tourIndex < cinematicTourSteps.length) {
      this.playTourStep();
    } else {
      this.stopCinematicTour(true);
    }
  },

  stopCinematicTour(isCompleted = false) {
    this.isTourPlaying = false;
    this.isTourPaused = false;
    clearTimeout(this.tourTimer);
    if (this.tourProgressRaf) cancelAnimationFrame(this.tourProgressRaf);

    // Stop atmospheric background sound
    try {
      if (typeof PromoAudioEngine !== 'undefined') {
        PromoAudioEngine.stop();
      }
    } catch (e) {}

    // Stop concierge audio narration
    if (typeof ConciergeAudioGuide !== 'undefined') {
      ConciergeAudioGuide.stop();
    }

    if (this._tourKeyHandler) {
      window.removeEventListener('keydown', this._tourKeyHandler);
      this._tourKeyHandler = null;
    }

    const hud = document.getElementById('cinematicTourHud');
    if (hud) {
      hud.classList.add('hidden');
      hud.style.display = 'none';
      hud.innerHTML = '';
    }

    // Restore pins and remove spotlight beacon & callout
    if (typeof MapEngine !== 'undefined' && MapEngine.clearTourSpotlight) {
      MapEngine.clearTourSpotlight();
    } else {
      document.querySelectorAll('.map-pin').forEach(p => {
        p.classList.remove('active-pin', 'active-tour-pin', 'tour-dimmed-pin');
        p.style.opacity = '1';
      });
    }

    MapEngine.resetTransform();

    if (isCompleted) {
      const lang = this.currentLang || 'ar';
      const msg = lang === 'ar' ? 'اكتملت جولة منتجع مورينو هورايزون بنجاح! نتمنى لك إقامة رائعة 🌴' :
        (lang === 'ru' ? '3D-тур успешно завершен! Приятного отдыха в Moreno Horizon 🌴' :
        (lang === 'de' ? 'Resort-Tour erfolgreich abgeschlossen! Wir wünschen einen traumhaften Aufenthalt 🌴' :
        'Moreno Horizon 3D Tour completed! Enjoy your luxury stay 🌴'));
      this.showToast(msg, '🌟');
    }
  },

  toggleTourAudioGuide() {
    this.isTourAudioNarratorActive = !this.isTourAudioNarratorActive;
    if (!this.isTourAudioNarratorActive) {
      if (typeof ConciergeAudioGuide !== 'undefined') ConciergeAudioGuide.stop();
    } else {
      const step = cinematicTourSteps[this.tourIndex];
      if (step) {
        const lang = this.currentLang || 'ar';
        const langKey = lang.charAt(0).toUpperCase() + lang.slice(1);
        const title = step['title' + langKey] || step.titleAr;
        const desc = step['desc' + langKey] || step.descAr;
        if (typeof ConciergeAudioGuide !== 'undefined') {
          ConciergeAudioGuide.speak(title + '. ' + desc, lang);
        }
      }
    }
    const step = cinematicTourSteps[this.tourIndex];
    const poi = resortPois.find(p => p.id === step?.poiId);
    if (step && poi) {
      this.renderCinematicHudContent(step, poi);
    }
  },

  speakPoiNarration(poiId) {
    const poi = resortPois.find(p => String(p.id).trim().toUpperCase() === String(poiId).trim().toUpperCase());
    if (!poi) return;

    if (typeof ConciergeAudioGuide !== 'undefined') {
      if (ConciergeAudioGuide.isSpeaking) {
        ConciergeAudioGuide.stop();
        const btn = document.getElementById(`btnSpeakPoi_${poi.id}`);
        if (btn) {
          const t = (typeof i18n !== 'undefined' && i18n[this.currentLang]) || {};
          btn.innerHTML = `<span class="text-sm">🎙️</span><span>${t.audio_concierge_listen || 'استمع للمرشد الصوتي'}</span>`;
        }
        return;
      }

      const lang = this.currentLang || 'ar';
      const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr, desc: poi.descriptionAr };
      const fullText = `${loc.name}. ${loc.desc}`;
      
      const btn = document.getElementById(`btnSpeakPoi_${poi.id}`);
      if (btn) {
        const t = (typeof i18n !== 'undefined' && i18n[this.currentLang]) || {};
        btn.innerHTML = `<span class="text-sm animate-pulse">🔊</span><span>${t.audio_concierge_speaking || 'جارٍ التحدث...'}</span>`;
      }

      ConciergeAudioGuide.speak(fullText, lang, () => {
        if (btn) {
          const t = (typeof i18n !== 'undefined' && i18n[this.currentLang]) || {};
          btn.innerHTML = `<span class="text-sm">🎙️</span><span>${t.audio_concierge_listen || 'استمع للمرشد الصوتي'}</span>`;
        }
      });
    }
  },

  updateSunShadeWidget() {
    const bannerText = document.getElementById('sunShadeSummaryText');
    if (!bannerText || typeof SunShadeTracker === 'undefined') return;

    const telemetry = SunShadeTracker.getSolarTelemetry();
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) || {};
    const stateDesc = t[telemetry.statusKey] || 'أجواء مشمسة ممتازة';

    if (telemetry.isDaylight) {
      bannerText.innerHTML = `${stateDesc} • <span class="font-bold text-amber-500 dark:text-amber-400">UV ${telemetry.uvIndex}</span> • زاوية الشمس ${Math.round(telemetry.elevation)}°`;
    } else {
      bannerText.innerHTML = `${stateDesc} • نسيم البحر الأحمر وممشى مارينا هادئ`;
    }
  },

  openSunShadeModal() {
    const modal = document.getElementById('sunShadeModal');
    const content = document.getElementById('sunShadeModalContent');
    if (!modal || !content || typeof SunShadeTracker === 'undefined') return;

    const telemetry = SunShadeTracker.getSolarTelemetry();
    const zoneAnalysis = SunShadeTracker.getResortZoneAnalysis(telemetry);
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) || {};
    const stateDesc = t[telemetry.statusKey] || '';

    const sunAngle = Math.round(telemetry.azimuth);
    const shadowAngle = Math.round(telemetry.shadowAzimuth);

    content.innerHTML = `
      <!-- Solar Compass & Live Telemetry Gauge -->
      <div class="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center relative overflow-hidden">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <!-- Compass Visual -->
          <div class="sun-radar-dial shrink-0">
            <span class="absolute top-1 text-[9px] font-black text-amber-500">N (البحر)</span>
            <span class="absolute bottom-1 text-[9px] font-black text-slate-400">S (المدخل)</span>
            <span class="absolute left-1.5 text-[9px] font-black text-slate-400">W</span>
            <span class="absolute right-1.5 text-[9px] font-black text-slate-400">E</span>
            
            <!-- Sun direction arm -->
            <div class="sun-pointer-arm" style="transform: translate(-50%, -100%) rotate(${sunAngle}deg);">
              <span class="absolute -top-3 left-1/2 -translate-x-1/2 text-sm">☀️</span>
            </div>
            <!-- Shadow projection arm -->
            <div class="shadow-pointer-arm" style="transform: translate(-50%, -100%) rotate(${shadowAngle}deg);">
              <span class="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">⛱️</span>
            </div>
            
            <div class="w-7 h-7 rounded-full bg-slate-900/90 text-amber-400 font-black text-[10px] flex items-center justify-center border border-amber-500/40 z-10">
              ${Math.round(telemetry.elevation)}°
            </div>
          </div>

          <!-- Solar Stats Details -->
          <div class="flex-1 text-right sm:text-start">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-black mb-2 border border-amber-500/30">
              <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>${stateDesc}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div class="p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
                <span class="block text-[10px] text-slate-400 font-bold">ارتفاع الشمس</span>
                <span class="text-sm font-black text-amber-500">${Math.round(telemetry.elevation)}° فوق الأفق</span>
              </div>
              <div class="p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
                <span class="block text-[10px] text-slate-400 font-bold">مؤشر الأشعة (UV)</span>
                <span class="text-sm font-black ${telemetry.uvIndex > 7 ? 'text-rose-500' : 'text-emerald-500'}">${telemetry.uvIndex} / 11</span>
              </div>
              <div class="p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 col-span-2 sm:col-span-1">
                <span class="block text-[10px] text-slate-400 font-bold">اتجاه حركة الظلال</span>
                <span class="text-sm font-black text-sky-500">${Math.round(telemetry.shadowAzimuth)}° (بحري جنوبي)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sunny Spots Section -->
      ${zoneAnalysis.sunnySpots.length > 0 ? `
        <div>
          <h4 class="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2.5">
            <span>☀️</span>
            <span>${t.sun_top_sunny || 'أفضل أماكن التشميس والتان المباشر الآن'}</span>
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            ${zoneAnalysis.sunnySpots.map(s => `
              <div class="sun-radar-card p-3 rounded-2xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/25 flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="text-xl">${s.icon}</span>
                    <h5 class="text-xs font-black text-slate-900 dark:text-white leading-tight">${lang === 'en' ? s.nameEn : s.nameAr}</h5>
                  </div>
                  <span class="inline-block text-[10px] font-bold text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md bg-amber-500/15 mb-2.5">
                    ${lang === 'en' ? s.badgeEn : s.badgeAr}
                  </span>
                </div>
                <button onclick="App.focusRadarSpot('${s.nameAr}')" class="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow-sm transition tap-effect">
                  معاينة على الخريطة 🗺️
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Shaded Spots Section -->
      <div>
        <h4 class="text-xs sm:text-sm font-black text-sky-700 dark:text-sky-400 flex items-center gap-2 mb-2.5">
          <span>🌴</span>
          <span>${t.sun_top_shady || 'أفضل أماكن الظل والانتعاش الآن'}</span>
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          ${zoneAnalysis.shadedSpots.map(s => `
            <div class="sun-radar-card p-3 rounded-2xl bg-gradient-to-b from-teal-500/10 to-teal-500/5 border border-teal-500/25 flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="text-xl">${s.icon}</span>
                  <h5 class="text-xs font-black text-slate-900 dark:text-white leading-tight">${lang === 'en' ? s.nameEn : s.nameAr}</h5>
                </div>
                <span class="inline-block text-[10px] font-bold text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md bg-teal-500/15 mb-2.5">
                  ${lang === 'en' ? s.badgeEn : s.badgeAr}
                </span>
              </div>
              <button onclick="App.focusRadarSpot('${s.nameAr}')" class="w-full py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] shadow-sm transition tap-effect">
                معاينة على الخريطة 🗺️
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.openModal('sunShadeModal');
  },

  focusRadarSpot(spotName) {
    this.closeModal('sunShadeModal');
    const found = resortPois.find(p => 
      spotName.includes(p.nameAr) || 
      p.nameAr.includes(spotName) ||
      (spotName.includes('لوتس') && p.nameAr.includes('لوتس')) ||
      (spotName.includes('مارينا') && p.nameAr.includes('الشاطئ')) ||
      (spotName.includes('أكوا') && p.nameAr.includes('أكوا')) ||
      (spotName.includes('لا ماما') && p.nameAr.includes('لا ماما')) ||
      (spotName.includes('سيرينا') && p.nameAr.includes('سيرينا'))
    );

    if (found) {
      MapEngine.selectPoi(found.id, true);
    } else {
      MapEngine.resetTransform();
    }
  },

  openVoiceNavigator() {
    VoiceNavigator.openModal();
  },

  // 3. Luxury Spa Booking Engine
  openSpaBookingModal() {
    this.playBeep(700);
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const savedRoom = localStorage.getItem('moreno_guest_room') || '';
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    content.innerHTML = `
      <div>
        <div class="flex items-center gap-3 mb-4">
          <span class="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 text-2xl flex items-center justify-center font-bold">💆</span>
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white">${t.spa_title}</h3>
            <span class="text-xs text-slate-500">${t.spa_sub}</span>
          </div>
        </div>

        <form onsubmit="App.confirmSpaBooking(event)" class="space-y-3 text-xs">
          <div>
            <label for="spaTreatmentSelect" class="block font-bold mb-1 text-slate-700 dark:text-slate-300">${t.spa_lbl_treatment}</label>
            <select id="spaTreatmentSelect" title="${t.spa_lbl_treatment}" aria-label="${t.spa_lbl_treatment}" onchange="App.updateSpaDurationOptions(this.value)" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
              ${resortSpaTreatments.map(item => `<option value="${item.id}">${item.icon} ${item.titleAr}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="spaDurationSelect" class="block font-bold mb-1 text-slate-700 dark:text-slate-300">${t.spa_lbl_duration}</label>
              <select id="spaDurationSelect" title="${t.spa_lbl_duration}" aria-label="${t.spa_lbl_duration}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                <option value="50_850">50 min (850 EGP)</option>
                <option value="80_1200">80 min (1200 EGP)</option>
              </select>
            </div>
            <div>
              <label for="spaTherapistSelect" class="block font-bold mb-1 text-slate-700 dark:text-slate-300">${t.spa_lbl_therapist}</label>
              <select id="spaTherapistSelect" title="${t.spa_lbl_therapist}" aria-label="${t.spa_lbl_therapist}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                <option value="female">${t.spa_therapist_f}</option>
                <option value="male">${t.spa_therapist_m}</option>
                <option value="any">${t.spa_therapist_any}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="spaTimeSelect" class="block font-bold mb-1 text-slate-700 dark:text-slate-300">${t.spa_lbl_time}</label>
              <select id="spaTimeSelect" title="${t.spa_lbl_time}" aria-label="${t.spa_lbl_time}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                <option value="10:30 AM">10:30 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="05:30 PM">05:30 PM</option>
                <option value="07:30 PM">07:30 PM</option>
              </select>
            </div>
            <div>
              <label class="block font-bold mb-1 text-slate-700 dark:text-slate-300">${t.spa_lbl_room}</label>
              <input type="text" id="spaRoomInput" value="${savedRoom}" required placeholder="${t.ph_room_num || '2015'}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
            </div>
          </div>

          <button type="submit" class="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md mt-2">
            ${t.spa_btn_confirm}
          </button>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  updateSpaDurationOptions(treatmentId) {
    const treatment = resortSpaTreatments.find(t => t.id === treatmentId);
    if (!treatment) return;
    const durSelect = document.getElementById('spaDurationSelect');
    if (!durSelect) return;
    durSelect.innerHTML = treatment.durations.map(d => `
      <option value="${d.min}_${d.price}">${d.min} دقيقة (${d.price} EGP)</option>
    `).join('');
  },

  confirmSpaBooking(e) {
    e.preventDefault();
    this.closeModal('detailModal');
    const t = i18n[this.currentLang] || i18n.ar;
    this.showToast(t.request_not_sent, '⚠️', 4500);
  },

  // 4. Qibla Compass & Prayer Times Modal
  openPrayerTimesModal() {
    try {
      this.playBeep(700);
      const modal = document.getElementById('detailModal');
      const content = document.getElementById('modalContent');
      if (!modal || !content) return;
      const lang = this.currentLang || 'ar';
      const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : ((typeof i18n !== 'undefined' && i18n.ar) ? i18n.ar : {});

      content.innerHTML = `
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-2xl flex items-center justify-center font-bold">🕌</span>
            <div>
              <h3 class="text-base font-black text-slate-900 dark:text-white">${t.prayer_title || 'مواقيت الصلاة واتجاه القبلة بالغردقة'}</h3>
              <span class="text-xs text-slate-500">${t.prayer_sub || 'مواقيت الصلاة الرسمية ومؤشر القبلة الدقيق لمنتجع مورينو هورايزون'}</span>
            </div>
          </div>

          <!-- Interactive Qibla Compass Widget -->
          <div class="p-4 rounded-3xl bg-slate-900 text-white text-center mb-4 border border-amber-500/30">
            <div class="relative w-36 h-36 mx-auto mb-2 qibla-dial rounded-full flex items-center justify-center">
              <span class="absolute top-1.5 text-[10px] font-black text-rose-500">N</span>
              <span class="absolute right-2 text-[10px] font-black text-slate-400">E</span>
              <span class="absolute bottom-1.5 text-[10px] font-black text-slate-400">S</span>
              <span class="absolute left-2 text-[10px] font-black text-slate-400">W</span>

              <div class="absolute" style="transform: rotate(137deg) translateY(-50px);">
                <span class="text-xs">🕋</span>
              </div>

              <div class="qibla-needle w-1.5 h-16 bg-gradient-to-t from-transparent via-amber-400 to-amber-300 rounded-full" style="transform: rotate(137deg);"></div>
            </div>
            <span class="block text-xs font-black text-amber-300">${t.prayer_angle_text || 'زاوية القبلة من الغردقة: 137° (جنوب شرق)'}</span>
            <span class="text-[10px] text-slate-400">${t.prayer_distance_text || 'المسافة إلى مكة المكرمة: حوالي 870 كم'}</span>
          </div>

          <!-- Daily Prayer Times List -->
          <div class="space-y-1.5 mb-4 max-h-[40vh] overflow-y-auto">
            ${(typeof hurghadaPrayerSchedule !== 'undefined' ? hurghadaPrayerSchedule : []).map(p => `
              <div class="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span class="font-bold flex items-center gap-2">
                  <span>${p.icon}</span>
                  <span>${p.nameAr}</span>
                </span>
                <span class="font-black text-emerald-600 dark:text-emerald-400">${p.time}</span>
              </div>
            `).join('')}
          </div>

          <button onclick="App.closeModal('detailModal')" class="w-full py-3 rounded-2xl bg-brand-navy text-white text-xs font-bold tap-effect">
            ${t.modal_ok || 'حسناً'}
          </button>
        </div>
      `;

      this.openModal('detailModal');
    } catch (err) {
      console.error('Error opening prayer times modal:', err);
    }
  },

  // 5. Instant Guest Feedback & Butler Alert
  ratings: { clean: 5, food: 5, service: 5 },

  openFeedbackModal() {
    this.playBeep(700);
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const savedRoom = localStorage.getItem('moreno_guest_room') || '';
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    content.innerHTML = `
      <div>
        <div class="text-center mb-4">
          <span class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 text-2xl flex items-center justify-center mx-auto mb-2 shadow">⭐</span>
          <h3 class="text-base font-black text-slate-900 dark:text-white">${t.feedback_title}</h3>
          <p class="text-xs text-slate-500 mt-0.5">${t.feedback_sub}</p>
        </div>

        <form onsubmit="App.submitFeedback(event)" class="space-y-3 text-xs">
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-700 dark:text-slate-300">${t.fb_clean_lbl}</span>
              <div class="flex gap-1" id="starsClean">
                ${[1, 2, 3, 4, 5].map(s => `
                  <button type="button" onclick="App.setRating('clean', ${s})" class="star-btn text-base active">★</button>
                `).join('')}
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-700 dark:text-slate-300">${t.fb_food_lbl}</span>
              <div class="flex gap-1" id="starsFood">
                ${[1, 2, 3, 4, 5].map(s => `
                  <button type="button" onclick="App.setRating('food', ${s})" class="star-btn text-base active">★</button>
                `).join('')}
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-700 dark:text-slate-300">${t.fb_service_lbl}</span>
              <div class="flex gap-1" id="starsService">
                ${[1, 2, 3, 4, 5].map(s => `
                  <button type="button" onclick="App.setRating('service', ${s})" class="star-btn text-base active">★</button>
                `).join('')}
              </div>
            </div>
          </div>

          <div>
            <label class="block font-bold mb-1 text-slate-700 dark:text-slate-300">${t.fb_room_lbl}</label>
            <input type="text" id="feedbackRoomInput" value="${savedRoom}" required placeholder="${t.fb_ph_room}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
          </div>

          <div>
            <label class="block font-bold mb-1 text-slate-700 dark:text-slate-300">${t.fb_comment_lbl}</label>
            <textarea id="feedbackComment" rows="2" placeholder="${t.fb_ph_comment}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"></textarea>
          </div>

          <button type="submit" class="w-full py-3 rounded-2xl bg-brand-gold hover:bg-brand-goldDark text-slate-950 font-black text-xs shadow-md mt-2">
            ${t.fb_btn_submit}
          </button>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  setRating(cat, stars) {
    this.ratings[cat] = stars;
    const containerId = cat === 'clean' ? 'starsClean' : (cat === 'food' ? 'starsFood' : 'starsService');
    const container = document.getElementById(containerId);
    if (!container) return;

    const btns = container.querySelectorAll('.star-btn');
    btns.forEach((btn, idx) => {
      if (idx < stars) {
        btn.classList.add('active');
        btn.style.color = '#f59e0b';
      } else {
        btn.classList.remove('active');
        btn.style.color = '#cbd5e1';
      }
    });
  },

  submitFeedback(e) {
    e.preventDefault();
    this.closeModal('detailModal');
    const t = i18n[this.currentLang] || i18n.ar;
    this.showToast(t.request_not_sent, '⚠️', 5000);
  },

  // 6. Sunlight Beach Mode Toggle
  isSunlightMode: false,

  toggleSunlightMode() {
    this.playBeep(650);
    this.isSunlightMode = !this.isSunlightMode;
    document.body.classList.toggle('sunlight-mode', this.isSunlightMode);

    const btn = document.getElementById('sunlightModeBtn');
    if (btn) {
      btn.innerHTML = this.isSunlightMode ? '☀️ وضع الشاطئ (نشط)' : '☀️ وضع الشاطئ';
    }

    this.showToast(this.isSunlightMode ? 'تم تفعيل وضع الشاطئ فائق التباين تحت الشمس ☀️' : 'تم العودة للوضع الافتراضي 🌓', '🏖️');
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        if (reg) reg.update();
      }).catch(() => {});
    }
  },

  /* ================= SMART GUEST EXPERIENCE EXTENSIONS ================= */

  toggleSmartFab() {
    this.playBeep(700);
    const trigger = document.getElementById('smartFabTrigger');
    const menu = document.getElementById('smartFabMenu');
    if (!trigger || !menu) return;

    const isOpen = menu.classList.contains('active');
    if (isOpen) {
      menu.classList.remove('active');
      trigger.classList.remove('open');
    } else {
      menu.classList.add('active');
      trigger.classList.add('open');
    }
  },

  closeSmartFab() {
    const trigger = document.getElementById('smartFabTrigger');
    const menu = document.getElementById('smartFabMenu');
    if (trigger) trigger.classList.remove('open');
    if (menu) menu.classList.remove('active');
  },

  openSmartHubModal() {
    this.playBeep(700);
    this.openModal('smartHubModal');
  },

  closeSmartHubModal() {
    this.closeModal('smartHubModal');
  },

  // Instant One-Tap Housekeeping & Guest Services Dispatcher
  requestOneTapService(item) {
    this.playBeep(850);
    const t = i18n[this.currentLang] || i18n.ar;
    this.showNotice(t.request_not_sent_title, t.request_not_sent);
  },

  // Save Room Modal
  openSaveRoomModal() {
    this.playBeep(800);
    this.closeSmartFab();
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    const savedRoom = localStorage.getItem('moreno_guest_room') || '';

    content.innerHTML = `
      <div>
        <div class="flex items-center gap-3 mb-4">
          <span class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 text-2xl flex items-center justify-center font-bold">🏠</span>
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white">${t.save_room_title || 'تحديد رقم غرفتك'}</h3>
            <span class="text-xs text-slate-500">${t.save_room_sub || 'احفظ رقم غرفتك لتتمكن من العودة إليها بنقرة واحدة'}</span>
          </div>
        </div>

        <div class="space-y-3 mb-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t.save_room_lbl || 'رقم الغرفة:'}</label>
            <input type="text" id="saveRoomInput" value="${savedRoom}" placeholder="${t.save_room_ph || 'مثال: 1204'}" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-black text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold">
          </div>

          <button onclick="App.handleSaveRoomSubmit()" class="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-deep to-brand-sea text-white font-black text-xs shadow-md tap-effect">
            ${t.save_room_btn || 'حفظ وتوجيهي فوراً 🎯'}
          </button>
        </div>
      </div>
    `;

    this.openModal('detailModal');
    setTimeout(() => {
      const inp = document.getElementById('saveRoomInput');
      if (inp) inp.focus();
    }, 100);
  },

  handleSaveRoomSubmit() {
    const inp = document.getElementById('saveRoomInput');
    const val = inp ? inp.value.trim() : '';
    if (!val) return;

    localStorage.setItem('moreno_guest_room', val);
    const srvInput = document.getElementById('srvRoomNumberInput');
    if (srvInput) srvInput.value = val;
    const bkTblInput = document.getElementById('bookRoomNum');
    if (bkTblInput) bkTblInput.value = val;

    this.closeModal('detailModal');

    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;
    this.showToast(t.save_room_success || 'تم حفظ رقم غرفتك بنجاح!');

    Wayfinder.takeMeToMyRoom();
  },

  // Golf Cart Shuttle Request Modal
  openGolfCartModal(preferredDestId = null) {
    this.playBeep(800);
    this.closeSmartFab();
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    const savedRoom = localStorage.getItem('moreno_guest_room') || '';
    const originOptions = [
      { id: 'M', name: lang === 'ar' ? 'بهو الاستقبال الرئيسي (Lobby)' : 'Main Lobby & Reception' },
      { id: '1', name: lang === 'ar' ? 'منطقة الشاطئ والمارينا' : 'Beach Area & Marina Pier' },
      { id: '3', name: lang === 'ar' ? 'أكوا بارك مورينو' : 'Aqua Park Pool' },
      { id: 'N', name: lang === 'ar' ? 'المبنى الشمالي (Wing N)' : 'North Building (Wing N)' },
      { id: 'S', name: lang === 'ar' ? 'المبنى الجنوبي (Wing S)' : 'South Building (Wing S)' },
      { id: 'MLS', name: lang === 'ar' ? 'المبنى التجاري (MLS)' : 'Commercial Complex (MLS)' }
    ];

    content.innerHTML = `
      <div>
        <div class="flex items-center gap-3 mb-4">
          <span class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 text-2xl flex items-center justify-center font-bold">🛺</span>
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white">${t.shuttle_modal_title || 'طلب عربة جولف كار'}</h3>
            <span class="text-xs text-slate-500">${t.shuttle_sub || 'خدمة نقل مجانية وسريعة بالمنتجع'}</span>
          </div>
        </div>

        <form onsubmit="App.handleGolfCartSubmit(event)" class="space-y-3 mb-3">
          <div>
            <label for="shuttlePickup" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t.shuttle_pickup_lbl || 'نقطة الركوب:'}</label>
            <select id="shuttlePickup" title="${t.shuttle_pickup_lbl || 'نقطة الركوب'}" aria-label="${t.shuttle_pickup_lbl || 'نقطة الركوب'}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100">
              ${originOptions.map(o => `<option value="${o.id}">${o.name}</option>`).join('')}
            </select>
          </div>

          <div>
            <label for="shuttleDest" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t.shuttle_dest_lbl || 'الوجهة المطلوبة:'}</label>
            <select id="shuttleDest" title="${t.shuttle_dest_lbl || 'الوجهة المطلوبة'}" aria-label="${t.shuttle_dest_lbl || 'الوجهة المطلوبة'}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100">
              ${originOptions.slice().reverse().map(o => `<option value="${o.id}" ${preferredDestId && String(o.id) === String(preferredDestId) ? 'selected' : ''}>${o.name}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="shuttleGuests" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t.shuttle_passengers_lbl || 'عدد الركاب:'}</label>
              <select id="shuttleGuests" title="${t.shuttle_passengers_lbl || 'عدد الركاب'}" aria-label="${t.shuttle_passengers_lbl || 'عدد الركاب'}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100">
                <option value="1">1 فرد</option>
                <option value="2" selected>2 أفراد</option>
                <option value="3">3 أفراد</option>
                <option value="4+">4 أفراد أو أكثر</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t.srv_room || 'رقم الغرفة:'}</label>
              <input type="text" id="shuttleRoom" value="${savedRoom}" placeholder="مثال: 1204" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 text-center">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t.shuttle_notes_lbl || 'ملاحظات خاصة:'}</label>
            <input type="text" id="shuttleNotes" placeholder="${t.shuttle_notes_ph || 'أي ملاحظة للمكتب...'}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100">
          </div>

          <button type="submit" class="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-brand-gold text-slate-950 font-black text-xs shadow-md tap-effect">
            ${t.shuttle_req_btn || 'طلب العربة الآن 🛺'}
          </button>
        </form>

        <div id="shuttleStatusBox" class="hidden p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-center space-y-1">
          <span class="block text-xs font-black text-emerald-700 dark:text-emerald-300">${t.shuttle_dispatched_title || 'تم إرسال طلب العربة بنجاح!'}</span>
          <p class="text-[11px] text-slate-600 dark:text-slate-300">${t.shuttle_dispatched_desc || 'عربة النقل رقم 3 في طريقها إليك.'}</p>
          <span class="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] animate-pulse">${t.shuttle_eta || 'الوصول: 3 دقائق'}</span>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  handleGolfCartSubmit(e) {
    e.preventDefault();
    this.playBeep(900);
    const box = document.getElementById('shuttleStatusBox');
    if (box) {
      box.classList.remove('hidden');
      box.textContent = (i18n[this.currentLang] || i18n.ar).request_not_sent;
    }

    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;
    this.showToast(t.request_not_sent, '⚠️');
  },

  // Where Am I Modal
  openWhereAmIModal() {
    this.playBeep(800);
    this.closeSmartFab();
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    // Anchor POIs
    const landmarks = resortPois.filter(p => p.isBuilding || ['1', '3', '7', '8', '11'].includes(p.id));

    content.innerHTML = `
      <div>
        <div class="flex items-center gap-3 mb-4">
          <span class="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 text-2xl flex items-center justify-center font-bold">📍</span>
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white">${t.wai_title || 'أين أنا الآن؟'}</h3>
            <span class="text-xs text-slate-500">${t.wai_sub || 'حدد موقعك الحالي لنعرض لك أقرب الخدمات'}</span>
          </div>
        </div>

        <div class="space-y-3 mb-4">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">${t.wai_select_lbl || 'أنا أقف حالياً بالقرب من:'}</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto pr-1">
            ${landmarks.map(p => {
              const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(p, lang) : { name: p.nameAr };
              return `
                <button onclick="App.setWhereAmIPosition('${p.id}')" class="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 hover:border-brand-gold text-right flex items-center gap-2.5 transition tap-effect">
                  <span class="w-8 h-8 rounded-xl ${p.badgeColor} text-white font-black text-xs flex items-center justify-center shadow-sm">
                    ${p.num}
                  </span>
                  <div class="flex-1 truncate">
                    <span class="block text-xs font-extrabold text-slate-900 dark:text-white truncate">${loc.name}</span>
                    <span class="block text-[10px] text-slate-500 truncate">${p.categoryNameAr || ''}</span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  setWhereAmIPosition(poiId) {
    this.playBeep(900);
    const poi = resortPois.find(p => p.id === poiId);
    if (!poi) return;

    const lang = this.currentLang || 'ar';
    const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr };
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    MapEngine.setGuestLocation(poi.coords, loc.name, poi.id);

    // Sync origin select in wayfinder
    const selectOrigin = document.getElementById('selectOrigin');
    if (selectOrigin) {
      selectOrigin.value = poiId;
    }

    this.closeModal('detailModal');
    MapEngine.scrollToMap();
    this.showToast(`📍 ${t.wai_my_location_set || 'تم تحديد موقعك الحالي'} (${loc.name})`);
  },

  // Wi-Fi Quick Modal
  openWifiModal() {
    this.playBeep(800);
    this.closeSmartFab();
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const lang = this.currentLang || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n.ar;

    content.innerHTML = `
      <div class="text-center">
        <div class="w-14 h-14 mx-auto rounded-3xl bg-amber-500/20 text-amber-600 dark:text-amber-400 text-3xl flex items-center justify-center font-bold mb-3 shadow-inner">
          📶
        </div>
        <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">${t.wifi_modal_title || 'واي فاي المنتجع فائق السرعة'}</h3>
        <p class="text-xs text-slate-500 mb-4 max-w-sm mx-auto">${t.wifi_modal_sub || 'إنترنت مجاني وسريع في جميع أرجاء المنتجع والشاطئ'}</p>

        <!-- Network Info Box -->
        <div class="p-4 rounded-2xl bg-slate-900 text-white border border-slate-700 text-left mb-4 shadow-xl">
          <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
            <span class="text-xs text-slate-400 font-bold">${t.wifi_network_name || 'اسم الشبكة (SSID):'}</span>
            <span class="font-mono text-sm font-black text-amber-300">Moreno Free</span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <span class="block text-xs text-slate-400 font-bold">${t.wifi_password_lbl || 'كلمة المرور (Password):'}</span>
              <span class="font-mono text-base font-black text-white tracking-wider">Moreno@2026</span>
            </div>
            <button onclick="App.copyWifiPassword()" class="px-3.5 py-1.5 rounded-xl bg-brand-gold text-slate-950 font-black text-xs tap-effect shadow-md">
              ${t.btn_copy || 'نسخ 📋'}
            </button>
          </div>
        </div>

        <p class="text-[11px] text-slate-400 mb-4">${t.wifi_qr_desc || 'يمكنك الاتصال تلقائياً أو نسخ كلمة المرور واستخدامها في أي مكان بالمنتجع.'}</p>

        <button onclick="App.closeModal('detailModal')" class="w-full py-3 rounded-2xl bg-brand-navy text-white font-bold text-xs">
          ${t.modal_ok || 'تم'}
        </button>
      </div>
    `;

    this.openModal('detailModal');
  },

  // Direct WhatsApp to Reception
  openWhatsAppDirect() {
    this.playBeep(800);
    this.closeSmartFab();
    const lang = this.currentLang || 'ar';
    const room = localStorage.getItem('moreno_guest_room') || '';
    let msg = `Hello Moreno Horizon Concierge, I am guest in room ${room || '(Resort Guest)'}. I need assistance please.`;
    if (lang === 'ar') {
      msg = `مرحباً استعلامات منتجع مورينو هورايزون، أنا النزيل بالغرفة رقم ${room || 'نزيل المنتجع'}، وأحتاج لمساعدة لطفاً.`;
    } else if (lang === 'ru') {
      msg = `Здравствуйте, служба приема гостей Moreno Horizon! Я гость из номера ${room || '(Гость курорта)'}. Мне нужна помощь.`;
    } else if (lang === 'de') {
      msg = `Guten Tag Moreno Horizon Rezeption, ich bin Gast in Zimmer ${room || '(Resort Gast)'}. Ich benötige bitte Unterstützung.`;
    }

    const url = `https://wa.me/201000000000?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  },

  // Mobile Bottom Navigation Scroll Spy
  setupMobileScrollSpy() {
    const sectionIds = ['home', 'guestDashboardSection', 'wayfinder-section', 'map-section'];
    let scrollDebounce;

    window.addEventListener('scroll', () => {
      if (scrollDebounce) return;
      scrollDebounce = setTimeout(() => {
        scrollDebounce = null;
        const scrollPosition = window.scrollY + 160;

        let activeTarget = 'home';
        if (window.scrollY < 220) {
          activeTarget = 'home';
        } else {
          for (const sId of sectionIds) {
            const el = document.getElementById(sId);
            if (el && el.offsetTop <= scrollPosition) {
              if (sId === 'guestDashboardSection' || sId === 'home') {
                activeTarget = 'home';
              } else if (sId === 'wayfinder-section') {
                activeTarget = 'wayfinder-section';
              } else if (sId === 'map-section') {
                activeTarget = 'map-section';
              }
            }
          }
        }

        document.querySelectorAll('.mobile-nav-item').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-target') === activeTarget);
        });
      }, 70);
    }, { passive: true });
  },

  deferredPwaPrompt: null,

  setupPwaInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPwaPrompt = e;
      const btn = document.getElementById('pwaInstallBtn');
      if (btn) btn.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPwaPrompt = null;
      this.showToast('📱 تم تثبيت تطبيق مورينو بنجاح على هاتفك!');
    });
  },

  installPwa() {
    this.closeSmartHubModal();
    if (this.deferredPwaPrompt) {
      this.deferredPwaPrompt.prompt();
      this.deferredPwaPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          this.showToast('🎉 شكراً لتثبيت تطبيق منتجع مورينو هورايزون!');
        }
        this.deferredPwaPrompt = null;
      });
    } else {
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIos) {
        this.showNotice(
          'تثبيت التطبيق على الآيفون 📲',
          '<div class="text-right space-y-2 text-xs leading-relaxed font-semibold"><span>لتشغيل الدليل كأي تطبيق فندقي أصلي سريع:</span><br><span>1. اضغط زر المشاركة <strong>(⎋)</strong> أسفل متصفح Safari.</span><br><span>2. مرر للأعلى واختر <strong>(إضافة إلى الصفحة الرئيسية - Add to Home Screen)</strong>.</span><br><span>3. ستظهر أيقونة المنتجع الفاخرة على شاشتك فوراً!</span></div>'
        );
      } else {
        this.showToast('التطبيق جاهز ويعمل بكفاءة على هاتفك حتى بدون إنترنت 📶');
      }
    }
  }
};

// Global shorthand aliases for HTML inline event handlers
function selectPoi(id) { MapEngine.selectPoi(id); }
function zoomMap(factor) { MapEngine.zoom(factor); }
function resetMapTransform() { MapEngine.resetTransform(); }
function toggleMapFullscreen() { MapEngine.toggleFullscreen(); }
function focusResortMap() { MapEngine.scrollToMap(); }
function filterMapCategory(cat, btn) { MapEngine.filterCategory(cat, btn); }

function handleRoomLookup() { Wayfinder.lookupRoom(); }
function quickSelectRoom(num) { Wayfinder.quickSelectRoom(num); }
function resetWayfinder() { Wayfinder.reset(); }
function calculateCustomRoute() { Wayfinder.calculateRoute(); }
function takeMeToMyRoom() { Wayfinder.takeMeToMyRoom(); }

function filterCategory(cat, btn) { App.filterCategory(cat, btn); }
function copyWifiPassword() { App.copyWifiPassword(); }
function toggleAudio() { App.toggleAudio(); }
function toggleDarkMode() { App.toggleDarkMode(); }
function changeLanguage(lang) { App.changeLanguage(lang); }
function openVoiceNavigator() { App.openVoiceNavigator(); }

function openGuestServicesModal() { App.openGuestServicesModal(); }
function requestOneTapService(item) { App.requestOneTapService(item); }
function openTableBookingModal(rest) { App.openTableBookingModal(rest); }
function confirmTableBooking(e) { App.confirmTableBooking(e); }

function openAiChatModal() { App.openModal('aiChatModal'); }
function openAiItineraryModal() { App.openModal('aiItineraryModal'); }
function closeModal(id) { App.closeModal(id); }
function sendQuickQuestion(q) { App.sendQuickQuestion(q); }
function sendAiMessage() { App.sendAiMessage(); }
function generateItinerary() { App.generateItinerary(); }
function setAsRouteDestination(id) { App.setAsRouteDestination(id); }
function openSpotlightSearch() { App.openSpotlightSearch(); }
function openGalleryModal() { App.openGalleryModal(); }
function openCompendiumModal() { App.openCompendiumModal(); }
function openSmartHubModal() { App.openSmartHubModal(); }
function closeSmartHubModal() { App.closeSmartHubModal(); }
function closeAllModals() { App.closeAllModals(); }

function openRoomPassModal() { App.openRoomPassModal(); }
function startCinematicTour() { App.startCinematicTour(); }
function stopCinematicTour() { App.stopCinematicTour(); }
function nextTourStep() { App.nextTourStep(); }
function openFeedbackModal() { App.openFeedbackModal(); }
function toggleSunlightMode() { App.toggleSunlightMode(); }

// New Smart Hub Global Shorthands
function toggleSmartFab() { App.toggleSmartFab(); }
function openSaveRoomModal() { App.openSaveRoomModal(); }
function openGolfCartModal(preferredDestId) { App.openGolfCartModal(preferredDestId); }
function openShuttleWithDest(destId) { App.openGolfCartModal(destId); }
function scrollToSection(id) {
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === 'home');
    });
    return;
  }
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === id);
    });
  }
}
function openWhereAmIModal() { App.openWhereAmIModal(); }
function openWifiModal() { App.openWifiModal(); }
function openWhatsAppDirect() { App.openWhatsAppDirect(); }
function openHotspotLoginModal() { App.openHotspotLoginModal(); }
function closeHotspotLoginModal() { App.closeHotspotLoginModal(); }
function openMikrotikPortal() { App.openMikrotikPortal(); }
function openEmergencyDrawer() { App.openEmergencyDrawer(); }
function closeEmergencyDrawer() { App.closeEmergencyDrawer(); }
function shareGuestCoordinates() { App.shareGuestCoordinates(); }
// ========================================================
// LUXURY WEB AUDIO SYNTHESIS ENGINE (0 EXTERNAL DEPENDENCIES)
// ========================================================
const PromoAudioEngine = {
  ctx: null,
  isMuted: false,
  waveGain: null,
  chordInterval: null,
  activeNodes: [],

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext init muted:', e);
    }
  },

  start() {
    this.init();
    if (!this.ctx) return;
    this.stop();

    try {
      // 1. Synthesize Realistic Ocean Surf Waves (Filtered Noise + LFO)
      const bufferSize = this.ctx.sampleRate * 4;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 340;
      filter.Q.value = 2.2;

      const waveGain = this.ctx.createGain();
      waveGain.gain.value = this.isMuted ? 0 : 0.12;

      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.22; // ~4.5 seconds swell

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.08;

      lfo.connect(lfoGain);
      lfoGain.connect(waveGain.gain);

      const filterMod = this.ctx.createGain();
      filterMod.gain.value = 260;
      lfo.connect(filterMod);
      filterMod.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(this.ctx.destination);

      noise.start(0);
      lfo.start(0);

      this.activeNodes.push(noise, lfo, filter, waveGain, lfoGain, filterMod);
      this.waveGain = waveGain;

      // 2. Synthesize Gentle Luxury Ambient Pad Chords
      const chords = [
        [392.00, 493.88, 587.33, 739.99], // G maj7
        [329.63, 392.00, 493.88, 587.33], // Em7
        [349.23, 440.00, 523.25, 659.25], // F maj7
        [293.66, 369.99, 440.00, 587.33]  // D add9
      ];
      let chordIdx = 0;

      const playLuxuryPad = () => {
        if (this.isMuted || !this.ctx || this.ctx.state === 'closed') return;
        const notes = chords[chordIdx % chords.length];
        chordIdx++;
        const now = this.ctx.currentTime;

        notes.forEach((freq, i) => {
          try {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);

            g.gain.setValueAtTime(0.0001, now + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.022, now + i * 0.12 + 0.6);
            g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 3.8);

            osc.connect(g);
            g.connect(this.ctx.destination);

            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 4.0);
            this.activeNodes.push(osc, g);
          } catch (e) {}
        });
      };

      playLuxuryPad();
      this.chordInterval = setInterval(playLuxuryPad, 5000);
    } catch (e) {
      console.warn('Audio synthesis fallback:', e);
    }
  },

  playTransitionChime() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 880.00, 1174.66]; // D5, A5, D6 sparkling chime
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        g.gain.setValueAtTime(0.0001, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.032, now + idx * 0.08 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.3);
      });
    } catch (e) {}
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.waveGain && this.ctx) {
      this.waveGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);
    }
    return this.isMuted;
  },

  stop() {
    if (this.chordInterval) {
      clearInterval(this.chordInterval);
      this.chordInterval = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
  }
};

// ========================================================
// AI CONCIERGE MULTILINGUAL AUDIO NARRATION ENGINE (ULTRA-NATURAL NEURAL HD)
// ========================================================
const ConciergeAudioGuide = {
  synth: typeof window !== 'undefined' ? window.speechSynthesis : null,
  currentUtterance: null,
  isSpeaking: false,
  isMuted: false,
  availableVoices: [],

  init() {
    if (!this.synth) return;
    const loadVoices = () => {
      this.availableVoices = this.synth.getVoices();
    };
    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  },

  getBestNaturalVoice(langPrefix) {
    const voices = this.availableVoices.length ? this.availableVoices : (this.synth.getVoices ? this.synth.getVoices() : []);
    if (!voices || voices.length === 0) return null;

    const langTargetMap = {
      ar: ['ar-EG', 'ar-SA', 'ar-AE', 'ar'],
      en: ['en-US', 'en-GB', 'en-AU', 'en'],
      ru: ['ru-RU', 'ru'],
      de: ['de-DE', 'de-AT', 'de']
    };

    const targetLocales = langTargetMap[langPrefix] || [langPrefix];

    // Filter to candidates matching the language
    const candidates = voices.filter(v => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return targetLocales.some(t => vLang.startsWith(t.toLowerCase())) || vLang.startsWith(langPrefix);
    });

    if (candidates.length === 0) return null;

    // Score candidates: prioritize modern Natural & Neural voices
    const scored = candidates.map(voice => {
      const name = (voice.name || '').toLowerCase();
      let score = 0;

      // 1. Neural & Natural keywords (Microsoft Neural, Google Cloud, Apple Neural)
      if (name.includes('natural')) score += 120;
      if (name.includes('online')) score += 100;
      if (name.includes('neural')) score += 110;
      if (name.includes('enhanced')) score += 85;
      if (name.includes('premium')) score += 75;
      if (name.includes('google')) score += 65;
      if (name.includes('siri')) score += 65;

      // 2. Specific warm concierge voices
      if (langPrefix === 'ar') {
        if (name.includes('shakir') || name.includes('salma') || name.includes('hamed') || name.includes('zariyah')) score += 60;
        if (name.includes('tarik') || name.includes('laila') || name.includes('maged')) score += 45;
      } else if (langPrefix === 'en') {
        if (name.includes('jenny') || name.includes('guy') || name.includes('aria') || name.includes('ryan')) score += 60;
      } else if (langPrefix === 'ru') {
        if (name.includes('svetlana') || name.includes('dmitry')) score += 60;
      } else if (langPrefix === 'de') {
        if (name.includes('katja') || name.includes('conrad')) score += 60;
      }

      // 3. Exact locale preference
      const vLang = (voice.lang || '').toLowerCase().replace('_', '-');
      if (vLang === targetLocales[0].toLowerCase()) score += 30;

      // 4. Heavily penalize legacy robotic offline SAPI/desktop voices
      if (name.includes('desktop')) score -= 90;
      if (name.includes('espeak')) score -= 160;
      if (name.includes('msss')) score -= 70;

      return { voice, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.voice || candidates[0];
  },

  humanizeTextForSpeech(text, langPrefix) {
    if (!text) return '';
    let cleaned = String(text);

    // 1. Remove URLs, technical IDs
    cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');
    cleaned = cleaned.replace(/#(\d+)/g, langPrefix === 'ar' ? 'رقم $1' : 'Number $1');
    cleaned = cleaned.replace(/#\S+/g, '');

    // 2. Remove emojis
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA70}-\u{1FAFF}]/gu, '');

    // 3. Remove alternate language in parentheses (e.g. "مسبح لوتس (Lotus Pool)" -> "مسبح لوتس")
    if (langPrefix === 'ar') {
      cleaned = cleaned.replace(/\([A-Za-z\s&'-]+\)/g, '');
    } else if (langPrefix === 'en') {
      cleaned = cleaned.replace(/\([\u0600-\u06FF\s&'-]+\)/g, '');
    }

    // Clean remaining brackets
    cleaned = cleaned.replace(/[()\[\]{}«»""]/g, ' ');

    // 4. Punctuation for natural human breathing pauses
    cleaned = cleaned.replace(/\s*•\s*/g, '، ');
    cleaned = cleaned.replace(/\s*\|\s*/g, '، ');
    cleaned = cleaned.replace(/\s*➔\s*/g, langPrefix === 'ar' ? ' إلى ' : ' to ');
    cleaned = cleaned.replace(/[-_~]/g, ' ');

    // 5. Clean whitespace & repeated commas
    cleaned = cleaned.replace(/،+/g, '،');
    cleaned = cleaned.replace(/\.+/g, '.');
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

    return cleaned;
  },

  speak(rawText, lang = 'ar', onEnd = null) {
    if (!this.synth || this.isMuted || !rawText) return;
    this.stop();

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch (e) {}

    const langPrefix = (lang || 'ar').toLowerCase().slice(0, 2);
    const speechText = this.humanizeTextForSpeech(rawText, langPrefix);
    if (!speechText) return;

    const utterance = new SpeechSynthesisUtterance(speechText);

    const langTargetMap = {
      ar: 'ar-EG',
      en: 'en-US',
      ru: 'ru-RU',
      de: 'de-DE'
    };
    utterance.lang = langTargetMap[langPrefix] || 'ar-EG';

    // Select the best HD Natural Neural Voice
    const naturalVoice = this.getBestNaturalVoice(langPrefix);
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    // Conversational, warm concierge pacing & pitch
    utterance.rate = langPrefix === 'ar' ? 0.92 : (langPrefix === 'ru' ? 0.94 : 0.95);
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.updateWavebarsUI(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.updateWavebarsUI(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.updateWavebarsUI(false);
      console.warn('Speech synthesis error:', e);
    };

    this.currentUtterance = utterance;
    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  },

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
    this.updateWavebarsUI(false);
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    }
    return this.isMuted;
  },

  updateWavebarsUI(speaking) {
    const bars = document.querySelectorAll('.audio-narration-wave');
    bars.forEach(b => {
      if (speaking) b.classList.add('animate-wave');
      else b.classList.remove('animate-wave');
    });
    const label = document.getElementById('tourAudioNarrationLabel');
    if (label) {
      const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
      const t = (typeof i18n !== 'undefined' && i18n[lang]) || {};
      label.innerText = speaking ? (t.audio_concierge_speaking || 'جارٍ التحدث...') : (t.audio_concierge_listen || 'المرشد الصوتي');
    }
  }
};

// ========================================================
// AI VOICE CONCIERGE & WAYFINDER NAVIGATOR (VOICE TO ROUTE)
// ========================================================
const VoiceNavigator = {
  recognition: null,
  isListening: false,

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 3;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.updateUiState(true);
        };

        this.recognition.onresult = (event) => {
          this.isListening = false;
          this.updateUiState(false);
          if (event.results && event.results[0] && event.results[0][0]) {
            const transcript = event.results[0][0].transcript;
            this.processVoiceQuery(transcript);
          }
        };

        this.recognition.onerror = (event) => {
          this.isListening = false;
          this.updateUiState(false);
          console.warn('Voice recognition error:', event.error);
          const statusEl = document.getElementById('voiceNavStatusText');
          if (statusEl) {
            const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
            statusEl.innerText = lang === 'ar' ? 'تعذر التقاط الصوت، يمكنك الكتابة في الحقل أدناه 👇' : 'Could not capture voice, please type below 👇';
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.updateUiState(false);
        };
      } catch (e) {
        console.warn('SpeechRecognition init failed:', e);
      }
    }
  },

  openModal() {
    if (typeof App !== 'undefined' && App.playBeep) App.playBeep(850);
    const modal = document.getElementById('voiceNavModal');
    if (!modal) return;

    if (typeof App !== 'undefined' && App.openModal) {
      App.openModal('voiceNavModal');
    } else {
      modal.classList.remove('hidden');
    }

    const input = document.getElementById('voiceNavManualInput');
    if (input) input.value = '';

    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) || {};
    const statusText = document.getElementById('voiceNavStatusText');
    if (statusText) statusText.innerText = t.voice_nav_tap || 'اضغط على الميكروفون وتحدث بوجهتك 🎙️';

    // Auto trigger listening if supported
    setTimeout(() => {
      this.startListening();
    }, 350);
  },

  startListening() {
    if (typeof ConciergeAudioGuide !== 'undefined') {
      ConciergeAudioGuide.stop();
    }

    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const langMap = {
      ar: 'ar-EG',
      en: 'en-US',
      ru: 'ru-RU',
      de: 'de-DE'
    };

    if (this.recognition) {
      try {
        this.recognition.lang = langMap[lang] || 'ar-EG';
        this.recognition.start();
        return;
      } catch (e) {
        try {
          this.recognition.stop();
          setTimeout(() => {
            try { this.recognition.start(); } catch(err) {}
          }, 150);
          return;
        } catch (err) {}
      }
    }

    this.updateUiState(false, true);
  },

  stopListening() {
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch(e) {}
    }
    this.isListening = false;
    this.updateUiState(false);
  },

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  },

  updateUiState(isListening, isFallback = false) {
    const micBtn = document.getElementById('voiceNavMicBtn');
    const pulseRings = document.getElementById('voiceNavRings');
    const statusText = document.getElementById('voiceNavStatusText');
    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) || {};

    if (pulseRings) {
      if (isListening) pulseRings.classList.add('voice-rings-active');
      else pulseRings.classList.remove('voice-rings-active');
    }

    if (micBtn) {
      if (isListening) {
        micBtn.classList.add('voice-mic-active');
      } else {
        micBtn.classList.remove('voice-mic-active');
      }
    }

    if (statusText) {
      if (isListening) {
        statusText.innerText = t.voice_nav_listening || 'أنا أستمع إليك الآن... تحدث وسأدلك فوراً 🎙️';
      } else if (isFallback) {
        statusText.innerText = t.voice_nav_fallback || 'اكتب وجهتك أو اختر من الأماكن المقترحة أدناه 👇';
      }
    }
  },

  processVoiceQuery(rawQuery) {
    if (!rawQuery || !rawQuery.trim()) return;
    const query = rawQuery.trim();
    const queryInput = document.getElementById('voiceNavManualInput');
    if (queryInput) queryInput.value = query;

    const statusText = document.getElementById('voiceNavStatusText');
    if (statusText) statusText.innerText = `"${query}"...`;

    // 1. Room numbers detection (e.g. 1520, 2015, رقم 1124)
    const normalized = query.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    const roomMatch = normalized.match(/\b\d{3,4}\b/);
    if (roomMatch) {
      const roomNum = parseInt(roomMatch[0]);
      this.routeToRoom(roomNum);
      return;
    }

    // 2. Check for "غرفتي" / "my room"
    const lower = query.toLowerCase();
    if (lower.includes('غرفتي') || lower.includes('أوضتي') || lower.includes('my room') || lower.includes('mein zimmer') || lower.includes('мой номер')) {
      const savedRoom = localStorage.getItem('moreno_guest_room');
      if (savedRoom) {
        this.routeToRoom(parseInt(savedRoom));
        return;
      }
    }

    // 3. Match against known POIs and Facilities
    const matchedPoi = this.resolvePoiFromText(query);
    if (matchedPoi) {
      this.routeToPoi(matchedPoi);
      return;
    }

    // 4. Fallback search via MapEngine
    if (typeof MapEngine !== 'undefined') {
      const results = MapEngine.searchPois(query);
      if (results && results.length > 0) {
        this.routeToPoi(results[0]);
        return;
      }
    }

    // Unrecognized
    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const notFoundMsg = lang === 'ar' 
      ? `عفواً، لم أتعرف على "${query}". جرب قول "المسبح" أو "المطعم" أو "الشاطئ"`
      : `Sorry, couldn't find "${query}". Try saying "pool", "beach", or "restaurant"`;
    if (statusText) statusText.innerText = notFoundMsg;
    if (typeof ConciergeAudioGuide !== 'undefined') {
      ConciergeAudioGuide.speak(notFoundMsg, lang);
    }
  },

  resolvePoiFromText(text) {
    const t = text.toLowerCase();

    const rules = [
      { id: "1", keys: ["شاطئ", "بحر", "مارينا", "يخت", "سنوركلينج", "beach", "marina", "sea", "пляж", "strand"] },
      { id: "3", keys: ["اكوا", "أكوا", "زحاليق", "زلاجات", "العاب مائية", "aqua", "water park", "aquapark", "аквапарк"] },
      { id: "6", keys: ["مسبح", "حمام سباحة", "لوتس", "بحيرة", "تان", "pool", "lotus", "swimming", "бассейн"] },
      { id: "8", keys: ["لا ماما", "ايطالي", "إيطالي", "بيتزا", "باستا", "la mama", "italian", "pizza", "итальянский"] },
      { id: "12", keys: ["سيرينا", "مطعم", "بوفيه", "اكل", "أكل", "فطار", "افطار", "غداء", "عشاء", "restaurant", "buffet", "sirena", "breakfast", "dinner", "ресторан"] },
      { id: "5", keys: ["بار الشاطئ", "عصير", "كوكتيل", "مشروبات الشاطئ", "beach bar"] },
      { id: "7", keys: ["بار المسبح", "بار لوتس", "pool bar"] },
      { id: "14", keys: ["سبا", "مساج", "جاكوزي", "ساونا", "حمام مغربي", "تدليك", "spa", "massage", "wellness", "спа"] },
      { id: "15", keys: ["جيم", "رياضة", "لياقة", "gym", "fitness", "спортзал"] },
      { id: "16", keys: ["تنس", "ملعب", "tennis", "корт"] },
      { id: "2", keys: ["غوص", "غطس", "دايفينج", "diving", "дайвинг", "tauchen"] },
      { id: "4", keys: ["كيدز", "اطفال", "أطفال", "العاب", "kids", "playground", "детский"] },
      { id: "13", keys: ["استقبال", "لوبي", "ريسبشن", "ادارة", "lobby", "reception", "ресепшн", "empfang"] },
      { id: "17", keys: ["محلات", "سوق", "شوبنج", "تسوق", "بازار", "shops", "mall", "shopping", "магазин"] },
      { id: "19", keys: ["مسجد", "مصلى", "جامع", "صلاة", "mosque", "мечеть"] },
      { id: "20", keys: ["عيادة", "دكتور", "طبيب", "صيدلية", "clinic", "doctor", "клиника", "arzt"] },
      { id: "21", keys: ["مسرح", "انيميشن", "حفلة", "عروض", "theater", "show", "animation", "театр"] },
      { id: "18", keys: ["بوابة", "خروج", "تاكسي", "شارع", "gate", "exit", "ворота"] }
    ];

    for (const rule of rules) {
      if (rule.keys.some(k => t.includes(k))) {
        return resortPois.find(p => p.id === rule.id);
      }
    }

    return resortPois.find(p => 
      t.includes(p.nameAr.toLowerCase()) || 
      (p.nameEn && t.includes(p.nameEn.toLowerCase()))
    );
  },

  routeToPoi(poi) {
    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const loc = (typeof getLocalizedPoi === 'function') ? getLocalizedPoi(poi, lang) : { name: poi.nameAr };

    const confirmMsg = lang === 'ar'
      ? `حاضر! جاري توجيهك إلى ${loc.name} ورسم أسرع مسار للمشي 🗺️`
      : (lang === 'ru' ? `Отлично! Прокладываю маршрут к ${loc.name}...`
      : (lang === 'de' ? `Alles klar! Ich führe Sie zu ${loc.name}...`
      : `Got it! Navigating you to ${loc.name}...`));

    const statusText = document.getElementById('voiceNavStatusText');
    if (statusText) statusText.innerText = confirmMsg;

    if (typeof ConciergeAudioGuide !== 'undefined') {
      ConciergeAudioGuide.speak(confirmMsg, lang);
    }

    setTimeout(() => {
      App.closeModal('voiceNavModal');
      const mapSection = document.getElementById('map-section') || document.getElementById('mapViewport');
      if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

      App.setAsRouteDestination(poi.id);

      if (typeof App.showToast === 'function') {
        App.showToast(`تم توجيهك إلى: ${loc.name} 🗺️`, '🚶‍♂️');
      }
    }, 1400);
  },

  routeToRoom(roomNum) {
    const lang = (typeof App !== 'undefined' && App.currentLang) || 'ar';
    const confirmMsg = lang === 'ar'
      ? `حاضر! جاري تحديد مسار الغرفة رقم ${roomNum}...`
      : `Navigating to room ${roomNum}...`;

    const statusText = document.getElementById('voiceNavStatusText');
    if (statusText) statusText.innerText = confirmMsg;

    if (typeof ConciergeAudioGuide !== 'undefined') {
      ConciergeAudioGuide.speak(confirmMsg, lang);
    }

    setTimeout(() => {
      App.closeModal('voiceNavModal');
      const input = document.getElementById('roomSearchInput');
      if (input) input.value = roomNum;
      if (typeof handleRoomLookup === 'function') handleRoomLookup();

      const mapSection = document.getElementById('map-section') || document.getElementById('mapViewport');
      if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1400);
  }
};

// ========================================================
// SMART SUN & SHADE LIVE RADAR ENGINE
// ========================================================
const SunShadeTracker = {
  LATITUDE: 27.2579,
  LONGITUDE: 33.8116,

  getSolarTelemetry(date = new Date()) {
    // Current Hurghada time (UTC+3)
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const hurghadaHour = (utcHours + 3) % 24;

    // Day of year
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Approximate solar declination
    const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);

    // Solar hour angle (degrees)
    const solarTime = hurghadaHour - 0.25;
    const hourAngle = (solarTime - 12) * 15;

    // Solar elevation
    const latRad = (this.LATITUDE * Math.PI) / 180;
    const decRad = (declination * Math.PI) / 180;
    const haRad = (hourAngle * Math.PI) / 180;

    const sinElevation = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
    const elevation = (Math.asin(Math.max(-1, Math.min(1, sinElevation))) * 180) / Math.PI;

    // Solar azimuth
    const cosAzimuth = (Math.sin(decRad) - Math.sin(latRad) * sinElevation) / (Math.cos(latRad) * Math.cos((elevation * Math.PI) / 180));
    let azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI;
    if (hourAngle > 0) azimuth = 360 - azimuth;

    const shadowAzimuth = (azimuth + 180) % 360;

    let statusKey = 'sun_state_night';
    let uvIndex = 0;
    if (elevation > 50) {
      statusKey = 'sun_state_peak';
      uvIndex = Math.min(11, Math.round(elevation / 7));
    } else if (elevation > 22) {
      statusKey = hourAngle < 0 ? 'sun_state_morning' : 'sun_state_afternoon';
      uvIndex = Math.min(8, Math.round(elevation / 9));
    } else if (elevation > 0) {
      statusKey = 'sun_state_golden';
      uvIndex = 2;
    }

    return {
      hour: hurghadaHour,
      elevation: Math.max(0, elevation),
      azimuth,
      shadowAzimuth,
      statusKey,
      uvIndex,
      isDaylight: elevation > 0
    };
  },

  getResortZoneAnalysis(telemetry) {
    const { azimuth, isDaylight } = telemetry;
    if (!isDaylight) {
      return {
        sunnySpots: [],
        shadedSpots: [
          { nameAr: "ممشى الشاطئ والمارينا الهادئ", nameEn: "Peaceful Beach & Marina Pier", icon: "🌊", badgeAr: "نسيم ليلي منعش", badgeEn: "Fresh Night Breeze" },
          { nameAr: "تراس مطعم لا ماما الإيطالي", nameEn: "La Mama Italian Candlelit Terrace", icon: "🍕", badgeAr: "عشاء هادئ تحت النجوم", badgeEn: "Candlelit Under Stars" },
          { nameAr: "حدائق مسبح لوتس المضاءة", nameEn: "Illuminated Lotus Pool Gardens", icon: "🏊‍♂️", badgeAr: "أجواء مسائية ساحرة", badgeEn: "Magical Night Ambience" }
        ]
      };
    }

    if (azimuth < 150) {
      return {
        sunnySpots: [
          { nameAr: "رصيف مارينا الشاطئ الشرقي", nameEn: "Eastern Marina Pier Shoreline", icon: "🌊", badgeAr: "شمس صباحية مشرقة 100%", badgeEn: "100% Morning Sun" },
          { nameAr: "أسرّة التشمس بمسبح لوتس", nameEn: "Lotus Central Pool Sunbeds", icon: "🏊‍♂️", badgeAr: "تشميس مباشر ممتاز", badgeEn: "Prime Direct Sun" },
          { nameAr: "زلاجات الأكوا بارك ومسبح الأطفال", nameEn: "Aqua Park Slides & Pool", icon: "🛝", badgeAr: "مياه دافئة وأشعة مباشرة", badgeEn: "Warm Water & Sun" }
        ],
        shadedSpots: [
          { nameAr: "مظلات كابانات الشاطئ الشمالية", nameEn: "North Beach Shaded Cabanas", icon: "🏖️", badgeAr: "ظل بحري منعش", badgeEn: "Cool Sea Breeze Shade" },
          { nameAr: "الحدائق خلف المبنى الشمالي (N)", nameEn: "Gardens behind North Wing (N)", icon: "🌴", badgeAr: "ظل طبيعي بارد", badgeEn: "Cool Garden Shade" },
          { nameAr: "برجولات مطعم سيرينا الخارجية", nameEn: "Sirena Pergola Terrace", icon: "🍽️", badgeAr: "إفطار في الظل اللطيف", badgeEn: "Shaded Breakfast" }
        ]
      };
    }

    if (azimuth < 220) {
      return {
        sunnySpots: [
          { nameAr: "مسبح لوتس والبار المائي", nameEn: "Lotus Central Pool & Pool Bar", icon: "🏊‍♂️", badgeAr: "شمس عمودية كاملة (تان)", badgeEn: "Peak Vertical Sun" },
          { nameAr: "شاطئ الرمال الذهبية المفتوح", nameEn: "Open Golden Sand Beach", icon: "🏖️", badgeAr: "تشميس شاطئي نقي 100%", badgeEn: "Pure Beach Sun" },
          { nameAr: "ملاعب التنس والأنشطة الرياضية", nameEn: "Tennis Sports Arena", icon: "🎾", badgeAr: "شمس كاملة", badgeEn: "Full Daylight" }
        ],
        shadedSpots: [
          { nameAr: "بار الشاطئ المسقوف بالأخشاب", nameEn: "Shaded Timber Beach Bar", icon: "🍹", badgeAr: "ظل واقي ومشروبات مثلجة", badgeEn: "Canopy Shade & Drinks" },
          { nameAr: "أروقة بهو اللوبي الملكي المكيفة", nameEn: "Air-conditioned Lobby Lounges", icon: "🏛️", badgeAr: "راحة تامة بعيداً عن الحرارة", badgeEn: "Cool Air Comfort" },
          { nameAr: "الممر المظلل للمبنى التجاري MLS", nameEn: "Covered Promenade to Wing MLS", icon: "🌴", badgeAr: "ظل دائم ومريح", badgeEn: "Continuous Shade" }
        ]
      };
    }

    return {
      sunnySpots: [
        { nameAr: "رصيف المارينا الممتد في البحر", nameEn: "Extended Marina Pier", icon: "🌅", badgeAr: "أجمل إطلالة لغروب الشمس", badgeEn: "Spectacular Sunset View" },
        { nameAr: "بار الشاطئ والممشى الفيروزي", nameEn: "Beach Bar Front Deck", icon: "🍹", badgeAr: "شمس ذهبية دافئة وهادئة", badgeEn: "Golden Hour Glow" },
        { nameAr: "تراس الجناح الجنوبي (S)", nameEn: "South Wing (S) Terraces", icon: "☀️", badgeAr: "دفء الأصيل المنعش", badgeEn: "Warm Sunset Terrace" }
      ],
      shadedSpots: [
        { nameAr: "كراسي مسبح لوتس الغربية (ظل المباني)", nameEn: "Lotus Pool East Loungers", icon: "🏊‍♂️", badgeAr: "ظل واسع وهادئ للسباحة", badgeEn: "Building Shadow Shade" },
        { nameAr: "تراس مطعم لا ماما الإيطالي", nameEn: "La Mama Italian Garden Terrace", icon: "🍕", badgeAr: "جلسة عصرية منعشة", badgeEn: "Breezy Evening Shade" },
        { nameAr: "حدائق النادي الصحي والسبا", nameEn: "Spa Sanctuary Palm Gardens", icon: "💆", badgeAr: "استرخاء منعش في الظل", badgeEn: "Tranquil Oasis Shade" }
      ]
    };
  }
};

// ========================================================
// PROMO VIDEO PLAYER CONTROLLER (4K INTERACTIVE CINEMA)
// ========================================================
const PromoVideoPlayer = {
  scenes: [],
  currentIndex: 0,
  isPlaying: false,
  activeLayer: 'A',
  sceneDuration: 6500,
  elapsedMs: 0,
  rafId: null,
  lastTimestamp: null,
  isInitialized: false,

  init() {
    if (this.isInitialized) return;
    this.scenes = (typeof promoVideoScenes !== 'undefined') ? promoVideoScenes : [];
    this.bindKeyboard();
    this.isInitialized = true;
  },

  open() {
    try {
      this.init();
      if (!this.scenes.length) {
        App.showToast('جاري تحضير مشاهد العرض...', '⏳');
        return;
      }

      const modal = document.getElementById('promoVideoModal');
      if (!modal) return;

      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');

      this.currentIndex = 0;
      this.isPlaying = true;
      this.elapsedMs = 0;
      this.lastTimestamp = null;

      this.renderProgressBars();
      this.renderThumbnails();
      this.displayScene(this.currentIndex, true);

      try {
        PromoAudioEngine.start();
        this.updateAudioUI();
      } catch (audioErr) {
        console.warn('Promo audio start error:', audioErr);
      }

      this.startLoop();
    } catch (err) {
      console.error('Error opening promo video:', err);
    }
  },

  close() {
    this.pause();
    try {
      PromoAudioEngine.stop();
    } catch (e) {}
    const modal = document.getElementById('promoVideoModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  },

  renderProgressBars() {
    const track = document.getElementById('promoProgressBarTrack');
    if (!track) return;
    track.innerHTML = this.scenes.map((s, idx) => `
      <div class="story-step-bar ${idx === this.currentIndex ? 'active' : ''}" id="storyBar-${idx}" onclick="PromoVideoPlayer.jumpTo(${idx})">
        <div class="story-step-fill" id="storyFill-${idx}"></div>
      </div>
    `).join('');
  },

  renderThumbnails() {
    const pills = document.getElementById('promoThumbPills');
    if (!pills) return;
    pills.innerHTML = this.scenes.map((s, idx) => `
      <button onclick="PromoVideoPlayer.jumpTo(${idx})" id="thumbBtn-${idx}" class="tap-effect px-2.5 py-1 rounded-xl text-[10px] font-bold transition whitespace-nowrap ${idx === this.currentIndex ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 hover:bg-white/20 text-white'}">
        ${s.tagAr || (idx + 1)}
      </button>
    `).join('');
  },

  displayScene(index, isFirst = false) {
    const scene = this.scenes[index];
    if (!scene) return;

    this.currentIndex = index;
    this.elapsedMs = 0;
    this.lastTimestamp = null;
    this.sceneDuration = scene.duration || 6500;

    const lang = App.currentLang || 'ar';
    const capLang = lang.charAt(0).toUpperCase() + lang.slice(1);

    const title = scene['title' + capLang] || scene.titleAr || scene.titleEn;
    const desc = scene['desc' + capLang] || scene.descAr || scene.descEn;
    const badge = scene.badge || '🌟 5-Star Luxury Resort';

    // 1. Crossfade Image Layers (A <-> B)
    const layerA = document.getElementById('promoSceneLayerA');
    const layerB = document.getElementById('promoSceneLayerB');

    if (layerA && layerB) {
      if (this.activeLayer === 'A' && !isFirst) {
        layerB.style.backgroundImage = `url('${scene.image}')`;
        layerB.style.opacity = '1';
        layerA.style.opacity = '0';
        layerB.className = 'absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 opacity-100 ken-burns-anim-b';
        this.activeLayer = 'B';
      } else {
        layerA.style.backgroundImage = `url('${scene.image}')`;
        layerA.style.opacity = '1';
        layerB.style.opacity = '0';
        layerA.className = 'absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 opacity-100 ken-burns-anim-a';
        this.activeLayer = 'A';
      }
    }

    // 2. Update HUD Typography & Badges
    const counterEl = document.getElementById('promoSceneCounter');
    if (counterEl) counterEl.innerText = `${index + 1} / ${this.scenes.length}`;

    const catEl = document.getElementById('promoSceneCategory');
    if (catEl) catEl.innerText = badge;

    const titleEl = document.getElementById('promoSceneTitle');
    if (titleEl) titleEl.innerText = title;

    const descEl = document.getElementById('promoSceneDesc');
    if (descEl) descEl.innerText = desc;

    // Trigger HUD Fade-in
    const hud = document.getElementById('promoSceneHud');
    if (hud) {
      hud.classList.remove('promo-text-fade-in');
      void hud.offsetWidth; // reflow
      hud.classList.add('promo-text-fade-in');
    }

    // 3. Dynamic Action Buttons
    this.updateSceneActions(scene);

    // 4. Update Story Progress Bars
    this.scenes.forEach((_, idx) => {
      const fill = document.getElementById(`storyFill-${idx}`);
      const bar = document.getElementById(`storyBar-${idx}`);
      if (bar) bar.className = `story-step-bar ${idx === index ? 'active' : ''}`;
      if (fill) {
        if (idx < index) {
          fill.style.width = '100%';
        } else if (idx > index) {
          fill.style.width = '0%';
        } else {
          fill.style.width = '0%';
        }
      }
    });

    // 5. Update Thumbnail Buttons
    this.scenes.forEach((_, idx) => {
      const btn = document.getElementById(`thumbBtn-${idx}`);
      if (btn) {
        btn.className = `tap-effect px-2.5 py-1 rounded-xl text-[10px] font-bold transition whitespace-nowrap ${idx === index ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 hover:bg-white/20 text-white'}`;
      }
    });

    // 6. Audio Chime
    if (!isFirst) {
      PromoAudioEngine.playTransitionChime();
    }
  },

  updateSceneActions(scene) {
    const featureBtn = document.getElementById('promoActFeatureBtn');
    const featureText = document.getElementById('promoActFeatureText');
    if (!featureBtn || !featureText) return;

    if (scene.id === 'dining') {
      featureText.innerText = '🍽️ حجز طاولة بمطعم لا ماما';
      featureBtn.onclick = () => {
        this.close();
        App.openTableBookingModal('مطعم لا ماما الإيطالي');
      };
      featureBtn.classList.remove('hidden');
    } else if (scene.id === 'spa') {
      featureText.innerText = '💆 استكشاف النادي الصحي والسبا';
      featureBtn.onclick = () => {
        this.close();
        MapEngine.selectPoi('8');
      };
      featureBtn.classList.remove('hidden');
    } else if (scene.id === 'rooms') {
      featureText.innerText = '🧭 توجيه مسار الغرفة (Wayfinder)';
      featureBtn.onclick = () => {
        this.close();
        Wayfinder.quickSelectRoom('2015');
      };
      featureBtn.classList.remove('hidden');
    } else if (scene.id === 'beach') {
      featureText.innerText = '🤿 استكشاف أنشطة الشاطئ';
      featureBtn.onclick = () => {
        this.close();
        MapEngine.selectPoi('1');
      };
      featureBtn.classList.remove('hidden');
    } else if (scene.id === 'aquapark') {
      featureText.innerText = '💦 تفاصيل الأكوا بارك';
      featureBtn.onclick = () => {
        this.close();
        MapEngine.selectPoi('3');
      };
      featureBtn.classList.remove('hidden');
    } else if (scene.id === 'entertainment') {
      featureText.innerText = '🎭 المسرح الروماني والعروض';
      featureBtn.onclick = () => {
        this.close();
        MapEngine.selectPoi('14');
      };
      featureBtn.classList.remove('hidden');
    } else {
      featureText.innerText = '🔍 بحث سريع في المنتجع';
      featureBtn.onclick = () => {
        this.close();
        App.openSpotlightSearch();
      };
      featureBtn.classList.remove('hidden');
    }
  },

  startLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);

    const step = (timestamp) => {
      if (!this.isPlaying) return;

      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const delta = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      this.elapsedMs += delta;
      const progress = Math.min(this.elapsedMs / this.sceneDuration, 1);

      const fill = document.getElementById(`storyFill-${this.currentIndex}`);
      if (fill) {
        fill.style.width = `${progress * 100}%`;
      }

      if (this.elapsedMs >= this.sceneDuration) {
        this.next();
      } else {
        this.rafId = requestAnimationFrame(step);
      }
    };

    this.rafId = requestAnimationFrame(step);
  },

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  },

  play() {
    this.isPlaying = true;
    this.lastTimestamp = null;
    const icon = document.getElementById('promoPlayPauseIcon');
    const text = document.getElementById('promoPlayPauseText');
    if (icon) icon.innerText = '⏸️';
    if (text) text.innerText = 'إيقاف مؤقت';
    this.startLoop();
  },

  pause() {
    this.isPlaying = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    const icon = document.getElementById('promoPlayPauseIcon');
    const text = document.getElementById('promoPlayPauseText');
    if (icon) icon.innerText = '▶️';
    if (text) text.innerText = 'تشغيل';
  },

  next() {
    if (this.currentIndex + 1 < this.scenes.length) {
      this.jumpTo(this.currentIndex + 1);
    } else {
      // Loop back to start smoothly
      this.jumpTo(0);
    }
  },

  prev() {
    if (this.currentIndex > 0) {
      this.jumpTo(this.currentIndex - 1);
    } else {
      this.jumpTo(this.scenes.length - 1);
    }
  },

  jumpTo(index) {
    if (index < 0 || index >= this.scenes.length) return;
    this.displayScene(index);
    if (this.isPlaying) {
      this.startLoop();
    }
  },

  toggleAudio() {
    const isMuted = PromoAudioEngine.toggleMute();
    this.updateAudioUI(isMuted);
  },

  updateAudioUI(isMuted = PromoAudioEngine.isMuted) {
    const icon = document.getElementById('promoAudioIcon');
    const bars = document.getElementById('promoSoundWaveBars');
    if (icon) icon.innerText = isMuted ? '🔇' : '🔊';
    if (bars) bars.style.opacity = isMuted ? '0.2' : '1';
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
    MapEngine.scrollToMap();
    if (scene && scene.poiId && scene.poiId !== 'all') {
      setTimeout(() => {
        MapEngine.selectPoi(scene.poiId);
      }, 400);
    }
  },

  linkToFeature() {
    const scene = this.scenes[this.currentIndex];
    if (scene && scene.poiId) {
      this.linkToMap();
    }
  },

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('promoVideoModal');
      if (!modal || modal.classList.contains('hidden')) return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      }
    });
  }
};

function openCinematicPromoVideo() {
  App.openCinematicPromoVideo();
}
function toggleOpenNowFilter(btn) {
  MapEngine.toggleOpenNowFilter(btn);
}

// Global Module Attachments
if (typeof window !== 'undefined') {
  window.App = App;
  window.PromoVideoPlayer = PromoVideoPlayer;
  window.PromoAudioEngine = PromoAudioEngine;
  window.copyWifiPassword = copyWifiPassword;
  window.openAiChatModal = openAiChatModal;
  window.openCinematicPromoVideo = openCinematicPromoVideo;
  window.startCinematicTour = startCinematicTour;
  window.stopCinematicTour = stopCinematicTour;
  window.nextTourStep = nextTourStep;
  window.openRoomPassModal = openRoomPassModal;
  window.openGalleryModal = openGalleryModal;
  window.openCompendiumModal = openCompendiumModal;
  window.openFeedbackModal = openFeedbackModal;
  window.toggleSunlightMode = toggleSunlightMode;
  window.openSpotlightSearch = openSpotlightSearch;
  window.requestOneTapService = requestOneTapService;
  window.scrollToSection = scrollToSection;
  window.closeModal = closeModal;
  window.closeAllModals = closeAllModals;
  window.openSmartHubModal = openSmartHubModal;
  window.closeSmartHubModal = closeSmartHubModal;
  window.openSaveRoomModal = openSaveRoomModal;
  window.openWhereAmIModal = openWhereAmIModal;
  window.openWifiModal = openWifiModal;
  window.openWhatsAppDirect = openWhatsAppDirect;
  window.toggleDarkMode = toggleDarkMode;
  window.toggleAudio = toggleAudio;
  window.changeLanguage = changeLanguage;
  window.openVoiceNavigator = openVoiceNavigator;
  window.openHotspotLoginModal = openHotspotLoginModal;
  window.closeHotspotLoginModal = closeHotspotLoginModal;
  window.openMikrotikPortal = openMikrotikPortal;
  window.openEmergencyDrawer = openEmergencyDrawer;
  window.closeEmergencyDrawer = closeEmergencyDrawer;
  window.shareGuestCoordinates = shareGuestCoordinates;
}

// Boot Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});


