import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { DataSource } from 'typeorm'

describe('AI Agent Module (e2e)', () => {
  let app: INestApplication
  let adminToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()

    // Clean database
    const dataSource = app.get(DataSource)
    await dataSource.synchronize(true)

    // Register admin and get token
    const adminData = {
      companyName: 'Test AI Company',
      companySlug: 'test-ai-co',
      adminEmail: 'admin@testai.com',
      adminName: 'Admin User',
      adminPassword: 'TestPass123',
    }

    await request(app.getHttpServer())
      .post('/api/auth/register-admin')
      .send(adminData)
      .expect(201)

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: adminData.adminEmail,
        password: adminData.adminPassword,
      })
      .expect(200)

    adminToken = loginRes.body.accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Agent and Tool System', () => {
    it('should return available agents', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/ai/agents/available')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.agents).toBeInstanceOf(Array)
      expect(response.body.agents).toContain('CFO')
      expect(response.body.agents).toContain('Sales Manager')
      expect(response.body.agents).toContain('Marketing Manager')
      expect(response.body.agents).toContain('Operations Manager')
      expect(response.body.agents).toContain('HR Manager')
    })

    it('should return available tools for user role', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/ai/tools/available')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.role).toBeDefined()
      expect(response.body.tools).toBeInstanceOf(Array)
      expect(response.body.tools.length).toBeGreaterThan(0)
      
      // Check tool structure
      const firstTool = response.body.tools[0]
      expect(firstTool).toHaveProperty('type', 'function')
      expect(firstTool).toHaveProperty('function')
      expect(firstTool.function).toHaveProperty('name')
      expect(firstTool.function).toHaveProperty('description')
      expect(firstTool.function).toHaveProperty('parameters')
    })

    it('should process chat with agent (mock without OpenAI)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/ai/chat/agent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: 'What are our sales metrics?',
          agentRole: 'Sales Manager',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.agentRole).toBe('Sales Manager')
      expect(response.body.conversationId).toBeDefined()
      // Response will be minimal without OpenAI key, but structure should be valid
    })

    it('should execute a tool directly', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/ai/tools/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          toolName: 'analyze_sales_pipeline',
          params: {
            groupBy: 'stage',
          },
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.message).toBeDefined()
    })

    it('should respect role-based tool access', async () => {
      // This test would fail if trying to execute a tool not available to the user's role
      // Since admin has access to all tools, we expect success
      const response = await request(app.getHttpServer())
        .post('/api/ai/tools/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          toolName: 'get_crm_accounts',
          params: {
            limit: 5,
          },
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })
})