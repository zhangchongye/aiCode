// 确认下单:桌号可改、备注、提交(调 order.create,成功后清空购物车跳订单详情)。
const cart = require('../../utils/cart.js');
const { fenToYuan } = require('../../utils/money.js');
const { call, errorMsg } = require('../../utils/cloud.js');

Page({
  data: { items: [], totalText: '0.00', tableNo: '', remark: '', submitting: false },

  onLoad() {
    const items = cart.getCart().map((i) => ({ ...i, priceText: fenToYuan(i.price) }));
    if (!items.length) {
      wx.showToast({ title: '购物车为空', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    this.setData({
      items,
      totalText: fenToYuan(cart.total(items)),
      tableNo: wx.getStorageSync('tableNo') || '',
    });
  },

  onTableNoInput(e) {
    this.setData({ tableNo: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  onSubmit() {
    if (this.data.submitting) return;
    const tableNo = this.data.tableNo.trim();
    if (!tableNo) {
      wx.showToast({ title: '请填写桌号', icon: 'none' });
      return;
    }
    if (tableNo.length > 16) {
      wx.showToast({ title: '桌号过长', icon: 'none' });
      return;
    }
    const items = cart.getCart();
    if (!items.length) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中' });
    call('order', {
      action: 'create',
      tableNo,
      items: items.map((i) => ({ productId: i.productId, count: i.count })),
      remark: this.data.remark,
    })
      .then((data) => {
        wx.hideLoading();
        cart.clearCart();
        wx.redirectTo({ url: '/pages/order-detail/order-detail?id=' + data.orderId });
      })
      .catch((e) => {
        wx.hideLoading();
        this.setData({ submitting: false });
        wx.showToast({ title: errorMsg(e, '下单失败'), icon: 'none' });
      });
  },
});
