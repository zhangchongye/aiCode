// 桌码生成:调 productAdmin.getTableQR(云调用 wxacode.getUnlimited)。
// 注意:小程序码需小程序发布后扫码才能正常进入;开发期用编译模式 scene 模拟。
const { call, errorMsg } = require('../../../utils/cloud.js');

Page({
  data: { tableNo: '', fileID: '', generating: false },

  onTableNo(e) {
    this.setData({ tableNo: e.detail.value });
  },

  onGenerate() {
    const tableNo = this.data.tableNo.trim();
    if (!tableNo) {
      wx.showToast({ title: '请输入桌号', icon: 'none' });
      return;
    }
    if (tableNo.length > 16) {
      wx.showToast({ title: '桌号需为 1-16 字符', icon: 'none' });
      return;
    }
    this.setData({ generating: true });
    wx.showLoading({ title: '生成中' });
    call('productAdmin', { action: 'getTableQR', tableNo })
      .then(({ fileID }) => {
        wx.hideLoading();
        this.setData({ fileID, generating: false });
      })
      .catch((e) => {
        wx.hideLoading();
        this.setData({ generating: false });
        wx.showToast({ title: errorMsg(e), icon: 'none' });
      });
  },

  onLongPress() {
    if (!this.data.fileID) return;
    wx.cloud
      .downloadFile({ fileID: this.data.fileID })
      .then((res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: '已保存到相册,可打印张贴', icon: 'none' }),
          fail: () => wx.showToast({ title: '保存失败,请检查相册权限', icon: 'none' }),
        });
      })
      .catch(() => wx.showToast({ title: '下载失败', icon: 'none' }));
  },
});
