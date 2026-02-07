const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    id: null,
    name: '',
    code: '',
    categoryId: -1,
    categoryIdValue: '',
    price: '',
    stock: '',
    description: '',
    categories: [],
    loading: false,
    submitLoading: false
  },

  // 生成商品编码
  generateProductCode() {
    // 规则：PROD + 年月日时分秒 + 3位随机数
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    return `PROD${year}${month}${day}${hour}${minute}${second}${random}`;
  },

  onLoad(options) {
    console.log('===== form.js onLoad 开始 =====');
    console.log('options:', options);
    console.log('this.data:', this.data);
    console.log('当前loading状态:', this.data.loading);

    if (options.id) {
      console.log('有id，加载商品详情');
      this.setData({ id: options.id });
      this.loadProductDetail(options.id);
    } else {
      console.log('新增模式，直接显示表单');
      // 新增商品时自动生成编码
      const generatedCode = this.generateProductCode();
      this.setData({ code: generatedCode });
    }
    console.log('加载类别列表');
    this.loadCategories();
  },

  loadProductDetail(id) {
    this.setData({ loading: true });
    api.getProductById(id)
      .then(res => {
        const product = res;
        this.setData({
          name: product.name,
          code: product.code,
          categoryIdValue: product.categoryId,
          price: product.price,
          stock: product.stock,
          description: product.description,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载商品详情失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  loadCategories() {
    console.log('===== loadCategories 开始 =====');
    console.log('调用api.getCategories()');
    api.getCategories()
      .then(res => {
        console.log('loadCategories 成功:', res);
        const categories = Array.isArray(res) ? res : [];
        let categoryIdIndex = 0;
        if (this.data.categoryIdValue) {
          const index = categories.findIndex(c => c.id === this.data.categoryIdValue);
          if (index !== -1) {
            categoryIdIndex = index;
          }
        } else if (categories.length > 0) {
          this.setData({ categoryIdValue: categories[0].id });
        }
        this.setData({
          categories: categories,
          categoryId: categoryIdIndex
        });
      })
      .catch(err => {
        console.error('加载类别列表失败', err);
        this.setData({ categories: [] });
      });
  },

  onNameChange(e) {
    this.setData({ name: e.detail.value });
  },

  onCodeChange(e) {
    this.setData({ code: e.detail.value });
  },

  onCategoryChange(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    this.setData({
      categoryId: index,
      categoryIdValue: category ? category.id : -1
    });
  },

  onPriceChange(e) {
    this.setData({ price: e.detail.value });
  },

  onStockChange(e) {
    this.setData({ stock: e.detail.value });
  },

  onDescriptionChange(e) {
    this.setData({ description: e.detail.value });
  },

  submit() {
    console.log('提交数据', this.data);

    if (!this.data.name.trim()) {
      util.showError('请输入商品名称');
      return;
    }

    if (!this.data.code.trim()) {
      util.showError('请输入商品编码');
      return;
    }

    if (this.data.categoryId === -1) {
      util.showError('请选择商品类别');
      return;
    }

    if (!this.data.price) {
      util.showError('请输入商品价格');
      return;
    }

    if (!this.data.stock) {
      util.showError('请输入商品库存(斤)');
      return;
    }

    const data = {
      name: this.data.name,
      code: this.data.code,
      categoryId: this.data.categoryIdValue,
      price: parseFloat(this.data.price),
      stock: parseFloat(this.data.stock),
      description: this.data.description
    };

    console.log('发送的数据:', data);

    this.setData({ submitLoading: true });

    const request = this.data.id
      ? api.updateProduct(this.data.id, data)
      : api.createProduct(data);

    request
      .then(() => {
        util.showSuccess('保存成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('保存商品失败', err);
        util.showError('保存失败');
        this.setData({ submitLoading: false });
      });
  }
});
