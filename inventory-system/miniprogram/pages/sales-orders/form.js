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
    
    // 添加商品到已选列表
    selectedProducts.push({
      ...product,
      quantity: 1
    });
    
    this.setData({
      selectedProducts: selectedProducts,
      showProductList: false,
      productSearchKey: ''
    });
    
    this.calculateTotalAmount();
  },

  onQuantityChange(e) {
    const index = e.currentTarget.dataset.index;
    const quantity = parseInt(e.detail.value) || 0;
    const selectedProducts = this.data.selectedProducts;
    
    // 创建新数组，避免直接修改原数组
    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: quantity
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
      quantity: (updatedProducts[index].quantity || 0) + 1
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
      quantity: Math.max((updatedProducts[index].quantity || 0) - 1, 1) // 确保数量不小于1
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
      totalAmount += (product.price || 0) * (product.quantity || 0);
    });
    
    this.setData({
      totalAmount: totalAmount.toFixed(2)
    });
  },

  onPriceChange(e) {
    const index = e.currentTarget.dataset.index;
    const price = parseFloat(e.detail.value) || 0;
    const selectedProducts = this.data.selectedProducts;
    
    // 创建新数组，避免直接修改原数组
    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      price: price
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
    console.log('提交数据', this.data);

    if (!this.data.selectedCustomer) {
      util.showError('请选择客户');
      return;
    }

    if (this.data.selectedProducts.length === 0) {
      util.showError('请选择商品');
      return;
    }

    // 直接计算总金额，避免精度问题
    const calculatedTotalAmount = this.data.selectedProducts.reduce((sum, product) => {
      return sum + (product.price || 0) * (product.quantity || 0);
    }, 0);

    const data = {
      customerId: this.data.selectedCustomer.id,
      products: this.data.selectedProducts.map(p => ({
        productId: p.id,
        quantity: p.quantity,
        price: p.price,
        totalAmount: p.price * p.quantity
      })),
      totalAmount: calculatedTotalAmount,
      remark: this.data.remark
    };

    console.log('发送的数据:', data);

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
        util.showError('创建失败');
        this.setData({ submitLoading: false });
      });
  }
});