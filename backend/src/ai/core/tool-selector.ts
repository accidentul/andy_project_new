import { Injectable } from '@nestjs/common'
import { QueryIntent, QueryAnalysis, QueryAnalyzer } from './query-analyzer'
import { ToolRegistry } from '../tools/tool-registry'
import { BaseTool, ToolContext } from '../tools/base.tool'

export interface ToolSelection {
  tool: BaseTool
  params: any
  confidence: number
  reasoning: string
}

export interface ExecutionPlan {
  primary: ToolSelection
  secondary?: ToolSelection[]
  followUp?: ToolSelection[]
}

@Injectable()
export class ToolSelector {
  constructor(
    private queryAnalyzer: QueryAnalyzer,
    private toolRegistry: ToolRegistry
  ) {}

  selectTools(query: string, userRole: string, context?: any): ExecutionPlan {
    const analysis = this.queryAnalyzer.analyze(query)
    const refinedAnalysis = context ? this.queryAnalyzer.refineWithContext(analysis, context) : analysis

    // Get available tools for the user's role
    const availableTools = this.toolRegistry.getToolsForRole(userRole)
    
    // Map intent to tools - pass the original query
    const toolMapping = this.mapIntentToTools(refinedAnalysis, availableTools, query)
    
    return this.createExecutionPlan(toolMapping, refinedAnalysis, query)
  }

