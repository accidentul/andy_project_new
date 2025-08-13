import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { DigitalTwinService, BusinessModel, BusinessState } from './digital-twin.service'
import { ScenarioService, Scenario, Decision, SimulationResult } from './scenario.service'
import { openai } from '@ai-sdk/openai'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'

export interface DecisionImpactAnalysis {
  id: string
  decisionId: string
  tenantId: string
  analyzedAt: Date
  
  decision: {
    name: string
    description: string
    options: DecisionOptionAnalysis[]
  }
  
  impacts: {
    immediate: Impact[]
    shortTerm: Impact[] // 3-6 months
    longTerm: Impact[] // 12+ months
  }
  
  dependencies: Dependency[]
  constraints: ConstraintAnalysis[]
  
  recommendations: {
    primary: Recommendation
    alternatives: Recommendation[]
    riskMitigation: RiskMitigation[]
  }
  
  confidence: {
    overall: number
    dataQuality: number
    modelAccuracy: number
  }
  
  whatIf: WhatIfAnalysis[]
}

export interface DecisionOptionAnalysis {
  id: string
  name: string
  
  financialImpact: {
    cost: number
    revenue: number
    roi: number
    paybackPeriod: number
    npv: number
    irr: number
  }
  
  operationalImpact: {
    efficiency: number
    capacity: number
    quality: number
    timeToMarket: number
  }
  
  strategicImpact: {
    marketPosition: number
    competitiveAdvantage: number
    customerSatisfaction: number
    brandValue: number
  }
  
  riskProfile: {
    overall: number
    technical: number
    market: number
    execution: number
    financial: number
  }
  
  score: number
  ranking: number
}

export interface Impact {
  area: 'financial' | 'operational' | 'strategic' | 'human' | 'technical' | 'customer'
  metric: string
  baseline: number
  projected: number
  change: number
  changePercent: number
  confidence: number
  explanation: string
}

export interface Dependency {
  type: 'prerequisite' | 'enabler' | 'conflict' | 'synergy'
  target: string
  strength: 'strong' | 'moderate' | 'weak'
  description: string
  critical: boolean
}

export interface ConstraintAnalysis {
  constraint: string
  type: 'budget' | 'resource' | 'time' | 'regulatory' | 'technical'
  current: number
  required: number
  gap: number
  feasible: boolean
  mitigation?: string
}

export interface Recommendation {
  id: string
  title: string
  description: string
  
  option: string
  reasoning: string[]
  
  conditions: string[]
  timeline: {
    preparation: number // days
    implementation: number // days
    realization: number // days
  }
  
  successFactors: string[]
  watchPoints: string[]
  
  confidence: number
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface RiskMitigation {
  risk: string
  probability: number
  impact: number
  strategy: 'avoid' | 'reduce' | 'transfer' | 'accept'
  actions: string[]
  cost: number
  effectiveness: number
}

export interface WhatIfAnalysis {
  scenario: string
  condition: string
  
  impacts: {
    best: Impact[]
    likely: Impact[]
    worst: Impact[]
  }
  
  probability: {
    best: number
    likely: number
    worst: number
  }
  
  recommendations: string[]
}

const ImpactAnalysisSchema = z.object({
  impacts: z.array(z.object({
    area: z.enum(['financial', 'operational', 'strategic', 'human', 'technical', 'customer']),
    metric: z.string(),
    changePercent: z.number(),
    explanation: z.string()
  })),
  recommendation: z.object({
    title: z.string(),
    option: z.string(),
    reasoning: z.array(z.string()),
    successFactors: z.array(z.string()),
    watchPoints: z.array(z.string())
  }),
  risks: z.array(z.object({
    risk: z.string(),
    probability: z.number(),
    impact: z.number(),
    mitigation: z.string()
  }))
})

@Injectable()
export class DecisionImpactService {
  private readonly logger = new Logger(DecisionImpactService.name)
  private readonly discountRate = 0.1 // 10% discount rate for NPV

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private digitalTwinService: DigitalTwinService,
    private scenarioService: ScenarioService
  ) {}

