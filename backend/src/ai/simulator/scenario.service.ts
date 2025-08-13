import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { DigitalTwinService, BusinessModel, BusinessState } from './digital-twin.service'
import { openai } from '@ai-sdk/openai'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'

export interface Scenario {
  id: string
  tenantId: string
  name: string
  description: string
  type: 'strategic' | 'operational' | 'financial' | 'market' | 'risk' | 'growth'
  timeHorizon: number // months
  createdBy: string
  createdAt: Date
  
  decisions: Decision[]
  assumptions: Assumption[]
  constraints: ScenarioConstraint[]
  objectives: Objective[]
  
  simulation?: SimulationResult
  status: 'draft' | 'ready' | 'running' | 'completed' | 'failed'
}

export interface Decision {
  id: string
  name: string
  category: 'investment' | 'hiring' | 'product' | 'market' | 'operational' | 'strategic'
  description: string
  
  options: DecisionOption[]
  selectedOption?: string
  
  dependencies?: string[]
  timing: {
    earliest: Date
    latest: Date
    optimal?: Date
  }
  
  resources: {
    budget?: number
    headcount?: number
    time?: number
  }
}

export interface DecisionOption {
  id: string
  name: string
  description: string
  
  costs: {
    upfront: number
    ongoing: number
    opportunity: number
  }
  
  benefits: {
    revenue?: number
    efficiency?: number
    quality?: number
    satisfaction?: number
  }
  
  risks: {
    probability: number
    impact: number
    description: string
  }[]
  
  requirements: string[]
  timeToImplement: number // days
}

export interface Assumption {
  id: string
  category: 'market' | 'economic' | 'competitive' | 'internal' | 'regulatory'
  description: string
  
  variable: string
  baseValue: number
  unit: string
  
  uncertainty: {
    distribution: 'normal' | 'uniform' | 'triangular' | 'exponential'
    parameters: {
      min?: number
      max?: number
      mean?: number
      stdDev?: number
      mostLikely?: number
    }
  }
  
  confidence: number
  source?: string
}

export interface ScenarioConstraint {
  type: 'budget' | 'time' | 'resource' | 'regulatory' | 'technical'
  description: string
  limit: number
  unit: string
  hard: boolean // hard vs soft constraint
}

export interface Objective {
  id: string
  name: string
  metric: string
  target: number
  weight: number
  minimize: boolean
}

export interface SimulationResult {
  id: string
  scenarioId: string
  startedAt: Date
  completedAt?: Date
  
  iterations: number
  convergence: number
  
  outcomes: SimulationOutcome[]
  statistics: SimulationStatistics
  insights: SimulationInsight[]
  recommendations: StrategicRecommendation[]
  
  sensitivity: SensitivityAnalysis[]
  monteCarlo?: MonteCarloResult
}

export interface SimulationOutcome {
  iteration: number
  decisions: Record<string, string>
  assumptions: Record<string, number>
  
  projectedState: BusinessState
  metrics: Record<string, number>
  objectives: Record<string, number>
  
  feasible: boolean
  optimality: number
}

export interface SimulationStatistics {
  mean: Record<string, number>
  median: Record<string, number>
  stdDev: Record<string, number>
  percentiles: {
    p5: Record<string, number>
    p25: Record<string, number>
    p75: Record<string, number>
    p95: Record<string, number>
  }
  
  successRate: number
  averageROI: number
  riskAdjustedReturn: number
}

export interface SimulationInsight {
  type: 'opportunity' | 'risk' | 'dependency' | 'bottleneck' | 'synergy'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  evidence: string[]
}

export interface StrategicRecommendation {
  id: string
  priority: number
  title: string
  description: string
  
  actions: string[]
  expectedOutcome: string
  requiredResources: string[]
  timeline: string
  
  supportingData: {
    metric: string
    improvement: number
    confidence: number
  }[]
}

export interface SensitivityAnalysis {
  variable: string
  baseValue: number
  impact: {
    metric: string
    elasticity: number
    correlation: number
  }[]
  criticalThresholds: number[]
}

