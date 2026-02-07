const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    order: null,
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadOrderDetail(options.id);
    }
  },

  loadOrderDetail(id) {
    this.setData({ loading: true });
    api.getSalesOrderById(id)
      .then(res => {
        this.setData({
          order: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载销售单详情失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  printOrder() {
    const order = this.data.order;
    if (!order) {
      util.showError('销售单信息未加载');
      return;
    }

    // 跳转到打印预览页面，只传递订单ID
    wx.navigateTo({
      url: `/pages/sales-orders/print?id=${order.id}`
    });
  },

  goBack() {
    wx.navigateBack();
  }
});