  async analyzeDecisionImpact(
    tenantId: string,
    decision: Decision,
    context?: {
      scenario?: Scenario
      timeHorizon?: number
      constraints?: any[]
    }
  ): Promise<DecisionImpactAnalysis> {
    this.logger.log(`Analyzing impact for decision: ${decision.name}`)
    
    const digitalTwin = await this.digitalTwinService.getDigitalTwin(tenantId)
    if (!digitalTwin) {
      throw new Error('Digital twin not found')
    }
    
    const optionAnalyses = await this.analyzeOptions(decision, digitalTwin, context)
    const impacts = await this.projectImpacts(decision, digitalTwin, context)
    const dependencies = await this.analyzeDependencies(decision, digitalTwin)
    const constraints = await this.analyzeConstraints(decision, digitalTwin, context)
    const recommendations = await this.generateRecommendations(
      decision,
      optionAnalyses,
      impacts,
      dependencies,
      constraints
    )
    const whatIf = await this.performWhatIfAnalysis(decision, digitalTwin)
    
    const analysis: DecisionImpactAnalysis = {
      id: `analysis-${Date.now()}`,
      decisionId: decision.id,
      tenantId,
      analyzedAt: new Date(),
      decision: {
        name: decision.name,
        description: decision.description,
        options: optionAnalyses
      },
      impacts,
      dependencies,
      constraints,
      recommendations,
      confidence: {
        overall: this.calculateOverallConfidence(optionAnalyses, impacts),
        dataQuality: this.assessDataQuality(digitalTwin),
        modelAccuracy: this.assessModelAccuracy(digitalTwin)
      },
      whatIf
    }
    
    await this.persistAnalysis(analysis)
    
    return analysis
  }

  private async analyzeOptions(
    decision: Decision,
    digitalTwin: BusinessModel,
    context?: any
  ): Promise<DecisionOptionAnalysis[]> {
    const analyses: DecisionOptionAnalysis[] = []
    
    for (const option of decision.options) {
      const financialImpact = this.calculateFinancialImpact(option, digitalTwin)
      const operationalImpact = this.calculateOperationalImpact(option, digitalTwin)
      const strategicImpact = this.calculateStrategicImpact(option, digitalTwin)
      const riskProfile = this.calculateRiskProfile(option)
      
      const score = this.calculateOptionScore(
        financialImpact,
        operationalImpact,
        strategicImpact,
        riskProfile
      )
      
      analyses.push({
        id: option.id,
        name: option.name,
        financialImpact,
        operationalImpact,
        strategicImpact,
        riskProfile,
        score,
        ranking: 0 // Will be set after sorting
      })
    }
    
    // Rank options by score
    analyses.sort((a, b) => b.score - a.score)
    analyses.forEach((analysis, index) => {
      analysis.ranking = index + 1
    })
    
    return analyses
  }

  private calculateFinancialImpact(option: any, digitalTwin: BusinessModel): any {
    const initialCost = option.costs.upfront
    const ongoingCost = option.costs.ongoing
    const revenue = option.benefits.revenue || 0
    
    const cashFlows: number[] = [-initialCost]
    for (let year = 1; year <= 5; year++) {
      cashFlows.push(revenue - ongoingCost)
    }
    
    const npv = this.calculateNPV(cashFlows)
    const irr = this.calculateIRR(cashFlows)
    const roi = initialCost > 0 ? ((revenue * 5 - initialCost - ongoingCost * 5) / initialCost) : 0
    const paybackPeriod = initialCost > 0 ? initialCost / (revenue - ongoingCost) : 0
    
    return {
      cost: initialCost + ongoingCost * 5,
      revenue: revenue * 5,
      roi,
      paybackPeriod,
      npv,
      irr
    }
  }

  private calculateOperationalImpact(option: any, digitalTwin: BusinessModel): any {
    const baselineEfficiency = digitalTwin.structure.processes[0]?.efficiency || 70
    const efficiencyGain = option.benefits.efficiency || 0
    
    return {
      efficiency: baselineEfficiency + efficiencyGain,
      capacity: 100 + (efficiencyGain * 0.5),
      quality: option.benefits.quality || 80,
      timeToMarket: option.timeToImplement
    }
  }

  private calculateStrategicImpact(option: any, digitalTwin: BusinessModel): any {
    const baselinePosition = 50
    const satisfaction = option.benefits.satisfaction || 70
    
    return {
      marketPosition: baselinePosition + (option.benefits.revenue ? 10 : 0),
      competitiveAdvantage: option.benefits.efficiency ? 65 : 50,
      customerSatisfaction: satisfaction,
      brandValue: satisfaction * 0.8
    }
  }

