// 搜索页:关键字正则匹配商品名(直连云数据库读)。
const { getAll, errorMsg } = require('../../utils/cloud.js');
const cart = require('../../utils/cart.js');

Page({
  data: { keyword: '', products: [], searched: false },

  onKeywordInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    if (!keyword) this.setData({ products: [], searched: false });
  },

  doSearch() {
    const kw = this.data.keyword.trim();
    if (!kw) return;
    const db = wx.cloud.database();
    const regexp = db.RegExp({ regexp: kw, options: 'i' });
    getAll(db.collection('products').where({ name: regexp, status: 'on' }).orderBy('sort', 'asc'))
      .then((products) => this.setData({ products, searched: true }))
      .catch((e) => wx.showToast({ title: errorMsg(e, '搜索失败'), icon: 'none' }));
  },

  onAddToCart(e) {
    const p = e.detail.product;
    cart.saveCart(
      cart.addItem(cart.getCart(), { productId: p._id, name: p.name, price: p.price, image: p.image })
    );
    wx.showToast({ title: '已加入购物车', icon: 'none' });
  },
});
