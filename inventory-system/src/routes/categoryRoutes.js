const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// 获取所有类别
router.get('/', categoryController.getAllCategories);

// 获取单个类别
router.get('/:id', categoryController.getCategoryById);

// 创建类别
router.post('/', categoryController.createCategory);

// 更新类别
router.put('/:id', categoryController.updateCategory);

// 删除类别
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
