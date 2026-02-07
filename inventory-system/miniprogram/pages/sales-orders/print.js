const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    order: null,
    loading: false,
    emptyRows: []
  },

  onLoad(options) {
    if (options.id) {
      this.loadOrderDetail(options.id);
    }
  },

  loadOrderDetail(id) {
    this.setData({ loading: true });
    api.getSalesOrderById(id)
      .then(res => {
        // 处理订单数据
        const order = this.processOrderData(res);
        // 计算空白行数量（至少保留8行空白）
        const productCount = order.products ? order.products.length : 0;
        const minRows = 8;
        const emptyRowCount = Math.max(minRows - productCount, 0);
        const emptyRows = new Array(emptyRowCount).fill(0);

        this.setData({
          order: order,
          emptyRows: emptyRows,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载销售单详情失败', err);
        util.showError('加载失败');
        this.setData({ loading: false });
      });
  },

  // 处理订单数据
  processOrderData(order) {
    if (!order) return null;

    // 格式化日期
    if (order.createdAt) {
      order.createdAt = this.formatDate(order.createdAt);
    }

    // 计算总金额大写
    if (order.totalAmount) {
      order.totalAmountInChinese = this.numberToChinese(order.totalAmount);
    }

    // 处理商品数据
    if (order.products && Array.isArray(order.products)) {
      order.products.forEach(product => {
        // 计算小计金额
        if (product.price && product.quantity) {
          product.totalAmount = (parseFloat(product.price) * parseFloat(product.quantity)).toFixed(2);
        }
      });
    }

    // 确保客户联系人和电话字段存在
    if (!order.customerContact) {
      order.customerContact = '';
    }
    if (!order.customerPhone) {
      order.customerPhone = '';
    }

    return order;
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  },

  // 数字转中文大写
  numberToChinese(num) {
    if (!num || isNaN(num)) return '';

    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '万', '亿'];

    num = parseFloat(num).toFixed(2);
    const parts = num.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    let result = '';

    // 处理整数部分
    if (integerPart === '0') {
      result = '零';
    } else {
      let zeroFlag = false;
      const groups = [];
      let temp = integerPart;

      // 每4位分组
      while (temp.length > 0) {
        groups.unshift(temp.slice(-4));
        temp = temp.slice(0, -4);
      }

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        let groupResult = '';
        let groupZero = true;

        for (let j = 0; j < group.length; j++) {
          const digit = parseInt(group[j]);
          const position = group.length - 1 - j;

          if (digit === 0) {
            if (!zeroFlag && !groupZero) {
              groupResult += digits[0];
              zeroFlag = true;
            }
          } else {
            zeroFlag = false;
            groupZero = false;
            groupResult += digits[digit] + units[position];
          }
        }

        if (!groupZero) {
          result += groupResult + bigUnits[groups.length - 1 - i];
        } else if (i < groups.length - 1 && !result.endsWith(digits[0])) {
          result += digits[0];
        }
      }
    }

    result += '元';

    // 处理小数部分
    const jiao = parseInt(decimalPart[0]);
    const fen = parseInt(decimalPart[1]);

    if (jiao === 0 && fen === 0) {
      result += '整';
    } else {
      if (jiao > 0) {
        result += digits[jiao] + '角';
      }
      if (fen > 0) {
        result += digits[fen] + '分';
      }
    }

    return result;
  },

  print() {
    const order = this.data.order;
    if (!order) {
      util.showError('销售单信息未加载');
      return;
    }

    wx.showLoading({
      title: '准备打印...',
    });

    // 构建打印内容
    let printContent = '销售单\n\n';
    printContent += `客户名称: ${order.customerName || ''}\n`;
    printContent += `电话: ${order.customerContact || ''} ${order.customerPhone || ''}\n`;
    printContent += `单号: ${order.orderNumber || ''}\n`;
    printContent += `日期: ${order.createdAt || ''}\n\n`;

    printContent += '编号  品名          规格      数量  单位  单价    金额      备注\n';
    printContent += '----------------------------------------------------------------\n';

    if (order.products && order.products.length > 0) {
      order.products.forEach(item => {
        const code = (item.code || '').padEnd(6, ' ');
        const name = (item.name || '').substring(0, 10).padEnd(12, ' ');
        const spec = (item.specification || '').padEnd(8, ' ');
        const qty = String(item.quantity || '').padStart(4, ' ');
        const unit = '斤'.padEnd(4, ' ');
        const price = (item.price ? '¥' + item.price : '').padStart(6, ' ');
        const amount = (item.totalAmount ? '¥' + item.totalAmount : '').padStart(8, ' ');
        const remark = (item.remark || '').substring(0, 6);
        printContent += `${code} ${name} ${spec} ${qty}  ${unit} ${price} ${amount} ${remark}\n`;
      });
    }

    printContent += '----------------------------------------------------------------\n';
    printContent += `本页货款: ¥${order.totalAmount || '0.00'}\n`;
    printContent += `本单货款(大写): ${order.totalAmountInChinese || ''}\n`;
    printContent += `前欠款: ${order.previousDebt ? '¥' + order.previousDebt : '0.00'}\n`;
    printContent += `经手人: ${order.operator || ''}\n\n`;
    printContent += '注: 货物当面点清，过后概不负责。\n';

    wx.hideLoading();

    // 显示打印内容
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
              util.showSuccess('已复制到剪贴板');
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
