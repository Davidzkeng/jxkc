const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    product: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.loadProductDetail(options.id);
    }
  },

  loadProductDetail(id) {
    this.setData({ loading: true });
    api.getProductById(id)
      .then(res => {
        this.setData({
          product: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载商品详情失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  editProduct() {
    wx.navigateTo({
      url: `/pages/products/form?id=${this.data.product.id}`
    });
  }
});
