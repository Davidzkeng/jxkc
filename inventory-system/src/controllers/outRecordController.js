const prisma = require('../server/prisma');

// 获取所有出库记录
exports.getAllOutRecords = async (req, res) => {
  try {
    const outRecords = await prisma.outRecord.findMany({
      include: {
        product: true,
        customer: true
      }
    });
    res.json(outRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取单个出库记录
exports.getOutRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const outRecord = await prisma.outRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true,
        customer: true
      }
    });
    if (!outRecord) {
      return res.status(404).json({ error: '出库记录不存在' });
    }
    res.json(outRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 创建出库记录
exports.createOutRecord = async (req, res) => {
  try {
    const { productId, customerId, quantity, price, date } = req.body;
    
    // 检查产品库存
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }
    
    // 计算总金额
    const totalAmount = parseFloat((quantity * parseFloat(price)).toFixed(2));
    
    // 创建出库记录
    const outRecord = await prisma.outRecord.create({
      data: {
        productId,
        customerId,
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
          decrement: quantity
        }
      }
    });
    
    res.status(201).json(outRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新出库记录
exports.updateOutRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, customerId, quantity, price, date } = req.body;
    
    // 获取原出库记录
    const originalRecord = await prisma.outRecord.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!originalRecord) {
      return res.status(404).json({ error: '出库记录不存在' });
    }
    
    // 检查产品库存
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    // 计算库存变化
    const quantityDiff = quantity - originalRecord.quantity;
    if (product.stock < quantityDiff) {
      return res.status(400).json({ error: '库存不足' });
    }
    
    // 计算总金额
    const totalAmount = parseFloat((quantity * parseFloat(price)).toFixed(2));
    
    // 更新出库记录
    const outRecord = await prisma.outRecord.update({
      where: { id: parseInt(id) },
      data: {
        productId,
        customerId,
        quantity,
        price,
        totalAmount,
        date: new Date(date)
      }
    });
    
    // 更新产品库存
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantityDiff
        }
      }
    });
    
    res.json(outRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 删除出库记录
exports.deleteOutRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取原出库记录
    const originalRecord = await prisma.outRecord.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!originalRecord) {
      return res.status(404).json({ error: '出库记录不存在' });
    }
    
    // 删除出库记录
    await prisma.outRecord.delete({
      where: { id: parseInt(id) }
    });
    
    // 更新产品库存（增加出库数量）
    await prisma.product.update({
      where: { id: originalRecord.productId },
      data: {
        stock: {
          increment: originalRecord.quantity
        }
      }
    });
    
    res.json({ message: '出库记录删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

