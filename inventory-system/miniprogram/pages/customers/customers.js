const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    customers: [],
    loading: true
  },

  onLoad() {
    this.loadCustomers();
  },

  onShow() {
    this.loadCustomers();
  },

  loadCustomers() {
    this.setData({ loading: true });
    api.getCustomers()
      .then(res => {
        this.setData({
          customers: Array.isArray(res) ? res : [],
          loading: false
        });
      })
      .catch(err => {
        console.error('加载客户列表失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/customers/form'
    });
  },

  navigateToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/customers/form?id=${id}`
    });
  },

  deleteCustomer(e) {
    const id = e.currentTarget.dataset.id;
    util.showConfirm('确定要删除该客户吗？', () => {
      api.deleteCustomer(id)
        .then(() => {
          util.showSuccess('删除成功');
          this.loadCustomers();
        })
        .catch(err => {
          console.error('删除客户失败', err);
          util.showError('删除失败');
        });
    });
  }
});
