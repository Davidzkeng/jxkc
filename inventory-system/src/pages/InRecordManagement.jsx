import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, InputNumber, DatePicker, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const InRecordManagement = () => {
  const [inRecords, setInRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // 获取所有入库记录
  const fetchInRecords = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/in-records');
      const data = await response.json();
      setInRecords(data);
    } catch (error) {
      message.error('获取入库记录失败');
      console.error('获取入库记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取所有商品
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      message.error('获取商品列表失败');
      console.error('获取商品列表失败:', error);
    }
  };

  // 获取所有供应商
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      message.error('获取供应商列表失败');
      console.error('获取供应商列表失败:', error);
    }
  };

  useEffect(() => {
    fetchInRecords();
    fetchProducts();
    fetchSuppliers();
  }, []);

  // 显示添加/编辑模态框
  const showModal = (record = null) => {
    setEditingRecord(record);
    setOpen(true);
  };

  // 模态框打开后的回调函数
  const handleAfterOpenChange = (isOpen) => {
    if (isOpen) {
      // 模态框已经打开，现在可以安全地操作表单
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          productId: editingRecord.productId,
          supplierId: editingRecord.supplierId,
        });
      } else {
        form.resetFields();
      }
    }
  };

  // 关闭模态框
  const handleCancel = () => {
    setOpen(false);
    setEditingRecord(null);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      const recordData = {
        ...values,
        date: values.date.format('YYYY-MM-DD HH:mm:ss'),
      };

      if (editingRecord) {
        // 更新入库记录
        await fetch(`http://localhost:3001/api/in-records/${editingRecord.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData),
        });
        message.success('入库记录更新成功');
      } else {
        // 创建入库记录
        await fetch('http://localhost:3001/api/in-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData),
        });
        message.success('入库记录创建成功');
      }
      setOpen(false);
      setEditingRecord(null);
      fetchInRecords();
    } catch (error) {
      message.error(editingRecord ? '入库记录更新失败' : '入库记录创建失败');
      console.error('操作入库记录失败:', error);
    }
  };

  // 删除入库记录
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/in-records/${id}`, {
        method: 'DELETE',
      });
      message.success('入库记录删除成功');
      fetchInRecords();
    } catch (error) {
      message.error('入库记录删除失败');
      console.error('删除入库记录失败:', error);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '商品',
      dataIndex: ['product', 'name'],
      key: 'productName',
    },
    {
      title: '供应商',
      dataIndex: ['supplier', 'name'],
      key: 'supplierName',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price}`,
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `¥${amount}`,
    },
    {
      title: '入库时间',
      dataIndex: 'date',
      key: 'date',
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
        title="入库记录管理"
        variant="outlined"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            添加入库记录
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={inRecords}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 添加/编辑入库记录模态框 */}
      <Modal
        title={editingRecord ? '编辑入库记录' : '添加入库记录'}
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
            name="productId"
            label="商品"
            rules={[{ required: true, message: '请选择商品' }]}
          >
            <Select placeholder="请选择商品">
              {products.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name} (当前库存: {product.stock})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="supplierId"
            label="供应商"
            rules={[{ required: true, message: '请选择供应商' }]}
          >
            <Select placeholder="请选择供应商">
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="入库数量"
            rules={[{ required: true, message: '请输入入库数量' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入入库数量"
              min={1}
            />
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
            name="date"
            label="入库时间"
            rules={[{ required: true, message: '请选择入库时间' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              showTime
              placeholder="请选择入库时间"
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingRecord ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InRecordManagement;
