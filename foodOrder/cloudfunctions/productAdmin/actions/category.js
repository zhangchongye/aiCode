// 分类管理:创建/更新/删除(有在售商品时拒删)/排序。
const { CODES, fail } = require('../errors.js');

const NAME_MAX = 10;

function validName(name) {
  const n = String(name || '').trim();
  if (!n || n.length > NAME_MAX) return null;
  return n;
}

async function create(db, _, openid, event) {
  const name = validName(event.name);
  if (!name) return fail(CODES.INVALID_PARAMS, '分类名称需为 1-10 字');
  const count = await db.collection('categories').count();
  const addRes = await db.collection('categories').add({
    data: { name, sort: count.total + 1, enabled: true, createdAt: db.serverDate(), updatedAt: db.serverDate() },
  });
  return { ok: true, data: { categoryId: addRes._id } };
}

async function update(db, _, openid, event) {
  const { categoryId } = event;
  if (!categoryId) return fail(CODES.INVALID_PARAMS, '缺少分类 ID');
  const name = validName(event.name);
  if (!name) return fail(CODES.INVALID_PARAMS, '分类名称需为 1-10 字');
  await db.collection('categories').doc(categoryId).update({
    data: { name, updatedAt: db.serverDate() },
  });
  return { ok: true, data: { updated: 1 } };
}

async function remove(db, _, openid, event) {
  const { categoryId } = event;
  if (!categoryId) return fail(CODES.INVALID_PARAMS, '缺少分类 ID');
  const onSale = await db.collection('products').where({ categoryId, status: 'on' }).count();
  if (onSale.total > 0) {
    return fail(CODES.CONFLICT, '该分类下还有在售商品,请先下架或移走');
  }
  await db.collection('categories').doc(categoryId).remove();
  return { ok: true, data: { removed: 1 } };
}

async function sort(db, _, openid, event) {
  const { orderedIds } = event;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return fail(CODES.INVALID_PARAMS, '排序数据无效');
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await db.collection('categories').doc(orderedIds[i]).update({
      data: { sort: i + 1, updatedAt: db.serverDate() },
    });
  }
  return { ok: true, data: { updated: orderedIds.length } };
}

module.exports = { create, update, remove, sort };
