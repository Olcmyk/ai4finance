"""Database connection and session management"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from urllib.parse import urlparse, parse_qs, urlunparse

from app.config import settings

# Convert postgresql:// to postgresql+asyncpg://
DATABASE_URL = settings.database_url
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Parse URL and remove query parameters that asyncpg doesn't support in URL
parsed = urlparse(DATABASE_URL)
query_params = parse_qs(parsed.query)

# Extract sslmode
sslmode = query_params.get('sslmode', ['require'])[0]

# Rebuild URL without query parameters
DATABASE_URL = urlunparse((
    parsed.scheme,
    parsed.netloc,
    parsed.path,
    parsed.params,
    '',  # Remove query string
    parsed.fragment
))

# Create async engine with serverless-friendly settings
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.environment == "development",
    pool_pre_ping=True,
    pool_size=1,  # Minimal pool for serverless
    max_overflow=0,  # No overflow in serverless
    pool_recycle=300,  # Recycle connections after 5 minutes
    connect_args={
        "ssl": sslmode,
        "server_settings": {"application_name": "ai4finance"},
        "timeout": 10,
    }
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base class for models
Base = declarative_base()


async def get_db():
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections"""
    await engine.dispose()
