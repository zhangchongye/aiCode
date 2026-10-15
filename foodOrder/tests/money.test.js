const { test } = require('node:test');
const assert = require('node:assert');
const frontend = require('../miniprogram/utils/money.js');
const backend = require('../cloudfunctions/order/money.js');

test('yuanToFen converts decimal yuan to integer fen', () => {
  assert.strictEqual(frontend.yuanToFen(12.5), 1250);
  assert.strictEqual(frontend.yuanToFen(0), 0);
  assert.strictEqual(frontend.yuanToFen(1), 100);
  assert.strictEqual(frontend.yuanToFen(0.99), 99);
  assert.strictEqual(frontend.yuanToFen(1234.56), 123456);
});

test('yuanToFen rejects invalid input', () => {
  for (const bad of [NaN, -1, -0.01, Infinity, '12.5', null, undefined]) {
    assert.throws(() => frontend.yuanToFen(bad), Error, `should reject: ${String(bad)}`);
  }
});

test('fenToYuan formats integer fen as two-decimal string', () => {
  assert.strictEqual(frontend.fenToYuan(0), '0.00');
  assert.strictEqual(frontend.fenToYuan(99), '0.99');
  assert.strictEqual(frontend.fenToYuan(1250), '12.50');
  assert.strictEqual(frontend.fenToYuan(123456), '1234.56');
});

test('calcItemsTotal sums price x count', () => {
  assert.strictEqual(
    frontend.calcItemsTotal([
      { price: 1000, count: 2 },
      { price: 350, count: 1 },
    ]),
    2350
  );
  assert.strictEqual(frontend.calcItemsTotal([]), 0);
  assert.strictEqual(frontend.calcItemsTotal([{ price: 500, count: 0 }]), 0);
});

test('frontend and backend money copies behave identically (no drift)', () => {
  const cases = [
    { fn: 'yuanToFen', args: [12.5] },
    { fn: 'yuanToFen', args: [0.1] },
    { fn: 'yuanToFen', args: [0.1 + 0.2] },
    { fn: 'yuanToFen', args: [9999.99] },
    { fn: 'fenToYuan', args: [1250] },
    { fn: 'fenToYuan', args: [99] },
    { fn: 'calcItemsTotal', args: [[{ price: 1280, count: 2 }, { price: 1, count: 1 }]] },
    { fn: 'calcItemsTotal', args: [[]] },
  ];
  for (const c of cases) {
    const a = frontend[c.fn](...c.args);
    const b = backend[c.fn](...c.args);
    assert.strictEqual(a, b, `${c.fn}(${JSON.stringify(c.args)}) drifted: ${a} vs ${b}`);
  }
  // invalid input must also behave the same (both throw)
  for (const bad of [NaN, -1, '1']) {
    assert.throws(() => frontend.yuanToFen(bad));
    assert.throws(() => backend.yuanToFen(bad));
  }
});
