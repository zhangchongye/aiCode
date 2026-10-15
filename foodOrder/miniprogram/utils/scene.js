// 扫码 scene 参数解析:桌码小程序码携带 scene = 't=3'(编码后如 't%3D3')。
// 成功返回 { tableNo },无有效桌号返回 null。

const TABLE_NO_MAX_LEN = 16;

function parseScene(scene) {
  if (!scene || typeof scene !== 'string') return null;
  let decoded;
  try {
    decoded = decodeURIComponent(scene);
  } catch (e) {
    return null;
  }
  const pair = decoded
    .split('&')
    .map((kv) => kv.split('='))
    .find(([key]) => key === 't');
  if (!pair) return null;
  const tableNo = (pair[1] || '').trim();
  if (!tableNo || tableNo.length > TABLE_NO_MAX_LEN) return null;
  return { tableNo };
}

module.exports = { parseScene, TABLE_NO_MAX_LEN };
