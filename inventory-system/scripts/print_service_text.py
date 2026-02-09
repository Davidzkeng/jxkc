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
    """居中显示文本"""
    text = str(text)
    if len(text) >= width:
        return cut_text(text, width)
    left = (width - len(text)) // 2
    return ' ' * left + text + ' ' * (width - left - len(text))


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
    # 表格设计：总宽度56字符（包含边框），左右各留2字符边距
    COL_NO = 4      # 序号
    COL_NAME = 18   # 品名
    COL_QTY = 6     # 数量
    COL_PRICE = 10  # 单价
    COL_AMT = 10    # 金额
    COL_REMARK = 4  # 备注
    
    # 表格总宽度计算
    # | 序号 | 品名 | 数量 | 单价 | 金额 | 备注 |
    # 7个分隔符 + 6列内容 + 12个空格（每列前后各1空格）
    content_width = COL_NO + COL_NAME + COL_QTY + COL_PRICE + COL_AMT + COL_REMARK
    separator_width = 7   # 7个 |
    space_width = 12      # 6列 × 2空格
    table_width = content_width + separator_width + space_width  # = 71? 不对
    
    # 重新计算：实际格式是 "| 内容 | 内容 |"
    # 每个单元格：| + 空格 + 内容 + 空格
    # 总宽度 = 7个| + 6列内容 + 12个空格 = 7 + 52 + 12 = 71，这超过了60
    
    # 调整列宽，使总宽度 <= 56（留出边距）
    COL_NO = 4      # 序号
    COL_NAME = 14   # 品名
    COL_QTY = 5     # 数量
    COL_PRICE = 8   # 单价
    COL_AMT = 8     # 金额
    COL_REMARK = 4  # 备注
    
    # 总宽度 = 7 + (4+14+5+8+8+4) + 12 = 7 + 43 + 12 = 62，还是超了
    # 再调整
    COL_NO = 3      # 序号
    COL_NAME = 12   # 品名
    COL_QTY = 5     # 数量
    COL_PRICE = 8   # 单价
    COL_AMT = 8     # 金额
    COL_REMARK = 3  # 备注
    
    # 总宽度 = 7 + 39 + 12 = 58，可以
    content_width = COL_NO + COL_NAME + COL_QTY + COL_PRICE + COL_AMT + COL_REMARK
    table_width = 7 + content_width + 12  # 7个| + 内容 + 12个空格
    
    # 左侧边距 = (60 - 58) // 2 = 1
    left_margin = (PAGE_WIDTH - table_width) // 2
    page_start = ' ' * left_margin
    
    lines = []
    
    # ========== 标题区域 ==========
    title = "【 销 售 单 】"
    lines.append(' ' * ((PAGE_WIDTH - len(title)) // 2) + title)
    lines.append(' ' * ((PAGE_WIDTH - len(title)) // 2) + "=" * len(title))
    
    # ========== 客户信息区域 ==========
    order_date = order.get('createdAt', '')
    if order_date:
        try:
            dt = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
            order_date = dt.strftime('%Y-%m-%d')
        except:
            pass
    
    # 客户名称和日期
    left_info1 = f"客户: {customer.get('name', '')}"
    right_info1 = f"日期: {order_date}"
    info_line1 = page_start + left_info1 + ' ' * (table_width - len(left_info1) - len(right_info1) - 2) + right_info1
    lines.append(info_line1)
    
    # 电话和单号
    left_info2 = f"电话: {customer.get('phone', '')}"
    right_info2 = f"单号: {order.get('orderNumber', '')[:16]}"
    info_line2 = page_start + left_info2 + ' ' * (table_width - len(left_info2) - len(right_info2) - 2) + right_info2
    lines.append(info_line2)
    
    # 分隔线
    lines.append("")
    lines.append(page_start + "-" * (table_width - 2))
    
    # ========== 表格区域 ==========
    # 表头（居中对齐）
    header = page_start + f"|{center_text('序号', COL_NO)}|{center_text('品名', COL_NAME)}|{center_text('数量', COL_QTY)}|{center_text('单价', COL_PRICE)}|{center_text('金额', COL_AMT)}|{center_text('备注', COL_REMARK)}|"
    lines.append(header)
    
    # 表头分隔线
    lines.append(page_start + "-" * (table_width - 2))
    
    # 商品明细
    total_qty = 0
    for idx, item in enumerate(products, 1):
        product = item.get("product", {})
        name = product.get('name', '')[:COL_NAME-1]
        qty = str(item.get('quantity', 0))
        price = f"{float(item.get('price', 0)):.2f}"
        amount = f"{float(item.get('totalAmount', 0)):.2f}"
        remark = item.get('remark', '')[:COL_REMARK-1]
        
        # 数据行：序号右对齐，品名左对齐，数值右对齐，备注左对齐
        row = page_start + f"|{right_text(str(idx), COL_NO)}|{left_text(name, COL_NAME)}|{right_text(qty, COL_QTY)}|{right_text(price, COL_PRICE)}|{right_text(amount, COL_AMT)}|{left_text(remark, COL_REMARK)}|"
        lines.append(row)
        total_qty += item.get('quantity', 0)
    
    # 表尾分隔线
    lines.append(page_start + "-" * (table_width - 2))
    
    # ========== 汇总区域 ==========
    total_amount = float(order.get('totalAmount', 0))
    
    summary1 = f"总数: {total_qty}件"
    summary2 = f"金额: ¥{total_amount:.2f}"
    summary3 = f"大写: {number_to_chinese(total_amount)}"
    
    # 汇总信息右对齐
    lines.append("")
    lines.append(page_start + right_text(summary1, table_width - 2))
    lines.append(page_start + right_text(summary2, table_width - 2))
    lines.append(page_start + right_text(summary3, table_width - 2))
    
    # ========== 底部区域 ==========
    lines.append("")
    lines.append(page_start + "-" * (table_width - 2))
    lines.append("")
    lines.append(page_start + "客户签名: ______________  日期: __________")
    lines.append("")
    lines.append(page_start + "备注: 货物当面点清，出门概不退换")
    lines.append("")
    lines.append(page_start + "服务电话: 138-0000-0000")
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
    main()
