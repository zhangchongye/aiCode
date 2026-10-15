// 桌码生成:云调用 wxacode.getUnlimited 生成小程序码(scene 携带桌号),上传云存储返回 fileID。
// 注意:小程序码需小程序发布后扫码才可正常进入;开发期用编译模式 scene 模拟。
const cloud = require('wx-server-sdk');

const { CODES, fail } = require('../errors.js');

const TABLE_NO_MAX_LEN = 16;

async function getTableQR(db, _, openid, event) {
  const tableNo = String(event.tableNo || '').trim();
  if (!tableNo || tableNo.length > TABLE_NO_MAX_LEN) {
    return fail(CODES.INVALID_PARAMS, '桌号需为 1-16 字符');
  }
  let res;
  try {
    res = await cloud.openapi.wxacode.getUnlimited({
      scene: 't=' + tableNo,
      page: 'pages/index/index',
      checkPath: false, // 开发期页面未发布也能生成;正式使用请确保小程序已发布
      envVersion: 'release',
    });
  } catch (e) {
    console.error('[qr] wxacode failed', e);
    return fail(CODES.INTERNAL, '生成桌码失败,请确认小程序已发布');
  }
  if (!res || res.errCode !== 0 || !res.buffer) {
    return fail(CODES.INTERNAL, '生成桌码失败(' + (res && (res.errMsg || res.errCode)) + ')');
  }
  const upload = await cloud.uploadFile({
    cloudPath: 'qrcode/table-' + tableNo + '.png',
    fileContent: res.buffer,
  });
  return { ok: true, data: { fileID: upload.fileID } };
}

module.exports = { getTableQR };
