// 分类编辑页面逻辑
Page({
  data: {
    mode: 'add', // add 或 edit
    id: '',
    category: {
      name: '',
      description: ''
    },
    submitting: false
  },

  // 页面加载时获取参数和数据
  onLoad(options) {
    const { mode, id } = options;
    this.setData({
      mode,
      id
    });
    
    // 如果是编辑模式，获取分类详情
    if (mode === 'edit' && id) {
      this.fetchCategoryDetail(id);
    }
  },

  // 获取分类详情
  fetchCategoryDetail(id) {
    const app = getApp();
    app.requestApi(`/categories/${id}`, 'GET')
      .then(res => {
        this.setData({
          category: res
        });
      })
      .catch(err => {
        console.error('获取分类详情失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      });
  },

  // 输入框内容变化时更新数据
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`category.${field}`]: value
    });
  },

  // 提交表单
  submitForm(e) {
    const { mode, id, category } = this.data;
    
    // 表单验证
    if (!category.name.trim()) {
      wx.showToast({
        title: '分类名称不能为空',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    const app = getApp();
    let requestPromise;
    
    if (mode === 'add') {
      // 添加分类
      requestPromise = app.requestApi('/categories', 'POST', category);
    } else {
      // 更新分类
      requestPromise = app.requestApi(`/categories/${id}`, 'PUT', category);
    }
    
    requestPromise
      .then(() => {
        wx.showToast({
          title: mode === 'add' ? '添加成功' : '修改成功',
          icon: 'success'
        });
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      })
      .catch(err => {
        console.error(`${mode === 'add' ? '添加' : '修改'}分类失败:`, err);
        wx.showToast({
          title: `${mode === 'add' ? '添加' : '修改'}失败`,
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ submitting: false });
      });
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack();
  }
})