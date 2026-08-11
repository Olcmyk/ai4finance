"""Test fixtures and configuration"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

from app.main import app
from app.core.database import Base, get_db
from app.core.seed_data import CATEGORY_SEED_DATA
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
        await conn.execute(text(CATEGORY_SEED_DATA))

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


@pytest_asyncio.fixture(scope="function")
async def test_user(client: AsyncClient):
    """Create a test user and return user data"""
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "testuser@example.com",
            "password": "Test1234",
            "username": "Test User"
        }
    )
    assert response.status_code == 201
    return response.json()


@pytest_asyncio.fixture(scope="function")
async def auth_headers(client: AsyncClient, test_user):
    """Get authentication headers with valid token"""
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "testuser@example.com",
            "password": "Test1234"
        }
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
