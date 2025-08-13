#!/bin/bash

# Script to quickly create a test admin user

echo "Creating test admin user..."

RESPONSE=$(curl -s -X POST http://localhost:4000/auth/register-admin \
  -H 'Content-Type: application/json' \
  -d '{
    "companyName": "Test Company",
    "companySlug": "test",
    "adminEmail": "admin@test.com",
    "adminName": "Test Admin",
    "adminPassword": "Admin123"
  }')

if echo "$RESPONSE" | grep -q "accessToken"; then
    echo "✅ Admin user created successfully!"
    echo ""
    echo "Login credentials:"
    echo "  Email: admin@test.com"
    echo "  Password: Admin123"
    echo ""
    echo "Company: Test Company"
    echo ""
    echo "$RESPONSE" | json_pp 2>/dev/null || echo "$RESPONSE"
elif echo "$RESPONSE" | grep -q "already exists"; then
    echo "⚠️  Admin user already exists"
    echo ""
    echo "Login with:"
    echo "  Email: admin@test.com"
    echo "  Password: Admin123"
else
    echo "❌ Failed to create admin user"
    echo "$RESPONSE"
    exit 1
fi