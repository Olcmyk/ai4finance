import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_categories(client: AsyncClient):
    response = await client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    categories = data["categories"]
    assert len(categories) == 9
    assert categories[0]["name"] == "餐饮"
    assert categories[0]["icon"] == "🍔"
    assert categories[0]["color"] == "#FF6B6B"
