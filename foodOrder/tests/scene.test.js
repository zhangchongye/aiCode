const { test } = require('node:test');
const assert = require('node:assert');
const { parseScene } = require('../miniprogram/utils/scene.js');

test('parses url-encoded scene with table param', () => {
  assert.deepStrictEqual(parseScene('t%3D3'), { tableNo: '3' });
  assert.deepStrictEqual(parseScene('t=3'), { tableNo: '3' });
  assert.deepStrictEqual(parseScene('t%3DA1'), { tableNo: 'A1' });
});

test('extracts t param from multi-param scene', () => {
  assert.deepStrictEqual(parseScene('a%3D1%26t%3D5'), { tableNo: '5' });
  assert.deepStrictEqual(parseScene('a=1&t=5'), { tableNo: '5' });
});

test('trims whitespace around table number', () => {
  assert.deepStrictEqual(parseScene('t%3D%205%20'), { tableNo: '5' });
});

test('returns null when t param is missing or empty', () => {
  assert.strictEqual(parseScene(undefined), null);
  assert.strictEqual(parseScene(''), null);
  assert.strictEqual(parseScene(null), null);
  assert.strictEqual(parseScene('a%3D1'), null);
  assert.strictEqual(parseScene('t%3D'), null);
  assert.strictEqual(parseScene('t%3D%20%20'), null);
});

test('returns null for malformed or overlong table numbers', () => {
  assert.strictEqual(parseScene('t'), null);
  assert.strictEqual(parseScene('t%3D' + '1'.repeat(17)), null);
});

test('accepts 16-char table number', () => {
  const long = '2'.repeat(16);
  assert.deepStrictEqual(parseScene('t%3D' + long), { tableNo: long });
});
