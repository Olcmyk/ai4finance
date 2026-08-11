"""Rate limiting utilities"""

from fastapi import HTTPException, status

from app.core.redis_client import redis_client


class RateLimiter:
    """Rate limiter using Redis"""

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def check_rate_limit(self, user_id: str, endpoint: str):
        """Check if user has exceeded rate limit"""
        key = f"rate_limit:{user_id}:{endpoint}"

        count = await redis_client.incr(key)

        if count == 1:
            await redis_client.expire(key, self.window_seconds)

        if count > self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Max {self.max_requests} requests per {self.window_seconds}s"
            )


# Predefined rate limiters
ai_chat_limiter = RateLimiter(max_requests=10, window_seconds=60)
transaction_parse_limiter = RateLimiter(max_requests=20, window_seconds=60)
insights_limiter = RateLimiter(max_requests=5, window_seconds=60)
