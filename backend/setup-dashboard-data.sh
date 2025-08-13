#!/bin/bash

echo "================================"
echo "Setting up Dashboard Data for Acme Europe"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Login
echo -e "${YELLOW}Logging in...${NC}"
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@acme-europe.com","password":"Admin123"}' | \
  grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi

echo -e "${GREEN}✅ Logged in${NC}"

# Create 30 key users (executives and department heads)
echo -e "${YELLOW}Creating key enterprise users...${NC}"

USERS=(
  # Executive Team
  '{"email":"ceo@acme-europe.com","name":"Alexander Schmidt","password":"Pass1234","roleId":"user","roleTitle":"Chief Executive Officer","department":"Executive"}'
  '{"email":"cfo@acme-europe.com","name":"Maria Fernandez","password":"Pass1234","roleId":"user","roleTitle":"Chief Financial Officer","department":"Executive"}'
  '{"email":"cto@acme-europe.com","name":"Thomas Anderson","password":"Pass1234","roleId":"user","roleTitle":"Chief Technology Officer","department":"Executive"}'
  '{"email":"coo@acme-europe.com","name":"Sophie Laurent","password":"Pass1234","roleId":"user","roleTitle":"Chief Operating Officer","department":"Executive"}'
  '{"email":"cmo@acme-europe.com","name":"James Mitchell","password":"Pass1234","roleId":"user","roleTitle":"Chief Marketing Officer","department":"Executive"}'
  
  # Sales Leadership
  '{"email":"sales.director@acme-europe.com","name":"Robert Johnson","password":"Pass1234","roleId":"user","roleTitle":"Sales Director EMEA","department":"Sales"}'
  '{"email":"sales.vp@acme-europe.com","name":"William Brown","password":"Pass1234","roleId":"user","roleTitle":"VP of Sales","department":"Sales"}'
  '{"email":"sales.manager.uk@acme-europe.com","name":"Emma Wilson","password":"Pass1234","roleId":"user","roleTitle":"Sales Manager UK","department":"Sales"}'
  '{"email":"sales.manager.de@acme-europe.com","name":"Hans Mueller","password":"Pass1234","roleId":"user","roleTitle":"Sales Manager Germany","department":"Sales"}'
  '{"email":"sales.manager.fr@acme-europe.com","name":"Pierre Dubois","password":"Pass1234","roleId":"user","roleTitle":"Sales Manager France","department":"Sales"}'
  
  # Marketing Team
  '{"email":"marketing.director@acme-europe.com","name":"Charlotte White","password":"Pass1234","roleId":"user","roleTitle":"Marketing Director","department":"Marketing"}'
  '{"email":"product.marketing@acme-europe.com","name":"Ethan Harris","password":"Pass1234","roleId":"user","roleTitle":"Product Marketing Manager","department":"Marketing"}'
  '{"email":"digital.marketing@acme-europe.com","name":"Amelia Martin","password":"Pass1234","roleId":"user","roleTitle":"Digital Marketing Lead","department":"Marketing"}'
  
  # Engineering Leadership
  '{"email":"eng.director@acme-europe.com","name":"David Chen","password":"Pass1234","roleId":"user","roleTitle":"Engineering Director","department":"Engineering"}'
  '{"email":"backend.lead@acme-europe.com","name":"Ryan Kumar","password":"Pass1234","roleId":"user","roleTitle":"Backend Team Lead","department":"Engineering"}'
  '{"email":"frontend.lead@acme-europe.com","name":"Sarah Kim","password":"Pass1234","roleId":"user","roleTitle":"Frontend Team Lead","department":"Engineering"}'
  '{"email":"devops.lead@acme-europe.com","name":"Michael Zhang","password":"Pass1234","roleId":"user","roleTitle":"DevOps Lead","department":"Engineering"}'
  '{"email":"qa.lead@acme-europe.com","name":"Christopher Moore","password":"Pass1234","roleId":"user","roleTitle":"QA Lead","department":"Engineering"}'
  
  # Customer Success
  '{"email":"cs.director@acme-europe.com","name":"Victoria Smith","password":"Pass1234","roleId":"user","roleTitle":"Customer Success Director","department":"Customer Success"}'
  '{"email":"cs.manager@acme-europe.com","name":"Andrew Johnson","password":"Pass1234","roleId":"user","roleTitle":"Customer Success Manager","department":"Customer Success"}'
  '{"email":"support.lead@acme-europe.com","name":"Jennifer Wilson","password":"Pass1234","roleId":"user","roleTitle":"Support Team Lead","department":"Customer Success"}'
  
  # Finance Team
  '{"email":"finance.controller@acme-europe.com","name":"Patricia Johnson","password":"Pass1234","roleId":"user","roleTitle":"Financial Controller","department":"Finance"}'
  '{"email":"accounting.manager@acme-europe.com","name":"Michael Davis","password":"Pass1234","roleId":"user","roleTitle":"Accounting Manager","department":"Finance"}'
  
  # HR Team
  '{"email":"hr.director@acme-europe.com","name":"Susan Thompson","password":"Pass1234","roleId":"user","roleTitle":"HR Director","department":"Human Resources"}'
  '{"email":"talent.manager@acme-europe.com","name":"Charles White","password":"Pass1234","roleId":"user","roleTitle":"Talent Acquisition Manager","department":"Human Resources"}'
  
  # Operations
  '{"email":"ops.director@acme-europe.com","name":"Kevin Robinson","password":"Pass1234","roleId":"user","roleTitle":"Operations Director","department":"Operations"}'
  '{"email":"project.manager@acme-europe.com","name":"Laura Walker","password":"Pass1234","roleId":"user","roleTitle":"Senior Project Manager","department":"Operations"}'
  '{"email":"data.analyst@acme-europe.com","name":"Brian Hall","password":"Pass1234","roleId":"user","roleTitle":"Senior Data Analyst","department":"Operations"}'
)

