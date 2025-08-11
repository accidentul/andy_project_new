import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiService } from './ai.service'
import { EnhancedAiService } from './ai.service.enhanced'
import { AiController } from './ai.controller'
import { AiStreamingController } from './ai.controller.streaming'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from '../connectors/unified-crm.entities'

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmAccount, CrmContact, CrmDeal, CrmActivity]),
  ],
  controllers: [AiController, AiStreamingController],
  providers: [AiService, EnhancedAiService],
  exports: [AiService, EnhancedAiService],
})
export class AiModule {}