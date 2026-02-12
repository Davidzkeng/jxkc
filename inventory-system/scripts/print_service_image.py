#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
打印服务脚本 - 图片版 v2
修复：字体大小、数字显示、模糊问题
"""

import os
import sys
import time
import tempfile
import subprocess
import requests
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# API配置
API_BASE_URL = os.environ.get("PRINT_API_URL", "http://localhost:3001/api")
POLL_INTERVAL = int(os.environ.get("PRINT_POLL_INTERVAL", "5"))
DEFAULT_PRINTER = os.environ.get("CUPS_PRINTER", "default")


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
    
    # 搜索所有可用字体
    try:
        result = subprocess.run(['fc-list', ':lang=zh', '-f', '%{file}\\n'],
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        fonts = result.stdout.decode('utf-8', errors='replace').strip().split('\\n')
        for font in fonts:
            if font and os.path.exists(font.strip()):
                print(f"找到字体(fc-list): {font.strip()}")
                return font.strip()
    except Exception as e:
        print(f"fc-list 搜索失败: {e}")
    
    return None


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


def get_text_size(draw, text, font):
    """获取文本尺寸"""
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        return bbox[2] - bbox[0], bbox[3] - bbox[1]
    except:
        return draw.textsize(text, font=font)


def draw_text_centered(draw, text, x, y, font, color, img_width, max_width=None):
    """绘制居中文字"""
    text_width, text_height = get_text_size(draw, text, font)
    if max_width is None:
        max_width = img_width - x - 40
    text_x = x + (max_width - text_width) // 2
    draw.text((int(text_x), int(y)), text, fill=color, font=font)


def create_print_image(job):
    """创建打印图片"""
    order = job.get("order", {})
    products = order.get("products", [])
    customer = order.get("customer", {})
    
    # 提高DPI到200，解决模糊问题
    dpi = 200
    img_width = int(24 * dpi / 2.54)  # 约1890像素
    img_height = int(14 * dpi / 2.54)   # 约1102像素
    
    img = Image.new('RGB', (img_width, img_height), 'white')
    draw = ImageDraw.Draw(img)
    
    # 加载字体 - 使用较小字号
    title_font = None
    body_font = None
    
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
    
    # 左对齐绘制
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
    
    # 实线分隔 - 解决虚线问题
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
        
        # 每行分隔线 - 实线
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
    
    sign_x = img_width - margin - 200
    draw.text((int(sign_x), int(y)), "客户签名:", fill=black, font=body_font)
    y += line_height
    draw.line([(int(sign_x), int(y)), (img_width - margin, int(y))], fill=black, width=1)
    y += 25
    
    # 备注
    draw.line([(margin, int(y)), (img_width - margin, int(y))], fill=black, width=1)
    y += 10
    draw.text((margin, int(y)), "备注: 货物当面点清，过后概不负责。", fill=black, font=small_font)
    
    return img


def cups_print_image(printer_name, img):
    """打印图片"""
    try:
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
            img_file = f.name
        
        # 保存图片 - PNG格式保持清晰度
        img.save(img_file, 'PNG', dpi=(200, 200))
        
        # 使用CUPS打印 - 添加质量设置
        cmd = [
            'lp',
            '-d', printer_name,
            '-o', 'media=24x14cm',
            '-o', 'fit-to-page',
            '-o', 'print-quality=5',
            img_file
        ]
        
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        os.unlink(img_file)
        
        if result.returncode == 0:
            return True, result.stdout.decode('utf-8', errors='replace').strip(), None
        else:
            return False, None, result.stderr.decode('utf-8', errors='replace')
    
    except Exception as e:
        return False, None, str(e)


def get_pending_jobs():
    try:
        resp = requests.get(f"{API_BASE_URL}/print-jobs/pending", params={"limit": 10}, timeout=10)
        return resp.json().get("data", [])
    except Exception as e:
        print(f"获取任务失败: {e}")
        return []


def update_job_status(job_id, status, printer_name=None, error_message=None):
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
    job_id = job['id']
    print(f"处理任务 #{job_id}")
    
    try:
        update_job_status(job_id, 'processing', printer_name=DEFAULT_PRINTER)
        img = create_print_image(job)
        success, _, error = cups_print_image(DEFAULT_PRINTER, img)
        
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
    print("打印服务已启动 (图片版 v2)")
    print("=" * 50)
    print(f"API: {API_BASE_URL}")
    print(f"打印机: {DEFAULT_PRINTER}")
    print()
    
    while True:
        try:
            jobs = get_pending_jobs()
            if jobs:
                print(f"发现 {len(jobs)} 个任务")
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
