// 商品编辑页面逻辑
Page({
  data: {
    mode: 'add', // add 或 edit
    id: '',
    formData: {
      name: '',
      code: '',
      categoryId: '',
      price: '',
      stock: '',
      description: ''
    },
    categories: [],
    categoryIndex: 0,
    selectedCategory: {},
    submitting: false
  },

  // 页面加载时获取参数和数据
  onLoad(options) {
    const { mode, id } = options;
    this.setData({
      mode,
      id
    });
    
    // 加载分类列表
    this.fetchCategories();
    
    // 如果是编辑模式，获取商品详情
    if (mode === 'edit' && id) {
      this.fetchProductDetail(id);
    }
  },

  // 获取分类列表
  fetchCategories() {
    const app = getApp();
    app.requestApi('/categories', 'GET')
      .then(res => {
        this.setData({
          categories: res
        });
      })
      .catch(err => {
        console.error('获取分类列表失败:', err);
        wx.showToast({
          title: '获取分类失败',
          icon: 'none'
        });
      });
  },

  // 获取商品详情
  fetchProductDetail(id) {
    const app = getApp();
    app.requestApi(`/products/${id}`, 'GET')
      .then(res => {
        const formData = {
          name: res.name,
          code: res.code,
          categoryId: res.categoryId,
          price: res.price,
          stock: res.stock,
          description: res.description
        };
        
        // 设置分类索引和选中的分类
        const categoryIndex = this.data.categories.findIndex(c => c.id === res.categoryId) || 0;
        const selectedCategory = this.data.categories[categoryIndex] || {};
        
        this.setData({
          formData,
          categoryIndex,
          selectedCategory
        });
      })
      .catch(err => {
        console.error('获取商品详情失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      });
  },

  // 分类选择变化
  handleCategoryChange(e) {
    const categoryIndex = e.detail.value;
    const selectedCategory = this.data.categories[categoryIndex] || {};
    const categoryId = selectedCategory.id || '';
    this.setData({
      categoryIndex,
      selectedCategory,
      [`formData.categoryId`]: categoryId
    });
  },

  // 输入框内容变化时更新数据
  handleInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 提交表单
  handleSubmit(e) {
    const { mode, id, formData } = this.data;
    
    // 表单验证
    if (!formData.name.trim()) {
      wx.showToast({
        title: '商品名称不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (!formData.code.trim()) {
      wx.showToast({
        title: '商品编码不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (!formData.categoryId) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none'
      });
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      wx.showToast({
        title: '请输入有效的售价',
        icon: 'none'
      });
      return;
    }
    
    if (formData.stock === '' || parseInt(formData.stock) < 0) {
      wx.showToast({
        title: '请输入有效的库存数量',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    const app = getApp();
    let requestPromise;
    
    // 准备提交数据
    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock)
    };
    
    if (mode === 'add') {
      // 添加商品
      requestPromise = app.requestApi('/products', 'POST', submitData);
    } else {
      // 更新商品
      requestPromise = app.requestApi(`/products/${id}`, 'PUT', submitData);
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
        console.error(`${mode === 'add' ? '添加' : '修改'}商品失败:`, err);
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