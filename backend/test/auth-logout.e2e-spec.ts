import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'

describe('Auth Logout (e2e)', () => {
  let app: INestApplication
  let accessToken: string

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    app.setGlobalPrefix('api')
    await app.init()

    // Register and login to get a token
    const timestamp = Date.now()
    await request(app.getHttpServer())
      .post('/api/auth/register-admin')
      .send({
        companyName: `Logout Test Company ${timestamp}`,
        companySlug: `logout-test-${timestamp}`,
        adminEmail: `logout.test.${timestamp}@example.com`,
        adminName: 'Logout Test Admin',
        adminPassword: 'TestPass123',
      })

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `logout.test.${timestamp}@example.com`,
        password: 'TestPass123',
      })
      .expect(200)

    accessToken = loginResponse.body.accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/api/auth/logout (POST)', () => {
    it('should successfully logout with valid token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('success', true)
          expect(res.body).toHaveProperty('message', 'Logged out successfully')
          expect(res.body).toHaveProperty('userId')
        })
    })

    it('should fail to logout without token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401)
    })

    it('should fail to logout with invalid token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })

    it('should still accept the token after logout (stateless JWT)', async () => {
      // This test demonstrates that JWTs are stateless
      // In a production app, you might implement token blacklisting
      
      // First logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      // Token should still work for other endpoints (demonstrating stateless nature)
      // In production, you'd implement token blacklisting to prevent this
      await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
    })
  })
})