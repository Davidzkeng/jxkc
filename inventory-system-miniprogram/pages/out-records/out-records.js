// 出库记录页面逻辑
Page({
  data: {
    outRecords: [],
    loading: true,
  },

  // 页面加载时获取数据
  onLoad() {
    this.fetchOutRecords();
  },

  // 页面显示时重新获取数据
  onShow() {
    this.fetchOutRecords();
  },

  // 获取出库记录
  fetchOutRecords() {
    this.setData({ loading: true });
    const app = getApp();
    app.requestApi('/out-records', 'GET')
      .then(res => {
        this.setData({
          outRecords: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取出库记录失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  // 跳转到添加出库记录页面
  navigateToAddOutRecord() {
    wx.navigateTo({
      url: '/pages/out-record-edit/out-record-edit?mode=add'
    });
  }
})