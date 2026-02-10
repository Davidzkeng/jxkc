const prisma = require('../server/prisma');

// 获取商品的所有单位
exports.getProductUnits = async (req, res) => {
  try {
    const { productId } = req.params;
    const units = await prisma.productUnit.findMany({
      where: { productId: parseInt(productId) },
      orderBy: { isDefault: 'desc' }
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取单个商品单位
exports.getProductUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await prisma.productUnit.findUnique({
      where: { id: parseInt(id) }
    });
    if (!unit) {
      return res.status(404).json({ error: '商品单位不存在' });
    }
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 创建商品单位
exports.createProductUnit = async (req, res) => {
  try {
    const { productId, unitName, conversionRate, price, isDefault } = req.body;
    
    // 如果设为默认单位，需要取消该商品的其他默认单位
    if (isDefault) {
      await prisma.productUnit.updateMany({
        where: { productId: parseInt(productId), isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const unit = await prisma.productUnit.create({
      data: {
        productId: parseInt(productId),
        unitName,
        conversionRate: parseFloat(conversionRate) || 1,
        price: parseFloat(price) || 0,
        isDefault: isDefault || false
      }
    });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新商品单位
exports.updateProductUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { unitName, conversionRate, price, isDefault } = req.body;
    
    const unit = await prisma.productUnit.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!unit) {
      return res.status(404).json({ error: '商品单位不存在' });
    }
    
    // 如果设为默认单位，需要取消该商品的其他默认单位
    if (isDefault && !unit.isDefault) {
      await prisma.productUnit.updateMany({
        where: { productId: unit.productId, isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const updated = await prisma.productUnit.update({
      where: { id: parseInt(id) },
      data: {
        unitName,
        conversionRate: parseFloat(conversionRate) || 1,
        price: parseFloat(price) || 0,
        isDefault: isDefault || false
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 删除商品单位
exports.deleteProductUnit = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.productUnit.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
