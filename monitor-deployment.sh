#!/bin/bash

# 实时监控 Render 部署状态

DEPLOY_ID="dep-da0n60pt0dsc73a319vg"
SERVICE_ID="srv-da0mo0dg1s2s73c0550g"
RENDER_TOKEN="rnd_96Aku2iMjjaDj4TpXItEZhKlQG2N"

echo "🔄 监控 Render 后端部署状态..."
echo "部署 ID: $DEPLOY_ID"
echo ""

while true; do
    # 获取部署状态
    STATUS=$(curl -s "https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID" \
        -H "Authorization: Bearer $RENDER_TOKEN" | jq -r '.status')

    TIMESTAMP=$(date +"%H:%M:%S")

    case "$STATUS" in
        "build_in_progress")
            echo "[$TIMESTAMP] 🔨 构建中..."
            ;;
        "update_in_progress")
            echo "[$TIMESTAMP] 📦 更新中..."
            ;;
        "live")
            echo "[$TIMESTAMP] ✅ 部署成功！服务已上线"
            echo ""
            echo "🎉 后端已就绪！"
            echo "URL: https://formianshi-backend.onrender.com"
            echo ""
            echo "现在测试 API..."
            sleep 5
            curl -s https://formianshi-backend.onrender.com/health | jq
            break
            ;;
        "build_failed"|"update_failed")
            echo "[$TIMESTAMP] ❌ 部署失败"
            echo ""
            echo "查看日志: https://dashboard.render.com/web/$SERVICE_ID/logs"
            break
            ;;
        *)
            echo "[$TIMESTAMP] 📊 状态: $STATUS"
            ;;
    esac

    sleep 10
done

echo ""
echo "完整应用 URL: https://ai4finance.vercel.app"