export interface MonteCarloResult {
  iterations: number
  seed: number
  
  distributions: {
    metric: string
    histogram: { bin: number; frequency: number }[]
    statistics: {
      mean: number
      variance: number
      skewness: number
      kurtosis: number
    }
  }[]
  
  probabilityOfSuccess: number
  valueAtRisk: number
  conditionalValueAtRisk: number
}

const ScenarioSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum(['strategic', 'operational', 'financial', 'market', 'risk', 'growth']),
  timeHorizon: z.number(),
  decisions: z.array(z.object({
    name: z.string(),
    category: z.enum(['investment', 'hiring', 'product', 'market', 'operational', 'strategic']),
    description: z.string(),
    options: z.array(z.object({
      name: z.string(),
      costs: z.object({
        upfront: z.number(),
        ongoing: z.number()
      }),
      benefits: z.object({
        revenue: z.number().optional(),
        efficiency: z.number().optional()
      }),
      timeToImplement: z.number()
    }))
  })),
  assumptions: z.array(z.object({
    category: z.enum(['market', 'economic', 'competitive', 'internal', 'regulatory']),
    description: z.string(),
    variable: z.string(),
    baseValue: z.number(),
    confidence: z.number()
  })),
  objectives: z.array(z.object({
    name: z.string(),
    metric: z.string(),
    target: z.number(),
    weight: z.number()
  }))
})

