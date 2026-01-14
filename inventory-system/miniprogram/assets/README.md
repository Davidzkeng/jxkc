# 图标资源说明

微信小程序底部导航栏需要以下图标文件：

## 必需的图标文件

- `home.png` - 首页图标（未选中）
- `home-active.png` - 首页图标（选中）
- `product.png` - 商品图标（未选中）
- `product-active.png` - 商品图标（选中）
- `in.png` - 入库图标（未选中）
- `in-active.png` - 入库图标（选中）
- `out.png` - 出库图标（未选中）
- `out-active.png` - 出库图标（选中）

## 图标规格

- 尺寸: 81px × 81px
- 格式: PNG
- 大小: 小于40kb

## 如何获取图标

### 方法1: 使用在线图标库
- Iconfont (https://www.iconfont.cn/)
- Flaticon (https://www.flaticon.com/)

### 方法2: 使用设计工具
- Figma
- Sketch
- Adobe Illustrator

### 方法3: 使用纯色图标
可以下载以下纯色图标模板：
- 未选中状态: 灰色 (#999999)
- 选中状态: 蓝色 (#1890ff)

## 临时解决方案

如果暂时没有图标，可以：
1. 在 `app.json` 中注释掉 `iconPath` 和 `selectedIconPath` 配置
2. 使用微信小程序内置图标（需要修改为使用自定义tabBar）

## 示例配置

如果暂时不想配置图标，可以修改 `app.json`：

```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#1890ff",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/dashboard/dashboard",
        "text": "首页"
      },
      {
        "pagePath": "pages/products/products",
        "text": "商品"
      },
      {
        "pagePath": "pages/in-records/in-records",
        "text": "入库"
      },
      {
        "pagePath": "pages/out-records/out-records",
        "text": "出库"
      }
    ]
  }
}
```

注意：去掉iconPath和selectedIconPath后，tabBar会只显示文字，没有图标。
