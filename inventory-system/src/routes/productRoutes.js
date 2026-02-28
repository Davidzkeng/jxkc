const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// 检查商品名称是否存在
router.get('/check-name', productController.checkName);

// 获取库存统计（必须在 /:id 之前）
router.get('/stats/stock', productController.getStockStats);

// 获取所有产品
router.get('/', productController.getAllProducts);

// 创建产品
router.post('/', productController.createProduct);

// 获取单个产品
router.get('/:id', productController.getProductById);

// 更新产品
router.put('/:id', productController.updateProduct);

// 删除产品
router.delete('/:id', productController.deleteProduct);

module.exports = router;
