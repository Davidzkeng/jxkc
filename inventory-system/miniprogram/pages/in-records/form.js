const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    // 原始数据
    products: [],
    
    // 选中的数据
    selectedProduct: null,
    
    // 搜索相关
    productSearchKey: '',
    filteredProducts: [],
    showProductList: false,
    
    // 表单数据
    quantity: '',
    loading: false,
    submitLoading: false
  },

  onLoad(options) {
    this.loadData(options);
  },

  loadData(options) {
    this.setData({ loading: true });
    api.getProducts()
      .then((productsRes) => {
        const products = Array.isArray(productsRes) ? productsRes : [];
        
        let selectedProduct = null;
        
        // 如果有扫码传递的商品ID，自动选择该商品
        if (options && options.productId) {
          const productId = parseInt(options.productId);
          selectedProduct = products.find(p => p.id === productId);
        }
        
        this.setData({
          products: products,
          filteredProducts: products,
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
      showProductList: !this.data.showProductList
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

  onQuantityChange(e) {
    const quantity = e.detail.value;
    this.setData({
      quantity: quantity
    });
  },

  submit() {
    console.log('提交数据', this.data);

    if (!this.data.selectedProduct) {
      util.showError('请选择商品');
      return;
    }

    // 检查商品是否有供应商
    if (!this.data.selectedProduct.supplierId && !this.data.selectedProduct.supplier) {
      util.showError('该商品未设置供应商，请先编辑商品设置供应商');
      return;
    }

    if (!this.data.quantity) {
      util.showError('请输入入库数量(斤)');
      return;
    }

    const quantity = parseFloat(this.data.quantity);
    const supplierId = this.data.selectedProduct.supplierId || this.data.selectedProduct.supplier.id;

    const data = {
      productId: this.data.selectedProduct.id,
      supplierId: supplierId,
      quantity: quantity
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
