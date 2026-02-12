#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
打印服务脚本
通过REST API定时轮询打印任务并使用CUPS执行打印
"""

import os
import sys
import time
import tempfile
import subprocess
from datetime import datetime

# API配置 - 可通过环境变量修改
API_BASE_URL = os.environ.get("PRINT_API_URL", "http://localhost:3001/api")
POLL_INTERVAL = int(os.environ.get("PRINT_POLL_INTERVAL", "5"))  # 轮询间隔（秒）
DEFAULT_PRINTER = os.environ.get("CUPS_PRINTER", "default")  # 默认打印机名称
CUPS_SERVER = os.environ.get("CUPS_SERVER", "localhost")  # CUPS服务器地址


def cups_print(printer_name, content):
    """
    使用CUPS lp命令打印内容
    
    Args:
        printer_name: 打印机名称
        content: 打印内容
    
    Returns:
        (success, job_id, error_msg)
    """
    try:
        # 将UTF-8内容转换为GBK编码（EPSON针式打印机需要GBK编码）
        content_gbk = content.encode('gbk', errors='ignore')
        
        # 添加Form Feed (FF)命令，告诉打印机打印完成可以出纸
        # FF = 0x0C
        ff_command = b'\x0C'
        
        # 创建临时文件写入GBK编码内容
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.txt', delete=False) as f:
            f.write(content_gbk)
            f.write(ff_command)  # 添加换页命令
            temp_file = f.name
        
        # 使用lp命令打印
        cmd = [
            'lp',
            '-d', printer_name,
            '-o', 'raw',  # 纯文本模式
            '-o', 'cpi=12',  # 每英寸12字符
            '-o', 'lpi=6',   # 每英寸6行
            '-o', 'page-left=72',  # 左边距0.5英寸
            '-o', 'page-right=72',  # 右边距
            '-o', 'page-top=72',   # 上边距
            '-o', 'page-bottom=72',  # 下边距
            temp_file
        ]
        
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=30
        )
        os.unlink(temp_file)
        
        if result.returncode == 0:
            job_id = result.stdout.decode('utf-8', errors='replace').strip()
            return True, job_id, None
        else:
            return False, None, result.stderr.decode('utf-8', errors='replace')
    
    except subprocess.TimeoutExpired:
        return False, None, "打印超时"
    except Exception as e:
        return False, None, str(e)


def get_cups_printers():
    """获取可用的CUPS打印机列表"""
    try:
        result = subprocess.run(
            ['lpstat', '-v'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=10
        )
        if result.returncode == 0:
            stdout_text = result.stdout.decode('utf-8', errors='replace')
            printers = []
            for line in stdout_text.split('\n'):
                if 'device for' in line:
                    parts = line.split('device for')
                    if len(parts) >= 2:
                        printer_name = parts[0].strip().split()[-1]
                        printers.append(printer_name)
            return printers
        return []
    except Exception as e:
        print(f"获取打印机列表失败: {e}")
        return []


def format_print_content(job):
    """格式化打印内容 - 22cm x 14cm 纸张，居中打印"""
    order = job.get("order", {})
    products = order.get("products", [])
    customer = order.get("customer", {})
    
    # 表格宽度定义
    col_no = 4      # 序号
    col_name = 14   # 品名
    col_qty = 6     # 数量
    col_price = 10  # 单价
    col_amount = 10 # 金额
    total_width = col_no + col_name + col_qty + col_price + col_amount + 6  # +6 是分隔符
    
    # 边框线
    border = "+" + "-" * (total_width - 2) + "+"
    separator = "+" + "-" * (col_no + 2) + "+" + "-" * (col_name + 2) + "+" + "-" * (col_qty + 2) + "+" + "-" * (col_price + 2) + "+" + "-" * (col_amount + 2) + "+"
    
    lines = []
    
    # 标题
    lines.append("")
    lines.append("=" * total_width)
    lines.append(" " * ((total_width - 6) // 2) + "销售单")
    lines.append("=" * total_width)
    
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
    
    lines.append(border)
    lines.append(f"| 客户: {customer_name:<24} | 日期: {order_date} |")
    lines.append(f"| 电话: {customer_phone:<24} | 单号: {order_number:<14} |")
    lines.append(separator)
    
    # 表头
    header = f"| {'序号':^{col_no}} | {'品名':^{col_name}} | {'数量':^{col_qty}} | {'单价':^{col_price}} | {'金额':^{col_amount}} |"
    lines.append(header)
    lines.append(separator)
    
    # 商品明细
    total_qty = 0
    for idx, item in enumerate(products, 1):
        product = item.get("product", {})
        name = (product.get('name', '') + ' ' * col_name)[:col_name]
        qty = item.get('quantity', 0)
        price = float(item.get('price', 0))
        amount = float(item.get('totalAmount', 0))
        
        row = f"| {str(idx):^{col_no}} | {name:<{col_name}} | {str(qty):^{col_qty}} | {price:^{col_price}.2f} | {amount:^{col_amount}.2f} |"
        lines.append(row)
        total_qty += qty
    
    # 空行填充
    empty_row = f"| {' ':^{col_no}} | {' ':^{col_name}} | {' ':^{col_qty}} | {' ':^{col_price}} | {' ':^{col_amount}} |"
    for _ in range(max(4 - len(products), 0)):
        lines.append(empty_row)
    
    lines.append(separator)
    
    # 汇总信息
    total_amount = float(order.get('totalAmount', 0))
    lines.append(f"| 总数量: {total_qty:<34} |")
    lines.append(f"| 总金额: ¥{total_amount:<34.2f} |")
    lines.append(f"| 大写: {number_to_chinese(total_amount):<36} |")
    lines.append(border)
    
    # 底部信息
    lines.append("| 服务电话:                             客户签名:      |")
    lines.append("|                                          __________   |")
    lines.append("=" * total_width)
    lines.append("| 备注: 货物当面点清，过后概不负责。                   |")
    lines.append("=" * total_width)
    lines.append("")
    
    return "\n".join(lines)


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


def process_print_job(job, api_client):
    """处理单个打印任务"""
    job_id = job['id']
    order_id = job.get('order', {}).get('id')
    
    print(f"处理打印任务 #{job_id}, 订单 #{order_id}")
    
    try:
        # 更新状态为处理中
        api_client.update_status(job_id, 'processing', printer_name=DEFAULT_PRINTER)
        
        # 格式化打印内容
        content = format_print_content(job)
        
        # 使用CUPS打印
        success, job_id_or_error, error_msg = cups_print(DEFAULT_PRINTER, content)
        
        if success:
            print(f"打印成功, CUPS Job ID: {job_id_or_error}")
            # 更新状态为完成
            api_client.update_status(job_id, 'completed', printer_name=DEFAULT_PRINTER)
            print(f"打印任务 #{job_id} 完成")
            return True
        else:
            print(f"打印失败: {error_msg}")
            api_client.update_status(job_id, 'failed', error_message=error_msg)
            return False
            
    except Exception as e:
        error_msg = str(e)
        print(f"打印任务 #{job_id} 失败: {error_msg}")
        api_client.update_status(job_id, 'failed', error_message=error_msg)
        return False


class APIClient:
    """API客户端"""
    
    def __init__(self, base_url):
        self.base_url = base_url
    
    def get_pending_jobs(self, limit=10):
        """获取待打印任务"""
        import requests
        try:
            response = requests.get(
                f"{self.base_url}/print-jobs/pending",
                params={"limit": limit},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except Exception as e:
            print(f"获取打印任务失败: {e}")
            return []
    
    def update_status(self, job_id, status, printer_name=None, error_message=None):
        """更新打印任务状态"""
        import requests
        try:
            payload = {"status": status}
            if printer_name:
                payload["printerName"] = printer_name
            if error_message is not None:
                payload["errorMessage"] = error_message
            
            response = requests.put(
                f"{self.base_url}/print-jobs/{job_id}/status",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"更新打印任务状态失败: {e}")
            return False


def main():
    """主循环"""
    print("=" * 50)
    print("打印服务已启动 (CUPS版)")
    print("=" * 50)
    print(f"API地址: {API_BASE_URL}")
    print(f"打印机: {DEFAULT_PRINTER}")
    print(f"CUPS服务器: {CUPS_SERVER}")
    print("按 Ctrl+C 停止服务")
    print()
    
    # 检查CUPS打印机
    printers = get_cups_printers()
    if printers:
        print(f"可用打印机: {', '.join(printers)}")
    else:
        print("警告: 未检测到可用打印机，将使用默认配置")
    print()
    
    api_client = APIClient(API_BASE_URL)
    
    while True:
        try:
            # 获取待打印任务
            jobs = api_client.get_pending_jobs()
            
            if jobs:
                print(f"发现 {len(jobs)} 个待打印任务")
                
                for job in jobs:
                    process_print_job(job, api_client)
                    time.sleep(2)
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
