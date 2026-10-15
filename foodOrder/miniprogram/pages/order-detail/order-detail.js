// 订单详情:状态标签 + 明细 + 时间线 + 操作按钮(顾客操作集见 utils/orderStatus.js)。
const { call, errorMsg } = require('../../utils/cloud.js');
const { customerActions } = require('../../utils/orderStatus.js');
const { fenToYuan } = require('../../utils/money.js');
const { formatTime } = require('../../utils/format.js');

Page({
  data: { order: null, items: [], totalText: '', actions: [], timeline: [], actionLoading: '' },

  onLoad(options) {
    this.orderId = options.id;
  },

  onShow() {
    this.load();
  },

  load() {
    call('order', { action: 'detail', orderId: this.orderId })
      .then(({ order }) => {
        const items = order.items.map((i) => ({ ...i, priceText: fenToYuan(i.price) }));
        const timeline = [
          { label: '下单', time: order.createdAt },
          { label: '支付', time: order.paidAt },
          { label: '商家接单', time: order.acceptedAt },
          { label: '出餐', time: order.finishedAt },
          { label: '完成', time: order.completedAt },
          {
            label: '取消' + (order.cancelReason ? ':' + order.cancelReason : ''),
            time: order.cancelledAt,
          },
        ]
          .filter((t) => t.time)
          .map((t) => ({ ...t, timeText: formatTime(t.time) }));
        this.setData({
          order,
          items,
          totalText: fenToYuan(order.totalAmount),
          actions: customerActions(order.status),
          timeline,
          actionLoading: '',
        });
      })
      .catch((e) => wx.showToast({ title: errorMsg(e, '订单加载失败'), icon: 'none' }));
  },

  onAction(e) {
    const { action } = e.currentTarget.dataset;
    if (this.data.actionLoading) return;
    if (action === 'cancel') {
      wx.showModal({
        title: '取消订单',
        editable: true,
        placeholderText: '取消原因(选填)',
        success: (r) => {
          if (r.confirm) this.doAction('cancel', { reason: r.content || '' });
        },
      });
      return;
    }
    if (action === 'pay') {
      wx.showModal({
        title: '模拟支付',
        content: '确认支付 ¥' + this.data.totalText + '?(演示环境,不会真实扣款)',
        success: (r) => {
          if (r.confirm) this.doAction('pay', {});
        },
      });
      return;
    }
    this.doAction(action, {});
  },

  doAction(action, params) {
    this.setData({ actionLoading: action });
    if (action === 'pay') wx.showLoading({ title: '支付中...' });
    call('order', { action, orderId: this.orderId, ...params })
      .then(() => {
        if (action === 'pay') wx.hideLoading();
        wx.showToast({ title: action === 'pay' ? '支付成功' : '操作成功', icon: 'none' });
        this.load();
      })
      .catch((e) => {
        if (action === 'pay') wx.hideLoading();
        wx.showToast({ title: errorMsg(e, '操作失败'), icon: 'none' });
        this.load(); // 状态冲突时刷新展示最新状态
      });
  },
});
