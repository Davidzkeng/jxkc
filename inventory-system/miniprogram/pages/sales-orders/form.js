const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    // 原始数据
    products: [],
    customers: [],

    // 选中的数据
    selectedCustomer: null,
    selectedProducts: [],

    // 搜索相关
    productSearchKey: '',
    customerSearchKey: '',
    filteredProducts: [],
    filteredCustomers: [],
    showProductList: false,
    showCustomerList: false,

    // 表单数据
    remark: '',
    totalAmount: '0.00',
    loading: false,
    submitLoading: false,

    // 编辑模式
    isEditMode: false,
    editOrderId: null
  },

  onLoad(options) {
    this.loadData();

    // 如果是编辑模式，加载销售单数据
    if (options.id && options.mode === 'edit') {
      this.setData({
        isEditMode: true,
        editOrderId: parseInt(options.id)
      });
      this.loadOrderData(parseInt(options.id));
    }
  },

  // 加载销售单数据（编辑模式）
  loadOrderData(orderId) {
    this.setData({ loading: true });
    Promise.all([api.getSalesOrderById(orderId), api.getProducts()])
      .then(([res, productsRes]) => {
        if (res.status !== '草稿') {
          util.showError('只有草稿状态可以编辑');
          wx.navigateBack();
          return;
        }

        const products = Array.isArray(productsRes) ? productsRes : [];

        // 设置客户
        const customer = this.data.customers.find(c => c.name === res.customerName);

        // 设置商品 - 从商品列表中获取完整信息
        const selectedProducts = res.products.map(p => {
          // 从商品列表中找到对应的商品
          const product = products.find(prod => prod.id === p.id) || {};
          const units = product.productUnits || [];

          // 获取默认单位价格（价格始终显示默认单位的价格）
          const defaultUnit = units.find(u => u.isDefault) || units[0];
          const defaultPrice = parseFloat(defaultUnit?.price || product.price || 0);

          // 找到当前选中的单位及其转换系数
          const currentUnit = units.find(u => u.id === p.productUnitId);
          const currentConversionRate = parseFloat(currentUnit?.conversionRate || 1);

          // 小计 = 默认单位价格 × 数量 × 转换系数
          const subtotal = defaultPrice * p.quantity * currentConversionRate;

          return {
            id: p.id,
            name: p.name,
            code: p.code,
            price: p.price,
            quantity: p.quantity,
            units: units,
            selectedUnit: {
              id: p.productUnitId,
              unitName: p.unitName,
              price: parseFloat(defaultPrice.toFixed(2)),
              conversionRate: currentConversionRate
            },
            productUnits: units,
            stock: product.stock || 0,
            subtotal: parseFloat(subtotal.toFixed(2))
          };
        });

        this.setData({
          selectedCustomer: customer || { name: res.customerName },
          selectedProducts: selectedProducts,
          remark: res.remark || '',
          loading: false
        });

        this.calculateTotalAmount();
      })
      .catch(err => {
        console.error('加载销售单失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  loadData() {
    this.setData({ loading: true });
    Promise.all([api.getProducts(), api.getCustomers()])
      .then(([productsRes, customersRes]) => {
        const products = Array.isArray(productsRes) ? productsRes : [];
        const customers = Array.isArray(customersRes) ? customersRes : [];

        this.setData({
          products: products,
          customers: customers,
          filteredProducts: products,
          filteredCustomers: customers,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载数据失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  // 刷新商品列表
  refreshProducts() {
    this.setData({ productSearchKey: '' });
    this.loadData();
    util.showSuccess('刷新成功');
  },

  // 快速添加商品
  quickAddProduct() {
    wx.showModal({
      title: '快速添加商品',
      content: '是否跳转到商品管理页面添加新商品？',
      confirmText: '去添加',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/products/form'
          });
        }
      }
    });
  },

  // 客户搜索
  onCustomerSearchInput(e) {
    const searchKey = e.detail.value;
    this.setData({
      customerSearchKey: searchKey,
      showCustomerList: true,
      filteredCustomers: this.filterCustomers(searchKey)
    });
  },

  filterCustomers(searchKey) {
    if (!searchKey) {
      return this.data.customers;
    }
    return this.data.customers.filter(customer => 
      customer.name.toLowerCase().includes(searchKey.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchKey.toLowerCase()) ||
      customer.phone.includes(searchKey)
    );
  },

  toggleCustomerList() {
    this.setData({
      showCustomerList: !this.data.showCustomerList,
      showProductList: false
    });
  },

  selectCustomer(e) {
    const customer = e.currentTarget.dataset.customer;
    this.setData({
      selectedCustomer: customer,
      showCustomerList: false,
      customerSearchKey: ''
    });
  },

  clearSelectedCustomer() {
    this.setData({
      selectedCustomer: null
    });
  },

  // 商品搜索
  onProductSearchInput(e) {
    const searchKey = e.detail.value;
    this.setData({
      productSearchKey: searchKey,
      showProductList: true,
      filteredProducts: this.filterProducts(searchKey)
    });
  },

  filterProducts(searchKey) {
    if (!searchKey) {
      return this.data.products;
    }
    return this.data.products.filter(product => 
      product.name.toLowerCase().includes(searchKey.toLowerCase()) ||
      product.code.toLowerCase().includes(searchKey.toLowerCase())
    );
  },

  toggleProductList() {
    this.setData({
      showProductList: !this.data.showProductList,
      showCustomerList: false
    });
  },

  selectProduct(e) {
    const product = e.currentTarget.dataset.product;
    const selectedProducts = this.data.selectedProducts;

    // 检查商品是否已经选中
    const existingIndex = selectedProducts.findIndex(p => p.id === product.id);
    if (existingIndex !== -1) {
      util.showError('该商品已添加');
      return;
    }

    // 获取商品的单位列表，如果没有单位则使用默认
    const units = product.productUnits || [];
    const defaultUnit = units.find(u => u.isDefault) || units[0];

    // 获取默认单位价格（价格始终显示默认单位的价格）
    const defaultPrice = parseFloat(defaultUnit?.price || product.price || 0);
    const defaultConversionRate = parseFloat(defaultUnit?.conversionRate || 1);

    // 如果没有单位，创建一个默认单位
    const selectedUnit = defaultUnit || { id: null, unitName: '斤', price: defaultPrice, conversionRate: 1 };

    // 小计 = 默认单位价格 × 数量 × 转换系数（默认单位转换系数为1）
    const subtotal = defaultPrice * 1 * defaultConversionRate;

    // 添加商品到已选列表
    selectedProducts.push({
      ...product,
      units: units,
      selectedUnit: {
        ...selectedUnit,
        price: parseFloat(defaultPrice.toFixed(2)),
        conversionRate: defaultConversionRate
      },
      quantity: 1,
      subtotal: parseFloat(subtotal.toFixed(2))
    });

    this.setData({
      selectedProducts: selectedProducts,
      showProductList: false,
      productSearchKey: ''
    });

    this.calculateTotalAmount();
  },

  // 选择商品单位
  onUnitChange(e) {
    const index = e.currentTarget.dataset.index;
    const unitIndex = parseInt(e.detail.value);
    const selectedProducts = this.data.selectedProducts;
    const product = selectedProducts[index];
    const units = product.units || [];
    const selectedUnit = units[unitIndex];

    // 获取默认单位的价格（价格始终显示默认单位的价格）
    const defaultUnit = units.find(u => u.isDefault) || units[0];
    const defaultPrice = parseFloat(defaultUnit?.price || product.price || 0);

    // 获取当前单位的转换系数，用于计算小计
    const selectedConversionRate = parseFloat(selectedUnit?.conversionRate || 1);

    // 小计 = 默认单位价格 × 数量 × 转换系数
    const quantity = product.quantity || 1;
    const subtotal = defaultPrice * quantity * selectedConversionRate;

    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      selectedUnit: {
        ...selectedUnit,
        price: parseFloat(defaultPrice.toFixed(2)),
        conversionRate: selectedConversionRate
      },
      subtotal: parseFloat(subtotal.toFixed(2))
    };

    this.setData({
      selectedProducts: updatedProducts
    });

    this.calculateTotalAmount();
  },

  onQuantityChange(e) {
    const index = e.currentTarget.dataset.index;
    const quantity = parseFloat(e.detail.value) || 0;
    const selectedProducts = this.data.selectedProducts;

    const updatedProducts = [...selectedProducts];
    const product = updatedProducts[index];
    const price = product.selectedUnit?.price || product.price || 0;
    const conversionRate = product.selectedUnit?.conversionRate || 1;

    // 小计 = 默认单位价格 × 数量 × 转换系数
    const subtotal = price * quantity * conversionRate;

    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: quantity,
      subtotal: parseFloat(subtotal.toFixed(2))
    };

    this.setData({
      selectedProducts: updatedProducts
    });

    this.calculateTotalAmount();
  },

  increaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const selectedProducts = this.data.selectedProducts;
    const product = selectedProducts[index];
    const price = product.selectedUnit?.price || product.price || 0;
    const conversionRate = product.selectedUnit?.conversionRate || 1;

    const updatedProducts = [...selectedProducts];
    const newQuantity = parseFloat(((updatedProducts[index].quantity || 0) + 0.5).toFixed(1));
    const subtotal = price * newQuantity * conversionRate;

    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: newQuantity,
      subtotal: parseFloat(subtotal.toFixed(2))
    };

    this.setData({
      selectedProducts: updatedProducts
    });

    this.calculateTotalAmount();
  },

  decreaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const selectedProducts = this.data.selectedProducts;
    const product = selectedProducts[index];
    const price = product.selectedUnit?.price || product.price || 0;
    const conversionRate = product.selectedUnit?.conversionRate || 1;

    const updatedProducts = [...selectedProducts];
    const currentQty = updatedProducts[index].quantity || 0;
    const newQuantity = parseFloat(Math.max(currentQty - 0.5, 0.1).toFixed(1));
    const subtotal = price * newQuantity * conversionRate;

    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: newQuantity,
      subtotal: parseFloat(subtotal.toFixed(2))
    };

    this.setData({
      selectedProducts: updatedProducts
    });

    this.calculateTotalAmount();
  },

  removeProduct(e) {
    const index = e.currentTarget.dataset.index;
    const selectedProducts = this.data.selectedProducts;
    
    selectedProducts.splice(index, 1);
    
    this.setData({
      selectedProducts: selectedProducts
    });
    
    this.calculateTotalAmount();
  },

  calculateTotalAmount() {
    const selectedProducts = this.data.selectedProducts;
    let totalAmount = 0;

    selectedProducts.forEach(product => {
      // 使用已计算好的小计
      totalAmount += product.subtotal || 0;
    });

    this.setData({
      totalAmount: parseFloat(totalAmount.toFixed(2))
    });
  },

  onPriceInput(e) {
    // 价格输入时只更新显示值，不进行计算
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const selectedProducts = this.data.selectedProducts;

    const updatedProducts = [...selectedProducts];
    // 使用特殊标记 '__EMPTY__' 表示用户主动清空，区别于初始的 null/undefined
    updatedProducts[index] = {
      ...updatedProducts[index],
      inputPrice: value === '' ? '__EMPTY__' : value
    };

    this.setData({
      selectedProducts: updatedProducts
    });
  },

  onPriceBlur(e) {
    // 失去焦点时进行计算
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const selectedProducts = this.data.selectedProducts;

    const updatedProducts = [...selectedProducts];
    const product = updatedProducts[index];
    const conversionRate = product.selectedUnit?.conversionRate || 1;

    // 如果输入为空，保持为空，不自动填充默认价格
    let price;
    let inputPrice = null;
    if (value === '' || value === null || value === undefined) {
      price = 0;
      inputPrice = '__EMPTY__'; // 保持特殊标记，这样输入框显示为空
    } else {
      price = parseFloat(value) || 0;
    }

    // 小计 = 默认单位价格 × 数量 × 转换系数
    const subtotal = price * (product.quantity || 1) * conversionRate;

    updatedProducts[index] = {
      ...updatedProducts[index],
      selectedUnit: {
        ...updatedProducts[index].selectedUnit,
        price: parseFloat(price.toFixed(2))
      },
      inputPrice: inputPrice, // 如果是空输入，保持特殊标记
      subtotal: parseFloat(subtotal.toFixed(2))
    };

    this.setData({
      selectedProducts: updatedProducts
    });

    this.calculateTotalAmount();
  },

  onRemarkChange(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 保存草稿
  saveDraft() {
    if (!this.data.selectedCustomer) {
      util.showError('请选择客户');
      return;
    }

    if (this.data.selectedProducts.length === 0) {
      util.showError('请选择商品');
      return;
    }

    // 使用已计算好的小计
    const calculatedTotalAmount = this.data.selectedProducts.reduce((sum, product) => {
      return sum + (product.subtotal || 0);
    }, 0);

    const data = {
      customerId: this.data.selectedCustomer.id,
      products: this.data.selectedProducts.map(p => ({
        productId: p.id,
        productUnitId: p.selectedUnit?.id || null,
        quantity: p.quantity,
        price: p.selectedUnit?.price || p.price || 0,
        totalAmount: p.subtotal || 0
      })),
      totalAmount: calculatedTotalAmount,
      remark: this.data.remark,
      status: '草稿'
    };

    this.setData({ submitLoading: true });

    // 根据模式选择创建或更新
    const apiCall = this.data.isEditMode
      ? api.updateSalesOrder(this.data.editOrderId, data)
      : api.createSalesOrder(data);

    apiCall
      .then(() => {
        util.showSuccess(this.data.isEditMode ? '草稿更新成功' : '草稿保存成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('保存草稿失败', err);
        util.showError(err.data?.error || '保存失败');
        this.setData({ submitLoading: false });
      });
  },

  submit() {
    if (!this.data.selectedCustomer) {
      util.showError('请选择客户');
      return;
    }

    if (this.data.selectedProducts.length === 0) {
      util.showError('请选择商品');
      return;
    }

    // 使用已计算好的小计
    const calculatedTotalAmount = this.data.selectedProducts.reduce((sum, product) => {
      return sum + (product.subtotal || 0);
    }, 0);

    const data = {
      customerId: this.data.selectedCustomer.id,
      products: this.data.selectedProducts.map(p => ({
        productId: p.id,
        productUnitId: p.selectedUnit?.id || null,
        quantity: p.quantity,
        price: p.selectedUnit?.price || p.price || 0,
        totalAmount: p.subtotal || 0
      })),
      totalAmount: calculatedTotalAmount,
      remark: this.data.remark,
      status: '已完成'
    };

    this.setData({ submitLoading: true });

    // 根据模式选择创建或更新
    const apiCall = this.data.isEditMode
      ? api.updateSalesOrder(this.data.editOrderId, data)
      : api.createSalesOrder(data);

    apiCall
      .then((res) => {
        util.showSuccess(this.data.isEditMode ? '销售单更新成功' : '销售单创建成功');
        // 获取销售单ID（创建模式返回新ID，编辑模式使用原ID）
        const orderId = this.data.isEditMode ? this.data.editOrderId : (res.id || res.data?.id);
        setTimeout(() => {
          // 跳转到打印预览页面
          wx.redirectTo({
            url: `/pages/sales-orders/print?id=${orderId}`
          });
        }, 800);
      })
      .catch(err => {
        console.error('创建销售单失败', err);
        util.showError(err.data?.error || '创建失败');
        this.setData({ submitLoading: false });
      });
  }
});