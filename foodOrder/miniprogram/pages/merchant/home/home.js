// 商家中心:入口宫格 + 角色守卫(非商家进入即弹回)。
Page({
  data: {
    entries: [
      { key: 'orders', label: '订单管理', icon: '📋', url: '/pages/merchant/orders/orders' },
      { key: 'products', label: '商品管理', icon: '🍲', url: '/pages/merchant/products/products' },
      { key: 'categories', label: '分类管理', icon: '🗂️', url: '/pages/merchant/categories/categories' },
      { key: 'qr', label: '桌码生成', icon: '📱', url: '/pages/merchant/table-qr/table-qr' },
    ],
  },

  onShow() {
    getApp()
      .login()
      .then((u) => {
        if (u.role !== 'merchant') {
          wx.showToast({ title: '仅商家可访问', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 800);
        }
      })
      .catch(() => {});
  },

  go(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  },
});
