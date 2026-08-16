# 🎯 部署完成指南

## ✅ 已完成的部署

### 1. 数据库和缓存 
- ✅ **Neon PostgreSQL**: 已创建并可用
- ✅ **Upstash Redis**: 已创建并测试通过 ✓

### 2. 后端服务
- ✅ **Render Backend**: 已创建并正在部署
  - URL: https://formianshi-backend.onrender.com
  - 状态: 首次启动需要 2-3 分钟

---

## 📝 需要手动完成的步骤

### 步骤 1: 部署前端到 Vercel（5 分钟）

**选项 A: 使用 Vercel CLI（推荐）**

```bash
# 1. 登录 Vercel（会在浏览器打开）
vercel login

# 2. 运行部署脚本
./deploy-frontend.sh
```

**选项 B: 使用 Vercel Dashboard**

1. 访问 https://vercel.com/new
2. 点击 "Import Project"
3. 选择你的 GitHub 仓库: `Olcmyk/ai4finance`
4. 配置项目：
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
5. 添加环境变量：
   ```
   VITE_API_URL = https://formianshi-backend.onrender.com
   ```
6. 点击 "Deploy"

---

### 步骤 2: 运行数据库迁移（3 分钟）

等待 Render 后端完全启动后（约 2-3 分钟），运行数据库迁移：

**方式 1: 在 Render Shell 中运行**
1. 访问 https://dashboard.render.com/web/srv-da0mo0dg1s2s73c0550g
2. 等待服务状态变为 "Live"（绿色）
3. 点击右上角的 "Shell" 按钮
4. 运行命令：
   ```bash
   cd backend
   alembic upgrade head
   ```

**方式 2: 本地连接生产数据库**
```bash
# 设置数据库 URL
export DATABASE_URL="postgresql://neondb_owner:npg_B5xXTlgDt7JI@ep-odd-fire-auvfjo93.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 进入后端目录
cd backend

# 运行迁移
alembic upgrade head
```

---

### 步骤 3: 更新后端 CORS 配置（2 分钟）

前端部署完成后：

1. 复制 Vercel 提供的 URL（例如：`https://ai4finance-xxx.vercel.app`）
2. 访问 https://dashboard.render.com/web/srv-da0mo0dg1s2s73c0550g
3. 点击 "Environment" 标签
4. 找到 `FRONTEND_URL` 变量，点击编辑
5. 将值改为你的 Vercel URL
6. 点击 "Save Changes"（会自动重新部署，约 1 分钟）

---

### 步骤 4: 认领 Upstash Redis（1 分钟，重要！）

⚠️ **必须在 3 天内完成，否则数据库会被删除**

1. 访问: https://upstash.com/start-redis/console/506fa2b8-408b-4bb1-a445-6bd947219b96
2. 点击 "Claim this database" 按钮
3. 登录或注册 Upstash 账号
4. 数据库将永久保留在你的账号下

---

## 🧪 测试部署

### 1. 测试后端 API

```bash
# 健康检查（等待 2-3 分钟后端完全启动）
curl https://formianshi-backend.onrender.com/health
# 应该返回: {"status":"healthy"}

# 根路径
curl https://formianshi-backend.onrender.com/
# 应该返回: {"message":"Personal Finance AI Advisor API","version":"1.0.0","status":"running"}
```

### 2. 测试前端

1. 打开你的 Vercel URL
2. 测试注册功能：
   - 点击 "注册"
   - 输入邮箱和密码
   - 提交表单
3. 测试登录功能
4. 测试添加交易功能（自然语言输入）：
   - 输入："今天午餐花了50块"
   - 应该能自动解析并添加交易
5. 测试 AI 聊天功能：
   - 问："我这个月花了多少钱？"
   - 应该能返回基于你数据的分析

---

## 🔍 故障排查

### 后端一直无法访问

1. 检查 Render 部署日志：
   - 访问 https://dashboard.render.com/web/srv-da0mo0dg1s2s73c0550g
   - 点击 "Logs" 标签
   - 查看是否有错误信息

