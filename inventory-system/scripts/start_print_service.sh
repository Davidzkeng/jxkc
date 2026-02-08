#!/bin/bash
# 打印服务启动脚本

# 配置API地址（根据实际情况修改）
export PRINT_API_URL="${PRINT_API_URL:-http://localhost:3001/api}"
export PRINT_POLL_INTERVAL="${PRINT_POLL_INTERVAL:-5}"

cd /opt/print-service
exec python3 print_service_api.py