"""Analytics schemas"""

from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class TopCategory(BaseModel):
    """Schema for top spending category"""
    name: str
    amount: Decimal
    percentage: float


class SummaryResponse(BaseModel):
    """Schema for financial summary response"""
    month: str
    total_income: float
    total_expense: float
    balance: float
    transaction_count: int
    top_category: Optional[TopCategory] = None


class CategoryBreakdown(BaseModel):
    """Schema for category breakdown"""
    name: str
    amount: float
    percentage: float
    count: int


class CategorySummaryResponse(BaseModel):
    """Schema for category summary response"""
    month: str
    categories: List[CategoryBreakdown]


class TrendDataPoint(BaseModel):
    """Schema for trend data point"""
    date: str
    income: Decimal
    expense: Decimal


class TrendResponse(BaseModel):
    """Schema for trend response"""
    period: str
    granularity: str
    data: List[TrendDataPoint]


class Insight(BaseModel):
    """Schema for AI insight"""
    type: str
    title: str
    message: str
    severity: str = Field(..., pattern="^(info|warning|success)$")
    icon: str


class InsightResponse(BaseModel):
    """Schema for insights response"""
    month: str
    insights: List[Insight]
    generated_at: datetime
