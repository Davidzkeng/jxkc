# 调试指南 - 网络连接问题

## 错误信息

```
Error: SystemError (appServiceSDKScriptError)
{"errMsg":"webapi_getwxaasyncsecinfo:fail Failed to fetch"}
```

## 可能的原因

### 1. 微信开发者工具问题
这个错误通常是微信开发者工具内部的安全信息获取失败，可能与版本有关。

### 2. 网络请求被阻止
- 没有勾选"不校验合法域名"
- 开发环境配置问题

### 3. 后端服务未启动
- 确保运行了 `npm run server`

## 解决方案

### 方案1: 检查微信开发者工具设置

1. 打开微信开发者工具
2. 点击右上角"详情"
3. 在"本地设置"中，确保勾选：
   - ✅ **不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书**
   - ✅ **启用调试**

### 方案2: 使用测试页面

小程序中已经添加了一个测试页面来验证连接：

1. 在微信开发者工具中，修改 `app.json`，将测试页面设为首页：
```json
{
  "pages": [
    "pages/test/test",
    "pages/dashboard/dashboard",
    ...
  ]
}
```

2. 重新编译小程序
3. 查看测试页面的结果

### 方案3: 检查后端服务

在终端中运行：

```bash
# 确保在项目根目录
cd /home/david/study/jxkc/inventory-system

# 测试API是否正常
curl http://localhost:3001/api/health

# 应该返回:
{"status":"ok","message":"进销库存系统API服务运行正常"}
```

### 方案4: 检查API配置

打开 `miniprogram/app.js`，确认baseUrl配置正确：

```javascript
globalData: {
  // 如果后端在本地，使用:
  baseUrl: 'http://localhost:3001/api',

  // 如果在真机测试，需要使用局域网IP，例如:
  // baseUrl: 'http://192.168.1.100:3001/api',

  userInfo: null
}
```

### 方案5: 重启微信开发者工具

1. 完全关闭微信开发者工具
2. 重新打开
3. 重新导入项目

### 方案6: 更新微信开发者工具

检查是否有最新版本的微信开发者工具，更新到最新版本。

## 调试步骤

### 1. 查看控制台日志

在微信开发者工具中：
- 点击"调试器"
- 查看Console标签页
- 查找API请求的日志

现在API请求会输出详细日志：
```
API请求: {url: 'http://localhost:3001/api/products', method: 'GET', data: {}}
API响应: {url: 'http://localhost:3001/api/products', statusCode: 200, data: [...]}
```

### 2. 测试单个API

使用测试页面或直接在浏览器中访问：
- http://localhost:3001/api/health
- http://localhost:3001/api/products
- http://localhost:3001/api/categories

### 3. 检查网络面板

在微信开发者工具中：
- 点击"调试器"
- 查看Network标签页
- 查看请求的状态码和响应

## 常见问题

### Q1: 为什么出现"不校验合法域名"提示？

A: 这是微信小程序的安全机制。开发阶段需要手动开启此选项。

### Q2: 真机测试时无法连接？

A: 真机测试需要：
1. 电脑和手机在同一局域网
2. 使用电脑的局域网IP代替localhost
3. 后端需要监听0.0.0.0而不是127.0.0.1

### Q3: webapi_getwxaasyncsecinfo错误是什么？

A: 这是微信开发者工具的内部错误，通常不影响实际功能。如果API请求正常，可以忽略这个错误。

## 联系支持

如果以上方法都无法解决问题，请提供以下信息：

1. 微信开发者工具版本
2. 操作系统版本
3. 控制台的完整错误日志
4. 后端服务的运行状态
5. 测试页面的截图

## 快速检查清单

- [ ] 后端服务正在运行 (npm run server)
- [ ] 微信开发者工具已勾选"不校验合法域名"
- [ ] app.js中baseUrl配置正确
- [ ] 测试页面可以正常访问
- [ ] 控制台有API请求日志
- [ ] 浏览器可以直接访问API地址

## 验证后端服务

运行以下命令验证后端服务：

```bash
# 检查服务状态
curl http://localhost:3001/api/health

# 获取商品列表
curl http://localhost:3001/api/products

# 获取库存统计
curl http://localhost:3001/api/products/stats/stock
```

所有命令都应该返回JSON格式的数据。
