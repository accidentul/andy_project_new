#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Creating Test User for Dashboard${NC}"
echo -e "${YELLOW}================================${NC}\n"

BASE="http://localhost:4000/api"

# Generate unique credentials with timestamp to avoid conflicts
TIMESTAMP=$(date +%s)
EMAIL="admin@zamora.com"
PASSWORD="StrongPass123"
COMPANY="Zamora Global"

echo -e "${GREEN}Creating admin user...${NC}"
echo -e "Email: ${YELLOW}$EMAIL${NC}"
echo -e "Password: ${YELLOW}$PASSWORD${NC}"
echo -e "Company: ${YELLOW}$COMPANY${NC}\n"

# Register admin
REGISTER_RESPONSE=$(curl -s -X POST "$BASE/auth/register-admin" \
  -H 'Content-Type: application/json' \
  -d "{
    \"companyName\":\"$COMPANY\",
    \"companySlug\":\"zamora\",
    \"adminEmail\":\"$EMAIL\",
    \"adminName\":\"Admin User\",
    \"adminPassword\":\"$PASSWORD\"
  }")

echo -e "${YELLOW}Registration response:${NC}"
echo "$REGISTER_RESPONSE" | grep -o '{.*}' | head -c 200
echo -e "\n"

# Test login
echo -e "${GREEN}Testing login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ SUCCESS! User created and login working!${NC}\n"
  echo -e "${GREEN}You can now login with:${NC}"
  echo -e "  URL: ${YELLOW}http://localhost:3000/login${NC}"
  echo -e "  Email: ${YELLOW}$EMAIL${NC}"
  echo -e "  Password: ${YELLOW}$PASSWORD${NC}"
  
  # Create a connector for the user
  echo -e "\n${GREEN}Creating Salesforce connector...${NC}"
  CONNECTOR_RESPONSE=$(curl -s -X POST "$BASE/connectors" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{
      "provider":"salesforce",
      "credentials":{
        "clientId":"dummy-client-id",
        "clientSecret":"dummy-secret",
        "refreshToken":"dummy-refresh",
        "instanceUrl":"https://dummy.salesforce.com"
      }
    }')
  
  CONNECTOR_ID=$(echo "$CONNECTOR_RESPONSE" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
  
  if [ -n "$CONNECTOR_ID" ]; then
    echo -e "${GREEN}Connector created: $CONNECTOR_ID${NC}"
    
    # Seed some data
    echo -e "\n${GREEN}Seeding dashboard data...${NC}"
    curl -s -X POST "$BASE/ai/seed" \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{\"connectorId\":\"$CONNECTOR_ID\",\"provider\":\"salesforce\"}" > /dev/null 2>&1
    
    echo -e "${GREEN}Dashboard data seeded!${NC}"
  fi
  
else
  echo -e "${RED}Login failed. Checking if user already exists...${NC}"
  
  # Try with a new email
  NEW_EMAIL="admin${TIMESTAMP}@zamora.com"
  echo -e "\n${YELLOW}Trying with new email: $NEW_EMAIL${NC}"
  
  REGISTER_RESPONSE=$(curl -s -X POST "$BASE/auth/register-admin" \
    -H 'Content-Type: application/json' \
    -d "{
      \"companyName\":\"Zamora Global $TIMESTAMP\",
      \"companySlug\":\"zamora-$TIMESTAMP\",
      \"adminEmail\":\"$NEW_EMAIL\",
      \"adminName\":\"Admin User\",
      \"adminPassword\":\"$PASSWORD\"
    }")
  
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$NEW_EMAIL\",\"password\":\"$PASSWORD\"}")
  
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
  
  if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ SUCCESS with alternate email!${NC}\n"
    echo -e "${GREEN}You can now login with:${NC}"
    echo -e "  URL: ${YELLOW}http://localhost:3000/login${NC}"
    echo -e "  Email: ${YELLOW}$NEW_EMAIL${NC}"
    echo -e "  Password: ${YELLOW}$PASSWORD${NC}"
  else
    echo -e "${RED}Failed to create user. Backend might not be running.${NC}"
    echo -e "${YELLOW}Make sure backend is running: cd backend && npm run start:dev${NC}"
  fi
fi

echo -e "\n${YELLOW}Note: If login still doesn't work, try:${NC}"
echo -e "1. Clear browser cache/cookies"
echo -e "2. Use incognito/private browsing mode"
echo -e "3. Check browser console for errors"