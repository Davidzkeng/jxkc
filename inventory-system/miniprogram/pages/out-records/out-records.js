const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    outRecords: [],
    loading: true
  },

  onLoad() {
    this.loadOutRecords();
  },

  onShow() {
    this.loadOutRecords();
  },

  loadOutRecords() {
    this.setData({ loading: true });
    api.getOutRecords()
      .then(res => {
        const records = Array.isArray(res) ? res.map(record => ({
          ...record,
          formattedDate: util.formatDate(record.date)
        })) : [];
        this.setData({
          outRecords: records,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载出库记录失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/out-records/form'
    });
  },

  deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    util.showConfirm('确定要删除该出库记录吗？', () => {
      api.deleteOutRecord(id)
        .then(() => {
          util.showSuccess('删除成功');
          this.loadOutRecords();
        })
        .catch(err => {
          console.error('删除出库记录失败', err);
          util.showError('删除失败');
        });
    });
  }
});
