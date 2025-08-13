import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SchemaIntrospectorService } from './schema-introspector/schema-introspector.service'

@Injectable()
export class SchemaSyncService implements OnModuleInit {
  private readonly logger = new Logger(SchemaSyncService.name)
  
  constructor(
    private schemaIntrospector: SchemaIntrospectorService
  ) {}
  
  async onModuleInit() {
    // Initial schema load on startup
    await this.syncSchema()
  }
  
  // Sync schema every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledSync() {
    this.logger.log('Running scheduled schema sync...')
    await this.syncSchema()
  }
  
  async syncSchema(): Promise<void> {
    try {
      this.logger.log('Synchronizing database schema...')
      
      // Force refresh the schema cache
      await this.schemaIntrospector.refreshSchema()
      
      const schema = await this.schemaIntrospector.getSchema()
      
      this.logger.log(`Schema synchronized successfully:`)
      this.logger.log(`  - Tables: ${schema.tables.size}`)
      this.logger.log(`  - Relationships: ${schema.relationships.length}`)
      
      // Log any tables with foreign keys (for JOIN support)
      let tablesWithForeignKeys = 0
      for (const [tableName, table] of schema.tables) {
        if (table.foreignKeys.length > 0) {
          tablesWithForeignKeys++
          this.logger.debug(`Table ${tableName} has ${table.foreignKeys.length} foreign keys`)
        }
      }
      this.logger.log(`  - Tables with foreign keys: ${tablesWithForeignKeys}`)
      
    } catch (error) {
      this.logger.error('Failed to sync schema:', error)
    }
  }
  
  // Manual refresh method
  async refreshSchema(): Promise<void> {
    this.logger.log('Manual schema refresh requested')
    await this.syncSchema()
  }
}