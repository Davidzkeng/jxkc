const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    customers: [],
    filteredCustomers: [],
    searchKeyword: '',
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
        const customers = Array.isArray(res) ? res : [];
        this.setData({
          customers: customers,
          filteredCustomers: customers,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载客户列表失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterCustomers(keyword);
  },

  onSearch(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterCustomers(keyword);
  },

  clearSearch() {
    this.setData({ 
      searchKeyword: '',
      filteredCustomers: this.data.customers 
    });
  },

  filterCustomers(keyword) {
    if (!keyword || keyword.trim() === '') {
      this.setData({ filteredCustomers: this.data.customers });
      return;
    }
    
    const lowerKeyword = keyword.toLowerCase().trim();
    const filtered = this.data.customers.filter(customer => {
      const name = (customer.name || '').toLowerCase();
      const contact = (customer.contact || '').toLowerCase();
      const phone = (customer.phone || '').toLowerCase();
      return name.includes(lowerKeyword) || contact.includes(lowerKeyword) || phone.includes(lowerKeyword);
    });
    
    this.setData({ filteredCustomers: filtered });
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
