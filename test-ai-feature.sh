#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_BASE="http://localhost:4000/api"

echo -e "${BLUE}🚀 Testing AI Features...${NC}\n"

# Step 1: Register Admin
echo -e "${GREEN}1. Registering admin user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST ${API_BASE}/auth/register-admin \
  -H 'Content-Type: application/json' \
  -d '{
    "companyName": "AI Test Company",
    "companySlug": "ai-test-co",
    "adminEmail": "ceo@aitest.com",
    "adminName": "John CEO",
    "adminPassword": "SecurePass123!"
  }')

echo "Response: $REGISTER_RESPONSE"

# Step 2: Login
echo -e "\n${GREEN}2. Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST ${API_BASE}/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "ceo@aitest.com",
    "password": "SecurePass123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Token obtained: ${TOKEN:0:20}..."

# Step 3: Test AI Chat
echo -e "\n${GREEN}3. Testing AI Chat (CEO perspective)...${NC}"
CHAT_RESPONSE=$(curl -s -X POST ${API_BASE}/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "What are the top 3 strategic priorities I should focus on this quarter as CEO?"
  }')

echo "AI Response:"
echo $CHAT_RESPONSE | python3 -m json.tool 2>/dev/null || echo $CHAT_RESPONSE

# Step 4: Get Suggested Actions
echo -e "\n${GREEN}4. Getting AI Suggested Actions...${NC}"
ACTIONS_RESPONSE=$(curl -s -X GET ${API_BASE}/ai/suggested-actions \
  -H "Authorization: Bearer $TOKEN")

echo "Suggested Actions:"
echo $ACTIONS_RESPONSE | python3 -m json.tool 2>/dev/null || echo $ACTIONS_RESPONSE

# Step 5: Get Available Roles
echo -e "\n${GREEN}5. Getting Available AI Roles...${NC}"
ROLES_RESPONSE=$(curl -s -X GET ${API_BASE}/ai/available-roles \
  -H "Authorization: Bearer $TOKEN")

echo "Available Roles:"
echo $ROLES_RESPONSE | python3 -m json.tool 2>/dev/null || echo $ROLES_RESPONSE

# Step 6: Seed some data
echo -e "\n${GREEN}6. Seeding CRM data...${NC}"
SEED_RESPONSE=$(curl -s -X POST ${API_BASE}/ai/seed-data \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "connectorId": "test-connector",
    "provider": "salesforce",
    "volume": "small"
  }')

echo "Seed Response:"
echo $SEED_RESPONSE | python3 -m json.tool 2>/dev/null || echo $SEED_RESPONSE

# Step 7: Get Widget Suggestions
echo -e "\n${GREEN}7. Getting AI Widget Suggestions...${NC}"
WIDGETS_RESPONSE=$(curl -s -X GET ${API_BASE}/ai/widget-suggestions \
  -H "Authorization: Bearer $TOKEN")

echo "Widget Suggestions:"
echo $WIDGETS_RESPONSE | python3 -m json.tool 2>/dev/null || echo $WIDGETS_RESPONSE

echo -e "\n${BLUE}✅ AI Feature Tests Complete!${NC}"
echo -e "${GREEN}You can now:${NC}"
echo -e "1. Open http://localhost:3000 in your browser"
echo -e "2. Login with: ceo@aitest.com / SecurePass123!"
echo -e "3. Click 'Ask ANDI Anything' button to chat with AI"
echo -e "4. The AI will provide CEO-specific insights!"