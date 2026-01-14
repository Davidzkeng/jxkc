# Docker 部署指南

## 前提条件

- Docker 20.10+
- Docker Compose 2.0+

## 快速开始

### 1. 使用 Docker Compose（推荐）

```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止服务并删除数据卷
docker-compose down -v
```

### 2. 使用 Docker 手动构建

```bash
# 构建镜像
docker build -t inventory-system:latest .

# 运行容器
docker run -d \
  --name inventory-system \
  -p 3001:3001 \
  -v inventory-data:/app/data \
  -e DATABASE_URL="file:/app/data/dev.db" \
  inventory-system:latest
```

## 配置

### 环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

可配置的环境变量：

- `PORT`: 服务端口（默认: 3001）
- `DATABASE_URL`: SQLite 数据库路径（默认: `file:./dev.db`）
- `NODE_ENV`: 运行环境（默认: production）

### 数据持久化

SQLite 数据库存储在 Docker 卷 `inventory-data` 中，容器重启后数据不会丢失。

## 访问服务

- 管理后台: http://localhost:3001
- API 健康检查: http://localhost:3001/api/health
- API 文档: http://localhost:3001/api

## 开发模式

如需热重载，编辑 `docker-compose.yml`，取消注释以下行：

```yaml
volumes:
  - ./src:/app/src
```

然后重新构建并启动：

```bash
docker-compose up -d --build
```

## 故障排查

### 查看容器状态

```bash
docker ps
```

### 查看容器日志

```bash
docker logs inventory-system
```

### 进入容器

```bash
docker exec -it inventory-system sh
```

### 重新构建镜像

```bash
docker-compose build --no-cache
```

## 生产部署建议

1. 使用环境变量管理敏感信息
2. 定期备份数据卷
3. 使用 HTTPS/TLS
4. 配置资源限制
5. 设置日志轮转
