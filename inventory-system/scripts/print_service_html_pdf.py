#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
打印服务脚本
通过REST API定时轮询打印任务并使用CUPS执行PDF打印
"""

import os
import sys
import time
import json
import tempfile
import subprocess
import requests
from datetime import datetime

# API配置 - 可通过环境变量修改
API_BASE_URL = os.environ.get("PRINT_API_URL", "http://localhost:3001/api")
POLL_INTERVAL = int(os.environ.get("PRINT_POLL_INTERVAL", "5"))  # 轮询间隔（秒）
DEFAULT_PRINTER = os.environ.get("CUPS_PRINTER", "default")  # 默认打印机名称
CUPS_SERVER = os.environ.get("CUPS_SERVER", "localhost")  # CUPS服务器地址


def generate_html_content(job):
    """生成HTML内容"""
    order = job.get("order", {})
    products = order.get("products", [])
    customer = order.get("customer", {})
    
    # 格式化日期
    order_date = order.get('createdAt', '')
    if order_date:
        try:
            dt = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
            order_date = dt.strftime('%Y-%m-%d')
        except:
            pass
    
    order_number = order.get('orderNumber', '')
    customer_name = customer.get('name', '')
    customer_phone = customer.get('phone', '')
    total_amount = float(order.get('totalAmount', 0))
    total_qty = sum(item.get('quantity', 0) for item in products)
    
    # 生成商品行HTML
    product_rows = ""
    for idx, item in enumerate(products, 1):
        product = item.get("product", {})
        name = product.get('name', '')
        qty = item.get('quantity', 0)
        price = float(item.get('price', 0))
        amount = float(item.get('totalAmount', 0))
        product_rows += f"""
        <tr>
            <td class="cell center">{idx}</td>
            <td class="cell">{name}</td>
            <td class="cell right">{qty}</td>
            <td class="cell right">{price:.2f}</td>
            <td class="cell right">{amount:.2f}</td>
        </tr>
        """
    
    # 填充空行
    for _ in range(max(4 - len(products), 0)):
        product_rows += """
        <tr>
            <td class="cell center">&nbsp;</td>
            <td class="cell">&nbsp;</td>
            <td class="cell right">&nbsp;</td>
            <td class="cell right">&nbsp;</td>
            <td class="cell right">&nbsp;</td>
        </tr>
        """
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {{
            size: 24cm 14cm;
            margin: 0;
        }}
        body {{
            font-family: SimHei, Microsoft YaHei, sans-serif;
            font-size: 14pt;
            width: 24cm;
            height: 14cm;
            margin: 0 auto;
            padding: 0.5cm;
            box-sizing: border-box;
        }}
        .title {{
            font-size: 28pt;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            letter-spacing: 12px;
        }}
        .header {{
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
        }}
        .header td {{
            padding: 4px 8px;
            font-size: 13pt;
        }}
        .header-left {{
            width: 55%;
        }}
        .header-right {{
            width: 45%;
        }}
        .info-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
        }}
        .info-table th, .info-table td {{
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 12pt;
        }}
        .info-table th {{
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }}
        .cell {{
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 12pt;
        }}
        .center {{
            text-align: center;
        }}
        .right {{
            text-align: right;
        }}
        .total-section {{
            margin: 12px 0;
        }}
        .total-section td {{
            padding: 4px 8px;
            font-size: 13pt;
        }}
        .footer {{
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            font-size: 13pt;
        }}
        .signature-line {{
            border-bottom: 1px solid #000;
            width: 150px;
            display: inline-block;
            text-align: center;
        }}
        .remark {{
            margin-top: 12px;
            font-size: 11pt;
            border-top: 1px solid #000;
            padding-top: 5px;
        }}
    </style>
</head>
<body>
    <div class="title">销售单</div>
    
    <table class="header">
        <tr>
            <td class="header-left">客户: {customer_name}</td>
            <td class="header-right">日期: {order_date}</td>
        </tr>
        <tr>
            <td class="header-left">电话: {customer_phone}</td>
            <td class="header-right">单号: {order_number}</td>
        </tr>
    </table>
    
    <table class="info-table">
        <thead>
            <tr>
                <th style="width: 10%;">序号</th>
                <th style="width: 40%;">品名</th>
                <th style="width: 15%;">数量</th>
                <th style="width: 17%;">单价</th>
                <th style="width: 18%;">金额</th>
            </tr>
        </thead>
        <tbody>
            {product_rows}
        </tbody>
    </table>
    
    <table class="total-section">
        <tr>
            <td>总数量: {total_qty}</td>
        </tr>
        <tr>
            <td>总金额: ¥{total_amount:.2f}</td>
        </tr>
        <tr>
            <td>大写: {number_to_chinese(total_amount)}</td>
        </tr>
    </table>
    
    <div class="footer">
        <div>服务电话:</div>
        <div>客户签名: <span class="signature-line">&nbsp;</span></div>
    </div>
    
    <div class="remark">备注: 货物当面点清，过后概不负责。</div>
</body>
</html>"""
    
    return html


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


