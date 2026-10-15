// 商家侧 action:accept / reject / finish / listAll。全部先过 requireMerchant。
const { CODES, fail } = require('../errors.js');
const { requireMerchant } = require('../role.js');
const { getOrder, transit } = require('../helpers.js');

const PAGE_SIZE = 20;

async function accept(db, _, openid, event) {
  const guard = await requireMerchant(db, openid);
  if (!guard.ok) return guard;
  const order = await getOrder(db, event.orderId);
  if (!order) return fail(CODES.NOT_FOUND, '订单不存在');
  return transit(db, order, 'PREPARING', 'merchant', { acceptedAt: db.serverDate() });
}

async function reject(db, _, openid, event) {
  const guard = await requireMerchant(db, openid);
  if (!guard.ok) return guard;
  const order = await getOrder(db, event.orderId);
  if (!order) return fail(CODES.NOT_FOUND, '订单不存在');
  const reason = (event.reason || '').trim();
  if (!reason) return fail(CODES.INVALID_PARAMS, '请填写拒单原因');
  if (reason.length > 100) return fail(CODES.INVALID_PARAMS, '拒单原因过长');
  return transit(db, order, 'CANCELLED', 'merchant', {
    cancelledAt: db.serverDate(),
    cancelReason: reason,
  });
}

async function finish(db, _, openid, event) {
  const guard = await requireMerchant(db, openid);
  if (!guard.ok) return guard;
  const order = await getOrder(db, event.orderId);
  if (!order) return fail(CODES.NOT_FOUND, '订单不存在');
  return transit(db, order, 'READY', 'merchant', { finishedAt: db.serverDate() });
}

async function listAll(db, _, openid, event) {
  const guard = await requireMerchant(db, openid);
  if (!guard.ok) return guard;
  const page = Math.max(1, parseInt(event.page, 10) || 1);
  const where = {};
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

module.exports = { accept, reject, finish, listAll };
