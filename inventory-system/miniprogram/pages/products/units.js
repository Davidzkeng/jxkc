const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    productId: null,
    productName: '',
    units: [],
    showAddForm: false,
    unitName: '',
    specification: '',
    conversionRate: '1',
    unitPrice: '',
    isDefault: false,
    loading: false,
    submitLoading: false
  },

  onLoad(options) {
    if (options.productId) {
      this.setData({
        productId: options.productId,
        productName: options.productName || ''
      });
      this.loadUnits();
    }
  },

  loadUnits() {
    this.setData({ loading: true });
    api.getProductUnits(this.data.productId)
      .then(res => {
        const units = Array.isArray(res) ? res : [];
        // 如果没有默认单位，自动设置第一个为默认
        if (units.length > 0 && !units.find(u => u.isDefault)) {
          units[0].isDefault = true;
        }
        this.setData({
          units: units,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载商品单位失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  toggleAddForm() {
    this.setData({
      showAddForm: !this.data.showAddForm,
      unitName: '',
      specification: '',
      conversionRate: '1',
      unitPrice: '',
      isDefault: this.data.units.length === 0
    });
  },

  onSpecificationChange(e) {
    this.setData({ specification: e.detail.value });
  },

  onUnitNameChange(e) {
    this.setData({ unitName: e.detail.value });
  },

  onConversionRateChange(e) {
    this.setData({ conversionRate: e.detail.value });
  },

  onUnitPriceChange(e) {
    this.setData({ unitPrice: e.detail.value });
  },

  onIsDefaultChange(e) {
    this.setData({ isDefault: e.detail.value });
  },

  submitUnit() {
    if (!this.data.unitName.trim()) {
      util.showError('请输入单位名称');
      return;
    }

    const conversionRate = parseFloat(this.data.conversionRate);
    if (isNaN(conversionRate) || conversionRate <= 0) {
      util.showError('请输入有效的转换系数');
      return;
    }

    const unitPrice = parseFloat(this.data.unitPrice);
    if (isNaN(unitPrice) || unitPrice < 0) {
      util.showError('请输入有效的单价');
      return;
    }

    const data = {
      productId: this.data.productId,
      unitName: this.data.unitName,
      specification: this.data.specification,
      conversionRate: conversionRate,
      price: unitPrice,
      isDefault: this.data.isDefault
    };

    this.setData({ submitLoading: true });
    api.createProductUnit(data)
      .then(() => {
        util.showSuccess('添加成功');
        this.setData({ showAddForm: false });
        this.loadUnits();
      })
      .catch(err => {
        console.error('添加商品单位失败', err);
        util.showError(err.data?.error || '添加失败');
        this.setData({ submitLoading: false });
      });
  },

  setDefault(e) {
    const unitId = e.currentTarget.dataset.id;
    const unit = this.data.units.find(u => u.id === unitId);
    if (unit && !unit.isDefault) {
      api.updateProductUnit(unitId, { isDefault: true })
        .then(() => {
          this.loadUnits();
        })
        .catch(err => {
          console.error('设置默认单位失败', err);
          util.showError('设置失败');
        });
    }
  },

  deleteUnit(e) {
    const unitId = e.currentTarget.dataset.id;
    const unit = this.data.units.find(u => u.id === unitId);
    if (!unit) return;

    util.showConfirm(`确定删除单位"${unit.unitName}"吗？`, () => {
      api.deleteProductUnit(unitId)
        .then(() => {
          util.showSuccess('删除成功');
          this.loadUnits();
        })
        .catch(err => {
          console.error('删除商品单位失败', err);
          util.showError(err.data?.error || '删除失败');
        });
    });
  }
});
