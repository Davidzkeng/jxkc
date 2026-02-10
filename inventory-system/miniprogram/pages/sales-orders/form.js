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
    submitLoading: false
  },

  onLoad() {
    this.loadData();
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
    const defaultUnit = units.find(u => u.isDefault) || units[0] || { id: null, unitName: '斤', price: product.price };
    
    // 添加商品到已选列表
    selectedProducts.push({
      ...product,
      units: units,
      selectedUnit: defaultUnit,
      quantity: 1,
      subtotal: defaultUnit.price * 1
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
    
    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      selectedUnit: selectedUnit,
      subtotal: (selectedUnit.price || 0) * (updatedProducts[index].quantity || 1)
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
    
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: quantity,
      subtotal: price * quantity
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
    
    const updatedProducts = [...selectedProducts];
    const newQuantity = (updatedProducts[index].quantity || 0) + 1;
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: newQuantity,
      subtotal: price * newQuantity
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
    
    const updatedProducts = [...selectedProducts];
    const newQuantity = Math.max((updatedProducts[index].quantity || 0) - 1, 1);
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: newQuantity,
      subtotal: price * newQuantity
    };
    
    this.setData({
      selectedProducts: updatedProducts
    });
    
    this.calculateTotalAmount();
  },

  increaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const selectedProducts = this.data.selectedProducts;
    
    // 创建新数组，避免直接修改原数组
    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: (updatedProducts[index].quantity || 0) + 0.5
    };
    
    this.setData({
      selectedProducts: updatedProducts
    });
    
    this.calculateTotalAmount();
  },

  decreaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const selectedProducts = this.data.selectedProducts;
    
    // 创建新数组，避免直接修改原数组
    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: Math.max((updatedProducts[index].quantity || 0) - 0.5, 0.5) // 确保数量不小于0.5斤
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
      const price = product.selectedUnit?.price || product.price || 0;
      totalAmount += price * (product.quantity || 0);
    });
    
    this.setData({
      totalAmount: totalAmount.toFixed(2)
    });
  },

  onPriceChange(e) {
    // 价格修改功能保留，但会覆盖单位的单价
    const index = e.currentTarget.dataset.index;
    const price = parseFloat(e.detail.value) || 0;
    const selectedProducts = this.data.selectedProducts;
    
    const updatedProducts = [...selectedProducts];
    const product = updatedProducts[index];
    
    updatedProducts[index] = {
      ...updatedProducts[index],
      selectedUnit: {
        ...updatedProducts[index].selectedUnit,
        price: price
      },
      subtotal: price * (product.quantity || 1)
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

  submit() {
    if (!this.data.selectedCustomer) {
      util.showError('请选择客户');
      return;
    }

    if (this.data.selectedProducts.length === 0) {
      util.showError('请选择商品');
      return;
    }

    // 计算总金额
    const calculatedTotalAmount = this.data.selectedProducts.reduce((sum, product) => {
      const price = product.selectedUnit?.price || product.price || 0;
      return sum + price * (product.quantity || 0);
    }, 0);

    const data = {
      customerId: this.data.selectedCustomer.id,
      products: this.data.selectedProducts.map(p => ({
        productId: p.id,
        productUnitId: p.selectedUnit?.id || null,
        quantity: p.quantity,
        price: p.selectedUnit?.price || p.price || 0,
        totalAmount: (p.selectedUnit?.price || p.price || 0) * p.quantity
      })),
      totalAmount: calculatedTotalAmount,
      remark: this.data.remark
    };

    this.setData({ submitLoading: true });

    api.createSalesOrder(data)
      .then(() => {
        util.showSuccess('销售单创建成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('创建销售单失败', err);
        util.showError(err.data?.error || '创建失败');
        this.setData({ submitLoading: false });
      });
  }
});