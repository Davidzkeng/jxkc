const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    productId: -1,
    supplierId: -1,
    quantity: '',
    price: '',
    totalAmount: '',
    products: [],
    suppliers: [],
    loading: false,
    submitLoading: false
  },

  onLoad() {
    this.loadData();
  },

  loadData() {
    this.setData({ loading: true });
    Promise.all([api.getProducts(), api.getSuppliers()])
      .then(([productsRes, suppliersRes]) => {
        this.setData({
          products: Array.isArray(productsRes) ? productsRes : [],
          suppliers: Array.isArray(suppliersRes) ? suppliersRes : [],
          loading: false
        });
      })
      .catch(err => {
        console.error('加载数据失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  onProductChange(e) {
    this.setData({ productId: e.detail.value });
  },

  onSupplierChange(e) {
    this.setData({ supplierId: e.detail.value });
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

    if (this.data.productId === -1) {
      util.showError('请选择商品');
      return;
    }

    if (this.data.supplierId === -1) {
      util.showError('请选择供应商');
      return;
    }

    if (!this.data.quantity) {
      util.showError('请输入数量');
      return;
    }

    if (!this.data.price) {
      util.showError('请输入单价');
      return;
    }

    const quantity = parseInt(this.data.quantity);
    const price = parseFloat(this.data.price);
    const totalAmount = quantity * price;

    const data = {
      productId: parseInt(this.data.productId),
      supplierId: parseInt(this.data.supplierId),
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
