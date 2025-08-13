import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { SeedService } from './seed.service'
import { Logger } from '@nestjs/common'

async function runSeed() {
  const logger = new Logger('Seed Script')
  
  const app = await NestFactory.createApplicationContext(AppModule)
  const seedService = app.get(SeedService)
  
  try {
    logger.log('Starting seed process...')
    await seedService.seed()
    logger.log('Seed completed successfully!')
  } catch (error) {
    logger.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await app.close()
    process.exit(0)
  }
}

runSeed()