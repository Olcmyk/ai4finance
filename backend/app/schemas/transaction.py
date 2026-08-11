"""Transaction schemas"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field, model_serializer
from uuid import UUID

from app.models.transaction import InputMethod


class TransactionCreate(BaseModel):
    """Schema for creating a transaction"""
    input_method: InputMethod
    amount: Optional[Decimal] = None
    category: Optional[str] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None
    original_input: Optional[str] = None


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction"""
    amount: Optional[Decimal] = None
    category: Optional[str] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None


class TransactionResponse(BaseModel):
    """Schema for transaction response"""
    id: Any
    user_id: Any
    amount: Decimal
    category: Any
    description: Optional[str]
    transaction_date: date
    input_method: InputMethod
    original_input: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @model_serializer
    def serialize_model(self) -> dict:
        """Custom serialization to handle UUID and category objects"""
        # Format amount with 2 decimal places
        amount_str = f"{self.amount:.2f}" if isinstance(self.amount, Decimal) else str(self.amount)

        return {
            'id': str(self.id) if hasattr(self.id, '__str__') else self.id,
            'user_id': str(self.user_id) if hasattr(self.user_id, '__str__') else self.user_id,
            'amount': amount_str,
            'category': self.category.name if hasattr(self.category, 'name') else str(self.category),
            'description': self.description,
            'transaction_date': self.transaction_date.isoformat() if hasattr(self.transaction_date, 'isoformat') else str(self.transaction_date),
            'input_method': self.input_method.value if hasattr(self.input_method, 'value') else self.input_method,
            'original_input': self.original_input,
            'created_at': self.created_at.isoformat() if hasattr(self.created_at, 'isoformat') else str(self.created_at),
            'updated_at': self.updated_at.isoformat() if hasattr(self.updated_at, 'isoformat') else str(self.updated_at),
        }


class TransactionList(BaseModel):
    """Schema for transaction list response"""
    total: int
    page: int
    page_size: int
    data: List[TransactionResponse]


class ParseNaturalLanguageRequest(BaseModel):
    """Schema for parsing natural language input"""
    input: str = Field(..., min_length=1)


class ParsedTransactionResponse(BaseModel):
    """Schema for parsed transaction response"""
    amount: Decimal
    category: str
    description: str
    transaction_date: date
    confidence: float = Field(..., ge=0, le=1)
