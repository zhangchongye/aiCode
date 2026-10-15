const { test } = require('node:test');
const assert = require('node:assert');
const cart = require('../miniprogram/utils/cart.js');

const P1 = { productId: 'p1', name: '红烧肉', price: 3800, image: '' };
const P2 = { productId: 'p2', name: '米饭', price: 200, image: '' };

test('addItem appends new product with count 1', () => {
  const items = cart.addItem([], P1);
  assert.deepStrictEqual(items, [{ ...P1, count: 1 }]);
});

test('addItem merges same product by incrementing count', () => {
  let items = cart.addItem([], P1);
  items = cart.addItem(items, P1);
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].count, 2);
});

test('addItem keeps distinct products as separate entries', () => {
  let items = cart.addItem([], P1);
  items = cart.addItem(items, P2);
  assert.strictEqual(items.length, 2);
});

test('addItem caps count at 99', () => {
  let items = cart.addItem([], P1);
  items = cart.setCount(items, 'p1', 99);
  items = cart.addItem(items, P1);
  assert.strictEqual(items[0].count, 99);
});

test('setCount updates count and clamps to 1-99', () => {
  let items = cart.addItem([], P1);
  items = cart.setCount(items, 'p1', 5);
  assert.strictEqual(items[0].count, 5);
  items = cart.setCount(items, 'p1', 150);
  assert.strictEqual(items[0].count, 99);
});

test('setCount of zero or negative removes the item', () => {
  let items = cart.addItem([], P1);
  items = cart.setCount(items, 'p1', 0);
  assert.strictEqual(items.length, 0);
  items = cart.addItem(items, P1);
  items = cart.setCount(items, 'p1', -3);
  assert.strictEqual(items.length, 0);
});

test('removeItem deletes the entry', () => {
  let items = cart.addItem(cart.addItem([], P1), P2);
  items = cart.removeItem(items, 'p1');
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].productId, 'p2');
});

test('count sums quantities and total sums price x count', () => {
  let items = cart.addItem([], P1);
  items = cart.setCount(items, 'p1', 2);
  items = cart.addItem(items, P2);
  assert.strictEqual(cart.count(items), 3);
  assert.strictEqual(cart.total(items), 3800 * 2 + 200);
});
