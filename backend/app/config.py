"""Application configuration settings"""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    database_url: str

    # Redis - Support both traditional Redis and Upstash REST API
    redis_url: Optional[str] = None
    upstash_redis_rest_url: Optional[str] = None
    upstash_redis_rest_token: Optional[str] = None

    # OpenAI / DeepSeek API
    openai_api_key: str
    openai_api_base: Optional[str] = None  # For DeepSeek: https://api.deepseek.com

    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # CORS
    frontend_url: str

    # Environment
    environment: str = "development"

    # OpenAI / DeepSeek Settings
    openai_model: str = "deepseek-v4-flash"  # or gpt-4o-mini for OpenAI
    openai_temperature: float = 0.7
    openai_max_tokens: int = 1000
    openai_timeout: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra='ignore'  # Ignore extra environment variables
    )


# Global settings instance
settings = Settings()