  private mapIntentToTools(analysis: QueryAnalysis, availableTools: BaseTool[], originalQuery: string): ToolSelection[] {
    const selections: ToolSelection[] = []
    const lowerQuery = originalQuery.toLowerCase()
    
    console.log('[ToolSelector] Analyzing query:', lowerQuery)
    console.log('[ToolSelector] Available tools:', availableTools.map(t => t.name))

    // Check for complex cross-table queries first
    const isComplex = this.isComplexQuery(lowerQuery, analysis)
    console.log('[ToolSelector] Is complex query?', isComplex)
    
    if (isComplex) {
      const crossTableTool = availableTools.find(t => t.name === 'cross_table_analytics')
      console.log('[ToolSelector] CrossTableTool found?', !!crossTableTool)
      
      if (crossTableTool) {
        selections.push({
          tool: crossTableTool,
          params: {
            query: originalQuery, // Use original query with proper casing
            visualize: lowerQuery.includes('chart') || lowerQuery.includes('graph') || lowerQuery.includes('pie'),
            includeRawData: lowerQuery.includes('details') || lowerQuery.includes('show all'),
          },
          confidence: 0.95,
          reasoning: 'Complex query requiring cross-table analytics with JOINs'
        })
        console.log('[ToolSelector] Selected CrossTableAnalyticsTool')
        return selections // Return early for complex queries
      }
    }

    switch (analysis.intent) {
      case QueryIntent.ANALYZE_WIN_LOSS:
        const winLossTool = availableTools.find(t => t.name === 'analyze_win_loss_rate')
        if (winLossTool) {
          selections.push({
            tool: winLossTool,
            params: {
              timeframe: analysis.entities.timeframe || 'all_time',
              segmentBy: this.extractSegment(analysis.entities),
              includeReasons: true,
            },
            confidence: 0.9,
            reasoning: 'User asking about win/loss rates and patterns'
          })
        }

        // Also get lost deals for context
        const lostDealsTool = availableTools.find(t => t.name === 'get_lost_deals')
        if (lostDealsTool) {
          selections.push({
            tool: lostDealsTool,
            params: {
              limit: 10,
              includeReasons: true,
            },
            confidence: 0.7,
            reasoning: 'Provide context on lost deals for win/loss analysis'
          })
        }
        break

      case QueryIntent.GET_LOST_DEALS:
        const getLostTool = availableTools.find(t => t.name === 'get_lost_deals')
        if (getLostTool) {
          selections.push({
            tool: getLostTool,
            params: {
              limit: this.extractLimit(originalQuery) || 15,
              timeframe: analysis.entities.timeframe,
              includeReasons: true,
            },
            confidence: 0.95,
            reasoning: 'User specifically asking for lost deals information'
          })
        }
        break

      case QueryIntent.ANALYZE_PERFORMANCE:
      case QueryIntent.ANALYZE_METRICS:
        const pipelineTool = availableTools.find(t => t.name === 'analyze_pipeline_health')
        if (pipelineTool) {
          selections.push({
            tool: pipelineTool,
            params: {
              includeRisks: true,
              includeOpportunities: true,
              forecastPeriod: this.extractForecastPeriod(analysis.entities.timeframe),
            },
            confidence: 0.85,
            reasoning: 'Comprehensive pipeline analysis for performance metrics'
          })
        }
        break

      case QueryIntent.FORECAST_REVENUE:
        const forecastTool = availableTools.find(t => t.name === 'forecast_revenue')
        if (forecastTool) {
          selections.push({
            tool: forecastTool,
            params: {
              period: this.extractForecastPeriod(analysis.entities.timeframe) || 'quarter',
              scenario: this.extractScenario(originalQuery) || 'realistic',
              includeBreakdown: true,
            },
            confidence: 0.9,
            reasoning: 'User requesting revenue forecasting'
          })
        }
        break

      case QueryIntent.ANALYZE_TRENDS:
        const trendsTool = availableTools.find(t => t.name === 'analyze_trends')
        if (trendsTool) {
          selections.push({
            tool: trendsTool,
            params: {
              metric: this.extractMetric(analysis.entities.metrics) || 'revenue',
              timeframe: this.extractTimeframe(analysis.entities.timeframe) || 'month',
              periods: 12,
            },
            confidence: 0.8,
            reasoning: 'User asking for trend analysis over time'
          })
        }
        break

      case QueryIntent.GET_DEALS:
        const dealsTool = availableTools.find(t => t.name === 'get_crm_deals')
        if (dealsTool) {
          selections.push({
            tool: dealsTool,
            params: {
              limit: this.extractLimit(originalQuery) || 20,
              stage: this.extractStage(analysis.entities.dealStages),
              includeActivities: false,
            },
            confidence: 0.85,
            reasoning: 'User requesting deal information'
          })
        }
        break

      case QueryIntent.GET_TOP_DEALS:
        const topDealsTool = availableTools.find(t => t.name === 'get_top_deals')
        if (topDealsTool) {
          selections.push({
            tool: topDealsTool,
            params: {
              limit: this.extractLimit(originalQuery) || 10,
              orderBy: 'amount',
              direction: 'DESC',
              includeDetails: true,
            },
            confidence: 0.95,
            reasoning: 'User requesting top/best earning deals'
          })
        }
        break

      case QueryIntent.RECOMMEND_ACTIONS:
        // For recommendations, we often need to analyze current state first
        if (lowerQuery.includes('win rate') || lowerQuery.includes('conversion')) {
          const winLossRecommendTool = availableTools.find(t => t.name === 'analyze_win_loss_rate')
          if (winLossRecommendTool) {
            selections.push({
              tool: winLossRecommendTool,
              params: {
                timeframe: 'all_time',
                includeReasons: true,
              },
              confidence: 0.8,
              reasoning: 'Analyze win/loss to provide targeted recommendations'
            })
          }
        } else if (lowerQuery.includes('pipeline') || lowerQuery.includes('health')) {
          const pipelineRecommendTool = availableTools.find(t => t.name === 'analyze_pipeline_health')
          if (pipelineRecommendTool) {
            selections.push({
              tool: pipelineRecommendTool,
              params: {
                includeRisks: true,
                includeOpportunities: true,
              },
              confidence: 0.8,
              reasoning: 'Analyze pipeline health to provide actionable recommendations'
            })
          }
        }
        break

      case QueryIntent.EXPLAIN_WHY:
        // Context-dependent explanations
        if (lowerQuery.includes('lost') || lowerQuery.includes('lose')) {
          const explainLossTool = availableTools.find(t => t.name === 'get_lost_deals')
          if (explainLossTool) {
            selections.push({
              tool: explainLossTool,
              params: {
                limit: 20,
                includeReasons: true,
              },
              confidence: 0.75,
              reasoning: 'Get lost deals with reasons to explain why deals are being lost'
            })
          }
        }
        break

      default:
        // For general queries, try to match based on keywords
        if (lowerQuery.includes('pipeline') || lowerQuery.includes('health')) {
          const generalPipelineTool = availableTools.find(t => t.name === 'analyze_pipeline_health')
          if (generalPipelineTool) {
            selections.push({
              tool: generalPipelineTool,
              params: {},
              confidence: 0.6,
              reasoning: 'General pipeline inquiry'
            })
          }
        } else if (lowerQuery.includes('deal') || lowerQuery.includes('opportunity')) {
          const generalDealsTool = availableTools.find(t => t.name === 'get_crm_deals')
          if (generalDealsTool) {
            selections.push({
              tool: generalDealsTool,
              params: { limit: 15 },
              confidence: 0.5,
              reasoning: 'General deals inquiry'
            })
          }
        }
        break
    }

    return selections
  }

  private createExecutionPlan(selections: ToolSelection[], analysis: QueryAnalysis, query: string): ExecutionPlan {
    if (selections.length === 0) {
      throw new Error('No suitable tools found for the query')
    }

    // Sort by confidence
    selections.sort((a, b) => b.confidence - a.confidence)

    const plan: ExecutionPlan = {
      primary: selections[0],
    }

    // Add secondary tools (lower confidence but still relevant)
    const secondary = selections.slice(1, 3).filter(s => s.confidence > 0.6)
    if (secondary.length > 0) {
      plan.secondary = secondary
    }

    // Add follow-up tools based on analysis
    const followUp = this.selectFollowUpTools(analysis, selections, query)
    if (followUp.length > 0) {
      plan.followUp = followUp
    }

    return plan
  }

