// 我的订单:状态筛选 tab + 云函数分页。
const { call, errorMsg } = require('../../utils/cloud.js');
const { fenToYuan } = require('../../utils/money.js');
const { statusText } = require('../../utils/orderStatus.js');
const { formatTime } = require('../../utils/format.js');

const TABS = [
  { key: '', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'COMPLETED', label: '已完成' },
];
const ACTIVE_STATUSES = ['UNPAID', 'PAID', 'PREPARING', 'READY'];

Page({
  data: { tabs: TABS, activeTab: '', list: [], page: 1, hasMore: true, loading: false },

  onShow() {
    this.reload();
  },

  reload() {
    this.setData({ list: [], page: 1, hasMore: true });
    this.loadMore();
  },

  onTab(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.activeTab) return;
    this.setData({ activeTab: key, list: [], page: 1, hasMore: true });
    this.loadMore();
  },

  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
    const params = { action: 'listMine', page: this.data.page };
    if (this.data.activeTab === 'active') params.status = ACTIVE_STATUSES;
    else if (this.data.activeTab) params.status = this.data.activeTab;
    call('order', params)
      .then(({ list, hasMore }) => {
        const mapped = list.map((o) => ({
          ...o,
          statusText: statusText(o.status),
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
        wx.showToast({ title: errorMsg(e, '加载失败'), icon: 'none' });
      });
  },

  onReachBottom() {
    this.loadMore();
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + e.currentTarget.dataset.id });
  },
});
