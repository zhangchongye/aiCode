// 分类管理:增删改 + 排序(上移/下移调用 categorySort 批量写 sort)。
const { call, errorMsg, getAll } = require('../../../utils/cloud.js');

Page({
  data: { list: [], loading: false },

  onShow() {
    this.load();
  },

  load() {
    this.setData({ loading: true });
    getAll(wx.cloud.database().collection('categories').orderBy('sort', 'asc'))
      .then((list) => this.setData({ list, loading: false }))
      .catch((e) => {
        this.setData({ loading: false });
        wx.showToast({ title: errorMsg(e, '加载失败'), icon: 'none' });
      });
  },

  editName(title, current, save) {
    wx.showModal({
      title,
      editable: true,
      content: current || '',
      placeholderText: '1-10 字',
      success: (r) => {
        if (!r.confirm) return;
        const name = (r.content || '').trim();
        if (!name) return;
        save(name)
          .then(() => {
            wx.showToast({ title: '已保存', icon: 'none' });
            this.load();
          })
          .catch((e) => wx.showToast({ title: errorMsg(e), icon: 'none' }));
      },
    });
  },

  onAdd() {
    this.editName('新增分类', '', (name) => call('productAdmin', { action: 'categoryCreate', name }));
  },

  onRename(e) {
    const id = e.currentTarget.dataset.id;
    const cur = this.data.list.find((c) => c._id === id);
    this.editName('重命名分类', cur && cur.name, (name) =>
      call('productAdmin', { action: 'categoryUpdate', categoryId: id, name })
    );
  },

  move(id, dir) {
    const list = this.data.list.slice();
    const idx = list.findIndex((c) => c._id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    this.setData({ list });
    call('productAdmin', { action: 'categorySort', orderedIds: list.map((c) => c._id) }).catch((e) => {
      wx.showToast({ title: errorMsg(e), icon: 'none' });
      this.load();
    });
  },

  onMoveUp(e) {
    this.move(e.currentTarget.dataset.id, -1);
  },

  onMoveDown(e) {
    this.move(e.currentTarget.dataset.id, 1);
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除分类',
      content: '确定删除该分类?(有在售商品时会被拒绝)',
      success: (r) => {
        if (!r.confirm) return;
        call('productAdmin', { action: 'categoryRemove', categoryId: id })
          .then(() => {
            wx.showToast({ title: '已删除', icon: 'none' });
            this.load();
          })
          .catch((e2) => wx.showToast({ title: errorMsg(e2), icon: 'none' }));
      },
    });
  },
});
