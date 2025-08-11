import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiService } from './ai.service'
import { EnhancedAiService } from './ai.service.enhanced'
import { ActionExecutorService } from './action-executor.service'
import { AiController } from './ai.controller'
import { AiStreamingController } from './ai.controller.streaming'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from '../connectors/unified-crm.entities'
import { ConnectorsModule } from '../connectors/connectors.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmAccount, CrmContact, CrmDeal, CrmActivity]),
    ConnectorsModule,
  ],
  controllers: [AiController, AiStreamingController],
  providers: [AiService, EnhancedAiService, ActionExecutorService],
  exports: [AiService, EnhancedAiService, ActionExecutorService],
})
export class AiModule {}