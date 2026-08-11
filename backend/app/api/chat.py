"""WebSocket chat endpoint for AI advisor"""

import uuid
import json
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status, Query
from jose import jwt, JWTError
from sqlalchemy import select

from app.config import settings
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.services.ai_advisor_service import AIAdvisorService


router = APIRouter()


async def authenticate_websocket(token: str) -> Optional[uuid.UUID]:
    """
    Authenticate WebSocket connection using JWT token

    Args:
        token: JWT access token

    Returns:
        User ID if authentication succeeds, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )

        if payload.get("type") != "access":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        return uuid.UUID(user_id)

    except (JWTError, ValueError):
        return None


@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token")
):
    """
    WebSocket endpoint for AI advisor chat

    Query Parameters:
        token: JWT access token for authentication

    Message Format (Client -> Server):
        {
            "session_id": "uuid-string",  # Session ID for conversation grouping
            "message": "user message text"
        }

    Message Format (Server -> Client):
        {
            "type": "chunk",  # or "error", "complete"
            "content": "response text chunk",
            "session_id": "uuid-string"
        }
    """
    # Authenticate user
    user_id = await authenticate_websocket(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Accept WebSocket connection
    await websocket.accept()

    # Initialize AI advisor service
    ai_service = AIAdvisorService()

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message_data = json.loads(data)
                user_message = message_data.get("message", "").strip()
                session_id_str = message_data.get("session_id")

                # Validate input
                if not user_message:
                    await websocket.send_json({
                        "type": "error",
                        "content": "消息不能为空"
                    })
                    continue

                # Parse or generate session_id
                if session_id_str:
                    try:
                        session_id = uuid.UUID(session_id_str)
                    except ValueError:
                        session_id = uuid.uuid4()
                else:
                    session_id = uuid.uuid4()

                # Create database session
                async with AsyncSessionLocal() as db:
                    # Verify user exists
                    result = await db.execute(
                        select(User).where(User.id == user_id)
                    )
                    user = result.scalar_one_or_none()

                    if not user:
                        await websocket.send_json({
                            "type": "error",
                            "content": "用户不存在"
                        })
                        continue

                    # Stream AI response
                    try:
                        async for chunk in ai_service.chat_stream(
                            db=db,
                            user_id=user_id,
                            session_id=session_id,
                            user_message=user_message
                        ):
                            await websocket.send_json({
                                "type": "chunk",
                                "content": chunk,
                                "session_id": str(session_id)
                            })

                        # Send completion message
                        await websocket.send_json({
                            "type": "complete",
                            "session_id": str(session_id)
                        })

                    except Exception as e:
                        await websocket.send_json({
                            "type": "error",
                            "content": f"生成响应时出错: {str(e)}"
                        })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "content": "无效的JSON格式"
                })

    except WebSocketDisconnect:
        # Client disconnected
        pass
    except Exception as e:
        # Unexpected error, close connection
        try:
            await websocket.send_json({
                "type": "error",
                "content": f"服务器错误: {str(e)}"
            })
        except:
            pass
        finally:
            await websocket.close()
