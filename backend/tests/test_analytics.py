"""Tests for analytics API endpoints"""

import pytest
from httpx import AsyncClient
from datetime import date
from decimal import Decimal

from app.services.transaction_service import TransactionService
from app.schemas.transaction import TransactionCreate
from app.models.transaction import InputMethod


@pytest.mark.asyncio
async def test_get_summary(client: AsyncClient, auth_headers, test_user, db_session):
    """Test GET /api/analytics/summary"""
    # Create test transaction
    service = TransactionService(db_session)
    await service.create_transaction(
        user_id=test_user["id"],
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("-50.00"),
            category="餐饮",
            transaction_date=date.today()
        )
    )
    await db_session.commit()

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
    assert "balance" in data
    assert "transaction_count" in data


@pytest.mark.asyncio
async def test_get_summary_default_month(client: AsyncClient, auth_headers, test_user, db_session):
    """Test GET /api/analytics/summary without month parameter (defaults to current month)"""
    response = await client.get(
        "/api/analytics/summary",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["month"] == date.today().strftime("%Y-%m")


@pytest.mark.asyncio
async def test_get_by_category(client: AsyncClient, auth_headers, test_user, db_session):
    """Test GET /api/analytics/by-category"""
    # Create test transactions
    service = TransactionService(db_session)
    await service.create_transaction(
        user_id=test_user["id"],
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("-100.00"),
            category="餐饮",
            transaction_date=date.today()
        )
    )
    await service.create_transaction(
        user_id=test_user["id"],
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("-50.00"),
            category="交通",
            transaction_date=date.today()
        )
    )
    await db_session.commit()

    month = date.today().strftime("%Y-%m")
    response = await client.get(
        f"/api/analytics/by-category?month={month}",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["month"] == month
    assert "categories" in data
    assert len(data["categories"]) == 2

    # Should be sorted by amount descending
    assert data["categories"][0]["name"] == "餐饮"
    assert data["categories"][0]["amount"] == 100.00


@pytest.mark.asyncio
async def test_analytics_requires_auth(client: AsyncClient):
    """Test that analytics endpoints require authentication"""
    response = await client.get("/api/analytics/summary")
    assert response.status_code == 401

    response = await client.get("/api/analytics/by-category")
    assert response.status_code == 401
