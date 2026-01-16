const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    stats: {
      totalProducts: 0,
      totalStock: 0,
      lowStockCount: 0,
      todayIn: 0,
      todayOut: 0
    },
    recentProducts: [],
    loading: true
  },

  onLoad() {
    this.loadStats();
    this.loadRecentProducts();
  },

  onShow() {
    this.onLoad();
  },

  loadStats() {
    api.getStockStats()
      .then(res => {
        this.setData({
          stats: res || this.data.stats
        });
      })
      .catch(err => {
        console.error('加载统计失败', err);
      });
  },

  loadRecentProducts() {
    api.getProducts()
      .then(res => {
        const products = Array.isArray(res) ? res : [];
        this.setData({
          recentProducts: products.slice(0, 5),
          loading: false
        });
      })
      .catch(err => {
        console.error('加载商品列表失败', err);
        this.setData({ loading: false });
      });
  },

  navigateToProducts() {
    wx.switchTab({
      url: '/pages/products/products'
    });
  },

  navigateToProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/products/detail?id=${id}`
    });
  },

  navigateToCustomers() {
    wx.switchTab({
      url: '/pages/customers/customers'
    });
  },

  navigateToSuppliers() {
    wx.navigateTo({
      url: '/pages/suppliers/suppliers'
    });
  },

  navigateToCategories() {
    wx.navigateTo({
      url: '/pages/categories/categories'
    });
  },

  navigateToSalesOrders() {
    wx.navigateTo({
      url: '/pages/sales-orders/sales-orders'
    });
  },

  // 扫码入库功能
  scanCode() {
    wx.scanCode({
      success: (res) => {
        const productCode = res.result;
        console.log('扫码结果:', productCode);
        
        // 根据商品编码查找商品信息
        this.getProductByCode(productCode);
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        util.showError('扫码失败，请重试');
      }
    });
  },

  // 根据商品编码查找商品
  getProductByCode(code, isOutbound = false) {
    wx.showLoading({
      title: '查找商品...',
    });
    
    // 调用API获取所有商品，然后根据编码筛选
    api.getProducts()
      .then(res => {
        wx.hideLoading();
        
        const products = Array.isArray(res) ? res : [];
        const product = products.find(p => p.code === code);
        
        if (product) {
          // 商品存在，跳转到对应的表单页面，并传递商品信息
          const url = isOutbound 
            ? `/pages/out-records/form?productId=${product.id}&productName=${product.name}&productCode=${product.code}`
            : `/pages/in-records/form?productId=${product.id}&productName=${product.name}&productCode=${product.code}`;
          
          wx.navigateTo({
            url: url
          });
        } else {
          util.showError('未找到该商品');
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('查找商品失败:', err);
        util.showError('查找商品失败');
      });
  },

  // 扫码出库功能
  scanCodeOut() {
    wx.scanCode({
      success: (res) => {
        const productCode = res.result;
        console.log('扫码出库结果:', productCode);
        
        // 根据商品编码查找商品信息，并跳转到出库表单
        this.getProductByCode(productCode, true);
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        util.showError('扫码失败，请重试');
      }
    });
  }
});
