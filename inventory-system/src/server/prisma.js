// 从@prisma/client导入PrismaClient
const { PrismaClient } = require('@prisma/client');

// 创建并导出PrismaClient实例
const prisma = new PrismaClient();

module.exports = prisma;