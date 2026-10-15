// 商品卡片:列表/搜索页通用。点击卡片进详情,点击 + 触发 add 事件。
const { fenToYuan } = require('../../utils/money.js');

Component({
  properties: {
    product: { type: Object, value: {} },
  },
  data: { priceText: '' },
  observers: {
    product(p) {
      if (p && typeof p.price === 'number') {
        this.setData({ priceText: fenToYuan(p.price) });
      }
    },
  },
  methods: {
    onTap() {
      wx.navigateTo({ url: '/pages/product-detail/product-detail?id=' + this.data.product._id });
    },
    onAdd() {
      this.triggerEvent('add', { product: this.data.product });
    },
  },
});
