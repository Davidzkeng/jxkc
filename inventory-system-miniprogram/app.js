// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'your-cloud-env-id',
        traceUser: true
      })
    }
    
    // 全局数据
    this.globalData = {
      userInfo: null,
      baseUrl: 'http://localhost:3001/api' // 后端API地址
    }
  },
  
  // 全局方法：请求API
  requestApi(url, method, data = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}${url}`,
        method,
        data,
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(new Error(res.data.message || '请求失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }
})