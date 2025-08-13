#!/bin/bash

# Test script for complex cross-table analytics queries

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMTM4M2Q4OC1lYzY5LTQ0OWItODEwMi1jOGYyNjViNzI3MmEiLCJ0ZW5hbnRJZCI6IjkyZGRjYmNhLWQwMTktNGQ0Yy1iMzYwLWMxOWJiNmJiN2Q0OSIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjpbInVzZXJzLm1hbmFnZSIsImNybS53cml0ZSIsImNybS5yZWFkIiwiYW5hbHl0aWNzLnZpZXciLCJkYXRhbGFrZS5yZWFkIiwicm9sZXMubWFuYWdlIl0sImlhdCI6MTc1NTAxNTkyOCwiZXhwIjoxNzU1MDU5MTI4fQ.NL3SXP3nh5YNpTRcYCh01JgvlORKYksI7XrFQAA126Y"

API_BASE="http://localhost:4000/api/ai/chat/stream"

echo "Testing Complex Cross-Table Analytics Queries"
echo "=============================================="
echo

# Test 1: Complex aggregation query
echo "Test 1: Show me total deals by stage and compare across months"
echo "---------------------------------------------------------------"
curl -s "$API_BASE?query=show%20me%20total%20deals%20by%20stage%20and%20compare%20across%20months&token=$TOKEN" 2>/dev/null | head -50
echo
echo

# Test 2: Multi-table join query
echo "Test 2: Compare sales performance across departments with activities"
echo "--------------------------------------------------------------------"
curl -s "$API_BASE?query=compare%20sales%20performance%20across%20departments%20with%20activities&token=$TOKEN" 2>/dev/null | head -50
echo
echo

# Test 3: Visualization request
echo "Test 3: Show me deal distribution by stage as a pie chart"
echo "---------------------------------------------------------"
curl -s "$API_BASE?query=show%20me%20deal%20distribution%20by%20stage%20as%20a%20pie%20chart&token=$TOKEN" 2>/dev/null | head -50
echo
echo

# Test 4: Complex grouping with multiple metrics
echo "Test 4: Analyze deals by owner showing count, total value, and average size"
echo "---------------------------------------------------------------------------"
curl -s "$API_BASE?query=analyze%20deals%20by%20owner%20showing%20count%20total%20value%20and%20average%20size&token=$TOKEN" 2>/dev/null | head -50
echo
echo

# Test 5: Time-based trend analysis
echo "Test 5: Show me monthly revenue trend with breakdown by department"
echo "------------------------------------------------------------------"
curl -s "$API_BASE?query=show%20me%20monthly%20revenue%20trend%20with%20breakdown%20by%20department&token=$TOKEN" 2>/dev/null | head -50
echo
echo

echo "All complex query tests complete!"