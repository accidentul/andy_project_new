import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { InsightsController } from './insights.controller'
import { InsightsDiscoveryService } from './insights-discovery.service'
import { PredictiveAnalyticsService } from './predictive-analytics.service'
import { WidgetGenerationService } from './widget-generation.service'
import { CrmAccount, CrmContact, CrmDeal, CrmActivity } from '../../connectors/unified-crm.entities'
import { AIQueryPlannerService } from '../services/ai-query-planner.service'
import { DynamicSQLBuilder } from '../core/dynamic-sql-builder'
import { SchemaIntrospectorService } from '../services/schema-introspector/schema-introspector.service'
import { SchemaMetadataService } from '../services/schema-metadata.service'
import { QueryUnderstandingService } from '../services/query-understanding.service'
import { QueryValidatorService } from '../services/query-validator.service'
import { ToolRegistry } from '../tools/tool-registry'

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmAccount, CrmContact, CrmDeal, CrmActivity]),
    ScheduleModule.forRoot(),
  ],
  controllers: [InsightsController],
  providers: [
    InsightsDiscoveryService,
    PredictiveAnalyticsService,
    WidgetGenerationService,
    AIQueryPlannerService,
    DynamicSQLBuilder,
    SchemaIntrospectorService,
    SchemaMetadataService,
    QueryUnderstandingService,
    QueryValidatorService,
    ToolRegistry,
  ],
  exports: [
    InsightsDiscoveryService,
    PredictiveAnalyticsService,
    WidgetGenerationService,
  ],
})
export class InsightsModule {}