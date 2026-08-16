# 🚀 使用 Vercel 部署 FastAPI 后端

## 为什么选择 Vercel 而不是 Render？

✅ **无冷启动延迟** - Vercel Serverless Functions 响应更快  
✅ **统一平台管理** - 前后端都在 Vercel，管理更简单  
✅ **自动扩展** - 按需扩展，无需担心流量  
✅ **更好的免费额度** - 100GB 带宽/月  
✅ **全球 CDN** - 边缘网络加速  

## 📋 部署步骤

### 方式 1: 使用 Vercel CLI（推荐）

```bash
# 1. 进入项目目录
cd /Users/booffaoex/code/formianshi

# 2. 部署后端到 Vercel
vercel --prod --config vercel-backend.json --name ai4finance-backend

# 3. 添加环境变量（部署时会提示）
# 或者在 Vercel Dashboard 手动添加
```

### 方式 2: 使用 Vercel Dashboard

1. **创建新项目**
   - 访问：https://vercel.com/new
   - 选择仓库：`Olcmyk/ai4finance`
   - 项目名：`ai4finance-backend`

2. **配置项目**
   ```
   Framework Preset: Other
   Root Directory: backend
   Build Command: (留空)
   Output Directory: (留空)
   ```

3. **添加环境变量**
   在 Settings → Environment Variables 添加：
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_B5xXTlgDt7JI@ep-odd-fire-auvfjo93.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require
   
   UPSTASH_REDIS_REST_URL=https://evolving-skunk-102104.upstash.io
   
   UPSTASH_REDIS_REST_TOKEN=gQAAAAAAAY7YAQIgcDIxMjA0ZjUwNGEwNzM0MDJiODkwMTc1MTYwNzJiMTMyNw
   
   OPENAI_API_KEY=sk-ae857a88f3fa42cc927e7ba608fec0f9
   
   OPENAI_API_BASE=https://api.deepseek.com
   
   OPENAI_MODEL=deepseek-chat
   
   JWT_SECRET=formianshi-jwt-secret-key-2026-super-secure-random-string-32chars
   
   FRONTEND_URL=https://ai4finance.vercel.app
   
   ENVIRONMENT=production
   ```

4. **部署**
   点击 "Deploy"

## 📝 已创建的文件

- `backend/api/index.py` - Vercel 入口点
- `vercel-backend.json` - Vercel 配置文件
- `backend/requirements.txt` - 已移除 uvicorn（Vercel 自带）

## 🔧 部署后更新

### 更新前端 API URL

后端部署成功后，你会得到一个 URL（如：`https://ai4finance-backend.vercel.app`）

**更新前端环境变量：**

```bash
# 使用 Vercel API 更新
curl -X POST https://api.vercel.com/v10/projects/ai4finance/env \
  -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "VITE_API_URL",
    "value": "https://ai4finance-backend.vercel.app",
    "type": "plain",
    "target": ["production", "preview", "development"]
  }'

# 然后重新部署前端
vercel --prod --cwd frontend
```

### 更新后端 CORS

后端部署成功后，Vercel 会自动读取 `FRONTEND_URL` 环境变量。

## ✅ 验证部署

```bash
# 测试健康检查
curl https://your-backend-url.vercel.app/health

# 预期返回
{"status":"healthy"}
```

## 🆚 Vercel vs Render 对比

| 特性 | Vercel | Render |
|------|--------|--------|
| 冷启动 | 快（~200ms） | 慢（30-60s） |
| 免费额度 | 100GB/月 | 750小时/月 |
| 自动休眠 | 否 | 是（15分钟） |
| 部署速度 | 快 | 慢 |
| 前端托管 | ✅ 优秀 | ⚠️ 一般 |
| Python 支持 | ✅ Serverless | ✅ 容器 |
| 数据库 | 需外部 | 需外部 |
| 配置复杂度 | 简单 | 中等 |

## 💡 注意事项

### Vercel Serverless 限制

1. **执行时间**：免费版最多 10 秒
2. **内存**：1024MB
3. **请求大小**：4.5MB

如果你的 AI 聊天响应时间超过 10 秒，可能需要：
- 优化提示词
- 使用更快的模型
- 考虑使用 streaming 响应

### 长期运行任务

Vercel Serverless 不适合：
- 长时间运行的任务（>10秒）
- WebSocket 长连接（免费版限制）
- 大文件处理

如果需要这些功能，保留 Render 作为备选。

## 🎯 推荐架构

**最佳方案：**
- ✅ 前端：Vercel
- ✅ 后端 API：Vercel Serverless
- ✅ 数据库：Neon
- ✅ 缓存：Upstash
- ✅ AI：DeepSeek

**全部在 Vercel 生态内，管理最简单！**

---

现在就试试吧！🚀
