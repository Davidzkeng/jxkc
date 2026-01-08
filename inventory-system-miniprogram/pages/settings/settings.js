// 设置页面逻辑
Page({
  data: {
    systemInfo: []
  },

  // 页面加载时获取系统信息
  onLoad() {
    this.getSystemInfo();
  },

  // 获取系统信息
  getSystemInfo() {
    const systemInfo = wx.getSystemInfoSync();
    const infoList = [
      { key: '设备型号', value: systemInfo.model },
      { key: '微信版本', value: systemInfo.version },
      { key: '操作系统', value: systemInfo.system },
      { key: '屏幕宽度', value: `${systemInfo.screenWidth}px` },
      { key: '屏幕高度', value: `${systemInfo.screenHeight}px` },
      { key: '窗口宽度', value: `${systemInfo.windowWidth}px` },
      { key: '窗口高度', value: `${systemInfo.windowHeight}px` }
    ];
    this.setData({
      systemInfo: infoList
    });
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地缓存
          wx.clearStorage();
          wx.showToast({
            title: '缓存清除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 同步数据
  syncData() {
    wx.showLoading({
      title: '数据同步中...',
      mask: true
    });
    
    // 模拟数据同步过程
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '数据同步完成',
        icon: 'success'
      });
    }, 1500);
  }
})