"""Redis client for caching and session management"""

import json
from typing import Optional, Any
import redis.asyncio as redis

from app.config import settings


class RedisClient:
    """Async Redis client wrapper"""

    def __init__(self):
        self.redis: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis"""
        self.redis = await redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.aclose()

    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        if not self.redis:
            return None
        value = await self.redis.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None

    async def set(self, key: str, value: Any, ttl: int = 3600):
        """Set value in Redis with TTL"""
        if not self.redis:
            return
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        await self.redis.set(key, value, ex=ttl)

    async def delete(self, key: str):
        """Delete key from Redis"""
        if not self.redis:
            return
        await self.redis.delete(key)

    async def lpush(self, key: str, value: Any):
        """Push value to list (left)"""
        if not self.redis:
            return
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        await self.redis.lpush(key, value)

    async def lrange(self, key: str, start: int, end: int):
        """Get range from list"""
        if not self.redis:
            return []
        values = await self.redis.lrange(key, start, end)
        result = []
        for v in values:
            try:
                result.append(json.loads(v))
            except json.JSONDecodeError:
                result.append(v)
        return result

    async def incr(self, key: str) -> int:
        """Increment counter"""
        if not self.redis:
            return 0
        return await self.redis.incr(key)

    async def expire(self, key: str, ttl: int):
        """Set TTL on key"""
        if not self.redis:
            return
        await self.redis.expire(key, ttl)


# Global Redis client instance
redis_client = RedisClient()