  private calculateRiskProfile(option: any): any {
    const risks = option.risks || []
    
    const avgProbability = risks.length > 0
      ? risks.reduce((sum: number, r: any) => sum + r.probability, 0) / risks.length
      : 0.3
    
    const avgImpact = risks.length > 0
      ? risks.reduce((sum: number, r: any) => sum + r.impact, 0) / risks.length
      : 0.3
    
    return {
      overall: avgProbability * avgImpact,
      technical: 0.3,
      market: 0.25,
      execution: avgProbability,
      financial: avgImpact
    }
  }

  private calculateOptionScore(
    financial: any,
    operational: any,
    strategic: any,
    risk: any
  ): number {
    const financialScore = (financial.roi * 0.3 + (financial.npv > 0 ? 0.3 : 0)) * 100
    const operationalScore = operational.efficiency
    const strategicScore = (strategic.marketPosition + strategic.customerSatisfaction) / 2
    const riskScore = (1 - risk.overall) * 100
    
    return (financialScore * 0.35 + operationalScore * 0.25 + strategicScore * 0.25 + riskScore * 0.15)
  }

  private calculateNPV(cashFlows: number[]): number {
    return cashFlows.reduce((npv, cf, year) => {
      return npv + cf / Math.pow(1 + this.discountRate, year)
    }, 0)
  }

  private calculateIRR(cashFlows: number[]): number {
    let rate = 0.1
    let npv = 0
    let derivative = 0
    
    for (let i = 0; i < 100; i++) {
      npv = 0
      derivative = 0
      
      for (let j = 0; j < cashFlows.length; j++) {
        npv += cashFlows[j] / Math.pow(1 + rate, j)
        derivative -= j * cashFlows[j] / Math.pow(1 + rate, j + 1)
      }
      
      const newRate = rate - npv / derivative
      
      if (Math.abs(newRate - rate) < 0.00001) {
        return newRate
      }
      
      rate = newRate
    }
    
    return rate
  }

  private async projectImpacts(
    decision: Decision,
    digitalTwin: BusinessModel,
    context?: any
  ): Promise<any> {
    const baseline = digitalTwin.state.current
    const immediate: Impact[] = []
    const shortTerm: Impact[] = []
    const longTerm: Impact[] = []
    
    // Financial impacts
    const baseRevenue = baseline.metrics.revenue || 0
    immediate.push({
      area: 'financial',
      metric: 'Investment Required',
      baseline: 0,
      projected: decision.resources.budget || 0,
      change: decision.resources.budget || 0,
      changePercent: 100,
      confidence: 0.95,
      explanation: 'Initial investment for decision implementation'
    })
    
    shortTerm.push({
      area: 'financial',
      metric: 'Revenue',
      baseline: baseRevenue,
      projected: baseRevenue * 1.1,
      change: baseRevenue * 0.1,
      changePercent: 10,
      confidence: 0.75,
      explanation: 'Expected revenue increase from decision benefits'
    })
    
    longTerm.push({
      area: 'financial',
      metric: 'Market Share',
      baseline: 10,
      projected: 12,
      change: 2,
      changePercent: 20,
      confidence: 0.65,
      explanation: 'Long-term market position improvement'
    })
    
    // Operational impacts
    if (decision.resources.headcount) {
      immediate.push({
        area: 'human',
        metric: 'Headcount',
        baseline: digitalTwin.structure.departments[0]?.headcount || 10,
        projected: (digitalTwin.structure.departments[0]?.headcount || 10) + decision.resources.headcount,
        change: decision.resources.headcount,
        changePercent: (decision.resources.headcount / (digitalTwin.structure.departments[0]?.headcount || 10)) * 100,
        confidence: 0.9,
        explanation: 'Additional staff required for implementation'
      })
    }
    
    return { immediate, shortTerm, longTerm }
  }

