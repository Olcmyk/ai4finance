"""HTTP streaming chat endpoint for AI advisor (Vercel-compatible)"""

import uuid
import json
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.ai_advisor_service import AIAdvisorService


router = APIRouter()


class ChatRequest(BaseModel):
    """Chat request model"""
    message: str
    session_id: str | None = None


async def generate_chat_stream(
    db: AsyncSession,
    user_id: uuid.UUID,
    session_id: uuid.UUID,
    user_message: str
) -> AsyncGenerator[str, None]:
    """
    Generate Server-Sent Events stream for chat response

    Args:
        db: Database session
        user_id: User ID
        session_id: Chat session ID
        user_message: User's message

    Yields:
        SSE-formatted chunks
    """
    ai_service = AIAdvisorService()

    try:
        # Send session_id first
        session_data = json.dumps({'type': 'session', 'session_id': str(session_id)})
        yield f"data: {session_data}\n\n"

        # Stream AI response chunks
        chunk_count = 0
        async for chunk in ai_service.chat_stream(
            db=db,
            user_id=user_id,
            session_id=session_id,
            user_message=user_message
        ):
            chunk_count += 1
            chunk_data = json.dumps({'type': 'chunk', 'content': chunk})
            yield f"data: {chunk_data}\n\n"

        # Send completion message
        complete_data = json.dumps({'type': 'complete', 'chunks_sent': chunk_count})
        yield f"data: {complete_data}\n\n"

    except Exception as e:
        # Send error message with traceback
        import traceback
        error_details = traceback.format_exc()
        print(f"Chat stream error: {error_details}")
        error_msg = f"生成响应时出错: {str(e)}"
        error_data = json.dumps({'type': 'error', 'content': error_msg})
        yield f"data: {error_data}\n\n"


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    HTTP streaming endpoint for AI advisor chat (Vercel-compatible)

    Uses Server-Sent Events (SSE) for streaming responses

    Request Body:
        {
            "message": "user message text",
            "session_id": "uuid-string"  # Optional, will generate if not provided
        }

    Response Format (SSE):
        data: {"type": "session", "session_id": "uuid-string"}

        data: {"type": "chunk", "content": "response text chunk"}

        data: {"type": "complete"}

        data: {"type": "error", "content": "error message"}
    """
    # Validate input
    user_message = request.message.strip()
    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="消息不能为空"
        )

    # Parse or generate session_id
    if request.session_id:
        try:
            session_id = uuid.UUID(request.session_id)
        except ValueError:
            session_id = uuid.uuid4()
    else:
        session_id = uuid.uuid4()

    # Get user_id from current_user
    user_id = uuid.UUID(current_user["user_id"])

    # Verify user exists
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    # Return streaming response
    return StreamingResponse(
        generate_chat_stream(db, user_id, session_id, user_message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
