#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}andi Backend - Database Seeder${NC}"
echo -e "${GREEN}==================================${NC}"

# Check if we're in the backend directory
if [ ! -f "package.json" ] || [ ! -f "nest-cli.json" ]; then
    echo -e "${RED}Error: Please run this script from the backend directory${NC}"
    exit 1
fi

# Parse command line arguments
FRESH_SEED=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --fresh)
            FRESH_SEED=true
            shift
            ;;
        --help)
            echo "Usage: ./seed-database.sh [options]"
            echo ""
            echo "Options:"
            echo "  --fresh    Delete existing database before seeding"
            echo "  --help     Show this help message"
            echo ""
            echo "The script will create:"
            echo "  - Admin user (admin@acme.com / Admin123)"
            echo "  - Department users (CFO, Sales, Marketing, Operations, HR)"
            echo "  - CRM connectors (Salesforce, HubSpot)"
            echo "  - Sample CRM data"
            echo "  - Subsidiary companies"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Run seed based on mode
if [ "$FRESH_SEED" = true ]; then
    echo -e "${YELLOW}Running fresh seed (deleting existing data)...${NC}"
    npm run seed:fresh
else
    echo -e "${YELLOW}Running seed (preserving existing data)...${NC}"
    npm run seed
fi

# Check exit status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}==================================${NC}"
    echo -e "${GREEN}✅ Database seeded successfully!${NC}"
    echo -e "${GREEN}==================================${NC}"
    echo ""
    echo "You can now login with:"
    echo "  Admin: admin@acme.com / Admin123"
    echo "  CFO: cfo@acme.com / Pass123"
    echo "  Sales Manager: sales.manager@acme.com / Pass123"
    echo "  Marketing Manager: marketing.manager@acme.com / Pass123"
    echo "  Operations Manager: ops.manager@acme.com / Pass123"
    echo "  HR Manager: hr.manager@acme.com / Pass123"
    echo ""
    echo "Start the dev server with: npm run dev"
else
    echo -e "${RED}==================================${NC}"
    echo -e "${RED}❌ Seed failed! Check the logs above.${NC}"
    echo -e "${RED}==================================${NC}"
    exit 1
fi