import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SeedService } from './seed/seed.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')

  app.setGlobalPrefix('api')
  app.enableCors({ origin: true, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))

  // Run seed in development mode
  if (process.env.NODE_ENV !== 'production') {
    const seedService = app.get(SeedService)
    try {
      await seedService.seed()
    } catch (error) {
      logger.error('Failed to seed database:', error)
    }
  }

  const port = process.env.PORT || 4000
  await app.listen(port as number)
  logger.log(`Backend listening on http://localhost:${port}`)
}
bootstrap()
