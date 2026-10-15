// 点餐首页:扫码落地解析桌号 + 分类侧栏 + 商品列表(直连云数据库读)+ 购物车悬浮栏。
const { getAll, errorMsg } = require('../../utils/cloud.js');
const cart = require('../../utils/cart.js');
const { parseScene } = require('../../utils/scene.js');
const { fenToYuan } = require('../../utils/money.js');

const TABLE_PRESETS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

Page({
  data: {
    categories: [],
    activeCategoryId: '',
    products: [],
    tableNo: '',
    cartCount: 0,
    cartTotalText: '0.00',
  },

  onLoad(options) {
    // 桌号优先级:scene 扫码参数 > 页面参数 > 本地缓存
    let tableNo = '';
    if (options.scene) {
      const r = parseScene(options.scene);
      tableNo = r ? r.tableNo : '';
    }
    if (!tableNo && options.tableNo) tableNo = String(options.tableNo).trim().slice(0, 16);
    if (tableNo) wx.setStorageSync('tableNo', tableNo);
    this.setData({ tableNo: tableNo || wx.getStorageSync('tableNo') || '' });
  },

  onShow() {
    this.refreshCart();
    if (!this.data.categories.length) this.loadCategories();
  },

  loadCategories() {
    const db = wx.cloud.database();
    getAll(db.collection('categories').where({ enabled: true }).orderBy('sort', 'asc'))
      .then((cats) => {
        this.setData({ categories: cats });
        if (cats.length && !this.data.activeCategoryId) this.selectCategory(cats[0]._id);
      })
      .catch((e) => wx.showToast({ title: errorMsg(e, '菜单加载失败'), icon: 'none' }));
  },

  selectCategory(e) {
    const id = typeof e === 'string' ? e : e.currentTarget.dataset.id;
    this.setData({ activeCategoryId: id });
    this.loadProducts(id);
  },

  loadProducts(categoryId) {
    const db = wx.cloud.database();
    getAll(db.collection('products').where({ categoryId, status: 'on' }).orderBy('sort', 'asc'))
      .then((products) => this.setData({ products }))
      .catch((e) => wx.showToast({ title: errorMsg(e, '菜品加载失败'), icon: 'none' }));
  },

  onAddToCart(e) {
    const p = e.detail.product;
    cart.saveCart(
      cart.addItem(cart.getCart(), { productId: p._id, name: p.name, price: p.price, image: p.image })
    );
    this.refreshCart();
    wx.showToast({ title: '已加入购物车', icon: 'none' });
  },

  refreshCart() {
    const items = cart.getCart();
    this.setData({ cartCount: cart.count(items), cartTotalText: fenToYuan(cart.total(items)) });
  },

  goCart() {
    wx.navigateTo({ url: '/pages/cart/cart' });
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  // 无码兜底:手动选桌号
  chooseTable() {
    wx.showActionSheet({
      itemList: TABLE_PRESETS,
      success: (res) => {
        const tableNo = TABLE_PRESETS[res.tapIndex];
        wx.setStorageSync('tableNo', tableNo);
        this.setData({ tableNo });
      },
    });
  },
});
