import prisma from '../server/prisma.js';

// 获取所有商品
exports.getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取单个商品
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { category: true }
    });
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 创建商品
exports.createProduct = async (req, res) => {
  try {
    const { name, code, categoryId, price, stock, description } = req.body;
    const product = await prisma.product.create({
      data: { name, code, categoryId, price, stock, description }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新商品
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, categoryId, price, stock, description } = req.body;
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { name, code, categoryId, price, stock, description }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 删除商品
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取商品库存统计
exports.getStockStats = async (req, res) => {
  try {
    const totalProducts = await prisma.product.count();
    const totalStock = await prisma.product.aggregate({
      _sum: { stock: true }
    });
    
    // 获取今天的入库和出库数量
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayIn = await prisma.inRecord.aggregate({
      _sum: { quantity: true },
      where: { date: { gte: today } }
    });
    
    const todayOut = await prisma.outRecord.aggregate({
      _sum: { quantity: true },
      where: { date: { gte: today } }
    });
    
    res.json({
      totalProducts,
      totalStock: totalStock._sum.stock || 0,
      todayIn: todayIn._sum.quantity || 0,
      todayOut: todayOut._sum.quantity || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

