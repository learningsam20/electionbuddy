import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import User

client = TestClient(app)

def test_leaderboard_rankings():
    """Verify that the leaderboard correctly ranks users by points."""
    response = client.get("/api/v1/leaderboard/?district=Pune", headers={"Authorization": "Bearer demo-token-citizen"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # Check if sorted by points descending
    points = [u["total_points"] for u in data]
    assert points == sorted(points, reverse=True)

def test_leaderboard_masking():
    """Verify that usernames are masked for privacy on the leaderboard."""
    response = client.get("/api/v1/leaderboard/?limit=5", headers={"Authorization": "Bearer demo-token-citizen"})
    data = response.json()
    
    # The 'demo-token-citizen' is for 'Demo Citizen'
    # Any other user should be masked
    for entry in data:
        if entry["name"] != "Demo Citizen":
            assert "XXX" in entry["name"]
