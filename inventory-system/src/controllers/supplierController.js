import prisma from '../server/prisma.js';

// 获取所有供应商
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取单个供应商
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({ 
      where: { id: parseInt(id) },
      include: { inRecords: true }
    });
    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 创建供应商
exports.createSupplier = async (req, res) => {
  try {
    const { name, contact, phone, address } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, contact, phone, address }
    });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新供应商
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, phone, address } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { name, contact, phone, address }
    });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 删除供应商
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

