import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { DigitalTwinService, BusinessModel } from './digital-twin.service'
import { ScenarioService, Scenario, SimulationResult } from './scenario.service'
import { DecisionImpactService, DecisionImpactAnalysis, Decision } from './decision-impact.service'

@Controller('api/simulator')
@UseGuards(JwtAuthGuard)
export class SimulatorController {
  private readonly logger = new Logger(SimulatorController.name)

  constructor(
    private digitalTwinService: DigitalTwinService,
    private scenarioService: ScenarioService,
    private decisionImpactService: DecisionImpactService
  ) {}

  // Digital Twin endpoints
  @Post('digital-twin/create')
  async createDigitalTwin(@Request() req: any): Promise<BusinessModel> {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      this.logger.log(`Creating digital twin for tenant: ${tenantId}`)
      return await this.digitalTwinService.createDigitalTwin(tenantId)
    } catch (error: any) {
      this.logger.error('Failed to create digital twin:', error)
      throw new HttpException(
        error.message || 'Failed to create digital twin',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('digital-twin')
  async getDigitalTwin(@Request() req: any): Promise<BusinessModel | null> {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      return await this.digitalTwinService.getDigitalTwin(tenantId)
    } catch (error: any) {
      this.logger.error('Failed to get digital twin:', error)
      throw new HttpException(
        error.message || 'Failed to get digital twin',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Put('digital-twin/update')
  async updateDigitalTwin(@Request() req: any): Promise<BusinessModel> {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      return await this.digitalTwinService.updateDigitalTwin(tenantId)
    } catch (error: any) {
      this.logger.error('Failed to update digital twin:', error)
      throw new HttpException(
        error.message || 'Failed to update digital twin',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('digital-twin/simulate-change')
  async simulateChange(
    @Request() req: any,
    @Body() change: {
      type: 'resource' | 'process' | 'structure' | 'strategy'
      target: string
      modification: any
    }
  ) {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      return await this.digitalTwinService.simulateChange(tenantId, change)
    } catch (error: any) {
      this.logger.error('Failed to simulate change:', error)
      throw new HttpException(
        error.message || 'Failed to simulate change',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Scenario endpoints
  @Post('scenarios')
  async createScenario(
    @Request() req: any,
    @Body() input: {
      name: string
      description: string
      type: 'strategic' | 'operational' | 'financial' | 'market' | 'risk' | 'growth'
      timeHorizon: number
    }
  ): Promise<Scenario> {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      const userId = req.user.id
      
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      return await this.scenarioService.createScenario(tenantId, userId, input)
    } catch (error: any) {
      this.logger.error('Failed to create scenario:', error)
      throw new HttpException(
        error.message || 'Failed to create scenario',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('scenarios/generate')
  async generateScenario(
    @Request() req: any,
    @Body() body: { prompt: string }
  ): Promise<Scenario> {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      const userId = req.user.id
      
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      this.logger.log(`Generating scenario from prompt: "${body.prompt}"`)
      return await this.scenarioService.generateScenarioFromPrompt(
        tenantId,
        userId,
        body.prompt
      )
    } catch (error: any) {
      this.logger.error('Failed to generate scenario:', error)
      throw new HttpException(
        error.message || 'Failed to generate scenario',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('scenarios')
  async getScenarios(@Request() req: any): Promise<Scenario[]> {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      return await this.scenarioService.getScenarios(tenantId)
    } catch (error: any) {
      this.logger.error('Failed to get scenarios:', error)
      throw new HttpException(
        error.message || 'Failed to get scenarios',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('scenarios/:id')
  async getScenario(@Param('id') id: string): Promise<Scenario | null> {
    try {
      return await this.scenarioService.getScenario(id)
    } catch (error: any) {
      this.logger.error('Failed to get scenario:', error)
      throw new HttpException(
        error.message || 'Failed to get scenario',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('scenarios/:id/simulate')
  async runSimulation(
    @Param('id') scenarioId: string,
    @Body() options?: {
      iterations?: number
      parallel?: boolean
      monteCarlo?: boolean
    }
  ): Promise<SimulationResult> {
    try {
      this.logger.log(`Running simulation for scenario: ${scenarioId}`)
      return await this.scenarioService.runSimulation(scenarioId, options)
    } catch (error: any) {
      this.logger.error('Failed to run simulation:', error)
      throw new HttpException(
        error.message || 'Failed to run simulation',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Decision Impact endpoints
  @Post('decisions/analyze')
  async analyzeDecision(
    @Request() req: any,
    @Body() body: {
      decision: Decision
      context?: {
        scenario?: Scenario
        timeHorizon?: number
        constraints?: any[]
      }
    }
  ): Promise<DecisionImpactAnalysis> {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      this.logger.log(`Analyzing decision: ${body.decision.name}`)
      return await this.decisionImpactService.analyzeDecisionImpact(
        tenantId,
        body.decision,
        body.context
      )
    } catch (error: any) {
      this.logger.error('Failed to analyze decision:', error)
      throw new HttpException(
        error.message || 'Failed to analyze decision',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('decisions/compare')
  async compareDecisions(
    @Request() req: any,
    @Body() body: { decisionIds: string[] }
  ) {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      return await this.decisionImpactService.compareDecisions(
        tenantId,
        body.decisionIds
      )
    } catch (error: any) {
      this.logger.error('Failed to compare decisions:', error)
      throw new HttpException(
        error.message || 'Failed to compare decisions',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Command Center endpoints
  @Get('command-center/overview')
  async getCommandCenterOverview(@Request() req: any) {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      const digitalTwin = await this.digitalTwinService.getDigitalTwin(tenantId)
      const scenarios = await this.scenarioService.getScenarios(tenantId)
      
      return {
        digitalTwin: digitalTwin ? {
          id: digitalTwin.id,
          health: digitalTwin.state.current.health,
          lastUpdated: digitalTwin.updatedAt,
          metrics: Object.keys(digitalTwin.state.current.metrics).length,
          departments: digitalTwin.structure.departments.length,
          processes: digitalTwin.structure.processes.length
        } : null,
        scenarios: scenarios.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          status: s.status,
          createdAt: s.createdAt
        })),
        activeSimulations: scenarios.filter(s => s.status === 'running').length,
        completedSimulations: scenarios.filter(s => s.status === 'completed').length
      }
    } catch (error: any) {
      this.logger.error('Failed to get command center overview:', error)
      throw new HttpException(
        error.message || 'Failed to get command center overview',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('command-center/quick-action')
  async executeQuickAction(
    @Request() req: any,
    @Body() body: {
      action: 'create-twin' | 'generate-scenario' | 'run-simulation' | 'analyze-decision'
      params?: any
    }
  ) {
    try {
      const tenantId = req.user.tenantId || req.user.tenant?.id
      const userId = req.user.id
      
      if (!tenantId) {
        throw new HttpException('Tenant ID not found', HttpStatus.BAD_REQUEST)
      }
      
      switch (body.action) {
        case 'create-twin':
          return await this.digitalTwinService.createDigitalTwin(tenantId)
        
        case 'generate-scenario':
          return await this.scenarioService.generateScenarioFromPrompt(
            tenantId,
            userId,
            body.params?.prompt || 'Generate a growth scenario for next year'
          )
        
        case 'run-simulation':
          if (!body.params?.scenarioId) {
            throw new HttpException('Scenario ID required', HttpStatus.BAD_REQUEST)
          }
          return await this.scenarioService.runSimulation(body.params.scenarioId)
        
        case 'analyze-decision':
          if (!body.params?.decision) {
            throw new HttpException('Decision required', HttpStatus.BAD_REQUEST)
          }
          return await this.decisionImpactService.analyzeDecisionImpact(
            tenantId,
            body.params.decision
          )
        
        default:
          throw new HttpException('Unknown action', HttpStatus.BAD_REQUEST)
      }
    } catch (error: any) {
      this.logger.error('Failed to execute quick action:', error)
      throw new HttpException(
        error.message || 'Failed to execute quick action',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}