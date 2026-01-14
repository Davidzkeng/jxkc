const prisma = require('../server/prisma');

// 获取所有入库记录
exports.getAllInRecords = async (req, res) => {
  try {
    const inRecords = await prisma.inRecord.findMany({
      include: {
        product: true,
        supplier: true
      }
    });
    res.json(inRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取单个入库记录
exports.getInRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const inRecord = await prisma.inRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true,
        supplier: true
      }
    });
    if (!inRecord) {
      return res.status(404).json({ error: '入库记录不存在' });
    }
    res.json(inRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 创建入库记录
exports.createInRecord = async (req, res) => {
  try {
    const { productId, supplierId, quantity, price, date } = req.body;
    
    // 计算总金额
    const totalAmount = parseFloat((quantity * parseFloat(price)).toFixed(2));
    
    // 创建入库记录
    const inRecord = await prisma.inRecord.create({
      data: {
        productId,
        supplierId,
        quantity,
        price,
        totalAmount,
        date: date ? new Date(date) : new Date()
      }
    });
    
    // 更新产品库存
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: quantity
        }
      }
    });
    
    res.json(inRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新入库记录
exports.updateInRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, supplierId, quantity, price, date } = req.body;
    
    // 获取原入库记录
    const originalRecord = await prisma.inRecord.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!originalRecord) {
      return res.status(404).json({ error: '入库记录不存在' });
    }
    
    // 计算总金额
    const totalAmount = parseFloat((quantity * parseFloat(price)).toFixed(2));
    
    // 更新入库记录
    const inRecord = await prisma.inRecord.update({
      where: { id: parseInt(id) },
      data: {
        productId,
        supplierId,
        quantity,
        price,
        totalAmount,
        date: new Date(date)
      }
    });
    
    // 更新产品库存（先减去原数量，再加新数量）
    const quantityDiff = quantity - originalRecord.quantity;
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: quantityDiff
        }
      }
    });
    
    res.json(inRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 删除入库记录
exports.deleteInRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取原入库记录
    const originalRecord = await prisma.inRecord.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!originalRecord) {
      return res.status(404).json({ error: '入库记录不存在' });
    }
    
    // 删除入库记录
    await prisma.inRecord.delete({
      where: { id: parseInt(id) }
    });
    
    // 更新产品库存（减去入库数量）
    await prisma.product.update({
      where: { id: originalRecord.productId },
      data: {
        stock: {
          decrement: originalRecord.quantity
        }
      }
    });
    
    res.json({ message: '入库记录删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

