"""
Backend API Tests for AI Founder Copilot
Tests: Health check, Generate endpoint, Status endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Test basic API health and root endpoints"""
    
    def test_api_root(self):
        """Test API root endpoint returns correct message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "AI Founder Copilot API"
        print("✓ API root endpoint working")

class TestGenerateEndpoint:
    """Test the /api/generate endpoint"""
    
    def test_generate_with_valid_startup_prompt(self):
        """Test generate endpoint with valid startup-related prompt"""
        response = requests.post(f"{BASE_URL}/api/generate", json={
            "prompt": "Help me create a growth strategy for my B2B SaaS startup"
        }, timeout=90)
        assert response.status_code == 200
        data = response.json()
        # Should return structured plan, not out of scope error
        assert "is_out_of_scope" not in data or data.get("is_out_of_scope") == False
        # Check for expected fields in response
        if "strategy" in data:
            assert isinstance(data["strategy"], list)
            print("✓ Generate endpoint returns valid strategy")
        print("✓ Generate endpoint working with valid prompt")
    
    def test_generate_guardrail_blocks_joke(self):
        """Test that guardrail blocks non-startup requests"""
        response = requests.post(f"{BASE_URL}/api/generate", json={
            "prompt": "Tell me a joke"
        }, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_out_of_scope") == True
        assert "error" in data
        print("✓ Guardrail correctly blocks non-startup requests")
    
    def test_generate_empty_prompt_rejected(self):
        """Test that empty prompts are rejected"""
        response = requests.post(f"{BASE_URL}/api/generate", json={
            "prompt": ""
        }, timeout=30)
        assert response.status_code == 400
        print("✓ Empty prompt correctly rejected")

class TestStatusEndpoints:
    """Test the /api/status endpoints"""
    
    def test_create_status_check(self):
        """Test creating a status check"""
        response = requests.post(f"{BASE_URL}/api/status", json={
            "client_name": "test_client_collaboration_feature"
        }, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["client_name"] == "test_client_collaboration_feature"
        print("✓ Status check creation working")
    
    def test_get_status_checks(self):
        """Test retrieving status checks"""
        response = requests.get(f"{BASE_URL}/api/status", timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Status check retrieval working - found {len(data)} records")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
