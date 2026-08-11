from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.category import Category

router = APIRouter()

@router.get("")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all categories"""
    query = select(Category)
    result = await db.execute(query)
    categories = result.scalars().all()

    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "icon": cat.icon,
                "color": cat.color
            }
            for cat in categories
        ]
    }
