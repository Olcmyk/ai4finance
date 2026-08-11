"""Transaction model"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, String, DateTime, Date, Text, Enum, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class InputMethod(str, enum.Enum):
    """Input method for transaction"""
    MANUAL = "manual"
    NATURAL_LANGUAGE = "natural_language"


class Transaction(Base):
    """Transaction model for financial records"""

    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(DECIMAL(10, 2), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    transaction_date = Column(Date, nullable=False, index=True)
    input_method = Column(Enum(InputMethod), nullable=False)
    original_input = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction {self.id} {self.amount} {self.category}>"
