"""AI Conversation model"""

import uuid
from datetime import datetime
import enum

from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class MessageRole(str, enum.Enum):
    """Message role in conversation"""
    USER = "user"
    ASSISTANT = "assistant"


class AIConversation(Base):
    """AI Conversation model for chat history"""

    __tablename__ = "ai_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    role = Column(Enum(MessageRole), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="ai_conversations")

    def __repr__(self):
        return f"<AIConversation {self.id} {self.role}>"
