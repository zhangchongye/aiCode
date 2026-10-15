// 商品管理:按分类分组列表、上/下架开关、删除、新增/编辑入口。
const { call, errorMsg, getAll } = require('../../../utils/cloud.js');
const { fenToYuan } = require('../../../utils/money.js');

Page({
  data: { groups: [], loading: true },

  onShow() {
    this.load();
  },

  load() {
    const db = wx.cloud.database();
    Promise.all([
      getAll(db.collection('categories').where({ enabled: true }).orderBy('sort', 'asc')),
      getAll(db.collection('products').orderBy('sort', 'asc')),
    ])
      .then(([cats, products]) => {
        const groups = cats
          .map((c) => ({
            categoryId: c._id,
            name: c.name,
            products: products
              .filter((p) => p.categoryId === c._id)
              .map((p) => ({
                ...p,
                priceText: fenToYuan(p.price),
                statusText: p.status === 'on' ? '在售' : '已下架',
              })),
          }))
          .filter((g) => g.products.length);
        this.setData({ groups, loading: false });
      })
      .catch((e) => {
        this.setData({ loading: false });
        wx.showToast({ title: errorMsg(e, '加载失败'), icon: 'none' });
      });
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/merchant/product-edit/product-edit' });
  },

  goEdit(e) {
    wx.navigateTo({ url: '/pages/merchant/product-edit/product-edit?id=' + e.currentTarget.dataset.id });
  },

  onToggle(e) {
    const { id, status } = e.currentTarget.dataset;
    call('productAdmin', {
      action: 'productSetStatus',
      productId: id,
      status: status === 'on' ? 'off' : 'on',
    })
      .then(() => this.load())
      .catch((e2) => wx.showToast({ title: errorMsg(e2), icon: 'none' }));
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除商品',
      content: '删除后不可恢复(历史订单不受影响)。确定?',
      success: (r) => {
        if (!r.confirm) return;
        call('productAdmin', { action: 'productRemove', productId: id })
          .then(() => {
            wx.showToast({ title: '已删除', icon: 'none' });
            this.load();
          })
          .catch((e2) => wx.showToast({ title: errorMsg(e2), icon: 'none' }));
      },
    });
  },
});
