"""Tests for transactions API"""

import pytest
from httpx import AsyncClient
from datetime import date


@pytest.mark.asyncio
async def test_create_transaction_manual(client: AsyncClient, auth_headers):
    """Test creating a manual transaction"""
    response = await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -45.50,
            "category": "餐饮",
            "description": "午餐",
            "transaction_date": str(date.today())
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == "-45.50"
    assert data["category"] == "餐饮"
    assert data["description"] == "午餐"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_transaction_invalid_category(client: AsyncClient, auth_headers):
    """Test creating a transaction with invalid category"""
    response = await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -45.50,
            "category": "InvalidCategory",
            "description": "Test",
            "transaction_date": str(date.today())
        }
    )
    assert response.status_code == 400
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_transactions(client: AsyncClient, auth_headers):
    """Test getting list of transactions"""
    # Create a transaction first
    await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -30.00,
            "category": "交通",
            "description": "地铁",
            "transaction_date": str(date.today())
        }
    )

    # Get transactions
    response = await client.get(
        "/api/transactions",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert len(data["data"]) > 0
    assert data["total"] > 0


@pytest.mark.asyncio
async def test_get_transactions_with_filters(client: AsyncClient, auth_headers):
    """Test getting transactions with category filter"""
    # Create transactions with different categories
    await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -50.00,
            "category": "餐饮",
            "description": "晚餐",
            "transaction_date": str(date.today())
        }
    )
    await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -20.00,
            "category": "交通",
            "description": "公交",
            "transaction_date": str(date.today())
        }
    )

    # Filter by category
    response = await client.get(
        "/api/transactions?category=餐饮",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) >= 1
    for transaction in data["data"]:
        assert transaction["category"] == "餐饮"


@pytest.mark.asyncio
async def test_get_transaction_by_id(client: AsyncClient, auth_headers):
    """Test getting a single transaction by ID"""
    # Create transaction
    create_response = await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -100.00,
            "category": "购物",
            "description": "买书",
            "transaction_date": str(date.today())
        }
    )
    transaction_id = create_response.json()["id"]

    # Get transaction by ID
    response = await client.get(
        f"/api/transactions/{transaction_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == transaction_id
    assert data["amount"] == "-100.00"
    assert data["category"] == "购物"


@pytest.mark.asyncio
async def test_get_transaction_not_found(client: AsyncClient, auth_headers):
    """Test getting a non-existent transaction"""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(
        f"/api/transactions/{fake_id}",
        headers=auth_headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_transaction(client: AsyncClient, auth_headers):
    """Test updating a transaction"""
    # Create transaction
    create_response = await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -50.00,
            "category": "餐饮",
            "description": "晚餐",
            "transaction_date": str(date.today())
        }
    )
    transaction_id = create_response.json()["id"]

    # Update transaction
    response = await client.put(
        f"/api/transactions/{transaction_id}",
        headers=auth_headers,
        json={
            "amount": -55.00,
            "description": "晚餐加饮料"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == "-55.00"
    assert data["description"] == "晚餐加饮料"
    assert data["category"] == "餐饮"  # Should remain unchanged


@pytest.mark.asyncio
async def test_update_transaction_category(client: AsyncClient, auth_headers):
    """Test updating transaction category"""
    # Create transaction
    create_response = await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -30.00,
            "category": "交通",
            "description": "出行",
            "transaction_date": str(date.today())
        }
    )
    transaction_id = create_response.json()["id"]

    # Update category
    response = await client.put(
        f"/api/transactions/{transaction_id}",
        headers=auth_headers,
        json={
            "category": "娱乐"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "娱乐"


@pytest.mark.asyncio
async def test_update_transaction_not_found(client: AsyncClient, auth_headers):
    """Test updating a non-existent transaction"""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.put(
        f"/api/transactions/{fake_id}",
        headers=auth_headers,
        json={
            "amount": -100.00
        }
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_transaction(client: AsyncClient, auth_headers):
    """Test deleting a transaction"""
    # Create transaction
    create_response = await client.post(
        "/api/transactions",
        headers=auth_headers,
        json={
            "input_method": "manual",
            "amount": -20.00,
            "category": "其他",
            "description": "测试",
            "transaction_date": str(date.today())
        }
    )
    transaction_id = create_response.json()["id"]

    # Delete transaction
    response = await client.delete(
        f"/api/transactions/{transaction_id}",
        headers=auth_headers
    )
    assert response.status_code == 204

    # Verify deletion
    get_response = await client.get(
        f"/api/transactions/{transaction_id}",
        headers=auth_headers
    )
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_transaction_not_found(client: AsyncClient, auth_headers):
    """Test deleting a non-existent transaction"""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.delete(
        f"/api/transactions/{fake_id}",
        headers=auth_headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_pagination(client: AsyncClient, auth_headers):
    """Test transaction pagination"""
    # Create multiple transactions
    for i in range(5):
        await client.post(
            "/api/transactions",
            headers=auth_headers,
            json={
                "input_method": "manual",
                "amount": -10.00 * (i + 1),
                "category": "餐饮",
                "description": f"测试 {i}",
                "transaction_date": str(date.today())
            }
        )

    # Test first page with page_size=2
    response = await client.get(
        "/api/transactions?page=1&page_size=2",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total"] >= 5

    # Test second page
    response = await client.get(
        "/api/transactions?page=2&page_size=2",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 2
    assert data["page"] == 2


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """Test that endpoints require authentication"""
    response = await client.get("/api/transactions")
    assert response.status_code in [401, 403]  # FastAPI HTTPBearer returns 403

    response = await client.post(
        "/api/transactions",
        json={
            "input_method": "manual",
            "amount": -50.00,
            "category": "餐饮",
            "description": "Test",
            "transaction_date": str(date.today())
        }
    )
    assert response.status_code in [401, 403]
