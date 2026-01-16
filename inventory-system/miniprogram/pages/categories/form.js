const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    id: null,
    name: '',
    description: '',
    loading: false,
    submitLoading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadCategoryDetail(options.id);
    }
  },

  loadCategoryDetail(id) {
    this.setData({ loading: true });
    api.getCategoryById(id)
      .then(res => {
        const category = res;
        this.setData({
          name: category.name,
          description: category.description,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载类别详情失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  onNameChange(e) {
    this.setData({ name: e.detail.value });
  },

  onDescriptionChange(e) {
    this.setData({ description: e.detail.value });
  },

  submit() {
    if (!this.data.name.trim()) {
      util.showError('请输入类别名称');
      return;
    }

    const data = {
      name: this.data.name,
      description: this.data.description
    };

    this.setData({ submitLoading: true });

    const request = this.data.id
      ? api.updateCategory(this.data.id, data)
      : api.createCategory(data);

    request
      .then(() => {
        util.showSuccess('保存成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('保存类别失败', err);
        util.showError('保存失败');
        this.setData({ submitLoading: false });
      });
  }
});
