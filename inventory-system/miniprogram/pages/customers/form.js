const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    id: null,
    name: '',
    contact: '',
    phone: '',
    address: '',
    loading: false,
    submitLoading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadCustomerDetail(options.id);
    }
  },

  loadCustomerDetail(id) {
    this.setData({ loading: true });
    api.getCustomerById(id)
      .then(res => {
        const customer = res;
        this.setData({
          name: customer.name,
          contact: customer.contact,
          phone: customer.phone,
          address: customer.address,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载客户详情失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  onNameChange(e) {
    this.setData({ name: e.detail.value });
  },

  onContactChange(e) {
    this.setData({ contact: e.detail.value });
  },

  onPhoneChange(e) {
    this.setData({ phone: e.detail.value });
  },

  onAddressChange(e) {
    this.setData({ address: e.detail.value });
  },

  submit() {
    if (!this.data.name.trim()) {
      util.showError('请输入客户名称');
      return;
    }

    if (!this.data.contact.trim()) {
      util.showError('请输入联系人');
      return;
    }

    if (!this.data.phone.trim()) {
      util.showError('请输入电话');
      return;
    }

    const data = {
      name: this.data.name,
      contact: this.data.contact,
      phone: this.data.phone,
      address: this.data.address
    };

    this.setData({ submitLoading: true });

    const request = this.data.id
      ? api.updateCustomer(this.data.id, data)
      : api.createCustomer(data);

    request
      .then(() => {
        util.showSuccess('保存成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('保存客户失败', err);
        util.showError('保存失败');
        this.setData({ submitLoading: false });
      });
  }
});
