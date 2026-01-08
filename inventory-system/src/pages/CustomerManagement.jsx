import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();

  // 获取所有客户
  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      message.error('获取客户列表失败');
      console.error('获取客户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 显示添加/编辑模态框
  const showModal = (customer = null) => {
    setEditingCustomer(customer);
    setOpen(true);
  };

  // 模态框打开后的回调函数
  const handleAfterOpenChange = (isOpen) => {
    if (isOpen) {
      // 模态框已经打开，现在可以安全地操作表单
      if (editingCustomer) {
        form.setFieldsValue(editingCustomer);
      } else {
        form.resetFields();
      }
    }
  };

  // 关闭模态框
  const handleCancel = () => {
    setOpen(false);
    setEditingCustomer(null);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (editingCustomer) {
        // 更新客户
        await fetch(`http://localhost:3001/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        message.success('客户更新成功');
      } else {
        // 创建客户
        await fetch('http://localhost:3001/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        message.success('客户创建成功');
      }
      setOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      message.error(editingCustomer ? '客户更新失败' : '客户创建失败');
      console.error('操作客户失败:', error);
    }
  };

  // 删除客户
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/customers/${id}`, {
        method: 'DELETE',
      });
      message.success('客户删除成功');
      fetchCustomers();
    } catch (error) {
      message.error('客户删除失败');
      console.error('删除客户失败:', error);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '客户名称',
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
        title="客户管理"
        variant="outlined"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            添加客户
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 添加/编辑客户模态框 */}
      <Modal
        title={editingCustomer ? '编辑客户' : '添加客户'}
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
            label="客户名称"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="请输入客户名称" />
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
              {editingCustomer ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
