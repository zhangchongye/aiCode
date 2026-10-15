// 商品详情:直连云数据库读单条商品,stepper 选数量加购。
const cart = require('../../utils/cart.js');
const { fenToYuan } = require('../../utils/money.js');

Page({
  data: { product: null, count: 1, priceText: '' },

  onLoad(options) {
    wx.cloud
      .database()
      .collection('products')
      .doc(options.id)
      .get()
      .then((res) => {
        this.setData({ product: res.data, priceText: fenToYuan(res.data.price) });
      })
      .catch(() => wx.showToast({ title: '商品不存在或已下架', icon: 'none' }));
  },

  onCountChange(e) {
    this.setData({ count: e.detail.value });
  },

  onAdd() {
    const p = this.data.product;
    if (!p || p.status !== 'on') {
      wx.showToast({ title: '商品已下架', icon: 'none' });
      return;
    }
    let items = cart.getCart();
    const snapshot = { productId: p._id, name: p.name, price: p.price, image: p.image };
    for (let i = 0; i < this.data.count; i++) items = cart.addItem(items, snapshot);
    cart.saveCart(items);
    wx.showToast({ title: '已加入购物车', icon: 'none' });
    wx.navigateBack();
  },
});
