// 我的:身份展示;商家角色显示商家中心入口;每次 onShow 重调 login 刷新角色。
const { call, errorMsg } = require('../../utils/cloud.js');

Page({
  data: { user: null, openidTail: '' },

  onShow() {
    getApp()
      .login()
      .then((u) => {
        this.setData({ user: u, openidTail: u.openid ? u.openid.slice(-4) : '' });
      })
      .catch(() => {});
  },

  goMerchant() {
    wx.navigateTo({ url: '/pages/merchant/home/home' });
  },

  // 商家工具:幂等写入示例分类与菜品(首次配置商家前可执行)
  onSeed() {
    wx.showModal({
      title: '初始化菜单数据',
      content: '将写入示例分类与菜品(已有数据则跳过)。确定执行吗?',
      success: (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: '初始化中' });
        call('seed')
          .then((d) => {
            wx.hideLoading();
            wx.showToast({
              title: '已写入 ' + d.categories + ' 分类 / ' + d.products + ' 菜品',
              icon: 'none',
            });
          })
          .catch((e) => {
            wx.hideLoading();
            wx.showToast({ title: errorMsg(e), icon: 'none' });
          });
      },
    });
  },
});
