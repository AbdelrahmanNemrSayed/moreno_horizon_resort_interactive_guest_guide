import { describe, it, expect, beforeEach } from 'vitest';
import App from '../js/app.js';

describe('Guest Profile & Smart Dashboard Flow', () => {
  let storage = {};
  let elements = {};

  const createMockElement = (id = '', tag = 'div') => ({
    id,
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    },
    appendChild: () => {},
    removeChild: () => {},
    remove: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {}
  });

  beforeEach(() => {
    storage = {};
    globalThis.localStorage = {
      getItem: (key) => (key in storage ? storage[key] : null),
      setItem: (key, val) => { storage[key] = String(val); },
      removeItem: (key) => { delete storage[key]; },
      clear: () => { storage = {}; }
    };

    elements = {
      guestDashName: createMockElement('guestDashName'),
      guestDashRoomBadge: createMockElement('guestDashRoomBadge'),
      guestDashRoomText: createMockElement('guestDashRoomText'),
      guestDashBuildingText: createMockElement('guestDashBuildingText'),
      guestDashEditBtnText: createMockElement('guestDashEditBtnText'),
      profGuestName: createMockElement('profGuestName'),
      profRoomNum: createMockElement('profRoomNum'),
      profCheckoutDate: createMockElement('profCheckoutDate'),
      bookRoomNum: createMockElement('bookRoomNum'),
      vipServiceRoomInput: createMockElement('vipServiceRoomInput'),
      srvRoomNumberInput: createMockElement('srvRoomNumberInput'),
      roomSearchInput: createMockElement('roomSearchInput'),
      toastContainer: createMockElement('toastContainer')
    };

    globalThis.document = {
      getElementById: (id) => elements[id] || null,
      createElement: (tag) => createMockElement('', tag),
      body: createMockElement('body')
    };
  });

  it('saves guest profile, updates dashboard, and pre-fills service forms', () => {
    elements.profGuestName.value = 'د. أحمد سمير';
    elements.profRoomNum.value = '2015';

    // Simulate form submission
    App.saveGuestProfile({ preventDefault: () => {} });

    // Verify localStorage
    expect(storage['moreno_guest_name']).toBe('د. أحمد سمير');
    expect(storage['moreno_guest_room']).toBe('2015');

    // Verify dashboard UI
    expect(elements.guestDashName.textContent).toContain('د. أحمد سمير');
    expect(elements.guestDashRoomBadge.classList.contains('hidden')).toBe(false);
    expect(elements.guestDashRoomText.textContent).toContain('2015');
    expect(elements.guestDashEditBtnText.textContent).toBe('تعديل بيانات الغرفة');
    expect(elements.guestDashBuildingText.textContent).toBeTruthy();

    // Verify service inputs prefilled
    expect(elements.bookRoomNum.value).toBe('2015');
    expect(elements.vipServiceRoomInput.value).toBe('2015');
  });

  it('pre-fills modal inputs when reopened', () => {
    storage['moreno_guest_name'] = 'محمد علي';
    storage['moreno_guest_room'] = '1102';

    App.openGuestProfileModal();

    expect(elements.profGuestName.value).toBe('محمد علي');
    expect(elements.profRoomNum.value).toBe('1102');
  });

  it('clears saved profile and resets dashboard', () => {
    storage['moreno_guest_name'] = 'محمد علي';
    storage['moreno_guest_room'] = '1102';
    App.updateGuestDashboardUI();

    App.clearSavedRoom();

    expect(storage['moreno_guest_room']).toBeUndefined();
    expect(storage['moreno_guest_name']).toBeUndefined();
    expect(elements.guestDashRoomBadge.classList.contains('hidden')).toBe(true);
    expect(elements.guestDashEditBtnText.textContent).toBe('تسجيل / تعديل الغرفة');
  });
});
