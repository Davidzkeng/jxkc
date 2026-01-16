const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    suppliers: [],
    loading: true
  },

  onLoad() {
    this.loadSuppliers();
  },

  onShow() {
    this.loadSuppliers();
  },

  loadSuppliers() {
    this.setData({ loading: true });
    api.getSuppliers()
      .then(res => {
        this.setData({
          suppliers: Array.isArray(res) ? res : [],
          loading: false
        });
      })
      .catch(err => {
        console.error('加载供应商列表失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/suppliers/form'
    });
  },

  navigateToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/suppliers/form?id=${id}`
    });
  },

  deleteSupplier(e) {
    const id = e.currentTarget.dataset.id;
    util.showConfirm('确定要删除该供应商吗？', () => {
      api.deleteSupplier(id)
        .then(() => {
          util.showSuccess('删除成功');
          this.loadSuppliers();
        })
        .catch(err => {
          console.error('删除供应商失败', err);
          util.showError('删除失败');
        });
    });
  }
});
