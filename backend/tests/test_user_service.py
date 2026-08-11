"""Tests for UserService"""

import pytest
from app.services.user_service import UserService
from app.schemas.user import UserCreate


@pytest.mark.asyncio
async def test_create_user(db_session):
    service = UserService(db_session)
    user_data = UserCreate(
        email="test@example.com",
        password="Test1234",
        username="Test User"
    )
    user = await service.create_user(user_data)
    assert user.email == "test@example.com"
    assert user.username == "Test User"
    assert user.password_hash is not None
