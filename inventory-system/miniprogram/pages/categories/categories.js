const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    categories: [],
    loading: true
  },

  onLoad() {
    this.loadCategories();
  },

  onShow() {
    this.loadCategories();
  },

  loadCategories() {
    this.setData({ loading: true });
    api.getCategories()
      .then(res => {
        this.setData({
          categories: Array.isArray(res) ? res : [],
          loading: false
        });
      })
      .catch(err => {
        console.error('加载类别列表失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/categories/form'
    });
  },

  navigateToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/categories/form?id=${id}`
    });
  },

  deleteCategory(e) {
    const id = e.currentTarget.dataset.id;
    util.showConfirm('确定要删除该类别吗？', () => {
      api.deleteCategory(id)
        .then(() => {
          util.showSuccess('删除成功');
          this.loadCategories();
        })
        .catch(err => {
          console.error('删除类别失败', err);
          util.showError('删除失败');
        });
    });
  }
});
