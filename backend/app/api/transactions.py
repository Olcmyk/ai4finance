"""Transactions API endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.redis_client import redis_client
from app.services.transaction_service import TransactionService
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionList
)

router = APIRouter()


async def invalidate_user_caches(user_id: str, transaction_date: date):
    """
    Invalidate analytics and insights caches for user

    Args:
        user_id: User ID
        transaction_date: Date of the transaction
    """
    try:
        # Invalidate analytics cache for the transaction's month
        month = transaction_date.strftime("%Y-%m")
        analytics_key = f"analytics:{user_id}:{month}"
        insights_key = f"insights:{user_id}:{month}"

        await redis_client.delete(analytics_key)
        await redis_client.delete(insights_key)
    except Exception as e:
        # Don't fail the request if cache invalidation fails
        print(f"Cache invalidation failed: {e}")


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new transaction"""
    service = TransactionService(db)
    try:
        transaction = await service.create_transaction(
            user_id=current_user["user_id"],
            data=transaction_data
        )
        await db.commit()

        # Invalidate caches after successful transaction creation
        await invalidate_user_caches(
            current_user["user_id"],
            transaction_data.transaction_date
        )

        return transaction
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create transaction"
        )


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
    update_data = {k: v for k, v in transaction_data.model_dump().items() if v is not None}

    try:
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

        await db.commit()

        # Invalidate caches after successful update
        await invalidate_user_caches(
            current_user["user_id"],
            transaction.transaction_date
        )

        return transaction
    except HTTPException:
        await db.rollback()
        raise
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update transaction"
        )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction"""
    service = TransactionService(db)
    try:
        # Get transaction before deleting to access its date
        transaction = await service.get_transaction_by_id(
            transaction_id=transaction_id,
            user_id=current_user["user_id"]
        )

        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )

        transaction_date = transaction.transaction_date

        deleted = await service.delete_transaction(
            transaction_id=transaction_id,
            user_id=current_user["user_id"]
        )

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )

        await db.commit()

        # Invalidate caches after successful deletion
        await invalidate_user_caches(
            current_user["user_id"],
            transaction_date
        )
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete transaction"
        )
