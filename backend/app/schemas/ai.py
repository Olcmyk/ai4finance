"""AI chat schemas"""

from datetime import datetime
from typing import List
from pydantic import BaseModel

from app.models.ai_conversation import MessageRole


class ChatMessage(BaseModel):
    """Schema for chat message"""
    role: MessageRole
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSession(BaseModel):
    """Schema for chat session"""
    session_id: str
    messages: List[ChatMessage]


class ChatHistoryResponse(BaseModel):
    """Schema for chat history response"""
    sessions: List[ChatSession]
