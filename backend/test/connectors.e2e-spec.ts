import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'
import request from 'supertest'

describe('Connectors E2E', () => {
  let app: INestApplication
  let token: string
  let connectorId: string

  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:'
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    // onboard admin
    await request(app.getHttpServer())
      .post('/api/auth/register-admin')
      .send({ companyName: 'Acme', companySlug: 'acme', adminEmail: 'admin@acme.com', adminName: 'Admin', adminPassword: 'Str0ngPassword' })
      .expect(201)

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@acme.com', password: 'Str0ngPassword' })
      .expect(200)
    token = loginRes.body.accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates a connector and ingests accounts', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/connectors')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'hubspot', credentials: { apiKey: 'fake' } })
      .expect(201)

    connectorId = createRes.body.id

    await request(app.getHttpServer())
      .post(`/api/connectors/${connectorId}/ingest/accounts`)
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'hubspot', rows: [{ externalId: 'acc_1', name: 'Acme LLC', website: 'https://acme.com' }] })
      .expect(201)

    // Verify list connectors returns the connector
    const listRes = await request(app.getHttpServer())
      .get('/api/connectors')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(Array.isArray(listRes.body)).toBe(true)
    expect(listRes.body.find((c: any) => c.id === connectorId)).toBeTruthy()
  })
})
