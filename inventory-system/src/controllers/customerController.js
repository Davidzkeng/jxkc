import prisma from '../server/prisma.js';

// 检查客户名称是否存在
exports.checkName = async (req, res) => {
  try {
    const { name, excludeId } = req.query;
    
    if (!name) {
      return res.json({ exists: false });
    }
    
    const whereClause = { name };
    if (excludeId) {
      whereClause.id = { not: parseInt(excludeId) };
    }
    
    const existingCustomer = await prisma.customer.findFirst({
      where: whereClause
    });
    
    res.json({ exists: !!existingCustomer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取所有客户
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取单个客户
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ 
      where: { id: parseInt(id) },
      include: { outRecords: true }
    });
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 创建客户
exports.createCustomer = async (req, res) => {
  try {
    const { name, contact, phone, address } = req.body;
    
    // 检查客户名称是否已存在
    const existingCustomer = await prisma.customer.findFirst({
      where: { name }
    });
    if (existingCustomer) {
      return res.status(400).json({ error: '客户名称已存在' });
    }
    
    const customer = await prisma.customer.create({
      data: { name, contact, phone, address }
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新客户
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, phone, address } = req.body;
    
    // 检查客户名称是否已存在（排除自己）
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        name,
        id: { not: parseInt(id) }
      }
    });
    if (existingCustomer) {
      return res.status(400).json({ error: '客户名称已存在' });
    }
    
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { name, contact, phone, address }
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 删除客户
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.customer.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

