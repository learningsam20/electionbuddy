import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_unauthorized_role_update():
    """Verify that a non-admin user cannot update roles."""
    # Attempting to update a role with a citizen token
    response = client.post(
        "/api/v1/admin/ext/update-role",
        headers={"Authorization": "Bearer demo-token-citizen"},
        json={"user_id": 1, "new_role": "admin"}
    )
    # Depending on implementation, it might be 403 or 401
    assert response.status_code in [401, 403]

def test_admin_role_list_access():
    """Verify that only admins can access the user directory."""
    # Citizen attempt
    res_citizen = client.get("/api/v1/admin/ext/users", headers={"Authorization": "Bearer demo-token-citizen"})
    assert res_citizen.status_code in [401, 403]
    
    # Admin attempt
    res_admin = client.get("/api/v1/admin/ext/users", headers={"Authorization": "Bearer demo-token-admin"})
    assert res_admin.status_code == 200
    assert isinstance(res_admin.json(), list)
