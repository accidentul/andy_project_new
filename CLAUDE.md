# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack enterprise dashboard application called "andi" (Adaptive Neural Data Intelligence) with:
- **Frontend**: Next.js 15 with App Router, React 19, Radix UI, Tailwind CSS
- **Backend**: NestJS with TypeScript, SQLite/TypeORM, JWT authentication
- **Architecture**: Multi-tenant SaaS with role-based access control (RBAC)

## Development Commands

### Frontend (root directory)
```bash
npm run dev         # Start Next.js dev server (port 3000)
npm run build       # Build for production
npm run lint        # Run ESLint
npm start           # Start production server
```

### Backend (`backend/` directory)
```bash
npm run start:dev   # Start NestJS dev server with watch mode (port 4000)
npm run build       # Build TypeScript to JavaScript
npm run start:prod  # Start production server
npm run test:e2e    # Run comprehensive e2e tests
npm run test        # Run unit tests
npm run lint        # Run ESLint
```

### Docker Deployment
```bash
docker-compose up   # Start full stack with Docker
```

## Testing Approach

### Backend Testing
- **Framework**: Jest with ts-jest, supertest for e2e
- **Database**: In-memory SQLite for test isolation
- **Run single test**: `npm test -- path/to/test.spec.ts`
- **Watch mode**: `npm run test:watch`
- **E2E tests**: Located in `backend/test/` - comprehensive API testing

### Frontend Testing
- TypeScript compilation and ESLint validation
- No explicit test framework currently configured

## Architecture & Key Patterns

### Multi-Tenant Architecture
- Each company has a `tenantId` for data isolation
- Company hierarchy: parent companies can have subsidiaries
- JWT tokens include tenant context

