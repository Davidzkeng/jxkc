const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    inRecords: [],
    loading: true
  },

  onLoad() {
    this.loadInRecords();
  },

  onShow() {
    this.loadInRecords();
  },

  loadInRecords() {
    this.setData({ loading: true });
    api.getInRecords()
      .then(res => {
        const records = Array.isArray(res) ? res.map(record => ({
          ...record,
          formattedDate: util.formatDate(record.date)
        })) : [];
        this.setData({
          inRecords: records,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载入库记录失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/in-records/form'
    });
  },

  deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    util.showConfirm('确定要删除该入库记录吗？', () => {
      api.deleteInRecord(id)
        .then(() => {
          util.showSuccess('删除成功');
          this.loadInRecords();
        })
        .catch(err => {
          console.error('删除入库记录失败', err);
          util.showError('删除失败');
        });
    });
  }
});
