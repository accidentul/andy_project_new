#!/bin/bash

# Test script for AI queries that were previously failing

API_BASE="http://localhost:4000"
TOKEN=""

# Function to get login token
login() {
    echo "Logging in..."
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@zamora.com", "password": "StrongPass123"}')
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo "Failed to login. Response was:"
        echo "$LOGIN_RESPONSE"
        exit 1
    fi
    echo "Logged in successfully!"
}

# Function to test a query
test_query() {
    local query="$1"
    local description="$2"
    
    echo ""
    echo "Testing: $description"
    echo "Query: $query"
    echo "----------------------------------------"
    
    # Encode the query using Python (which is available on macOS)
    ENCODED_QUERY=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")
    
    # Make the request with timeout
    RESPONSE=$(timeout 10 curl -s -X GET \
        "$API_BASE/api/ai/chat/stream?query=$ENCODED_QUERY&token=$TOKEN" \
        -H "Accept: text/event-stream" 2>&1)
    
    # Check if response contains error
    if echo "$RESPONSE" | grep -q "error"; then
        echo "❌ Query failed with error"
        echo "$RESPONSE" | grep -o '"error":"[^"]*' | head -1
    elif echo "$RESPONSE" | grep -q "visualization"; then
        echo "✅ Query successful with visualization"
        # Extract visualization type
        VIZ_TYPE=$(echo "$RESPONSE" | grep -o '"type":"[^"]*' | grep -v "content\|done\|processing" | head -1 | cut -d'"' -f4)
        if [ ! -z "$VIZ_TYPE" ]; then
            echo "   Visualization type: $VIZ_TYPE"
        fi
    elif echo "$RESPONSE" | grep -q "content"; then
        echo "✅ Query successful (no visualization)"
    else
        echo "⚠️  Unexpected response or timeout"
    fi
}

# Main execution
echo "Starting AI Query Tests"
echo "======================="

# Login first
login

# Test the problematic queries
test_query "Show me sales by owner as a bar chart" "Sales by Owner (Bar Chart)"
test_query "Show sales trend over the last 12 months as a line chart" "12-Month Sales Trend (Line Chart)"
test_query "List top 10 opportunities with details in a table" "Top 10 Opportunities (Table)"
test_query "Show me deal distribution by stage as a pie chart" "Deal Distribution by Stage (Pie Chart)"

# Test additional queries to ensure nothing broke
test_query "What's the total revenue this year?" "Total Revenue Query"
test_query "How many deals are in the pipeline?" "Pipeline Count Query"
test_query "Show me all deals worth over 10000" "High-Value Deals Query"

echo ""
echo "======================="
echo "Test Summary Complete"
echo ""
echo "If all queries show ✅, the fixes are working correctly!"
echo "Check the frontend UI to verify visualizations are rendering."