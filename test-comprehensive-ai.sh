#!/bin/bash

# Comprehensive test script for AI query system with complex multi-table queries

echo "========================================="
echo "COMPREHENSIVE AI QUERY SYSTEM TEST SUITE"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Function to test a query and analyze results
test_complex_query() {
  local test_name="$1"
  local query="$2"
  local expected_features="$3"
  local expected_visualization="$4"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${YELLOW}TEST: $test_name${NC}"
  echo "Query: \"$query\""
  echo "Expected: $expected_features"
  echo "Visualization: $expected_visualization"
  echo ""
  
  # Execute query
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
  
  # Check if successful
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Query executed successfully${NC}"
  else
    echo -e "${RED}✗ Query failed${NC}"
    echo "$RESPONSE" | python3 -m json.tool | grep -i error
    return
  fi
  
  # Extract and display SQL
  SQL=$(echo "$RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'data' in data and 'query' in data['data'] and 'sql' in data['data']['query']:
    print(data['data']['query']['sql'][:500])
" 2>/dev/null)
  
  echo "Generated SQL:"
  echo "$SQL" | head -5
  echo ""
  
  # Check for expected SQL features
  echo "SQL Analysis:"
  
  # Check for JOIN
  if echo "$SQL" | grep -qi "JOIN"; then
    echo -e "${GREEN}✓ Contains JOIN clause${NC}"
    echo "$SQL" | grep -i "JOIN" | head -1
  else
    echo -e "${YELLOW}○ No JOIN clause${NC}"
  fi
  
  # Check for GROUP BY
  if echo "$SQL" | grep -qi "GROUP BY"; then
    echo -e "${GREEN}✓ Contains GROUP BY clause${NC}"
    echo "$SQL" | grep -i "GROUP BY" | head -1
  else
    echo -e "${YELLOW}○ No GROUP BY clause${NC}"
  fi
  
  # Check for aggregations
  if echo "$SQL" | grep -qE "COUNT|SUM|AVG|MAX|MIN"; then
    echo -e "${GREEN}✓ Contains aggregation functions${NC}"
  else
    echo -e "${YELLOW}○ No aggregation functions${NC}"
  fi
  
  # Check for WHERE conditions
  if echo "$SQL" | grep -qi "WHERE"; then
    echo -e "${GREEN}✓ Contains WHERE clause${NC}"
  else
    echo -e "${YELLOW}○ No WHERE clause${NC}"
  fi
  
  # Check for ORDER BY
  if echo "$SQL" | grep -qi "ORDER BY"; then
    echo -e "${GREEN}✓ Contains ORDER BY clause${NC}"
  else
    echo -e "${YELLOW}○ No ORDER BY clause${NC}"
  fi
  
  # Check for LIMIT
  if echo "$SQL" | grep -qi "LIMIT"; then
    echo -e "${GREEN}✓ Contains LIMIT clause${NC}"
  else
    echo -e "${YELLOW}○ No LIMIT clause${NC}"
  fi
  
  # Extract summary
  echo ""
  echo "Results Summary:"
  echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'data' in data:
        summary = data['data'].get('summary', {})
        print(f'Records: {summary.get(\"recordCount\", 0)}')
        print(f'Tables used: {summary.get(\"tablesUsed\", [])}')
        print(f'Has aggregations: {summary.get(\"hasAggregations\", False)}')
        print(f'Has joins: {summary.get(\"hasJoins\", False)}')
        
        # Show key metrics
        for key, value in summary.items():
            if key not in ['recordCount', 'columnsSelected', 'tablesUsed', 'hasAggregations', 'hasJoins']:
                print(f'{key}: {value}')
except:
    pass
" 2>/dev/null
  
  # Check visualization
  echo ""
  echo "Visualization:"
  VISUALIZATION=$(echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'visualization' in data['data']:
        viz = data['data']['visualization']
        if viz:
            print(f'Type: {viz.get(\"type\", \"none\")}')
            if 'data' in viz and len(viz['data']) > 0:
                print(f'Data points: {len(viz[\"data\"])}')
                if len(viz['data']) <= 3:
                    for item in viz['data']:
                        print(f'  - {item}')
except:
    pass
" 2>/dev/null)
  
  if [ -n "$VISUALIZATION" ]; then
    echo "$VISUALIZATION"
  else
    echo -e "${YELLOW}No visualization generated${NC}"
  fi
  
  echo ""
}

# ========================================
# SECTION 1: MULTI-TABLE JOIN QUERIES
# ========================================
echo ""
echo "═══════════════════════════════════════════"
echo "SECTION 1: MULTI-TABLE JOIN QUERIES"
echo "═══════════════════════════════════════════"
echo ""

test_complex_query \
  "Deals with Account Information" \
  "Show me all deals with their account names and industries" \
  "Should JOIN crm_deals with crm_accounts" \
  "table"

test_complex_query \
  "Contact Activities Count" \
  "Count activities per contact for active contacts" \
  "Should JOIN crm_activities with crm_contacts and GROUP BY" \
  "bar"

test_complex_query \
  "Revenue by Account Industry" \
  "Total revenue by customer industry from won deals" \
  "Should JOIN crm_deals with crm_accounts, filter by stage, GROUP BY industry" \
  "pie"

# ========================================
# SECTION 2: COMPLEX AGGREGATIONS
# ========================================
echo ""
echo "═══════════════════════════════════════════"
echo "SECTION 2: COMPLEX AGGREGATIONS & CALCULATIONS"
echo "═══════════════════════════════════════════"
echo ""

test_complex_query \
  "Win Rate Calculation" \
  "Calculate win rate percentage by sales stage" \
  "Should calculate percentage with CASE statements" \
  "bar"

test_complex_query \
  "Average Deal Size by Quarter" \
  "Average deal amount by quarter for the last year" \
  "Should extract quarter from date, GROUP BY quarter" \
  "line"

test_complex_query \
  "Pipeline Velocity Metrics" \
  "Show average days in each stage with deal counts" \
  "Should calculate date differences and averages" \
  "table"

# ========================================
# SECTION 3: TIME-BASED ANALYSIS
# ========================================
echo ""
echo "═══════════════════════════════════════════"
echo "SECTION 3: TIME-BASED & TREND ANALYSIS"
echo "═══════════════════════════════════════════"
echo ""

test_complex_query \
  "Monthly Revenue Trend" \
  "Monthly revenue trend for the last 6 months with running total" \
  "Should use date functions, window functions for running total" \
  "line"

test_complex_query \
  "Year-over-Year Comparison" \
  "Compare this year's sales to last year by month" \
  "Should use date comparisons and year extraction" \
  "line"

test_complex_query \
  "Cohort Analysis" \
  "Show deal cohorts by creation month and their progression" \
  "Should group by cohort month and track over time" \
  "heatmap"

# ========================================
# SECTION 4: RANKING & TOP PERFORMERS
# ========================================
echo ""
echo "═══════════════════════════════════════════"
echo "SECTION 4: RANKING & TOP PERFORMERS"
echo "═══════════════════════════════════════════"
echo ""

test_complex_query \
  "Top Sales Reps with Details" \
  "Top 5 sales reps by total revenue with deal count and average deal size" \
  "Should GROUP BY owner, calculate multiple metrics, ORDER BY revenue DESC" \
  "bar"

test_complex_query \
  "Account Ranking by Activity" \
  "Rank accounts by total activities and last activity date" \
  "Should JOIN accounts with activities, use ranking functions" \
  "table"

test_complex_query \
  "Product Performance Matrix" \
  "Show top products by revenue and quantity sold with profit margins" \
  "Should aggregate multiple metrics and calculate margins" \
  "scatter"

# ========================================
# SECTION 5: FILTERING & SEGMENTATION
# ========================================
echo ""
echo "═══════════════════════════════════════════"
echo "SECTION 5: ADVANCED FILTERING & SEGMENTATION"
echo "═══════════════════════════════════════════"
echo ""

test_complex_query \
  "High-Value Deal Analysis" \
  "Deals over 50000 in negotiation stage with account details and activity count" \
  "Should JOIN multiple tables with complex WHERE conditions" \
  "table"

test_complex_query \
  "Inactive Account Detection" \
  "Find accounts with no activities in the last 30 days but have open deals" \
  "Should use NOT EXISTS or LEFT JOIN with date filtering" \
  "table"

test_complex_query \
  "Regional Performance Breakdown" \
  "Sales performance by region and industry with quarterly comparison" \
  "Should use multiple GROUP BY dimensions" \
  "bar"

# ========================================
# SECTION 6: PREDICTIVE & ANALYTICAL
# ========================================
echo ""
echo "═══════════════════════════════════════════"
echo "SECTION 6: PREDICTIVE & ANALYTICAL QUERIES"
echo "═══════════════════════════════════════════"
echo ""

test_complex_query \
  "Deal Conversion Funnel" \
  "Show conversion rates between each sales stage" \
  "Should calculate stage-to-stage conversion percentages" \
  "funnel"

test_complex_query \
  "Customer Lifetime Value" \
  "Calculate customer lifetime value by industry segment" \
  "Should aggregate historical data by account" \
  "bar"

test_complex_query \
  "Sales Forecast Projection" \
  "Project next quarter revenue based on current pipeline and historical close rates" \
  "Should use historical averages to project future" \
  "line"

# ========================================
# SECTION 7: NATURAL LANGUAGE VARIATIONS
# ========================================
echo ""
echo "═══════════════════════════════════════════"
echo "SECTION 7: NATURAL LANGUAGE VARIATIONS"
echo "═══════════════════════════════════════════"
echo ""

test_complex_query \
  "Conversational Query 1" \
  "I need to see which customers bought the most last month" \
  "Should identify time period, customer entity, and aggregation" \
  "bar"

test_complex_query \
  "Conversational Query 2" \
  "What's the average time it takes to close a deal?" \
  "Should calculate date difference between creation and close" \
  "table"

test_complex_query \
  "Conversational Query 3" \
  "Show me struggling deals that haven't been touched in 2 weeks" \
  "Should filter by activity date and deal status" \
  "table"

# ========================================
# SUMMARY
# ========================================
echo ""
echo "═══════════════════════════════════════════"
echo "TEST SUITE SUMMARY"
echo "═══════════════════════════════════════════"
echo ""
echo "The comprehensive test suite has evaluated:"
echo "✓ Multi-table JOIN operations"
echo "✓ Complex aggregations and calculations"
echo "✓ Time-based and trend analysis"
echo "✓ Ranking and top performer queries"
echo "✓ Advanced filtering and segmentation"
echo "✓ Predictive and analytical queries"
echo "✓ Natural language understanding"
echo ""
echo "Key capabilities tested:"
echo "• JOIN operations across multiple tables"
echo "• GROUP BY with multiple dimensions"
echo "• Window functions and running totals"
echo "• Date/time manipulations"
echo "• Calculated fields and percentages"
echo "• Complex WHERE conditions"
echo "• Subqueries and CTEs"
echo "• Appropriate visualization selection"
echo ""
echo "Test suite completed!"