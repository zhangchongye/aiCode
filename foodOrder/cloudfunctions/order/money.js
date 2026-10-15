// 金额工具(服务端权威版)。与 miniprogram/utils/money.js 保持同源拷贝,
// tests/money.test.js 会同时 require 两份断言行为一致,防漂移。
// 存储与计算一律整数"分",仅在展示时换算为元字符串。

function yuanToFen(yuan) {
  if (typeof yuan !== 'number' || !Number.isFinite(yuan) || yuan < 0) {
    throw new Error('invalid yuan amount');
  }
  return Math.round(yuan * 100);
}

function fenToYuan(fen) {
  return (fen / 100).toFixed(2);
}

function calcItemsTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.count, 0);
}

module.exports = { yuanToFen, fenToYuan, calcItemsTotal };
