// 时间格式化:接受 Date / 毫秒时间戳 / ISO 字符串,无效输入返回空串。

const pad = (n) => String(n).padStart(2, '0');

function toDate(ts) {
  if (ts instanceof Date && !Number.isNaN(ts.getTime())) return ts;
  if (typeof ts === 'number' || (typeof ts === 'string' && ts)) {
    const d = new Date(ts);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function formatTime(ts) {
  const d = toDate(ts);
  if (!d) return '';
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(ts) {
  const d = toDate(ts);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

module.exports = { formatTime, formatDateTime };
