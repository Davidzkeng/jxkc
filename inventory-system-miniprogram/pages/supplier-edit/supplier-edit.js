// 供应商编辑页面逻辑
Page({
  data: {
    mode: 'add', // add 或 edit
    id: '',
    supplier: {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: ''
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
    
    // 如果是编辑模式，获取供应商详情
    if (mode === 'edit' && id) {
      this.fetchSupplierDetail(id);
    }
  },

  // 获取供应商详情
  fetchSupplierDetail(id) {
    const app = getApp();
    app.requestApi(`/suppliers/${id}`, 'GET')
      .then(res => {
        this.setData({
          supplier: res
        });
      })
      .catch(err => {
        console.error('获取供应商详情失败:', err);
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
      [`supplier.${field}`]: value
    });
  },

  // 提交表单
  submitForm(e) {
    const { mode, id, supplier } = this.data;
    
    // 表单验证
    if (!supplier.name.trim()) {
      wx.showToast({
        title: '供应商名称不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (!supplier.contactPerson.trim()) {
      wx.showToast({
        title: '联系人不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (!supplier.phone.trim()) {
      wx.showToast({
        title: '联系电话不能为空',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    const app = getApp();
    let requestPromise;
    
    if (mode === 'add') {
      // 添加供应商
      requestPromise = app.requestApi('/suppliers', 'POST', supplier);
    } else {
      // 更新供应商
      requestPromise = app.requestApi(`/suppliers/${id}`, 'PUT', supplier);
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
        console.error(`${mode === 'add' ? '添加' : '修改'}供应商失败:`, err);
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