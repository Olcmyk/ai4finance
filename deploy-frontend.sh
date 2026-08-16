#!/bin/bash

# 部署前端到 Vercel 的完整脚本

echo "🚀 开始部署前端到 Vercel..."
echo ""

# 进入前端目录
cd "$(dirname "$0")/frontend" || exit 1

# 检查是否已经登录 Vercel
echo "📝 检查 Vercel 登录状态..."
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ 未登录 Vercel，请先运行以下命令登录："
    echo ""
    echo "    vercel login"
    echo ""
    exit 1
fi

echo "✅ 已登录 Vercel"
echo ""

# 设置环境变量
export VITE_API_URL="https://formianshi-backend.onrender.com"

echo "🔧 配置信息："
echo "  - API URL: $VITE_API_URL"
echo "  - Build Command: npm run build"
echo "  - Output Directory: dist"
echo ""

# 部署到生产环境
echo "📦 开始部署..."
vercel --prod --build-env VITE_API_URL="$VITE_API_URL"

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 下一步："
echo "1. 复制 Vercel 提供的 URL"
echo "2. 在 Render Dashboard 更新 FRONTEND_URL 环境变量"
echo "3. 测试应用功能"
