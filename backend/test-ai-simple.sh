#!/bin/bash

echo "Testing AI endpoints..."

# Login
echo "1. Logging in..."
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@acme-europe.com","password":"Admin123"}' | \
  grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Test suggestions endpoint
echo "2. Testing /api/ai/suggestions..."
SUGGESTIONS=$(curl -s http://localhost:4000/api/ai/suggestions \
  -H "Authorization: Bearer $TOKEN")

if echo "$SUGGESTIONS" | grep -q "success"; then
  echo "✅ Suggestions endpoint working"
  echo "   Found insights and widgets"
else
  echo "❌ Suggestions endpoint failed"
  echo "$SUGGESTIONS"
fi
echo ""

# Test streaming endpoint
echo "3. Testing /api/ai/chat/stream..."
STREAM=$(curl -s "http://localhost:4000/api/ai/chat/stream?query=hello&token=$TOKEN" \
  -H "Accept: text/event-stream" | head -1)

if echo "$STREAM" | grep -q "data:"; then
  echo "✅ Streaming endpoint working"
  echo "   Response: $STREAM"
else
  echo "❌ Streaming endpoint failed"
  echo "$STREAM"
fi
echo ""

echo "All tests completed!"