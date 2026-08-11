"""Tests for authentication API"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Test1234",
            "username": "New User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "New User"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test that registering with duplicate email returns 400"""
    # First registration
    await client.post(
        "/api/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "Test1234",
            "username": "First User"
        }
    )

    # Attempt duplicate registration
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "DifferentPass123",
            "username": "Second User"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    # First register
    await client.post(
        "/api/auth/register",
        json={
            "email": "login@example.com",
            "password": "Test1234",
            "username": "Login User"
        }
    )

    # Then login
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "login@example.com",
            "password": "Test1234"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test that login with invalid credentials returns 401"""
    # Register a user
    await client.post(
        "/api/auth/register",
        json={
            "email": "valid@example.com",
            "password": "Test1234",
            "username": "Valid User"
        }
    )

    # Try to login with wrong password
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "valid@example.com",
            "password": "WrongPassword"
        }
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()

    # Try to login with non-existent email
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "Test1234"
        }
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_valid(client: AsyncClient):
    """Test that refresh token works correctly"""
    # Register and login
    await client.post(
        "/api/auth/register",
        json={
            "email": "refresh@example.com",
            "password": "Test1234",
            "username": "Refresh User"
        }
    )

    login_response = await client.post(
        "/api/auth/login",
        json={
            "email": "refresh@example.com",
            "password": "Test1234"
        }
    )
    refresh_token = login_response.json()["refresh_token"]

    # Use refresh token to get new access token
    response = await client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_refresh_token_invalid(client: AsyncClient):
    """Test that invalid refresh token returns 401"""
    response = await client.post(
        "/api/auth/refresh",
        json={"refresh_token": "invalid.token.here"}
    )
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient):
    """Test GET /api/auth/me endpoint"""
    # Register and login
    await client.post(
        "/api/auth/register",
        json={
            "email": "currentuser@example.com",
            "password": "Test1234",
            "username": "Current User"
        }
    )

    login_response = await client.post(
        "/api/auth/login",
        json={
            "email": "currentuser@example.com",
            "password": "Test1234"
        }
    )
    access_token = login_response.json()["access_token"]

    # Get current user info
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "currentuser@example.com"
    assert data["username"] == "Current User"
    assert "id" in data


@pytest.mark.asyncio
async def test_get_current_user_no_token(client: AsyncClient):
    """Test GET /api/auth/me without token returns 401 or 403"""
    response = await client.get("/api/auth/me")
    assert response.status_code in [401, 403]  # FastAPI HTTPBearer returns 403
