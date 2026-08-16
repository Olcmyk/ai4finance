"""Redis client for caching and session management - supports both traditional Redis and Upstash REST API"""

import json
from typing import Optional, Any

from app.config import settings


class RedisClient:
    """Async Redis client wrapper - supports both traditional Redis and Upstash REST API"""

    def __init__(self):
        self.redis: Optional[Any] = None
        self.use_upstash_rest = False

    async def connect(self):
        """Connect to Redis - auto-detect Upstash REST API or traditional Redis"""
        # Prioritize Upstash REST API if credentials are available
        if settings.upstash_redis_rest_url and settings.upstash_redis_rest_token:
            try:
                from upstash_redis import Redis
                self.redis = Redis(
                    url=settings.upstash_redis_rest_url,
                    token=settings.upstash_redis_rest_token
                )
                self.use_upstash_rest = True
                print("✓ Connected to Upstash Redis (REST API)")
            except ImportError:
                print("⚠ upstash-redis not installed, falling back to traditional Redis")
                await self._connect_traditional_redis()
        elif settings.redis_url:
            await self._connect_traditional_redis()
        else:
            print("⚠ No Redis configuration found")

    async def _connect_traditional_redis(self):
        """Connect to traditional Redis"""
        import redis.asyncio as redis
        self.redis = await redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
        self.use_upstash_rest = False
        print("✓ Connected to traditional Redis")

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis and not self.use_upstash_rest:
            await self.redis.aclose()

    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        if not self.redis:
            return None

        if self.use_upstash_rest:
            # Upstash REST API (synchronous)
            value = self.redis.get(key)
        else:
            # Traditional Redis (async)
            value = await self.redis.get(key)

        if value:
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        return None

    async def set(self, key: str, value: Any, ttl: int = 3600):
        """Set value in Redis with TTL"""
        if not self.redis:
            return

        if isinstance(value, (dict, list)):
            value = json.dumps(value)

        if self.use_upstash_rest:
            # Upstash REST API
            self.redis.set(key, value, ex=ttl)
        else:
            # Traditional Redis
            await self.redis.set(key, value, ex=ttl)

    async def delete(self, key: str):
        """Delete key from Redis"""
        if not self.redis:
            return

        if self.use_upstash_rest:
            self.redis.delete(key)
        else:
            await self.redis.delete(key)

    async def lpush(self, key: str, value: Any):
        """Push value to list (left)"""
        if not self.redis:
            return

        if isinstance(value, (dict, list)):
            value = json.dumps(value)

        if self.use_upstash_rest:
            self.redis.lpush(key, value)
        else:
            await self.redis.lpush(key, value)

    async def lrange(self, key: str, start: int, end: int):
        """Get range from list"""
        if not self.redis:
            return []

        if self.use_upstash_rest:
            values = self.redis.lrange(key, start, end)
        else:
            values = await self.redis.lrange(key, start, end)

        result = []
        for v in values:
            try:
                result.append(json.loads(v))
            except (json.JSONDecodeError, TypeError):
                result.append(v)
        return result

    async def incr(self, key: str) -> int:
        """Increment counter"""
        if not self.redis:
            return 0

        if self.use_upstash_rest:
            return self.redis.incr(key)
        else:
            return await self.redis.incr(key)

    async def expire(self, key: str, ttl: int):
        """Set TTL on key"""
        if not self.redis:
            return

        if self.use_upstash_rest:
            self.redis.expire(key, ttl)
        else:
            await self.redis.expire(key, ttl)


# Global Redis client instance
redis_client = RedisClient()
