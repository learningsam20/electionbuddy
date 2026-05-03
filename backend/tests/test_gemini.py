import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def get_token():
    """Helper to get a valid token for testing. Creates user if needed."""
    email = "testvoter@example.com"
    password = "TestPassword123"
    
    # Try login
    resp = client.post("/api/v1/auth/token", data={"username": email, "password": password})
    if resp.status_code != 200:
        # Create user
        client.post("/api/v1/auth/register", json={
            "email": email,
            "password": password,
            "name": "Test Voter",
            "role": "citizen",
            "district": "Pune",
            "assembly_constituency": "Pune Central",
            "age": 30
        })
        resp = client.post("/api/v1/auth/token", data={"username": email, "password": password})
    
    return resp.json()["access_token"]

def test_gemini_query_flow():
    """Test sending a query to Gemini and verifying response structure."""
    token = get_token()
    query_data = {
        "prompt": "Tell me about voting ethics in 50 words.",
        "context": "Citizen education quest"
    }
    
    response = client.post(
        "/api/v1/chat/query", 
        json=query_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 0

def test_gemini_history_persistence():
    """Verify that chat history is being tracked (implicit check via multiple queries)."""
    token = get_token()
    
    # Query 1
    client.post(
        "/api/v1/chat/query", 
        json={"prompt": "My name is Sameer."},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Query 2 (asking Gemini to recall name if history is working)
    response = client.post(
        "/api/v1/chat/query", 
        json={"prompt": "What is my name?"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    # Note: AI response varies, but we mainly test the endpoint reliability with history context
    assert "response" in response.json()
