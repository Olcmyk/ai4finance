"""Analytics service for financial data aggregation"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from typing import Dict, List
from decimal import Decimal
from datetime import date
import uuid

from app.models.transaction import Transaction
from app.core.redis_client import redis_client


class AnalyticsService:
    """Service for analytics operations"""

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
            Transaction.category_id,
            func.sum(Transaction.amount).label('amount'),
            func.count(Transaction.id).label('count')
        ).where(
            and_(
                Transaction.user_id == user_uuid,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month_num,
                Transaction.amount < 0  # Only expenses
            )
        ).group_by(Transaction.category_id)

        result = await self.db.execute(query)
        categories = []
        total = Decimal("0")

        # First pass: collect data and calculate total
        for row in result:
            amount = abs(float(row.amount))
            total += Decimal(str(amount))
            categories.append({
                "category_id": row.category_id,
                "amount": amount,
                "count": row.count
            })

        # Second pass: fetch category names and calculate percentages
        from app.models.category import Category
        category_names = {}
        if categories:
            category_ids = [cat["category_id"] for cat in categories]
            name_query = select(Category.id, Category.name).where(Category.id.in_(category_ids))
            name_result = await self.db.execute(name_query)
            category_names = {row.id: row.name for row in name_result}

        # Build final result
        final_categories = []
        for cat in categories:
            cat_name = category_names.get(cat["category_id"], "未知")
            percentage = round((Decimal(str(cat["amount"])) / total * 100), 1) if total > 0 else 0.0
            final_categories.append({
                "name": cat_name,
                "amount": cat["amount"],
                "percentage": float(percentage),
                "count": cat["count"]
            })

        # Sort by amount descending
        final_categories.sort(key=lambda x: x["amount"], reverse=True)

        return final_categories
