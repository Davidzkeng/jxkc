import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  // 获取所有商品
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      message.error('获取商品列表失败');
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取所有类别
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      message.error('获取类别列表失败');
      console.error('获取类别列表失败:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // 显示添加/编辑模态框
  const showModal = (product = null) => {
    console.log('showModal called with product:', product);
    setEditingProduct(product);
    setOpen(true);
  };

  // 模态框打开后的回调函数
  const handleAfterOpenChange = (isOpen) => {
    if (isOpen) {
      // 模态框已经打开，现在可以安全地操作表单
      if (editingProduct) {
        form.setFieldsValue({
          ...editingProduct,
          categoryId: editingProduct.categoryId,
        });
      } else {
        form.resetFields();
      }
    }
  };

  // 关闭模态框
  const handleCancel = () => {
    setOpen(false);
    setEditingProduct(null);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (editingProduct) {
        // 更新商品
        await fetch(`http://localhost:3001/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        message.success('商品更新成功');
      } else {
        // 创建商品
        await fetch('http://localhost:3001/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        message.success('商品创建成功');
      }
      setOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      message.error(editingProduct ? '商品更新失败' : '商品创建失败');
      console.error('操作商品失败:', error);
    }
  };

  // 删除商品
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/products/${id}`, {
        method: 'DELETE',
      });
      message.success('商品删除成功');
      fetchProducts();
    } catch (error) {
      message.error('商品删除失败');
      console.error('删除商品失败:', error);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '商品编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '类别',
      dataIndex: ['category', 'name'],
      key: 'categoryName',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            style={{ marginRight: 8 }}
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="商品管理"
        variant="outlined"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            添加商品
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 添加/编辑商品模态框 */}
      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={open}
        onCancel={handleCancel}
        footer={null}
        afterOpenChange={handleAfterOpenChange}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          <Form.Item
            name="code"
            label="商品编码"
            rules={[{ required: true, message: '请输入商品编码' }]}
          >
            <Input placeholder="请输入商品编码" />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="商品类别"
            rules={[{ required: true, message: '请选择商品类别' }]}
          >
            <Select placeholder="请选择商品类别">
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="price"
            label="单价"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入单价"
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            name="stock"
            label="库存数量"
            rules={[{ required: true, message: '请输入库存数量' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入库存数量"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="商品描述"
          >
            <Input.TextArea placeholder="请输入商品描述" rows={4} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingProduct ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductManagement;
