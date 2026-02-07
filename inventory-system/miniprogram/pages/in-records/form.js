const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    // 原始数据
    products: [],
    suppliers: [],
    
    // 选中的数据
    selectedProduct: null,
    selectedSupplier: null,
    
    // 搜索相关
    productSearchKey: '',
    supplierSearchKey: '',
    filteredProducts: [],
    filteredSuppliers: [],
    showProductList: false,
    showSupplierList: false,
    
    // 表单数据
    quantity: '',
    price: '',
    totalAmount: '',
    loading: false,
    submitLoading: false
  },

  onLoad(options) {
    this.loadData(options);
  },

  loadData(options) {
    this.setData({ loading: true });
    Promise.all([api.getProducts(), api.getSuppliers()])
      .then(([productsRes, suppliersRes]) => {
        const products = Array.isArray(productsRes) ? productsRes : [];
        const suppliers = Array.isArray(suppliersRes) ? suppliersRes : [];
        
        let selectedProduct = null;
        
        // 如果有扫码传递的商品ID，自动选择该商品
        if (options && options.productId) {
          const productId = parseInt(options.productId);
          selectedProduct = products.find(p => p.id === productId);
        }
        
        this.setData({
          products: products,
          suppliers: suppliers,
          filteredProducts: products,
          filteredSuppliers: suppliers,
          selectedProduct: selectedProduct,
          loading: false
        });
        
        if (selectedProduct) {
          // 自动填充商品信息后，聚焦到入库数量输入框
          wx.nextTick(() => {
            const quantityInput = wx.createSelectorQuery().select('.form-input[type="number"]');
            quantityInput.fields({ size: true }, function(res) {
              console.log('数量输入框信息:', res);
            }).exec();
          });
        }
      })
      .catch(err => {
        console.error('加载数据失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
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
      showSupplierList: false
    });
  },

  selectProduct(e) {
    const product = e.currentTarget.dataset.product;
    this.setData({
      selectedProduct: product,
      showProductList: false,
      productSearchKey: ''
    });
  },

  clearSelectedProduct() {
    this.setData({
      selectedProduct: null
    });
  },

  // 供应商搜索
  onSupplierSearchInput(e) {
    const searchKey = e.detail.value;
    this.setData({
      supplierSearchKey: searchKey,
      showSupplierList: true,
      filteredSuppliers: this.filterSuppliers(searchKey)
    });
  },

  filterSuppliers(searchKey) {
    if (!searchKey) {
      return this.data.suppliers;
    }
    return this.data.suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(searchKey.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchKey.toLowerCase()) ||
      supplier.phone.includes(searchKey)
    );
  },

  toggleSupplierList() {
    this.setData({
      showSupplierList: !this.data.showSupplierList,
      showProductList: false
    });
  },

  selectSupplier(e) {
    const supplier = e.currentTarget.dataset.supplier;
    this.setData({
      selectedSupplier: supplier,
      showSupplierList: false,
      supplierSearchKey: ''
    });
  },

  clearSelectedSupplier() {
    this.setData({
      selectedSupplier: null
    });
  },

  onQuantityChange(e) {
    const quantity = e.detail.value;
    const price = parseFloat(this.data.price);
    this.setData({
      quantity: quantity,
      totalAmount: price && quantity ? (price * parseFloat(quantity)).toFixed(2) : ''
    });
  },

  onPriceChange(e) {
    const price = e.detail.value;
    const quantity = parseFloat(this.data.quantity);
    this.setData({
      price: price,
      totalAmount: price && quantity ? (parseFloat(price) * quantity).toFixed(2) : ''
    });
  },

  submit() {
    console.log('提交数据', this.data);

    if (!this.data.selectedProduct) {
      util.showError('请选择商品');
      return;
    }

    if (!this.data.selectedSupplier) {
      util.showError('请选择供应商');
      return;
    }

    if (!this.data.quantity) {
      util.showError('请输入入库数量(斤)');
      return;
    }

    if (!this.data.price) {
      util.showError('请输入单价');
      return;
    }

    const quantity = parseFloat(this.data.quantity);
    const price = parseFloat(this.data.price);
    const totalAmount = quantity * price;

    const data = {
      productId: this.data.selectedProduct.id,
      supplierId: this.data.selectedSupplier.id,
      quantity: quantity,
      price: price,
      totalAmount: totalAmount
    };

    console.log('发送的数据:', data);

    this.setData({ submitLoading: true });

    api.createInRecord(data)
      .then(() => {
        util.showSuccess('入库成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('创建入库记录失败', err);
        util.showError('创建失败');
        this.setData({ submitLoading: false });
      });
  }
});
