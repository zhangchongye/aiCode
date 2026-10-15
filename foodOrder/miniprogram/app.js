const { call } = require('./utils/cloud.js');

App({
  globalData: { openid: '', role: 'customer' },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上基础库以使用云能力');
      return;
    }
    wx.cloud.init({ env: wx.cloud.DYNAMIC_CURRENT_ENV, traceUser: true });
    this.login();
  },

  // 静默登录:openid 自动注册,返回 { openid, role, isNew }。
  // 失败后可重试;me 页 onShow 也会调用以刷新角色。
  login() {
    if (!this.loginPromise) {
      this.loginPromise = call('login')
        .then((u) => {
          this.globalData.openid = u.openid;
          this.globalData.role = u.role;
          return u;
        })
        .catch((e) => {
          console.error('[login]', e);
          this.loginPromise = null;
          throw e;
        });
    }
    return this.loginPromise;
  },
});
