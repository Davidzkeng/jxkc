const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    products: [],
    loading: true
  },

  onLoad() {
    this.loadProducts();
  },

  onShow() {
    this.loadProducts();
  },

  loadProducts() {
    console.log("ttttttttt");
    this.setData({ loading: true });
    api.getProducts()
      .then(res => {
        this.setData({
          products: Array.isArray(res) ? res : [],
          loading: false
        });
      })
      .catch(err => {
        console.error('加载商品列表失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/products/form'
    });
  },

  navigateToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/products/form?id=${id}`
    });
  },

  navigateToUnits(e) {
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === id);
    wx.navigateTo({
      url: `/pages/products/units?productId=${id}&productName=${product.name}`
    });
  },

  deleteProduct(e) {
    const id = e.currentTarget.dataset.id;
    util.showConfirm('确定要删除该商品吗？', () => {
      api.deleteProduct(id)
        .then(() => {
          util.showSuccess('删除成功');
          this.loadProducts();
        })
        .catch(err => {
          console.error('删除商品失败', err);
          util.showError('删除失败');
        });
    });
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/products/detail?id=${id}`
    });
  }
});
