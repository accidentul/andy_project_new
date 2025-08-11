#!/bin/bash

# Backend API URL
BASE="http://localhost:4000/api"

echo "Simple seeding test..."

# Login
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@zamora.com","password":"StrongPass123"}' | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

echo "Token: $TOKEN"

# Get connector
CONNECTOR_ID=$(curl -s -X GET "$BASE/connectors" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')

echo "Connector ID: $CONNECTOR_ID"

# Seed with small volume
echo "Seeding with small volume..."
curl -X POST "$BASE/ai/seed" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"connectorId\":\"$CONNECTOR_ID\",\"provider\":\"salesforce\",\"volume\":\"small\"}" -v