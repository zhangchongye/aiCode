// 商家角色校验(云函数内实现,安全规则无法表达角色判断)。
const { CODES, fail } = require('./errors.js');

async function isMerchant(db, openid) {
  const res = await db.collection('users').doc(openid).get().catch(() => null);
  return !!(res && res.data && res.data.role === 'merchant');
}

async function requireMerchant(db, openid) {
  const ok = await isMerchant(db, openid);
  return ok ? { ok: true } : fail(CODES.NO_PERMISSION, '仅商家可操作');
}

module.exports = { isMerchant, requireMerchant };
