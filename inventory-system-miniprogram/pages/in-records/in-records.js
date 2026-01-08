// 入库记录页面逻辑
Page({
  data: {
    inRecords: [],
    loading: true,
  },

  // 页面加载时获取数据
  onLoad() {
    this.fetchInRecords();
  },

  // 页面显示时重新获取数据
  onShow() {
    this.fetchInRecords();
  },

  // 获取入库记录
  fetchInRecords() {
    this.setData({ loading: true });
    const app = getApp();
    app.requestApi('/in-records', 'GET')
      .then(res => {
        this.setData({
          inRecords: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取入库记录失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  // 跳转到添加入库记录页面
  navigateToAddInRecord() {
    wx.navigateTo({
      url: '/pages/in-record-edit/in-record-edit?mode=add'
    });
  }
})