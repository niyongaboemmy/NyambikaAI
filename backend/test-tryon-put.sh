#!/bin/bash

# Test script for Try-On PUT endpoint
# This script will test the PUT endpoint functionality

echo "🧪 Try-On PUT Endpoint HTTP Test"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3003"
SESSION_ID="724c3873-3a4d-44f9-aea3-05e9f0054e00"

# Test JWT token (you need to replace this with a real token from your app)
# This is a placeholder - in a real scenario, you'd generate this from the app
TEST_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJyb2xlIjoiY3VzdG9tZXIifQ.sampleToken"

echo "📋 Test Configuration:"
echo "  API URL: $API_URL"
echo "  Session ID: $SESSION_ID"
echo ""

# Check if server is running
echo -n "🔍 Checking if server is running..."
if curl -s "$API_URL/api/health" > /dev/null 2>&1 || curl -s "$API_URL" > /dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}❌ Server is not running at $API_URL${NC}"
    echo "Please start the backend server first with: npm run dev"
    exit 1
fi

# Test 1: Test PUT endpoint without authentication (should fail)
echo ""
echo -e "${YELLOW}Test 1: PUT without authentication (should fail with 401)${NC}"
RESPONSE=$(curl -s -X PUT "$API_URL/api/try-on-sessions/$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "rating": 5}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response Code: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✓ Correctly rejected unauthorized request${NC}"
else
    echo -e "${YELLOW}⚠ Expected 401, got $HTTP_CODE${NC}"
fi

# Test 2: Test with mock authentication
echo ""
echo -e "${YELLOW}Test 2: PUT with authentication (should return session or 404)${NC}"
RESPONSE=$(curl -s -X PUT "$API_URL/api/try-on-sessions/$SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "tryOnImageUrl": "https://example.com/result.jpg",
    "status": "completed",
    "fitRecommendation": "{\"fit\": \"perfect\", \"confidence\": 0.95}",
    "isFavorite": true,
    "notes": "Great fit!",
    "rating": 5
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response Code: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
    echo -e "${GREEN}✓ Request processed correctly (code $HTTP_CODE)${NC}"
    
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✓ Session was found and updated${NC}"
        
        # Check if response contains expected fields
        if echo "$BODY" | grep -q "session"; then
            echo -e "${GREEN}✓ Response contains session data${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Session not found (expected if test DB is empty)${NC}"
    fi
else
    echo -e "${RED}✗ Unexpected response code: $HTTP_CODE${NC}"
fi

echo ""
echo "=================================="
echo "✅ HTTP Tests completed"
echo ""
echo "📝 Notes:"
echo "- The 404 error is expected if there's no session in the database"
echo "- The 401 error is expected without proper authentication"
echo "- A 200 response with updated session data confirms the endpoint works"
