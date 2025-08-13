#!/bin/bash

# Comprehensive AI Query System Test Suite with Real Schema
# Tests all SQL functions, aggregations, and visualizations

echo "=============================================="
echo "COMPREHENSIVE AI QUERY SYSTEM TEST SUITE"
echo "WITH REAL-TIME SCHEMA"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Stats tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Get auth token
echo "🔐 Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zamora.com", "password": "StrongPass123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo ""

# Function to test a query
test_query() {
  local category="$1"
  local test_name="$2"
  local query="$3"
  local expected_features="$4"
  
  ((TOTAL_TESTS++))
  
  echo -e "${CYAN}[$category]${NC} ${YELLOW}$test_name${NC}"
  echo "  Query: \"$query\""
  echo "  Expected: $expected_features"
  
  # Execute query
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
  
  # Check if successful
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "  ${GREEN}✓ Query executed successfully${NC}"
    ((PASSED_TESTS++))
    
    # Extract and analyze SQL
    SQL=$(echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'query' in data['data']:
        print(data['data']['query'].get('sql', ''))
except:
    pass
" 2>/dev/null)
    
    # Check for expected SQL features
    if [ -n "$SQL" ]; then
      # Compact SQL display
      COMPACT_SQL=$(echo "$SQL" | tr '\n' ' ' | sed 's/  */ /g' | cut -c1-100)
      echo "  SQL: $COMPACT_SQL..."
      
      # Feature checks
      FEATURES=""
      echo "$SQL" | grep -qi "GROUP BY" && FEATURES="$FEATURES GROUP_BY"
      echo "$SQL" | grep -qi "JOIN" && FEATURES="$FEATURES JOIN"
      echo "$SQL" | grep -qE "COUNT|SUM|AVG|MAX|MIN" && FEATURES="$FEATURES AGG"
      echo "$SQL" | grep -qi "WHERE" && FEATURES="$FEATURES WHERE"
      echo "$SQL" | grep -qi "ORDER BY" && FEATURES="$FEATURES ORDER"
      echo "$SQL" | grep -qi "LIMIT" && FEATURES="$FEATURES LIMIT"
      echo "$SQL" | grep -qi "HAVING" && FEATURES="$FEATURES HAVING"
      echo "$SQL" | grep -qi "DISTINCT" && FEATURES="$FEATURES DISTINCT"
      echo "$SQL" | grep -qE "DATE|strftime" && FEATURES="$FEATURES DATE_FUNC"
      echo "$SQL" | grep -qi "CASE" && FEATURES="$FEATURES CASE"
      
      [ -n "$FEATURES" ] && echo -e "  Features:${GREEN}$FEATURES${NC}"
    fi
    
    # Check visualization
    VIZ_TYPE=$(echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'visualization' in data['data']:
        viz = data['data']['visualization']
        if viz and 'type' in viz:
            print(viz['type'])
except:
    pass
" 2>/dev/null)
    
    [ -n "$VIZ_TYPE" ] && echo -e "  Visualization: ${MAGENTA}$VIZ_TYPE${NC}"
    
    # Show result count
    RECORD_COUNT=$(echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'summary' in data['data']:
        print(data['data']['summary'].get('recordCount', 0))
except:
    pass
" 2>/dev/null)
    
    [ -n "$RECORD_COUNT" ] && echo "  Records: $RECORD_COUNT"
    
  else
    echo -e "  ${RED}✗ Query failed${NC}"
    ((FAILED_TESTS++))
    
    # Show error
    ERROR=$(echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'error' in data:
        print(data['error'][:100])
except:
    pass
" 2>/dev/null)
    
    [ -n "$ERROR" ] && echo -e "  Error: ${RED}$ERROR${NC}"
  fi
  
  echo ""
}

# ========================================
# SECTION 1: BASIC AGGREGATIONS
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 1: BASIC AGGREGATIONS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "AGGREGATION" "COUNT" \
  "How many deals do we have?" \
  "Simple COUNT(*)"

test_query "AGGREGATION" "SUM" \
  "What is the total pipeline value?" \
  "SUM(amount)"

test_query "AGGREGATION" "AVERAGE" \
  "What's the average deal size?" \
  "AVG(amount)"

test_query "AGGREGATION" "MIN/MAX" \
  "Show me the smallest and largest deals" \
  "MIN and MAX aggregations"

# ========================================
# SECTION 2: GROUP BY QUERIES
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 2: GROUP BY QUERIES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "GROUP_BY" "By Single Dimension" \
  "Show sales by stage" \
  "GROUP BY stage"

test_query "GROUP_BY" "With Multiple Aggregations" \
  "Count and total amount by stage" \
  "COUNT and SUM with GROUP BY"

test_query "GROUP_BY" "By Date" \
  "Revenue by month" \
  "GROUP BY with date functions"

test_query "GROUP_BY" "Distribution" \
  "Distribution of deals by stage" \
  "GROUP BY for distribution analysis"

# ========================================
# SECTION 3: FILTERING & CONDITIONS
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 3: FILTERING & CONDITIONS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "FILTER" "Simple WHERE" \
  "Show closed won deals" \
  "WHERE stage = 'Closed Won'"

test_query "FILTER" "Range Filter" \
  "Deals worth more than 100000" \
  "WHERE amount > 100000"

test_query "FILTER" "Date Filter" \
  "Deals closing this month" \
  "WHERE with date range"

test_query "FILTER" "Multiple Conditions" \
  "Open deals worth over 50000" \
  "Multiple WHERE conditions"

test_query "FILTER" "NOT IN" \
  "All deals except closed ones" \
  "WHERE NOT IN condition"

# ========================================
# SECTION 4: SORTING & LIMITING
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 4: SORTING & LIMITING${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "SORT" "Top N" \
  "Top 10 deals by amount" \
  "ORDER BY DESC with LIMIT"

test_query "SORT" "Bottom N" \
  "Bottom 5 smallest deals" \
  "ORDER BY ASC with LIMIT"

test_query "SORT" "Recent" \
  "Most recent deals" \
  "ORDER BY date DESC"

test_query "SORT" "Oldest" \
  "Oldest open deals" \
  "ORDER BY date ASC with filter"

# ========================================
# SECTION 5: DATE & TIME FUNCTIONS
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 5: DATE & TIME FUNCTIONS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "DATE" "This Month" \
  "Deals closing this month" \
  "Date filter for current month"

test_query "DATE" "Last Month" \
  "Revenue from last month" \
  "Previous month calculation"

test_query "DATE" "This Quarter" \
  "Quarterly pipeline value" \
  "Quarter date functions"

test_query "DATE" "Year to Date" \
  "YTD sales performance" \
  "Year-to-date calculation"

test_query "DATE" "By Quarter" \
  "Sales by quarter" \
  "GROUP BY quarter"

# ========================================
# SECTION 6: COMPLEX ANALYTICS
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 6: COMPLEX ANALYTICS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "ANALYTICS" "Win Rate" \
  "Calculate win rate percentage" \
  "Percentage calculation"

test_query "ANALYTICS" "Pipeline Velocity" \
  "Average time to close by stage" \
  "Date difference calculations"

test_query "ANALYTICS" "Conversion Funnel" \
  "Show conversion between stages" \
  "Funnel metrics"

test_query "ANALYTICS" "Trend Analysis" \
  "Monthly revenue trend" \
  "Time series analysis"

test_query "ANALYTICS" "Comparative" \
  "Compare this month vs last month" \
  "Period comparison"

# ========================================
# SECTION 7: HAVING CLAUSE
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 7: HAVING CLAUSE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "HAVING" "Aggregate Filter" \
  "Stages with more than 100 deals" \
  "HAVING COUNT(*) > 100"

test_query "HAVING" "Sum Filter" \
  "Stages with total value over 1 million" \
  "HAVING SUM(amount) > 1000000"

# ========================================
# SECTION 8: DISTINCT & UNIQUE
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 8: DISTINCT & UNIQUE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "DISTINCT" "Unique Values" \
  "List all unique stages" \
  "SELECT DISTINCT"

test_query "DISTINCT" "Count Distinct" \
  "How many different stages are there?" \
  "COUNT(DISTINCT)"

# ========================================
# SECTION 9: NATURAL LANGUAGE VARIATIONS
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 9: NATURAL LANGUAGE VARIATIONS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "NLP" "Conversational 1" \
  "What's our best performing stage?" \
  "Natural language understanding"

test_query "NLP" "Conversational 2" \
  "Show me deals that are stuck" \
  "Interpret 'stuck' concept"

test_query "NLP" "Conversational 3" \
  "Which deals need attention?" \
  "Business logic interpretation"

test_query "NLP" "Question Format" \
  "Are we on track to hit our target?" \
  "Target analysis"

test_query "NLP" "Informal" \
  "Give me the big deals" \
  "Interpret 'big' as high value"

# ========================================
# SECTION 10: VISUALIZATION TYPES
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 10: VISUALIZATION TYPES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "VIZ" "Pie Chart" \
  "Show deal distribution as pie chart" \
  "Pie chart visualization"

test_query "VIZ" "Bar Chart" \
  "Compare stages in bar chart" \
  "Bar chart visualization"

test_query "VIZ" "Line Chart" \
  "Revenue trend line chart" \
  "Line chart visualization"

test_query "VIZ" "Table View" \
  "List all deals in table format" \
  "Table visualization"

# ========================================
# SECTION 11: JOIN ATTEMPTS (Testing Schema Limitations)
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 11: JOIN ATTEMPTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "JOIN" "Self Join" \
  "Compare deals with average" \
  "Self join or subquery"

test_query "JOIN" "Subquery" \
  "Deals above average value" \
  "Subquery in WHERE"

# ========================================
# SECTION 12: BUSINESS METRICS
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 12: BUSINESS METRICS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "METRICS" "Pipeline Health" \
  "Show pipeline health metrics" \
  "Multiple business metrics"

test_query "METRICS" "Sales Velocity" \
  "Calculate sales velocity" \
  "Complex calculation"

test_query "METRICS" "Forecast" \
  "Forecast next month revenue" \
  "Predictive query"

test_query "METRICS" "Performance" \
  "Sales performance summary" \
  "Summary statistics"

# ========================================
# SECTION 13: EDGE CASES
# ========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 13: EDGE CASES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

test_query "EDGE" "Empty Result" \
  "Deals worth over 10 billion" \
  "Query with no results"

test_query "EDGE" "All Records" \
  "Show everything" \
  "No filter query"

test_query "EDGE" "Complex Expression" \
  "Deals worth between 50k and 100k closing this quarter" \
  "Multiple complex conditions"

test_query "EDGE" "Negation" \
  "Deals that are not in negotiation" \
  "NOT operator"

# ========================================
# FINAL SUMMARY
# ========================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST SUITE SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

SUCCESS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)

echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
else
  echo -e "${YELLOW}⚠️  Some tests failed. Review the output above for details.${NC}"
fi

echo ""
echo "Key Capabilities Tested:"
echo "✓ Aggregation functions (COUNT, SUM, AVG, MIN, MAX)"
echo "✓ GROUP BY with single and multiple dimensions"
echo "✓ WHERE clauses with various operators"
echo "✓ ORDER BY and LIMIT"
echo "✓ Date and time functions"
echo "✓ HAVING clause"
echo "✓ DISTINCT operations"
echo "✓ Natural language understanding"
echo "✓ Visualization type selection"
echo "✓ Complex business metrics"
echo ""

# Check for JOIN support
if echo "$FEATURES" | grep -q "JOIN"; then
  echo -e "${GREEN}✓ JOIN operations detected${NC}"
else
  echo -e "${YELLOW}○ No JOIN operations (likely due to schema limitations)${NC}"
fi

echo ""
echo "Test completed at $(date)"