// 订单状态展示映射(小程序端)。状态机权威定义在 cloudfunctions/order/stateMachine.js,
// tests/orderStatus.test.js 断言:本文件暴露的顾客操作与状态机合法流转一一对应。

const STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const TEXT = {
  [STATUS.UNPAID]: '待支付',
  [STATUS.PAID]: '待接单',
  [STATUS.PREPARING]: '制作中',
  [STATUS.READY]: '待取餐',
  [STATUS.COMPLETED]: '已完成',
  [STATUS.CANCELLED]: '已取消',
};

const COLOR = {
  [STATUS.UNPAID]: '#FF9500',
  [STATUS.PAID]: '#3478F6',
  [STATUS.PREPARING]: '#AF52DE',
  [STATUS.READY]: '#34C759',
  [STATUS.COMPLETED]: '#8E8E93',
  [STATUS.CANCELLED]: '#FF3B30',
};

// 顾客在各状态可执行的操作(仅展示用,服务端状态机为权威校验)。
const CUSTOMER_ACTIONS = {
  [STATUS.UNPAID]: [
    { action: 'pay', target: STATUS.PAID, label: '去支付' },
    { action: 'cancel', target: STATUS.CANCELLED, label: '取消订单' },
  ],
  [STATUS.PAID]: [{ action: 'cancel', target: STATUS.CANCELLED, label: '取消订单' }],
  [STATUS.PREPARING]: [],
  [STATUS.READY]: [{ action: 'complete', target: STATUS.COMPLETED, label: '确认取餐' }],
  [STATUS.COMPLETED]: [],
  [STATUS.CANCELLED]: [],
};

function statusText(status) {
  return TEXT[status] || status;
}

function statusColor(status) {
  return COLOR[status] || '#8E8E93';
}

function customerActions(status) {
  return (CUSTOMER_ACTIONS[status] || []).map((a) => ({ ...a }));
}

module.exports = { STATUS, statusText, statusColor, customerActions };
