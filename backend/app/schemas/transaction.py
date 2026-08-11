"""Transaction schemas"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field

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
    id: str
    user_id: str
    amount: Decimal
    category: str
    description: Optional[str]
    transaction_date: date
    input_method: InputMethod
    original_input: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


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
