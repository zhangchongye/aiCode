// order 云函数入口:action 白名单分发 + 统一错误包装。
// 约定:event = { action, ...params };返回 { ok:true, data } 或 { ok:false, code, msg }。
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const customer = require('./actions/customer.js');
const merchant = require('./actions/merchant.js');
const { CODES } = require('./errors.js');

const CUSTOMER_ACTIONS = ['create', 'pay', 'cancel', 'complete', 'listMine', 'detail'];
const MERCHANT_ACTIONS = ['accept', 'reject', 'finish', 'listAll'];

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const action = event && event.action;
  try {
    if (CUSTOMER_ACTIONS.includes(action)) return await customer[action](db, _, OPENID, event);
    if (MERCHANT_ACTIONS.includes(action)) return await merchant[action](db, _, OPENID, event);
    return { ok: false, code: CODES.INVALID_PARAMS, msg: '未知操作' };
  } catch (e) {
    console.error('[order]', action, e);
    return { ok: false, code: CODES.INTERNAL, msg: '服务开小差了,请重试' };
  }
};
