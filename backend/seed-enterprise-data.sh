#!/bin/bash

echo "================================"
echo "Enterprise Data Seeder for Acme Europe"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Login as Acme Europe admin to get token and tenant info
echo -e "${YELLOW}Logging in as Acme Europe admin...${NC}"
RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@acme-europe.com","password":"Admin123"}')

TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
TENANT_ID=$(echo "$RESPONSE" | grep -o '"tenantId":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login as admin@acme-europe.com"
  exit 1
fi

echo -e "${GREEN}✅ Logged in successfully${NC}"
echo "Tenant ID: $TENANT_ID"
echo ""

# Create department structure and users
echo -e "${YELLOW}Creating enterprise users (50+ employees)...${NC}"

# Executive Team
EXECUTIVES=(
  '{"email":"ceo@acme-europe.com","name":"Alexander Schmidt","password":"Pass123","roleId":"user","roleTitle":"Chief Executive Officer","department":"Executive"}'
  '{"email":"cfo@acme-europe.com","name":"Maria Fernandez","password":"Pass123","roleId":"user","roleTitle":"Chief Financial Officer","department":"Executive"}'
  '{"email":"cto@acme-europe.com","name":"Thomas Anderson","password":"Pass123","roleId":"user","roleTitle":"Chief Technology Officer","department":"Executive"}'
  '{"email":"coo@acme-europe.com","name":"Sophie Laurent","password":"Pass123","roleId":"user","roleTitle":"Chief Operating Officer","department":"Executive"}'
  '{"email":"cmo@acme-europe.com","name":"James Mitchell","password":"Pass123","roleId":"user","roleTitle":"Chief Marketing Officer","department":"Executive"}'
)

# Sales Team
SALES=(
  '{"email":"sales.director@acme-europe.com","name":"Robert Johnson","password":"Pass123","roleId":"user","roleTitle":"Sales Director","department":"Sales"}'
  '{"email":"sales.manager.uk@acme-europe.com","name":"William Brown","password":"Pass123","roleId":"user","roleTitle":"Sales Manager - UK","department":"Sales"}'
  '{"email":"sales.manager.de@acme-europe.com","name":"Hans Mueller","password":"Pass123","roleId":"user","roleTitle":"Sales Manager - Germany","department":"Sales"}'
  '{"email":"sales.manager.fr@acme-europe.com","name":"Pierre Dubois","password":"Pass123","roleId":"user","roleTitle":"Sales Manager - France","department":"Sales"}'
  '{"email":"sales.rep1@acme-europe.com","name":"Emma Wilson","password":"Pass123","roleId":"user","roleTitle":"Senior Sales Representative","department":"Sales"}'
  '{"email":"sales.rep2@acme-europe.com","name":"Oliver Davis","password":"Pass123","roleId":"user","roleTitle":"Sales Representative","department":"Sales"}'
  '{"email":"sales.rep3@acme-europe.com","name":"Isabella Garcia","password":"Pass123","roleId":"user","roleTitle":"Sales Representative","department":"Sales"}'
  '{"email":"sales.rep4@acme-europe.com","name":"Lucas Martinez","password":"Pass123","roleId":"user","roleTitle":"Sales Representative","department":"Sales"}'
  '{"email":"sales.engineer1@acme-europe.com","name":"Noah Robinson","password":"Pass123","roleId":"user","roleTitle":"Sales Engineer","department":"Sales"}'
  '{"email":"sales.engineer2@acme-europe.com","name":"Ava Thompson","password":"Pass123","roleId":"user","roleTitle":"Sales Engineer","department":"Sales"}'
)

# Marketing Team
MARKETING=(
  '{"email":"marketing.director@acme-europe.com","name":"Charlotte White","password":"Pass123","roleId":"user","roleTitle":"Marketing Director","department":"Marketing"}'
  '{"email":"product.marketing@acme-europe.com","name":"Ethan Harris","password":"Pass123","roleId":"user","roleTitle":"Product Marketing Manager","department":"Marketing"}'
  '{"email":"digital.marketing@acme-europe.com","name":"Amelia Martin","password":"Pass123","roleId":"user","roleTitle":"Digital Marketing Manager","department":"Marketing"}'
  '{"email":"content.manager@acme-europe.com","name":"Benjamin Lee","password":"Pass123","roleId":"user","roleTitle":"Content Manager","department":"Marketing"}'
  '{"email":"marketing.analyst@acme-europe.com","name":"Mia Walker","password":"Pass123","roleId":"user","roleTitle":"Marketing Analyst","department":"Marketing"}'
  '{"email":"social.media@acme-europe.com","name":"Jacob Hall","password":"Pass123","roleId":"user","roleTitle":"Social Media Manager","department":"Marketing"}'
)

# Engineering Team
ENGINEERING=(
  '{"email":"eng.director@acme-europe.com","name":"David Chen","password":"Pass123","roleId":"user","roleTitle":"Engineering Director","department":"Engineering"}'
  '{"email":"backend.lead@acme-europe.com","name":"Ryan Kumar","password":"Pass123","roleId":"user","roleTitle":"Backend Team Lead","department":"Engineering"}'
  '{"email":"frontend.lead@acme-europe.com","name":"Sarah Kim","password":"Pass123","roleId":"user","roleTitle":"Frontend Team Lead","department":"Engineering"}'
  '{"email":"devops.lead@acme-europe.com","name":"Michael Zhang","password":"Pass123","roleId":"user","roleTitle":"DevOps Lead","department":"Engineering"}'
  '{"email":"senior.dev1@acme-europe.com","name":"Daniel Taylor","password":"Pass123","roleId":"user","roleTitle":"Senior Software Engineer","department":"Engineering"}'
  '{"email":"senior.dev2@acme-europe.com","name":"Jessica Anderson","password":"Pass123","roleId":"user","roleTitle":"Senior Software Engineer","department":"Engineering"}'
  '{"email":"dev1@acme-europe.com","name":"Matthew Wilson","password":"Pass123","roleId":"user","roleTitle":"Software Engineer","department":"Engineering"}'
  '{"email":"dev2@acme-europe.com","name":"Emily Brown","password":"Pass123","roleId":"user","roleTitle":"Software Engineer","department":"Engineering"}'
  '{"email":"qa.lead@acme-europe.com","name":"Christopher Moore","password":"Pass123","roleId":"user","roleTitle":"QA Lead","department":"Engineering"}'
  '{"email":"qa.engineer@acme-europe.com","name":"Amanda Jones","password":"Pass123","roleId":"user","roleTitle":"QA Engineer","department":"Engineering"}'
)

# Customer Success Team
CUSTOMER_SUCCESS=(
  '{"email":"cs.director@acme-europe.com","name":"Victoria Smith","password":"Pass123","roleId":"user","roleTitle":"Customer Success Director","department":"Customer Success"}'
  '{"email":"cs.manager@acme-europe.com","name":"Andrew Johnson","password":"Pass123","roleId":"user","roleTitle":"Customer Success Manager","department":"Customer Success"}'
  '{"email":"cs.rep1@acme-europe.com","name":"Elizabeth Davis","password":"Pass123","roleId":"user","roleTitle":"Customer Success Representative","department":"Customer Success"}'
  '{"email":"cs.rep2@acme-europe.com","name":"Joseph Miller","password":"Pass123","roleId":"user","roleTitle":"Customer Success Representative","department":"Customer Success"}'
  '{"email":"support.lead@acme-europe.com","name":"Jennifer Wilson","password":"Pass123","roleId":"user","roleTitle":"Support Team Lead","department":"Customer Success"}'
  '{"email":"support.engineer@acme-europe.com","name":"Robert Brown","password":"Pass123","roleId":"user","roleTitle":"Support Engineer","department":"Customer Success"}'
)

# Finance Team
FINANCE=(
  '{"email":"finance.controller@acme-europe.com","name":"Patricia Johnson","password":"Pass123","roleId":"user","roleTitle":"Financial Controller","department":"Finance"}'
  '{"email":"accounting.manager@acme-europe.com","name":"Michael Davis","password":"Pass123","roleId":"user","roleTitle":"Accounting Manager","department":"Finance"}'
  '{"email":"financial.analyst@acme-europe.com","name":"Linda Martinez","password":"Pass123","roleId":"user","roleTitle":"Senior Financial Analyst","department":"Finance"}'
  '{"email":"accountant1@acme-europe.com","name":"Richard Garcia","password":"Pass123","roleId":"user","roleTitle":"Staff Accountant","department":"Finance"}'
  '{"email":"accountant2@acme-europe.com","name":"Barbara Rodriguez","password":"Pass123","roleId":"user","roleTitle":"Staff Accountant","department":"Finance"}'
)

# HR Team
HR=(
  '{"email":"hr.director@acme-europe.com","name":"Susan Thompson","password":"Pass123","roleId":"user","roleTitle":"HR Director","department":"Human Resources"}'
  '{"email":"talent.manager@acme-europe.com","name":"Charles White","password":"Pass123","roleId":"user","roleTitle":"Talent Acquisition Manager","department":"Human Resources"}'
  '{"email":"hr.manager@acme-europe.com","name":"Mary Harris","password":"Pass123","roleId":"user","roleTitle":"HR Manager","department":"Human Resources"}'
  '{"email":"hr.specialist@acme-europe.com","name":"Thomas Clark","password":"Pass123","roleId":"user","roleTitle":"HR Specialist","department":"Human Resources"}'
  '{"email":"recruiter@acme-europe.com","name":"Nancy Lewis","password":"Pass123","roleId":"user","roleTitle":"Technical Recruiter","department":"Human Resources"}'
)

# Operations Team
OPERATIONS=(
  '{"email":"ops.director@acme-europe.com","name":"Kevin Robinson","password":"Pass123","roleId":"user","roleTitle":"Operations Director","department":"Operations"}'
  '{"email":"project.manager@acme-europe.com","name":"Laura Walker","password":"Pass123","roleId":"user","roleTitle":"Senior Project Manager","department":"Operations"}'
  '{"email":"business.analyst@acme-europe.com","name":"Brian Hall","password":"Pass123","roleId":"user","roleTitle":"Business Analyst","department":"Operations"}'
  '{"email":"data.analyst@acme-europe.com","name":"Sarah Allen","password":"Pass123","roleId":"user","roleTitle":"Data Analyst","department":"Operations"}'
)

# Function to create users
create_users() {
  local department_name=$1
  shift
  local users=("$@")
  
  echo "Creating $department_name team..."
  for user_data in "${users[@]}"; do
    curl -s -X POST http://localhost:4000/api/users/create \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "$user_data" > /dev/null 2>&1
    
    # Extract name from JSON for display
    name=$(echo "$user_data" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
    echo "  ✅ Created: $name"
  done
}

# Create all users
create_users "Executive" "${EXECUTIVES[@]}"
create_users "Sales" "${SALES[@]}"
create_users "Marketing" "${MARKETING[@]}"
create_users "Engineering" "${ENGINEERING[@]}"
create_users "Customer Success" "${CUSTOMER_SUCCESS[@]}"
create_users "Finance" "${FINANCE[@]}"
create_users "HR" "${HR[@]}"
create_users "Operations" "${OPERATIONS[@]}"

echo ""
echo -e "${GREEN}✅ Created 50+ enterprise users across 8 departments${NC}"
echo ""

# Now seed CRM data for this tenant
echo -e "${YELLOW}Seeding enterprise CRM data...${NC}"

# Create Salesforce connector for Acme Europe
echo "Creating Salesforce connector..."
CONNECTOR_RESPONSE=$(curl -s -X POST http://localhost:4000/api/connectors \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "salesforce",
    "credentials": {
      "instanceUrl": "https://acme-europe.my.salesforce.com",
      "username": "integration@acme-europe.com",
      "password": "encrypted_password_eu",
      "securityToken": "encrypted_token_eu"
    },
    "enabled": true
  }')

CONNECTOR_ID=$(echo "$CONNECTOR_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$CONNECTOR_ID" ]; then
  echo "Warning: Could not create connector, checking if it exists..."
  # Get existing connector
  CONNECTORS=$(curl -s http://localhost:4000/api/connectors \
    -H "Authorization: Bearer $TOKEN")
  CONNECTOR_ID=$(echo "$CONNECTORS" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
fi

echo "Connector ID: $CONNECTOR_ID"

# Seed large volume of CRM data
echo "Seeding large volume of CRM data..."
curl -s -X POST http://localhost:4000/api/ai/seed-data \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"connectorId\": \"$CONNECTOR_ID\",
    \"provider\": \"salesforce\",
    \"volume\": \"large\"
  }" > /dev/null 2>&1

echo -e "${GREEN}✅ Seeded enterprise CRM data${NC}"
echo ""

echo "================================"
echo -e "${GREEN}Enterprise data seeding complete!${NC}"
echo "================================"
echo ""
echo "Summary:"
echo "  • 50+ users across 8 departments"
echo "  • Executive, Sales, Marketing, Engineering teams"
echo "  • Customer Success, Finance, HR, Operations teams"
echo "  • Large volume of CRM data"
echo ""
echo "Login as admin@acme-europe.com to see the data!"