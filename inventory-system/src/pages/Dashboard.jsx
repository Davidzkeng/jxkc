import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Spin } from 'antd';
import {
  InboxOutlined,
  ExportOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { API_BASE_URL } from '../config/api';

const { Title } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    todayIn: 0,
    todayOut: 0,
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取库存统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/stats/stock`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    };

    fetchStats();
  }, []);

  // 获取最近的出入库记录
  useEffect(() => {
    const fetchRecentRecords = async () => {
      try {
        // 这里可以合并获取入库和出库记录，然后排序
        const [inResponse, outResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/in-records`),
          fetch(`${API_BASE_URL}/api/out-records`),
        ]);
        
        const [inRecords, outRecords] = await Promise.all([
          inResponse.json(),
          outResponse.json(),
        ]);
        
        // 合并记录并添加类型标识
        const allRecords = [
          ...inRecords.map(record => ({ ...record, type: 'in' })),
          ...outRecords.map(record => ({ ...record, type: 'out' })),
        ];
        
        // 按时间排序，取最近10条
        allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentRecords(allRecords.slice(0, 10));
      } catch (error) {
        console.error('获取最近记录失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentRecords();
  }, []);

  // 表格列配置
  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <span style={{
          color: type === 'in' ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold',
        }}>
          {type === 'in' ? '入库' : '出库'}
        </span>
      ),
    },
    {
      title: '商品',
      dataIndex: ['product', 'name'],
      key: 'productName',
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
      title: '时间',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24, color: '#e2e8f0' }}>仪表盘</Title>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="商品总数"
              value={stats.totalProducts}
              prefix={<ShoppingCartOutlined />}
              styles={{ content: { color: '#6366f1' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="库存总量"
              value={stats.totalStock}
              prefix={<BarChartOutlined />}
              styles={{ content: { color: '#8b5cf6' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日入库"
              value={stats.todayIn}
              prefix={<InboxOutlined />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日出库"
              value={stats.todayOut}
              prefix={<ExportOutlined />}
              styles={{ content: { color: '#ff4d4f' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近记录表格 */}
      <Card title="最近出入库记录" variant="outlined">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={recentRecords}
            rowKey="id"
            pagination={false}
            scroll={{ x: 800 }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default Dashboard;
