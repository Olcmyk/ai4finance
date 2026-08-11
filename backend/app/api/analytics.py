"""Analytics API endpoints"""

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
