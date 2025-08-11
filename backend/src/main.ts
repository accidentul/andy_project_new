import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')
  app.enableCors({ origin: true, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))

  const port = process.env.PORT || 4000
  await app.listen(port as number)
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`)
}
bootstrap()
