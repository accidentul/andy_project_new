#!/bin/bash

# Test script for GROUP BY query generation

echo "Testing GROUP BY query generation through the new API route..."
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

# Test the dynamic_analytics tool directly
echo "2. Testing dynamic_analytics tool with GROUP BY query..."
echo "Query: 'Show me sales by stage'"
echo ""

TOOL_RESPONSE=$(curl -s -X POST http://localhost:4000/api/ai/tools/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "toolName": "dynamic_analytics",
    "params": {
      "query": "Show me sales by stage",
      "visualize": true,
      "includeRawData": false
    }
  }')

echo "Tool Response:"
echo "$TOOL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TOOL_RESPONSE"
echo ""

# Check if GROUP BY was generated in the SQL
if echo "$TOOL_RESPONSE" | grep -q "GROUP BY"; then
  echo "✓ SUCCESS: GROUP BY clause was generated!"
else
  echo "✗ FAILURE: No GROUP BY clause found in response"
fi

echo ""
echo "3. Testing another GROUP BY query..."
echo "Query: 'Count of deals for each owner'"
echo ""

TOOL_RESPONSE2=$(curl -s -X POST http://localhost:4000/api/ai/tools/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "toolName": "dynamic_analytics",
    "params": {
      "query": "Count of deals for each owner",
      "visualize": false,
      "includeRawData": false
    }
  }')

echo "Tool Response:"
echo "$TOOL_RESPONSE2" | python3 -m json.tool 2>/dev/null || echo "$TOOL_RESPONSE2"
echo ""

# Check if GROUP BY was generated in the SQL
if echo "$TOOL_RESPONSE2" | grep -q "GROUP BY"; then
  echo "✓ SUCCESS: GROUP BY clause was generated!"
else
  echo "✗ FAILURE: No GROUP BY clause found in response"
fi