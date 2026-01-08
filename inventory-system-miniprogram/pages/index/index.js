// 仪表盘页面逻辑
Page({
  data: {
    stats: {
      totalProducts: 0,
      totalStock: 0,
      todayIn: 0,
      todayOut: 0,
    },
    recentRecords: [],
    loading: true,
  },

  // 页面加载时获取数据
  onLoad() {
    this.fetchStats();
    this.fetchRecentRecords();
  },

  // 页面显示时重新获取数据
  onShow() {
    this.fetchStats();
    this.fetchRecentRecords();
  },

  // 获取库存统计数据
  fetchStats() {
    const app = getApp();
    app.requestApi('/products/stats/stock', 'GET')
      .then(res => {
        this.setData({
          stats: res,
        });
      })
      .catch(err => {
        console.error('获取统计数据失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      });
  },

  // 获取最近的出入库记录
  fetchRecentRecords() {
    const app = getApp();
    Promise.all([
      app.requestApi('/in-records', 'GET'),
      app.requestApi('/out-records', 'GET')
    ])
    .then(([inRecords, outRecords]) => {
      // 合并记录并添加类型标识
      const allRecords = [
        ...inRecords.map(record => ({
          ...record,
          type: 'in',
          date: new Date(record.date).toLocaleString()
        })),
        ...outRecords.map(record => ({
          ...record,
          type: 'out',
          date: new Date(record.date).toLocaleString()
        }))
      ];

      // 按时间排序，取最近10条
      allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.setData({
        recentRecords: allRecords.slice(0, 10),
        loading: false
      });
    })
    .catch(err => {
      console.error('获取最近记录失败:', err);
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      });
      this.setData({
        loading: false
      });
    });
  }
})