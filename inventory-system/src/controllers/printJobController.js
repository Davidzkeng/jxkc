const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 创建打印任务
exports.createPrintJob = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: '订单ID不能为空' });
    }

    // 检查订单是否存在
    const order = await prisma.salesOrder.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        customer: true,
        products: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 创建打印任务
    const printJob = await prisma.printJob.create({
      data: {
        orderId: parseInt(orderId),
        status: 'pending'
      }
    });

    res.status(201).json({
      success: true,
      message: '打印任务已创建',
      data: printJob
    });
  } catch (error) {
    console.error('创建打印任务失败:', error);
    res.status(500).json({ error: '创建打印任务失败: ' + error.message });
  }
};

// 获取待打印任务列表
exports.getPendingPrintJobs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const printJobs = await prisma.printJob.findMany({
      where: {
        status: 'pending'
      },
      include: {
        order: {
          include: {
            customer: true,
            products: {
              include: {
                productUnit: true,
                product: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: printJobs
    });
  } catch (error) {
    console.error('获取打印任务失败:', error);
    res.status(500).json({ error: '获取打印任务失败: ' + error.message });
  }
};

// 更新打印任务状态
exports.updatePrintJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, printerName, errorMessage } = req.body;

    if (!status) {
      return res.status(400).json({ error: '状态不能为空' });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (printerName) {
      updateData.printerName = printerName;
    }

    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    if (status === 'completed') {
      updateData.printedAt = new Date();
    }

    const printJob = await prisma.printJob.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: '打印任务状态已更新',
      data: printJob
    });
  } catch (error) {
    console.error('更新打印任务状态失败:', error);
    res.status(500).json({ error: '更新打印任务状态失败: ' + error.message });
  }
};

// 获取打印任务详情（包含完整的订单信息用于打印）
exports.getPrintJobDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const printJob = await prisma.printJob.findUnique({
      where: { id: parseInt(id) },
      include: {
        order: {
          include: {
            customer: true,
            products: {
              include: {
                product: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!printJob) {
      return res.status(404).json({ error: '打印任务不存在' });
    }

    // 格式化打印数据
    const formattedData = formatPrintData(printJob);

    res.json({
      success: true,
      data: {
        ...printJob,
        formattedData
      }
    });
  } catch (error) {
    console.error('获取打印任务详情失败:', error);
    res.status(500).json({ error: '获取打印任务详情失败: ' + error.message });
  }
};

// 格式化打印数据
function formatPrintData(printJob) {
  const order = printJob.order;
  if (!order) return null;

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 数字转中文大写
  const numberToChinese = (num) => {
    if (!num || isNaN(num)) return '';

    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '万', '亿'];

    num = parseFloat(num).toFixed(2);
    const parts = num.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    let result = '';

    if (integerPart === '0') {
      result = '零';
    } else {
      let zeroFlag = false;
      const groups = [];
      let temp = integerPart;

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
  };

  // 处理商品数据
  const products = order.products ? order.products.map((item, index) => ({
    no: index + 1,
    code: item.product?.code || '',
    name: item.product?.name || '',
    specification: item.product?.description || '',
    quantity: item.quantity,
    unit: '件',
    price: parseFloat(item.price).toFixed(2),
    amount: parseFloat(item.totalAmount).toFixed(2),
    remark: ''
  })) : [];

  // 计算总数量
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

  return {
    title: '销售单',
    customerName: order.customer?.name || '',
    customerPhone: order.customer?.phone || '',
    customerAddress: order.customer?.address || '',
    orderNumber: order.orderNumber,
    date: formatDate(order.createdAt),
    pageInfo: '第1页共1页',
    products: products,
    totalQuantity: totalQuantity,
    totalAmount: parseFloat(order.totalAmount).toFixed(2),
    totalAmountInChinese: numberToChinese(order.totalAmount),
    previousDebt: '0.00',
    operator: '',
    remark: '货物当面点清，过后概不负责。'
  };
}