#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成打印预览图片"""
import os
import sys
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# 复制核心函数以避免导入问题
def number_to_chinese(num):
    if not num or num == 0:
        return "零元整"
    
    digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
    units = ['', '拾', '佰', '仟']
    big_units = ['', '万', '亿']
    
    num = float(num)
    integer_part = int(num)
    decimal_part = round((num - integer_part) * 100)
    
    if integer_part == 0:
        result = '零'
    else:
        result = ''
        num_str = str(integer_part)
        groups = []
        while num_str:
            groups.insert(0, num_str[-4:])
            num_str = num_str[:-4]
        
        for i, group in enumerate(groups):
            group_result = ''
            zero_flag = False
            group_zero = True
            for j, ch in enumerate(group):
                digit = int(ch)
                position = len(group) - 1 - j
                if digit == 0:
                    if not zero_flag and not group_zero:
                        group_result += digits[0]
                        zero_flag = True
                else:
                    zero_flag = False
                    group_zero = False
                    group_result += digits[digit] + units[position]
            if not group_zero:
                result += group_result + big_units[len(groups) - 1 - i]
            elif i < len(groups) - 1 and not result.endswith(digits[0]):
                result += digits[0]
    
    result += '元'
    jiao = decimal_part // 10
    fen = decimal_part % 10
    
    if jiao == 0 and fen == 0:
        result += '整'
    else:
        if jiao > 0:
            result += digits[jiao] + '角'
        if fen > 0:
            result += digits[fen] + '分'
    
    return result


def find_font():
    """查找可用的中文字体"""
    font_paths = [
        '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
        '/usr/share/fonts/wqy-zenhei/wqy-zenhei.ttc',
    ]
    
    for font_path in font_paths:
        if os.path.exists(font_path):
            print(f"找到字体: {font_path}")
            return font_path
    
    return None


def get_text_size(draw, text, font):
    """获取文本尺寸"""
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        return bbox[2] - bbox[0], bbox[3] - bbox[1]
    except:
        return draw.textsize(text, font=font)


