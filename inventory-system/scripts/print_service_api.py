#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
打印服务脚本
通过REST API定时轮询打印任务并执行打印
"""

import os
import requests
import time
import sys
from datetime import datetime

# API配置 - 可通过环境变量修改
API_BASE_URL = os.environ.get("PRINT_API_URL", "http://localhost:3001/api")
POLL_INTERVAL = int(os.environ.get("PRINT_POLL_INTERVAL", "5"))  # 轮询间隔（秒）


def get_pending_print_jobs(limit=10):
    """获取待打印的任务列表"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/print-jobs/pending",
            params={"limit": limit},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])
    except requests.RequestException as e:
        print(f"获取打印任务失败: {e}")
        return []


def update_print_job_status(job_id, status, printer_name=None, error_message=None):
    """更新打印任务状态"""
    try:
        payload = {"status": status}
        if printer_name:
            payload["printerName"] = printer_name
        if error_message is not None:
            payload["errorMessage"] = error_message
        
        response = requests.put(
            f"{API_BASE_URL}/print-jobs/{job_id}/status",
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        return True
    except requests.RequestException as e:
        print(f"更新打印任务状态失败: {e}")
        return False


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


def format_print_content(job):
    """格式化打印内容"""
    order = job.get("order", {})
    products = order.get("products", [])
    customer = order.get("customer", {})
    
    lines = []
    
    # 标题
    lines.append("销售单".center(40))
    lines.append("")
    
    # 表头信息
    lines.append(f"客户名称: {customer.get('name', '')}")
    lines.append(f"电话: {customer.get('phone', '')}")
    lines.append(f"单号: {order.get('orderNumber', '')}")
    
    # 格式化日期
    order_date = order.get('createdAt', '')
    if order_date:
        try:
            dt = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
            order_date = dt.strftime('%Y.%m.%d')
        except:
            pass
    lines.append(f"日期: {order_date}")
    lines.append("")
    
    # 表格分隔线
    lines.append("-" * 40)
    
    # 表头
    lines.append(f"{'货号':<8}{'品名':<12}{'数量':>6}{'单价':>8}{'金额':>8}")
    lines.append("-" * 40)
    
    # 商品明细
    total_qty = 0
    for item in products:
        product = item.get("product", {})
        code = product.get('code', '')[:6]
        name = product.get('name', '')[:10]
        qty = item.get('quantity', 0)
        price = float(item.get('price', 0))
        amount = float(item.get('totalAmount', 0))
        
        lines.append(f"{code:<8}{name:<12}{qty:>6}{price:>8.2f}{amount:>8.2f}")
        total_qty += qty
    
    # 空行填充（至少8行）
    for _ in range(max(8 - len(products), 0)):
        lines.append("")
    
    lines.append("-" * 40)
    
    # 汇总信息
    total_amount = float(order.get('totalAmount', 0))
    lines.append(f"本页数量: {total_qty}")
    lines.append(f"本页货款: ¥{total_amount:.2f}")
    lines.append(f"本单货款(大写): {number_to_chinese(total_amount)}")
    lines.append(f"前欠款: ¥0.00")
    lines.append("")
    lines.append("注: 货物当面点清，过后概不负责。")
    lines.append("")
    lines.append("")
    
    return "\n".join(lines)


def print_receipt(content):
    """
    执行打印
    这里使用标准输出模拟打印，实际使用时需要根据打印机型号
    使用相应的打印库（如python-escpos、pyusb等）
    """
    print("=" * 50)
    print("开始打印...")
    print("=" * 50)
    print(content)
    print("=" * 50)
    print("打印完成")
    print("=" * 50)
    return True


def process_print_job(job):
    """处理单个打印任务"""
    job_id = job['id']
    order_id = job.get('order', {}).get('id')
    
    print(f"处理打印任务 #{job_id}, 订单 #{order_id}")
    
    try:
        # 更新状态为处理中
        update_print_job_status(job_id, 'processing', printer_name='DEFAULT_PRINTER')
        
        # 格式化打印内容
        content = format_print_content(job)
        
        # 执行打印
        success = print_receipt(content)
        
        if success:
            # 更新状态为完成
            update_print_job_status(job_id, 'completed')
            print(f"打印任务 #{job_id} 完成")
            return True
        else:
            raise Exception("打印失败")
            
    except Exception as e:
        error_msg = str(e)
        print(f"打印任务 #{job_id} 失败: {error_msg}")
        update_print_job_status(job_id, 'failed', error_message=error_msg)
        return False


def main():
    """主循环"""
    print("打印服务已启动...")
    print(f"API地址: {API_BASE_URL}")
    print("按 Ctrl+C 停止服务")
    print()
    
    while True:
        try:
            # 获取待打印任务
            jobs = get_pending_print_jobs()
            
            if jobs:
                print(f"发现 {len(jobs)} 个待打印任务")
                
                for job in jobs:
                    process_print_job(job)
                    time.sleep(1)
            else:
                print("没有待打印任务")
            
            # 等待下一次轮询
            time.sleep(POLL_INTERVAL)
            
        except KeyboardInterrupt:
            print("\n打印服务已停止")
            sys.exit(0)
        except Exception as e:
            print(f"错误: {e}")
            time.sleep(POLL_INTERVAL)


if __name__ == '__main__':
    main()