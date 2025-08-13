#!/bin/bash

# Test script for GROUP BY query generation with explicit table references

echo "Testing GROUP BY query generation with explicit table references..."
echo ""

# Get auth token first
echo "1. Logging in to get token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zamora.com", "password": "StrongPass123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "Got token: ${TOKEN:0:20}..."
echo ""

# Test 1: Explicit deals by stage
echo "2. Testing: 'Show me crm_deals grouped by stage'"
echo ""

TOOL_RESPONSE=$(curl -s -X POST http://localhost:4000/api/ai/tools/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "toolName": "dynamic_analytics",
    "params": {
      "query": "Show me crm_deals grouped by stage with count",
      "visualize": true,
      "includeRawData": false
    }
  }')

echo "Tool Response (truncated):"
echo "$TOOL_RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'data' in data and 'query' in data['data']:
    print('SQL:', data['data']['query']['sql'])
    print('Plan:', json.dumps(data['data']['query']['plan'], indent=2))
"

# Check if GROUP BY was generated
if echo "$TOOL_RESPONSE" | grep -q "GROUP BY"; then
  echo "✓ SUCCESS: GROUP BY clause was generated!"
else
  echo "✗ FAILURE: No GROUP BY clause found"
fi

echo ""
echo "3. Testing: 'Count crm_deals for each stage'"
echo ""

TOOL_RESPONSE2=$(curl -s -X POST http://localhost:4000/api/ai/tools/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "toolName": "dynamic_analytics",
    "params": {
      "query": "Count crm_deals for each stage",
      "visualize": false,
      "includeRawData": false
    }
  }')

echo "Tool Response (truncated):"
echo "$TOOL_RESPONSE2" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'data' in data and 'query' in data['data']:
    print('SQL:', data['data']['query']['sql'])
    print('Plan has groupBy:', 'groupBy' in data['data']['query']['plan'])
"

# Check if GROUP BY was generated
if echo "$TOOL_RESPONSE2" | grep -q "GROUP BY"; then
  echo "✓ SUCCESS: GROUP BY clause was generated!"
else
  echo "✗ FAILURE: No GROUP BY clause found"
fi