const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    salesOrders: [],
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
    loading: false,
    loadingMore: false
  },

  onShow() {
    this.refreshList();
  },

  // 重置到第一页并加载
  refreshList() {
    this.setData({
      page: 1,
      salesOrders: [],
      total: 0,
      hasMore: true
    });
    return this.loadPage(1);
  },

  // 加载指定页
  loadPage(p) {
    const isFirstPage = p === 1;
    this.setData({
      loading: isFirstPage,
      loadingMore: !isFirstPage
    });

    return api.getSalesOrders({ page: p, pageSize: this.data.pageSize })
      .then(res => {
        const list = Array.isArray(res.list) ? res.list : [];
        const total = typeof res.total === 'number' ? res.total : 0;
        const salesOrders = isFirstPage ? list : this.data.salesOrders.concat(list);

        this.setData({
          salesOrders,
          page: p,
          total,
          hasMore: salesOrders.length < total
        });
      })
      .catch(err => {
        console.error('加载销售单列表失败', err);
        util.showError('加载失败');
      })
      .then(() => {
        this.setData({ loading: false, loadingMore: false });
      });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading && !this.data.loadingMore) {
      this.loadPage(this.data.page + 1);
    }
  },

  onPullDownRefresh() {
    this.refreshList().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/sales-orders/detail?id=${id}`
    });
  },

  createOrder() {
    wx.navigateTo({
      url: '/pages/sales-orders/form'
    });
  }
});
