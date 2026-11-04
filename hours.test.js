// Run with: npm test  (uses Node's built-in test runner)
const test = require('node:test');
const assert = require('node:assert');
const { validateSlot, slotRange, openStatus } = require('../public/js/hours.js');

test('Mondays are closed', () => {
  assert.strictEqual(slotRange('2030-01-07'), null);
  assert.match(validateSlot('2030-01-07', '19:00'), /closed on Mondays/);
});

test('Saturday bookings run until one hour before close', () => {
  assert.strictEqual(validateSlot('2030-01-05', '22:00'), '');
  assert.match(validateSlot('2030-01-05', '22:30'), /10:00 to 22:00/);
  assert.match(validateSlot('2030-01-05', '09:00'), /10:00 to 22:00/);
});

test('open status during and after opening hours', () => {
  assert.deepStrictEqual(openStatus(new Date(2030, 0, 5, 13, 0)), { open: true, text: 'Open now until 23:00' });
  assert.strictEqual(openStatus(new Date(2030, 0, 5, 23, 30)).text, 'Closed. Opens tomorrow at 10:00');
  assert.strictEqual(openStatus(new Date(2030, 0, 7, 10, 0)).text, 'Closed. Opens tomorrow at 12:00');
  assert.strictEqual(openStatus(new Date(2030, 0, 8, 9, 0)).text, 'Closed. Opens today at 12:00');
  assert.strictEqual(openStatus(new Date(2030, 0, 6, 19, 0)).text, 'Closed. Opens Tuesday at 12:00');
});
