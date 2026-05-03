import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_registration_flow():
    """Test full registration and login flow for a new user."""
    email = "newuser@example.com"
    user_data = {
        "email": email,
        "password": "strongpassword123",
        "name": "New User",
        "role": "citizen",
        "district": "Pune",
        "assembly_constituency": "Pune Central",
        "age": 25,
        "gender": "Other"
    }
    
    # 1. Register
    reg_resp = client.post("/api/v1/auth/register", json=user_data)
    if reg_resp.status_code == 400: # Already exists in DB
        pass 
    else:
        assert reg_resp.status_code == 200
        assert reg_resp.json()["email"] == email

    # 2. Login
    login_data = {
        "username": email,
        "password": "strongpassword123"
    }
    login_resp = client.post("/api/v1/auth/token", data=login_data)
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert token is not None

    # 3. Get /me
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email

def test_invalid_login():
    """Test login with wrong credentials."""
    login_data = {
        "username": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/token", data=login_data)
    assert response.status_code == 401
    # Check if detail exists in JSON
    assert "detail" in response.json()

def test_weak_password_registration():
    """Test registration with password shorter than 8 characters (backend validation)."""
    user_data = {
        "email": "weak@example.com",
        "password": "weak", # Too short
        "name": "Weak User"
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    # FastAPI/Pydantic returns 422 for validation errors
    assert response.status_code == 422
