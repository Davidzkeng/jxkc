const express = require('express');
const router = express.Router();
const printJobController = require('../controllers/printJobController');

// 创建打印任务
router.post('/', printJobController.createPrintJob);

// 获取待打印任务列表
router.get('/pending', printJobController.getPendingPrintJobs);

// 获取打印任务详情
router.get('/:id', printJobController.getPrintJobDetail);

// 更新打印任务状态
router.put('/:id/status', printJobController.updatePrintJobStatus);

module.exports = router;