#!/bin/bash

# Extended seed script - adds more sample data after admin exists

echo "Adding more sample data to existing admin tenant..."

# First login as admin to get token
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"Admin123"}' | \
  grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Failed to login. Make sure admin@test.com exists first."
    echo "Run ./seed-simple.sh to create admin user."
    exit 1
fi

echo "Logged in successfully. Adding users..."

# Add Sales Manager
curl -X POST http://localhost:4000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "sales@test.com",
    "name": "Sales Manager",
    "password": "Pass123",
    "roleId": "user",
    "roleTitle": "Sales Manager",
    "department": "Sales"
  }' | json_pp

# Add Marketing Manager
curl -X POST http://localhost:4000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "marketing@test.com",
    "name": "Marketing Manager",
    "password": "Pass123",
    "roleId": "user",
    "roleTitle": "Marketing Manager",
    "department": "Marketing"
  }' | json_pp

# Add CFO
curl -X POST http://localhost:4000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "cfo@test.com",
    "name": "Chief Financial Officer",
    "password": "Pass123",
    "roleId": "user",
    "roleTitle": "CFO",
    "department": "Finance"
  }' | json_pp

echo ""
echo "Sample users created:"
echo "  sales@test.com / Pass123"
echo "  marketing@test.com / Pass123"
echo "  cfo@test.com / Pass123"