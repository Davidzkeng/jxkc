// API请求封装
const app = getApp();

// 基础请求函数
function request(options) {
  const { url, method, data, needLoading = true } = options;

  const fullUrl = app.globalData.baseUrl + url;
  console.log('API请求:', {
    url: fullUrl,
    method: method || 'GET',
    data: data
  });

  if (needLoading) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method: method || 'GET',
      data: data || {},
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        if (needLoading) {
          wx.hideLoading();
        }

        console.log('API响应:', {
          url: fullUrl,
          statusCode: res.statusCode,
          data: res.data
        });

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          console.error('API请求失败:', res);
          const errorMsg = res.data?.error || `请求失败: ${res.statusCode}`;
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          });
          reject(res);
        }
      },
      fail(err) {
        if (needLoading) {
          wx.hideLoading();
        }
        console.error('API网络错误:', {
          url: fullUrl,
          error: err
        });
        wx.showToast({
          title: '网络错误，请检查后端服务',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

// 导出API方法
module.exports = {
  // 商品相关API
  getProducts: (params) => request({ url: '/products', method: 'GET', data: params }),
  getProductById: (id) => request({ url: `/products/${id}`, method: 'GET' }),
  createProduct: (data) => request({ url: '/products', method: 'POST', data }),
  updateProduct: (id, data) => request({ url: `/products/${id}`, method: 'PUT', data }),
  deleteProduct: (id) => request({ url: `/products/${id}`, method: 'DELETE' }),
  getStockStats: () => request({ url: '/products/stats/stock', method: 'GET' }),

  // 商品单位相关API
  getProductUnits: (productId) => request({ url: `/products/${productId}/units`, method: 'GET' }),
  createProductUnit: (data) => request({ url: '/product-units', method: 'POST', data }),
  updateProductUnit: (id, data) => request({ url: `/product-units/${id}`, method: 'PUT', data }),
  deleteProductUnit: (id) => request({ url: `/product-units/${id}`, method: 'DELETE' }),

  // 类别相关API
  getCategories: () => request({ url: '/categories', method: 'GET' }),
  getCategoryById: (id) => request({ url: `/categories/${id}`, method: 'GET' }),
  createCategory: (data) => request({ url: '/categories', method: 'POST', data }),
  updateCategory: (id, data) => request({ url: `/categories/${id}`, method: 'PUT', data }),
  deleteCategory: (id) => request({ url: `/categories/${id}`, method: 'DELETE' }),

  // 客户相关API
  getCustomers: () => request({ url: '/customers', method: 'GET' }),
  getCustomerById: (id) => request({ url: `/customers/${id}`, method: 'GET' }),
  createCustomer: (data) => request({ url: '/customers', method: 'POST', data }),
  updateCustomer: (id, data) => request({ url: `/customers/${id}`, method: 'PUT', data }),
  deleteCustomer: (id) => request({ url: `/customers/${id}`, method: 'DELETE' }),

  // 供应商相关API
  getSuppliers: () => request({ url: '/suppliers', method: 'GET' }),
  getSupplierById: (id) => request({ url: `/suppliers/${id}`, method: 'GET' }),
  createSupplier: (data) => request({ url: '/suppliers', method: 'POST', data }),
  updateSupplier: (id, data) => request({ url: `/suppliers/${id}`, method: 'PUT', data }),
  deleteSupplier: (id) => request({ url: `/suppliers/${id}`, method: 'DELETE' }),

  // 入库记录相关API
  getInRecords: () => request({ url: '/in-records', method: 'GET' }),
  getInRecordById: (id) => request({ url: `/in-records/${id}`, method: 'GET' }),
  createInRecord: (data) => request({ url: '/in-records', method: 'POST', data }),
  updateInRecord: (id, data) => request({ url: `/in-records/${id}`, method: 'PUT', data }),
  deleteInRecord: (id) => request({ url: `/in-records/${id}`, method: 'DELETE' }),

  // 出库记录相关API
  getOutRecords: () => request({ url: '/out-records', method: 'GET' }),
  getOutRecordById: (id) => request({ url: `/out-records/${id}`, method: 'GET' }),
  createOutRecord: (data) => request({ url: '/out-records', method: 'POST', data }),
  updateOutRecord: (id, data) => request({ url: `/out-records/${id}`, method: 'PUT', data }),
  deleteOutRecord: (id) => request({ url: `/out-records/${id}`, method: 'DELETE' }),

  // 销售单相关API
  getSalesOrders: () => request({ url: '/sales-orders', method: 'GET' }),
  getSalesOrderById: (id) => request({ url: `/sales-orders/${id}`, method: 'GET' }),
  createSalesOrder: (data) => request({ url: '/sales-orders', method: 'POST', data }),
  updateSalesOrder: (id, data) => request({ url: `/sales-orders/${id}`, method: 'PUT', data }),
  voidSalesOrder: (id) => request({ url: `/sales-orders/${id}/void`, method: 'POST' }),
  deleteSalesOrder: (id) => request({ url: `/sales-orders/${id}`, method: 'DELETE' }),

  // 打印任务相关API
  createPrintJob: (data) => request({ url: '/print-jobs', method: 'POST', data }),
  getPendingPrintJobs: () => request({ url: '/print-jobs/pending', method: 'GET' }),
  getPrintJobById: (id) => request({ url: `/print-jobs/${id}`, method: 'GET' }),
  updatePrintJobStatus: (id, data) => request({ url: `/print-jobs/${id}/status`, method: 'PUT', data })
};
