const prisma = require('../server/prisma');

// 获取所有销售单
exports.getAllSalesOrders = async (req, res) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        products: {
          include: {
            product: true,
            productUnit: true
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
      remark: order.remark,
      products: order.products.map(item => ({
        id: item.product.id,
        name: item.product.name,
        code: item.product.code,
        productUnitId: item.productUnitId,
        unitName: item.productUnit?.unitName || '斤',
        specification: item.productUnit?.specification || '',
        quantity: item.quantity,
        price: item.price,
        totalAmount: item.totalAmount
      }))
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
            product: true,
            productUnit: true
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
        productUnitId: item.productUnitId,
        unitName: item.productUnit?.unitName || '斤',
        specification: item.productUnit?.specification || '',
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

    // 处理商品数据，计算基本数量（转换为斤）
    const processedProducts = await Promise.all(products.map(async (item) => {
      const productId = parseInt(item.productId);
      const quantity = parseFloat(item.quantity) || 0;
      
      // 获取商品单位信息
      let unitPrice = parseFloat(item.price);
      let baseQuantity = quantity;  // 默认基本数量等于销售数量
      
      if (item.productUnitId) {
        const unit = await prisma.productUnit.findUnique({
          where: { id: parseInt(item.productUnitId) }
        });
        if (unit) {
          baseQuantity = quantity * unit.conversionRate;
          if (!unitPrice || isNaN(unitPrice)) {
            unitPrice = parseFloat(unit.price);
          }
        }
      }
      
      // 如果没有提供单价，尝试获取默认单位单价
      if (!unitPrice || isNaN(unitPrice)) {
        const defaultUnit = await prisma.productUnit.findFirst({
          where: { productId, isDefault: true }
        });
        if (defaultUnit) {
          unitPrice = parseFloat(defaultUnit.price);
        } else {
          unitPrice = 0;
        }
      }
      
      const totalAmount = unitPrice * quantity;
      
      return {
        productId,
        productUnitId: item.productUnitId ? parseInt(item.productUnitId) : null,
        quantity,
        baseQuantity,  // 转换为基本单位（斤）的数量
        price: unitPrice,
        totalAmount
      };
    }));

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
          create: processedProducts.map(item => ({
            productId: item.productId,
            productUnitId: item.productUnitId,
            quantity: item.quantity,
            baseQuantity: item.baseQuantity,
            price: item.price,
            totalAmount: item.totalAmount
          }))
        }
      },
      include: {
        customer: true,
        products: {
          include: {
            product: true,
            productUnit: true
          }
        }
      }
    });

    // 更新商品库存（按基本数量扣减）
    for (const item of processedProducts) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.baseQuantity
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
        productUnitId: item.productUnitId,
        unitName: item.productUnit?.unitName || '斤',
        specification: item.productUnit?.specification || '',
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

    // 恢复商品库存（使用 baseQuantity 按基本单位恢复）
    for (const item of salesOrder.products) {
      const baseQty = item.baseQuantity || item.quantity;
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: baseQty
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

// 作废销售单
exports.voidSalesOrder = async (req, res) => {
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

    if (salesOrder.status === '已作废') {
      return res.status(400).json({ error: '该销售单已作废' });
    }

    // 恢复商品库存（使用 baseQuantity 按基本单位恢复）
    for (const item of salesOrder.products) {
      const baseQty = item.baseQuantity || item.quantity;
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: baseQty
          }
        }
      });
    }

    // 更新销售单状态为已作废
    const updatedOrder = await prisma.salesOrder.update({
      where: { id: parseInt(id) },
      data: {
        status: '已作废'
      },
      include: {
        customer: true,
        products: {
          include: {
            product: true,
            productUnit: true
          }
        }
      }
    });

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
        productUnitId: item.productUnitId,
        unitName: item.productUnit?.unitName || '斤',
        specification: item.productUnit?.specification || '',
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