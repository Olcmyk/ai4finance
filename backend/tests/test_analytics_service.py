"""Tests for analytics service"""

import pytest
from datetime import date
from decimal import Decimal
from app.services.analytics_service import AnalyticsService
from app.services.transaction_service import TransactionService
from app.schemas.transaction import TransactionCreate
from app.models.transaction import InputMethod


@pytest.mark.asyncio
async def test_get_summary(db_session, test_user):
    """Test getting financial summary for a month"""
    # Create test transactions
    trans_service = TransactionService(db_session)
    await trans_service.create_transaction(
        user_id=test_user["id"],
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("-100.00"),
            category="餐饮",
            transaction_date=date.today()
        )
    )
    await trans_service.create_transaction(
        user_id=test_user["id"],
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("1000.00"),
            category="其他",  # Use existing category
            transaction_date=date.today()
        )
    )
    await db_session.commit()

    # Test summary
    analytics_service = AnalyticsService(db_session)
    month = date.today().strftime("%Y-%m")
    summary = await analytics_service.get_summary(test_user["id"], month)

    assert summary["month"] == month
    assert summary["total_income"] == 1000.00
    assert summary["total_expense"] == 100.00
    assert summary["balance"] == 900.00
    assert summary["transaction_count"] == 2


@pytest.mark.asyncio
async def test_get_by_category(db_session, test_user):
    """Test getting spending by category"""
    # Create test transactions with different categories
    trans_service = TransactionService(db_session)
    await trans_service.create_transaction(
        user_id=test_user["id"],
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("-100.00"),
            category="餐饮",
            transaction_date=date.today()
        )
    )
    await trans_service.create_transaction(
        user_id=test_user["id"],
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("-50.00"),
            category="交通",
            transaction_date=date.today()
        )
    )
    await trans_service.create_transaction(
        user_id=test_user["id"],
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("-50.00"),
            category="餐饮",
            transaction_date=date.today()
        )
    )
    await db_session.commit()

    # Test category breakdown
    analytics_service = AnalyticsService(db_session)
    month = date.today().strftime("%Y-%m")
    categories = await analytics_service.get_by_category(test_user["id"], month)

    assert len(categories) == 2
    # Should be sorted by amount descending
    assert categories[0]["name"] == "餐饮"
    assert categories[0]["amount"] == 150.00
    assert categories[0]["percentage"] == 75.0
    assert categories[0]["count"] == 2

    assert categories[1]["name"] == "交通"
    assert categories[1]["amount"] == 50.00
    assert categories[1]["percentage"] == 25.0
    assert categories[1]["count"] == 1


@pytest.mark.asyncio
async def test_get_summary_empty_month(db_session, test_user):
    """Test getting summary for month with no transactions"""
    analytics_service = AnalyticsService(db_session)
    month = "2025-01"  # Past month with no data
    summary = await analytics_service.get_summary(test_user["id"], month)

    assert summary["month"] == month
    assert summary["total_income"] == 0.0
    assert summary["total_expense"] == 0.0
    assert summary["balance"] == 0.0
    assert summary["transaction_count"] == 0
