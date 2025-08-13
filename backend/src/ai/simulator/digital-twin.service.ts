import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

export interface BusinessModel {
  id: string
  tenantId: string
  name: string
  description: string
  version: string
  createdAt: Date
  updatedAt: Date
  
  structure: {
    departments: Department[]
    processes: BusinessProcess[]
    resources: Resource[]
    metrics: Metric[]
    relationships: Relationship[]
  }
  
  state: {
    current: BusinessState
    historical: BusinessState[]
    projections: BusinessState[]
  }
  
  capabilities: {
    operations: OperationalCapability[]
    strategic: StrategicCapability[]
    technological: TechCapability[]
  }
}

export interface Department {
  id: string
  name: string
  type: 'sales' | 'marketing' | 'operations' | 'finance' | 'hr' | 'it' | 'r&d' | 'other'
  headcount: number
  budget: number
  efficiency: number
  capabilities: string[]
  kpis: KPI[]
}

export interface BusinessProcess {
  id: string
  name: string
  department: string
  type: 'core' | 'support' | 'management'
  efficiency: number
  automationLevel: number
  costPerUnit: number
  cycleTime: number
  quality: number
  dependencies: string[]
}

export interface Resource {
  id: string
  name: string
  type: 'human' | 'financial' | 'physical' | 'technological' | 'intellectual'
  quantity: number
  utilization: number
  cost: number
  value: number
  constraints: Constraint[]
}

export interface Metric {
  id: string
  name: string
  category: 'financial' | 'operational' | 'customer' | 'employee' | 'strategic'
  value: number
  unit: string
  target: number
  trend: 'up' | 'down' | 'stable'
  importance: number
  formula?: string
}

export interface Relationship {
  from: string
  to: string
  type: 'depends' | 'influences' | 'constrains' | 'enables'
  strength: number
  description: string
}

export interface BusinessState {
  timestamp: Date
  metrics: Record<string, number>
  health: number
  risks: Risk[]
  opportunities: Opportunity[]
}

export interface KPI {
  name: string
  value: number
  target: number
  unit: string
  weight: number
}

export interface Constraint {
  type: 'capacity' | 'budget' | 'time' | 'quality' | 'regulatory'
  value: number
  unit: string
  description: string
}

export interface Risk {
  id: string
  name: string
  probability: number
  impact: number
  category: string
  mitigation?: string
}

export interface Opportunity {
  id: string
  name: string
  probability: number
  value: number
  category: string
  requirements?: string[]
}

export interface OperationalCapability {
  name: string
  maturity: number
  efficiency: number
  scalability: number
}

export interface StrategicCapability {
  name: string
  competitiveness: number
  uniqueness: number
  sustainability: number
}

export interface TechCapability {
  name: string
  sophistication: number
  integration: number
  futureReady: number
}

const BusinessModelSchema = z.object({
  departments: z.array(z.object({
    name: z.string(),
    type: z.enum(['sales', 'marketing', 'operations', 'finance', 'hr', 'it', 'r&d', 'other']),
    headcount: z.number(),
    budget: z.number(),
    efficiency: z.number().min(0).max(100),
    capabilities: z.array(z.string())
  })),
  processes: z.array(z.object({
    name: z.string(),
    department: z.string(),
    type: z.enum(['core', 'support', 'management']),
    efficiency: z.number().min(0).max(100),
    automationLevel: z.number().min(0).max(100)
  })),
  metrics: z.array(z.object({
    name: z.string(),
    category: z.enum(['financial', 'operational', 'customer', 'employee', 'strategic']),
    value: z.number(),
    unit: z.string(),
    target: z.number()
  }))
})

@Injectable()
export class DigitalTwinService {
  private readonly logger = new Logger(DigitalTwinService.name)
  private businessModels: Map<string, BusinessModel> = new Map()

  constructor(
    @InjectDataSource() private dataSource: DataSource
  ) {}

  async createDigitalTwin(tenantId: string): Promise<BusinessModel> {
    this.logger.log(`Creating digital twin for tenant: ${tenantId}`)
    
    const currentData = await this.extractBusinessData(tenantId)
    const modelStructure = await this.inferBusinessStructure(currentData)
    const capabilities = await this.assessCapabilities(currentData)
    const state = await this.computeBusinessState(currentData)
    
    const model: BusinessModel = {
      id: `dt-${tenantId}-${Date.now()}`,
      tenantId,
      name: `Digital Twin - ${tenantId}`,
      description: 'AI-generated digital representation of business operations',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      structure: modelStructure,
      state: {
        current: state,
        historical: [],
        projections: []
      },
      capabilities
    }
    
    this.businessModels.set(tenantId, model)
    
    await this.persistModel(model)
    await this.startContinuousLearning(model)
    
    return model
  }

