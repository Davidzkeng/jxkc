const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    stats: {
      totalProducts: 0,
      totalStock: 0,
      lowStockCount: 0,
      todayIn: 0,
      todayOut: 0
    },
    recentProducts: [],
    loading: true
  },

  onLoad() {
    this.loadStats();
    this.loadRecentProducts();
  },

  onShow() {
    this.onLoad();
  },

  loadStats() {
    api.getStockStats()
      .then(res => {
        this.setData({
          stats: res || this.data.stats
        });
      })
      .catch(err => {
        console.error('加载统计失败', err);
      });
  },

  loadRecentProducts() {
    api.getProducts()
      .then(res => {
        const products = Array.isArray(res) ? res : [];
        this.setData({
          recentProducts: products.slice(0, 5),
          loading: false
        });
      })
      .catch(err => {
        console.error('加载商品列表失败', err);
        this.setData({ loading: false });
      });
  },

  navigateToProducts() {
    wx.switchTab({
      url: '/pages/products/products'
    });
  },

  navigateToProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/products/detail?id=${id}`
    });
  }
});
