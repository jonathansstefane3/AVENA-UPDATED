// Opening hours, "open now" status and booking-slot rules. Edit HOURS to match the restaurant.
(function (root) {
  'use strict';
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Index 0 = Sunday. null = closed. Times are 24-hour "HH:MM".
  const HOURS = {
    0: ['10:00', '18:00'], 1: null, 2: ['12:00', '22:00'], 3: ['12:00', '22:00'],
    4: ['12:00', '22:00'], 5: ['12:00', '22:00'], 6: ['10:00', '23:00']
  };
  const LAST_BOOKING_BEFORE_CLOSE = 60; // minutes

  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const dayOf = dateStr => new Date(dateStr + 'T00:00').getDay();

  // Earliest and latest booking time for a date ("YYYY-MM-DD"), or null if closed
  function slotRange(dateStr) {
    const d = dayOf(dateStr);
    const h = HOURS[d];
    if (!h) return null;
    return { day: DAYS[d], min: h[0], max: fmt(toMin(h[1]) - LAST_BOOKING_BEFORE_CLOSE) };
  }

  // Returns '' when the slot is bookable, otherwise a message for the guest
  function validateSlot(dateStr, timeStr) {
    const r = slotRange(dateStr);
    if (!r) return `We are closed on ${DAYS[dayOf(dateStr)]}s. Please pick another day.`;
    const t = toMin(timeStr);
    if (t < toMin(r.min) || t > toMin(r.max)) return `On ${r.day}s we take bookings from ${r.min} to ${r.max}.`;
    return '';
  }

  // { open: boolean, text: string } for the visitor's current clock
  function openStatus(now) {
    now = now || new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const today = HOURS[now.getDay()];
    if (today && mins >= toMin(today[0]) && mins < toMin(today[1])) return { open: true, text: `Open now until ${today[1]}` };
    for (let i = 0; i < 8; i++) {
      const d = (now.getDay() + i) % 7;
      const h = HOURS[d];
      if (!h) continue;
      if (i === 0) {
        if (mins < toMin(h[0])) return { open: false, text: `Closed. Opens today at ${h[0]}` };
        continue;
      }
      return { open: false, text: `Closed. Opens ${i === 1 ? 'tomorrow' : DAYS[d]} at ${h[0]}` };
    }
    return { open: false, text: 'Closed' };
  }

  const api = { HOURS, DAYS, slotRange, validateSlot, openStatus };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AVENA = api;
})(typeof window !== 'undefined' ? window : globalThis);
