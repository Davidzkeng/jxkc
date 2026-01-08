// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入路由
const categoryRoutes = require('../routes/categoryRoutes');
const productRoutes = require('../routes/productRoutes');
const customerRoutes = require('../routes/customerRoutes');
const supplierRoutes = require('../routes/supplierRoutes');
const inRecordRoutes = require('../routes/inRecordRoutes');
const outRecordRoutes = require('../routes/outRecordRoutes');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../../dist')));

// API路由
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/in-records', inRecordRoutes);
app.use('/api/out-records', outRecordRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '进销库存系统API服务运行正常' });
});

// 前端路由 fallback - 使用 app.use 而不是 app.get，因为 Express 5.x 对路由路径模式有更严格的要求
app.use((req, res, next) => {
  // 检查请求是否是 API 请求或已存在的静态文件
  if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
    return next();
  }
  // 否则返回前端入口文件
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;