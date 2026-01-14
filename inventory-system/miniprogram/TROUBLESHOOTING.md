# 快速故障排查

## 当前错误

```
Error: SystemError (appServiceSDKScriptError)
{"errMsg":"webapi_getwxaasyncsecinfo:fail Failed to fetch"}
```

**注意**: 这个错误是微信开发者工具的内部警告，**通常不影响实际功能**。

## 立即检查清单

### 1. 后端服务是否运行？✅
```bash
# 在终端运行
curl http://localhost:3001/api/health
```
预期返回: `{"status":"ok","message":"进销库存系统API服务运行正常"}`

### 2. 微信开发者工具设置？❓
- 点击右上角"详情"
- "本地设置"中是否勾选：
  - ☐ 不校验合法域名
  - ☐ 启用调试

### 3. API地址配置？❓
打开 `miniprogram/app.js`，检查:
```javascript
baseUrl: 'http://localhost:3001/api'
```

### 4. 测试页面？

打开测试页面查看连接状态:
- 小程序首页现在会显示测试页面
- 查看连接状态和错误信息

## 快速修复步骤

### 步骤1: 重启后端服务
```bash
# 停止当前服务 (Ctrl+C)
cd /home/david/study/jxkc/inventory-system
npm run server
```

### 步骤2: 重新编译小程序
1. 在微信开发者工具中点击"编译"按钮
2. 清除缓存并重新编译

### 步骤3: 检查设置
1. 点击"详情" → "本地设置"
2. 确保勾选"不校验合法域名"
3. 确保勾选"启用调试"

### 步骤4: 查看测试页面
1. 小程序会打开测试页面
2. 查看"服务器状态"
3. 如果显示"连接失败"，点击"重试"

## 临时解决方案

### 如果webapi_getwxaasyncsecinfo错误持续出现：

这个错误通常**可以忽略**，只要：
- 后端服务正常运行
- 测试页面显示"连接正常"
- 其他功能可以正常使用

这个错误是微信开发者工具的内部问题，不影响小程序的实际功能。

## 逐步排查

### Level 1: 基础检查
```bash
# 检查后端服务
curl http://localhost:3001/api/health

# 检查API响应
curl http://localhost:3001/api/products
```

### Level 2: 浏览器测试
在浏览器中打开:
- http://localhost:3001/api/health
- http://localhost:3001/api/products

应该看到JSON格式的响应。

### Level 3: 小程序测试
1. 打开测试页面
2. 查看连接状态
3. 查看控制台日志

### Level 4: 网络抓包
在微信开发者工具中:
1. 点击"调试器"
2. 查看"Network"标签
3. 查看请求的详细情况

## 如果还是不行

### 方案A: 使用不同的开发工具
- 尝试不同版本的微信开发者工具
- 尝试真机预览（需配置局域网IP）

### 方案B: 修改API配置
如果是真机测试，需要:
```javascript
// 修改 miniprogram/app.js
baseUrl: 'http://192.168.1.100:3001/api'  // 使用你的电脑IP
```

### 方案C: 完全重启
1. 关闭后端服务
2. 关闭微信开发者工具
3. 重新启动后端
4. 重新打开微信开发者工具
5. 重新编译

## 验证修复成功的标志

✅ 后端服务正常响应
✅ 测试页面显示"连接正常"
✅ 可以获取商品列表
✅ 可以进行入库/出库操作

## 联系方式

如果以上方法都无法解决问题，请提供:
1. 微信开发者工具版本
2. 控制台完整错误截图
3. 测试页面截图
4. 后端服务运行状态

---

**记住**: `webapi_getwxaasyncsecinfo`错误通常是微信开发者工具的内部问题，如果API请求正常工作，可以忽略这个错误。
