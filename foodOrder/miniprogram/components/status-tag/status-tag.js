// 订单状态标签:文案/颜色映射见 utils/orderStatus.js。
const { statusText, statusColor } = require('../../utils/orderStatus.js');

Component({
  properties: {
    status: { type: String, value: '' },
  },
  data: { text: '', color: '#8E8E93' },
  observers: {
    status(s) {
      this.setData({ text: statusText(s), color: statusColor(s) });
    },
  },
});
