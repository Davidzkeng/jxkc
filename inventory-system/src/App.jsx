import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Button } from 'antd';
import {
  DashboardOutlined,
  ProductOutlined,
  UnorderedListOutlined,
  UserOutlined,
  SolutionOutlined,
  InboxOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import './App.css';

// 导入页面组件
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import CategoryManagement from './pages/CategoryManagement';
import CustomerManagement from './pages/CustomerManagement';
import SupplierManagement from './pages/SupplierManagement';
import InRecordManagement from './pages/InRecordManagement';
import OutRecordManagement from './pages/OutRecordManagement';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

// 导航菜单项配置
const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/products', icon: <ProductOutlined />, label: '商品管理' },
  { key: '/categories', icon: <UnorderedListOutlined />, label: '类别管理' },
  { key: '/customers', icon: <UserOutlined />, label: '客户管理' },
  { key: '/suppliers', icon: <SolutionOutlined />, label: '供应商管理' },
  { key: '/in-records', icon: <InboxOutlined />, label: '入库记录' },
  { key: '/out-records', icon: <ExportOutlined />, label: '出库记录' },
];

// 顶部导航栏组件
const AppHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Title level={3} style={{ margin: 0, color: '#e2e8f0' }}>
          欢迎使用进销库存系统
        </Title>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button onClick={() => navigate('/')} type={location.pathname === '/' ? 'primary' : 'default'}>
            仪表盘
          </Button>
          <Button onClick={() => navigate('/products')} type={location.pathname === '/products' ? 'primary' : 'default'}>
            商品管理
          </Button>
          <Button onClick={() => navigate('/categories')} type={location.pathname === '/categories' ? 'primary' : 'default'}>
            类别管理
          </Button>
          <Button onClick={() => navigate('/customers')} type={location.pathname === '/customers' ? 'primary' : 'default'}>
            客户管理
          </Button>
          <Button onClick={() => navigate('/suppliers')} type={location.pathname === '/suppliers' ? 'primary' : 'default'}>
            供应商管理
          </Button>
          <Button onClick={() => navigate('/in-records')} type={location.pathname === '/in-records' ? 'primary' : 'default'}>
            入库记录
          </Button>
          <Button onClick={() => navigate('/out-records')} type={location.pathname === '/out-records' ? 'primary' : 'default'}>
            出库记录
          </Button>
        </div>
      </div>
    </Header>
  );
};

// 侧边栏组件
const AppSider = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(location.pathname);

  const handleMenuClick = (e) => {
    const { key } = e;
    setSelectedKey(key);
    navigate(key);
  };

  return (
    <Sider className="app-sider">
      <div className="logo">
        <h2>进销库存系统</h2>
      </div>
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[selectedKey]}
        onClick={handleMenuClick}
        items={menuItems}
        className="app-menu"
        style={{ borderRight: 0, background: 'transparent', color: '#e2e8f0' }}
      />
    </Sider>
  );
};

// 主应用组件
const AppContent = () => {
  return (
    <Layout className="app-layout-main">
      {/* 顶部导航栏 */}
      <AppHeader />
        
      {/* 主内容区域 */}
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/categories" element={<CategoryManagement />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/suppliers" element={<SupplierManagement />} />
          <Route path="/in-records" element={<InRecordManagement />} />
          <Route path="/out-records" element={<OutRecordManagement />} />
        </Routes>
      </Content>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <Layout className="app-layout">
        {/* 侧边栏 */}
        <AppSider />
        
        {/* 主内容 */}
        <AppContent />
      </Layout>
    </Router>
  );
}

export default App;
