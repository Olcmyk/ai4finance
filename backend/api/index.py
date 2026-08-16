import os
import sys
import traceback

os.environ.setdefault('ENVIRONMENT', 'production')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

# 创建一个简化的 FastAPI app，不使用 lifespan
app = FastAPI(
    title="Personal Finance AI Advisor API",
    description="AI-powered personal finance management system",
    version="1.0.0"
)

# CORS configuration - allow all Vercel deployment URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai4finance.vercel.app",
        "https://formianshi.vercel.app",
        "http://localhost:5174",
        "http://localhost:5173"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Personal Finance AI Advisor API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/api/health")
async def api_health_check():
    """API Health check endpoint"""
    return {"status": "healthy", "api": "ok"}

@app.post("/api/init-categories")
async def init_categories():
    """Initialize category data"""
    from sqlalchemy import text
    from app.core.database import engine

    categories = [
        ('餐饮', '🍔', '#FF6B6B'),
        ('交通', '🚇', '#4ECDC4'),
        ('购物', '🛍️', '#95E1D3'),
        ('娱乐', '🎮', '#F9CA24'),
        ('住房', '🏠', '#6C5CE7'),
        ('医疗', '💊', '#A29BFE'),
        ('教育', '📚', '#74B9FF'),
        ('通讯', '📱', '#00B894'),
        ('其他', '📦', '#B2BEC3')
    ]

    async with engine.begin() as conn:
        # 检查是否已有数据
        result = await conn.execute(text("SELECT COUNT(*) FROM categories"))
        count = result.scalar()

        if count > 0:
            return {"message": f"Categories already initialized ({count} categories)", "count": count}

        # 插入类别数据
        for name, icon, color in categories:
            await conn.execute(
                text("INSERT INTO categories (name, icon, color) VALUES (:name, :icon, :color)"),
                {"name": name, "icon": icon, "color": color}
            )

        return {"message": f"Successfully initialized {len(categories)} categories", "count": len(categories)}

# 注册路由 - 改进错误处理
routers_loaded = []
routers_failed = []

try:
    from app.api.auth import router as auth_router
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
    routers_loaded.append("auth")
except Exception as e:
    routers_failed.append(f"auth: {str(e)}")
    print(f"Failed to load auth router: {e}")
    traceback.print_exc()

try:
    from app.api.categories import router as categories_router
    app.include_router(categories_router, prefix="/api/categories", tags=["categories"])
    routers_loaded.append("categories")
except Exception as e:
    routers_failed.append(f"categories: {str(e)}")
    print(f"Failed to load categories router: {e}")

try:
    from app.api.transactions import router as transactions_router
    app.include_router(transactions_router, prefix="/api/transactions", tags=["transactions"])
    routers_loaded.append("transactions")
except Exception as e:
    routers_failed.append(f"transactions: {str(e)}")
    print(f"Failed to load transactions router: {e}")

try:
    from app.api.analytics import router as analytics_router
    app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
    routers_loaded.append("analytics")
except Exception as e:
    routers_failed.append(f"analytics: {str(e)}")
    print(f"Failed to load analytics router: {e}")

try:
    from app.api.nlp import router as nlp_router
    app.include_router(nlp_router, prefix="/api/nlp", tags=["nlp"])
    routers_loaded.append("nlp")
except Exception as e:
    routers_failed.append(f"nlp: {str(e)}")
    print(f"Failed to load nlp router: {e}")

try:
    from app.api.chat import router as chat_router
    app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
    routers_loaded.append("chat")
except Exception as e:
    routers_failed.append(f"chat: {str(e)}")
    print(f"Failed to load chat router: {e}")

try:
    from app.api.chat_http import router as chat_http_router
    app.include_router(chat_http_router, prefix="/api/chat", tags=["chat-http"])
    routers_loaded.append("chat_http")
except Exception as e:
    routers_failed.append(f"chat_http: {str(e)}")
    print(f"Failed to load chat_http router: {e}")

try:
    from app.api.test_stream import router as test_stream_router
    app.include_router(test_stream_router, prefix="/api/test", tags=["test"])
    routers_loaded.append("test_stream")
except Exception as e:
    routers_failed.append(f"test_stream: {str(e)}")
    print(f"Failed to load test_stream router: {e}")

@app.get("/debug/routers")
async def debug_routers():
    """Debug endpoint to check which routers loaded"""
    return {
        "loaded": routers_loaded,
        "failed": routers_failed
    }

@app.get("/debug/db")
async def debug_db():
    """Debug endpoint to test database connection"""
    try:
        from sqlalchemy import text
        from app.core.database import engine
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            return {"status": "ok", "connection": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e), "type": type(e).__name__}

# Vercel handler
handler = Mangum(app)
