const { test } = require('node:test');
const assert = require('node:assert');
const { buildOrderSnapshot } = require('../cloudfunctions/order/validate.js');

const PRODUCTS = {
  p1: { _id: 'p1', name: '红烧肉', price: 3800, status: 'on', image: 'cloud://x.jpg' },
  p2: { _id: 'p2', name: '米饭', price: 200, status: 'on', image: '' },
  p3: { _id: 'p3', name: '下架菜', price: 1000, status: 'off', image: '' },
};

test('builds snapshot with server-side recomputed prices', () => {
  const r = buildOrderSnapshot(
    { tableNo: ' 5 ', items: [{ productId: 'p1', count: 2 }, { productId: 'p2', count: 3 }], remark: ' 少辣 ' },
    PRODUCTS
  );
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.data.tableNo, '5');
  assert.strictEqual(r.data.remark, '少辣');
  assert.strictEqual(r.data.totalAmount, 3800 * 2 + 200 * 3);
  assert.deepStrictEqual(r.data.items, [
    { productId: 'p1', name: '红烧肉', price: 3800, count: 2, image: 'cloud://x.jpg' },
    { productId: 'p2', name: '米饭', price: 200, count: 3, image: '' },
  ]);
});

test('rejects invalid table numbers', () => {
  for (const tableNo of [undefined, null, '', '   ', 5, '1'.repeat(17)]) {
    const r = buildOrderSnapshot({ tableNo, items: [{ productId: 'p1', count: 1 }] }, PRODUCTS);
    assert.strictEqual(r.ok, false, `tableNo ${String(tableNo)} should fail`);
    assert.strictEqual(r.code, 'INVALID_PARAMS');
  }
});

test('rejects empty or oversized item lists', () => {
  const base = { tableNo: '1' };
  assert.strictEqual(buildOrderSnapshot({ ...base, items: [] }, PRODUCTS).ok, false);
  assert.strictEqual(buildOrderSnapshot({ ...base }, PRODUCTS).ok, false);
  const tooMany = Array.from({ length: 51 }, () => ({ productId: 'p1', count: 1 }));
  assert.strictEqual(buildOrderSnapshot({ ...base, items: tooMany }, PRODUCTS).ok, false);
});

test('rejects invalid counts', () => {
  const base = { tableNo: '1' };
  for (const count of [0, -1, 100, 1.5, '2', null]) {
    const r = buildOrderSnapshot({ ...base, items: [{ productId: 'p1', count }] }, PRODUCTS);
    assert.strictEqual(r.ok, false, `count ${String(count)} should fail`);
    assert.strictEqual(r.code, 'INVALID_PARAMS');
  }
});

test('rejects missing or off-sale products', () => {
  const base = { tableNo: '1' };
  const missing = buildOrderSnapshot({ ...base, items: [{ productId: 'nope', count: 1 }] }, PRODUCTS);
  assert.strictEqual(missing.ok, false);
  assert.strictEqual(missing.code, 'NOT_FOUND');
  const offSale = buildOrderSnapshot({ ...base, items: [{ productId: 'p3', count: 1 }] }, PRODUCTS);
  assert.strictEqual(offSale.ok, false);
  assert.strictEqual(offSale.code, 'NOT_FOUND');
});

test('rejects overlong remark', () => {
  const r = buildOrderSnapshot(
    { tableNo: '1', items: [{ productId: 'p1', count: 1 }], remark: 'x'.repeat(101) },
    PRODUCTS
  );
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.code, 'INVALID_PARAMS');
});
