const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// 获取所有产品
router.get('/', productController.getAllProducts);

// 获取单个产品
router.get('/:id', productController.getProductById);

// 创建产品
router.post('/', productController.createProduct);

// 更新产品
router.put('/:id', productController.updateProduct);

// 删除产品
router.delete('/:id', productController.deleteProduct);

// 获取库存统计
router.get('/stats/stock', productController.getStockStats);

module.exports = router;
