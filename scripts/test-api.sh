#!/bin/bash
#
# Quick API Test Script
# Run basic API smoke tests
#

set -e

BASE_URL="${TEST_API_BASE_URL:-http://localhost:3000}"
echo "🧪 Testing API at $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local auth_header=$4
  
  local url="$BASE_URL$endpoint"
  
  local opts=(-s -o /dev/null -w "%{http_code}")
  
  if [ -n "$auth_header" ]; then
    opts+=(-H "Authorization: Bearer $auth_header")
  fi
  
  local status
  if [ "$method" = "GET" ]; then
    status=$(curl "${opts[@]}" "$url" || echo "000")
  else
    status=$(curl "${opts[@]}" -X "$method" "$url" || echo "000")
  fi
  
  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} $method $endpoint ($status)"
  else
    echo -e "${RED}✗${NC} $method $endpoint (expected $expected_status, got $status)"
  fi
}

echo "📋 Testing Public Endpoints"
test_endpoint "GET" "/api/v1/public/leaderboard" "200"
test_endpoint "GET" "/api/v1/public/stats" "200"

echo ""
echo "📋 Testing A2A Protocol"
test_endpoint "GET" "/api/v1/a2a/agent" "200"

echo ""
echo -e "${GREEN}Smoke tests completed!${NC}"
