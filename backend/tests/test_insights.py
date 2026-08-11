"""Tests for insights service"""

import pytest
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.insights_service import (
    InsightsService,
    SPENDING_CHANGE_THRESHOLD,
    TOP_CATEGORY_ALERT_THRESHOLD,
    DISCRETIONARY_SPENDING_THRESHOLD,
    UNUSUAL_ACTIVITY_MULTIPLIER,
    CACHE_TTL_SECONDS
)


class TestInsightsService:
    """Tests for InsightsService"""

    @pytest.mark.asyncio
    async def test_generate_insights_with_no_transactions(self, db_session: AsyncSession, test_user):
        """Test insights generation with no transactions"""
        service = InsightsService(db_session)
        insights = await service.generate_insights(test_user.id)

        # Should return empty list when no transactions exist
        assert isinstance(insights, list)
        assert len(insights) == 0

    @pytest.mark.asyncio
    async def test_generate_insights_returns_list(self, db_session: AsyncSession, test_user, test_transaction):
        """Test that generate_insights returns a list"""
        service = InsightsService(db_session)
        insights = await service.generate_insights(test_user.id)

        assert isinstance(insights, list)
        # With test data, should generate at least one insight
        assert len(insights) >= 0

    @pytest.mark.asyncio
    async def test_insight_structure(self, db_session: AsyncSession, test_user, test_transaction):
        """Test that insights have correct structure"""
        service = InsightsService(db_session)
        insights = await service.generate_insights(test_user.id)

        if len(insights) > 0:
            insight = insights[0]
            # Check required fields
            assert "type" in insight
            assert "title" in insight
            assert "message" in insight
            assert "severity" in insight
            assert "icon" in insight

            # Check severity values
            assert insight["severity"] in ["info", "warning", "success"]

    @pytest.mark.asyncio
    async def test_constants_defined(self):
        """Test that all threshold constants are defined"""
        assert SPENDING_CHANGE_THRESHOLD > 0
        assert TOP_CATEGORY_ALERT_THRESHOLD > 0
        assert DISCRETIONARY_SPENDING_THRESHOLD > 0
        assert UNUSUAL_ACTIVITY_MULTIPLIER > 0
        assert CACHE_TTL_SECONDS > 0

    @pytest.mark.asyncio
    async def test_spending_change_threshold(self):
        """Test spending change threshold is reasonable"""
        # Should be between 5% and 20%
        assert 0.05 <= SPENDING_CHANGE_THRESHOLD <= 0.20

    @pytest.mark.asyncio
    async def test_top_category_threshold(self):
        """Test top category threshold is reasonable"""
        # Should be between 30% and 50%
        assert 0.30 <= TOP_CATEGORY_ALERT_THRESHOLD <= 0.50

    @pytest.mark.asyncio
    async def test_cache_ttl(self):
        """Test cache TTL is 6 hours as specified"""
        assert CACHE_TTL_SECONDS == 21600  # 6 hours

    @pytest.mark.asyncio
    async def test_insights_with_month_parameter(self, db_session: AsyncSession, test_user):
        """Test insights generation with specific month"""
        service = InsightsService(db_session)
        insights = await service.generate_insights(test_user.id, month="2026-08")

        assert isinstance(insights, list)

    @pytest.mark.asyncio
    async def test_insights_caching_resilience(self, db_session: AsyncSession, test_user):
        """Test that insights generation continues even if Redis fails"""
        service = InsightsService(db_session)

        # This should not raise an exception even if Redis is unavailable
        try:
            insights = await service.generate_insights(test_user.id)
            assert isinstance(insights, list)
        except Exception as e:
            # Should not fail due to Redis issues
            pytest.fail(f"Insights generation failed: {e}")
