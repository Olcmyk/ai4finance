"""Initialize Neon database tables"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from urllib.parse import urlparse, urlunparse

# Neon database URL
DATABASE_URL = "postgresql://neondb_owner:npg_B5xXTlgDt7JI@ep-odd-fire-auvfjo93-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Convert to asyncpg format
DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Parse URL and remove query parameters
parsed = urlparse(DATABASE_URL)
DATABASE_URL = urlunparse((
    parsed.scheme,
    parsed.netloc,
    parsed.path,
    parsed.params,
    '',  # Remove query string
    parsed.fragment
))

print(f"Connecting to: {DATABASE_URL.replace('npg_B5xXTlgDt7JI', '***')}")

# Create engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
    pool_size=1,
    max_overflow=0,
    connect_args={
        "ssl": "require",
        "server_settings": {"application_name": "ai4finance-init"},
        "timeout": 30,
    }
)

async def init_db():
    """Initialize database tables"""
    # Import models to register them with Base
    from app.models.user import User
    from app.models.category import Category
    from app.models.transaction import Transaction
    from app.core.database import Base

    print("\nCreating tables...")
    async with engine.begin() as conn:
        # Drop all tables first (careful!)
        # await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

    print("\n✓ Database tables created successfully!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
