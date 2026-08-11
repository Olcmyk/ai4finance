"""FastAPI application entry point"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core import init_db, close_db, redis_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("Starting up...")
    await redis_client.connect()
    await init_db()
    print("Database and Redis connected")
    yield
    # Shutdown
    print("Shutting down...")
    await redis_client.disconnect()
    await close_db()
    print("Connections closed")


app = FastAPI(
    title="Personal Finance AI Advisor API",
    description="AI-powered personal finance management system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
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


# Register API routers
from app.api import auth, categories, transactions, analytics, nlp

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(nlp.router, prefix="/api/nlp", tags=["nlp"])

# Additional routers (will be added later)
# from app.api import ai
# app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
