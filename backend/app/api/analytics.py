"""Analytics API endpoints"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime, timezone
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.analytics_service import AnalyticsService
from app.services.insights_service import InsightsService
from app.schemas.analytics import SummaryResponse, CategorySummaryResponse, InsightResponse

router = APIRouter()


@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    month: str = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
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
    month: str = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get spending by category"""
    if not month:
        month = date.today().strftime("%Y-%m")

    service = AnalyticsService(db)
    categories = await service.get_by_category(current_user["user_id"], month)
    return CategorySummaryResponse(month=month, categories=categories)


@router.get("/insights", response_model=InsightResponse)
async def get_insights(
    month: str = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-powered financial insights"""
    if not month:
        month = date.today().strftime("%Y-%m")

    user_id = uuid.UUID(current_user["user_id"])
    service = InsightsService(db)
    insights = await service.generate_insights(user_id, month)

    return InsightResponse(
        month=month,
        insights=insights,
        generated_at=datetime.now(timezone.utc)
    )
