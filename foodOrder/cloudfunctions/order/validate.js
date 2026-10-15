// 下单校验与快照构建(纯函数,可单测)。
// 原则:不信任客户端金额,只信任 productId + count,价格按商品库重算并快照。

const { calcItemsTotal } = require('./money.js');

const TABLE_NO_MAX_LEN = 16;
const ITEMS_MAX = 50;
const COUNT_MAX = 99;
const REMARK_MAX_LEN = 100;

// 成功: { ok: true, data: { tableNo, items(快照), totalAmount, remark } }
// 失败: { ok: false, code: 'INVALID_PARAMS' | 'NOT_FOUND', msg }
function buildOrderSnapshot({ tableNo, items, remark }, productsById) {
  if (typeof tableNo !== 'string' || !tableNo.trim() || tableNo.trim().length > TABLE_NO_MAX_LEN) {
    return { ok: false, code: 'INVALID_PARAMS', msg: '桌号无效' };
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > ITEMS_MAX) {
    return { ok: false, code: 'INVALID_PARAMS', msg: '菜品不能为空' };
  }
  if (remark != null && (typeof remark !== 'string' || remark.length > REMARK_MAX_LEN)) {
    return { ok: false, code: 'INVALID_PARAMS', msg: '备注过长' };
  }
  const snapshot = [];
  for (const item of items) {
    const { productId, count } = item;
    if (typeof productId !== 'string' || !productId || !Number.isInteger(count) || count < 1 || count > COUNT_MAX) {
      return { ok: false, code: 'INVALID_PARAMS', msg: '菜品数量无效' };
    }
    const product = productsById[productId];
    if (!product || product.status !== 'on') {
      return { ok: false, code: 'NOT_FOUND', msg: '部分商品已下架,请刷新菜单' };
    }
    snapshot.push({
      productId,
      name: product.name,
      price: product.price,
      count,
      image: product.image || '',
    });
  }
  return {
    ok: true,
    data: {
      tableNo: tableNo.trim(),
      items: snapshot,
      totalAmount: calcItemsTotal(snapshot),
      remark: (remark || '').trim(),
    },
  };
}

module.exports = { buildOrderSnapshot, TABLE_NO_MAX_LEN, ITEMS_MAX, COUNT_MAX, REMARK_MAX_LEN };
