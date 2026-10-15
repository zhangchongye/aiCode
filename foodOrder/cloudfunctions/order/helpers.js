// 订单通用工具:文档读取、状态流转(CAS 条件更新)、订单号生成。
// 状态机校验 + where({_id, status: 旧态}).update() 双保险:
// 并发下 stats.updated === 0 即视为冲突,任何操作都无法绕过状态机。
const { CODES, fail } = require('./errors.js');
const { canTransit } = require('./stateMachine.js');

async function getOrder(db, orderId) {
  if (!orderId || typeof orderId !== 'string') return null;
  const res = await db.collection('orders').doc(orderId).get().catch(() => null);
  return res && res.data ? res.data : null;
}

// 校验 canTransit(from, to, actor) 后执行 CAS 条件更新。
// extra 里可带时间戳字段(paidAt / cancelledAt / cancelReason 等)。
async function transit(db, order, to, actor, extra = {}) {
  if (!canTransit(order.status, to, actor)) {
    return fail(CODES.INVALID_STATE, `当前状态不允许该操作`);
  }
  const res = await db
    .collection('orders')
    .where({ _id: order._id, status: order.status })
    .update({ data: { status: to, updatedAt: db.serverDate(), ...extra } });
  if (!res.stats || res.stats.updated !== 1) {
    return fail(CODES.CONFLICT, '订单状态已变化,请刷新后重试');
  }
  return { ok: true, data: { status: to } };
}

// 展示用订单号:北京时间 yyyyMMddHHmmss + 4 位随机数
function genOrderNo() {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const ts =
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds());
  return ts + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

module.exports = { getOrder, transit, genOrderNo };
