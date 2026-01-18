const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    order: null,
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadOrderDetail(options.id);
    } else if (options.order) {
      // 如果是通过页面传递的订单数据
      const order = JSON.parse(decodeURIComponent(options.order));
      this.setData({
        order: order,
        loading: false
      });
    }
  },

  loadOrderDetail(id) {
    this.setData({ loading: true });
    api.getSalesOrderById(id)
      .then(res => {
        this.setData({
          order: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载销售单详情失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  print() {
    const order = this.data.order;
    if (!order) {
      util.showError('销售单信息未加载');
      return;
    }

    // 使用微信小程序的打印功能
    wx.showLoading({
      title: '准备打印...',
    });

    // 构建打印内容
    let printContent = `库存管理系统\n`;
    printContent += `销售单\n`;
    printContent += `联系方式: 12345678900\n\n`;
    printContent += `销售单号: ${order.orderNumber}\n`;
    printContent += `日期: ${order.createdAt}\n`;
    printContent += `客户: ${order.customerName}\n`;
    printContent += `状态: ${order.status}\n\n`;
    printContent += `商品明细:\n`;
    printContent += `序号  商品名称              编码        数量  单价    小计\n`;
    printContent += `-----------------------------------------------------\n`;
    
    order.products.forEach((product, index) => {
      const name = product.name.padEnd(20, ' ');
      const code = product.code.padEnd(10, ' ');
      const quantity = product.quantity.toString().padStart(5, ' ');
      const price = `¥${product.price}`.padStart(8, ' ');
      const total = `¥${product.totalAmount}`.padStart(8, ' ');
      printContent += `${(index + 1).toString().padStart(2, ' ')}   ${name} ${code} ${quantity} ${price} ${total}\n`;
    });
    
    printContent += `-----------------------------------------------------\n`;
    printContent += `商品数量: ${order.productCount}\n`;
    printContent += `总金额: ¥${order.totalAmount}\n`;
    
    if (order.remark) {
      printContent += `\n备注: ${order.remark}\n`;
    }

    wx.hideLoading();

    // 显示打印内容，用户可以复制或截图打印
    wx.showModal({
      title: '打印内容',
      content: printContent,
      confirmText: '复制',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: printContent,
            success: () => {
              util.showSuccess('已复制到剪贴板，可以粘贴到打印软件中');
            }
          });
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});