  private async analyzeDependencies(
    decision: Decision,
    digitalTwin: BusinessModel
  ): Promise<Dependency[]> {
    const dependencies: Dependency[] = []
    
    if (decision.dependencies && decision.dependencies.length > 0) {
      for (const dep of decision.dependencies) {
        dependencies.push({
          type: 'prerequisite',
          target: dep,
          strength: 'strong',
          description: `Decision requires ${dep} to be completed first`,
          critical: true
        })
      }
    }
    
    // Analyze resource dependencies
    if (decision.resources.budget && decision.resources.budget > digitalTwin.structure.departments[0]?.budget) {
      dependencies.push({
        type: 'enabler',
        target: 'Budget Approval',
        strength: 'strong',
        description: 'Requires additional budget allocation',
        critical: true
      })
    }
    
    return dependencies
  }

  private async analyzeConstraints(
    decision: Decision,
    digitalTwin: BusinessModel,
    context?: any
  ): Promise<ConstraintAnalysis[]> {
    const constraints: ConstraintAnalysis[] = []
    
    // Budget constraint
    const availableBudget = digitalTwin.structure.departments[0]?.budget || 1000000
    const requiredBudget = decision.resources.budget || 0
    
    constraints.push({
      constraint: 'Budget',
      type: 'budget',
      current: availableBudget,
      required: requiredBudget,
      gap: requiredBudget - availableBudget,
      feasible: requiredBudget <= availableBudget,
      mitigation: requiredBudget > availableBudget 
        ? 'Seek additional funding or phase implementation'
        : undefined
    })
    
    // Time constraint
    const availableTime = context?.timeHorizon || 365
    const requiredTime = decision.resources.time || 90
    
    constraints.push({
      constraint: 'Time',
      type: 'time',
      current: availableTime,
      required: requiredTime,
      gap: 0,
      feasible: requiredTime <= availableTime
    })
    
    return constraints
  }

  private async generateRecommendations(
    decision: Decision,
    options: DecisionOptionAnalysis[],
    impacts: any,
    dependencies: Dependency[],
    constraints: ConstraintAnalysis[]
  ): Promise<any> {
    const topOption = options[0]
    const feasible = constraints.every(c => c.feasible)
    
    const prompt = `
    Based on this decision analysis, provide strategic recommendations:
    
    Decision: ${decision.name}
    Top Option: ${topOption.name} (Score: ${topOption.score.toFixed(1)})
    Financial ROI: ${(topOption.financialImpact.roi * 100).toFixed(0)}%
    Key Dependencies: ${dependencies.filter(d => d.critical).map(d => d.target).join(', ')}
    Feasibility: ${feasible ? 'Yes' : 'Constrained'}
    
    Generate actionable recommendations with clear reasoning.
    `
    
    try {
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: ImpactAnalysisSchema,
        prompt,
        temperature: 0.3
      })
      
      const primary: Recommendation = {
        id: 'rec-primary',
        title: result.object.recommendation.title,
        description: `Implement ${topOption.name} option`,
        option: topOption.id,
        reasoning: result.object.recommendation.reasoning,
        conditions: dependencies.filter(d => d.critical).map(d => d.description),
        timeline: {
          preparation: 30,
          implementation: decision.resources.time || 90,
          realization: 180
        },
        successFactors: result.object.recommendation.successFactors,
        watchPoints: result.object.recommendation.watchPoints,
        confidence: topOption.score / 100,
        priority: topOption.score > 75 ? 'critical' : topOption.score > 50 ? 'high' : 'medium'
      }
      
      const alternatives: Recommendation[] = options.slice(1, 3).map((opt, i) => ({
        id: `rec-alt-${i}`,
        title: `Alternative: ${opt.name}`,
        description: `Consider ${opt.name} if primary option faces obstacles`,
        option: opt.id,
        reasoning: [`Lower risk profile: ${(1 - opt.riskProfile.overall).toFixed(2)}`],
        conditions: [],
        timeline: { preparation: 30, implementation: 90, realization: 180 },
        successFactors: [],
        watchPoints: [],
        confidence: opt.score / 100,
        priority: 'low'
      }))
      
      const riskMitigation: RiskMitigation[] = result.object.risks.map(r => ({
        risk: r.risk,
        probability: r.probability,
        impact: r.impact,
        strategy: r.probability > 0.5 ? 'reduce' : 'accept',
        actions: [r.mitigation],
        cost: 10000,
        effectiveness: 0.7
      }))
      
