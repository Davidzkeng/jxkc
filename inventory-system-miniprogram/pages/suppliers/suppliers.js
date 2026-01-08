// 供应商管理页面逻辑
Page({
  data: {
    suppliers: [],
    loading: true,
  },

  // 页面加载时获取供应商列表
  onLoad() {
    this.fetchSuppliers();
  },

  // 页面显示时重新获取数据
  onShow() {
    this.fetchSuppliers();
  },

  // 获取供应商列表
  fetchSuppliers() {
    this.setData({ loading: true });
    const app = getApp();
    app.requestApi('/suppliers', 'GET')
      .then(res => {
        this.setData({
          suppliers: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取供应商列表失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  // 跳转到添加供应商页面
  navigateToAddSupplier() {
    wx.navigateTo({
      url: '/pages/supplier-edit/supplier-edit?mode=add'
    });
  },

  // 跳转到编辑供应商页面
  navigateToEditSupplier(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/supplier-edit/supplier-edit?mode=edit&id=${id}`
    });
  },

  // 删除供应商
  deleteSupplier(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个供应商吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.requestApi(`/suppliers/${id}`, 'DELETE')
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.fetchSuppliers();
            })
            .catch(err => {
              console.error('删除供应商失败:', err);
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