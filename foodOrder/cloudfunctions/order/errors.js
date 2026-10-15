// 统一错误码与失败响应构造。所有云函数返回 { ok:false, code, msg } 或 { ok:true, data }。

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
