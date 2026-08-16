"""Test streaming endpoint for debugging"""

import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()


async def test_stream():
    """Simple test stream generator"""
    for i in range(5):
        yield f"data: {i}\n\n"
        await asyncio.sleep(1)


@router.get("/test")
async def test_stream_endpoint():
    """Test streaming endpoint"""
    return StreamingResponse(
        test_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
