// 顾客侧 action:create / pay / cancel / complete / listMine / detail。
// complete 同时支持商家代点完成(内部按归属判断 actor)。
const { CODES, fail } = require('../errors.js');
const { buildOrderSnapshot } = require('../validate.js');
const { isMerchant } = require('../role.js');
const { getOrder, transit, genOrderNo } = require('../helpers.js');

const PAGE_SIZE = 20;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function create(db, _, openid, event) {
  // 只信任 productId + count,价格一律按商品库重算(见 validate.js)
  const productIds = [...new Set((event.items || []).map((i) => i && i.productId).filter(Boolean))];
  if (!productIds.length) return fail(CODES.INVALID_PARAMS, '菜品不能为空');
  const res = await db.collection('products').where({ _id: _.in(productIds), status: 'on' }).get();
  const byId = {};
  for (const p of res.data) byId[p._id] = p;

  const built = buildOrderSnapshot(event, byId);
  if (!built.ok) return built;
  const { tableNo, items, totalAmount, remark } = built.data;

  const orderNo = genOrderNo();
  const addRes = await db.collection('orders').add({
    data: {
      orderNo,
      openid,
      tableNo,
      items,
      totalAmount,
      status: 'UNPAID',
      remark,
      cancelReason: '',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
      paidAt: null,
      acceptedAt: null,
      finishedAt: null,
      completedAt: null,
      cancelledAt: null,
    },
  });
  return { ok: true, data: { orderId: addRes._id, orderNo } };
}

async function pay(db, _, openid, event) {
  const order = await getOrder(db, event.orderId);
  if (!order) return fail(CODES.NOT_FOUND, '订单不存在');
  if (order.openid !== openid) return fail(CODES.NO_PERMISSION, '无权操作该订单');
  await sleep(1200); // 模拟支付通道耗时
  return transit(db, order, 'PAID', 'customer', { paidAt: db.serverDate() });
}

async function cancel(db, _, openid, event) {
  const order = await getOrder(db, event.orderId);
  if (!order) return fail(CODES.NOT_FOUND, '订单不存在');
  if (order.openid !== openid) return fail(CODES.NO_PERMISSION, '无权操作该订单');
  const reason = (event.reason || '').trim();
  if (reason.length > 100) return fail(CODES.INVALID_PARAMS, '取消原因过长');
  return transit(db, order, 'CANCELLED', 'customer', {
    cancelledAt: db.serverDate(),
    cancelReason: reason,
  });
}

async function complete(db, _, openid, event) {
  const order = await getOrder(db, event.orderId);
  if (!order) return fail(CODES.NOT_FOUND, '订单不存在');
  const isOwner = order.openid === openid;
  if (!isOwner && !(await isMerchant(db, openid))) return fail(CODES.NO_PERMISSION, '无权操作该订单');
  const actor = isOwner ? 'customer' : 'merchant';
  return transit(db, order, 'COMPLETED', actor, { completedAt: db.serverDate() });
}

async function listMine(db, _, openid, event) {
  const page = Math.max(1, parseInt(event.page, 10) || 1);
  const where = { openid };
  if (event.status) {
    where.status = Array.isArray(event.status) ? _.in(event.status) : event.status;
  }
  const res = await db
    .collection('orders')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .get();
  return { ok: true, data: { list: res.data, hasMore: res.data.length === PAGE_SIZE } };
}

async function detail(db, _, openid, event) {
  const order = await getOrder(db, event.orderId);
  if (!order) return fail(CODES.NOT_FOUND, '订单不存在');
  if (order.openid !== openid && !(await isMerchant(db, openid))) {
    return fail(CODES.NO_PERMISSION, '无权查看该订单');
  }
  return { ok: true, data: { order } };
}

module.exports = { create, pay, cancel, complete, listMine, detail };
