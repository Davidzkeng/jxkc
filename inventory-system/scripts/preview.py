#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成打印预览"""
import sys
sys.path.insert(0, '/home/david/study/jxkc/inventory-system/scripts')
from print_service_text import create_print_content

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
                    "name": "测试商品ABC"
                }
            },
            {
                "quantity": 10,
                "price": "25.50",
                "totalAmount": "255.00",
                "product": {
                    "name": "另一个测试产品名称"
                }
            },
            {
                "quantity": 3,
                "price": "80.00",
                "totalAmount": "240.00",
                "product": {
                    "name": "第三件商品"
                }
            }
        ]
    }
}

print("=" * 80)
print("打印预览 (220mm宽度)")
print("=" * 80)
content = create_print_content(job)
print(content)
print("=" * 80)
