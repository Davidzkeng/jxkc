// 出库记录编辑页面逻辑
Page({
  data: {
    mode: 'add', // add 或 edit
    id: '',
    outRecord: {
      productId: '',
      quantity: '',
      customerId: '',
      operator: '',
      note: ''
    },
    products: [],
    customers: [],
    productIndex: 0,
    customerIndex: 0,
    submitting: false
  },

  // 页面加载时获取参数和数据
  onLoad(options) {
    const { mode, id } = options;
    this.setData({
      mode,
      id
    });
    
    // 加载商品和客户列表
    this.fetchProducts();
    this.fetchCustomers();
    
    // 如果是编辑模式，获取记录详情
    if (mode === 'edit' && id) {
      this.fetchOutRecordDetail(id);
    }
  },

  // 获取商品列表
  fetchProducts() {
    const app = getApp();
    app.requestApi('/products', 'GET')
      .then(res => {
        this.setData({
          products: res
        });
      })
      .catch(err => {
        console.error('获取商品列表失败:', err);
        wx.showToast({
          title: '获取商品失败',
          icon: 'none'
        });
      });
  },

  // 获取客户列表
  fetchCustomers() {
    const app = getApp();
    app.requestApi('/customers', 'GET')
      .then(res => {
        this.setData({
          customers: res
        });
      })
      .catch(err => {
        console.error('获取客户列表失败:', err);
        wx.showToast({
          title: '获取客户失败',
          icon: 'none'
        });
      });
  },

  // 获取出库记录详情
  fetchOutRecordDetail(id) {
    const app = getApp();
    app.requestApi(`/out-records/${id}`, 'GET')
      .then(res => {
        const outRecord = {
          productId: res.productId,
          quantity: res.quantity,
          customerId: res.customerId,
          operator: res.operator,
          note: res.note
        };
        
        // 设置商品和客户的索引
        const productIndex = this.data.products.findIndex(p => p.id === res.productId) || 0;
        const customerIndex = this.data.customers.findIndex(c => c.id === res.customerId) || 0;
        
        this.setData({
          outRecord,
          productIndex,
          customerIndex
        });
      })
      .catch(err => {
        console.error('获取出库记录详情失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      });
  },

  // 商品选择变化
  onProductChange(e) {
    const productIndex = e.detail.value;
    const productId = this.data.products[productIndex]?.id;
    this.setData({
      productIndex,
      [`outRecord.productId`]: productId
    });
  },

  // 客户选择变化
  onCustomerChange(e) {
    const customerIndex = e.detail.value;
    const customerId = this.data.customers[customerIndex]?.id;
    this.setData({
      customerIndex,
      [`outRecord.customerId`]: customerId
    });
  },

  // 输入框内容变化时更新数据
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`outRecord.${field}`]: value
    });
  },

  // 提交表单
  submitForm(e) {
    const { mode, id, outRecord } = this.data;
    
    // 表单验证
    if (!outRecord.productId) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }
    
    if (!outRecord.quantity || parseInt(outRecord.quantity) <= 0) {
      wx.showToast({
        title: '请输入有效的出库数量',
        icon: 'none'
      });
      return;
    }
    
    if (!outRecord.customerId) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      });
      return;
    }
    
    if (!outRecord.operator.trim()) {
      wx.showToast({
        title: '请输入操作员姓名',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    const app = getApp();
    let requestPromise;
    
    // 准备提交数据
    const submitData = {
      ...outRecord,
      quantity: parseInt(outRecord.quantity)
    };
    
    if (mode === 'add') {
      // 添加出库记录
      requestPromise = app.requestApi('/out-records', 'POST', submitData);
    } else {
      // 更新出库记录
      requestPromise = app.requestApi(`/out-records/${id}`, 'PUT', submitData);
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
        console.error(`${mode === 'add' ? '添加' : '修改'}出库记录失败:`, err);
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