def cups_print_pdf(printer_name, html_content):
    """
    使用CUPS lp命令打印PDF
    
    Args:
        printer_name: 打印机名称
        html_content: HTML内容
    
    Returns:
        (success, job_id, error_msg)
    """
    try:
        # 创建临时HTML文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', encoding='utf-8', delete=False) as f:
            f.write(html_content)
            html_file = f.name
        
        # PDF临时文件
        pdf_file = html_file + '.pdf'
        
        # 使用wkhtmltopdf转换HTML为PDF (横向打印，24cm x 14cm)
        cmd = ['wkhtmltopdf', '--quiet', '--orientation', 'landscape',
               '--page-width', '24cm', '--page-height', '14cm',
               '--margin-top', '0', '--margin-bottom', '0', '--margin-left', '0', '--margin-right', '0',
               html_file, pdf_file]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        # 删除HTML文件
        os.unlink(html_file)
        
        if result.returncode != 0:
            # 如果wkhtmltopdf失败，尝试使用lpr直接打印HTML
            print(f"wkhtmltopdf失败，尝试直接打印HTML: {result.stderr}")
            cmd = [
                'lpr',
                '-P', printer_name,
                '-o', 'raw',
                '-o', 'media=22x14cm',
                html_file
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            os.unlink(html_file)
            
            if result.returncode == 0:
                return True, "html-print", None
            else:
                return False, None, result.stderr
        
        # 打印PDF
        cmd = ['lp', '-d', printer_name, pdf_file]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        # 删除PDF文件
        os.unlink(pdf_file)
        
        if result.returncode == 0:
            job_id = result.stdout.strip()
            return True, job_id, None
        else:
            return False, None, result.stderr
    
    except subprocess.TimeoutExpired:
        return False, None, "打印超时"
    except Exception as e:
        return False, None, str(e)


def get_pending_jobs(limit=10):
    """获取待打印任务"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/print-jobs/pending",
            params={"limit": limit},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])
    except Exception as e:
        print(f"获取打印任务失败: {e}")
        return []


def update_job_status(job_id, status, printer_name=None, error_message=None):
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
    except Exception as e:
        print(f"更新打印任务状态失败: {e}")
        return False


def process_print_job(job):
    """处理单个打印任务"""
    job_id = job['id']
    
    print(f"处理打印任务 #{job_id}")
    
    try:
        # 更新状态为处理中
        update_job_status(job_id, 'processing', printer_name=DEFAULT_PRINTER)
        
        # 生成HTML内容
        html_content = generate_html_content(job)
        
        # 打印PDF
        success, job_id_or_error, error_msg = cups_print_pdf(DEFAULT_PRINTER, html_content)
        
        if success:
            print(f"打印成功")
            update_job_status(job_id, 'completed', printer_name=DEFAULT_PRINTER)
            return True
        else:
            print(f"打印失败: {error_msg}")
            update_job_status(job_id, 'failed', error_message=error_msg)
            return False
    
    except Exception as e:
        error_msg = str(e)
        print(f"打印任务 #{job_id} 失败: {error_msg}")
        update_job_status(job_id, 'failed', error_message=error_msg)
        return False


def main():
    """主循环"""
    print("=" * 50)
    print("打印服务已启动 (HTML+PDF版)")
    print("=" * 50)
    print(f"API地址: {API_BASE_URL}")
    print(f"打印机: {DEFAULT_PRINTER}")
    print("按 Ctrl+C 停止服务")
    print()
    
    while True:
        try:
            # 获取待打印任务
            jobs = get_pending_jobs()
            
            if jobs:
                print(f"发现 {len(jobs)} 个待打印任务")
                
                for job in jobs:
                    process_print_job(job)
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
