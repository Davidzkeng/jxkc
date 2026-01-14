// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 格式化金额
function formatMoney(amount) {
  if (amount === null || amount === undefined) return '0.00';
  return parseFloat(amount).toFixed(2);
}

// 显示成功提示
function showSuccess(title, callback) {
  wx.showToast({
    title: title || '操作成功',
    icon: 'success',
    duration: 2000,
    success: callback
  });
}

// 显示错误提示
function showError(title, callback) {
  wx.showToast({
    title: title || '操作失败',
    icon: 'none',
    duration: 2000,
    success: callback
  });
}

// 显示确认对话框
function showConfirm(content, successCallback) {
  wx.showModal({
    title: '提示',
    content: content,
    success(res) {
      if (res.confirm) {
        successCallback && successCallback();
      }
    }
  });
}

module.exports = {
  formatDate,
  formatMoney,
  showSuccess,
  showError,
  showConfirm
};
