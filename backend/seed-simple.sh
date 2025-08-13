#!/bin/bash

# Quick seed script - just creates admin user
echo "Creating admin user only..."

curl -X POST http://localhost:4000/auth/register-admin \
  -H 'Content-Type: application/json' \
  -d '{
    "companyName": "Test Company",
    "companySlug": "test",
    "adminEmail": "admin@test.com",
    "adminName": "Admin User",
    "adminPassword": "Admin123"
  }' | json_pp

echo ""
echo "Admin created: admin@test.com / Admin123"