  private selectFollowUpTools(analysis: QueryAnalysis, usedSelections: ToolSelection[], query: string): ToolSelection[] {
    const followUp: ToolSelection[] = []
    const usedToolNames = usedSelections.map(s => s.tool.name)

    // If we analyzed win/loss, might want to suggest forecasting
    if (usedToolNames.includes('analyze_win_loss_rate') && !usedToolNames.includes('forecast_revenue')) {
      // Note: We can't get tools here without the registry, so this is more conceptual
      // In a real implementation, we'd pass available tools to this method
    }

    // If we looked at current performance, might want trend analysis
    if (usedToolNames.includes('analyze_pipeline_health') && !usedToolNames.includes('analyze_trends')) {
      // Similar note as above
    }

    return followUp
  }

  // Utility methods to extract parameters from query analysis
  private extractSegment(entities: any): string | undefined {
    if (entities.dealStages && entities.dealStages.length > 0) return 'stage'
    if (entities.comparison) return 'amount'
    return undefined
  }

  private extractLimit(query: string): number | undefined {
    const match = query.match(/(\d+)/)
    return match ? parseInt(match[1]) : undefined
  }

  private extractForecastPeriod(timeframe?: string): 'month' | 'quarter' | 'year' {
    if (!timeframe) return 'quarter'
    if (timeframe.includes('month')) return 'month'
    if (timeframe.includes('year')) return 'year'
    return 'quarter'
  }

  private extractScenario(query: string): 'conservative' | 'realistic' | 'optimistic' | undefined {
    if (query.includes('conservative') || query.includes('worst')) return 'conservative'
    if (query.includes('optimistic') || query.includes('best')) return 'optimistic'
    if (query.includes('realistic') || query.includes('likely')) return 'realistic'
    return undefined
  }

  private extractMetric(metrics?: string[]): string | undefined {
    if (!metrics || metrics.length === 0) return undefined
    
    // Map common metrics to tool parameters
    const metricMap: { [key: string]: string } = {
      'revenue': 'revenue',
      'pipeline': 'pipeline',
      'deals': 'deals',
      'win rate': 'win_rate',
      'conversion': 'win_rate',
      'cycle time': 'cycle_time',
      'velocity': 'cycle_time',
    }

    for (const metric of metrics) {
      if (metricMap[metric.toLowerCase()]) {
        return metricMap[metric.toLowerCase()]
      }
    }

    return undefined
  }

  private extractTimeframe(timeframe?: string): 'week' | 'month' | 'quarter' | 'year' | undefined {
    if (!timeframe) return undefined
    if (timeframe.includes('week')) return 'week'
    if (timeframe.includes('month')) return 'month'
    if (timeframe.includes('quarter')) return 'quarter'
    if (timeframe.includes('year')) return 'year'
    return undefined
  }

  private extractStage(dealStages?: string[]): string | undefined {
    if (!dealStages || dealStages.length === 0) return undefined
    
    // Capitalize first letter to match CRM stage format
    const stage = dealStages[0]
    return stage.charAt(0).toUpperCase() + stage.slice(1)
  }

  private isComplexQuery(query: string, analysis: QueryAnalysis): boolean {
    // Check for visualization requests first
    if (/chart|graph|pie|bar|line|scatter|plot|visuali[zs]/i.test(query)) {
      console.log('[ToolSelector] Complex query detected: visualization request')
      return true
    }
    
    // Check for indicators of complex queries
    const complexIndicators = [
      /compare.*across/i,
      /compare.*performance/i,
      /join/i,
      /breakdown.*by/i,
      /distribution.*by/i,
      /group.*by/i,
      /aggregate/i,
      /correlation/i,
      /relationship/i,
      /combined/i,
      /multiple.*(?:table|source)/i,
      /cross-reference/i,
      /analyze.*with.*and/i,
      /show.*by.*and/i,
      /trend.*with.*breakdown/i,
      /monthly.*revenue.*trend/i,
    ]

    // Check if query contains complex patterns
    for (const pattern of complexIndicators) {
      if (pattern.test(query)) {
        console.log('[ToolSelector] Complex query detected: pattern match', pattern)
        return true
      }
    }

    // Check if query mentions multiple entity types
    const entityTypes = [
      query.includes('deal') || query.includes('opportunity'),
      query.includes('user') || query.includes('rep') || query.includes('owner'),
      query.includes('account') || query.includes('company'),
      query.includes('activity') || query.includes('action'),
      query.includes('contact') || query.includes('person'),
      query.includes('department'),
    ]
    const multipleEntities = entityTypes.filter(Boolean).length > 1
    
    if (multipleEntities) {
      console.log('[ToolSelector] Complex query detected: multiple entities')
      return true
    }

    // Check for aggregation keywords with grouping
    const hasAggregation = /sum|total|average|count|max|min|distribution/i.test(query)
    const hasGrouping = /by stage|by owner|by department|per|for each|group|monthly|across months/i.test(query)
    
    if (hasAggregation && hasGrouping) {
      console.log('[ToolSelector] Complex query detected: aggregation with grouping')
      return true
    }

    return false
  }
}