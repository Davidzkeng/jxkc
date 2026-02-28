const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    id: null,
    name: '',
    contact: '',
    phone: '',
    address: '',
    nameError: '',
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
    const name = e.detail.value;
    this.setData({ name, nameError: '' });
    
    if (name.trim()) {
      this.checkNameDebounced(name);
    }
  },

  onNameBlur() {
    if (this.data.name.trim()) {
      this.checkName(this.data.name);
    }
  },

  checkNameDebounced: (function() {
    let timer = null;
    return function(name) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        this.checkName(name);
      }, 500);
    };
  })(),

  checkName(name) {
    const params = { name };
    if (this.data.id) {
      params.excludeId = this.data.id;
    }
    
    api.checkCustomerName(params)
      .then(res => {
        if (res.exists) {
          this.setData({ nameError: '客户名称已存在' });
        } else {
          this.setData({ nameError: '' });
        }
      })
      .catch(err => {
        console.error('检查客户名称失败', err);
      });
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
    if (this.data.nameError) {
      util.showError('请先修正客户名称');
      return;
    }
    
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
        const errorMsg = err.data?.error || '保存失败';
        util.showError(errorMsg);
        this.setData({ submitLoading: false });
      });
  }
});
