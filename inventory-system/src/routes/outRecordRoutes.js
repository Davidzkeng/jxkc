const express = require('express');
const outRecordController = require('../controllers/outRecordController');

const router = express.Router();

// 获取所有出库记录
router.get('/', outRecordController.getAllOutRecords);

// 获取单个出库记录
router.get('/:id', outRecordController.getOutRecordById);

// 创建出库记录
router.post('/', outRecordController.createOutRecord);

// 更新出库记录
router.put('/:id', outRecordController.updateOutRecord);

// 删除出库记录
router.delete('/:id', outRecordController.deleteOutRecord);

module.exports = router;
