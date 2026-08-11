# Personal Finance AI Advisor - Backend

AI 个人财务顾问后端服务

## 技术栈

- **语言**: Python 3.11+
- **Web框架**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **AI框架**: LangChain + OpenAI
- **认证**: JWT

## 项目结构

```
backend/
├── app/
│   ├── api/              # API 路由层
│   ├── services/         # 业务逻辑层
│   ├── models/           # SQLAlchemy 模型
│   ├── schemas/          # Pydantic schemas
│   ├── core/             # 核心功能（数据库、安全、Redis）
│   ├── utils/            # 工具函数
│   ├── config.py         # 配置管理
│   └── main.py           # FastAPI 应用入口
├── tests/                # 测试
├── alembic/              # 数据库迁移
├── requirements.txt      # Python 依赖
├── .env.example          # 环境变量示例
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_db

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# JWT
JWT_SECRET=your-secret-key-at-least-32-characters-long

# CORS
FRONTEND_URL=http://localhost:5173

# Environment
ENVIRONMENT=development
```

### 3. 启动数据库（Docker）

在项目根目录运行：

```bash
docker-compose up -d
```

### 4. 运行开发服务器

```bash
uvicorn app.main:app --reload --port 8000
```

API 将在 http://localhost:8000 上运行

### 5. 查看 API 文档

访问 http://localhost:8000/docs 查看 Swagger UI 文档

## API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌
- `GET /api/auth/me` - 获取当前用户信息

### 交易记录
- `POST /api/transactions` - 创建交易
- `GET /api/transactions` - 获取交易列表
- `GET /api/transactions/{id}` - 获取交易详情
- `PUT /api/transactions/{id}` - 更新交易
- `DELETE /api/transactions/{id}` - 删除交易
- `POST /api/transactions/parse` - 解析自然语言输入

### 数据分析
- `GET /api/analytics/summary` - 获取财务概览
- `GET /api/analytics/by-category` - 按类别统计
- `GET /api/analytics/trend` - 获取趋势数据
- `GET /api/analytics/insights` - 获取 AI 洞察

### AI 顾问
- `WebSocket /api/ai/chat` - AI 对话（流式响应）
- `GET /api/ai/history` - 获取对话历史
- `DELETE /api/ai/history` - 清空对话历史

### 类别
- `GET /api/categories` - 获取所有类别

## 开发

### 数据库迁移

```bash
# 创建迁移
alembic revision --autogenerate -m "description"

# 执行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

### 运行测试

```bash
pytest
```

## 部署

部署到 Railway 平台，详见项目根目录的部署文档。
