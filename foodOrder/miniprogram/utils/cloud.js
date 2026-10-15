// 云能力封装:云函数调用(统一解包 {ok,data} / {ok:false,code,msg})与云数据库全量读取。

function call(name, data = {}) {
  return wx.cloud.callFunction({ name, data }).then((res) => {
    const r = res.result || {};
    if (!r.ok) {
      const e = new Error(r.msg || '操作失败');
      e.code = r.code;
      throw e;
    }
    return r.data;
  });
}

function errorMsg(e, fallback) {
  return (e && e.msg) || fallback || '操作失败';
}

// 客户端直连云数据库单次 get 上限 20 条,此函数循环拉全量。
// query 需已带上 where / orderBy(返回的是新 query,可直接复用)。
function getAll(query) {
  const PAGE = 20;
  let skip = 0;
  const out = [];
  const loop = () =>
    query
      .skip(skip)
      .limit(PAGE)
      .get()
      .then((res) => {
        out.push(...res.data);
        if (res.data.length === PAGE) {
          skip += PAGE;
          return loop();
        }
        return out;
      });
  return loop();
}

module.exports = { call, errorMsg, getAll };