  async updateDigitalTwin(tenantId: string): Promise<BusinessModel> {
    const model = await this.getDigitalTwin(tenantId)
    if (!model) {
      return this.createDigitalTwin(tenantId)
    }
    
    const currentData = await this.extractBusinessData(tenantId)
    const newState = await this.computeBusinessState(currentData)
    
    model.state.historical.push(model.state.current)
    model.state.current = newState
    model.updatedAt = new Date()
    
    await this.recalibrateModel(model, currentData)
    await this.persistModel(model)
    
    return model
  }

  async getDigitalTwin(tenantId: string): Promise<BusinessModel | null> {
    if (this.businessModels.has(tenantId)) {
      return this.businessModels.get(tenantId)!
    }
    
    const model = await this.loadModel(tenantId)
    if (model) {
      this.businessModels.set(tenantId, model)
    }
    
    return model
  }

  async simulateChange(
    tenantId: string,
    change: {
      type: 'resource' | 'process' | 'structure' | 'strategy'
      target: string
      modification: any
    }
  ): Promise<{
    baseline: BusinessState
    simulated: BusinessState
    impact: ImpactAnalysis
  }> {
    const model = await this.getDigitalTwin(tenantId)
    if (!model) {
      throw new Error('Digital twin not found')
    }
    
    const baseline = model.state.current
    const modifiedModel = this.applyChange(model, change)
    const simulated = await this.computeBusinessState(modifiedModel)
    const impact = await this.analyzeImpact(baseline, simulated, change)
    
    return { baseline, simulated, impact }
  }

  private async extractBusinessData(tenantId: string): Promise<any> {
    const [deals, activities, users, connectors] = await Promise.all([
      this.dataSource.query(
        'SELECT * FROM crm_deals WHERE tenantId = ?',
        [tenantId]
      ),
      this.dataSource.query(
        'SELECT * FROM crm_activities WHERE tenantId = ?',
        [tenantId]
      ),
      this.dataSource.query(
        'SELECT * FROM users WHERE tenantId = ?',
        [tenantId]
      ),
      this.dataSource.query(
        'SELECT * FROM connectors WHERE tenantId = ?',
        [tenantId]
      )
    ])
    
    return {
      deals,
      activities,
      users,
      connectors,
      metrics: await this.computeMetrics(tenantId)
    }
  }

  private async inferBusinessStructure(data: any): Promise<any> {
    const prompt = `
    Analyze this business data and infer the organizational structure:
    
    Data summary:
    - ${data.deals?.length || 0} deals
    - ${data.users?.length || 0} users
    - ${data.activities?.length || 0} activities
    - ${data.connectors?.length || 0} integrations
    
    Create a realistic business model structure with departments, processes, and metrics.
    `
    
    try {
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: BusinessModelSchema,
        prompt,
        temperature: 0.7
      })
      
