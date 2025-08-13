#!/bin/bash

# Test script for enhanced AI query system with semantic understanding

echo "========================================"
echo "Testing Enhanced AI Query System"
echo "========================================"
echo ""

# Get auth token
echo "1. Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zamora.com", "password": "StrongPass123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✓ Authentication successful"
echo ""

# Function to test a query
test_query() {
  local query="$1"
  local expected="$2"
  
  echo "Testing: \"$query\""
  echo "Expected: $expected"
  
  RESPONSE=$(curl -s -X POST http://localhost:4000/api/ai/tools/execute \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"toolName\": \"dynamic_analytics\",
      \"params\": {
        \"query\": \"$query\",
        \"visualize\": true,
        \"includeRawData\": false
      }
    }")
  
  # Check if response contains expected elements
  if echo "$RESPONSE" | grep -q "GROUP BY"; then
    echo "✓ GROUP BY clause generated"
  else
    echo "✗ No GROUP BY clause found"
  fi
  
  if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✓ Query executed successfully"
  else
    echo "✗ Query failed"
  fi
  
  # Show summary of results
  echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'data' in data:
        if 'summary' in data['data']:
            print('Summary:', data['data']['summary'])
        if 'query' in data['data'] and 'sql' in data['data']['query']:
            print('SQL Generated:')
            print(data['data']['query']['sql'][:200])
except:
    pass
" 2>/dev/null
  
  echo "---"
  echo ""
}

echo "========================================"
echo "2. Testing Business Terminology Mapping"
echo "========================================"
echo ""

test_query "Show me sales by stage" "Should map 'sales' to crm_deals and group by stage"
test_query "Count customers by industry" "Should map 'customers' to crm_accounts"
test_query "Revenue by month" "Should map 'revenue' to SUM(amount) and group by month"
test_query "Top 10 opportunities" "Should map 'opportunities' to crm_deals with limit"

echo "========================================"
echo "3. Testing Pattern Recognition"
echo "========================================"
echo ""

test_query "Distribution of deals by stage" "Should generate pie chart with GROUP BY"
test_query "Sales trend over time" "Should generate line chart with date grouping"
test_query "Compare this month vs last month" "Should add time filters"
test_query "Bottom 5 accounts by revenue" "Should ORDER BY ASC with LIMIT 5"

echo "========================================"
echo "4. Testing Complex Queries"
echo "========================================"
echo ""

test_query "Show me pipeline value for open deals grouped by owner" "Should filter and group"
test_query "Average deal size by stage for this quarter" "Should use AVG with time filter"
test_query "Count of activities per rep this month" "Should join tables with time filter"
test_query "Win rate by industry" "Should calculate percentage with GROUP BY"

echo "========================================"
echo "5. Testing Natural Language Understanding"
echo "========================================"
echo ""

test_query "How many deals do we have?" "Should COUNT(*) from crm_deals"
test_query "What's our total revenue?" "Should SUM(amount) from closed won deals"
test_query "List top performing sales reps" "Should aggregate and rank by performance"
test_query "Show me deals closing this month" "Should filter by closeDate"

echo "========================================"
echo "Test Summary"
echo "========================================"
echo ""
echo "The enhanced query system should now:"
echo "✓ Understand business terminology (sales, customers, revenue)"
echo "✓ Automatically generate GROUP BY clauses when needed"
echo "✓ Map natural language to correct tables and columns"
echo "✓ Apply appropriate aggregations and filters"
echo "✓ Suggest visualizations based on query type"
echo ""
echo "All tests completed!"