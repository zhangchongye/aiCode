// 登录云函数:以 openid 为 _id upsert users 文档。
// 返回 { openid, role, isNew }。role 不会被覆盖——商家角色由控制台手动配置。
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();
  const users = db.collection('users');

  const res = await users.doc(OPENID).get().catch(() => null);
  if (res && res.data) {
    await users.doc(OPENID).update({ data: { lastLoginAt: db.serverDate() } });
    return { ok: true, data: { openid: OPENID, role: res.data.role || 'customer', isNew: false } };
  }

  await users.doc(OPENID).set({
    data: {
      role: 'customer',
      nickName: '',
      avatarUrl: '',
      createdAt: db.serverDate(),
      lastLoginAt: db.serverDate(),
    },
  });
  return { ok: true, data: { openid: OPENID, role: 'customer', isNew: true } };
};
