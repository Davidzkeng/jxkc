const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    salesOrders: [],
    loading: false
  },

  onLoad() {
    this.loadSalesOrders();
  },

  onShow() {
    this.loadSalesOrders();
  },

  loadSalesOrders() {
    this.setData({ loading: true });
    api.getSalesOrders()
      .then(res => {
        this.setData({
          salesOrders: Array.isArray(res) ? res : [],
          loading: false
        });
      })
      .catch(err => {
        console.error('加载销售单列表失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/sales-orders/detail?id=${id}`
    });
  },

  createOrder() {
    wx.navigateTo({
      url: '/pages/sales-orders/form'
    });
  }
});