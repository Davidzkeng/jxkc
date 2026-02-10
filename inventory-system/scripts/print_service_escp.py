#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
打印服务脚本 - ESC/P直接打印版
使用ESC/P命令直接发送打印数据，避免图片模糊问题
"""

import os
import sys
import time
import socket
import tempfile
import subprocess
import requests
from datetime import datetime

# API配置
API_BASE_URL = os.environ.get("PRINT_API_URL", "http://localhost:3001/api")
POLL_INTERVAL = int(os.environ.get("PRINT_POLL_INTERVAL", "5"))
DEFAULT_PRINTER = os.environ.get("CUPS_PRINTER", "default")

# ESC/P 命令定义
ESC = b'\x1b'
GS = b'\x1d'
FS = b'\x1c'

# ESC/P Commands
CMD_INIT = ESC + b'@'              # 初始化打印机
CMD_ALIGN_LEFT = ESC + b'a' + b'\x00'    # 左对齐
CMD_ALIGN_CENTER = ESC + b'a' + b'\x01'  # 居中对齐
CMD_BOLD_ON = ESC + b'E' + b'\x01'       # 粗体开启
CMD_BOLD_OFF = ESC + b'E' + b'\x00'      # 粗体关闭
CMD_DOUBLE_WIDTH_ON = ESC + b'W' + b'\x01'  # 倍宽开启
CMD_DOUBLE_WIDTH_OFF = ESC + b'W' + b'\x00' # 倍宽关闭
CMD_DOUBLE_HEIGHT_ON = ESC + b'w' + b'\x01' # 倍高开启
CMD_DOUBLE_HEIGHT_OFF = ESC + b'w' + b'\x00'# 倍高关闭
CMD_ITALIC_ON = ESC + b'4'               # 斜体开启
CMD_ITALIC_OFF = ESC + b'5'              # 斜体关闭
CMD_UNDERLINE_ON = ESC + b'-' + b'\x01'  # 下划线开启
CMD_UNDERLINE_OFF = ESC + b'-' + b'\x00' # 下划线关闭
CMD_LINE_FEED = b'\x0a'                  # 换行
CMD_FORM_FEED = b'\x0c'                 # 走纸
CMD_RETURN = b'\x0d'                     # 回车

# 设置行间距为 1/6 英寸 (默认)
CMD_LINE_SPACING_6 = ESC + b'2'

# 设置行间距为 n/180 英寸
def cmd_line_spacing(n):
    return ESC + b'3' + bytes([n])

# 打印并换行
CMD_PRINT_FEED = b'\x0a' * 2


def connect_printer(printer_name):
    """连接CUPS打印机"""
    try:
        # 使用lpstat获取打印机URI
        result = subprocess.run(['lpstat', '-v', printer_name], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            # 格式: device for printer: socket://192.168.101.113:9100
            import re
            match = re.search(r'(socket|ipp|http)://([^\s:]+)(?::(\d+))?', result.stdout)
            if match:
                host = match.group(2)
                port = int(match.group(3) or 9100)
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(10)
                sock.connect((host, port))
                return sock
    except Exception as e:
        print(f"连接打印机失败: {e}")
    return None


def print_text_direct(sock, text):
    """直接发送文本到打印机"""
    if sock:
        try:
            sock.send(text.encode('gbk'))
            return True
        except Exception as e:
            print(f"发送失败: {e}")
            return False
    else:
        # 回退到CUPS打印
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False, mode='w') as f:
            f.write(text)
            f.flush()
            result = subprocess.run(['lp', '-d', DEFAULT_PRINTER, f.name], 
                                  capture_output=True, text=True)
            os.unlink(f.name)
            return result.returncode == 0


def create_escp_content(job):
    """创建ESC/P格式的打印内容"""
    order = job.get("order", {})
    products = order.get("products", [])
    customer = order.get("customer", {})
    
    lines = []
    
    # 初始化
    lines.append(ESC + b'@')  # 打印机初始化
    lines.append(ESC + b'2')  # 默认行间距
    
    # 标题 - 居中放大
    lines.append(ESC + b'a' + b'\x01')  # 居中
    lines.append(ESC + b'W' + b'\x01')  # 倍宽
    lines.append(ESC + b'w' + b'\x01')  # 倍高
    lines.append("销售单")
    lines.append(ESC + b'W' + b'\x00')  # 关闭倍宽
    lines.append(ESC + b'w' + b'\x00')  # 关闭倍高
    lines.append(CMD_LINE_FEED)
    lines.append(ESC + b'a' + b'\x00')  # 左对齐
    lines.append(ESC + b'2')  # 恢复行间距
    lines.append(CMD_LINE_FEED)
    
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
    
    # 左对齐内容
    lines.append(f"客户: {customer_name}")
    lines.append(f"电话: {customer_phone}")
    lines.append(f"日期: {order_date}")
    lines.append(f"单号: {order_number}")
    lines.append("-" * 40)  # 分隔线
    lines.append(CMD_LINE_FEED)
    
    # 表头
    lines.append(ESC + b'E' + b'\x01')  # 粗体
    lines.append(f"{'序号':<4} {'品名':<10} {'数量':>4} {'金额':>8}")
    lines.append(ESC + b'E' + b'\x00')  # 粗体关闭
    lines.append("-" * 40)
    lines.append(CMD_LINE_FEED)
    
    # 商品明细
    total_qty = 0
    for idx, item in enumerate(products, 1):
        product = item.get("product", {})
        name = product.get('name', '')[:10]
        qty = str(item.get('quantity', 0))
        amount = f"{float(item.get('totalAmount', 0)):.2f}"
        
        lines.append(f"{idx:<4} {name:<10} {qty:>4} {amount:>8}")
        total_qty += item.get('quantity', 0)
    
    lines.append("-" * 40)
    lines.append(CMD_LINE_FEED)
    
    # 汇总
    total_amount = float(order.get('totalAmount', 0))
    lines.append(f"总数量: {total_qty}")
    lines.append(f"总金额: ¥{total_amount:.2f}")
    lines.append(CMD_LINE_FEED)
    
    # 底部
    lines.append("-" * 40)
    lines.append("服务电话:")
    lines.append("客户签名: ________________")
    lines.append(CMD_LINE_FEED * 3)
    
    # 合并所有行
    content = ''
    for line in lines:
        if isinstance(line, bytes):
            content += line.decode('latin-1', errors='ignore')
        else:
            # 使用GBK编码支持中文
            try:
                content += line.encode('gbk').decode('gbk')
            except:
                content += line
    
    return content


def cups_print_text(printer_name, content):
    """使用CUPS打印纯文本"""
    try:
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False, mode='wb') as f:
            # 使用GBK编码
            f.write(content.encode('gbk'))
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
        
        # 创建打印内容
        content = create_escp_content(job)
        
        # 打印
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
    print("打印服务已启动 (ESC/P直接打印版)")
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
