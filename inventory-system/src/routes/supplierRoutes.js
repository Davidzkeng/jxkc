const express = require('express');
const supplierController = require('../controllers/supplierController');

const router = express.Router();

// 获取所有供应商
router.get('/', supplierController.getAllSuppliers);

// 获取单个供应商
router.get('/:id', supplierController.getSupplierById);

// 创建供应商
router.post('/', supplierController.createSupplier);

// 更新供应商
router.put('/:id', supplierController.updateSupplier);

// 删除供应商
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
