const express = require('express');
const customerController = require('../controllers/customerController');

const router = express.Router();

// 检查客户名称是否存在
router.get('/check-name', customerController.checkName);

// 获取所有客户
router.get('/', customerController.getAllCustomers);

// 获取单个客户
router.get('/:id', customerController.getCustomerById);

// 创建客户
router.post('/', customerController.createCustomer);

// 更新客户
router.put('/:id', customerController.updateCustomer);

// 删除客户
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
