// 入库记录编辑页面逻辑
Page({
  data: {
    mode: 'add', // add 或 edit
    id: '',
    inRecord: {
      productId: '',
      quantity: '',
      supplierId: '',
      operator: '',
      note: ''
    },
    products: [],
    suppliers: [],
    productIndex: 0,
    supplierIndex: 0,
    submitting: false
  },

  // 页面加载时获取参数和数据
  onLoad(options) {
    const { mode, id } = options;
    this.setData({
      mode,
      id
    });
    
    // 加载商品和供应商列表
    this.fetchProducts();
    this.fetchSuppliers();
    
    // 如果是编辑模式，获取记录详情
    if (mode === 'edit' && id) {
      this.fetchInRecordDetail(id);
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

  // 获取供应商列表
  fetchSuppliers() {
    const app = getApp();
    app.requestApi('/suppliers', 'GET')
      .then(res => {
        this.setData({
          suppliers: res
        });
      })
      .catch(err => {
        console.error('获取供应商列表失败:', err);
        wx.showToast({
          title: '获取供应商失败',
          icon: 'none'
        });
      });
  },

  // 获取入库记录详情
  fetchInRecordDetail(id) {
    const app = getApp();
    app.requestApi(`/in-records/${id}`, 'GET')
      .then(res => {
        const inRecord = {
          productId: res.productId,
          quantity: res.quantity,
          supplierId: res.supplierId,
          operator: res.operator,
          note: res.note
        };
        
        // 设置商品和供应商的索引
        const productIndex = this.data.products.findIndex(p => p.id === res.productId) || 0;
        const supplierIndex = this.data.suppliers.findIndex(s => s.id === res.supplierId) || 0;
        
        this.setData({
          inRecord,
          productIndex,
          supplierIndex
        });
      })
      .catch(err => {
        console.error('获取入库记录详情失败:', err);
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
      [`inRecord.productId`]: productId
    });
  },

  // 供应商选择变化
  onSupplierChange(e) {
    const supplierIndex = e.detail.value;
    const supplierId = this.data.suppliers[supplierIndex]?.id;
    this.setData({
      supplierIndex,
      [`inRecord.supplierId`]: supplierId
    });
  },

  // 输入框内容变化时更新数据
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`inRecord.${field}`]: value
    });
  },

  // 提交表单
  submitForm(e) {
    const { mode, id, inRecord } = this.data;
    
    // 表单验证
    if (!inRecord.productId) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }
    
    if (!inRecord.quantity || parseInt(inRecord.quantity) <= 0) {
      wx.showToast({
        title: '请输入有效的入库数量',
        icon: 'none'
      });
      return;
    }
    
    if (!inRecord.supplierId) {
      wx.showToast({
        title: '请选择供应商',
        icon: 'none'
      });
      return;
    }
    
    if (!inRecord.operator.trim()) {
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
      ...inRecord,
      quantity: parseInt(inRecord.quantity)
    };
    
    if (mode === 'add') {
      // 添加入库记录
      requestPromise = app.requestApi('/in-records', 'POST', submitData);
    } else {
      // 更新入库记录
      requestPromise = app.requestApi(`/in-records/${id}`, 'PUT', submitData);
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
        console.error(`${mode === 'add' ? '添加' : '修改'}入库记录失败:`, err);
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