// app.js
App({
  globalData: {
    // API基础URL，请根据实际情况修改
    // baseUrl: 'http://localhost:3001/api',
    baseUrl: 'http://159.75.245.32:3001/api',
    userInfo: null
  },

  onLaunch() {
    // 小程序启动时的初始化
    console.log('进销库存系统小程序启动');
  },

  onShow() {
    // 小程序显示时的逻辑
  },

  onHide() {
    // 小程序隐藏时的逻辑
  }
});
