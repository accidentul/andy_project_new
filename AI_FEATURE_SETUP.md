# Adaptive Intelligence Layer - Setup Guide

## Overview
The Adaptive Intelligence Layer provides role-based AI agents that deliver personalized insights, automated actions, and predictive analytics tailored to each user's specific responsibilities.

## Prerequisites

1. **OpenAI API Key**: Required for GPT-4 integration
2. **Redis**: Required for conversation memory (included in docker-compose)
3. **Node.js 18+**: For running the application

## Quick Start

### 1. Environment Setup

Create a `.env` file in the backend directory:

```bash
# Backend environment variables
JWT_SECRET=your-secret-key-here
CREDENTIALS_ENCRYPTION_KEY=32-character-encryption-key-here
DATABASE_PATH=./data/app.db
OPENAI_API_KEY=sk-your-openai-api-key-here
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. Using Docker (Recommended)

```bash
# Start all services including Redis
docker-compose up

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
```

### 3. Local Development

```bash
# Start Redis (required)
docker run -d -p 6379:6379 redis:7-alpine

# Backend
cd backend
npm install
npm run start:dev

# Frontend (in another terminal)
cd ..
npm install
npm run dev
```

## AI Features

### Role-Specific Agents

The system includes specialized AI agents for different roles:

- **CEO Agent**: Strategic insights, board reporting, M&A opportunities
- **CFO Agent**: Financial planning, cash flow optimization, budget analysis
- **Sales Manager**: Pipeline optimization, deal coaching, lead prioritization
- **Marketing Manager**: Campaign optimization, content strategy, lead nurturing
- **Operations Manager**: Process optimization, supply chain, capacity planning
- **HR Manager**: Talent insights, retention strategies, engagement programs

### API Endpoints

#### Chat with AI Assistant
```bash
POST /ai/chat
Authorization: Bearer <token>
{
  "query": "What are my top priorities today?",
  "conversationId": "optional-conversation-id"
}
```

#### Get Suggested Actions
```bash
GET /ai/suggested-actions
Authorization: Bearer <token>
```

#### Clear Conversation
```bash
DELETE /ai/conversation/:id
Authorization: Bearer <token>
```

## Testing the AI Features

### 1. Create a Test User with Role

```bash
# First register an admin
curl -X POST http://localhost:4000/auth/register-admin \
  -H 'Content-Type: application/json' \
  -d '{
    "companyName": "Test Corp",
    "companySlug": "test-corp",
    "adminEmail": "admin@test.com",
    "adminName": "Admin User",
    "adminPassword": "Pass123!"
  }'

# Login to get token
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@test.com",
    "password": "Pass123!"
  }'

# Use the token to create a sales manager
curl -X POST http://localhost:4000/users \
  -H 'Authorization: Bearer <admin-token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "sales@test.com",
    "name": "Sales Manager",
    "password": "Pass123!",
    "roleTitle": "Sales Manager",
    "department": "Sales"
  }'
```

### 2. Test AI Chat

```bash
# Login as the sales manager
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "sales@test.com",
    "password": "Pass123!"
  }'

# Chat with AI (will get sales-specific insights)
curl -X POST http://localhost:4000/ai/chat \
  -H 'Authorization: Bearer <sales-token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "What should I focus on to close more deals this quarter?"
  }'
```

### 3. Seed Sample Data

```bash
# Seed CRM data for testing
curl -X POST http://localhost:4000/ai/seed-data \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "connectorId": "test-connector",
    "provider": "salesforce",
    "volume": "medium"
  }'
```

## Frontend Integration

The enhanced Ask Andi component (`ask-andi-enhanced.tsx`) provides:

- **Role-aware responses**: Tailored insights based on user's role
- **Suggested actions**: Proactive recommendations with execution capability
- **File upload**: Analyze documents and reports
- **Voice input**: Speech-to-text for natural interaction
- **Action execution**: Execute automated workflows with approval flow

## Configuration Options

### Adjusting AI Behavior

You can customize agent behavior by modifying the system prompts in:
- `backend/src/ai/agents/ceo.agent.ts`
- `backend/src/ai/agents/cfo.agent.ts`
- `backend/src/ai/agents/sales.agent.ts`
- etc.

### Redis Configuration

For production, configure Redis with persistence:

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --appendfsync everysec
  volumes:
    - redis_data:/data
```

### OpenAI Model Selection

To use different models, update in `base.agent.ts`:

```typescript
this.llm = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo' for lower cost
  temperature: 0.7,
})
```

## Troubleshooting

### Common Issues

1. **"OpenAI API key not found"**
   - Ensure `OPENAI_API_KEY` is set in your environment

2. **"Redis connection failed"**
   - Check Redis is running: `docker ps | grep redis`
   - Verify Redis connection settings in `.env`

3. **"Agent not found for role"**
   - Ensure user has `roleTitle` and/or `department` set
   - Check available roles: `GET /ai/available-roles`

### Running Tests

```bash
cd backend
npm run test:e2e -- ai.e2e-spec.ts
```

## Cost Considerations

- **OpenAI API**: ~$0.01-0.03 per chat interaction with GPT-4
- **Redis**: Minimal cost, can use free tier for development
- **Recommendation**: Start with GPT-3.5-turbo for development/testing

## Security Notes

- Never commit `.env` files with API keys
- Use environment-specific keys (dev/staging/prod)
- Implement rate limiting for production
- Consider caching frequent queries to reduce API costs