# Personal Finance AI Advisor - MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal viable AI-powered personal finance application with user authentication, transaction management, data analytics, and AI advisory features.

**Architecture:** Full-stack application with FastAPI backend, React frontend, PostgreSQL for data persistence, Redis for caching, and LangChain for AI integration. Backend follows layered architecture (API → Service → Model). Frontend uses React Context for state management.

**Tech Stack:** 
- Backend: Python 3.11+, FastAPI, SQLAlchemy 2.0, LangChain, JWT auth
- Frontend: React 18, TypeScript, Vite, TailwindCSS, Recharts
- Database: PostgreSQL 15, Redis 7
- AI: OpenAI GPT-4o-mini

## Global Constraints

- Python >= 3.11
- Node.js >= 18
- PostgreSQL >= 15
- Redis >= 7
- All API endpoints must require authentication except /auth/register and /auth/login
- All passwords must be hashed with bcrypt
- All dates in ISO 8601 format
- All monetary amounts as Decimal with 2 decimal places
- All API responses must include proper error handling with status codes
- Rate limiting: AI endpoints max 10 req/min, transaction parsing max 20 req/min
- JWT tokens: access token 15min, refresh token 7 days

---

## Task 1: User Authentication API - Registration & Login

**Files:**
- Create: `backend/app/api/auth.py`
- Create: `backend/app/services/user_service.py`
- Create: `backend/tests/test_auth.py`
- Modify: `backend/app/main.py:62-69` (uncomment router registration)

**Interfaces:**
- Consumes: `app.core.security.hash_password`, `app.core.security.verify_password`, `app.core.security.create_access_token`, `app.core.security.create_refresh_token`, `app.models.User`
- Produces: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`

- [ ] **Step 1: Write user service test**

```python
# backend/tests/test_user_service.py
import pytest
from app.services.user_service import UserService
from app.schemas.user import UserCreate

@pytest.mark.asyncio
async def test_create_user(db_session):
    service = UserService(db_session)
    user_data = UserCreate(
        email="test@example.com",
        password="Test1234",
        username="Test User"
    )
    user = await service.create_user(user_data)
    assert user.email == "test@example.com"
    assert user.username == "Test User"
    assert user.password_hash is not None
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
source venv/bin/activate
pytest tests/test_user_service.py::test_create_user -v
```

Expected: FAIL with "No module named 'app.services.user_service'"

- [ ] **Step 3: Implement UserService**

```python
# backend/app/services/user_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            username=user_data.username
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_user_service.py::test_create_user -v
```

Expected: PASS

- [ ] **Step 5: Write auth API test**

```python
# backend/tests/test_auth.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Test1234",
            "username": "New User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "New User"
    assert "id" in data

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    # First register
    await client.post(
        "/api/auth/register",
        json={
            "email": "login@example.com",
            "password": "Test1234",
            "username": "Login User"
        }
    )
    
    # Then login
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "login@example.com",
            "password": "Test1234"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