### API Structure
- **Base URL**: Environment variable `NEXT_PUBLIC_API_BASE_URL` (default: http://localhost:4000)
- **Authentication**: JWT Bearer tokens in Authorization header
- **Endpoints**:
  - `/auth/*` - Authentication (login, register-admin)
  - `/users/*` - User management (CRUD operations)
  - `/connectors/*` - CRM connector management
  - `/ai/*` - AI services and data seeding

### Frontend Architecture
- **Main Dashboard**: `app/page.tsx` - section-based modular navigation
- **Sections**: Each business area (AI Insights, Business Metrics, etc.) in `app/sections/`
- **Components**: Reusable UI in `app/components/`, shadcn/ui in `components/ui/`
- **API Client**: `lib/api.ts` - centralized API communication with auth handling

### Backend Module Structure
- **Auth Module**: JWT authentication, multi-tenant registration
- **Users Module**: User CRUD with role/permission management
- **Connectors Module**: CRM integrations (Salesforce, HubSpot)
- **AI Module**: AI agents with tool calling using Vercel AI SDK, real action execution, and data seeding

### Database Schema
- **Users**: Multi-tenant users with roles and permissions
- **Companies**: Tenant management with parent-child relationships
- **Connectors**: Encrypted credential storage for integrations
- **Automatic sync**: TypeORM synchronize enabled in development

## Environment Configuration

### Required Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# Backend (.env)
JWT_SECRET=your-secret-key
CREDENTIALS_ENCRYPTION_KEY=32-char-key
DATABASE_PATH=./data/app.db
```

## Common Development Tasks

### Adding a New API Endpoint
1. Create service method in appropriate NestJS module
2. Add controller route with proper decorators
3. Update frontend API client in `lib/api.ts`
4. Add TypeScript types for request/response

### Running with Seeded Data
```bash
# 1. Start backend
cd backend && npm run start:dev

# 2. Register admin and seed data via API
curl -X POST http://localhost:4000/auth/register-admin -H 'Content-Type: application/json' -d '{"companyName":"Test","companySlug":"test","adminEmail":"admin@test.com","adminName":"Admin","adminPassword":"Pass123"}'

# 3. Login and use returned token for authenticated requests
```

### Debugging Tips
- Backend logs: Check NestJS console output for detailed error messages
- Frontend API errors: Network tab shows full request/response
- Database issues: SQLite database file at `backend/data/app.db`
- Test failures: Run with `--verbose` flag for detailed output

## Key Files to Understand

- `backend/src/app.module.ts` - Root module configuration and database setup
- `app/dashboard-content.tsx` - Main dashboard component with section routing
- `lib/api.ts` - Frontend API client with auth handling
- `backend/test/app.e2e-spec.ts` - Comprehensive API test examples
- `docker-compose.yml` - Production deployment configuration

## CRITICAL DEVELOPMENT RULES

### 1. Always Build Real Implementations
- **NO mock/stub/fake data** in production code - implement real services with actual data persistence
- If external service unavailable, create minimal real local alternative (e.g., SQLite, filesystem)
- Never hardcode sample responses - wire actual data flows end-to-end

### 2. Strict API-First Workflow (MUST follow this order)
1. **First**: Implement API feature in NestJS backend (controllers/services/entities with real persistence)
2. **Second**: Create tests for the API feature immediately after implementation
3. **Third**: Only then implement frontend if needed, consuming the real API

### 3. Dedicated Backend Architecture
- All business logic and data persistence in NestJS backend only
- Next.js is pure frontend - consumes NestJS API via HTTP
- Use `NEXT_PUBLIC_API_BASE_URL` environment variable - never hardcode URLs
- Do NOT add server routes under `app/api/**` - call NestJS directly
- Define shared DTOs/schemas between frontend and backend

### 4. Tests Are MANDATORY
- **Every feature MUST have tests** - no exceptions
- Add tests in the same changeset as the feature
- Prefer integration/e2e tests for API endpoints
- Use real test databases (in-memory SQLite) - no mocking
- Include validation and error-path tests, not just happy paths

### 5. Quality Requirements
- Strong typing with TypeScript everywhere
- Input validation using class-validator/Zod for all requests
- NO TODOs or commented-out code
- Meaningful error handling with proper HTTP status codes
- No placeholder data in UI - only real API data

### 6. Data and Security
- Never commit secrets - use environment variables
- Document all required environment variables
- Seed scripts only for local/dev behind explicit commands

### 7. Frontend Constraints
- UI must consume real API data from NestJS backend
- Loading states use skeletons/spinners, but content from real API
- No mock data in components

### 8. Process Enforcement
- If tests/API missing for a feature, implement API first, then tests, then UI
- If tooling missing (e.g., test runner), set it up before proceeding
- Never skip tests even for small changes

### 9. Version Control Policy
- After feature complete and tests pass: commit with concise "why" message
- Never commit secrets or .env files
- No empty commits - fix failures before committing
- Each commit should represent a working state

### 10. Deliverables Per Feature
- ✅ Backend implementation in NestJS with real data access
- ✅ Tests for backend API (unit + integration/e2e)
- ✅ Frontend integration (if required) wired to real backend
- ✅ Documentation for new env vars or scripts

## AI Agent & Tool System

### Architecture Overview
The application uses **Vercel AI SDK** with custom tools and agents for AI functionality:
- **Framework**: Vercel AI SDK (`ai` package) with OpenAI provider
- **Tool System**: Custom tool framework with Zod validation
- **Agents**: Role-based agents (CFO, Sales, Marketing, Operations, HR)
- **Function Calling**: Native OpenAI function calling via Vercel AI SDK

### Key Components
- `src/ai/tools/base.tool.ts` - Base tool class with validation
- `src/ai/tools/tool-registry.ts` - Tool management and role-based access
- `src/ai/ai-agent.service.ts` - Agent orchestration with tools
- `src/ai/agents/*.agent.ts` - Role-specific agent implementations

### Available API Endpoints
- `POST /api/ai/chat/agent` - Chat with agent using tools
- `GET /api/ai/tools/available` - Get tools for user's role
- `POST /api/ai/tools/execute` - Execute a specific tool
- `GET /api/ai/agents/available` - List available agents

### Tool Categories
1. **CRM Tools**: Account/deal/activity management, pipeline analysis
2. **Business Tools**: Report generation, meeting scheduling, email automation
3. **Analytics Tools**: Data analysis, forecasting, anomaly detection

### Adding New Tools
1. Create tool class extending `BaseTool` in `src/ai/tools/`
2. Define Zod schema for parameters
3. Implement `execute()` method with real data operations
4. Register in `ToolRegistry.initializeTools()`
5. Configure role access in `ToolRegistry.configureRoleAccess()`

### Important Notes
- **NO LangChain** due to TypeScript compilation issues
- Tools perform REAL actions with database operations
- Role-based tool access control enforced
- All tools use Zod for runtime validation
- Streaming responses supported via Server-Sent Events

## AI Insights Engine & Widget Generation

### CRITICAL: Always Use AI-Enhanced Query System
**⚠️ MANDATORY**: All widget generation and dashboard queries MUST use the AI-enhanced query system via `WidgetGenerationService.generateWidgetFromQuery()`. This is the ONLY system that works correctly.

**❌ NEVER use**:
- Hardcoded SQL queries in widgets
- Direct database queries without AI planning
- Sample/mock data for widgets
- Bypassing the AI query planner

**✅ ALWAYS use**:
- `WidgetGenerationService.generateWidgetFromQuery(naturalLanguageQuery, tenantId, userId)`
- AI query planner for all data visualization needs
- Real database data through the AI-enhanced pipeline
- Proper {x,y} data format transformation

### Widget Generation Architecture
The AI Insights Engine uses a complete pipeline:
1. **Natural Language Input** → `AIQueryPlannerService`
2. **Query Planning** → SQL generation with tenant isolation
3. **Data Retrieval** → Real database queries
4. **Data Transformation** → Proper {x,y} format for charts
5. **Visualization Rendering** → Recharts components

### Example Usage
```typescript
// ✅ CORRECT - Always use AI-enhanced queries
const widget = await this.widgetService.generateWidgetFromQuery(
  'Monthly revenue trend for last 6 months',
  tenantId,
  userId
)

// ❌ WRONG - Never use hardcoded queries
// const hardcodedWidget = await this.generateHardcodedWidget()
```