COUNT=0
for user_data in "${USERS[@]}"; do
  name=$(echo "$user_data" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
  email=$(echo "$user_data" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
  
  # Check if user exists
  CHECK=$(curl -s http://localhost:4000/api/users/me \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  
  RESPONSE=$(curl -s -X POST http://localhost:4000/api/users/create \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "$user_data" 2>/dev/null)
  
  if echo "$RESPONSE" | grep -q '"id"'; then
    echo "  ✅ $name ($email)"
    COUNT=$((COUNT + 1))
  elif echo "$RESPONSE" | grep -q 'already exists'; then
    echo "  ⚠️  $name already exists"
  else
    echo "  ❌ Failed to create $name"
  fi
done

echo -e "${GREEN}Created/verified $COUNT users${NC}"
echo ""

# Check current data
echo -e "${YELLOW}Checking existing CRM data...${NC}"
CURRENT_DATA=$(sqlite3 data/app.db "
  SELECT 
    (SELECT COUNT(*) FROM crm_accounts WHERE tenantId = '92ddcbca-d019-4d4c-b360-c19bb6bb7d49') as accounts,
    (SELECT COUNT(*) FROM crm_deals WHERE tenantId = '92ddcbca-d019-4d4c-b360-c19bb6bb7d49') as deals;
" 2>/dev/null)

ACCOUNTS=$(echo $CURRENT_DATA | cut -d'|' -f1)
DEALS=$(echo $CURRENT_DATA | cut -d'|' -f2)

echo "  Current accounts: $ACCOUNTS"
echo "  Current deals: $DEALS"

if [ "$ACCOUNTS" -lt 100 ] || [ "$DEALS" -lt 500 ]; then
  echo -e "${YELLOW}Seeding more CRM data...${NC}"
  
  # Check for connector
  CONNECTOR_ID=$(curl -s http://localhost:4000/api/connectors \
    -H "Authorization: Bearer $TOKEN" | \
    grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  
  if [ -z "$CONNECTOR_ID" ]; then
    echo "Creating Salesforce connector..."
    RESPONSE=$(curl -s -X POST http://localhost:4000/api/connectors \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d '{
        "provider": "salesforce",
        "credentials": {
          "instanceUrl": "https://acme-europe.salesforce.com",
          "username": "integration@acme-europe.com",
          "password": "password123",
          "securityToken": "token123"
        }
      }')
    CONNECTOR_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  fi
  
  if [ ! -z "$CONNECTOR_ID" ]; then
    echo "Seeding large CRM dataset..."
    curl -s -X POST http://localhost:4000/api/ai/seed-data \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{\"connectorId\":\"$CONNECTOR_ID\",\"provider\":\"salesforce\",\"volume\":\"large\"}" > /dev/null
    echo -e "${GREEN}✅ CRM data seeded${NC}"
  fi
else
  echo -e "${GREEN}✅ Sufficient CRM data already exists${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}Dashboard data setup complete!${NC}"
echo "================================"
echo ""

# Final data summary
FINAL_DATA=$(sqlite3 data/app.db "
  SELECT 
    (SELECT COUNT(*) FROM users WHERE tenantId = '92ddcbca-d019-4d4c-b360-c19bb6bb7d49') as users,
    (SELECT COUNT(*) FROM crm_accounts WHERE tenantId = '92ddcbca-d019-4d4c-b360-c19bb6bb7d49') as accounts,
    (SELECT COUNT(*) FROM crm_contacts WHERE tenantId = '92ddcbca-d019-4d4c-b360-c19bb6bb7d49') as contacts,
    (SELECT COUNT(*) FROM crm_deals WHERE tenantId = '92ddcbca-d019-4d4c-b360-c19bb6bb7d49') as deals;
" 2>/dev/null)

echo "Data Summary for Acme Europe:"
echo "  • Users: $(echo $FINAL_DATA | cut -d'|' -f1)"
echo "  • CRM Accounts: $(echo $FINAL_DATA | cut -d'|' -f2)"
echo "  • CRM Contacts: $(echo $FINAL_DATA | cut -d'|' -f3)"
echo "  • CRM Deals: $(echo $FINAL_DATA | cut -d'|' -f4)"
echo ""
echo "Login: admin@acme-europe.com / Admin123"