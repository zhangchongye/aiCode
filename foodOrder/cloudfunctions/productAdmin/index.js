// productAdmin 云函数入口:商品/分类管理 + 桌码生成,全部 action 先过 requireMerchant。
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const { requireMerchant } = require('./role.js');
const { CODES } = require('./errors.js');
const product = require('./actions/product.js');
const category = require('./actions/category.js');
const qr = require('./actions/qr.js');

const ACTIONS = {
  productCreate: product.create,
  productUpdate: product.update,
  productRemove: product.remove,
  productSetStatus: product.setStatus,
  categoryCreate: category.create,
  categoryUpdate: category.update,
  categoryRemove: category.remove,
  categorySort: category.sort,
  getTableQR: qr.getTableQR,
};

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const action = event && event.action;
  const handler = ACTIONS[action];
  if (!handler) return { ok: false, code: CODES.INVALID_PARAMS, msg: '未知操作' };
  try {
    const guard = await requireMerchant(db, OPENID);
    if (!guard.ok) return guard;
    return await handler(db, _, OPENID, event);
  } catch (e) {
    console.error('[productAdmin]', action, e);
    return { ok: false, code: CODES.INTERNAL, msg: '服务开小差了,请重试' };
  }
};
