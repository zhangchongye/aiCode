// 订单状态机 —— 全系统正确性的单一真相源。
// 顾客侧与商家侧 action 都必须经 canTransit 校验 + CAS 条件更新,禁止绕过。

const STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const ACTOR = {
  CUSTOMER: 'customer',
  MERCHANT: 'merchant',
};

// from -> [{ to, actor, action }]
// COMPLETED / CANCELLED 为终态,无出边(不在表中)。
const TRANSITIONS = {
  [STATUS.UNPAID]: [
    { to: STATUS.PAID, actor: ACTOR.CUSTOMER, action: 'pay' },
    { to: STATUS.CANCELLED, actor: ACTOR.CUSTOMER, action: 'cancel' },
  ],
  [STATUS.PAID]: [
    { to: STATUS.CANCELLED, actor: ACTOR.CUSTOMER, action: 'cancel' },
    { to: STATUS.CANCELLED, actor: ACTOR.MERCHANT, action: 'reject' },
    { to: STATUS.PREPARING, actor: ACTOR.MERCHANT, action: 'accept' },
  ],
  [STATUS.PREPARING]: [
    { to: STATUS.READY, actor: ACTOR.MERCHANT, action: 'finish' },
  ],
  [STATUS.READY]: [
    { to: STATUS.COMPLETED, actor: ACTOR.CUSTOMER, action: 'complete' },
    { to: STATUS.COMPLETED, actor: ACTOR.MERCHANT, action: 'complete' },
  ],
};

function canTransit(from, to, actor) {
  const list = TRANSITIONS[from];
  if (!list) return false;
  return list.some((t) => t.to === to && t.actor === actor);
}

module.exports = { STATUS, ACTOR, TRANSITIONS, canTransit };
