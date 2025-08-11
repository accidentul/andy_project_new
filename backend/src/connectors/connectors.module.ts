import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Connector } from './connector.entity'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from './unified-crm.entities'
import { ConnectorsService } from './connectors.service'
import { ConnectorsController } from './connectors.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Connector, CrmAccount, CrmContact, CrmDeal, CrmActivity])],
  providers: [ConnectorsService],
  controllers: [ConnectorsController],
  exports: [ConnectorsService],
})
export class ConnectorsModule {}