2. 常见问题：
   - **依赖安装失败**: 检查 `requirements.txt` 是否完整
   - **数据库连接失败**: 检查 `DATABASE_URL` 环境变量
   - **Redis 连接失败**: 检查 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`

### 前端无法连接后端

1. 检查浏览器控制台（F12）：
   - 查看是否有 CORS 错误
   - 检查 API 请求的 URL 是否正确

2. 解决方案：
   - 确认后端的 `FRONTEND_URL` 环境变量已更新
   - 确认前端的 `VITE_API_URL` 环境变量正确

### DeepSeek API 调用失败

1. 检查 API key 是否有效：
   ```bash
   curl https://api.deepseek.com/v1/models \
     -H "Authorization: Bearer sk-ae857a88f3fa42cc927e7ba608fec0f9"
   ```

2. 确认后端环境变量：
   - `OPENAI_API_KEY`: sk-ae857a88f3fa42cc927e7ba608fec0f9
   - `OPENAI_API_BASE`: https://api.deepseek.com

---

## 📊 部署信息汇总

### 服务 URL

| 服务 | URL | 控制台 |
|------|-----|--------|
| 后端 API | https://formianshi-backend.onrender.com | [Dashboard](https://dashboard.render.com/web/srv-da0mo0dg1s2s73c0550g) |
| 前端 | `待部署` | [Dashboard](https://vercel.com/dashboard) |
| PostgreSQL | ep-odd-fire-auvfjo93...neon.tech | [Console](https://console.neon.tech/app/projects/super-rain-96706714) |
| Redis | evolving-skunk-102104.upstash.io | [Console](https://upstash.com/start-redis/console/506fa2b8-408b-4bb1-a445-6bd947219b96) |

### 环境变量

**后端（Render）**
```env
DATABASE_URL=postgresql://neondb_owner:npg_B5xXTlgDt7JI@ep-odd-fire-auvfjo93...
UPSTASH_REDIS_REST_URL=https://evolving-skunk-102104.upstash.io
UPSTASH_REDIS_REST_TOKEN=gQAAAAAAAY7YAQIgcDIxMjA0ZjUwNGEwNzM0MDJiODkwMTc1MTYwNzJiMTMyNw
OPENAI_API_KEY=sk-ae857a88f3fa42cc927e7ba608fec0f9
OPENAI_API_BASE=https://api.deepseek.com
JWT_SECRET=formianshi-jwt-secret-key-2026-super-secure-random-string-32chars
FRONTEND_URL=https://your-app.vercel.app
ENVIRONMENT=production
```

**前端（Vercel）**
```env
VITE_API_URL=https://formianshi-backend.onrender.com
```

---

## 💰 成本估算

| 服务 | 免费额度 | 超出后费用 |
|------|---------|-----------|
| Neon | 0.5 GB 存储 | $0.16/GB |
| Upstash | 10,000 命令/天 | $0.2/100k 命令 |
| Render | 750 小时/月 | $7/月 |
| Vercel | 100 GB 带宽/月 | $20/100GB |
| DeepSeek | - | ~$0.14/1M tokens (输入) |

**预计月费用：$0-5**（主要是 DeepSeek API 使用费）

---

## 📞 获取帮助

如果遇到问题：

1. 查看完整日志：
   - Render: https://dashboard.render.com/web/srv-da0mo0dg1s2s73c0550g/logs
   - Vercel: 在项目 Dashboard 的 "Deployments" 标签

2. 检查服务状态：
   - Render Status: https://status.render.com
   - Vercel Status: https://www.vercel-status.com
   - Neon Status: https://neonstatus.com

3. 查看文档：
   - Render: https://render.com/docs
   - Vercel: https://vercel.com/docs
   - Neon: https://neon.tech/docs
   - Upstash: https://upstash.com/docs

---

## ✨ 下一步优化建议

部署完成后，可以考虑：

1. **设置监控**: 使用 Render 的监控功能
2. **配置域名**: 绑定自定义域名
3. **优化性能**: 添加 CDN 缓存
4. **增强安全**: 配置 IP 白名单、Rate Limiting
5. **备份数据**: 定期备份 Neon 数据库
