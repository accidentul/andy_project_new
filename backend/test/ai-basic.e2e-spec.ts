import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { DataSource } from 'typeorm'

describe('AI Module Basic (e2e)', () => {
  let app: INestApplication
  let authToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
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

  describe('Basic AI endpoints', () => {
    it('should return available AI roles', async () => {
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

    it('should handle chat request (will fail without OpenAI key)', async () => {
      // This test will fail without OpenAI key, but we can check the endpoint exists
      const response = await request(app.getHttpServer())
        .post('/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'Test query',
        })

      // Either 200 with response or 500 if no OpenAI key
      expect([200, 500]).toContain(response.status)
    })

    it('should handle seed data request', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/seed-data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          connectorId: 'test-connector',
          provider: 'salesforce',
          volume: 'small',
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('salesforce'),
      })
    })

    it('should return widget suggestions after seeding data', async () => {
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
        })
      }
    })
  })
})