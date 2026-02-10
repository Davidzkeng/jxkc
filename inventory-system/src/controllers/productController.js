const prisma = require('../server/prisma');

// 获取所有商品
exports.getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { 
        category: true,
        supplier: true,
        productUnits: true
      }
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
      include: { 
        category: true,
        supplier: true,
        productUnits: true
      }
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
    const { name, code, categoryId, supplierId, price, stock, description } = req.body;
    
    // 创建商品
    const product = await prisma.product.create({
      data: { 
        name, 
        code, 
        categoryId: parseInt(categoryId), 
        supplierId: supplierId ? parseInt(supplierId) : null, 
        price: parseFloat(price), 
        stock: parseFloat(stock), 
        description 
      }
    });
    
    // 自动添加默认单位"斤"
    await prisma.productUnit.create({
      data: {
        productId: product.id,
        unitName: '斤',
        conversionRate: 1,
        price: parseFloat(price) || 0,
        isDefault: true
      }
    });
    
    // 返回包含单位的商品信息
    const productWithUnits = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        supplier: true,
        productUnits: true
      }
    });
    
    res.json(productWithUnits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新商品
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, categoryId, supplierId, price, stock, description } = req.body;
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        code, 
        categoryId: parseInt(categoryId), 
        supplierId: supplierId ? parseInt(supplierId) : null, 
        price: parseFloat(price), 
        stock: parseFloat(stock), 
        description 
      }
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
    const productId = parseInt(id);

    // 先删除该商品的所有入库记录
    await prisma.inRecord.deleteMany({
      where: { productId }
    });

    // 先删除该商品的所有出库记录
    await prisma.outRecord.deleteMany({
      where: { productId }
    });

    // 删除库存盘点记录
    await prisma.inventoryCheck.deleteMany({
      where: { productId }
    });

    // 删除销售单商品关联记录
    await prisma.salesOrderProduct.deleteMany({
      where: { productId }
    });

    // 再删除商品
    await prisma.product.delete({ where: { id: productId } });
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
