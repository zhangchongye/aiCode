const { test } = require('node:test');
const assert = require('node:assert');
const { formatTime, formatDateTime } = require('../miniprogram/utils/format.js');

test('formatTime renders MM-DD HH:mm', () => {
  assert.strictEqual(formatTime(new Date(2026, 0, 5, 9, 8)), '01-05 09:08');
  assert.strictEqual(formatTime(new Date(2026, 11, 31, 23, 59)), '12-31 23:59');
});

test('formatTime accepts timestamp numbers and ISO strings', () => {
  const d = new Date(2026, 0, 5, 9, 8);
  assert.strictEqual(formatTime(d.getTime()), '01-05 09:08');
  assert.strictEqual(formatTime(d.toISOString()), '01-05 09:08');
});

test('formatTime returns empty string for invalid input', () => {
  assert.strictEqual(formatTime(null), '');
  assert.strictEqual(formatTime(undefined), '');
  assert.strictEqual(formatTime('not-a-date'), '');
});

test('formatDateTime includes the year', () => {
  assert.strictEqual(formatDateTime(new Date(2026, 0, 5, 9, 8)), '2026-01-05 09:08');
});
