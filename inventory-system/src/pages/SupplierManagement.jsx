import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();

  // 获取所有供应商
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      message.error('获取供应商列表失败');
      console.error('获取供应商列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // 显示添加/编辑模态框
  const showModal = (supplier = null) => {
    setEditingSupplier(supplier);
    setOpen(true);
  };

  // 模态框打开后的回调函数
  const handleAfterOpenChange = (isOpen) => {
    if (isOpen) {
      // 模态框已经打开，现在可以安全地操作表单
      if (editingSupplier) {
        form.setFieldsValue(editingSupplier);
      } else {
        form.resetFields();
      }
    }
  };

  // 关闭模态框
  const handleCancel = () => {
    setOpen(false);
    setEditingSupplier(null);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (editingSupplier) {
        // 更新供应商
        await fetch(`http://localhost:3001/api/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        message.success('供应商更新成功');
      } else {
        // 创建供应商
        await fetch('http://localhost:3001/api/suppliers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        message.success('供应商创建成功');
      }
      setOpen(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error) {
      message.error(editingSupplier ? '供应商更新失败' : '供应商创建失败');
      console.error('操作供应商失败:', error);
    }
  };

  // 删除供应商
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/suppliers/${id}`, {
        method: 'DELETE',
      });
      message.success('供应商删除成功');
      fetchSuppliers();
    } catch (error) {
      message.error('供应商删除失败');
      console.error('删除供应商失败:', error);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '供应商名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
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
        title="供应商管理"
        variant="outlined"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            添加供应商
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 添加/编辑供应商模态框 */}
      <Modal
        title={editingSupplier ? '编辑供应商' : '添加供应商'}
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
            label="供应商名称"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>

          <Form.Item
            name="contact"
            label="联系人"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="请输入联系人" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: '请输入电话' }]}
          >
            <Input placeholder="请输入电话" />
          </Form.Item>

          <Form.Item
            name="address"
            label="地址"
          >
            <Input.TextArea placeholder="请输入地址" rows={4} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingSupplier ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierManagement;
