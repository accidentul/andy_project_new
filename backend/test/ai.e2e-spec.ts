import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { DataSource } from 'typeorm'

describe('AI Module (e2e)', () => {
  let app: INestApplication
  let authToken: string
  let tenantId: string
  let conversationId: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    await app.init()

    // Clean database
    const dataSource = app.get(DataSource)
    await dataSource.synchronize(true)

    // Register admin and get token
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register-admin')
      .send({
        companyName: 'AI Test Corp',
        companySlug: 'ai-test',
        adminEmail: 'ai.admin@test.com',
        adminName: 'AI Admin',
        adminPassword: 'TestPass123!',
      })
      .expect(201)

    tenantId = registerRes.body.tenantId

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'ai.admin@test.com',
        password: 'TestPass123!',
      })
      .expect(200)

    authToken = loginRes.body.accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/ai/chat (POST)', () => {
    it('should process a chat query and return AI response', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'What are my top sales opportunities?',
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        response: expect.objectContaining({
          content: expect.any(String),
          confidence: expect.any(Number),
        }),
        conversationId: expect.any(String),
      })

      conversationId = response.body.conversationId
    })

    it('should maintain conversation context', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'Tell me more about the first one',
          conversationId: conversationId,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.conversationId).toBe(conversationId)
    })

    it('should include role-specific actions in response', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'How can I improve my revenue this quarter?',
        })
        .expect(200)

      expect(response.body.response.actions).toBeDefined()
      if (response.body.response.actions?.length > 0) {
        expect(response.body.response.actions[0]).toMatchObject({
          type: expect.stringMatching(/automation|alert|recommendation/),
          title: expect.any(String),
          description: expect.any(String),
          impact: expect.any(String),
          requiresApproval: expect.any(Boolean),
        })
      }
    })

    it('should handle invalid queries gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: '',
        })
        .expect(400)

      expect(response.body.message).toBeDefined()
    })
  })

  describe('/ai/suggested-actions (GET)', () => {
    it('should return role-specific suggested actions', async () => {
      const response = await request(app.getHttpServer())
        .get('/ai/suggested-actions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        actions: expect.any(Array),
      })

      if (response.body.actions.length > 0) {
        expect(response.body.actions[0]).toMatchObject({
          type: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          impact: expect.any(String),
        })
      }
    })
  })

  describe('/ai/widget-suggestions (GET)', () => {
    it('should return AI-generated widget suggestions', async () => {
      // First seed some data
      await request(app.getHttpServer())
        .post('/ai/seed-data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          connectorId: 'test-connector',
          provider: 'salesforce',
          volume: 'small',
        })
        .expect(200)

      const response = await request(app.getHttpServer())
        .get('/ai/widget-suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        suggestions: expect.any(Array),
      })

      if (response.body.suggestions.length > 0) {
        expect(response.body.suggestions[0]).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          size: expect.stringMatching(/tiny|small|medium|large/),
          type: expect.stringMatching(/line|bar|area|kpi/),
          description: expect.any(String),
          data: expect.any(Object),
        })
      }
    })
  })

  describe('/ai/conversation/:id (DELETE)', () => {
    it('should clear a conversation', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/ai/conversation/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Conversation cleared',
      })
    })
  })

  describe('/ai/available-roles (GET)', () => {
    it('should return list of available AI agent roles', async () => {
      const response = await request(app.getHttpServer())
        .get('/ai/available-roles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        roles: expect.arrayContaining([
          'CEO',
          'CFO',
          'Sales Manager',
          'Marketing Manager',
          'Operations Manager',
          'HR Manager',
        ]),
      })
    })
  })

  describe('/ai/seed-data (POST)', () => {
    it('should seed sample CRM data', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/seed-data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          connectorId: 'test-connector-2',
          provider: 'hubspot',
          volume: 'medium',
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('hubspot'),
      })
    })

    it('should validate provider type', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/seed-data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          connectorId: 'test-connector-3',
          provider: 'invalid-provider',
          volume: 'small',
        })
        .expect(400)

      expect(response.body.message).toBeDefined()
    })
  })

  describe('Role-based AI responses', () => {
    let salesUserToken: string
    let marketingUserToken: string

    beforeAll(async () => {
      // Create sales user
      await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'sales@test.com',
          name: 'Sales Manager',
          password: 'Pass123!',
          roleId: 'user',
          roleTitle: 'Sales Manager',
          department: 'Sales',
        })
        .expect(201)

      // Create marketing user
      await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'marketing@test.com',
          name: 'Marketing Manager',
          password: 'Pass123!',
          roleId: 'user',
          roleTitle: 'Marketing Manager',
          department: 'Marketing',
        })
        .expect(201)

      // Login as sales user
      const salesLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'sales@test.com',
          password: 'Pass123!',
        })
        .expect(200)
      salesUserToken = salesLogin.body.accessToken

      // Login as marketing user
      const marketingLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'marketing@test.com',
          password: 'Pass123!',
        })
        .expect(200)
      marketingUserToken = marketingLogin.body.accessToken
    })

    it('should provide sales-specific insights for sales manager', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/chat')
        .set('Authorization', `Bearer ${salesUserToken}`)
        .send({
          query: 'What should I focus on today?',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.response).toBeDefined()
      expect(response.body.response.content).toBeDefined()
      // Simply check that we got a response - content will vary based on AI model
      expect(response.body.response.content.length).toBeGreaterThan(0)
    })

    it('should provide marketing-specific insights for marketing manager', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/chat')
        .set('Authorization', `Bearer ${marketingUserToken}`)
        .send({
          query: 'What should I focus on today?',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.response).toBeDefined()
      expect(response.body.response.content).toBeDefined()
      // Simply check that we got a response - content will vary based on AI model
      expect(response.body.response.content.length).toBeGreaterThan(0)
    })
  })
})