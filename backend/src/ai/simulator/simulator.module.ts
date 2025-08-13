import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SimulatorController } from './simulator.controller'
import { DigitalTwinService } from './digital-twin.service'
import { ScenarioService } from './scenario.service'
import { DecisionImpactService } from './decision-impact.service'

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [SimulatorController],
  providers: [
    DigitalTwinService,
    ScenarioService,
    DecisionImpactService
  ],
  exports: [
    DigitalTwinService,
    ScenarioService,
    DecisionImpactService
  ]
})
export class SimulatorModule {}