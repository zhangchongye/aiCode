// 商家订单:按状态队列展示,接单/拒单/出餐/完成,10s 轮询 + 下拉刷新。
const { call, errorMsg } = require('../../../utils/cloud.js');
const { fenToYuan } = require('../../../utils/money.js');
const { formatTime } = require('../../../utils/format.js');

const TABS = [
  { key: 'PAID', label: '待接单' },
  { key: 'PREPARING', label: '制作中' },
  { key: 'READY', label: '待取餐' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
];

Page({
  data: {
    tabs: TABS,
    activeTab: 'PAID',
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    actionLoading: '',
  },

  onShow() {
    this.reload();
    this.startPolling();
  },

  onHide() {
    this.stopPolling();
  },

  onUnload() {
    this.stopPolling();
  },

  onPullDownRefresh() {
    this.reload().then(() => wx.stopPullDownRefresh());
  },

  startPolling() {
    this.stopPolling();
    this.timer = setInterval(() => this.reload(true), 10000);
  },

  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  reload(silent) {
    this.setData({ list: [], page: 1, hasMore: true });
    return this.loadMore(silent);
  },

  loadMore(silent) {
    if (this.data.loading || !this.data.hasMore) return Promise.resolve();
    this.setData({ loading: true });
    return call('order', { action: 'listAll', status: this.data.activeTab, page: this.data.page })
      .then(({ list, hasMore }) => {
        const mapped = list.map((o) => ({
          ...o,
          totalText: fenToYuan(o.totalAmount),
          timeText: formatTime(o.createdAt),
          itemsBrief: o.items.map((i) => i.name + ' x' + i.count).join('、'),
        }));
        this.setData({
          list: this.data.list.concat(mapped),
          page: this.data.page + 1,
          hasMore,
          loading: false,
        });
      })
      .catch((e) => {
        this.setData({ loading: false });
        if (!silent) wx.showToast({ title: errorMsg(e, '加载失败'), icon: 'none' });
      });
  },

  onTab(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.activeTab) return;
    this.setData({ activeTab: key });
    this.reload();
  },

  onReachBottom() {
    this.loadMore();
  },

  onAccept(e) {
    this.doAction('accept', e.currentTarget.dataset.id, {});
  },

  onReject(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '拒单',
      editable: true,
      placeholderText: '拒单原因(必填)',
      success: (r) => {
        if (r.confirm) this.doAction('reject', id, { reason: r.content || '' });
      },
    });
  },

  onFinish(e) {
    this.doAction('finish', e.currentTarget.dataset.id, {});
  },

  onComplete(e) {
    this.doAction('complete', e.currentTarget.dataset.id, {});
  },

  doAction(action, orderId, params) {
    if (this.data.actionLoading) return;
    this.setData({ actionLoading: orderId });
    call('order', { action, orderId, ...params })
      .then(() => {
        wx.showToast({ title: '操作成功', icon: 'none' });
        this.reload(true);
      })
      .catch((e) => {
        wx.showToast({ title: errorMsg(e, '操作失败'), icon: 'none' });
        this.reload(true);
      });
  },
});
