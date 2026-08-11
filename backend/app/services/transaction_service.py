"""Transaction service for managing financial transactions"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional, Tuple
from datetime import date
import uuid

from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.transaction import TransactionCreate


class TransactionService:
    """Service for transaction operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_category_id_by_name(self, category_name: str) -> Optional[int]:
        """Get category ID by name"""
        query = select(Category).where(Category.name == category_name)
        result = await self.db.execute(query)
        category = result.scalar_one_or_none()
        return category.id if category else None

    async def create_transaction(
        self,
        user_id: str,
        data: TransactionCreate
    ) -> Transaction:
        """Create a new transaction"""
        # Get category ID from category name
        category_id = await self._get_category_id_by_name(data.category)
        if not category_id:
            raise ValueError(f"Category '{data.category}' not found")

        transaction = Transaction(
            user_id=uuid.UUID(user_id),
            amount=data.amount,
            category_id=category_id,
            description=data.description,
            transaction_date=data.transaction_date,
            input_method=data.input_method,
            original_input=data.original_input
        )
        self.db.add(transaction)
        await self.db.flush()

        # Use eager loading to fetch transaction with category in one query
        query = select(Transaction).options(selectinload(Transaction.category)).where(
            Transaction.id == transaction.id
        )
        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_transactions(
        self,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Transaction], int]:
        """Get transactions with filters and pagination"""
        user_uuid = uuid.UUID(user_id)

        # Build base filter conditions
        filters = [Transaction.user_id == user_uuid]

        if start_date:
            filters.append(Transaction.transaction_date >= start_date)
        if end_date:
            filters.append(Transaction.transaction_date <= end_date)
        if category:
            # Join with Category to filter by name
            category_id = await self._get_category_id_by_name(category)
            if category_id:
                filters.append(Transaction.category_id == category_id)

        # Efficient count query - directly count with filters, no subquery
        count_query = select(func.count(Transaction.id)).where(and_(*filters))
        total = await self.db.scalar(count_query)

        # Get paginated results with eager loading - no N+1 queries
        query = (
            select(Transaction)
            .options(selectinload(Transaction.category))
            .where(and_(*filters))
            .order_by(Transaction.transaction_date.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(query)
        transactions = list(result.scalars().all())

        return transactions, total or 0

    async def get_transaction_by_id(
        self,
        transaction_id: str,
        user_id: str
    ) -> Optional[Transaction]:
        """Get a single transaction by ID"""
        query = (
            select(Transaction)
            .options(selectinload(Transaction.category))
            .where(
                and_(
                    Transaction.id == uuid.UUID(transaction_id),
                    Transaction.user_id == uuid.UUID(user_id)
                )
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
                    # Handle category name to ID conversion
                    if key == "category":
                        category_id = await self._get_category_id_by_name(value)
                        if not category_id:
                            raise ValueError(f"Category '{value}' not found")
                        setattr(transaction, "category_id", category_id)
                    else:
                        setattr(transaction, key, value)
            await self.db.flush()

            # After flush, refetch with eager loading to get the updated category
            # We need to expire the relationship to force a reload
            self.db.expire(transaction, ['category'])
            await self.db.refresh(transaction, ['category'])

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
