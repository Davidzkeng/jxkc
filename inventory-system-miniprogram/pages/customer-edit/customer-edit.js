// 客户编辑页面逻辑
Page({
  data: {
    mode: 'add', // add 或 edit
    id: '',
    customer: {
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
    
    // 如果是编辑模式，获取客户详情
    if (mode === 'edit' && id) {
      this.fetchCustomerDetail(id);
    }
  },

  // 获取客户详情
  fetchCustomerDetail(id) {
    const app = getApp();
    app.requestApi(`/customers/${id}`, 'GET')
      .then(res => {
        this.setData({
          customer: res
        });
      })
      .catch(err => {
        console.error('获取客户详情失败:', err);
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
      [`customer.${field}`]: value
    });
  },

  // 提交表单
  submitForm(e) {
    const { mode, id, customer } = this.data;
    
    // 表单验证
    if (!customer.name.trim()) {
      wx.showToast({
        title: '客户名称不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (!customer.contactPerson.trim()) {
      wx.showToast({
        title: '联系人不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (!customer.phone.trim()) {
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
      // 添加客户
      requestPromise = app.requestApi('/customers', 'POST', customer);
    } else {
      // 更新客户
      requestPromise = app.requestApi(`/customers/${id}`, 'PUT', customer);
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
        console.error(`${mode === 'add' ? '添加' : '修改'}客户失败:`, err);
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