// 商品管理:创建/更新/删除/上下架。价格为整数"分"(由小程序端换算后传入)。
const { CODES, fail } = require('../errors.js');

const NAME_MAX = 30;
const DESC_MAX = 200;

async function categoryExists(db, categoryId) {
  if (!categoryId || typeof categoryId !== 'string') return false;
  const res = await db.collection('categories').doc(categoryId).get().catch(() => null);
  return !!(res && res.data);
}

// 校验并挑选可写字段,返回 { ok:true, data } 或 { ok:false, ... }
function pickFields(event, { requireAll }) {
  const out = {};
  if (event.name !== undefined) {
    const name = String(event.name).trim();
    if (!name || name.length > NAME_MAX) return fail(CODES.INVALID_PARAMS, '商品名称需为 1-30 字');
    out.name = name;
  }
  if (event.price !== undefined) {
    const price = event.price;
    if (!Number.isInteger(price) || price <= 0 || price > 99999999) {
      return fail(CODES.INVALID_PARAMS, '价格无效');
    }
    out.price = price;
  }
  if (event.categoryId !== undefined) {
    out.categoryId = event.categoryId;
  }
  if (event.image !== undefined) out.image = String(event.image);
  if (event.description !== undefined) {
    const description = String(event.description).trim();
    if (description.length > DESC_MAX) return fail(CODES.INVALID_PARAMS, '描述过长');
    out.description = description;
  }
  if (event.sort !== undefined) {
    const sort = event.sort;
    if (!Number.isInteger(sort) || sort < 0) return fail(CODES.INVALID_PARAMS, '排序值无效');
    out.sort = sort;
  }
  if (event.status !== undefined) {
    if (!['on', 'off'].includes(event.status)) return fail(CODES.INVALID_PARAMS, '状态无效');
    out.status = event.status;
  }
  if (requireAll) {
    if (!out.name || out.price === undefined || out.categoryId === undefined) {
      return fail(CODES.INVALID_PARAMS, '名称、价格、分类为必填');
    }
  }
  return { ok: true, data: out };
}

async function create(db, _, openid, event) {
  const picked = pickFields(event, { requireAll: true });
  if (!picked.ok) return picked;
  if (!(await categoryExists(db, picked.data.categoryId))) {
    return fail(CODES.INVALID_PARAMS, '分类不存在');
  }
  const addRes = await db.collection('products').add({
    data: {
      ...picked.data,
      image: picked.data.image || '',
      description: picked.data.description || '',
      sort: picked.data.sort || 0,
      status: picked.data.status || 'on',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    },
  });
  return { ok: true, data: { productId: addRes._id } };
}

async function update(db, _, openid, event) {
  const { productId } = event;
  if (!productId) return fail(CODES.INVALID_PARAMS, '缺少商品 ID');
  const picked = pickFields(event, { requireAll: false });
  if (!picked.ok) return picked;
  if (Object.keys(picked.data).length === 0) return fail(CODES.INVALID_PARAMS, '没有需要更新的字段');
  if (picked.data.categoryId !== undefined && !(await categoryExists(db, picked.data.categoryId))) {
    return fail(CODES.INVALID_PARAMS, '分类不存在');
  }
  await db.collection('products').doc(productId).update({
    data: { ...picked.data, updatedAt: db.serverDate() },
  });
  return { ok: true, data: { updated: 1 } };
}

async function remove(db, _, openid, event) {
  const { productId } = event;
  if (!productId) return fail(CODES.INVALID_PARAMS, '缺少商品 ID');
  await db.collection('products').doc(productId).remove(); // 硬删除:订单有快照,历史不受影响
  return { ok: true, data: { removed: 1 } };
}

async function setStatus(db, _, openid, event) {
  const { productId, status } = event;
  if (!productId) return fail(CODES.INVALID_PARAMS, '缺少商品 ID');
  if (!['on', 'off'].includes(status)) return fail(CODES.INVALID_PARAMS, '状态无效');
  await db.collection('products').doc(productId).update({
    data: { status, updatedAt: db.serverDate() },
  });
  return { ok: true, data: { updated: 1 } };
}

module.exports = { create, update, remove, setStatus };
