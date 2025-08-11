#!/bin/bash

# Simple AI Feature Test
echo "Testing AI Chat Feature..."

# Login as admin
echo "1. Logging in..."
LOGIN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"Pass12345"}')

TOKEN=$(echo $LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed!"
  exit 1
fi

echo "✓ Login successful"

# Test AI Chat
echo "2. Testing AI Chat..."
RESPONSE=$(curl -s -X POST http://localhost:4000/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"query": "What are my top 3 priorities today?"}')

if echo "$RESPONSE" | grep -q "success.*true"; then
  echo "✓ AI Chat working!"
  echo "Response preview:"
  echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['response']['content'][:200] + '...')" 2>/dev/null
else
  echo "✗ AI Chat failed"
  echo "$RESPONSE"
fi

echo ""
echo "AI Feature Test Complete!"
echo "Access the dashboard at: http://localhost:3000"
echo "Login with: admin@test.com / Pass12345"