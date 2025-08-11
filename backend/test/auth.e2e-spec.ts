import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'
import request from 'supertest'

describe('Auth E2E', () => {
  let app: INestApplication

  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:'

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('registers admin and logs in', async () => {
    const registerPayload = {
      companyName: 'Acme Corp',
      companySlug: 'acme',
      adminEmail: 'admin@acme.com',
      adminName: 'Admin',
      adminPassword: 'Str0ngPassword',
    }

    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register-admin')
      .send(registerPayload)
      .expect(201)

    expect(registerRes.body.tenantId).toBeDefined()

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@acme.com', password: 'Str0ngPassword' })
      .expect(200)

    expect(loginRes.body.accessToken).toBeDefined()
    expect(loginRes.body.user.email).toBe('admin@acme.com')
  })
})
