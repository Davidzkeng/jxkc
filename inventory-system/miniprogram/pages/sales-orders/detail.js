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

  voidOrder() {
    const order = this.data.order;
    if (!order) {
      util.showError('销售单信息未加载');
      return;
    }

    util.showConfirm('确定要作废该销售单吗？作废后将恢复库存。', () => {
      api.voidSalesOrder(order.id)
        .then(() => {
          util.showSuccess('作废成功，库存已恢复');
          this.loadOrderDetail(order.id);
        })
        .catch(err => {
          console.error('作废销售单失败', err);
          util.showError(err.data?.error || '作废失败');
        });
    });
  },

  goBack() {
    wx.navigateBack();
  }
});