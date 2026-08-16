#!/bin/bash

# 测试部署的完整脚本

echo "🧪 测试部署状态..."
echo ""

BACKEND_URL="https://formianshi-backend.onrender.com"

# 测试后端健康检查
echo "1️⃣ 测试后端健康检查..."
echo "   URL: $BACKEND_URL/health"

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 60 "$BACKEND_URL/health" 2>&1)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ 后端健康检查通过"
    echo "   响应: $RESPONSE_BODY"
else
    echo "   ⚠️  后端可能还在启动中或有问题"
    echo "   HTTP Code: $HTTP_CODE"
    echo "   响应: $RESPONSE_BODY"
    echo ""
    echo "   提示: Render 免费服务在闲置后会休眠，首次访问需要30-60秒启动"
fi

echo ""

# 测试后端根路径
echo "2️⃣ 测试后端根路径..."
echo "   URL: $BACKEND_URL/"

ROOT_RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 60 "$BACKEND_URL/" 2>&1)
HTTP_CODE=$(echo "$ROOT_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$ROOT_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ 后端根路径访问成功"
    echo "   响应: $RESPONSE_BODY"
else
    echo "   ❌ 后端根路径访问失败"
    echo "   HTTP Code: $HTTP_CODE"
fi

echo ""

# 测试数据库连接
echo "3️⃣ 测试数据库连接..."
echo "   检查 Neon 数据库..."

DB_URL="postgresql://neondb_owner:npg_B5xXTlgDt7JI@ep-odd-fire-auvfjo93.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require"

if command -v psql > /dev/null 2>&1; then
    if psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "   ✅ 数据库连接成功"
    else
        echo "   ⚠️  数据库连接失败（可能需要运行迁移）"
    fi
else
    echo "   ⏭️  跳过（psql 未安装）"
fi

echo ""

# 测试 Redis 连接
echo "4️⃣ 测试 Redis 连接..."
echo "   检查 Upstash Redis..."

REDIS_RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Authorization: Bearer gQAAAAAAAY7YAQIgcDIxMjA0ZjUwNGEwNzM0MDJiODkwMTc1MTYwNzJiMTMyNw" \
    -d '["PING"]' \
    https://evolving-skunk-102104.upstash.io 2>&1)

HTTP_CODE=$(echo "$REDIS_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$REDIS_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] && [ "$RESPONSE_BODY" = '{"result":"PONG"}' ]; then
    echo "   ✅ Redis 连接成功"
else
    echo "   ⚠️  Redis 连接失败"
    echo "   响应: $RESPONSE_BODY"
fi

echo ""
echo "📊 测试完成！"
echo ""
echo "📋 部署检查清单："
echo "  [ ] 后端已部署并运行"
echo "  [ ] 数据库已创建并可连接"
echo "  [ ] Redis 已创建并可连接"
echo "  [ ] 前端已部署到 Vercel"
echo "  [ ] 已运行数据库迁移"
echo "  [ ] 已更新 CORS 配置"
echo "  [ ] 已认领 Upstash Redis（3天内）"
echo ""
echo "🔗 相关链接："
echo "  - 后端 Dashboard: https://dashboard.render.com/web/srv-da0mo0dg1s2s73c0550g"
echo "  - Neon Console: https://console.neon.tech/app/projects/super-rain-96706714"
echo "  - Upstash Console: https://upstash.com/start-redis/console/506fa2b8-408b-4bb1-a445-6bd947219b96"
echo "  - Vercel Dashboard: https://vercel.com/dashboard"
