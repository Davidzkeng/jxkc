# 连接问题解决方案

## 问题说明

您遇到的错误：
```
Error: SystemError (appServiceSDKScriptError)
{"errMsg":"webapi_getwxaasyncsecinfo:fail Failed to fetch"}
```

这是**微信开发者工具的内部警告**，通常**不影响实际使用**。

## 解决方法

### 方法1: 忽略此错误（推荐）

如果：
- 后端服务正常运行（已验证✅）
- 测试页面显示"连接正常"
- 可以正常使用小程序功能

**那么可以忽略这个警告，继续使用小程序。**

### 方法2: 重新配置微信开发者工具

1. 打开微信开发者工具
2. 点击右上角"详情"
3. 在"本地设置"中，**确保勾选**：
   - ✅ **不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书**
   - ✅ **启用调试**

4. 点击"编译"按钮重新编译

### 方法3: 使用测试页面验证连接

小程序首页现在是测试页面，可以查看：
- API地址配置
- 服务器连接状态
- 测试获取商品数据

如果显示"连接失败"：
1. 确认后端服务运行: `npm run server`
2. 点击"重试"按钮
3. 查看控制台日志

### 方法4: 验证后端服务

在终端运行：
```bash
cd /home/david/study/jxkc/inventory-system
curl http://localhost:3001/api/health
```

应该返回：
```json
{"status":"ok","message":"进销库存系统API服务运行正常"}
```

## 快速检查清单

运行以下命令逐一检查：

```bash
# 1. 检查后端服务
curl http://localhost:3001/api/health
# 预期: {"status":"ok",...}

# 2. 检查商品API
curl http://localhost:3001/api/products
# 预期: [] (空数组或商品列表)

# 3. 检查统计API
curl http://localhost:3001/api/products/stats/stock
# 预期: {"totalProducts":0,"totalStock":0,...}
```

## 如果测试页面显示"连接正常"

**恭喜！连接成功！** 可以正常使用小程序了。

## 如果测试页面显示"连接失败"

按以下步骤操作：

### 步骤1: 确保后端运行
```bash
cd /home/david/study/jxkc/inventory-system
npm run server
```

### 步骤2: 检查微信开发者工具设置
- 详情 → 本地设置
- 勾选"不校验合法域名"

### 步骤3: 重新编译
- 点击"编译"按钮
- 或使用快捷键 Ctrl+B

### 步骤4: 查看测试页面
- 查看连接状态
- 查看控制台日志
- 点击"重试"

## 真机测试

如果要在真机上测试：

1. 确保手机和电脑在同一WiFi网络
2. 修改 `miniprogram/app.js`:
```javascript
baseUrl: 'http://192.168.1.100:3001/api'
// 替换为你的电脑IP地址
```

3. 后端需要监听所有网络接口（修改 `src/server/server.js`）:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

## 重要提示

**`webapi_getwxaasyncsecinfo` 错误通常是微信开发者工具的内部问题**

只要：
- ✅ 测试页面显示"连接正常"
- ✅ 可以正常使用小程序功能
- ✅ API请求返回正常数据

**就可以忽略这个警告，继续使用小程序。**

## 需要帮助？

如果问题仍未解决，请查看：
- `DEBUG_GUIDE.md` - 详细调试指南
- `TROUBLESHOOTING.md` - 故障排查步骤

或者提供以下信息：
1. 微信开发者工具版本
2. 测试页面截图
3. 控制台完整错误日志
4. 后端服务运行状态

---

**当前状态**: 后端服务运行正常 ✅
**下一步**: 查看测试页面确认连接状态
