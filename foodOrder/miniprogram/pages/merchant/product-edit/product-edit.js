// 商品编辑:新增/编辑复用。价格以"元"输入,提交前转整数"分"。
const { call, errorMsg, getAll } = require('../../../utils/cloud.js');
const { yuanToFen, fenToYuan } = require('../../../utils/money.js');

Page({
  data: {
    id: '',
    categories: [],
    categoryIndex: 0,
    name: '',
    priceYuan: '',
    description: '',
    image: '',
    status: 'on',
    saving: false,
  },

  onLoad(options) {
    this.setData({ id: options.id || '' });
    this.loadCategories();
    if (options.id) this.loadProduct(options.id);
  },

  loadCategories() {
    getAll(wx.cloud.database().collection('categories').where({ enabled: true }).orderBy('sort', 'asc'))
      .then((cats) => this.setData({ categories: cats }))
      .catch(() => {});
  },

  loadProduct(id) {
    wx.cloud
      .database()
      .collection('products')
      .doc(id)
      .get()
      .then((res) => {
        const p = res.data;
        this.setData({
          name: p.name,
          priceYuan: fenToYuan(p.price),
          description: p.description || '',
          image: p.image || '',
          status: p.status,
        });
        const idx = this.data.categories.findIndex((c) => c._id === p.categoryId);
        if (idx >= 0) this.setData({ categoryIndex: idx });
      })
      .catch(() => wx.showToast({ title: '商品不存在', icon: 'none' }));
  },

  onName(e) {
    this.setData({ name: e.detail.value });
  },
  onPrice(e) {
    this.setData({ priceYuan: e.detail.value });
  },
  onDesc(e) {
    this.setData({ description: e.detail.value });
  },
  onCategory(e) {
    this.setData({ categoryIndex: Number(e.detail.value) });
  },
  onStatus(e) {
    this.setData({ status: e.detail.value ? 'on' : 'off' });
  },

  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath;
        const ext = (filePath.match(/\.[a-zA-Z]+$/) || ['.png'])[0];
        const cloudPath = 'products/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + ext;
        wx.showLoading({ title: '上传中' });
        wx.cloud
          .uploadFile({ cloudPath, filePath })
          .then((up) => {
            wx.hideLoading();
            this.setData({ image: up.fileID });
          })
          .catch(() => {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
          });
      },
    });
  },

  onSave() {
    if (this.data.saving) return;
    const name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: '请填写名称', icon: 'none' });
      return;
    }
    let price;
    try {
      price = yuanToFen(Number(this.data.priceYuan));
    } catch (e) {
      wx.showToast({ title: '价格无效', icon: 'none' });
      return;
    }
    if (price <= 0) {
      wx.showToast({ title: '价格需大于 0', icon: 'none' });
      return;
    }
    const cat = this.data.categories[this.data.categoryIndex];
    if (!cat) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }
    const payload = {
      name,
      price,
      categoryId: cat._id,
      image: this.data.image,
      description: this.data.description,
      status: this.data.status,
    };
    this.setData({ saving: true });
    const req = this.data.id
      ? call('productAdmin', { action: 'productUpdate', productId: this.data.id, ...payload })
      : call('productAdmin', { action: 'productCreate', ...payload });
    req
      .then(() => {
        wx.showToast({ title: '已保存', icon: 'none' });
        wx.navigateBack();
      })
      .catch((e) => {
        this.setData({ saving: false });
        wx.showToast({ title: errorMsg(e, '保存失败'), icon: 'none' });
      });
  },
});
