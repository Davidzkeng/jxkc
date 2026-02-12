#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
打印服务脚本 - 纯文本表格版
纸张宽度: 240mm (60字符，每字符4mm)
固定宽度表格，居中打印
"""

import os
import sys
import time
import tempfile
import subprocess
import requests
from datetime import datetime

# API配置
API_BASE_URL = os.environ.get("PRINT_API_URL", "https://store.dove521.cn/api")
POLL_INTERVAL = int(os.environ.get("PRINT_POLL_INTERVAL", "5"))
DEFAULT_PRINTER = os.environ.get("CUPS_PRINTER", "print_service_text")

# 纸张宽度240mm，每字符4mm，总宽度60字符
PAGE_WIDTH = 60


def cut_text(text, width):
    """截断文本到指定宽度"""
    text = str(text)
    if len(text) <= width:
        return text
    return text[:width-2] + '..'


def center_text(text, width):
    """居中显示文本，确保返回指定宽度的字符串"""
    text = str(text)
    text_len = len(text)
    if text_len >= width:
        return text[:width]
    left = (width - text_len) // 2
    right = width - left - text_len
    result = ' ' * left + text + ' ' * right
    # 确保返回的长度正确
    return result[:width]


def left_text(text, width):
    """左对齐文本"""
    text = str(text)
    if len(text) >= width:
        return cut_text(text, width)
    return text + ' ' * (width - len(text))


def right_text(text, width):
    """右对齐文本"""
    text = str(text)
    if len(text) >= width:
        return cut_text(text, width)
    return ' ' * (width - len(text)) + text


def display_width(text):
    """计算文本的显示宽度，中文字符算2个宽度"""
    width = 0
    for char in str(text):
        if '\u4e00' <= char <= '\u9fff':  # 中文字符范围
            width += 2
        else:
            width += 1
    return width


def pad_text(text, width, align='left'):
    """填充文本到指定显示宽度
    align: 'left' | 'right' | 'center'
    """
    text = str(text)
    current_width = display_width(text)
    
    if current_width >= width:
        # 如果超出宽度，需要截断
        result = ''
        current = 0
        for char in text:
            char_width = 2 if '\u4e00' <= char <= '\u9fff' else 1
            if current + char_width > width:
                break
            result += char
            current += char_width
        return result
    
    padding = width - current_width
    if align == 'left':
        return text + ' ' * padding
    elif align == 'right':
        return ' ' * padding + text
    else:  # center
        left = padding // 2
        right = padding - left
        return ' ' * left + text + ' ' * right


def create_print_content(job):
    """创建纯文本打印内容 - 90字符宽度，适合针式打印机"""
    order = job.get("order", {})
    products = order.get("products", [])
    customer = order.get("customer", {})
    
    # 90字符宽度模板
    PAGE_WIDTH = 90
    
    lines = []
    
    # ========== 标题区域 ==========
    lines.append("                                  销 售 单 据")
    lines.append("-" * PAGE_WIDTH)
    
    # ========== 订单信息 ==========
    order_date = ''
    order_time = ''
    if order.get('createdAt', ''):
        try:
            dt = datetime.fromisoformat(order.get('createdAt', '').replace('Z', '+00:00'))
            order_date = dt.strftime('%Y-%m-%d')
            order_time = dt.strftime('%H:%M:%S')
        except:
            pass
    
    order_number = order.get('orderNumber', '')
    lines.append(f"单号: {order_number:<30}日  期: {order_date:<15}时  间: {order_time}")
    lines.append("-" * PAGE_WIDTH)
    lines.append(f"客户名称: {customer.get('name', '')}")
    lines.append(f"联系电话: {customer.get('phone', '')}")
    lines.append("-" * PAGE_WIDTH)
    # 表头 - 只保留左右竖线
    lines.append(f"|{pad_text('序号', 6, 'center')}{pad_text('商品名称', 22, 'center')}{pad_text('单位', 12, 'center')}{pad_text('数量', 12, 'center')}{pad_text('单价(元)', 14, 'center')}{pad_text('金额(元)', 16, 'center')}|")
    lines.append("-" * PAGE_WIDTH)
    
    # ========== 商品明细 ==========
    total_items = len(products)  # 商品种类数
    total_amount = 0.0
    
    for idx, item in enumerate(products, 1):
        product = item.get("product", {})
        # 从productUnit获取单位名称（优先），兼容直接放在item上的unitName
        product_unit = item.get("productUnit", {})
        unit = product_unit.get('unitName', '') or item.get('unitName', '') or product.get('unitName', '') or product.get('unit', '') or '个'
        unit = unit[:4]

        name = product.get('name', '')
        qty = item.get('quantity', 0)
        price = float(item.get('price', 0))
        amount = float(item.get('totalAmount', 0))

        # 使用pad_text处理中英文混合对齐，只保留左右竖线
        line = f"|{pad_text(idx, 6, 'center')}{pad_text(name, 22, 'center')}{pad_text(unit, 12, 'center')}{pad_text(qty, 12, 'center')}{pad_text(f'{price:.2f}', 14, 'center')}{pad_text(f'{amount:.2f}', 16, 'center')}|"
        lines.append(line)
        
        total_amount += amount
    
    lines.append("-" * PAGE_WIDTH)
    lines.append(f"|{pad_text('', 6)}{pad_text('', 22)}{pad_text('', 12)}{pad_text('合计', 12, 'center')}{pad_text(f'{total_items}种', 14, 'center')}{pad_text(f'{total_amount:.2f}', 16, 'center')}|")
    lines.append("-" * PAGE_WIDTH)
    lines.append("")
    lines.append(f"客户签名: ________________")
    lines.append("")
    lines.append("")

    # 走纸
    lines.append("\n\n\n")
    
    # 合并所有行
    content = '\n'.join(lines)
    return content


def number_to_chinese(num):
    """数字转中文大写"""
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


def cups_print_text(printer_name, content):
    """使用CUPS打印纯文本 - GBK编码"""
    try:
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as f:
            # 使用GBK编码，跳过无法编码的字符
            encoded = content.encode('gbk', errors='ignore')
            f.write(encoded)
            f.write(b'\x0c')  # Form Feed 走纸
            f.flush()
            temp_file = f.name
        
        # 如果打印机名称为空，使用默认打印机
        if not printer_name or printer_name == 'default':
            cmd = ['lp', '-o', 'raw', '-o', 'media=24x14cm', temp_file]
        else:
            cmd = ['lp', '-d', printer_name, '-o', 'raw', '-o', 'media=24x14cm', temp_file]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        os.unlink(temp_file)
        
        if result.returncode == 0:
            return True, result.stdout.strip(), None
        else:
            return False, None, result.stderr
    
    except Exception as e:
        return False, None, str(e)


def get_pending_jobs():
    """获取待打印任务"""
    try:
        resp = requests.get(f"{API_BASE_URL}/print-jobs/pending", params={"limit": 10}, timeout=10)
        return resp.json().get("data", [])
    except Exception as e:
        print(f"获取任务失败: {e}")
        return []


def update_job_status(job_id, status, printer_name=None, error_message=None):
    """更新任务状态"""
    try:
        payload = {"status": status}
        if printer_name:
            payload["printerName"] = printer_name
        if error_message is not None:
            payload["errorMessage"] = error_message
        requests.put(f"{API_BASE_URL}/print-jobs/{job_id}/status", json=payload, timeout=10)
    except:
        pass


def process_print_job(job):
    """处理单个打印任务"""
    job_id = job['id']
    print(f"处理任务 #{job_id}")
    
    # 调试：打印数据结构
    order = job.get("order", {})
    products = order.get("products", [])
    if products:
        print(f"商品数据结构: {products[0].keys()}")
        print(f"商品字段名: {list(products[0].keys())}")
    
    try:
        update_job_status(job_id, 'processing', printer_name=DEFAULT_PRINTER)
        content = create_print_content(job)
        success, output, error = cups_print_text(DEFAULT_PRINTER, content)
        
        if success:
            print(f"打印成功")
            update_job_status(job_id, 'completed', printer_name=DEFAULT_PRINTER)
        else:
            print(f"打印失败: {error}")
            update_job_status(job_id, 'failed', error_message=error)
    
    except Exception as e:
        print(f"错误: {e}")
        update_job_status(job_id, 'failed', error_message=str(e))


def test_print_content():
    """测试打印内容输出，不实际打印"""
    # 模拟订单数据
    test_job = {
        "order": {
            "orderNumber": "SO202401010001",
            "createdAt": "2024-01-01T10:30:00Z",
            "totalAmount": 1234.56,
            "customer": {
                "name": "测试客户",
                "phone": "13800138000"
            },
            "products": [
                {
                    "product": {"name": "苹果醋"},
                    "quantity": 10.5,
                    "price": 5.50,
                    "unitName": "斤",
                    "totalAmount": 57.75,
                    "remark": "新鲜"
                },
                {
                    "product": {"name": "香蕉"},
                    "quantity": 20,
                    "price": 3.00,
                    "unitName": "斤",
                    "totalAmount": 60.00,
                    "remark": ""
                },
                {
                    "product": {"name": "橙子"},
                    "quantity": 15.5,
                    "price": 4.50,
                    "unitName": "斤",
                    "totalAmount": 69.75,
                    "remark": "甜"
                }
            ]
        }
    }
    
    content = create_print_content(test_job)
    print("=" * 70)
    print("打印内容预览（每行长度标记）:")
    print("=" * 70)
    for i, line in enumerate(content.split('\n')):
        print(f"{len(line):2d}| {line}")
    print("=" * 70)


def main():
    """主循环"""
    print("=" * 50)
    print("打印服务已启动 (纯文本表格版)")
    print("=" * 50)
    print(f"API: {API_BASE_URL}")
    print(f"打印机: {DEFAULT_PRINTER}")
    print()
    
    while True:
        try:
            jobs = get_pending_jobs()
            if jobs:
                print(f"发现 {len(jobs)} 个待打印任务")
                for job in jobs:
                    process_print_job(job)
                    time.sleep(2)
            else:
                print("没有待打印任务")
            time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            print("\n停止服务")
            sys.exit(0)
        except Exception as e:
            print(f"错误: {e}")
            time.sleep(POLL_INTERVAL)


if __name__ == '__main__':
    # 如果有参数 --test，则运行测试
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        test_print_content()
    else:
        main()
