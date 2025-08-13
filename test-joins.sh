#!/bin/bash

echo "Testing JOIN Query Generation"
echo "=============================="
echo ""

# Get token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zamora.com", "password": "StrongPass123"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Test queries that should generate JOINs
QUERIES=(
  "Show deals with account names"
  "List all deals and their customer names" 
  "Get deals including account information"
  "Revenue by account industry"
  "Show me deals and contacts"
)

for query in "${QUERIES[@]}"; do
  echo "Testing: $query"
  echo "----------------------------------------"
  
  RESPONSE=$(curl -s -X POST http://localhost:4000/api/ai/tools/execute \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"toolName\": \"dynamic_analytics\",
      \"params\": {
        \"query\": \"$query\"
      }
    }")
  
  # Extract SQL and check for JOIN
  echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'query' in data['data']:
        sql = data['data']['query'].get('sql', '')
        print('Generated SQL:')
        print(sql[:300])
        if 'JOIN' in sql.upper():
            print('✓ JOIN found in SQL')
        else:
            print('✗ No JOIN in SQL')
        
        # Show tables used
        if 'summary' in data['data']:
            print(f\"Tables: {data['data']['summary'].get('tablesUsed', [])}\")
except Exception as e:
    print(f'Error: {e}')
" 2>&1
  
  echo ""
done