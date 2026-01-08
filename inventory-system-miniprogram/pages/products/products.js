// 商品管理页面逻辑
Page({
  data: {
    products: [],
    loading: true,
  },

  // 页面加载时获取商品列表
  onLoad() {
    this.fetchProducts();
  },

  // 页面显示时重新获取数据
  onShow() {
    this.fetchProducts();
  },

  // 获取商品列表
  fetchProducts() {
    this.setData({ loading: true });
    const app = getApp();
    app.requestApi('/products', 'GET')
      .then(res => {
        this.setData({
          products: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取商品列表失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  // 跳转到添加商品页面
  navigateToAddProduct() {
    wx.navigateTo({
      url: '/pages/product-edit/product-edit?mode=add'
    });
  },

  // 跳转到编辑商品页面
  navigateToEditProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product-edit/product-edit?mode=edit&id=${id}`
    });
  },

  // 删除商品
  deleteProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.requestApi(`/products/${id}`, 'DELETE')
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.fetchProducts();
            })
            .catch(err => {
              console.error('删除商品失败:', err);
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