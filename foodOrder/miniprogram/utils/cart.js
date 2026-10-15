// 购物车:纯逻辑(可单测) + wx.storage 适配层。
// 购物车条目为商品快照:{ productId, name, price(分), image, count }。
// 注意:纯函数不修改入参,返回新数组;storage 读写仅在适配函数中接触 wx。

const { calcItemsTotal } = require('./money.js');

const KEY = 'zcy_cart';
const MAX_COUNT = 99;

function addItem(items, product) {
  const next = items.slice();
  const found = next.find((i) => i.productId === product.productId);
  if (found) {
    found.count = Math.min(MAX_COUNT, found.count + 1);
  } else {
    next.push({
      productId: product.productId,
      name: product.name,
      price: product.price,
      image: product.image || '',
      count: 1,
    });
  }
  return next;
}

function setCount(items, productId, count) {
  const n = Math.floor(count);
  if (n <= 0) return items.filter((i) => i.productId !== productId);
  return items.map((i) =>
    i.productId === productId ? { ...i, count: Math.min(MAX_COUNT, n) } : i
  );
}

function removeItem(items, productId) {
  return items.filter((i) => i.productId !== productId);
}

function count(items) {
  return items.reduce((sum, i) => sum + i.count, 0);
}

function total(items) {
  return calcItemsTotal(items);
}

// ---- wx.storage 适配层 ----
function getCart() {
  return wx.getStorageSync(KEY) || [];
}

function saveCart(items) {
  wx.setStorageSync(KEY, items);
}

function clearCart() {
  wx.removeStorageSync(KEY);
}

module.exports = { KEY, MAX_COUNT, addItem, setCount, removeItem, count, total, getCart, saveCart, clearCart };
