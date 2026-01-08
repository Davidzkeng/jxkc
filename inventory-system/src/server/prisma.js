// 直接从生成的客户端文件中导入PrismaClient，绕过@prisma/client包
// 这是一个临时解决方案，因为@prisma/client/default.js试图导入不存在的模块
const { PrismaClient } = require('../../node_modules/.prisma/client/client');

// 创建并导出PrismaClient实例
const prisma = new PrismaClient();

module.exports = prisma;