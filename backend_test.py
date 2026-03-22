#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AIFounderCopilotTester:
    def __init__(self, base_url="https://plan-builder-ai.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test the health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "",
            200
        )

    def test_valid_startup_query(self):
        """Test valid startup query"""
        return self.run_test(
            "Valid Startup Query",
            "POST",
            "generate",
            200,
            data={"prompt": "Help me grow my SaaS business with better customer acquisition"}
        )

    def test_guardrail_joke(self):
        """Test guardrail with joke request"""
        success, response = self.run_test(
            "Guardrail Test - Joke",
            "POST",
            "generate",
            200,
            data={"prompt": "Tell me a joke"}
        )
        
        if success and response.get('is_out_of_scope'):
            print("✅ Guardrail working correctly - blocked joke request")
            return True
        else:
            print("❌ Guardrail failed - should have blocked joke request")
            self.failed_tests.append({
                "test": "Guardrail Test - Joke",
                "issue": "Should have blocked joke request",
                "response": response
            })
            return False

    def test_guardrail_poem(self):
        """Test guardrail with poem request"""
        success, response = self.run_test(
            "Guardrail Test - Poem",
            "POST",
            "generate",
            200,
            data={"prompt": "Write me a poem"}
        )
        
        if success and response.get('is_out_of_scope'):
            print("✅ Guardrail working correctly - blocked poem request")
            return True
        else:
            print("❌ Guardrail failed - should have blocked poem request")
            self.failed_tests.append({
                "test": "Guardrail Test - Poem",
                "issue": "Should have blocked poem request",
                "response": response
            })
            return False

    def test_empty_prompt(self):
        """Test empty prompt handling"""
        return self.run_test(
            "Empty Prompt",
            "POST",
            "generate",
            400,
            data={"prompt": ""}
        )

    def test_modifier_aggressive(self):
        """Test modifier functionality - aggressive"""
        return self.run_test(
            "Modifier - Aggressive",
            "POST",
            "generate",
            200,
            data={
                "prompt": "Help me scale my startup",
                "modifier": "aggressive"
            }
        )

    def test_modifier_budget(self):
        """Test modifier functionality - budget"""
        return self.run_test(
            "Modifier - Budget",
            "POST",
            "generate",
            200,
            data={
                "prompt": "Help me scale my startup",
                "modifier": "budget"
            }
        )

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test POST status
        success1, response1 = self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": "test_client"}
        )
        
        # Test GET status
        success2, response2 = self.run_test(
            "Get Status Checks",
            "GET",
            "status",
            200
        )
        
        return success1 and success2

    def validate_response_structure(self, response_data):
        """Validate the structure of a successful generate response"""
        required_fields = ['strategy', 'actions', 'risks', 'execution_plan', 'refinements', 'confidence', 'insight']
        
        for field in required_fields:
            if field not in response_data:
                print(f"❌ Missing required field: {field}")
                return False
        
        # Validate actions structure
        if 'actions' in response_data and isinstance(response_data['actions'], list):
            for action in response_data['actions']:
                if not all(key in action for key in ['action', 'reason', 'outcome']):
                    print(f"❌ Invalid action structure: {action}")
                    return False
        
        # Validate execution_plan structure
        if 'execution_plan' in response_data and isinstance(response_data['execution_plan'], list):
            for step in response_data['execution_plan']:
                if not all(key in step for key in ['step', 'result']):
                    print(f"❌ Invalid execution step structure: {step}")
                    return False
        
        print("✅ Response structure is valid")
        return True

def main():
    print("🚀 Starting AI Founder Copilot Backend Tests")
    print("=" * 50)
    
    tester = AIFounderCopilotTester()
    
    # Run all tests
    tests = [
        tester.test_health_check,
        tester.test_valid_startup_query,
        tester.test_guardrail_joke,
        tester.test_guardrail_poem,
        tester.test_empty_prompt,
        tester.test_modifier_aggressive,
        tester.test_modifier_budget,
        tester.test_status_endpoints
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            tester.failed_tests.append({
                "test": test.__name__,
                "error": str(e)
            })
    
    # Test response structure validation
    print(f"\n🔍 Testing response structure validation...")
    success, response = tester.run_test(
        "Structure Validation Test",
        "POST",
        "generate",
        200,
        data={"prompt": "Help me validate my startup idea"}
    )
    
    if success and not response.get('is_out_of_scope'):
        tester.validate_response_structure(response)
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary:")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())