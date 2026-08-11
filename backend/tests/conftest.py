"""Test fixtures and configuration"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

from app.main import app
from app.core.database import Base, get_db
from app.config import settings


# Test database URL (using test database)
TEST_DATABASE_URL = settings.database_url.replace("/finance", "/finance_test")
if TEST_DATABASE_URL.startswith("postgresql://"):
    TEST_DATABASE_URL = TEST_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create a test engine for each test"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        poolclass=None  # Use NullPool to avoid connection reuse issues
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Seed categories
        await conn.execute(text("""
            INSERT INTO categories (name, icon, color) VALUES
            ('餐饮', '🍔', '#FF6B6B'),
            ('交通', '🚇', '#4ECDC4'),
            ('购物', '🛍️', '#95E1D3'),
            ('娱乐', '🎮', '#F9CA24'),
            ('住房', '🏠', '#6C5CE7'),
            ('医疗', '💊', '#A29BFE'),
            ('教育', '📚', '#74B9FF'),
            ('通讯', '📱', '#00B894'),
            ('其他', '📦', '#B2BEC3')
        """))

    yield engine

    # Drop tables and dispose engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine):
    """Create a fresh database session for each test"""
    TestSessionLocal = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )

    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    """Create test client with database session override"""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
