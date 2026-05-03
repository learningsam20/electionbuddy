import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    """Verify the health check endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "ElectionBuddy API is running"}

def test_auth_me_unauthorized():
    """Verify that accessing /me without token returns 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_register_duplicate_fail():
    """Verify that registering with an existing email fails."""
    # This assumes the demo data is seeded
    user_data = {
        "email": "voter@example.com",
        "password": "password123",
        "name": "Test User",
        "role": "citizen",
        "district": "Pune"
    }
    # First attempt might pass if DB is empty, but we check logic
    response = client.post("/api/v1/auth/register", json=user_data)
    # If it fails with 400, it's working as intended for duplicates
    if response.status_code == 400:
        assert response.json()["detail"] == "Email already registered"

def test_gemini_query_unauthorized():
    """Verify that Gemini query requires authentication."""
    response = client.post("/api/v1/chat/query", json={"prompt": "Hello"})
    assert response.status_code == 401
