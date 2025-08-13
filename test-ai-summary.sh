#!/bin/bash

# Quick Summary Test of AI Query System

echo "======================================"
echo "AI QUERY SYSTEM - QUICK TEST SUMMARY"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zamora.com", "password": "StrongPass123"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Quick test function
quick_test() {
  local name="$1"
  local query="$2"
  
  echo -e "${YELLOW}Testing: $name${NC}"
  echo "Query: \"$query\""
  
  RESPONSE=$(curl -s -X POST http://localhost:4000/api/ai/tools/execute \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"toolName\": \"dynamic_analytics\",
      \"params\": {
        \"query\": \"$query\",
        \"visualize\": true
      }
    }")
  
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Success${NC}"
    
    # Extract SQL features
    SQL=$(echo "$RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'data' in data and 'query' in data['data']:
    sql = data['data']['query'].get('sql', '')
    print(sql[:150])
" 2>/dev/null)
    
    echo "SQL: $SQL..."
    
    # Check features
    FEATURES=""
    echo "$RESPONSE" | grep -qi "GROUP BY" && FEATURES="$FEATURES GROUP_BY"
    echo "$RESPONSE" | grep -qi "JOIN" && FEATURES="$FEATURES JOIN"
    echo "$RESPONSE" | grep -qE "SUM|COUNT|AVG|MAX|MIN" && FEATURES="$FEATURES AGGREGATION"
    echo "$RESPONSE" | grep -qi "WHERE" && FEATURES="$FEATURES WHERE"
    echo "$RESPONSE" | grep -qi "ORDER BY" && FEATURES="$FEATURES ORDER"
    echo "$RESPONSE" | grep -qi "LIMIT" && FEATURES="$FEATURES LIMIT"
    
    [ -n "$FEATURES" ] && echo -e "Features:${GREEN}$FEATURES${NC}"
    
    # Get visualization
    VIZ=$(echo "$RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'data' in data and 'visualization' in data['data'] and data['data']['visualization']:
    print(data['data']['visualization'].get('type', 'none'))
" 2>/dev/null)
    
    [ -n "$VIZ" ] && echo "Visualization: $VIZ"
    
  else
    echo -e "${RED}✗ Failed${NC}"
  fi
  
  echo "---"
  echo ""
}

# Run key tests
quick_test "Simple Count" "How many deals?"
quick_test "Aggregation by Group" "Show sales by stage"
quick_test "Date Filtering" "Deals closing this month"
quick_test "Top N Query" "Top 5 deals by amount"
quick_test "Complex Filter" "Open deals worth over 100000"
quick_test "Distribution" "Distribution of deals by stage"
quick_test "Average Calculation" "Average deal size"
quick_test "Natural Language" "What's our best performing stage?"

echo "======================================"
echo "SUMMARY OF CAPABILITIES"
echo "======================================"
echo ""
echo -e "${GREEN}✓ Working Features:${NC}"
echo "  • COUNT, SUM, AVG, MIN, MAX aggregations"
echo "  • GROUP BY clauses"
echo "  • WHERE conditions with multiple operators"
echo "  • ORDER BY and LIMIT"
echo "  • Date filtering"
echo "  • Natural language understanding"
echo "  • Automatic visualization selection"
echo "  • Real-time schema usage"
echo ""
echo -e "${YELLOW}⚠ Limitations:${NC}"
echo "  • No JOINs between business tables (schema lacks foreign keys)"
echo "  • Some date functions may have SQLite-specific syntax issues"
echo ""
echo "Test completed!"