      return { primary, alternatives, riskMitigation }
    } catch (error) {
      this.logger.error('Failed to generate AI recommendations:', error)
      
      // Fallback recommendations
      return {
        primary: {
          id: 'rec-primary',
          title: `Proceed with ${topOption.name}`,
          description: `Best option based on analysis`,
          option: topOption.id,
          reasoning: ['Highest overall score', 'Acceptable risk profile'],
          conditions: [],
          timeline: { preparation: 30, implementation: 90, realization: 180 },
          successFactors: ['Executive sponsorship', 'Adequate resources'],
          watchPoints: ['Budget overruns', 'Timeline delays'],
          confidence: 0.75,
          priority: 'high'
        },
        alternatives: [],
        riskMitigation: []
      }
    }
  }

  private async performWhatIfAnalysis(
    decision: Decision,
    digitalTwin: BusinessModel
  ): Promise<WhatIfAnalysis[]> {
    const analyses: WhatIfAnalysis[] = []
    
    // Market conditions scenario
    analyses.push({
      scenario: 'Market Expansion',
      condition: 'Market grows by 20%',
      impacts: {
        best: [
          this.createImpact('financial', 'Revenue', 100000, 150000, 0.8),
          this.createImpact('strategic', 'Market Share', 10, 15, 0.7)
        ],
        likely: [
          this.createImpact('financial', 'Revenue', 100000, 130000, 0.85),
          this.createImpact('strategic', 'Market Share', 10, 12, 0.75)
        ],
        worst: [
          this.createImpact('financial', 'Revenue', 100000, 110000, 0.9),
          this.createImpact('strategic', 'Market Share', 10, 10.5, 0.8)
        ]
      },
      probability: {
        best: 0.2,
        likely: 0.6,
        worst: 0.2
      },
      recommendations: [
        'Prepare for rapid scaling',
        'Secure additional resources',
        'Monitor market indicators closely'
      ]
    })
    
    // Economic downturn scenario
    analyses.push({
      scenario: 'Economic Downturn',
      condition: 'Recession impacts demand',
      impacts: {
        best: [
          this.createImpact('financial', 'Revenue', 100000, 90000, 0.75),
          this.createImpact('operational', 'Efficiency', 70, 75, 0.8)
        ],
        likely: [
          this.createImpact('financial', 'Revenue', 100000, 80000, 0.8),
          this.createImpact('operational', 'Efficiency', 70, 72, 0.85)
        ],
        worst: [
          this.createImpact('financial', 'Revenue', 100000, 60000, 0.7),
          this.createImpact('operational', 'Efficiency', 70, 65, 0.75)
        ]
      },
      probability: {
        best: 0.3,
        likely: 0.5,
        worst: 0.2
      },
      recommendations: [
        'Build cash reserves',
        'Focus on efficiency improvements',
        'Diversify revenue streams'
      ]
    })
    
    return analyses
  }

  private createImpact(
    area: any,
    metric: string,
    baseline: number,
    projected: number,
    confidence: number
  ): Impact {
    return {
      area,
      metric,
      baseline,
      projected,
      change: projected - baseline,
      changePercent: ((projected - baseline) / baseline) * 100,
      confidence,
      explanation: `Projected change in ${metric}`
    }
  }

  private calculateOverallConfidence(
    options: DecisionOptionAnalysis[],
    impacts: any
  ): number {
    const optionConfidence = options.length > 0 ? 0.8 : 0.5
    const impactConfidence = (impacts.immediate.length + impacts.shortTerm.length + impacts.longTerm.length) > 5 ? 0.75 : 0.6
    
    return (optionConfidence + impactConfidence) / 2
  }

  private assessDataQuality(digitalTwin: BusinessModel): number {
    const hasHistoricalData = digitalTwin.state.historical.length > 0
    const metricsCount = Object.keys(digitalTwin.state.current.metrics).length
    const recentUpdate = (Date.now() - digitalTwin.updatedAt.getTime()) < 7 * 24 * 60 * 60 * 1000
    
    let quality = 0.5
    if (hasHistoricalData) quality += 0.2
    if (metricsCount > 5) quality += 0.2
    if (recentUpdate) quality += 0.1
    
    return Math.min(1, quality)
  }

  private assessModelAccuracy(digitalTwin: BusinessModel): number {
    // Simplified accuracy assessment
    const hasCapabilities = digitalTwin.capabilities && 
      (digitalTwin.capabilities.operations.length > 0 ||
       digitalTwin.capabilities.strategic.length > 0)
    
    const hasStructure = digitalTwin.structure.departments.length > 0 &&
      digitalTwin.structure.processes.length > 0
    
    let accuracy = 0.6
    if (hasCapabilities) accuracy += 0.2
    if (hasStructure) accuracy += 0.2
    
    return accuracy
  }

  private async persistAnalysis(analysis: DecisionImpactAnalysis): Promise<void> {
    try {
      await this.dataSource.query(
        'INSERT INTO decision_analyses (id, decisionId, tenantId, data, analyzed_at) VALUES (?, ?, ?, ?, ?)',
        [analysis.id, analysis.decisionId, analysis.tenantId, JSON.stringify(analysis), analysis.analyzedAt]
      )
    } catch (error) {
      this.logger.warn('Decision analyses table not ready, keeping in memory')
    }
  }

  async compareDecisions(
    tenantId: string,
    decisionIds: string[]
  ): Promise<{
    decisions: DecisionImpactAnalysis[]
    comparison: {
      winner: string
      matrix: ComparisonMatrix
      insights: string[]
    }
  }> {
    const analyses: DecisionImpactAnalysis[] = []
    
    for (const id of decisionIds) {
      // Simplified - would need to load actual decisions
      const mockDecision: Decision = {
        id,
        name: `Decision ${id}`,
        category: 'strategic',
        description: 'Mock decision for comparison',
        options: [],
        timing: {
          earliest: new Date(),
          latest: new Date()
        },
        resources: {}
      }
      
      const analysis = await this.analyzeDecisionImpact(tenantId, mockDecision)
      analyses.push(analysis)
    }
    
    const matrix = this.createComparisonMatrix(analyses)
    const winner = this.determineWinner(analyses)
    const insights = this.generateComparisonInsights(analyses, matrix)
    
    return {
      decisions: analyses,
      comparison: {
        winner,
        matrix,
        insights
      }
    }
  }

  private createComparisonMatrix(analyses: DecisionImpactAnalysis[]): ComparisonMatrix {
    const matrix: ComparisonMatrix = {
      criteria: ['ROI', 'Risk', 'Timeline', 'Strategic Value', 'Feasibility'],
      scores: {}
    }
    
    for (const analysis of analyses) {
      const topOption = analysis.decision.options[0]
      matrix.scores[analysis.decisionId] = [
        topOption?.financialImpact.roi || 0,
        1 - (topOption?.riskProfile.overall || 0.5),
        topOption?.operationalImpact.timeToMarket ? 100 / topOption.operationalImpact.timeToMarket : 0,
        topOption?.strategicImpact.marketPosition || 0,
        analysis.confidence.overall
      ]
    }
    
    return matrix
  }

  private determineWinner(analyses: DecisionImpactAnalysis[]): string {
    let bestScore = 0
    let winner = ''
    
    for (const analysis of analyses) {
      const score = analysis.decision.options[0]?.score || 0
      if (score > bestScore) {
        bestScore = score
        winner = analysis.decisionId
      }
    }
    
    return winner
  }

  private generateComparisonInsights(
    analyses: DecisionImpactAnalysis[],
    matrix: ComparisonMatrix
  ): string[] {
    const insights: string[] = []
    
    // Find highest ROI
    let maxROI = 0
    let maxROIDecision = ''
    for (const analysis of analyses) {
      const roi = analysis.decision.options[0]?.financialImpact.roi || 0
      if (roi > maxROI) {
        maxROI = roi
        maxROIDecision = analysis.decision.name
      }
    }
    if (maxROIDecision) {
      insights.push(`${maxROIDecision} offers the highest ROI at ${(maxROI * 100).toFixed(0)}%`)
    }
    
    // Find lowest risk
    let minRisk = 1
    let minRiskDecision = ''
    for (const analysis of analyses) {
      const risk = analysis.decision.options[0]?.riskProfile.overall || 1
      if (risk < minRisk) {
        minRisk = risk
        minRiskDecision = analysis.decision.name
      }
    }
    if (minRiskDecision) {
      insights.push(`${minRiskDecision} has the lowest risk profile`)
    }
    
    return insights
  }
}

interface ComparisonMatrix {
  criteria: string[]
  scores: Record<string, number[]>
}