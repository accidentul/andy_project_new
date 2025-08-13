#!/bin/bash

# Test AI query endpoint with pie chart request

# First, get auth token
echo "Getting auth token..."
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@acme.com","password":"Admin123"}' | \
  grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Failed to get token"
    exit 1
fi

echo "Token obtained successfully"
echo ""
echo "Testing AI query: 'Show me deal distribution by stage as a pie chart'"
echo "==============================================================="
echo ""

# Make streaming request
curl -N -H "Accept: text/event-stream" \
  "http://localhost:4000/api/ai/chat/stream?query=Show%20me%20deal%20distribution%20by%20stage%20as%20a%20pie%20chart&token=$TOKEN" 2>/dev/null | \
  while IFS= read -r line; do
    if [[ $line == data:* ]]; then
      # Extract JSON from SSE data
      json="${line:5}"
      if [ ! -z "$json" ] && [ "$json" != " " ]; then
        # Pretty print the JSON using python
        echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('type') == 'content':
        print(data.get('content', ''))
    elif data.get('type'):
        print(f\"[{data['type']}]\")
except:
    pass
" 2>/dev/null
      fi
    fi
  done