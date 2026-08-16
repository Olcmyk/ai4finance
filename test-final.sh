#!/bin/bash

# 完整的部署测试脚本

echo "🎉 测试你的部署..."
echo ""

FRONTEND_URL="https://ai4finance.vercel.app"
BACKEND_URL="https://formianshi-backend.onrender.com"

echo "📍 服务 URL:"
echo "  前端: $FRONTEND_URL"
echo "  后端: $BACKEND_URL"
echo ""

# 测试前端
echo "1️⃣ 测试前端部署..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✅ 前端访问正常 (HTTP $FRONTEND_STATUS)"
else
    echo "   ⚠️  前端状态: HTTP $FRONTEND_STATUS"
fi
echo ""

# 测试后端健康检查
echo "2️⃣ 测试后端 API..."
echo "   正在唤醒后端服务（首次访问需要30-60秒）..."
HEALTH_RESPONSE=$(curl -s --max-time 90 "$BACKEND_URL/health" 2>&1)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "   ✅ 后端 API 正常"
    echo "   响应: $HEALTH_RESPONSE"
else
    echo "   ⚠️  后端响应: $HEALTH_RESPONSE"
    echo "   提示: 后端可能还在启动中，请稍等再试"
fi
echo ""

# 测试 CORS 配置
echo "3️⃣ 测试 CORS 配置..."
CORS_TEST=$(curl -s -X OPTIONS "$BACKEND_URL/api/auth/register" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" \
  -I 2>&1 | grep -i "access-control")

if [ -n "$CORS_TEST" ]; then
    echo "   ✅ CORS 配置正确"
else
    echo "   ⚠️  CORS 可能需要重新部署后端"
fi
echo ""

# 测试 Redis
echo "4️⃣ 测试 Redis 连接..."
REDIS_RESPONSE=$(curl -s --max-time 10 \
  -H "Authorization: Bearer gQAAAAAAAY7YAQIgcDIxMjA0ZjUwNGEwNzM0MDJiODkwMTc1MTYwNzJiMTMyNw" \
  -d '["PING"]' \
  https://evolving-skunk-102104.upstash.io 2>&1)

if echo "$REDIS_RESPONSE" | grep -q "PONG"; then
    echo "   ✅ Redis 连接正常"
else
    echo "   ⚠️  Redis 响应: $REDIS_RESPONSE"
fi
echo ""

echo "📊 测试完成！"
echo ""
echo "🌐 访问你的应用："
echo "   $FRONTEND_URL"
echo ""
echo "📝 功能测试清单："
echo "  [ ] 访问前端页面"
echo "  [ ] 注册新账号"
echo "  [ ] 登录账号"
echo "  [ ] 添加交易（自然语言：'今天午餐花了50块'）"
echo "  [ ] 查看交易列表"
echo "  [ ] 使用 AI 聊天（'我这个月花了多少钱？'）"
echo ""
echo "🔗 管理控制台："
echo "  - Vercel: https://vercel.com/selenes-projects-3785c4e1/ai4finance"
echo "  - Render: https://dashboard.render.com/web/srv-da0mo0dg1s2s73c0550g"
echo "  - Neon: https://console.neon.tech/app/projects/super-rain-96706714"
echo "  - Upstash: https://console.upstash.com"
