// 购物车页:本地 storage 购物车,stepper 改数量、删除、清空、去下单。
const cart = require('../../utils/cart.js');
const { fenToYuan } = require('../../utils/money.js');

Page({
  data: { items: [], totalText: '0.00', totalCount: 0 },

  onShow() {
    this.reload();
  },

  reload() {
    const items = cart.getCart().map((i) => ({ ...i, priceText: fenToYuan(i.price) }));
    this.setData({
      items,
      totalText: fenToYuan(cart.total(items)),
      totalCount: cart.count(items),
    });
  },

  onCountChange(e) {
    const { productId } = e.currentTarget.dataset;
    cart.saveCart(cart.setCount(cart.getCart(), productId, e.detail.value));
    this.reload();
  },

  onRemove(e) {
    const { productId } = e.currentTarget.dataset;
    cart.saveCart(cart.removeItem(cart.getCart(), productId));
    this.reload();
  },

  onClear() {
    wx.showModal({
      title: '清空购物车',
      content: '确定清空所有菜品吗?',
      success: (r) => {
        if (r.confirm) {
          cart.clearCart();
          this.reload();
        }
      },
    });
  },

  goConfirm() {
    if (!this.data.items.length) return;
    wx.navigateTo({ url: '/pages/order-confirm/order-confirm' });
  },
});
