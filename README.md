# AI Personal Finance Advisor

个人财务AI顾问 - 一个结合传统记账功能和AI智能分析的全栈Web应用

## 功能特性

- 智能记账：快速记录收入和支出，支持多种分类
- 数据可视化：直观的图表展示财务状况
- AI 财务顾问：基于 DeepSeek AI 的智能财务分析和建议
- 实时对话：流式响应，与 AI 顾问实时交流

## 技术栈

### 前端
- React 18 + TypeScript + Vite
- TailwindCSS
- Server-Sent Events (SSE)
- 部署: Vercel

### 后端
- FastAPI + Python 3.12
- SQLAlchemy 2.0 (async)
- LangChain + DeepSeek API
- JWT 认证 (Argon2)
- 部署: Vercel Serverless

### 基础设施
- PostgreSQL: Neon (Serverless)
- Redis: Upstash
- AI: DeepSeek API

## 项目结构

```
formianshi/
├── backend/              # FastAPI 后端
│   ├── api/             # API 入口
│   ├── app/             # 应用代码
│   └── vercel.json      # Vercel 配置
├── frontend/            # React 前端
│   ├── src/
│   └── vercel.json
└── README.md
```
## 本地开发

### 后端

```bash
cd backend
pip install -r requirements.txt

# 配置 .env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

uvicorn api.index:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install

# 配置 .env
VITE_API_URL=http://localhost:8000

npm run dev
```

## 核心技术

使用 Server-Sent Events 实现 AI 流式对话，完美适配 Vercel Serverless 环境：

- 后端通过 FastAPI StreamingResponse 逐 token 发送
- 前端使用 Fetch API + ReadableStream 实时接收
- 替代 WebSocket，避免 serverless 环境的连接限制

## License

MIT
