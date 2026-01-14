# 进销库存系统 - 微信小程序版

这是进销库存系统的微信小程序版本，复用了现有的Express后端API。

## 项目结构

```
miniprogram/
├── app.js              # 小程序主入口
├── app.json            # 小程序配置文件
├── app.wxss            # 全局样式文件
├── utils/
│   ├── api.js          # API请求封装
│   └── util.js         # 工具函数
└── pages/
    ├── dashboard/      # 仪表盘页面
    ├── products/       # 商品管理页面
    ├── categories/     # 类别管理页面
    ├── customers/      # 客户管理页面
    ├── suppliers/      # 供应商管理页面
    ├── in-records/     # 入库记录页面
    └── out-records/    # 出库记录页面
```

## 功能特性

- **仪表盘**: 显示库存统计、最近商品
- **商品管理**: 商品的增删改查
- **类别管理**: 商品类别的增删改查
- **客户管理**: 客户信息的增删改查
- **供应商管理**: 供应商信息的增删改查
- **入库记录**: 创建和管理入库单据
- **出库记录**: 创建和管理出库单据

## 使用前准备

### 1. 配置后端API地址

在 `miniprogram/app.js` 中修改 `baseUrl` 为你实际的后端API地址：

```javascript
globalData: {
  // 修改为你的后端API地址
  baseUrl: 'http://localhost:3001/api',
  userInfo: null
}
```

### 2. 确保后端服务运行

确保你的Express后端服务在运行，并监听在正确的端口上。

```bash
# 在项目根目录运行
npm run server
```

### 3. 配置小程序开发工具

1. 下载并安装微信开发者工具
2. 打开微信开发者工具，选择"导入项目"
3. 项目目录选择 `miniprogram` 文件夹
4. AppID 可以使用测试号
5. 点击"导入"完成项目导入

### 4. 配置服务器域名

如果你要在真机上测试，需要在微信公众平台配置服务器域名：
- 登录微信公众平台
- 进入"开发" -> "开发设置"
- 在"服务器域名"中配置request合法域名

开发阶段可以在微信开发者工具中开启"不校验合法域名"选项。

## 开发说明

### API请求封装

所有API请求都封装在 `utils/api.js` 中，使用Promise封装wx.request。

```javascript
const api = require('../../utils/api');

// 获取商品列表
api.getProducts().then(res => {
  console.log(res.data);
});

// 创建商品
api.createProduct({
  name: '商品名称',
  code: 'CODE001',
  categoryId: 1,
  price: 99.99,
  stock: 100
}).then(res => {
  console.log('创建成功');
});
```

### 工具函数

`utils/util.js` 提供了常用的工具函数：

```javascript
const util = require('../../utils/util');

// 格式化日期
util.formatDate(dateString);

// 格式化金额
util.formatMoney(amount);

// 显示成功提示
util.showSuccess('操作成功');

// 显示错误提示
util.showError('操作失败');

// 显示确认对话框
util.showConfirm('确定删除吗？', () => {
  // 确认后的回调
});
```

### 页面结构

每个页面包含4个文件：
- `.js` - 页面逻辑
- `.wxml` - 页面结构
- `.wxss` - 页面样式
- `.json` - 页面配置

## 注意事项

1. **网络请求**: 小程序中所有HTTP请求必须使用HTTPS（开发阶段可例外）
2. **数据格式**: 后端返回的数据格式要与前端一致
3. **图片资源**: 底部导航栏的图标需要自行添加到 `miniprogram/assets/` 目录
4. **权限管理**: 需要根据实际需求添加用户认证和权限控制

## 扩展功能建议

- 用户登录和权限管理
- 扫码功能（扫码入库/出库）
- 数据导出功能
- 消息推送
- 库存预警通知

## 技术栈

- 微信小程序原生框架
- Express后端API
- SQLite数据库（通过Prisma ORM）
