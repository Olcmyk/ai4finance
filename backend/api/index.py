import os
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

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://formianshi.vercel.app", "http://localhost:5174", "http://localhost:5173"],
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

# 注册路由
try:
    from app.api import auth, categories, transactions, analytics, nlp, chat

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
    app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
    app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
    app.include_router(nlp.router, prefix="/api/nlp", tags=["nlp"])
    app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
except Exception as e:
    print(f"Warning: Could not load routers: {e}")

# Vercel handler
handler = Mangum(app)
