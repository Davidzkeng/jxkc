const express = require('express');
const router = express.Router();
const productUnitController = require('../controllers/productUnitController');

// 获取商品的所有单位
router.get('/products/:productId/units', productUnitController.getProductUnits);
// 获取单个商品单位
router.get('/product-units/:id', productUnitController.getProductUnitById);
// 创建商品单位
router.post('/product-units', productUnitController.createProductUnit);
// 更新商品单位
router.put('/product-units/:id', productUnitController.updateProductUnit);
// 删除商品单位
router.delete('/product-units/:id', productUnitController.deleteProductUnit);

module.exports = router;