      return {
        ...result.object,
        resources: this.inferResources(data),
        relationships: this.inferRelationships(result.object)
      }
    } catch (error) {
      this.logger.error('Failed to infer business structure:', error)
      return this.getDefaultStructure()
    }
  }

  private async assessCapabilities(data: any): Promise<any> {
    const hasAutomation = data.connectors?.length > 0
    const dealVolume = data.deals?.length || 0
    const userActivity = data.activities?.length || 0
    
    return {
      operations: [
        {
          name: 'Sales Process',
          maturity: Math.min(80, dealVolume * 2),
          efficiency: Math.min(85, userActivity / Math.max(1, data.users?.length) * 10),
          scalability: hasAutomation ? 75 : 50
        },
        {
          name: 'Customer Management',
          maturity: hasAutomation ? 70 : 45,
          efficiency: 65,
          scalability: 70
        }
      ],
      strategic: [
        {
          name: 'Market Position',
          competitiveness: 60,
          uniqueness: 55,
          sustainability: 70
        }
      ],
      technological: [
        {
          name: 'Digital Infrastructure',
          sophistication: hasAutomation ? 75 : 40,
          integration: data.connectors?.length * 15 || 20,
          futureReady: 65
        }
      ]
    }
  }

  private async computeBusinessState(data: any): Promise<BusinessState> {
    const metrics = data.metrics || await this.computeMetrics(data.tenantId || 'unknown')
    const health = this.calculateHealth(metrics)
    const risks = await this.identifyRisks(data)
    const opportunities = await this.identifyOpportunities(data)
    
    return {
      timestamp: new Date(),
      metrics,
      health,
      risks,
      opportunities
    }
  }

  private async computeMetrics(tenantId: string): Promise<Record<string, number>> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          COUNT(DISTINCT d.id) as total_deals,
          SUM(CASE WHEN d.stage = 'Closed Won' THEN d.amount ELSE 0 END) as revenue,
          AVG(d.amount) as avg_deal_size,
          COUNT(DISTINCT a.id) as total_activities,
          COUNT(DISTINCT u.id) as active_users
        FROM crm_deals d
        LEFT JOIN crm_activities a ON a.tenantId = d.tenantId
        LEFT JOIN users u ON u.tenantId = d.tenantId
        WHERE d.tenantId = ?
      `, [tenantId])
      
      return result[0] || {}
    } catch (error) {
      this.logger.error('Failed to compute metrics:', error)
      return {}
    }
  }

  private calculateHealth(metrics: Record<string, number>): number {
    const revenue = metrics.revenue || 0
    const deals = metrics.total_deals || 0
    const activities = metrics.total_activities || 0
    
    const revenueScore = Math.min(100, revenue / 10000)
    const activityScore = Math.min(100, activities / 10)
    const dealScore = Math.min(100, deals * 5)
    
    return (revenueScore + activityScore + dealScore) / 3
  }

  private async identifyRisks(data: any): Promise<Risk[]> {
    const risks: Risk[] = []
    
    if (!data.connectors || data.connectors.length === 0) {
      risks.push({
        id: 'risk-1',
        name: 'Limited Integration',
        probability: 0.8,
        impact: 0.6,
        category: 'technological',
        mitigation: 'Implement CRM integrations'
      })
    }
    
    if (data.deals?.length < 10) {
      risks.push({
        id: 'risk-2',
        name: 'Low Deal Volume',
        probability: 0.7,
        impact: 0.8,
        category: 'operational',
        mitigation: 'Increase sales activities'
      })
    }
    
    return risks
  }

  private async identifyOpportunities(data: any): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = []
    
    if (data.deals?.length > 20) {
      opportunities.push({
        id: 'opp-1',
        name: 'Scale Sales Operations',
        probability: 0.7,
        value: 500000,
        category: 'growth',
        requirements: ['Additional sales staff', 'Automation tools']
      })
    }
    
    return opportunities
  }

  private applyChange(model: BusinessModel, change: any): any {
    const modified = JSON.parse(JSON.stringify(model))
    
    switch (change.type) {
      case 'resource':
        const resource = modified.structure.resources.find((r: Resource) => r.id === change.target)
        if (resource) {
          Object.assign(resource, change.modification)
        }
        break
      
      case 'process':
        const process = modified.structure.processes.find((p: BusinessProcess) => p.id === change.target)
        if (process) {
          Object.assign(process, change.modification)
        }
        break
      
      case 'structure':
        const dept = modified.structure.departments.find((d: Department) => d.id === change.target)
        if (dept) {
          Object.assign(dept, change.modification)
        }
        break
    }
    
    return modified
  }

  private async analyzeImpact(
    baseline: BusinessState,
    simulated: BusinessState,
    change: any
  ): Promise<ImpactAnalysis> {
    const metricChanges: MetricChange[] = []
    
    for (const key in baseline.metrics) {
      const baseValue = baseline.metrics[key]
      const simValue = simulated.metrics[key]
      const changePercent = ((simValue - baseValue) / baseValue) * 100
      
      if (Math.abs(changePercent) > 1) {
        metricChanges.push({
          metric: key,
          baseline: baseValue,
          simulated: simValue,
          change: changePercent,
          impact: this.categorizeImpact(changePercent)
        })
      }
    }
    
    return {
      summary: `${change.type} change to ${change.target}`,
      metricChanges,
      overallImpact: this.calculateOverallImpact(metricChanges),
      recommendations: await this.generateRecommendations(metricChanges, change)
    }
  }

  private categorizeImpact(changePercent: number): 'positive' | 'negative' | 'neutral' {
    if (changePercent > 5) return 'positive'
    if (changePercent < -5) return 'negative'
    return 'neutral'
  }

  private calculateOverallImpact(changes: MetricChange[]): number {
    if (changes.length === 0) return 0
    
    const totalImpact = changes.reduce((sum, change) => {
      const weight = this.getMetricWeight(change.metric)
      return sum + (change.change * weight)
    }, 0)
    
    return totalImpact / changes.length
  }

  private getMetricWeight(metric: string): number {
    const weights: Record<string, number> = {
      revenue: 1.5,
      total_deals: 1.2,
      avg_deal_size: 1.0,
      total_activities: 0.8,
      active_users: 0.7
    }
    
    return weights[metric] || 1.0
  }

  private async generateRecommendations(changes: MetricChange[], change: any): Promise<string[]> {
    const recommendations: string[] = []
    
    for (const metricChange of changes) {
      if (metricChange.impact === 'negative' && metricChange.change < -10) {
        recommendations.push(`Consider mitigation strategies for ${metricChange.metric} decline`)
      }
      if (metricChange.impact === 'positive' && metricChange.change > 20) {
        recommendations.push(`Capitalize on ${metricChange.metric} improvement opportunity`)
      }
    }
    
    return recommendations
  }

  private inferResources(data: any): Resource[] {
    return [
      {
        id: 'res-human',
        name: 'Human Resources',
        type: 'human',
        quantity: data.users?.length || 1,
        utilization: 75,
        cost: (data.users?.length || 1) * 75000,
        value: (data.users?.length || 1) * 150000,
        constraints: []
      },
      {
        id: 'res-tech',
        name: 'Technology Stack',
        type: 'technological',
        quantity: data.connectors?.length || 1,
        utilization: 60,
        cost: 50000,
        value: 200000,
        constraints: []
      }
    ]
  }

  private inferRelationships(structure: any): Relationship[] {
    const relationships: Relationship[] = []
    
    if (structure.departments && structure.processes) {
      structure.processes.forEach((process: any) => {
        relationships.push({
          from: process.department,
          to: process.name,
          type: 'depends',
          strength: 0.8,
          description: 'Department owns process'
        })
      })
    }
    
    return relationships
  }

  private getDefaultStructure(): any {
    return {
      departments: [
        {
          id: 'dept-sales',
          name: 'Sales',
          type: 'sales',
          headcount: 10,
          budget: 1000000,
          efficiency: 70,
          capabilities: ['Lead Generation', 'Deal Closing'],
          kpis: []
        }
      ],
      processes: [
        {
          id: 'proc-sales',
          name: 'Sales Process',
          department: 'Sales',
          type: 'core',
          efficiency: 65,
          automationLevel: 40,
          costPerUnit: 500,
          cycleTime: 30,
          quality: 75,
          dependencies: []
        }
      ],
      resources: [],
      metrics: [],
      relationships: []
    }
  }

  private async persistModel(model: BusinessModel): Promise<void> {
    try {
      const existingModel = await this.dataSource.query(
        'SELECT id FROM digital_twins WHERE tenantId = ?',
        [model.tenantId]
      )
      
      if (existingModel && existingModel.length > 0) {
        await this.dataSource.query(
          'UPDATE digital_twins SET model_data = ?, updated_at = ? WHERE tenantId = ?',
          [JSON.stringify(model), new Date(), model.tenantId]
        )
      } else {
        await this.dataSource.query(
          'INSERT INTO digital_twins (id, tenantId, model_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [model.id, model.tenantId, JSON.stringify(model), model.createdAt, model.updatedAt]
        )
      }
    } catch (error) {
      this.logger.warn('Digital twins table not ready, keeping in memory')
    }
  }

  private async loadModel(tenantId: string): Promise<BusinessModel | null> {
    try {
      const result = await this.dataSource.query(
        'SELECT model_data FROM digital_twins WHERE tenantId = ?',
        [tenantId]
      )
      
      if (result && result.length > 0) {
        return JSON.parse(result[0].model_data)
      }
    } catch (error) {
      this.logger.warn('Could not load model from database')
    }
    
    return null
  }

  private async startContinuousLearning(model: BusinessModel): Promise<void> {
    this.logger.log(`Starting continuous learning for model: ${model.id}`)
  }

  private async recalibrateModel(model: BusinessModel, currentData: any): Promise<void> {
    this.logger.log(`Recalibrating model: ${model.id}`)
    
    const newCapabilities = await this.assessCapabilities(currentData)
    model.capabilities = newCapabilities
    
    const inferredStructure = await this.inferBusinessStructure(currentData)
    if (inferredStructure.departments.length > model.structure.departments.length) {
      model.structure = inferredStructure
    }
  }
}

export interface ImpactAnalysis {
  summary: string
  metricChanges: MetricChange[]
  overallImpact: number
  recommendations: string[]
}

export interface MetricChange {
  metric: string
  baseline: number
  simulated: number
  change: number
  impact: 'positive' | 'negative' | 'neutral'
}