@Injectable()
export class ScenarioService {
  private readonly logger = new Logger(ScenarioService.name)
  private scenarios: Map<string, Scenario[]> = new Map()

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private digitalTwinService: DigitalTwinService
  ) {}

  async createScenario(
    tenantId: string,
    userId: string,
    input: {
      name: string
      description: string
      type: Scenario['type']
      timeHorizon: number
    }
  ): Promise<Scenario> {
    this.logger.log(`Creating scenario: ${input.name} for tenant: ${tenantId}`)
    
    const scenario: Scenario = {
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      ...input,
      createdBy: userId,
      createdAt: new Date(),
      decisions: [],
      assumptions: [],
      constraints: [],
      objectives: [],
      status: 'draft'
    }
    
    if (!this.scenarios.has(tenantId)) {
      this.scenarios.set(tenantId, [])
    }
    this.scenarios.get(tenantId)!.push(scenario)
    
    await this.persistScenario(scenario)
    
    return scenario
  }

  async generateScenarioFromPrompt(
    tenantId: string,
    userId: string,
    prompt: string
  ): Promise<Scenario> {
    this.logger.log(`Generating scenario from prompt: "${prompt}"`)
    
    const digitalTwin = await this.digitalTwinService.getDigitalTwin(tenantId)
    if (!digitalTwin) {
      throw new Error('Digital twin not found. Please create one first.')
    }
    
    const aiPrompt = `
    Based on this business context and user request, generate a strategic scenario:
    
    Business Context:
    - Current health: ${digitalTwin.state.current.health}
    - Key metrics: ${JSON.stringify(digitalTwin.state.current.metrics)}
    - Departments: ${digitalTwin.structure.departments.map(d => d.name).join(', ')}
    
    User Request: "${prompt}"
    
    Create a realistic and actionable business scenario with specific decisions, assumptions, and objectives.
    `
    
    try {
      const result = await generateObject({
        model: openai('gpt-4o'),
        schema: ScenarioSchema,
        prompt: aiPrompt,
        temperature: 0.7
      })
      
      const scenario: Scenario = {
        id: `scenario-ai-${Date.now()}`,
        tenantId,
        ...result.object,
        createdBy: userId,
        createdAt: new Date(),
        constraints: this.generateDefaultConstraints(digitalTwin),
        status: 'ready'
      }
      
      if (!this.scenarios.has(tenantId)) {
        this.scenarios.set(tenantId, [])
      }
      this.scenarios.get(tenantId)!.push(scenario)
      
      await this.persistScenario(scenario)
      
      return scenario
    } catch (error) {
      this.logger.error('Failed to generate scenario from prompt:', error)
      throw error
    }
  }

  async runSimulation(
    scenarioId: string,
    options?: {
      iterations?: number
      parallel?: boolean
      monteCarlo?: boolean
    }
  ): Promise<SimulationResult> {
    const scenario = await this.getScenario(scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }
    
    this.logger.log(`Running simulation for scenario: ${scenario.name}`)
    
    scenario.status = 'running'
    
    const iterations = options?.iterations || 100
    const runMonteCarlo = options?.monteCarlo !== false
    
    const outcomes: SimulationOutcome[] = []
    const digitalTwin = await this.digitalTwinService.getDigitalTwin(scenario.tenantId)
    
    if (!digitalTwin) {
      throw new Error('Digital twin not found')
    }
    
    for (let i = 0; i < iterations; i++) {
      const outcome = await this.simulateIteration(scenario, digitalTwin, i)
      outcomes.push(outcome)
    }
    
    const statistics = this.calculateStatistics(outcomes)
    const insights = await this.extractInsights(outcomes, scenario)
    const recommendations = await this.generateRecommendations(scenario, statistics, insights)
    const sensitivity = this.performSensitivityAnalysis(outcomes, scenario)
    
    let monteCarlo: MonteCarloResult | undefined
    if (runMonteCarlo) {
      monteCarlo = await this.runMonteCarloSimulation(scenario, digitalTwin, 1000)
    }
    
    const result: SimulationResult = {
      id: `sim-${Date.now()}`,
      scenarioId,
      startedAt: new Date(),
      completedAt: new Date(),
      iterations,
      convergence: this.calculateConvergence(outcomes),
      outcomes,
      statistics,
      insights,
      recommendations,
      sensitivity,
      monteCarlo
    }
    
    scenario.simulation = result
    scenario.status = 'completed'
    
    await this.persistSimulationResult(result)
    
    return result
  }

  private async simulateIteration(
    scenario: Scenario,
    digitalTwin: BusinessModel,
    iteration: number
  ): Promise<SimulationOutcome> {
    const decisions = this.sampleDecisions(scenario)
    const assumptions = this.sampleAssumptions(scenario)
    
    const modifiedTwin = this.applyScenarioToTwin(digitalTwin, decisions, assumptions)
    const projectedState = await this.projectBusinessState(modifiedTwin, scenario.timeHorizon)
    
    const metrics = this.extractMetrics(projectedState)
    const objectives = this.evaluateObjectives(scenario, metrics)
    const feasible = this.checkFeasibility(scenario, metrics)
    const optimality = this.calculateOptimality(objectives, scenario)
    
    return {
      iteration,
      decisions,
      assumptions,
      projectedState,
      metrics,
      objectives,
      feasible,
      optimality
    }
  }

  private sampleDecisions(scenario: Scenario): Record<string, string> {
    const decisions: Record<string, string> = {}
    
    for (const decision of scenario.decisions) {
      if (decision.selectedOption) {
        decisions[decision.id] = decision.selectedOption
      } else if (decision.options.length > 0) {
        const randomIndex = Math.floor(Math.random() * decision.options.length)
        decisions[decision.id] = decision.options[randomIndex].id
      }
    }
    
    return decisions
  }

  private sampleAssumptions(scenario: Scenario): Record<string, number> {
    const assumptions: Record<string, number> = {}
    
    for (const assumption of scenario.assumptions) {
      assumptions[assumption.variable] = this.sampleFromDistribution(assumption)
    }
    
    return assumptions
  }

  private sampleFromDistribution(assumption: Assumption): number {
    const { distribution, parameters } = assumption.uncertainty
    
    switch (distribution) {
      case 'normal':
        return this.sampleNormal(parameters.mean || assumption.baseValue, parameters.stdDev || 1)
      
      case 'uniform':
        return this.sampleUniform(parameters.min || 0, parameters.max || 100)
      
      case 'triangular':
        return this.sampleTriangular(
          parameters.min || 0,
          parameters.max || 100,
          parameters.mostLikely || assumption.baseValue
        )
      
      case 'exponential':
        return this.sampleExponential(parameters.mean || assumption.baseValue)
      
      default:
        return assumption.baseValue
    }
  }

  private sampleNormal(mean: number, stdDev: number): number {
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return mean + z * stdDev
  }

  private sampleUniform(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }

  private sampleTriangular(min: number, max: number, mode: number): number {
    const u = Math.random()
    const fc = (mode - min) / (max - min)
    
    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min))
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
    }
  }

  private sampleExponential(mean: number): number {
    return -mean * Math.log(Math.random())
  }

  private applyScenarioToTwin(
    twin: BusinessModel,
    decisions: Record<string, string>,
    assumptions: Record<string, number>
  ): BusinessModel {
    const modified = JSON.parse(JSON.stringify(twin))
    
    for (const [key, value] of Object.entries(assumptions)) {
      if (modified.state.current.metrics[key] !== undefined) {
        modified.state.current.metrics[key] = value
      }
    }
    
    return modified
  }

  private async projectBusinessState(
    twin: BusinessModel,
    horizonMonths: number
  ): Promise<BusinessState> {
    const currentMetrics = twin.state.current.metrics
    const growthRate = 0.05
    
    const projectedMetrics: Record<string, number> = {}
    for (const [key, value] of Object.entries(currentMetrics)) {
      projectedMetrics[key] = value * Math.pow(1 + growthRate, horizonMonths / 12)
    }
    
    return {
      timestamp: new Date(Date.now() + horizonMonths * 30 * 24 * 60 * 60 * 1000),
      metrics: projectedMetrics,
      health: twin.state.current.health * (1 + growthRate * horizonMonths / 12),
      risks: twin.state.current.risks,
      opportunities: twin.state.current.opportunities
    }
  }

  private extractMetrics(state: BusinessState): Record<string, number> {
    return state.metrics
  }

  private evaluateObjectives(scenario: Scenario, metrics: Record<string, number>): Record<string, number> {
    const objectives: Record<string, number> = {}
    
    for (const objective of scenario.objectives) {
      const value = metrics[objective.metric] || 0
      const achievement = objective.minimize
        ? Math.max(0, 1 - value / objective.target)
        : Math.min(1, value / objective.target)
      
      objectives[objective.id] = achievement * objective.weight
    }
    
    return objectives
  }

  private checkFeasibility(scenario: Scenario, metrics: Record<string, number>): boolean {
    for (const constraint of scenario.constraints) {
      if (constraint.hard) {
        const value = metrics[constraint.type] || 0
        if (value > constraint.limit) {
          return false
        }
      }
    }
    
    return true
  }

  private calculateOptimality(objectives: Record<string, number>, scenario: Scenario): number {
    const totalWeight = scenario.objectives.reduce((sum, obj) => sum + obj.weight, 0)
    const weightedSum = Object.values(objectives).reduce((sum, val) => sum + val, 0)
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  private calculateStatistics(outcomes: SimulationOutcome[]): SimulationStatistics {
    const metrics: Record<string, number[]> = {}
    
    for (const outcome of outcomes) {
      for (const [key, value] of Object.entries(outcome.metrics)) {
        if (!metrics[key]) metrics[key] = []
        metrics[key].push(value)
      }
    }
    
    const stats: any = {
      mean: {},
      median: {},
      stdDev: {},
      percentiles: { p5: {}, p25: {}, p75: {}, p95: {} }
    }
    
    for (const [key, values] of Object.entries(metrics)) {
      const sorted = values.sort((a, b) => a - b)
      stats.mean[key] = values.reduce((a, b) => a + b, 0) / values.length
      stats.median[key] = sorted[Math.floor(sorted.length / 2)]
      stats.stdDev[key] = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - stats.mean[key], 2), 0) / values.length
      )
      stats.percentiles.p5[key] = sorted[Math.floor(sorted.length * 0.05)]
      stats.percentiles.p25[key] = sorted[Math.floor(sorted.length * 0.25)]
      stats.percentiles.p75[key] = sorted[Math.floor(sorted.length * 0.75)]
      stats.percentiles.p95[key] = sorted[Math.floor(sorted.length * 0.95)]
    }
    
    const successCount = outcomes.filter(o => o.feasible && o.optimality > 0.7).length
    stats.successRate = successCount / outcomes.length
    
    const revenues = outcomes.map(o => o.metrics.revenue || 0)
    const costs = outcomes.map(o => o.metrics.cost || 0)
    const rois = revenues.map((r, i) => costs[i] > 0 ? (r - costs[i]) / costs[i] : 0)
    stats.averageROI = rois.reduce((a, b) => a + b, 0) / rois.length
    
    stats.riskAdjustedReturn = stats.averageROI / (stats.stdDev.revenue || 1)
    
    return stats
  }

  private async extractInsights(
    outcomes: SimulationOutcome[],
    scenario: Scenario
  ): Promise<SimulationInsight[]> {
    const insights: SimulationInsight[] = []
    
    const successfulOutcomes = outcomes.filter(o => o.optimality > 0.8)
    if (successfulOutcomes.length > 0) {
      const commonDecisions = this.findCommonDecisions(successfulOutcomes)
      if (commonDecisions.length > 0) {
        insights.push({
          type: 'opportunity',
          title: 'Key Success Factors Identified',
          description: `Decisions ${commonDecisions.join(', ')} appear in ${(successfulOutcomes.length / outcomes.length * 100).toFixed(0)}% of successful outcomes`,
          impact: 'high',
          confidence: 0.85,
          evidence: commonDecisions
        })
      }
    }
    
    const failedOutcomes = outcomes.filter(o => !o.feasible)
    if (failedOutcomes.length > outcomes.length * 0.2) {
      insights.push({
        type: 'risk',
        title: 'High Failure Rate Detected',
        description: `${(failedOutcomes.length / outcomes.length * 100).toFixed(0)}% of simulations resulted in infeasible outcomes`,
        impact: 'high',
        confidence: 0.9,
        evidence: ['Constraint violations detected']
      })
    }
    
    return insights
  }

  private findCommonDecisions(outcomes: SimulationOutcome[]): string[] {
    const decisionCounts: Record<string, number> = {}
    
    for (const outcome of outcomes) {
      for (const [key, value] of Object.entries(outcome.decisions)) {
        const decisionKey = `${key}:${value}`
        decisionCounts[decisionKey] = (decisionCounts[decisionKey] || 0) + 1
      }
    }
    
    const threshold = outcomes.length * 0.7
    return Object.entries(decisionCounts)
      .filter(([_, count]) => count > threshold)
      .map(([key]) => key)
  }

  private async generateRecommendations(
    scenario: Scenario,
    statistics: SimulationStatistics,
    insights: SimulationInsight[]
  ): Promise<StrategicRecommendation[]> {
    const recommendations: StrategicRecommendation[] = []
    
    if (statistics.successRate > 0.7) {
      recommendations.push({
        id: 'rec-1',
        priority: 1,
        title: 'Proceed with Implementation',
        description: `Scenario shows ${(statistics.successRate * 100).toFixed(0)}% probability of success`,
        actions: ['Finalize decision selection', 'Allocate resources', 'Begin phased implementation'],
        expectedOutcome: `Average ROI of ${(statistics.averageROI * 100).toFixed(0)}%`,
        requiredResources: ['Budget approval', 'Team allocation'],
        timeline: `${scenario.timeHorizon} months`,
        supportingData: [
          {
            metric: 'Success Rate',
            improvement: statistics.successRate,
            confidence: 0.85
          }
        ]
      })
    }
    
    return recommendations
  }

  private performSensitivityAnalysis(
    outcomes: SimulationOutcome[],
    scenario: Scenario
  ): SensitivityAnalysis[] {
    const analyses: SensitivityAnalysis[] = []
    
    for (const assumption of scenario.assumptions) {
      const values = outcomes.map(o => o.assumptions[assumption.variable])
      const impacts: any[] = []
      
      for (const [metric, metricValues] of Object.entries(this.groupMetricsByAssumption(outcomes, assumption.variable))) {
        const correlation = this.calculateCorrelation(values, metricValues as number[])
        const elasticity = this.calculateElasticity(values, metricValues as number[])
        
        impacts.push({
          metric,
          elasticity,
          correlation
        })
      }
      
      analyses.push({
        variable: assumption.variable,
        baseValue: assumption.baseValue,
        impact: impacts,
        criticalThresholds: this.findCriticalThresholds(values, outcomes)
      })
    }
    
    return analyses
  }

  private groupMetricsByAssumption(
    outcomes: SimulationOutcome[],
    variable: string
  ): Record<string, number[]> {
    const grouped: Record<string, number[]> = {}
    
    for (const outcome of outcomes) {
      for (const [metric, value] of Object.entries(outcome.metrics)) {
        if (!grouped[metric]) grouped[metric] = []
        grouped[metric].push(value)
      }
    }
    
    return grouped
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)
    
    const num = n * sumXY - sumX * sumY
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return den === 0 ? 0 : num / den
  }

  private calculateElasticity(x: number[], y: number[]): number {
    const avgX = x.reduce((a, b) => a + b, 0) / x.length
    const avgY = y.reduce((a, b) => a + b, 0) / y.length
    
    if (avgX === 0 || avgY === 0) return 0
    
    const dX = x[x.length - 1] - x[0]
    const dY = y[y.length - 1] - y[0]
    
    return (dY / avgY) / (dX / avgX)
  }

  private findCriticalThresholds(values: number[], outcomes: SimulationOutcome[]): number[] {
    const thresholds: number[] = []
    const sorted = values.sort((a, b) => a - b)
    
    for (let i = 1; i < sorted.length; i++) {
      const prevFeasible = outcomes[i - 1].feasible
      const currFeasible = outcomes[i].feasible
      
      if (prevFeasible !== currFeasible) {
        thresholds.push((sorted[i - 1] + sorted[i]) / 2)
      }
    }
    
    return thresholds
  }

  private async runMonteCarloSimulation(
    scenario: Scenario,
    digitalTwin: BusinessModel,
    iterations: number
  ): Promise<MonteCarloResult> {
    this.logger.log(`Running Monte Carlo simulation with ${iterations} iterations`)
    
    const outcomes: SimulationOutcome[] = []
    for (let i = 0; i < iterations; i++) {
      const outcome = await this.simulateIteration(scenario, digitalTwin, i)
      outcomes.push(outcome)
    }
    
    const distributions = this.calculateDistributions(outcomes)
    const successCount = outcomes.filter(o => o.feasible && o.optimality > 0.7).length
    
    return {
      iterations,
      seed: Date.now(),
      distributions,
      probabilityOfSuccess: successCount / iterations,
      valueAtRisk: this.calculateVaR(outcomes, 0.95),
      conditionalValueAtRisk: this.calculateCVaR(outcomes, 0.95)
    }
  }

  private calculateDistributions(outcomes: SimulationOutcome[]): any[] {
    const distributions: any[] = []
    const metricNames = Object.keys(outcomes[0].metrics)
    
    for (const metric of metricNames) {
      const values = outcomes.map(o => o.metrics[metric])
      const histogram = this.createHistogram(values, 20)
      const statistics = this.calculateDistributionStats(values)
      
      distributions.push({
        metric,
        histogram,
        statistics
      })
    }
    
    return distributions
  }

  private createHistogram(values: number[], bins: number): { bin: number; frequency: number }[] {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const binWidth = (max - min) / bins
    
    const histogram: { bin: number; frequency: number }[] = []
    
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth
      const binEnd = binStart + binWidth
      const frequency = values.filter(v => v >= binStart && v < binEnd).length
      
      histogram.push({
        bin: binStart + binWidth / 2,
        frequency
      })
    }
    
    return histogram
  }

  private calculateDistributionStats(values: number[]): any {
    const n = values.length
    const mean = values.reduce((a, b) => a + b, 0) / n
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
    
    const m3 = values.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / n
    const m4 = values.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) / n
    
    const skewness = m3 / Math.pow(variance, 1.5)
    const kurtosis = m4 / Math.pow(variance, 2) - 3
    
    return { mean, variance, skewness, kurtosis }
  }

  private calculateVaR(outcomes: SimulationOutcome[], confidence: number): number {
    const returns = outcomes.map(o => o.metrics.revenue || 0)
    const sorted = returns.sort((a, b) => a - b)
    const index = Math.floor((1 - confidence) * sorted.length)
    
    return sorted[index]
  }

  private calculateCVaR(outcomes: SimulationOutcome[], confidence: number): number {
    const returns = outcomes.map(o => o.metrics.revenue || 0)
    const sorted = returns.sort((a, b) => a - b)
    const index = Math.floor((1 - confidence) * sorted.length)
    
    const tail = sorted.slice(0, index + 1)
    return tail.reduce((a, b) => a + b, 0) / tail.length
  }

  private calculateConvergence(outcomes: SimulationOutcome[]): number {
    if (outcomes.length < 10) return 0
    
    const windowSize = Math.floor(outcomes.length / 10)
    const windows: number[] = []
    
    for (let i = 0; i < outcomes.length - windowSize; i += windowSize) {
      const window = outcomes.slice(i, i + windowSize)
      const avgOptimality = window.reduce((sum, o) => sum + o.optimality, 0) / window.length
      windows.push(avgOptimality)
    }
    
    const variance = this.calculateVariance(windows)
    return Math.max(0, 1 - variance)
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  }

  private generateDefaultConstraints(twin: BusinessModel): ScenarioConstraint[] {
    return [
      {
        type: 'budget',
        description: 'Maximum available budget',
        limit: twin.structure.departments.reduce((sum, d) => sum + d.budget, 0) * 1.2,
        unit: 'USD',
        hard: true
      },
      {
        type: 'resource',
        description: 'Maximum headcount',
        limit: twin.structure.departments.reduce((sum, d) => sum + d.headcount, 0) * 1.5,
        unit: 'people',
        hard: false
      }
    ]
  }

  async getScenarios(tenantId: string): Promise<Scenario[]> {
    return this.scenarios.get(tenantId) || []
  }

  async getScenario(scenarioId: string): Promise<Scenario | null> {
    for (const scenarios of this.scenarios.values()) {
      const scenario = scenarios.find(s => s.id === scenarioId)
      if (scenario) return scenario
    }
    
    return this.loadScenario(scenarioId)
  }

  private async persistScenario(scenario: Scenario): Promise<void> {
    try {
      await this.dataSource.query(
        'INSERT INTO scenarios (id, tenantId, data, created_at) VALUES (?, ?, ?, ?)',
        [scenario.id, scenario.tenantId, JSON.stringify(scenario), scenario.createdAt]
      )
    } catch (error) {
      this.logger.warn('Scenarios table not ready, keeping in memory')
    }
  }

  private async loadScenario(scenarioId: string): Promise<Scenario | null> {
    try {
      const result = await this.dataSource.query(
        'SELECT data FROM scenarios WHERE id = ?',
        [scenarioId]
      )
      
      if (result && result.length > 0) {
        return JSON.parse(result[0].data)
      }
    } catch (error) {
      this.logger.warn('Could not load scenario from database')
    }
    
    return null
  }

  private async persistSimulationResult(result: SimulationResult): Promise<void> {
    try {
      await this.dataSource.query(
        'INSERT INTO simulation_results (id, scenarioId, data, completed_at) VALUES (?, ?, ?, ?)',
        [result.id, result.scenarioId, JSON.stringify(result), result.completedAt]
      )
    } catch (error) {
      this.logger.warn('Simulation results table not ready')
    }
  }
}