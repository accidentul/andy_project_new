#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Backend API URL
BASE="http://localhost:4000/api"

echo -e "${YELLOW}Starting database seeding process...${NC}"

# Step 1: Register admin user
echo -e "\n${GREEN}Step 1: Registering admin user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE/auth/register-admin" \
  -H 'Content-Type: application/json' \
  -d '{
    "companyName":"Zamora Global",
    "companySlug":"zamora",
    "adminEmail":"admin@zamora.com",
    "adminName":"Admin User",
    "adminPassword":"StrongPass123"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "error"; then
  echo -e "${YELLOW}Admin might already exist, continuing...${NC}"
else
  echo -e "${GREEN}Admin registered successfully!${NC}"
fi

# Step 2: Login and get token
echo -e "\n${GREEN}Step 2: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@zamora.com","password":"StrongPass123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to get token. Make sure the backend is running on port 4000.${NC}"
  exit 1
fi

echo -e "${GREEN}Login successful! Token obtained.${NC}"

# Step 3: Create Salesforce connector
echo -e "\n${GREEN}Step 3: Creating Salesforce connector...${NC}"
CONNECTOR_RESPONSE=$(curl -s -X POST "$BASE/connectors" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "provider":"salesforce",
    "credentials":{
      "clientId":"3MVG9IHxCXR5.fake",
      "clientSecret":"fake_secret_123",
      "refreshToken":"fake_refresh_token",
      "instanceUrl":"https://fake-dev-ed.salesforce.com"
    }
  }')

CONNECTOR_ID=$(echo "$CONNECTOR_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')

if [ -z "$CONNECTOR_ID" ]; then
  # Try to get existing connector
  echo -e "${YELLOW}Connector might exist, fetching existing connectors...${NC}"
  CONNECTORS=$(curl -s -X GET "$BASE/connectors" \
    -H "Authorization: Bearer $TOKEN")
  CONNECTOR_ID=$(echo "$CONNECTORS" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
fi

if [ -z "$CONNECTOR_ID" ]; then
  echo -e "${RED}Failed to create or find connector${NC}"
  exit 1
fi

echo -e "${GREEN}Connector ready! ID: $CONNECTOR_ID${NC}"

# Step 4: Seed comprehensive CRM data
echo -e "\n${GREEN}Step 4: Seeding comprehensive CRM data...${NC}"
echo -e "${YELLOW}This will create:${NC}"
echo -e "  - 500 accounts"
echo -e "  - 4000 contacts"
echo -e "  - 3000 deals"
echo -e "  - 2 years of activity history"
echo -e "  - 50-200 activities per day"

SEED_RESPONSE=$(curl -s -X POST "$BASE/ai/seed" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"connectorId\":\"$CONNECTOR_ID\",\"provider\":\"salesforce\",\"volume\":\"large\",\"accounts\":500,\"contacts\":4000,\"deals\":3000,\"activityDays\":730,\"minActivitiesPerDay\":50,\"maxActivitiesPerDay\":200}")

if echo "$SEED_RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}Data seeded successfully!${NC}"
else
  echo -e "${RED}Failed to seed data: $SEED_RESPONSE${NC}"
  exit 1
fi

# Step 5: Create additional users for testing
echo -e "\n${GREEN}Step 5: Creating additional test users...${NC}"

# Create sales manager
curl -s -X POST "$BASE/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"sales.manager@zamora.com",
    "name":"Sales Manager",
    "password":"TestPass123",
    "role":"manager"
  }' > /dev/null

# Create sales rep
curl -s -X POST "$BASE/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"sales.rep@zamora.com",
    "name":"Sales Representative",
    "password":"TestPass123",
    "role":"user"
  }' > /dev/null

echo -e "${GREEN}Additional users created!${NC}"

# Step 6: Create HubSpot connector for diversity
echo -e "\n${GREEN}Step 6: Creating HubSpot connector...${NC}"
curl -s -X POST "$BASE/connectors" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "provider":"hubspot",
    "credentials":{
      "apiKey":"fake-hubspot-api-key-123456",
      "portalId":"12345678"
    }
  }' > /dev/null

echo -e "${GREEN}HubSpot connector created!${NC}"

echo -e "\n${GREEN}✅ Database seeding complete!${NC}"
echo -e "\n${YELLOW}You can now login to the dashboard with:${NC}"
echo -e "  Email: admin@zamora.com"
echo -e "  Password: StrongPass123"
echo -e "\n${YELLOW}Additional test users:${NC}"
echo -e "  sales.manager@zamora.com / TestPass123"
echo -e "  sales.rep@zamora.com / TestPass123"
echo -e "\n${GREEN}The dashboard should now display:${NC}"
echo -e "  - AI Insights with suggestions"
echo -e "  - Business Metrics with real data"
echo -e "  - Data Sources showing Salesforce and HubSpot"
echo -e "  - Team Performance metrics"
echo -e "  - Recent Activity feed"