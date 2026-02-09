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
API_BASE_URL = os.environ.get("PRINT_API_URL", "http://localhost:3001/api")
POLL_INTERVAL = int(os.environ.get("PRINT_POLL_INTERVAL", "5"))
DEFAULT_PRINTER = os.environ.get("CUPS_PRINTER", "default")

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


def create_print_content(job):
    """创建纯文本打印内容 - 固定宽度表格"""
    order = job.get("order", {})
    products = order.get("products", [])
    customer = order.get("customer", {})
    
    # 240mm纸张，每字符4mm，总宽度60字符
    # 表格总宽度 = 7个| + 6列内容 + 12个空格 = 58字符
    COL_NO = 3      # 序号
    COL_NAME = 12   # 品名
    COL_QTY = 5     # 数量
    COL_PRICE = 8   # 单价
    COL_AMT = 8     # 金额
    COL_REMARK = 3  # 备注
    
    # 计算表格总宽度
    content_width = COL_NO + COL_NAME + COL_QTY + COL_PRICE + COL_AMT + COL_REMARK
    table_width = 7 + content_width + 12  # 7个| + 内容 + 12个空格 = 58
    
    # 左侧边距 = (60 - 58) // 2 = 1
    left_margin = (PAGE_WIDTH - table_width) // 2
    page_start = ' ' * left_margin
    
    # 固定行宽度 = 左侧边距 + 表格宽度
    line_width = left_margin + table_width
    
    lines = []
    
    # ========== 标题区域 ==========
    title = "【 销 售 单 】"
    lines.append(center_text(title, PAGE_WIDTH))
    lines.append(center_text("=" * len(title), PAGE_WIDTH))
    
    # ========== 客户信息区域 ==========
    order_date = order.get('createdAt', '')
    if order_date:
        try:
            dt = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
            order_date = dt.strftime('%Y-%m-%d')
        except:
            pass
    
    # 客户名称和日期 - 固定宽度
    left_part1 = left_text(f"客户: {customer.get('name', '')}", 30)
    right_part1 = right_text(f"日期: {order_date}", 26)
    info_line1 = page_start + left_part1 + right_part1
    lines.append(info_line1[:line_width])  # 确保长度固定
    
    # 电话和单号 - 固定宽度
    left_part2 = left_text(f"电话: {customer.get('phone', '')}", 30)
    right_part2 = right_text(f"单号: {order.get('orderNumber', '')[:16]}", 26)
    info_line2 = page_start + left_part2 + right_part2
    lines.append(info_line2[:line_width])  # 确保长度固定
    
    # 空行
    lines.append(page_start)
    
    # 分隔线 - 固定长度
    lines.append(page_start + "-" * (table_width - 2))
    
    # ========== 表格区域 ==========
    # 表头（居中对齐）
    header_cells = [
        center_text('序号', COL_NO),
        center_text('品名', COL_NAME),
        center_text('数量', COL_QTY),
        center_text('单价', COL_PRICE),
        center_text('金额', COL_AMT),
        center_text('备注', COL_REMARK)
    ]
    header = page_start + "|" + "|".join(header_cells) + "|"
    lines.append(header[:line_width])  # 确保长度固定
    
    # 表头分隔线
    lines.append(page_start + "-" * (table_width - 2))
    
    # 商品明细 - 表身数据与表头严格对齐
    total_qty = 0
    for idx, item in enumerate(products, 1):
        product = item.get("product", {})
        name = product.get('name', '')[:COL_NAME]
        qty = str(item.get('quantity', 0))
        price = f"{float(item.get('price', 0)):.2f}"
        amount = f"{float(item.get('totalAmount', 0)):.2f}"
        remark = item.get('remark', '')[:COL_REMARK]
        
        # 数据行：所有字段居中对齐，与表头保持一致
        row_cells = [
            center_text(str(idx), COL_NO),      # 序号居中
            center_text(name, COL_NAME),         # 品名居中
            center_text(qty, COL_QTY),           # 数量居中
            center_text(price, COL_PRICE),       # 单价居中
            center_text(amount, COL_AMT),        # 金额居中
            center_text(remark, COL_REMARK)      # 备注居中
        ]
        row = page_start + "|" + "|".join(row_cells) + "|"
        lines.append(row[:line_width])  # 确保长度固定
        total_qty += item.get('quantity', 0)
    
    # 表尾分隔线
    lines.append(page_start + "-" * (table_width - 2))
    
    # ========== 汇总区域 ==========
    total_amount = float(order.get('totalAmount', 0))
    
    # 空行
    lines.append(page_start)
    
    # 汇总信息右对齐，固定宽度
    summary1 = right_text(f"总数: {total_qty}件", table_width - 2)
    summary2 = right_text(f"金额: ¥{total_amount:.2f}", table_width - 2)
    summary3 = right_text(f"大写: {number_to_chinese(total_amount)}", table_width - 2)
    
    lines.append(page_start + summary1)
    lines.append(page_start + summary2)
    lines.append(page_start + summary3)
    
    # ========== 底部区域 ==========
    lines.append(page_start)
    lines.append(page_start + "-" * (table_width - 2))
    lines.append(page_start)
    lines.append(page_start + "客户签名: ______________  日期: __________")
    lines.append(page_start)
    lines.append(page_start + "备注: 货物当面点清，出门概不退换")
    lines.append(page_start)
    lines.append(page_start + "服务电话: 138-0000-0000")
    lines.append(page_start)
    
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
                    "product": {"name": "苹果"},
                    "quantity": 10.5,
                    "price": 5.50,
                    "totalAmount": 57.75,
                    "remark": "新鲜"
                },
                {
                    "product": {"name": "香蕉"},
                    "quantity": 20,
                    "price": 3.00,
                    "totalAmount": 60.00,
                    "remark": ""
                },
                {
                    "product": {"name": "橙子"},
                    "quantity": 15.5,
                    "price": 4.50,
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
