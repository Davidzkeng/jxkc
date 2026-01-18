const express = require('express');
const router = express.Router();
const salesOrderController = require('../controllers/salesOrderController');

// 获取所有销售单
router.get('/', salesOrderController.getAllSalesOrders);

// 获取单个销售单
router.get('/:id', salesOrderController.getSalesOrderById);

// 创建销售单
router.post('/', salesOrderController.createSalesOrder);

// 更新销售单
router.put('/:id', salesOrderController.updateSalesOrder);

// 删除销售单
router.delete('/:id', salesOrderController.deleteSalesOrder);

module.exports = router;