def create_print_image(job):
    """创建打印图片"""
    order = job.get("order", {})
    products = order.get("products", [])
    customer = order.get("customer", {})
    
    dpi = 200
    img_width = int(24 * dpi / 2.54)
    img_height = int(14 * dpi / 2.54)
    
    img = Image.new('RGB', (img_width, img_height), 'white')
    draw = ImageDraw.Draw(img)
    
    # 加载字体
    title_font = None
    body_font = None
    small_font = None
    
    font_path = find_font()
    if font_path:
        try:
            title_font = ImageFont.truetype(font_path, 28)
            body_font = ImageFont.truetype(font_path, 16)
            small_font = ImageFont.truetype(font_path, 12)
            print(f"成功加载字体: {font_path}")
        except Exception as e:
            print(f"字体加载失败: {e}")
            title_font = ImageFont.load_default()
            body_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
    else:
        print("未找到中文字体，使用默认字体")
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    black = (0, 0, 0)
    
    # 边距
    margin = 50
    line_height = 22
    
    y = margin
    
    # 标题
    title_text = "销售单"
    title_width, title_height = get_text_size(draw, title_text, title_font)
    title_x = (img_width - title_width) // 2
    draw.text((int(title_x), int(y)), title_text, fill=black, font=title_font)
    y += line_height * 2
    
    # 客户信息
    customer_name = customer.get('name', '')
    customer_phone = customer.get('phone', '')
    order_date = order.get('createdAt', '')
    if order_date:
        try:
            dt = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
            order_date = dt.strftime('%Y-%m-%d')
        except:
            pass
    order_number = order.get('orderNumber', '')[:20]
    
    draw.text((margin, int(y)), "客户: " + customer_name, fill=black, font=body_font)
    
    date_text = "日期: " + order_date
    date_width, _ = get_text_size(draw, date_text, body_font)
    draw.text((int(img_width - margin - date_width), int(y)), date_text, fill=black, font=body_font)
    y += line_height
    
    draw.text((margin, int(y)), "电话: " + customer_phone, fill=black, font=body_font)
    
    order_text = "单号: " + order_number
    order_width, _ = get_text_size(draw, order_text, body_font)
    draw.text((int(img_width - margin - order_width), int(y)), order_text, fill=black, font=body_font)
    y += line_height
    
    # 实线分隔
    draw.line([(margin, int(y)), (img_width - margin, int(y))], fill=black, width=2)
    y += 8
    
    # 表格
    col_widths = [40, 280, 80, 140, 180]
    headers = ["序号", "品名", "数量", "单价", "金额"]
    
    x = margin + 5
    for i, header in enumerate(headers):
        header_width, _ = get_text_size(draw, header, body_font)
        cell_center = x + col_widths[i] // 2
        text_x = cell_center - header_width // 2
        draw.text((int(text_x), int(y)), header, fill=black, font=body_font)
        x += col_widths[i]
    y += line_height
    
    # 表头分隔线
    draw.line([(margin, int(y)), (img_width - margin, int(y))], fill=black, width=2)
    y += 5
    
    # 商品明细
    total_qty = 0
    for idx, item in enumerate(products, 1):
        product = item.get("product", {})
        name = product.get('name', '')[:12]
        qty = str(item.get('quantity', 0))
        price = f"{float(item.get('price', 0)):.2f}"
        amount = f"{float(item.get('totalAmount', 0)):.2f}"
        
        x = margin + 5
        
        # 序号
        idx_text = str(idx)
        idx_width, _ = get_text_size(draw, idx_text, body_font)
        draw.text((int(x + col_widths[0]//2 - idx_width//2), int(y)), idx_text, fill=black, font=body_font)
        x += col_widths[0]
        
        # 品名
        draw.text((int(x), int(y)), name, fill=black, font=body_font)
        x += col_widths[1]
        
        # 数量 - 右对齐
        qty_width, _ = get_text_size(draw, qty, body_font)
        draw.text((int(x + col_widths[2] - qty_width - 5), int(y)), qty, fill=black, font=body_font)
        x += col_widths[2]
        
        # 单价 - 右对齐
        price_width, _ = get_text_size(draw, price, body_font)
        draw.text((int(x + col_widths[3] - price_width - 5), int(y)), price, fill=black, font=body_font)
        x += col_widths[3]
        
        # 金额 - 右对齐
        amount_width, _ = get_text_size(draw, amount, body_font)
        draw.text((int(x + col_widths[4] - amount_width - 5), int(y)), amount, fill=black, font=body_font)
        
        y += line_height
        total_qty += item.get('quantity', 0)
        
        # 每行分隔线
        draw.line([(margin, int(y)), (img_width - margin, int(y))], fill=black, width=1)
    
    y += 8
    
    # 汇总
    draw.line([(margin, int(y)), (img_width - margin, int(y))], fill=black, width=2)
    y += 15
    
    total_amount = float(order.get('totalAmount', 0))
    
    draw.text((margin, int(y)), f"总数量: {total_qty}", fill=black, font=body_font)
    y += line_height
    
    draw.text((margin, int(y)), f"总金额: ¥{total_amount:.2f}", fill=black, font=body_font)
    y += line_height
    
    chinese_amount = number_to_chinese(total_amount)
    draw.text((margin, int(y)), f"大写: {chinese_amount}", fill=black, font=body_font)
    y += line_height * 2
    
    # 分隔线
    draw.line([(margin, int(y)), (img_width - margin, int(y))], fill=black, width=2)
    y += 20
    
    # 底部
    draw.text((margin, int(y)), "服务电话:", fill=black, font=body_font)
    
    sign_x = img_width - margin - 150
    draw.text((int(sign_x), int(y)), "客户签名:", fill=black, font=body_font)
    y += line_height
    draw.line([(int(sign_x), int(y)), (img_width - margin, int(y))], fill=black, width=1)
    y += 25
    
    # 备注
    draw.line([(margin, int(y)), (img_width - margin, int(y))], fill=black, width=1)
    y += 10
    draw.text((margin, int(y)), "备注: 货物当面点清，过后概不负责。", fill=black, font=small_font)
    
    return img


# 模拟打印任务数据
job = {
    "order": {
        "orderNumber": "SO1770548319275",
        "totalAmount": "500.00",
        "createdAt": "2026-02-08T10:58:39.277Z",
        "customer": {
            "name": "测试客户",
            "phone": "13800138000"
        },
        "products": [
            {
                "quantity": 5,
                "price": "100.00",
                "totalAmount": "500.00",
                "product": {
                    "name": "测试商品"
                }
            }
        ]
    }
}

print("生成预览图片...")
img = create_print_image(job)
preview_path = "/home/david/study/jxkc/inventory-system/scripts/print_preview.png"
img.save(preview_path, 'PNG', dpi=(200, 200))
print(f"预览图片已保存: {preview_path}")
print(f"图片尺寸: {img.size[0]}x{img.size[1]} pixels")
