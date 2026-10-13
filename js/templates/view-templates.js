/**
 * Moreno Horizon Spa & Resort - Modular View Templates
 * Extracted pure renderers for modal dialogs and luxury cards.
 * Ensures clean separation of presentation markup from application logic.
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ViewTemplates = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /**
   * Safe HTML escaping to prevent XSS injection in dynamic inputs
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * 1. Luxury Apple-Wallet Style Digital Room Pass Modal
   */
  function renderRoomPassModal(data) {
    const { t, savedRoom, displayRoom, guestName } = data;
    const safeGuestName = escapeHtml(guestName);
    const safeDisplayRoom = escapeHtml(displayRoom);
    const safeSavedRoom = escapeHtml(savedRoom);
    const qrId = safeSavedRoom ? `#${safeSavedRoom}` : "#GUEST-NEW";

    const shareBtn = safeSavedRoom
      ? `<button onclick="App.shareRoomPass('${safeSavedRoom}')" class="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 tap-effect">
           <span>📤</span>
           <span>${t.pass_btn_share || "مشاركة البطاقة"}</span>
         </button>`
      : `<button onclick="App.openGuestProfileModal()" class="py-3 rounded-2xl btn-royal-gold text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 tap-effect">
           <span>✏️</span>
           <span>${t.guest_register_room || "سجل غرفتك الآن"}</span>
         </button>`;

    return `
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
              <span class="text-xl font-black text-amber-300 tracking-wider">${safeDisplayRoom}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">${t.pass_guest_lbl}</span>
              <span class="font-bold text-white text-xs">${safeGuestName}</span>
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
              <span class="text-[10px] font-mono text-slate-300">Room-Route-ID: ${qrId}</span>
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
          ${shareBtn}
          <button onclick="App.showAppleWalletNotice()" class="py-3 rounded-2xl bg-slate-900 border border-slate-700 hover:bg-black text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 tap-effect">
            <span>📱</span>
            <span>${t.pass_btn_apple || "إضافة للمحفظة"}</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 2. Excursion Booking Modal
   */
  function renderExcursionModal(data) {
    const { t, title, price, savedRoom, guestName } = data;
    const safeTitle = escapeHtml(title);
    const safePrice = escapeHtml(price);
    const safeRoom = escapeHtml(savedRoom);
    const safeGuest = escapeHtml(guestName);
    const encodedTitle = encodeURIComponent(title);

    return `
      <div>
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl font-black">🛥️</span>
            <div>
              <h3 class="text-base font-black text-slate-900 dark:text-white">${safeTitle}</h3>
              <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">${safePrice || ""}</p>
            </div>
          </div>
          <button onclick="App.closeModal('detailModal')" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold">✕</button>
        </div>

        <div class="space-y-3 mb-5">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">${t.srv_room || "رقم الغرفة:"}</label>
            <input type="text" id="excursionRoom" required value="${safeRoom}" placeholder="${t.ph_room_num || "مثال: 1520"}" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">${t.pass_guest_lbl || "اسم النزيل:"}</label>
            <input type="text" id="excursionGuest" required value="${safeGuest}" placeholder="${t.guest_name_ph || "الاسم الكريم..."}" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">${t.srv_notes || "ملاحظات وتفضيلات:"}</label>
            <textarea id="excursionNotes" rows="2" placeholder="${t.srv_notes_ph || "أي استفسار أو موعد مفضل..."}" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold"></textarea>
          </div>
        </div>

        <button onclick="App.confirmExcursionBooking('${encodedTitle}')" class="w-full py-3 rounded-2xl btn-royal-gold font-black text-xs shadow-lg flex items-center justify-center gap-2 tap-effect">
          <span>✨</span>
          <span>${t.btn_confirm_booking || "تأكيد طلب الحجز مع مكتب الرحلات"}</span>
        </button>
      </div>
    `;
  }

  /**
   * 3. Spa Service Booking Modal
   */
  function renderSpaServiceModal(data) {
    const { t, item, savedRoom, guestName } = data;
    const safeTitle = escapeHtml(item.title);
    const safePrice = escapeHtml(item.price);
    const safeDesc = escapeHtml(item.desc);
    const safeRoom = escapeHtml(savedRoom);
    const safeGuest = escapeHtml(guestName);
    const encodedTitle = encodeURIComponent(item.title);

    return `
      <div>
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl font-black">💆‍♀️</span>
            <div>
              <h3 class="text-base font-black text-slate-900 dark:text-white">${safeTitle}</h3>
              <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">${safePrice || ""}</p>
            </div>
          </div>
          <button onclick="App.closeModal('detailModal')" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold">✕</button>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">${safeDesc}</p>

        <div class="space-y-3 mb-5">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">${t.srv_room || "رقم الغرفة:"}</label>
            <input type="text" id="spaRoomInput" value="${safeRoom}" required placeholder="${t.ph_room_num || "مثال: 1520"}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">${t.pass_guest_lbl || "اسم النزيل:"}</label>
            <input type="text" id="spaGuestInput" value="${safeGuest}" placeholder="${t.guest_name_ph || "الاسم الكريم..."}" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
          </div>
        </div>

        <button onclick="App.confirmSpaBooking('${encodedTitle}')" class="w-full py-3 rounded-2xl btn-royal-gold font-black text-xs shadow-lg flex items-center justify-center gap-2 tap-effect">
          <span>🌿</span>
          <span>${t.btn_confirm_spa || "تأكيد حجز جلسة السبا"}</span>
        </button>
      </div>
    `;
  }

  return {
    escapeHtml,
    renderRoomPassModal,
    renderExcursionModal,
    renderSpaServiceModal,
  };
});
