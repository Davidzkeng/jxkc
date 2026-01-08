const express = require('express');
const inRecordController = require('../controllers/inRecordController');

const router = express.Router();

// 获取所有入库记录
router.get('/', inRecordController.getAllInRecords);

// 获取单个入库记录
router.get('/:id', inRecordController.getInRecordById);

// 创建入库记录
router.post('/', inRecordController.createInRecord);

// 更新入库记录
router.put('/:id', inRecordController.updateInRecord);

// 删除入库记录
router.delete('/:id', inRecordController.deleteInRecord);

module.exports = router;
