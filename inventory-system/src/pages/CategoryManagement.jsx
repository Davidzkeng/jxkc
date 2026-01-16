import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../config/api';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  // 获取所有类别
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      message.error('获取类别列表失败');
      console.error('获取类别列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 显示添加/编辑模态框
  const showModal = (category = null) => {
    setEditingCategory(category);
    setOpen(true);
  };

  // 模态框打开后的回调函数
  const handleAfterOpenChange = (isOpen) => {
    if (isOpen) {
      // 模态框已经打开，现在可以安全地操作表单
      if (editingCategory) {
        form.setFieldsValue(editingCategory);
      } else {
        form.resetFields();
      }
    }
  };

  // 关闭模态框
  const handleCancel = () => {
    setOpen(false);
    setEditingCategory(null);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        // 更新类别
        await fetch(`${API_BASE_URL}/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        message.success('类别更新成功');
      } else {
        // 创建类别
        await fetch(`${API_BASE_URL}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        message.success('类别创建成功');
      }
      setOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      message.error(editingCategory ? '类别更新失败' : '类别创建失败');
      console.error('操作类别失败:', error);
    }
  };

  // 删除类别
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'DELETE',
      });
      message.success('类别删除成功');
      fetchCategories();
    } catch (error) {
      message.error('类别删除失败');
      console.error('删除类别失败:', error);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '类别名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
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
        title="类别管理"
        variant="outlined"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            添加类别
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 添加/编辑类别模态框 */}
      <Modal
        title={editingCategory ? '编辑类别' : '添加类别'}
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
            label="类别名称"
            rules={[{ required: true, message: '请输入类别名称' }]}
          >
            <Input placeholder="请输入类别名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="类别描述"
          >
            <Input.TextArea placeholder="请输入类别描述" rows={4} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingCategory ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
