"""Tests for NLP API endpoints"""

import pytest
from httpx import AsyncClient
from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, patch

from app.services.langchain_service import ParsedTransaction


@pytest.mark.asyncio
async def test_parse_simple_expense(client: AsyncClient, auth_headers):
    """Test parsing a simple expense transaction"""
    with patch('app.api.nlp.LangChainService') as mock_service:
        # Mock the service response
        mock_instance = mock_service.return_value
        mock_instance.parse_transaction = AsyncMock(return_value=ParsedTransaction(
            amount=-50.0,
            category="餐饮",
            description="午餐",
            transaction_date=date.today().isoformat(),
            confidence=0.95
        ))
        mock_instance.convert_to_decimal = lambda x: Decimal(str(round(x, 2)))

        response = await client.post(
            "/api/nlp/parse-transaction",
            headers=auth_headers,
            json={"input": "今天午餐花了50块"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == "-50.00"
        assert data["category"] == "餐饮"
        assert data["description"] == "午餐"
        assert data["transaction_date"] == date.today().isoformat()
        assert data["confidence"] == 0.95


@pytest.mark.asyncio
async def test_parse_income(client: AsyncClient, auth_headers):
    """Test parsing an income transaction"""
    with patch('app.api.nlp.LangChainService') as mock_service:
        # Mock the service response
        mock_instance = mock_service.return_value
        mock_instance.parse_transaction = AsyncMock(return_value=ParsedTransaction(
            amount=5000.0,
            category="其他",
            description="工资",
            transaction_date=date.today().isoformat(),
            confidence=0.9
        ))
        mock_instance.convert_to_decimal = lambda x: Decimal(str(round(x, 2)))

        response = await client.post(
            "/api/nlp/parse-transaction",
            headers=auth_headers,
            json={"input": "工资到账5000元"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == "5000.00"
        assert data["category"] == "其他"
        assert data["description"] == "工资"
        assert data["confidence"] == 0.9


@pytest.mark.asyncio
async def test_parse_with_date(client: AsyncClient, auth_headers):
    """Test parsing a transaction with relative date"""
    with patch('app.api.nlp.LangChainService') as mock_service:
        # Mock the service response
        mock_instance = mock_service.return_value
        mock_instance.parse_transaction = AsyncMock(return_value=ParsedTransaction(
            amount=-120.0,
            category="交通",
            description="打车去机场",
            transaction_date=date.today().isoformat(),
            confidence=0.95
        ))
        mock_instance.convert_to_decimal = lambda x: Decimal(str(round(x, 2)))

        response = await client.post(
            "/api/nlp/parse-transaction",
            headers=auth_headers,
            json={"input": "昨天打车去机场花了120"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == "-120.00"
        assert data["category"] == "交通"
        assert data["description"] == "打车去机场"


@pytest.mark.asyncio
async def test_parse_shopping(client: AsyncClient, auth_headers):
    """Test parsing a shopping transaction"""
    with patch('app.api.nlp.LangChainService') as mock_service:
        # Mock the service response
        mock_instance = mock_service.return_value
        mock_instance.parse_transaction = AsyncMock(return_value=ParsedTransaction(
            amount=-299.0,
            category="购物",
            description="买衣服",
            transaction_date=date.today().isoformat(),
            confidence=0.9
        ))
        mock_instance.convert_to_decimal = lambda x: Decimal(str(round(x, 2)))

        response = await client.post(
            "/api/nlp/parse-transaction",
            headers=auth_headers,
            json={"input": "买了一件衣服299"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == "-299.00"
        assert data["category"] == "购物"
        assert data["description"] == "买衣服"


@pytest.mark.asyncio
async def test_parse_invalid_input(client: AsyncClient, auth_headers):
    """Test parsing with invalid input"""
    response = await client.post(
        "/api/nlp/parse-transaction",
        headers=auth_headers,
        json={"input": ""}
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_parse_unauthorized(client: AsyncClient):
    """Test that parsing requires authentication"""
    response = await client.post(
        "/api/nlp/parse-transaction",
        json={"input": "今天午餐花了50块"}
    )
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
async def test_parse_service_error(client: AsyncClient, auth_headers):
    """Test handling of service errors"""
    with patch('app.api.nlp.LangChainService') as mock_service:
        # Mock a service error
        mock_instance = mock_service.return_value
        mock_instance.parse_transaction = AsyncMock(side_effect=ValueError("Invalid input"))

        response = await client.post(
            "/api/nlp/parse-transaction",
            headers=auth_headers,
            json={"input": "invalid input"}
        )

        assert response.status_code == 400
        assert "Invalid input" in response.json()["detail"]


@pytest.mark.asyncio
async def test_langchain_service_convert_to_decimal():
    """Test decimal conversion in LangChain service"""
    from app.services.langchain_service import LangChainService
    from decimal import Decimal

    service = LangChainService()

    # Test positive amount
    result = service.convert_to_decimal(100.50)
    assert result == Decimal("100.50")
    assert isinstance(result, Decimal)

    # Test negative amount
    result = service.convert_to_decimal(-50.25)
    assert result == Decimal("-50.25")

    # Test rounding
    result = service.convert_to_decimal(99.999)
    assert result == Decimal("100.00")
