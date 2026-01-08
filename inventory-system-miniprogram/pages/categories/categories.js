// 分类管理页面逻辑
Page({
  data: {
    categories: [],
    loading: true,
  },

  // 页面加载时获取分类列表
  onLoad() {
    this.fetchCategories();
  },

  // 页面显示时重新获取数据
  onShow() {
    this.fetchCategories();
  },

  // 获取分类列表
  fetchCategories() {
    this.setData({ loading: true });
    const app = getApp();
    app.requestApi('/categories', 'GET')
      .then(res => {
        this.setData({
          categories: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取分类列表失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  // 跳转到添加分类页面
  navigateToAddCategory() {
    wx.navigateTo({
      url: '/pages/category-edit/category-edit?mode=add'
    });
  },

  // 跳转到编辑分类页面
  navigateToEditCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/category-edit/category-edit?mode=edit&id=${id}`
    });
  },

  // 删除分类
  deleteCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个分类吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.requestApi(`/categories/${id}`, 'DELETE')
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.fetchCategories();
            })
            .catch(err => {
              console.error('删除分类失败:', err);
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