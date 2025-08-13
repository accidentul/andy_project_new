import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { ScheduleModule } from '@nestjs/schedule'
import { AiService } from './ai.service'
import { EnhancedAiService } from './ai.service.enhanced'
import { ActionExecutorService } from './action-executor.service'
import { AiAgentService } from './ai-agent.service'
import { ToolRegistry } from './tools/tool-registry'
import { AiController } from './ai.controller'
import { AiStreamingController } from './ai.controller.streaming'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from '../connectors/unified-crm.entities'
import { ConnectorsModule } from '../connectors/connectors.module'
import { UsersModule } from '../users/users.module'

// Import new intelligent system components
import { QueryAnalyzer } from './core/query-analyzer'
import { ToolSelector } from './core/tool-selector'
import { ResponseGenerator } from './core/response-generator'
import { ContextManager } from './core/context-manager'

// Import dynamic schema discovery and SQL generation
import { SchemaIntrospectorService } from './services/schema-introspector/schema-introspector.service'
import { AIQueryPlannerService } from './services/ai-query-planner.service'
import { DynamicSQLBuilder } from './core/dynamic-sql-builder'
import { SchemaMetadataService } from './services/schema-metadata.service'
import { QueryUnderstandingService } from './services/query-understanding.service'
import { QueryValidatorService } from './services/query-validator.service'
import { SchemaSyncService } from './services/schema-sync.service'
import { SeedDataService } from './seed-data.service'

// Import AI Insights and Simulator modules
import { InsightsModule } from './insights/insights.module'
import { SimulatorModule } from './simulator/simulator.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmAccount, CrmContact, CrmDeal, CrmActivity]),
    ConnectorsModule,
    ConfigModule,
    UsersModule,
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      signOptions: { expiresIn: '12h' },
    }),
    InsightsModule,
    SimulatorModule,
  ],
  controllers: [AiController, AiStreamingController],
  providers: [
    AiService, 
    EnhancedAiService, 
    ActionExecutorService,
    AiAgentService,
    ToolRegistry,
    // New intelligent system components
    QueryAnalyzer,
    ToolSelector,
    ResponseGenerator,
    ContextManager,
    // Dynamic schema discovery and SQL generation
    SchemaIntrospectorService,
    AIQueryPlannerService,
    DynamicSQLBuilder,
    SchemaMetadataService,
    QueryUnderstandingService,
    QueryValidatorService,
    SchemaSyncService,
    SeedDataService,
  ],
  exports: [
    AiService, 
    EnhancedAiService, 
    ActionExecutorService,
    AiAgentService,
    ToolRegistry,
    QueryAnalyzer,
    ToolSelector,
    ResponseGenerator,
    ContextManager,
    SchemaIntrospectorService,
    AIQueryPlannerService,
    DynamicSQLBuilder,
    SchemaMetadataService,
    QueryUnderstandingService,
    QueryValidatorService,
  ],
})
export class AiModule {}