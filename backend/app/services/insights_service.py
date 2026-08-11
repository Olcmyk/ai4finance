"""Insights service for AI-powered financial analysis"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy import select, and_, extract, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import uuid

from app.models.transaction import Transaction
from app.models.category import Category
from app.core.redis_client import redis_client


class InsightsService:
    """Service for generating financial insights"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_insights(
        self,
        user_id: uuid.UUID,
        month: str = None
    ) -> List[Dict[str, Any]]:
        """
        Generate AI-powered financial insights for a user

        Args:
            user_id: User ID
            month: Optional month in YYYY-MM format. If None, uses current month

        Returns:
            List of insights
        """
        # Parse month or use current
        if month:
            year, month_num = map(int, month.split('-'))
        else:
            now = datetime.now()
            year, month_num = now.year, now.month
            month = f"{year}-{month_num:02d}"

        # Check cache first (6 hours TTL)
        cache_key = f"insights:{user_id}:{month}"
        cached = await redis_client.get(cache_key)
        if cached:
            return cached.get("insights", [])

        # Generate insights
        insights = []

        # 1. Spending pattern analysis
        spending_insight = await self._analyze_spending_pattern(user_id, year, month_num)
        if spending_insight:
            insights.append(spending_insight)

        # 2. Top category alert
        top_category_insight = await self._analyze_top_category(user_id, year, month_num)
        if top_category_insight:
            insights.append(top_category_insight)

        # 3. Savings opportunity
        savings_insight = await self._analyze_savings_opportunity(user_id, year, month_num)
        if savings_insight:
            insights.append(savings_insight)

        # 4. Unusual activity detection
        unusual_insight = await self._detect_unusual_activity(user_id, year, month_num)
        if unusual_insight:
            insights.append(unusual_insight)

        # Cache for 6 hours (21600 seconds)
        await redis_client.set(cache_key, {"insights": insights}, ttl=21600)

        return insights

    async def _analyze_spending_pattern(
        self,
        user_id: uuid.UUID,
        year: int,
        month: int
    ) -> Dict[str, Any] | None:
        """Compare current month spending vs previous month"""

        # Get current month expense
        current_query = select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month,
                Transaction.amount < 0
            )
        )
        current_expense = abs(await self.db.scalar(current_query) or Decimal("0"))

        # Get previous month
        prev_month = month - 1
        prev_year = year
        if prev_month == 0:
            prev_month = 12
            prev_year = year - 1

        # Get previous month expense
        prev_query = select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                extract('year', Transaction.transaction_date) == prev_year,
                extract('month', Transaction.transaction_date) == prev_month,
                Transaction.amount < 0
            )
        )
        prev_expense = abs(await self.db.scalar(prev_query) or Decimal("0"))

        # Only generate insight if there's meaningful data and change
        if current_expense == 0 or prev_expense == 0:
            return None

        change_percent = ((current_expense - prev_expense) / prev_expense) * 100

        # Only report if change > 10%
        if abs(change_percent) < 10:
            return None

        if change_percent > 0:
            # Spending increased
            return {
                "type": "spending_pattern",
                "title": "支出上涨提醒",
                "message": f"本月支出比上月增加了{abs(change_percent):.1f}%（¥{float(current_expense):.2f} vs ¥{float(prev_expense):.2f}），建议关注开销情况。",
                "severity": "warning",
                "icon": "📈"
            }
        else:
            # Spending decreased
            return {
                "type": "spending_pattern",
                "title": "支出管理良好",
                "message": f"本月支出比上月减少了{abs(change_percent):.1f}%（¥{float(current_expense):.2f} vs ¥{float(prev_expense):.2f}），保持这个节奏！",
                "severity": "success",
                "icon": "✅"
            }

    async def _analyze_top_category(
        self,
        user_id: uuid.UUID,
        year: int,
        month: int
    ) -> Dict[str, Any] | None:
        """Identify highest spending category"""

        # Get spending by category
        query = select(
            Transaction.category_id,
            func.sum(Transaction.amount).label('amount')
        ).where(
            and_(
                Transaction.user_id == user_id,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month,
                Transaction.amount < 0
            )
        ).group_by(Transaction.category_id)

        result = await self.db.execute(query)
        categories = [(row.category_id, abs(row.amount)) for row in result]

        if not categories:
            return None

        # Calculate total and find top category
        total_expense = sum(amt for _, amt in categories)
        top_category_id, top_amount = max(categories, key=lambda x: x[1])
        percentage = (top_amount / total_expense * 100) if total_expense > 0 else 0

        # Get category name
        category_query = select(Category.name).where(Category.id == top_category_id)
        category_name = await self.db.scalar(category_query) or "未分类"

        # Only alert if one category is > 40% of total
        if percentage > 40:
            return {
                "type": "top_category",
                "title": "支出集中提醒",
                "message": f"您在{category_name}类别的支出占总支出的{percentage:.1f}%（¥{float(top_amount):.2f}），建议适当分散开销。",
                "severity": "warning",
                "icon": "⚠️"
            }

        # Otherwise, just informational
        return {
            "type": "top_category",
            "title": "主要支出类别",
            "message": f"本月{category_name}类别支出最高，共¥{float(top_amount):.2f}，占总支出的{percentage:.1f}%。",
            "severity": "info",
            "icon": "📊"
        }

    async def _analyze_savings_opportunity(
        self,
        user_id: uuid.UUID,
        year: int,
        month: int
    ) -> Dict[str, Any] | None:
        """Suggest savings opportunities in discretionary categories"""

        # Discretionary categories (Chinese names)
        discretionary_names = ['餐饮', '娱乐', '购物']

        # Get category IDs for discretionary spending
        category_query = select(Category.id, Category.name).where(
            Category.name.in_(discretionary_names)
        )
        result = await self.db.execute(category_query)
        discretionary_categories = {row.id: row.name for row in result}

        if not discretionary_categories:
            return None

        # Get spending in discretionary categories
        disc_query = select(
            Transaction.category_id,
            func.sum(Transaction.amount).label('amount')
        ).where(
            and_(
                Transaction.user_id == user_id,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month,
                Transaction.amount < 0,
                Transaction.category_id.in_(discretionary_categories.keys())
            )
        ).group_by(Transaction.category_id)

        disc_result = await self.db.execute(disc_query)
        disc_spending = [(discretionary_categories[row.category_id], abs(row.amount))
                        for row in disc_result]

        if not disc_spending:
            return None

        # Get total expense for percentage calculation
        total_query = select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month,
                Transaction.amount < 0
            )
        )
        total_expense = abs(await self.db.scalar(total_query) or Decimal("0"))

        if total_expense == 0:
            return None

        # Find highest discretionary spending
        top_disc_category, top_disc_amount = max(disc_spending, key=lambda x: x[1])
        disc_percentage = (top_disc_amount / total_expense * 100) if total_expense > 0 else 0

        # Suggest savings if discretionary > 25%
        if disc_percentage > 25:
            potential_savings = top_disc_amount * Decimal("0.1")  # 10% reduction
            return {
                "type": "savings_opportunity",
                "title": "节省建议",
                "message": f"您在{top_disc_category}类别的支出较高（占总支出的{disc_percentage:.1f}%）。减少10%可节省约¥{float(potential_savings):.2f}元。",
                "severity": "info",
                "icon": "💡"
            }

        return None

    async def _detect_unusual_activity(
        self,
        user_id: uuid.UUID,
        year: int,
        month: int
    ) -> Dict[str, Any] | None:
        """Detect abnormally large transactions"""

        # Get all expenses for the month
        query = select(Transaction).options(
            selectinload(Transaction.category)
        ).where(
            and_(
                Transaction.user_id == user_id,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month,
                Transaction.amount < 0
            )
        )

        result = await self.db.execute(query)
        transactions = result.scalars().all()

        if len(transactions) < 3:  # Need enough data to detect anomalies
            return None

        # Calculate average transaction amount
        amounts = [abs(txn.amount) for txn in transactions]
        avg_amount = sum(amounts) / len(amounts)

        # Find transactions > 2x average
        unusual_txns = [
            txn for txn in transactions
            if abs(txn.amount) > avg_amount * 2
        ]

        if not unusual_txns:
            return None

        # Report the largest unusual transaction
        largest_txn = max(unusual_txns, key=lambda t: abs(t.amount))
        category_name = largest_txn.category.name if largest_txn.category else "未分类"
        multiplier = abs(largest_txn.amount) / avg_amount

        return {
            "type": "unusual_activity",
            "title": "大额支出提醒",
            "message": f"检测到一笔¥{float(abs(largest_txn.amount)):.2f}的{category_name}支出，是平均水平的{multiplier:.1f}倍。请确认是否为正常开销。",
            "severity": "warning",
            "icon": "🔔"
        }
