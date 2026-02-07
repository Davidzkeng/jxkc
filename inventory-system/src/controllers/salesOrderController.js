import prisma from '../server/prisma.js';

// 获取所有销售单
exports.getAllSalesOrders = async (req, res) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        products: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 格式化返回数据
    const formattedOrders = salesOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerContact: order.customer.contact,
      customerPhone: order.customer.phone,
      createdAt: order.createdAt.toISOString().split('T')[0],
      status: order.status,
      productCount: order.products.length,
      totalAmount: order.products.reduce((sum, item) => sum + parseFloat(item.totalAmount) || 0, 0),
      remark: order.remark
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取单个销售单
exports.getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        products: {
          include: {
            product: true
          }
        }
      }
    });

    if (!salesOrder) {
      return res.status(404).json({ error: '销售单不存在' });
    }

    // 格式化返回数据
    const formattedOrder = {
      id: salesOrder.id,
      orderNumber: salesOrder.orderNumber,
      customerName: salesOrder.customer.name,
      customerContact: salesOrder.customer.contact,
      customerPhone: salesOrder.customer.phone,
      createdAt: salesOrder.createdAt.toISOString().split('T')[0],
      status: salesOrder.status,
      productCount: salesOrder.products.length,
      totalAmount: salesOrder.products.reduce((sum, item) => sum + parseFloat(item.totalAmount) || 0, 0),
      remark: salesOrder.remark,
      products: salesOrder.products.map(item => ({
        id: item.product.id,
        name: item.product.name,
        code: item.product.code,
        quantity: item.quantity,
        price: item.price,
        totalAmount: item.totalAmount
      }))
    };

    res.json(formattedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 创建销售单
exports.createSalesOrder = async (req, res) => {
  try {
    const { customerId, products, remark } = req.body;

    // 生成销售单号
    const orderNumber = 'SO' + Date.now();

    // 计算实际总金额并处理缺少price字段的情况
    const processedProducts = products.map(item => {
      const productId = parseInt(item.productId);
      const quantity = parseFloat(item.quantity) || 0;
      // 如果price存在则使用price，否则从totalAmount和quantity反推，或者使用0
      let price = parseFloat(item.price);
      if (isNaN(price) || !price) {
        // 尝试从totalAmount和quantity反推价格
        if (quantity > 0 && item.totalAmount) {
          price = parseFloat(item.totalAmount) / quantity;
        } else {
          price = 0;
        }
      }
      const totalAmount = price * quantity;
      return {
        productId,
        quantity,
        price,
        totalAmount
      };
    });

    // 计算总金额
    const calculatedTotalAmount = processedProducts.reduce((sum, item) => {
      return sum + item.totalAmount;
    }, 0);

    // 创建销售单
    const salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: parseInt(customerId),
        totalAmount: calculatedTotalAmount,
        remark: remark || '',
        status: '已完成',
        products: {
          create: processedProducts
        }
      },
      include: {
        customer: true,
        products: {
          include: {
            product: true
          }
        }
      }
    });

    // 更新商品库存
    for (const item of products) {
      await prisma.product.update({
        where: { id: parseInt(item.productId) },
        data: {
          stock: {
            decrement: parseFloat(item.quantity)
          }
        }
      });
    }

    // 格式化返回数据
    const formattedOrder = {
      id: salesOrder.id,
      orderNumber: salesOrder.orderNumber,
      customerName: salesOrder.customer.name,
      customerContact: salesOrder.customer.contact,
      customerPhone: salesOrder.customer.phone,
      createdAt: salesOrder.createdAt.toISOString().split('T')[0],
      status: salesOrder.status,
      remark: salesOrder.remark,
      products: salesOrder.products.map(item => ({
        id: item.product.id,
        name: item.product.name,
        code: item.product.code,
        quantity: item.quantity,
        price: item.price,
        totalAmount: item.totalAmount
      }))
    };

    res.status(201).json(formattedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新销售单
exports.updateSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, products, remark, status } = req.body;

    // 获取原销售单信息
    const originalOrder = await prisma.salesOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: true
      }
    });

    if (!originalOrder) {
      return res.status(404).json({ error: '销售单不存在' });
    }

    // 计算实际总金额
    const calculatedTotalAmount = products ? products.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0) : 0;

    // 更新销售单
    const updatedOrder = await prisma.salesOrder.update({
      where: { id: parseInt(id) },
      data: {
        customerId: parseInt(customerId),
        totalAmount: calculatedTotalAmount,
        remark: remark || '',
        status: status || '已完成'
      },
      include: {
        customer: true,
        products: {
          include: {
            product: true
          }
        }
      }
    });

    // 如果商品有变化，更新商品库存
    if (products && products.length > 0) {
      // 先恢复原销售单商品的库存
      for (const item of originalOrder.products) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }

      // 删除原销售单商品记录
      await prisma.salesOrderProduct.deleteMany({
        where: { salesOrderId: parseInt(id) }
      });

      // 创建新销售单商品记录并扣减库存
      for (const item of products) {
        await prisma.salesOrderProduct.create({
          data: {
            salesOrderId: parseInt(id),
            productId: parseInt(item.productId),
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.price),
            totalAmount: parseFloat(item.totalAmount)
          }
        });

        await prisma.product.update({
          where: { id: parseInt(item.productId) },
          data: {
            stock: {
              decrement: parseFloat(item.quantity)
            }
          }
        });
      }
    }

    // 格式化返回数据
    const formattedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      customerName: updatedOrder.customer.name,
      customerContact: updatedOrder.customer.contact,
      customerPhone: updatedOrder.customer.phone,
      createdAt: updatedOrder.createdAt.toISOString().split('T')[0],
      status: updatedOrder.status,
      remark: updatedOrder.remark,
      products: updatedOrder.products.map(item => ({
        id: item.product.id,
        name: item.product.name,
        code: item.product.code,
        quantity: item.quantity,
        price: item.price,
        totalAmount: item.totalAmount
      }))
    };

    res.json(formattedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 删除销售单
exports.deleteSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取销售单信息
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: true
      }
    });

    if (!salesOrder) {
      return res.status(404).json({ error: '销售单不存在' });
    }

    // 恢复商品库存
    for (const item of salesOrder.products) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });
    }

    // 删除销售单
    await prisma.salesOrder.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};