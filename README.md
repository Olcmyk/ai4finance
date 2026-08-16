# AI Personal Finance Advisor

个人财务AI顾问 - 一个结合传统记账功能和AI智能分析的全栈Web应用

## ✨ 功能特性

- 💰 **智能记账**：快速记录收入和支出，支持多种分类
- 📊 **数据可视化**：直观的图表展示财务状况
- 🤖 **AI 财务顾问**：基于 DeepSeek AI 的智能财务分析和建议
- 💬 **实时对话**：流式响应，与 AI 顾问实时交流
- 📱 **响应式设计**：完美适配桌面和移动设备

## 🛠 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS + 渐变科技蓝主题
- **路由**: React Router v6
- **状态管理**: React Hooks
- **HTTP 客户端**: Fetch API + SSE (Server-Sent Events)
- **图表**: Recharts
- **部署**: Vercel

### 后端
- **框架**: FastAPI (Python 3.12)
- **异步**: asyncio + asyncpg
- **ORM**: SQLAlchemy 2.0 (async)
- **AI**: LangChain + DeepSeek API
- **认证**: JWT (argon2 密码哈希)
- **数据库**: PostgreSQL (Neon)
- **缓存**: Upstash Redis
- **部署**: Vercel Serverless Functions

### 基础设施
- **数据库托管**: Neon (Serverless PostgreSQL)
- **缓存服务**: Upstash Redis
- **前端部署**: Vercel
- **后端部署**: Vercel Serverless
- **AI 服务**: DeepSeek API

## 📁 项目结构

```
formianshi/
├── backend/              # Python 后端
│   ├── api/             # API 入口
│   ├── app/             # 应用代码
│   │   ├── api/         # 路由端点
│   │   ├── models/      # 数据模型
│   │   ├── services/    # 业务逻辑
│   │   └── config.py    # 配置管理
│   ├── requirements.txt # Python 依赖
│   └── vercel.json      # Vercel 配置
├── frontend/            # React 前端
│   ├── src/
│   │   ├── api/         # API 客户端
│   │   ├── components/  # React 组件
│   │   ├── pages/       # 页面组件
│   │   └── App.tsx      # 应用入口
│   ├── package.json     # Node 依赖
│   └── vercel.json      # Vercel 配置
└── README.md
```

## 🚀 部署架构

### 生产环境
- **前端**: https://frontend-swart-five-7mc75xh12x.vercel.app
- **后端**: https://ai4finance-backend.vercel.app
- **数据库**: Neon PostgreSQL (Serverless)
- **缓存**: Upstash Redis (Serverless)

### 技术亮点
1. **Serverless 架构**：完全基于 Vercel Serverless，按需付费，自动扩展
2. **HTTP 流式传输**：使用 SSE 替代 WebSocket，完美适配 serverless 环境
3. **异步处理**：FastAPI + asyncpg 实现高性能异步数据库操作
4. **安全认证**：JWT + Argon2 密码哈希，替代不兼容 serverless 的 bcrypt
5. **实时 AI 对话**：流式响应，逐 token 显示，提升用户体验

## 📝 开发进度

- [x] 项目初始化
- [x] 后端基础架构
- [x] 前端基础架构
- [x] 用户认证系统
- [x] 交易管理功能
- [x] 数据分析与可视化
- [x] AI 财务顾问（DeepSeek）
- [x] HTTP 流式对话
- [x] 生产环境部署

## 🔧 本地开发

### 环境要求
- Node.js 18+
- Python 3.12+
- PostgreSQL 15+ (或使用 Neon)

### 后端设置

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量（复制 .env.example 到 .env）
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# 运行开发服务器
uvicorn api.index:app --reload --port 8000
```

### 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量（.env）
VITE_API_URL=http://localhost:8000

# 运行开发服务器
npm run dev
```

## 🌟 核心实现

### AI 流式对话
使用 Server-Sent Events (SSE) 实现实时流式响应：

**后端 (FastAPI)**:
```python
@router.post("/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        async for chunk in ai_service.chat_stream(...):
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

**前端 (React)**:
```typescript
const response = await fetch('/api/chat/stream', {
    method: 'POST',
    body: JSON.stringify({ message }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    // 解析 SSE 消息并更新 UI
}
```

## 📄 License

MIT

## 👤 Author

Developed with ❤️ using Claude Code
