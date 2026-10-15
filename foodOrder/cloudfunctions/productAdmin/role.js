// 与 cloudfunctions/order/role.js 同源拷贝(云函数目录相互独立,无法共享文件)。
const { CODES, fail } = require('./errors.js');

async function requireMerchant(db, openid) {
  const res = await db.collection('users').doc(openid).get().catch(() => null);
  const ok = !!(res && res.data && res.data.role === 'merchant');
  return ok ? { ok: true } : fail(CODES.NO_PERMISSION, '仅商家可操作');
}

module.exports = { requireMerchant };
