"""
Tests for authentication endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.ars import User


class TestAuth:
    """Test authentication endpoints."""
    
    def test_login_success(self, client: TestClient, test_user: User):
        """Test successful login."""
        login_data = {
            "username": "testuser",
            "password": "testpassword"
        }
        response = client.post("/api/v1/auth/login", data=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client: TestClient, test_user: User):
        """Test login with invalid credentials."""
        login_data = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        response = client.post("/api/v1/auth/login", data=login_data)
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect username or password"
    
    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user."""
        login_data = {
            "username": "nonexistent",
            "password": "password"
        }
        response = client.post("/api/v1/auth/login", data=login_data)
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect username or password"
    
    def test_register_success(self, client: TestClient):
        """Test successful user registration."""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "newpassword123",
            "full_name": "New User"
        }
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["username"] == user_data["username"]
        assert data["full_name"] == user_data["full_name"]
        assert "id" in data
        assert "hashed_password" not in data
    
    def test_register_duplicate_email(self, client: TestClient, test_user: User):
        """Test registration with duplicate email."""
        user_data = {
            "email": test_user.email,
            "username": "anotheruser",
            "password": "password123",
            "full_name": "Another User"
        }
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]
    
    def test_register_duplicate_username(self, client: TestClient, test_user: User):
        """Test registration with duplicate username."""
        user_data = {
            "email": "another@example.com",
            "username": test_user.username,
            "password": "password123",
            "full_name": "Another User"
        }
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already taken" in response.json()["detail"]
    
    def test_get_current_user(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test getting current user information."""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["username"] == test_user.username
        assert data["full_name"] == test_user.full_name
    
    def test_get_current_user_unauthorized(self, client: TestClient):
        """Test getting current user without authentication."""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Not authenticated"
    
    def test_update_user_profile(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test updating user profile."""
        update_data = {
            "full_name": "Updated Name",
            "email": "updated@example.com"
        }
        response = client.patch("/api/v1/auth/me", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == update_data["full_name"]
        assert data["email"] == update_data["email"]
    
    def test_change_password(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test changing user password."""
        password_data = {
            "current_password": "testpassword",
            "new_password": "newpassword123"
        }
        response = client.post("/api/v1/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["message"] == "Password updated successfully"
        
        # Test login with new password
        login_data = {
            "username": test_user.username,
            "password": "newpassword123"
        }
        login_response = client.post("/api/v1/auth/login", data=login_data)
        assert login_response.status_code == 200
    
    def test_change_password_wrong_current(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test changing password with wrong current password."""
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        }
        response = client.post("/api/v1/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "Incorrect password" in response.json()["detail"]