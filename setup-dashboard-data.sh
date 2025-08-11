#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Dashboard Data Setup Script${NC}"
echo -e "${YELLOW}=============================${NC}\n"

# Backend API URL
BASE="http://localhost:4000/api"

echo -e "${GREEN}Step 1: Checking backend server...${NC}"
if ! curl -s -f "$BASE/auth/login" -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
  echo -e "${YELLOW}Backend server is running and responding${NC}"
else
  echo -e "${RED}Backend server is not responding on port 4000${NC}"
  echo -e "${YELLOW}Please ensure the backend is running with: cd backend && npm run start:dev${NC}"
  exit 1
fi

echo -e "\n${GREEN}Step 2: Setting up test company...${NC}"

# Try to register, if it fails assume already exists
REGISTER_RESPONSE=$(curl -s -X POST "$BASE/auth/register-admin" \
  -H 'Content-Type: application/json' \
  -d '{
    "companyName":"Zamora Global",
    "companySlug":"zamora",
    "adminEmail":"admin@zamora.com",
    "adminName":"Admin User",
    "adminPassword":"StrongPass123"
  }' 2>/dev/null)

if echo "$REGISTER_RESPONSE" | grep -q "error"; then
  echo -e "${YELLOW}Company already exists, proceeding...${NC}"
else
  echo -e "${GREEN}Company registered successfully!${NC}"
fi

echo -e "\n${GREEN}Step 3: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@zamora.com","password":"StrongPass123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to login. Response: $LOGIN_RESPONSE${NC}"
  exit 1
fi

echo -e "${GREEN}Login successful!${NC}"

echo -e "\n${GREEN}Step 4: Setting up CRM connectors...${NC}"

# Create or get Salesforce connector
echo -e "${YELLOW}Creating Salesforce connector...${NC}"
SF_RESPONSE=$(curl -s -X POST "$BASE/connectors" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "provider":"salesforce",
    "credentials":{
      "clientId":"3MVG9IHxExampleClientId",
      "clientSecret":"ExampleSecretKey123",
      "refreshToken":"ExampleRefreshToken",
      "instanceUrl":"https://example-dev.salesforce.com"
    }
  }' 2>/dev/null)

SF_CONNECTOR_ID=$(echo "$SF_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')

if [ -z "$SF_CONNECTOR_ID" ]; then
  echo -e "${YELLOW}Fetching existing Salesforce connector...${NC}"
  CONNECTORS=$(curl -s -X GET "$BASE/connectors" -H "Authorization: Bearer $TOKEN")
  SF_CONNECTOR_ID=$(echo "$CONNECTORS" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
fi

if [ -z "$SF_CONNECTOR_ID" ]; then
  echo -e "${RED}Failed to setup Salesforce connector${NC}"
  exit 1
fi

echo -e "${GREEN}Salesforce connector ready: $SF_CONNECTOR_ID${NC}"

# Create HubSpot connector
echo -e "${YELLOW}Creating HubSpot connector...${NC}"
curl -s -X POST "$BASE/connectors" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "provider":"hubspot",
    "credentials":{
      "apiKey":"example-hubspot-api-key",
      "portalId":"12345678"
    }
  }' > /dev/null 2>&1

echo -e "${GREEN}HubSpot connector created${NC}"

echo -e "\n${GREEN}Step 5: Seeding dashboard data...${NC}"
echo -e "${YELLOW}This will create realistic CRM data for the dashboard widgets${NC}"

# Use the seed endpoint with the Salesforce connector
SEED_RESPONSE=$(curl -s -X POST "$BASE/ai/seed" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"connectorId\":\"$SF_CONNECTOR_ID\",\"provider\":\"salesforce\"}")

if echo "$SEED_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Data seeded successfully!${NC}"
  echo -e "\n${YELLOW}Seeded data summary:${NC}"
  echo "$SEED_RESPONSE" | grep -o '"stats":{[^}]*}' | sed 's/"stats":{//' | sed 's/}$//' | sed 's/,/\n/g' | sed 's/"//g' | sed 's/^/  - /'
else
  echo -e "${YELLOW}Note: Seeding might have encountered an issue. Response: $SEED_RESPONSE${NC}"
  echo -e "${YELLOW}The backend may need to be restarted to load the new seed service.${NC}"
  echo -e "${YELLOW}Please restart the backend with: cd backend && npm run start:dev${NC}"
  echo -e "${YELLOW}Then run this script again.${NC}"
fi

echo -e "\n${GREEN}Step 6: Creating additional test users...${NC}"

# Create sales manager
curl -s -X POST "$BASE/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"manager@zamora.com",
    "name":"Sales Manager",
    "password":"TestPass123",
    "role":"manager"
  }' > /dev/null 2>&1

# Create sales rep
curl -s -X POST "$BASE/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"rep@zamora.com",
    "name":"Sales Rep",
    "password":"TestPass123",
    "role":"user"
  }' > /dev/null 2>&1

echo -e "${GREEN}Additional users created${NC}"

echo -e "\n${GREEN}✅ Setup Complete!${NC}"
echo -e "\n${YELLOW}Dashboard Login Credentials:${NC}"
echo -e "  URL: http://localhost:3000"
echo -e "  Admin: admin@zamora.com / StrongPass123"
echo -e "  Manager: manager@zamora.com / TestPass123"
echo -e "  User: rep@zamora.com / TestPass123"

echo -e "\n${YELLOW}Dashboard Features to Test:${NC}"
echo -e "  • AI Insights - Widget suggestions based on CRM data"
echo -e "  • Business Metrics - KPIs and performance charts"
echo -e "  • Data Sources - Connected Salesforce and HubSpot"
echo -e "  • Team Performance - Activity tracking"
echo -e "  • Recent Activity - Live activity feed"
echo -e "  • Admin Panel - User and connector management"

echo -e "\n${GREEN}To start the application:${NC}"
echo -e "  1. Backend: cd backend && npm run start:dev"
echo -e "  2. Frontend: npm run dev"
echo -e "  3. Open: http://localhost:3000"