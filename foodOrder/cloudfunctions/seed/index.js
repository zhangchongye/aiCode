// 种子数据云函数:幂等初始化分类与示例菜品。
// 调用守卫:若已存在商家账号,则仅商家可执行;否则(首次部署窗口)允许任意已登录用户执行一次,
// 并在日志中记录调用者 openid 留审计。上线前建议禁用本函数。
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const data = require('./data.js');

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  console.log('[seed] called by openid:', OPENID);
  const db = cloud.database();

  try {
    const cats = await db.collection('categories').count();
    if (cats.total > 0) {
      return { ok: false, code: 'CONFLICT', msg: '已初始化,无需重复执行' };
    }

    const merchantCount = await db.collection('users').where({ role: 'merchant' }).count();
    if (merchantCount.total > 0) {
      const me = await db.collection('users').doc(OPENID).get().catch(() => null);
      if (!me || !me.data || me.data.role !== 'merchant') {
        return { ok: false, code: 'NO_PERMISSION', msg: '商家已配置,仅商家可初始化数据' };
      }
    }

    for (const c of data.categories) {
      await db.collection('categories').doc(c._id).set({
        data: { name: c.name, sort: c.sort, enabled: true, createdAt: db.serverDate(), updatedAt: db.serverDate() },
      });
    }
    for (let i = 0; i < data.products.length; i++) {
      const p = data.products[i];
      await db.collection('products').add({
        data: { ...p, sort: i, status: 'on', createdAt: db.serverDate(), updatedAt: db.serverDate() },
      });
    }
    return { ok: true, data: { categories: data.categories.length, products: data.products.length } };
  } catch (e) {
    console.error('[seed]', e);
    return { ok: false, code: 'INTERNAL', msg: '初始化失败,请查看云函数日志' };
  }
};
