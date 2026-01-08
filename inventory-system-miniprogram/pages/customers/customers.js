// 客户管理页面逻辑
Page({
  data: {
    customers: [],
    loading: true,
  },

  // 页面加载时获取客户列表
  onLoad() {
    this.fetchCustomers();
  },

  // 页面显示时重新获取数据
  onShow() {
    this.fetchCustomers();
  },

  // 获取客户列表
  fetchCustomers() {
    this.setData({ loading: true });
    const app = getApp();
    app.requestApi('/customers', 'GET')
      .then(res => {
        this.setData({
          customers: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取客户列表失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  // 跳转到添加客户页面
  navigateToAddCustomer() {
    wx.navigateTo({
      url: '/pages/customer-edit/customer-edit?mode=add'
    });
  },

  // 跳转到编辑客户页面
  navigateToEditCustomer(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/customer-edit/customer-edit?mode=edit&id=${id}`
    });
  },

  // 删除客户
  deleteCustomer(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个客户吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.requestApi(`/customers/${id}`, 'DELETE')
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.fetchCustomers();
            })
            .catch(err => {
              console.error('删除客户失败:', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            });
        }
      }
    });
  }
})