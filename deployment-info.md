# 部署信息 / Deployment Information

## 创建时间
2026-08-16

## 数据库资源

### Neon PostgreSQL
- **Project ID**: super-rain-96706714
- **Database Name**: neondb
- **Connection String**: `postgresql://neondb_owner:npg_B5xXTlgDt7JI@ep-odd-fire-auvfjo93.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require`
- **Region**: aws-us-east-1
- **Console**: https://console.neon.tech/app/projects/super-rain-96706714

### Upstash Redis (临时 - 3天过期)
- **Database ID**: 506fa2b8-408b-4bb1-a445-6bd947219b96
- **Endpoint**: https://evolving-skunk-102104.upstash.io
- **Token**: gQAAAAAAAY7YAQIgcDIxMjA0ZjUwNGEwNzM0MDJiODkwMTc1MTYwNzJiMTMyNw
- **过期时间**: 2026-08-19
- **领取数据库**: https://upstash.com/start-redis/console/506fa2b8-408b-4bb1-a445-6bd947219b96
- **注意**: 3天后过期，需要在 Upstash 控制台点击 "Claim" 认领此数据库以永久保留

## DeepSeek API 配置
- **Base URL**: https://api.deepseek.com
- **Model**: deepseek-v4-flash (快速) 或 deepseek-v4-pro (高性能)
- **兼容性**: 与 OpenAI API 格式兼容

## 部署服务

### Render (后端)
- **API Key**: rnd_96Aku2iMjjaDj4TpXItEZhKlQG2N
- **待部署**: FastAPI 应用

### Vercel (前端)
- **Team ID**: team_4vi7VOrSAHQtSxeJirxAuTtJ
- **待部署**: React + Vite 应用

## 下一步
1. 修改后端代码以支持 Upstash Redis REST API
2. 修改后端代码以支持 DeepSeek API
3. 运行数据库迁移
4. 部署到 Render
5. 部署到 Vercel
6. 测试连接
