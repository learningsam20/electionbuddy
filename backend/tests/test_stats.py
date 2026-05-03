import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

import uuid

def get_token():
    """Helper to get a valid token for testing. Creates user if needed."""
    uid = uuid.uuid4().hex[:8]
    email = f"stats_{uid}@example.com"
    password = "StatsPassword123"
    
    # Try login
    resp = client.post("/api/v1/auth/token", data={"username": email, "password": password})
    if resp.status_code != 200:
        # Create user (must be citizen)
        client.post("/api/v1/auth/register", json={
            "email": email,
            "password": password,
            "name": "Stats User",
            "role": "citizen",
            "district": "Pune",
            "assembly_constituency": "Pune Central",
            "age": 40
        })
        
        # ELEVATE ROLE IN DB
        from backend.database import SessionLocal
        from backend.models import User
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = "officer"
            db.commit()
        db.close()
        
        resp = client.post("/api/v1/auth/token", data={"username": email, "password": password})
    
    if resp.status_code != 200:
        pytest.fail(f"Login failed: {resp.text}")
        
    return resp.json()["access_token"]

def test_district_stats_authorized():
    """Verify that an officer can access district stats."""
    token = get_token()
    response = client.get("/api/v1/stats/Pune", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "total_registered" in data
    assert data["district_id"] == "pune"

def test_district_stats_unauthorized():
    """Verify that a citizen cannot access full district stats."""
    # Create a citizen token
    client.post("/api/v1/auth/register", json={
        "email": "citizen_stats@example.com",
        "password": "password123",
        "name": "Citizen Stats",
        "role": "citizen"
    })
    login_resp = client.post("/api/v1/auth/token", data={"username": "citizen_stats@example.com", "password": "password123"})
    token = login_resp.json()["access_token"]
    
    response = client.get("/api/v1/stats/Pune", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
