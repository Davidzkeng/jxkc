const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

// 显示成功提示
function showSuccess(message) {
  wx.showToast({
    title: message,
    icon: 'success'
  });
}

// 显示错误提示
function showError(message) {
  wx.showToast({
    title: message,
    icon: 'none'
  });
}

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
        // 使用后端返回的totalAmount，不再重新计算
        // 后端已经根据转换系数计算好了正确的金额
        if (product.totalAmount) {
          product.totalAmount = parseFloat(product.totalAmount).toFixed(2);
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
      showError('销售单信息未加载');
      return;
    }

    if (!order.id) {
      showError('订单ID无效');
      return;
    }

    wx.showLoading({
      title: '创建打印任务...',
    });

    // 调用API创建打印任务
    api.createPrintJob({ orderId: order.id })
      .then(res => {
        wx.hideLoading();
        if (res.success) {
          wx.showModal({
            title: '打印任务已创建',
            content: '打印任务已提交到服务器，请等待打印完成',
            showCancel: false,
            confirmText: '确定',
            success: () => {
              showSuccess('打印任务创建成功');
            }
          });
        } else {
          showError(res.error || '创建打印任务失败');
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('创建打印任务失败:', err);
        showError('创建打印任务失败');
      });
  },

  goBack() {
    wx.navigateBack();
  }
});
