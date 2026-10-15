// 与 cloudfunctions/order/errors.js 同源拷贝(云函数目录相互独立,无法共享文件)。
const CODES = {
  INVALID_PARAMS: 'INVALID_PARAMS',
  NO_PERMISSION: 'NO_PERMISSION',
  INVALID_STATE: 'INVALID_STATE',
  CONFLICT: 'CONFLICT',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL: 'INTERNAL',
};

const fail = (code, msg) => ({ ok: false, code, msg });

module.exports = { CODES, fail };