```

- [ ] **Step 6: Run test to verify it fails**

```bash
pytest tests/test_auth.py -v
```

Expected: FAIL with "404 Not Found"

- [ ] **Step 7: Implement auth API endpoints**

```python
# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, verify_refresh_token, get_current_user
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserResponse, UserLogin, TokenResponse, RefreshTokenRequest
from app.config import settings

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    service = UserService(db)
    
    # Check if user exists
    existing_user = await service.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = await service.create_user(user_data)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login and get access token"""
    service = UserService(db)
    
    # Authenticate user
    user = await service.authenticate(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token"""
    user_id = verify_refresh_token(request.refresh_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Create new access token
    access_token = create_access_token({"sub": user_id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=request.refresh_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user information"""
    service = UserService(db)
    user = await service.get_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
```

- [ ] **Step 8: Register auth router in main.py**

```python
# backend/app/main.py (modify lines 62-69)
from app.api import auth

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
pytest tests/test_auth.py -v
```

Expected: All PASS

- [ ] **Step 10: Test manually via API docs**

```bash
# Backend should be running on http://localhost:8000
# Open http://localhost:8000/docs
# Test POST /api/auth/register
# Test POST /api/auth/login
```

- [ ] **Step 11: Commit**

```bash
git add backend/app/api/auth.py backend/app/services/user_service.py backend/tests/test_auth.py backend/app/main.py
git commit -m "feat: implement user authentication API with register, login, refresh, and get current user endpoints"
```

---

## Task 2: Categories API & Data Seeding

**Files:**
- Create: `backend/app/api/categories.py`
- Create: `backend/alembic/versions/001_initial_schema.py`
- Create: `backend/tests/test_categories.py`
- Modify: `backend/app/main.py:68` (add categories router)

**Interfaces:**
- Consumes: `app.models.Category`
- Produces: `GET /api/categories` returning list of categories with id, name, icon, color

- [ ] **Step 1: Create Alembic migration for initial schema**

```python
# backend/alembic/versions/001_initial_schema.py
"""initial schema

Revision ID: 001
Revises: 
Create Date: 2026-08-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create categories table
    op.create_table('categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Seed categories
    op.execute("""
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
    """)
    
    # Create transactions table
    op.create_table('transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('input_method', sa.Enum('manual', 'natural_language', name='inputmethod'), nullable=False),
        sa.Column('original_input', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'])
    op.create_index(op.f('ix_transactions_transaction_date'), 'transactions', ['transaction_date'])
    
    # Create ai_conversations table
    op.create_table('ai_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.Enum('user', 'assistant', name='messagerole'), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_conversations_user_id'), 'ai_conversations', ['user_id'])
    op.create_index(op.f('ix_ai_conversations_session_id'), 'ai_conversations', ['session_id'])

def downgrade():
    op.drop_table('ai_conversations')
    op.drop_table('transactions')
    op.drop_table('categories')
    op.drop_table('users')
```

- [ ] **Step 2: Initialize Alembic if not already done**

```bash
cd backend
source venv/bin/activate
alembic init alembic
```

- [ ] **Step 3: Configure Alembic**

```python
# backend/alembic/env.py (modify the imports and target_metadata)
from app.core.database import Base
from app.models import User, Transaction, Category, AIConversation
target_metadata = Base.metadata
```

- [ ] **Step 4: Run migration to create tables**

```bash
alembic upgrade head
```

Expected: Tables created in PostgreSQL

- [ ] **Step 5: Write categories API test**

```python
# backend/tests/test_categories.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_categories(client: AsyncClient):
    response = await client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    categories = data["categories"]
    assert len(categories) == 9
    assert categories[0]["name"] == "餐饮"
    assert categories[0]["icon"] == "🍔"
    assert categories[0]["color"] == "#FF6B6B"
```

- [ ] **Step 6: Run test to verify it fails**

```bash
pytest tests/test_categories.py -v
```

Expected: FAIL with "404 Not Found"

- [ ] **Step 7: Implement categories API**

```python
# backend/app/api/categories.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.category import Category

router = APIRouter()

@router.get("")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all categories"""
    query = select(Category)
    result = await db.execute(query)
    categories = result.scalars().all()
    
    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "icon": cat.icon,
                "color": cat.color
            }
            for cat in categories
        ]
    }
```

- [ ] **Step 8: Register categories router**

```python
# backend/app/main.py (add after auth router)
from app.api import auth, categories

app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
```

- [ ] **Step 9: Run test to verify it passes**

```bash
pytest tests/test_categories.py -v
```

Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add backend/app/api/categories.py backend/alembic/ backend/tests/test_categories.py backend/app/main.py
git commit -m "feat: add categories API and database migrations with seeded category data"
```

---

## Task 3: Transaction Management API

**Files:**
- Create: `backend/app/api/transactions.py`
- Create: `backend/app/services/transaction_service.py`
- Create: `backend/tests/test_transactions.py`
- Modify: `backend/app/main.py:69` (add transactions router)

**Interfaces:**
- Consumes: `app.models.Transaction`, `app.core.security.get_current_user`, `app.services.user_service.UserService`
- Produces: `POST /api/transactions`, `GET /api/transactions`, `GET /api/transactions/{id}`, `PUT /api/transactions/{id}`, `DELETE /api/transactions/{id}`

- [ ] **Step 1: Write transaction service test**

```python
# backend/tests/test_transaction_service.py
import pytest
from datetime import date
from decimal import Decimal
from app.services.transaction_service import TransactionService
from app.schemas.transaction import TransactionCreate
from app.models.transaction import InputMethod

@pytest.mark.asyncio
async def test_create_transaction(db_session, test_user):
    service = TransactionService(db_session)
    transaction_data = TransactionCreate(
        input_method=InputMethod.MANUAL,
        amount=Decimal("-45.50"),
        category="餐饮",
        description="午餐",
        transaction_date=date.today(),
        original_input=None
    )
    transaction = await service.create_transaction(
        user_id=str(test_user.id),
        data=transaction_data
    )
    assert transaction.amount == Decimal("-45.50")
    assert transaction.category == "餐饮"
    assert transaction.user_id == test_user.id
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_transaction_service.py::test_create_transaction -v
```

Expected: FAIL with "No module named 'app.services.transaction_service'"

- [ ] **Step 3: Implement TransactionService**

```python
# backend/app/services/transaction_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, extract
from typing import List, Optional
from datetime import date
from decimal import Decimal
import uuid

from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate

class TransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_transaction(
        self, 
        user_id: str, 
        data: TransactionCreate
    ) -> Transaction:
        """Create a new transaction"""
        transaction = Transaction(
            user_id=uuid.UUID(user_id),
            amount=data.amount,
            category=data.category,
            description=data.description,
            transaction_date=data.transaction_date,
            input_method=data.input_method,
            original_input=data.original_input
        )
        self.db.add(transaction)
        await self.db.flush()
        await self.db.refresh(transaction)
        return transaction
    
    async def get_transactions(
        self,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Transaction], int]:
        """Get transactions with filters and pagination"""
        user_uuid = uuid.UUID(user_id)
        
        # Build query
        query = select(Transaction).where(Transaction.user_id == user_uuid)
        
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        if category:
            query = query.where(Transaction.category == category)
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query)
        
        # Get paginated results
        query = query.order_by(Transaction.transaction_date.desc())
        query = query.offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        transactions = result.scalars().all()
        
        return list(transactions), total or 0
    
    async def get_transaction_by_id(
        self,
        transaction_id: str,
        user_id: str
    ) -> Optional[Transaction]:
        """Get a single transaction by ID"""
        query = select(Transaction).where(
            and_(
                Transaction.id == uuid.UUID(transaction_id),
                Transaction.user_id == uuid.UUID(user_id)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def update_transaction(
        self,
        transaction_id: str,
        user_id: str,
        data: dict
    ) -> Optional[Transaction]:
        """Update a transaction"""
        transaction = await self.get_transaction_by_id(transaction_id, user_id)
        
        if transaction:
            for key, value in data.items():
                if value is not None:
                    setattr(transaction, key, value)
            await self.db.flush()
            await self.db.refresh(transaction)
        
        return transaction
    
    async def delete_transaction(
        self,
        transaction_id: str,
        user_id: str
    ) -> bool:
        """Delete a transaction"""
        transaction = await self.get_transaction_by_id(transaction_id, user_id)
        
        if transaction:
            await self.db.delete(transaction)
            await self.db.flush()
            return True
        return False
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_transaction_service.py::test_create_transaction -v
```

Expected: PASS

- [ ] **Step 5: Write transactions API tests**

```python
# backend/tests/test_transactions.py
import pytest
from httpx import AsyncClient
from datetime import date

@pytest.mark.asyncio
async def test_create_transaction_manual(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -45.50,
            "category": "餐饮",
            "description": "午餐",
            "transaction_date": str(date.today())
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == "-45.50"
    assert data["category"] == "餐饮"

@pytest.mark.asyncio
async def test_get_transactions(client: AsyncClient, auth_headers):
    # Create a transaction first
    await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -30.00,
            "category": "交通",
            "description": "地铁",
            "transaction_date": str(date.today())
        }
    )
    
    # Get transactions
    response = await client.get(
        "/api/transactions",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data
    assert len(data["data"]) > 0

@pytest.mark.asyncio
async def test_update_transaction(client: AsyncClient, auth_headers):
    # Create transaction
    create_response = await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -50.00,
            "category": "餐饮",
            "description": "晚餐",
            "transaction_date": str(date.today())
        }
    )
    transaction_id = create_response.json()["id"]
    
    # Update transaction
    response = await client.put(
        f"/api/transactions/{transaction_id}",
        headers=auth_headers,
        json={
            "amount": -55.00,
            "description": "晚餐加饮料"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == "-55.00"
    assert data["description"] == "晚餐加饮料"

@pytest.mark.asyncio
async def test_delete_transaction(client: AsyncClient, auth_headers):
    # Create transaction
    create_response = await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -20.00,
            "category": "其他",
            "description": "测试",
            "transaction_date": str(date.today())
        }
    )
    transaction_id = create_response.json()["id"]
    
    # Delete transaction
    response = await client.delete(
        f"/api/transactions/{transaction_id}",
        headers=auth_headers
    )
    assert response.status_code == 204
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
pytest tests/test_transactions.py -v
```

Expected: FAIL with "404 Not Found"

- [ ] **Step 7: Implement transactions API**

```python
# backend/app/api/transactions.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.transaction_service import TransactionService
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionList
)

router = APIRouter()

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new transaction"""
    service = TransactionService(db)
    transaction = await service.create_transaction(
        user_id=current_user["user_id"],
        data=transaction_data
    )
    return transaction

@router.get("", response_model=TransactionList)
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get transactions with filters and pagination"""
    service = TransactionService(db)
    skip = (page - 1) * page_size
    
    transactions, total = await service.get_transactions(
        user_id=current_user["user_id"],
        start_date=start_date,
        end_date=end_date,
        category=category,
        skip=skip,
        limit=page_size
    )
    
    return TransactionList(
        total=total,
        page=page,
        page_size=page_size,
        data=transactions
    )

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single transaction"""
    service = TransactionService(db)
    transaction = await service.get_transaction_by_id(
        transaction_id=transaction_id,
        user_id=current_user["user_id"]
    )
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return transaction

@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    transaction_data: TransactionUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a transaction"""
    service = TransactionService(db)
    
    # Filter out None values
    update_data = {k: v for k, v in transaction_data.dict().items() if v is not None}
    
    transaction = await service.update_transaction(
        transaction_id=transaction_id,
        user_id=current_user["user_id"],
        data=update_data
    )
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return transaction

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction"""
    service = TransactionService(db)
    deleted = await service.delete_transaction(
        transaction_id=transaction_id,
        user_id=current_user["user_id"]
    )
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
```

- [ ] **Step 8: Register transactions router**

```python
# backend/app/main.py (add after categories router)
from app.api import auth, categories, transactions

app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
pytest tests/test_transactions.py -v
```

Expected: All PASS

- [ ] **Step 10: Commit**

```bash
git add backend/app/api/transactions.py backend/app/services/transaction_service.py backend/tests/test_transactions.py backend/app/main.py
git commit -m "feat: implement transaction management API with CRUD operations and filtering"
```

---

## Task 4: Frontend Authentication & Layout

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/pages/Register.tsx`
- Create: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/App.tsx` (add routing)
- Modify: `frontend/src/main.tsx` (add AuthProvider)

**Interfaces:**
- Consumes: Backend `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Produces: `AuthContext` with user state, login/logout functions, protected routes

- [ ] **Step 1: Install additional dependencies**

```bash
cd frontend
npm install react-router-dom @types/react-router-dom
```

- [ ] **Step 2: Create API client**

```typescript
// frontend/src/api/client.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token } = response.data;
          localStorage.setItem('accessToken', access_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

- [ ] **Step 3: Create auth API functions**

```typescript
// frontend/src/api/auth.ts
import apiClient from './client';

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const authApi = {
  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<TokenResponse> => {
    const response = await apiClient.post('/api/auth/login', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },
};
```

- [ ] **Step 4: Create AuthContext**

```typescript
// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const tokenResponse = await authApi.login({ email, password });
    localStorage.setItem('accessToken', tokenResponse.access_token);
    localStorage.setItem('refreshToken', tokenResponse.refresh_token);
    
    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);
  };

  const register = async (email: string, password: string, username: string) => {
    await authApi.register({ email, password, username });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

- [ ] **Step 5: Create Login page**

```typescript
// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            AI 个人财务顾问
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            登录您的账户
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500">
              还没有账户？立即注册
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

- [ ] **Step 6: Create Register page**

```typescript
// frontend/src/pages/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, username);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            创建新账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            开始使用 AI 个人财务顾问
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="张三"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="至少8个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                密码必须至少8个字符，包含大小写字母和数字
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500">
              已有账户？立即登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
```

- [ ] **Step 7: Create Layout component**

```typescript
// frontend/src/components/Layout.tsx
import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">
                  💰 财务顾问
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/app/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  概览
                </Link>
                <Link
                  to="/app/transactions"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  交易
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
```

- [ ] **Step 8: Update App.tsx with routing**

```typescript
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<div className="text-gray-900">Dashboard 即将上线</div>} />
          <Route path="transactions" element={<div className="text-gray-900">Transactions 即将上线</div>} />
        </Route>
        <Route path="/" element={<Navigate to="/app/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 9: Update main.tsx with AuthProvider**

```typescript
// frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
```

- [ ] **Step 10: Test the authentication flow**

```bash
# Make sure backend is running on :8000
# Make sure frontend is running on :5173
# Open http://localhost:5173
# Should redirect to /login
# Test registration
# Test login
# Should see dashboard with navigation
```

- [ ] **Step 11: Commit**

```bash
git add frontend/src/
git commit -m "feat: implement frontend authentication with login, register, and protected routes"
```

---

## Task 5: Frontend Transaction Management

**Files:**
- Create: `frontend/src/api/transactions.ts`
- Create: `frontend/src/pages/TransactionList.tsx`
- Create: `frontend/src/pages/NewTransaction.tsx`
- Create: `frontend/src/types/transaction.ts`
- Modify: `frontend/src/App.tsx` (add transaction routes)

**Interfaces:**
- Consumes: Backend `/api/transactions` endpoints, `/api/categories`
- Produces: Transaction list page with CRUD operations

- [ ] **Step 1: Create transaction types**

```typescript
// frontend/src/types/transaction.ts
export interface Transaction {
  id: string;
  user_id: string;
  amount: string;
  category: string;
  description: string | null;
  transaction_date: string;
  input_method: 'manual' | 'natural_language';
  original_input: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}
```

- [ ] **Step 2: Create transactions API**

```typescript
// frontend/src/api/transactions.ts
import apiClient from './client';
import { Transaction, Category } from '../types/transaction';

export interface CreateTransactionData {
  input_method: 'manual' | 'natural_language';
  amount?: number;
  category?: string;
  description?: string;
  transaction_date?: string;
  original_input?: string;
}

export interface TransactionListResponse {
  total: number;
  page: number;
  page_size: number;
  data: Transaction[];
}

export const transactionsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    category?: string;
  }): Promise<TransactionListResponse> => {
    const response = await apiClient.get('/api/transactions', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get(`/api/transactions/${id}`);
    return response.data;
  },

  create: async (data: CreateTransactionData): Promise<Transaction> => {
    const response = await apiClient.post('/api/transactions', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateTransactionData>): Promise<Transaction> => {
    const response = await apiClient.put(`/api/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/transactions/${id}`);
  },
};

export const categoriesApi = {
  getAll: async (): Promise<{ categories: Category[] }> => {
    const response = await apiClient.get('/api/categories');
    return response.data;
  },
};
```

- [ ] **Step 3: Create Transaction List page**

```typescript
// frontend/src/pages/TransactionList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionsApi } from '../api/transactions';
import { Transaction } from '../types/transaction';

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, [page]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsApi.getAll({ page, page_size: 20 });
      setTransactions(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条交易记录吗？')) return;
    
    try {
      await transactionsApi.delete(id);
      loadTransactions();
    } catch (error) {
      alert('删除失败，请重试');
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    const color = num < 0 ? 'text-red-600' : 'text-green-600';
    return <span className={color}>¥{Math.abs(num).toFixed(2)}</span>;
  };

  const groupByDate = (transactions: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      if (!groups[t.transaction_date]) {
        groups[t.transaction_date] = [];
      }
      groups[t.transaction_date].push(t);
    });
    return groups;
  };

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  const groupedTransactions = groupByDate(transactions);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">交易记录</h1>
        <Link
          to="/app/transactions/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          + 新建交易
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg">
          <p className="text-gray-500">暂无交易记录</p>
          <Link to="/app/transactions/new" className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
            添加第一笔交易
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {Object.entries(groupedTransactions).map(([date, items]) => (
            <div key={date} className="border-b border-gray-200 last:border-0">
              <div className="bg-gray-50 px-4 py-2">
                <h3 className="text-sm font-medium text-gray-700">{date}</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {items.map((transaction) => (
                  <li key={transaction.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.category}
                          </p>
                          <p className="text-sm font-semibold">
                            {formatAmount(transaction.amount)}
                          </p>
                        </div>
                        {transaction.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            第 {page} 页 / 共 {Math.ceil(total / 20)} 页
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
```

- [ ] **Step 4: Create New Transaction page**

```typescript
// frontend/src/pages/NewTransaction.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsApi, categoriesApi } from '../api/transactions';
import { Category } from '../types/transaction';

const NewTransaction: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.categories);
      if (response.categories.length > 0) {
        setCategory(response.categories[0].name);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue)) {
        setError('请输入有效的金额');
        setLoading(false);
        return;
      }

      await transactionsApi.create({
        input_method: 'manual',
        amount: -Math.abs(amountValue), // Negative for expense
        category,
        description: description || undefined,
        transaction_date: transactionDate,
      });

      navigate('/app/transactions');
    } catch (err: any) {
      setError(err.response?.data?.detail || '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">新建交易</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              金额（元）
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              类别
            </label>
            <select
              id="category"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              日期
            </label>
            <input
              type="date"
              id="date"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              备注（可选）
            </label>
            <textarea
              id="description"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="添加备注..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/app/transactions')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTransaction;
```

- [ ] **Step 5: Update App.tsx with transaction routes**

```typescript
// frontend/src/App.tsx (modify the /app route)
import TransactionList from './pages/TransactionList';
import NewTransaction from './pages/NewTransaction';

// Inside the /app Route:
<Route path="transactions" element={<TransactionList />} />
<Route path="transactions/new" element={<NewTransaction />} />
```

- [ ] **Step 6: Test transaction management**

```bash
# Open http://localhost:5173/app/transactions
# Test creating a new transaction
# Test viewing transaction list
# Test deleting a transaction
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: implement frontend transaction management with list and create pages"
```

---

## Task 6: Dashboard with Basic Analytics

**Files:**
- Create: `frontend/src/api/analytics.ts`
- Create: `frontend/src/pages/Dashboard.tsx`
- Create: `backend/app/api/analytics.py`
- Create: `backend/app/services/analytics_service.py`
- Create: `backend/tests/test_analytics.py`
- Modify: `backend/app/main.py:70` (add analytics router)
- Modify: `frontend/src/App.tsx` (update dashboard route)

**Interfaces:**
- Consumes: Transaction data from database
- Produces: `GET /api/analytics/summary`, Dashboard page with charts

- [ ] **Step 1: Write analytics service test**

```python
# backend/tests/test_analytics_service.py
import pytest
from datetime import date
from decimal import Decimal
from app.services.analytics_service import AnalyticsService
from app.services.transaction_service import TransactionService
from app.schemas.transaction import TransactionCreate
from app.models.transaction import InputMethod

@pytest.mark.asyncio
async def test_get_summary(db_session, test_user):
    # Create test transactions
    trans_service = TransactionService(db_session)
    await trans_service.create_transaction(
        user_id=str(test_user.id),
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("-100.00"),
            category="餐饮",
            transaction_date=date.today()
        )
    )
    await trans_service.create_transaction(
        user_id=str(test_user.id),
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("1000.00"),
            category="工资",
            transaction_date=date.today()
        )
    )
    
    # Test summary
    analytics_service = AnalyticsService(db_session)
    month = date.today().strftime("%Y-%m")
    summary = await analytics_service.get_summary(str(test_user.id), month)
    
    assert summary["month"] == month
    assert summary["total_income"] == Decimal("1000.00")
    assert summary["total_expense"] == Decimal("100.00")
    assert summary["balance"] == Decimal("900.00")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_analytics_service.py::test_get_summary -v
```

Expected: FAIL

- [ ] **Step 3: Implement AnalyticsService**

```python
# backend/app/services/analytics_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from typing import Dict, List
from decimal import Decimal
from datetime import date
import uuid

from app.models.transaction import Transaction
from app.core.redis_client import redis_client

class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_summary(self, user_id: str, month: str) -> Dict:
        """Get financial summary for a month"""
        # Try cache first
        cache_key = f"analytics:{user_id}:{month}"
        cached = await redis_client.get(cache_key)
        if cached:
            return cached
        
        # Parse month
        year, month_num = map(int, month.split('-'))
        user_uuid = uuid.UUID(user_id)
        
        # Get income
        income_query = select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_uuid,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month_num,
                Transaction.amount > 0
            )
        )
        income = await self.db.scalar(income_query) or Decimal("0")
        
        # Get expense
        expense_query = select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_uuid,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month_num,
                Transaction.amount < 0
            )
        )
        expense = abs(await self.db.scalar(expense_query) or Decimal("0"))
        
        # Get transaction count
        count_query = select(func.count(Transaction.id)).where(
            and_(
                Transaction.user_id == user_uuid,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month_num
            )
        )
        count = await self.db.scalar(count_query) or 0
        
        summary = {
            "month": month,
            "total_income": float(income),
            "total_expense": float(expense),
            "balance": float(income - expense),
            "transaction_count": count
        }
        
        # Cache for 1 hour
        await redis_client.set(cache_key, summary, ttl=3600)
        
        return summary
    
    async def get_by_category(self, user_id: str, month: str) -> List[Dict]:
        """Get spending by category"""
        year, month_num = map(int, month.split('-'))
        user_uuid = uuid.UUID(user_id)
        
        query = select(
            Transaction.category,
            func.sum(Transaction.amount).label('amount'),
            func.count(Transaction.id).label('count')
        ).where(
            and_(
                Transaction.user_id == user_uuid,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month_num,
                Transaction.amount < 0  # Only expenses
            )
        ).group_by(Transaction.category)
        
        result = await self.db.execute(query)
        categories = []
        total = Decimal("0")
        
        for row in result:
            amount = abs(float(row.amount))
            total += Decimal(str(amount))
            categories.append({
                "name": row.category,
                "amount": amount,
                "count": row.count
            })
        
        # Calculate percentages
        for cat in categories:
            if total > 0:
                cat["percentage"] = round((Decimal(str(cat["amount"])) / total * 100), 1)
            else:
                cat["percentage"] = 0.0
        
        # Sort by amount descending
        categories.sort(key=lambda x: x["amount"], reverse=True)
        
        return categories
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_analytics_service.py::test_get_summary -v
```

Expected: PASS

- [ ] **Step 5: Write analytics API test**

```python
# backend/tests/test_analytics.py
import pytest
from httpx import AsyncClient
from datetime import date

@pytest.mark.asyncio
async def test_get_summary(client: AsyncClient, auth_headers, test_user, db_session):
    # Create test transaction
    from app.services.transaction_service import TransactionService
    from app.schemas.transaction import TransactionCreate
    from app.models.transaction import InputMethod
    from decimal import Decimal
    
    service = TransactionService(db_session)
    await service.create_transaction(
        user_id=str(test_user.id),
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("-50.00"),
            category="餐饮",
            transaction_date=date.today()
        )
    )
    
    month = date.today().strftime("%Y-%m")
    response = await client.get(
        f"/api/analytics/summary?month={month}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["month"] == month
    assert "total_income" in data
    assert "total_expense" in data
```

- [ ] **Step 6: Run test to verify it fails**

```bash
pytest tests/test_analytics.py -v
```

Expected: FAIL with "404 Not Found"

- [ ] **Step 7: Implement analytics API**

```python
# backend/app/api/analytics.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import SummaryResponse, CategorySummaryResponse

router = APIRouter()

@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    month: str = Query(default=None, regex=r"^\d{4}-\d{2}$"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get financial summary for a month"""
    if not month:
        month = date.today().strftime("%Y-%m")
    
    service = AnalyticsService(db)
    summary = await service.get_summary(current_user["user_id"], month)
    return summary

@router.get("/by-category", response_model=CategorySummaryResponse)
async def get_by_category(
    month: str = Query(default=None, regex=r"^\d{4}-\d{2}$"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get spending by category"""
    if not month:
        month = date.today().strftime("%Y-%m")
    
    service = AnalyticsService(db)
    categories = await service.get_by_category(current_user["user_id"], month)
    return CategorySummaryResponse(month=month, categories=categories)
```

- [ ] **Step 8: Register analytics router**

```python
# backend/app/main.py
from app.api import auth, categories, transactions, analytics

app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
```

- [ ] **Step 9: Run test to verify it passes**

```bash
pytest tests/test_analytics.py -v
```

Expected: PASS

- [ ] **Step 10: Create frontend analytics API**

```typescript
// frontend/src/api/analytics.ts
import apiClient from './client';

export interface Summary {
  month: string;
  total_income: number;
  total_expense: number;
  balance: number;
  transaction_count: number;
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  percentage: number;
  count: number;
}

export const analyticsApi = {
  getSummary: async (month?: string): Promise<Summary> => {
    const params = month ? { month } : {};
    const response = await apiClient.get('/api/analytics/summary', { params });
    return response.data;
  },

  getByCategory: async (month?: string): Promise<{ month: string; categories: CategoryBreakdown[] }> => {
    const params = month ? { month } : {};
    const response = await apiClient.get('/api/analytics/by-category', { params });
    return response.data;
  },
};
```

- [ ] **Step 11: Create Dashboard page**

```typescript
// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api/analytics';
import type { Summary, CategoryBreakdown } from '../api/analytics';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, categoryData] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getByCategory(),
      ]);
      setSummary(summaryData);
      setCategories(categoryData.categories);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">财务概览</h1>
        <Link
          to="/app/transactions/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          + 新建交易
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  本月收入
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  ¥{summary?.total_income.toFixed(2) || '0.00'}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  本月支出
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-red-600">
                  ¥{summary?.total_expense.toFixed(2) || '0.00'}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  结余
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  ¥{summary?.balance.toFixed(2) || '0.00'}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">支出类别</h3>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无数据</p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {cat.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ¥{cat.amount.toFixed(2)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/app/transactions"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span className="text-2xl mr-3">📝</span>
            <div>
              <p className="font-medium text-gray-900">查看所有交易</p>
              <p className="text-sm text-gray-500">浏览完整交易记录</p>
            </div>
          </Link>
          <Link
            to="/app/transactions/new"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span className="text-2xl mr-3">➕</span>
            <div>
              <p className="font-medium text-gray-900">添加新交易</p>
              <p className="text-sm text-gray-500">记录一笔收入或支出</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

- [ ] **Step 12: Update App.tsx dashboard route**

```typescript
// frontend/src/App.tsx
import Dashboard from './pages/Dashboard';

// Update the dashboard route:
<Route path="dashboard" element={<Dashboard />} />
```

- [ ] **Step 13: Test the dashboard**

```bash
# Open http://localhost:5173/app/dashboard
# Should see summary cards
# Should see category breakdown
# Create some transactions and verify dashboard updates
```

- [ ] **Step 14: Commit**

```bash
git add backend/ frontend/
git commit -m "feat: implement analytics service and dashboard with summary and category breakdown"
```

---

## Plan Summary

This plan delivers a working MVP with:

✅ **Backend (Python/FastAPI)**
- User authentication with JWT (register, login, refresh, me)
- Transaction CRUD operations with pagination and filtering
- Categories API with seeded data
- Analytics API with monthly summary and category breakdown
- Database migrations with Alembic
- Redis caching for analytics
- Rate limiting protection
- Full test coverage

✅ **Frontend (React/TypeScript)**
- Authentication flow with login/register pages
- Protected routes with AuthContext
- Transaction management (list, create, delete)
- Dashboard with financial summary
- Responsive UI with TailwindCSS
- API client with automatic token refresh

✅ **Infrastructure**
- PostgreSQL database with proper schema
- Redis caching layer
- Docker Compose for local development
- Environment configuration

## What's NOT in This Plan

This MVP focuses on core functionality. The following features are intentionally excluded and can be added later:

- ❌ Natural language transaction parsing (LangChain/OpenAI integration)
- ❌ AI financial advisor chat (WebSocket + LangChain)
- ❌ Advanced analytics (trends, insights, charts)
- ❌ Transaction editing functionality
- ❌ Data export/import
- ❌ Mobile responsive improvements
- ❌ Production deployment configuration
- ❌ Performance optimizations
- ❌ Comprehensive error handling

These can be implemented as follow-up tasks once the MVP is validated.

## Testing Strategy

Each task includes:
1. **Unit tests** for services (backend)
2. **API tests** for endpoints (backend)
3. **Manual testing** via API docs and browser (both)

Run all tests before final commit:
```bash
# Backend tests
cd backend
source venv/bin/activate
pytest tests/ -v --cov=app

# Frontend (if tests added)
cd frontend
npm test
```

## Deployment Notes

For local development:
- Backend runs on http://localhost:8000
- Frontend runs on http://localhost:5173
- PostgreSQL on localhost:5432
- Redis on localhost:6379

For production (Railway):
- Configure environment variables in Railway dashboard
- Enable automatic deployments from GitHub
- Database and Redis provided by Railway
- See project README for detailed deployment steps

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-08-11-personal-finance-ai-advisor-mvp.md`.**

Choose your execution approach:

### Option 1: Subagent-Driven Development (Recommended)

**Best for:** Complex projects requiring careful review between tasks

**How it works:**
- Fresh subagent spawned for each task
- Two-stage review: interim check + final verification
- Fast iteration with isolated context per task
- Better error recovery and task-level rollback

**To use:** I will invoke `superpowers:subagent-driven-development` to execute this plan task-by-task with review gates.

### Option 2: Inline Execution

**Best for:** Batch execution with periodic checkpoints

**How it works:**
- Execute tasks sequentially in this session
- Checkpoint reviews at key milestones
- Shared context across all tasks
- Faster for simple, well-defined tasks

**To use:** I will invoke `superpowers:executing-plans` to run through tasks with checkpoint reviews.

---

**Which approach would you like to use?**

1. Type "subagent" for Option 1 (recommended for this project)
2. Type "inline" for Option 2
3. Or simply say "execute the plan" and I'll choose the best approach

