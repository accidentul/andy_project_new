#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Seeding Additional Dashboard Data${NC}"
echo -e "${YELLOW}==================================${NC}\n"

BASE="http://localhost:4000/api"

# Login to get token
echo -e "${GREEN}Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@zamora.com","password":"StrongPass123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to login. Make sure the user exists.${NC}"
  exit 1
fi

echo -e "${GREEN}Login successful!${NC}\n"

# Get existing connector or create one
echo -e "${GREEN}Checking connectors...${NC}"
CONNECTORS=$(curl -s -X GET "$BASE/connectors" -H "Authorization: Bearer $TOKEN")
CONNECTOR_ID=$(echo "$CONNECTORS" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')

if [ -z "$CONNECTOR_ID" ]; then
  echo -e "${YELLOW}Creating new Salesforce connector...${NC}"
  CONNECTOR_RESPONSE=$(curl -s -X POST "$BASE/connectors" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{
      "provider":"salesforce",
      "credentials":{
        "clientId":"sf-client-id",
        "clientSecret":"sf-secret",
        "refreshToken":"sf-refresh",
        "instanceUrl":"https://demo.salesforce.com"
      }
    }')
  CONNECTOR_ID=$(echo "$CONNECTOR_RESPONSE" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
fi

echo -e "${GREEN}Using connector: $CONNECTOR_ID${NC}\n"

# Seed comprehensive data
echo -e "${GREEN}Seeding comprehensive CRM data...${NC}"
echo -e "${YELLOW}This will create:${NC}"
echo -e "  • 15 company accounts (Technology, Finance, Healthcare, etc.)"
echo -e "  • 50 contacts with full details"
echo -e "  • 30 deals in various stages"
echo -e "  • 250+ activities over 30 days"
echo -e "  • Performance metrics and KPIs\n"

SEED_RESPONSE=$(curl -s -X POST "$BASE/ai/seed" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"connectorId\":\"$CONNECTOR_ID\",\"provider\":\"salesforce\"}")

echo -e "${GREEN}Seed response:${NC}"
echo "$SEED_RESPONSE" | head -c 300

# Create additional users for team performance widget
echo -e "\n\n${GREEN}Creating team members...${NC}"

curl -s -X POST "$BASE/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"john.smith@zamora.com",
    "name":"John Smith",
    "password":"TestPass123",
    "role":"user"
  }' > /dev/null 2>&1

curl -s -X POST "$BASE/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"sarah.jones@zamora.com",
    "name":"Sarah Jones",
    "password":"TestPass123",
    "role":"user"
  }' > /dev/null 2>&1

curl -s -X POST "$BASE/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"mike.wilson@zamora.com",
    "name":"Mike Wilson",
    "password":"TestPass123",
    "role":"manager"
  }' > /dev/null 2>&1

echo -e "${GREEN}Team members created${NC}"

# Create HubSpot connector for diversity
echo -e "\n${GREEN}Creating HubSpot connector...${NC}"
curl -s -X POST "$BASE/connectors" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "provider":"hubspot",
    "credentials":{
      "apiKey":"hubspot-api-key-demo",
      "portalId":"87654321"
    }
  }' > /dev/null 2>&1

echo -e "${GREEN}HubSpot connector created${NC}"

# Check the data
echo -e "\n${GREEN}Verifying data...${NC}"
SUGGESTIONS=$(curl -s -X GET "$BASE/ai/suggestions" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${YELLOW}AI Suggestions available:${NC}"
echo "$SUGGESTIONS" | grep -o '"title":"[^"]*"' | head -5

echo -e "\n${GREEN}✅ Data seeding complete!${NC}"
echo -e "\n${YELLOW}Dashboard should now display:${NC}"
echo -e "  • ${GREEN}AI Insights${NC} - Widget suggestions with real data"
echo -e "  • ${GREEN}Business Metrics${NC} - KPIs, pipeline, win/loss ratio"
echo -e "  • ${GREEN}Data Sources${NC} - Salesforce & HubSpot connectors"
echo -e "  • ${GREEN}Team Performance${NC} - User activity metrics"
echo -e "  • ${GREEN}Recent Activity${NC} - 30 days of CRM activities"
echo -e "  • ${GREEN}Dashboard Overview${NC} - Charts and visualizations"

echo -e "\n${YELLOW}Key Metrics Seeded:${NC}"
echo -e "  • Total Pipeline: ~\$8.3M across 30 deals"
echo -e "  • Win/Loss Ratio: 50%"
echo -e "  • Activities: 250+ over last 30 days"
echo -e "  • Accounts: 15 companies"
echo -e "  • Contacts: 50 individuals"

echo -e "\n${GREEN}Login and check the dashboard:${NC}"
echo -e "  URL: ${YELLOW}http://localhost:3000${NC}"
echo -e "  Email: ${YELLOW}admin@zamora.com${NC}"
echo -e "  Password: ${YELLOW}StrongPass123${NC}"