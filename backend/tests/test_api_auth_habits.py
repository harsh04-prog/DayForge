import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_register_login_and_habit_workflow():
    uid = uuid.uuid4().hex[:8]
    email = f"user_{uid}@dayforge.com"
    username = f"user_{uid}"
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register new user
        reg_payload = {
            "email": email,
            "username": username,
            "full_name": "Test User",
            "password": "SecretPassword123!",
        }
        reg_res = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert reg_res.status_code == 200, reg_res.text
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Check Session
        session_res = await ac.get("/api/v1/auth/session", headers=headers)
        assert session_res.status_code == 200
        assert session_res.json()["email"] == email

        # 3. Create a Habit
        habit_payload = {
            "name": "Evening Reading",
            "description": "Read 20 pages",
            "category": "Reading",
            "habit_type": "quantitative",
            "target_value": 20,
            "unit": "pages",
            "frequency_type": "daily",
            "difficulty": "medium"
        }
        create_res = await ac.post("/api/v1/habits/", json=habit_payload, headers=headers)
        assert create_res.status_code == 200
        habit_id = create_res.json()["id"]

        # 4. Log/Complete Habit
        complete_res = await ac.post(f"/api/v1/habits/{habit_id}/complete", json={"value": 20}, headers=headers)
        assert complete_res.status_code == 200
        assert complete_res.json()["completed"] is True
        assert complete_res.json()["current_streak"] == 1
        assert complete_res.json()["xp_awarded"] > 0

        # 5. Undo Log
        undo_res = await ac.post(f"/api/v1/habits/{habit_id}/undo", headers=headers)
        assert undo_res.status_code == 200
        assert undo_res.json()["completed"] is False
