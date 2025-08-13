import { Injectable } from '@nestjs/common'
import { QueryIntent, QueryAnalysis } from './query-analyzer'
import { ExecutionPlan, ToolSelection } from './tool-selector'

export interface ResponseData {
  content: string
  summary?: string
  metrics?: any
  recommendations?: any[]
  visualizations?: any[]
  followUpQuestions?: string[]
}

@Injectable()
export class ResponseGenerator {
  generateResponse(
    query: string,
    analysis: QueryAnalysis,
    executionPlan: ExecutionPlan,
    toolResults: any[]
  ): ResponseData {
    const primaryResult = toolResults[0]
    
    // Check if this was a cross-table analytics query
    if (executionPlan.primary.tool.name === 'cross_table_analytics') {
      return this.generateCrossTableResponse(query, primaryResult)
    }
    
    // Generate appropriate response based on intent
    switch (analysis.intent) {
      case QueryIntent.ANALYZE_WIN_LOSS:
        return this.generateWinLossResponse(query, primaryResult, toolResults.slice(1))
      
      case QueryIntent.GET_LOST_DEALS:
        return this.generateLostDealsResponse(query, primaryResult)
      
      case QueryIntent.GET_TOP_DEALS:
        return this.generateTopDealsResponse(query, primaryResult)
      
      case QueryIntent.ANALYZE_PERFORMANCE:
      case QueryIntent.ANALYZE_METRICS:
        return this.generatePerformanceResponse(query, primaryResult)
      
      case QueryIntent.FORECAST_REVENUE:
        return this.generateForecastResponse(query, primaryResult)
      
      case QueryIntent.ANALYZE_TRENDS:
        return this.generateTrendsResponse(query, primaryResult)
      
      case QueryIntent.RECOMMEND_ACTIONS:
        return this.generateRecommendationsResponse(query, primaryResult, analysis)
      
      case QueryIntent.EXPLAIN_WHY:
        return this.generateExplanationResponse(query, primaryResult, analysis)
      
      default:
        return this.generateGeneralResponse(query, primaryResult, analysis)
    }
  }

  private generateWinLossResponse(query: string, winLossResult: any, additionalResults: any[]): ResponseData {
    if (!winLossResult?.success || !winLossResult.data) {
      return {
        content: "I couldn't analyze the win/loss data at the moment. Please try again later.",
      }
    }

    const data = winLossResult.data
    const summary = data.summary
    const winRate = parseFloat(summary.winRate)

    let content = `## Win/Loss Analysis\n\n`
    
    // Main metrics
    content += `**Current Performance:**\n`
    content += `• Win Rate: **${summary.winRate}%** (${summary.wonDeals} won, ${summary.lostDeals} lost)\n`
    content += `• Average Deal Size: **$${summary.avgDealSize.toLocaleString()}**\n`
    content += `• Pipeline: ${summary.openDeals} open deals\n\n`

    // Performance assessment
    if (winRate < 20) {
      content += `🚨 **Critical Issue**: Your win rate is significantly below industry average (30%). This requires immediate attention.\n\n`
    } else if (winRate < 30) {
      content += `⚠️ **Below Average**: Your win rate is below the typical 30% industry benchmark.\n\n`
    } else if (winRate > 50) {
      content += `✅ **Strong Performance**: Your win rate is above industry average - well done!\n\n`
    } else {
      content += `📈 **Solid Performance**: Your win rate is healthy but has room for improvement.\n\n`
    }

    // Loss reasons analysis
    if (data.lossReasons && data.lossReasons.length > 0) {
      content += `**Top Loss Reasons:**\n`
      data.lossReasons.slice(0, 3).forEach((reason: any, index: number) => {
        const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
        content += `${emoji} ${reason.reason}: ${reason.percentage}% (${reason.count} deals)\n`
      })
      content += '\n'
    }

    // Patterns and insights
    if (data.patterns && data.patterns.length > 0) {
      content += `**Key Patterns Identified:**\n`
      data.patterns.forEach((pattern: any) => {
        const emoji = pattern.impact === 'high' ? '🔥' : pattern.impact === 'medium' ? '⚡' : '💡'
        content += `${emoji} ${pattern.finding}\n`
      })
      content += '\n'
    }

    // Recommendations section
    const recommendations = data.recommendations || []
    if (recommendations.length > 0) {
      content += `## 🎯 Recommended Actions\n\n`
      recommendations.forEach((rec: any, index: number) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'
        content += `${priority} **${rec.action}**\n`
        content += `   • Expected Impact: ${rec.expectedImpact}\n`
        content += `   • Timeline: ${rec.timeframe}\n\n`
      })
    }

    // Add specific advice for improving win rate
    if (winRate < 35) {
      content += `## 🚀 How to Improve Your Win Rate\n\n`
      content += `1. **Qualify Better**: Focus on prospects who have budget, authority, need, and timeline (BANT)\n`
      content += `2. **Engage Early**: Get involved in the buyer's journey before they've made up their mind\n`
      content += `3. **Understand Competition**: Know who you're up against and your differentiators\n`
      content += `4. **Build Champions**: Identify and nurture internal advocates within prospect organizations\n`
      content += `5. **Improve Discovery**: Ask better questions to uncover pain points and value drivers\n\n`
    }

    return {
      content,
      summary: `Win rate: ${summary.winRate}% with ${summary.totalDeals} total deals analyzed`,
      metrics: {
        winRate: summary.winRate,
        totalDeals: summary.totalDeals,
        wonDeals: summary.wonDeals,
        lostDeals: summary.lostDeals,
        avgDealSize: summary.avgDealSize,
      },
      recommendations,
      followUpQuestions: [
        'What are the main reasons we\'re losing deals?',
        'How does our win rate compare to last quarter?',
        'Which deal stages have the highest drop-off rates?',
        'What\'s the forecast based on current pipeline?'
      ]
    }
  }

  private generateTopDealsResponse(query: string, topDealsResult: any): ResponseData {
    if (!topDealsResult?.success || !topDealsResult.data) {
      return {
        content: "I couldn't retrieve the top deals data at the moment. Please try again later.",
      }
    }

    const data = topDealsResult.data
    const deals = data.deals || []
    const summary = data.summary
    const insights = data.insights || []

    let content = `## Top Earning Deals\n\n`
    
    // Summary stats
    content += `**Performance Summary:**\n`
    content += `• Total Value: **$${summary.totalValue.toLocaleString()}**\n`
    content += `• Average Deal Size: **$${summary.averageValue.toLocaleString()}**\n`
    if (summary.topDeal) {
      content += `• #1 Deal: **${summary.topDeal.name}** - $${summary.topDeal.amount.toLocaleString()} (${summary.topDeal.percentOfTotal}% of total)\n`
    }
    content += `\n`

    // Deal details table
    if (deals.length > 0) {
      content += `**Top ${deals.length} Deals:**\n\n`
      content += `| Rank | Deal Name | Amount | Stage | Size | % of Total |\n`
      content += `|------|-----------|--------|-------|------|------------|\n`
      
      deals.forEach((deal: any) => {
        const formattedAmount = `$${(deal.amount || 0).toLocaleString()}`
        const stage = deal.stage || 'Unknown'
        const sizeIndicator = deal.sizeIndicator || 'N/A'
        const percentOfTotal = deal.percentOfTotal || '0'
        
        content += `| #${deal.rank} | **${deal.name}** | ${formattedAmount} | ${stage} | ${sizeIndicator} | ${percentOfTotal}% |\n`
      })
      content += `\n`

      // Show additional details for top 3
      if (deals.length > 0) {
        content += `**Detailed View - Top 3:**\n\n`
        deals.slice(0, 3).forEach((deal: any) => {
          content += `### #${deal.rank}. ${deal.name}\n`
          content += `• **Amount:** $${(deal.amount || 0).toLocaleString()}\n`
          content += `• **Stage:** ${deal.stage || 'Unknown'}\n`
          content += `• **Close Date:** ${deal.closeDate || 'Not set'}\n`
          content += `• **Size Category:** ${deal.sizeIndicator}\n`
          content += `• **Contribution:** ${deal.percentOfTotal}% of total value\n`
          content += `\n`
        })
      }
    }

    // Insights section
    if (insights.length > 0) {
      content += `## 🔍 Key Insights\n\n`
      insights.forEach((insight: string) => {
        content += `• ${insight}\n`
      })
      content += `\n`
    }

    // Recommendations
    content += `## 🎯 Recommended Actions\n\n`
    if (summary.topDeal && parseFloat(summary.topDeal.percentOfTotal) > 30) {
      content += `• **Diversify Pipeline:** Your top deal represents ${summary.topDeal.percentOfTotal}% of value - reduce concentration risk\n`
    }
    if (deals.filter((d: any) => d.stage !== 'Closed Won').length > deals.length * 0.5) {
      content += `• **Focus on Closing:** ${deals.filter((d: any) => d.stage !== 'Closed Won').length} deals still in progress - prioritize closing activities\n`
    }
    content += `• **Replicate Success:** Analyze what made these top deals successful and apply learnings\n`
    content += `• **Expand Relationships:** Leverage these key accounts for upsell and referral opportunities\n`

    return {
      content,
      summary: `Top ${deals.length} deals worth $${summary.totalValue.toLocaleString()}`,
      metrics: {
        count: deals.length,
        totalValue: summary.totalValue,
        averageValue: summary.averageValue,
        topDealAmount: summary.topDeal?.amount,
      },
      followUpQuestions: [
        'Can you show me the deals by stage?',
        'What are the common characteristics of these top deals?',
        'Which deals are at risk of not closing?',
        'How do these compare to last quarter?'
      ]
    }
  }

  private generateLostDealsResponse(query: string, lostDealsResult: any): ResponseData {
    if (!lostDealsResult?.success || !lostDealsResult.data) {
      return {
        content: "I couldn't retrieve the lost deals data at the moment. Please try again later.",
      }
    }

    const data = lostDealsResult.data
    const deals = data.lostDeals || []
    const summary = data.summary

    let content = `## Lost Deals Analysis\n\n`
    
    // Summary stats
    content += `**Overview:**\n`
    content += `• Total Lost Deals: **${summary.count}**\n`
    content += `• Total Lost Value: **$${summary.totalValue.toLocaleString()}**\n`
    content += `• Average Lost Deal Size: **$${summary.averageValue.toLocaleString()}**\n\n`

    // Top reasons
    if (summary.topReasons && summary.topReasons.length > 0) {
      content += `**Primary Loss Reasons:**\n`
      summary.topReasons.slice(0, 5).forEach((reason: any, index: number) => {
        content += `${index + 1}. ${reason.reason}: ${reason.count} deals (${reason.percentage}%)\n`
      })
      content += '\n'
    }

    // Recent lost deals
    if (deals.length > 0) {
      content += `**Recent Lost Deals:**\n\n`
      deals.slice(0, 8).forEach((deal: any, index: number) => {
        content += `**${index + 1}. ${deal.name}**\n`
        content += `   • Value: $${(deal.amount || 0).toLocaleString()}\n`
        content += `   • Reason: ${deal.lossReason || 'Not specified'}\n`
        if (deal.competitor) {
          content += `   • Lost to: ${deal.competitor}\n`
        }
        content += `   • Days in Pipeline: ${deal.daysInPipeline || 'N/A'}\n\n`
      })
    }

    // Analysis and insights
    const insights = this.generateLostDealsInsights(deals, summary)
    if (insights.length > 0) {
      content += `## 🔍 Key Insights\n\n`
      insights.forEach((insight: string) => {
        content += `• ${insight}\n`
      })
      content += '\n'
    }

    // Actionable recommendations
    content += `## 🎯 What You Can Do\n\n`
    
    if (summary.topReasons && summary.topReasons[0]) {
      const topReason = summary.topReasons[0].reason
      if (topReason === 'Price too high') {
        content += `**Address Pricing Objections:**\n`
        content += `• Develop value-based selling materials showing ROI\n`
        content += `• Create flexible pricing options or packages\n`
        content += `• Train sales team on handling price objections\n\n`
      } else if (topReason === 'Lost to competitor') {
        content += `**Strengthen Competitive Position:**\n`
        content += `• Create competitive battle cards\n`
        content += `• Identify and emphasize unique differentiators\n`
        content += `• Engage earlier in the sales process\n\n`
      }
    }

    content += `**Process Improvements:**\n`
    content += `• Review qualification criteria to avoid future losses\n`
    content += `• Implement deal reviews for at-risk opportunities\n`
    content += `• Follow up on lost deals to understand real reasons\n`
    content += `• Set up win-back campaigns for future opportunities\n`

    return {
      content,
      summary: `${summary.count} lost deals worth $${summary.totalValue.toLocaleString()} analyzed`,
      metrics: {
        totalLostDeals: summary.count,
        totalLostValue: summary.totalValue,
        avgLostValue: summary.averageValue,
      },
      followUpQuestions: [
        'How can we improve our win rate?',
        'What are our competitors doing better?',
        'Which deals could we potentially win back?',
        'How does this compare to last quarter\'s losses?'
      ]
    }
  }

  private generatePerformanceResponse(query: string, performanceResult: any): ResponseData {
    if (!performanceResult?.success || !performanceResult.data) {
      return {
        content: "I couldn't analyze the performance data at the moment. Please try again later.",
      }
    }

    const data = performanceResult.data
    const healthScore = data.healthScore
    const summary = data.summary

    let content = `## Pipeline Health Analysis\n\n`

    // Health score with visual indicator
    const scoreEmoji = healthScore.score >= 80 ? '🟢' : healthScore.score >= 60 ? '🟡' : '🔴'
    content += `${scoreEmoji} **Overall Health Score: ${healthScore.score}/100 (${healthScore.rating})**\n\n`

    // Key metrics
    content += `**Pipeline Overview:**\n`
    content += `• Total Open Deals: **${summary.openDeals}**\n`
    content += `• Total Pipeline Value: **$${summary.totalValue.toLocaleString()}**\n`
    content += `• Average Deal Size: **$${summary.averageDealSize.toLocaleString()}**\n`
    content += `• Coverage Ratio: **${data.balance.coverageRatio}x**\n\n`

    // Stage distribution
    if (data.stageDistribution) {
      content += `**Pipeline Distribution:**\n`
      data.stageDistribution.forEach((stage: any) => {
        if (stage.count > 0) {
          const bar = '▓'.repeat(Math.floor(stage.percentage / 10)) + '░'.repeat(10 - Math.floor(stage.percentage / 10))
          content += `• ${stage.stage}: ${stage.count} deals (${stage.percentage.toFixed(1)}%) [${bar}]\n`
        }
      })
      content += '\n'
    }

    // Velocity insights
    if (data.velocity) {
      content += `**Sales Velocity:**\n`
      content += `• Average Cycle Time: **${data.velocity.averageCycleTime} days** (${data.velocity.trend})\n`
      content += `• Overall Conversion Rate: **${data.velocity.conversionRate}%**\n\n`
    }

    // Risks section
    if (data.risks && data.risks.length > 0) {
      content += `## ⚠️ Identified Risks\n\n`
      data.risks.forEach((risk: any, index: number) => {
        const severity = risk.severity === 'high' ? '🔴' : risk.severity === 'medium' ? '🟡' : '🟢'
        content += `${severity} **${risk.description}**\n`
        content += `   • Value at Risk: $${(risk.value || 0).toLocaleString()}\n`
        content += `   • Recommended Action: ${risk.action}\n\n`
      })
    }

    // Opportunities section
    if (data.opportunities && data.opportunities.length > 0) {
      content += `## 🚀 Opportunities\n\n`
      data.opportunities.forEach((opp: any) => {
        content += `**${opp.description}**\n`
        content += `   • Potential Value: $${(opp.value || 0).toLocaleString()}\n`
        content += `   • Action: ${opp.action}\n`
        content += `   • Probability: ${opp.probability}\n\n`
      })
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      content += `## 🎯 Priority Actions\n\n`
      data.recommendations.forEach((rec: any, index: number) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'
        content += `${priority} **${rec.action}**\n`
        content += `   • Impact: ${rec.impact}\n\n`
      })
    }

    // Forecast
    if (data.forecast) {
      content += `## 📊 Forecast (${data.forecast.period})\n\n`
      content += `• **Likely Outcome:** $${data.forecast.likely.toLocaleString()}\n`
      content += `• **Conservative:** $${data.forecast.committed.toLocaleString()}\n`
      content += `• **Best Case:** $${data.forecast.bestCase.toLocaleString()}\n`
      content += `• **Confidence Level:** ${data.forecast.confidence}\n\n`
    }

    return {
      content,
      summary: `Pipeline health score: ${healthScore.score}/100 with ${summary.openDeals} active deals`,
      metrics: {
        healthScore: healthScore.score,
        rating: healthScore.rating,
        totalValue: summary.totalValue,
        openDeals: summary.openDeals,
        averageDealSize: summary.averageDealSize,
      },
      recommendations: data.recommendations,
      followUpQuestions: [
        'What are the biggest risks in our pipeline?',
        'How can we improve our cycle time?',
        'Which opportunities should we prioritize?',
        'What\'s our revenue forecast for next quarter?'
      ]
    }
  }

  private generateForecastResponse(query: string, forecastResult: any): ResponseData {
    if (!forecastResult?.success || !forecastResult.data) {
      return {
        content: "I couldn't generate the forecast at the moment. Please try again later.",
      }
    }

    const data = forecastResult.data
    const forecast = data.forecast
    const pipeline = data.pipeline
    const historical = data.historical

    let content = `## Revenue Forecast\n\n`

    // Main forecast
    const confidenceEmoji = forecast.confidence === 'high' ? '🟢' : forecast.confidence === 'medium' ? '🟡' : '🟠'
    content += `${confidenceEmoji} **${forecast.scenario.charAt(0).toUpperCase() + forecast.scenario.slice(1)} Forecast (${forecast.period}):** $${forecast.predicted.toLocaleString()}\n\n`

    // Range
    content += `**Forecast Range:**\n`
    content += `• Low: $${forecast.range.low.toLocaleString()}\n`
    content += `• High: $${forecast.range.high.toLocaleString()}\n`
    content += `• Confidence: ${forecast.confidence}\n\n`

    // Components breakdown
    if (forecast.components) {
      content += `**Forecast Components:**\n`
      content += `• Historical Trend: $${forecast.components.historical.toLocaleString()}\n`
      content += `• Weighted Pipeline: $${forecast.components.pipeline.toLocaleString()}\n`
      content += `• Growth Adjustment: $${forecast.components.growth.toLocaleString()}\n\n`
    }

    // Historical context
    content += `**Historical Context:**\n`
    content += `• Historical Revenue: $${historical.totalRevenue.toLocaleString()}\n`
    content += `• Monthly Average: $${historical.avgMonthlyRevenue.toLocaleString()}\n`
    content += `• Closed Deals: ${historical.closedDeals}\n\n`

    // Pipeline analysis
    content += `**Current Pipeline:**\n`
    content += `• Total Pipeline Value: $${pipeline.totalValue.toLocaleString()}\n`
    content += `• Weighted Value: $${pipeline.weightedValue.toLocaleString()}\n`
    content += `• Deal Count: ${pipeline.dealCount}\n\n`

    // Breakdown by stage if available
    if (data.breakdown && data.breakdown.byStage) {
      content += `**Pipeline Breakdown by Stage:**\n`
      data.breakdown.byStage.forEach((stage: any) => {
        if (stage.dealCount > 0) {
          content += `• ${stage.stage}: ${stage.dealCount} deals, $${stage.expectedValue.toLocaleString()} expected\n`
        }
      })
      content += '\n'
    }

    // Key insights
    if (data.insights && data.insights.length > 0) {
      content += `## 🔍 Key Insights\n\n`
      data.insights.forEach((insight: any) => {
        const emoji = insight.impact === 'positive' ? '✅' : insight.impact === 'negative' ? '⚠️' : '📊'
        content += `${emoji} ${insight.message}\n`
      })
      content += '\n'
    }

    // Timeline if available
    if (data.breakdown && data.breakdown.timeline) {
      content += `**Expected Timeline:**\n`
      data.breakdown.timeline.slice(0, 4).forEach((period: any) => {
        content += `• ${period.period}: ~${period.estimatedDealsClosing} deals, $${period.estimatedRevenue.toLocaleString()}\n`
      })
      content += '\n'
    }

    // Assumptions
    if (data.assumptions) {
      content += `## 📋 Key Assumptions\n\n`
      data.assumptions.forEach((assumption: string) => {
        content += `• ${assumption}\n`
      })
      content += '\n'
    }

    return {
      content,
      summary: `${forecast.scenario} ${forecast.period} forecast: $${forecast.predicted.toLocaleString()}`,
      metrics: {
        predicted: forecast.predicted,
        scenario: forecast.scenario,
        period: forecast.period,
        confidence: forecast.confidence,
        pipelineValue: pipeline.totalValue,
        weightedValue: pipeline.weightedValue,
      },
      followUpQuestions: [
        'What if we run a conservative scenario?',
        'Which deals are most likely to close?',
        'How does this compare to our quota?',
        'What could increase our forecast accuracy?'
      ]
    }
  }

  private generateTrendsResponse(query: string, trendsResult: any): ResponseData {
    if (!trendsResult?.success || !trendsResult.data) {
      return {
        content: "I couldn't analyze the trends data at the moment. Please try again later.",
      }
    }

    const data = trendsResult.data
    const analysis = data.analysis
    const trendData = data.trendData || []

    let content = `## ${data.metric.charAt(0).toUpperCase() + data.metric.slice(1)} Trends\n\n`

    // Trend direction
    const trendEmoji = analysis.direction === 'upward' ? '📈' : analysis.direction === 'downward' ? '📉' : '➡️'
    content += `${trendEmoji} **Overall Trend:** ${analysis.direction.charAt(0).toUpperCase() + analysis.direction.slice(1)} (${analysis.changePercent}% change)\n\n`

    // Key metrics
    content += `**Performance Summary:**\n`
    content += `• Average: ${analysis.average}\n`
    content += `• Peak: ${analysis.peak.toLocaleString()}\n`
    content += `• Trough: ${analysis.trough.toLocaleString()}\n`
    content += `• Volatility: ${analysis.volatility}\n\n`

    // Recent performance
    if (analysis.recent && analysis.recent.length > 0) {
      content += `**Recent Performance (Last 3 periods):**\n`
      analysis.recent.forEach((value: number, index: number) => {
        content += `• Period ${index + 1}: ${value.toLocaleString()}\n`
      })
      content += '\n'
    }

    // Visual representation of trend (simple text chart)
    if (trendData.length > 0) {
      content += `**Trend Visualization:**\n\`\`\`\n`
      const values = trendData.map((d: any) => d.value)
      const max = Math.max(...values)
      const min = Math.min(...values)
      const range = max - min
      
      trendData.slice(-8).forEach((point: any) => {
        const normalized = range > 0 ? (point.value - min) / range : 0.5
        const barLength = Math.floor(normalized * 20)
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength)
        content += `${point.period}: ${bar} ${point.value.toLocaleString()}\n`
      })
      content += '```\n\n'
    }

    // Insights
    if (data.insights && data.insights.length > 0) {
      content += `## 🔍 Key Insights\n\n`
      data.insights.forEach((insight: any) => {
        const emoji = insight.type === 'positive' ? '✅' : insight.type === 'negative' ? '⚠️' : insight.type === 'warning' ? '🟡' : '📊'
        content += `${emoji} ${insight.message}\n`
      })
      content += '\n'
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      content += `## 🎯 Recommendations\n\n`
      data.recommendations.forEach((rec: any) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'
        content += `${priority} **${rec.action}**\n`
        content += `   • Impact: ${rec.impact}\n\n`
      })
    }

    return {
      content,
      summary: `${data.metric} trend: ${analysis.direction} with ${analysis.changePercent}% change`,
      metrics: {
        metric: data.metric,
        direction: analysis.direction,
        changePercent: analysis.changePercent,
        average: analysis.average,
        volatility: analysis.volatility,
      },
      recommendations: data.recommendations,
      followUpQuestions: [
        'What\'s driving this trend?',
        'How does this compare to industry benchmarks?',
        'What can we do to improve the trajectory?',
        'Are there any seasonal patterns?'
      ]
    }
  }

  private generateRecommendationsResponse(query: string, result: any, analysis: QueryAnalysis): ResponseData {
    // This method handles when the primary intent is to get recommendations
    // It should analyze the tool results and provide actionable advice
    
    if (!result?.success || !result.data) {
      return {
        content: "I couldn't analyze the data to provide recommendations at the moment. Please try again later.",
      }
    }

    let content = `## 🎯 Recommendations Based on Your Query\n\n`

    // Extract recommendations from the tool result
    const recommendations = result.data.recommendations || []
    
    if (recommendations.length > 0) {
      content += `**Prioritized Action Items:**\n\n`
      recommendations.forEach((rec: any, index: number) => {
        const priority = rec.priority === 'high' ? '🔴 HIGH' : rec.priority === 'medium' ? '🟡 MEDIUM' : '🟢 LOW'
        content += `${index + 1}. **${rec.action}** [${priority}]\n`
        content += `   • Expected Impact: ${rec.expectedImpact || rec.impact}\n`
        if (rec.timeframe) {
          content += `   • Timeline: ${rec.timeframe}\n`
        }
        content += '\n'
      })
    } else {
      // Generate generic recommendations based on the data
      content += this.generateGenericRecommendations(result.data, analysis)
    }

    return {
      content,
      summary: `Generated ${recommendations.length} recommendations based on analysis`,
      recommendations,
      followUpQuestions: [
        'How do I implement these recommendations?',
        'What\'s the expected ROI of these actions?',
        'Which recommendation should I start with?',
        'How long will it take to see results?'
      ]
    }
  }

  private generateExplanationResponse(query: string, result: any, analysis: QueryAnalysis): ResponseData {
    // This method handles "why" questions by providing detailed explanations
    
    if (!result?.success || !result.data) {
      return {
        content: "I couldn't find the data needed to answer your question at the moment. Please try again later.",
      }
    }

    let content = `## 🔍 Analysis: ${query}\n\n`

    // Provide context-specific explanations
    if (query.toLowerCase().includes('lost') || query.toLowerCase().includes('lose')) {
      content += this.generateLossExplanation(result.data)
    } else {
      content += this.generateGenericExplanation(result.data, analysis)
    }

    return {
      content,
      summary: 'Detailed explanation provided based on available data',
      followUpQuestions: [
        'What can we do to improve this?',
        'How does this compare to industry standards?',
        'Are there any patterns we should watch?',
        'What are the next steps?'
      ]
    }
  }

  private generateGeneralResponse(query: string, result: any, analysis: QueryAnalysis): ResponseData {
    if (!result?.success || !result.data) {
      return {
        content: "I couldn't find the specific information you're looking for at the moment. Could you please rephrase your question or be more specific about what you'd like to know?",
      }
    }

    let content = `Based on your query "${query}", here's what I found:\n\n`
    
    // Try to extract meaningful information from the result
    if (result.data.summary) {
      if (typeof result.data.summary === 'string') {
        content += `**Summary:** ${result.data.summary}\n\n`
      } else if (typeof result.data.summary === 'object') {
        content += `**Summary:**\n`
        Object.entries(result.data.summary).forEach(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
          content += `• ${formattedKey}: ${value}\n`
        })
        content += '\n'
      }
    }

    if (result.message) {
      content += `**Analysis:** ${result.message}\n\n`
    }

    // Add any metrics or data points
    if (result.data.metrics) {
      content += `**Key Metrics:**\n`
      Object.entries(result.data.metrics).forEach(([key, value]) => {
        content += `• ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}\n`
      })
      content += '\n'
    }

    return {
      content,
      summary: result.message || 'General analysis completed',
      followUpQuestions: [
        'Can you provide more specific details?',
        'How can we improve these metrics?',
        'What trends should we watch?',
        'What actions do you recommend?'
      ]
    }
  }

  // Helper methods
  private generateLostDealsInsights(deals: any[], summary: any): string[] {
    const insights: string[] = []

    if (deals.length === 0) return insights

    // Analyze deal sizes
    const avgLostValue = summary.averageValue
    if (avgLostValue > 100000) {
      insights.push(`You're losing high-value deals (avg $${avgLostValue.toLocaleString()}) - consider enterprise sales support`)
    }

    // Analyze pipeline time
    const avgDaysInPipeline = deals.reduce((sum, d) => sum + (d.daysInPipeline || 0), 0) / deals.length
    if (avgDaysInPipeline > 60) {
      insights.push(`Deals are staying in pipeline for ${Math.round(avgDaysInPipeline)} days on average - consider improving qualification`)
    }

    // Competitor analysis
    const competitorLosses = deals.filter(d => d.competitor).length
    if (competitorLosses > deals.length * 0.4) {
      insights.push(`${competitorLosses} deals lost to specific competitors - competitive positioning needs attention`)
    }

    return insights
  }

  private generateGenericRecommendations(data: any, analysis: QueryAnalysis): string {
    let content = 'Based on the analysis, here are some general recommendations:\n\n'
    
    // Add generic business recommendations
    content += '1. **Regular Review Process**: Implement weekly pipeline reviews to catch issues early\n'
    content += '2. **Data Quality**: Ensure all deal information is complete and up-to-date\n'
    content += '3. **Training**: Consider additional sales training based on identified gaps\n'
    content += '4. **Process Optimization**: Look for bottlenecks in your current sales process\n'

    return content
  }

  private generateLossExplanation(data: any): string {
    let content = ''
    
    if (data.summary && data.summary.topReasons) {
      content += `**Primary reasons for lost deals:**\n\n`
      data.summary.topReasons.slice(0, 3).forEach((reason: any, index: number) => {
        content += `${index + 1}. **${reason.reason}** (${reason.percentage}% of losses)\n`
        content += this.getReasonExplanation(reason.reason)
        content += '\n'
      })
    }

    return content
  }

  private getReasonExplanation(reason: string): string {
    const explanations: { [key: string]: string } = {
      'Price too high': '   This often indicates a value communication problem rather than actual pricing issues. Consider improving ROI presentations.',
      'Lost to competitor': '   Competitive losses suggest need for better differentiation and earlier engagement in the sales process.',
      'No budget': '   Budget objections often mean the prospect doesn\'t see sufficient value or urgency to prioritize funding.',
      'Poor timing': '   Timing issues can be addressed by better qualification and maintaining relationships for future opportunities.',
      'Feature gaps': '   Product limitations require clear communication about roadmap and alternative solutions.'
    }

    return explanations[reason] || '   Consider analyzing this loss reason in more detail to develop specific countermeasures.'
  }

  private generateGenericExplanation(data: any, analysis: QueryAnalysis): string {
    return 'Based on the available data and analysis, I\'ve provided the relevant information above. For more specific explanations, please ask more targeted questions about particular metrics or trends you\'d like to understand better.'
  }

  generateCrossTableResponse(query: string, result: any): ResponseData {
    if (!result?.success || !result.data) {
      return {
        content: "I couldn't execute the cross-table analysis at the moment. Please try again later.",
      }
    }

    const data = result.data
    console.log('[ResponseGenerator] Cross-table data summary:', data.summary)
    let content = `## 📊 Cross-Table Analysis Results\n\n`

    // Add query context
    content += `**Query:** "${data.query?.natural || query}"\n\n`

    // Summary section
    if (data.summary) {
      content += `**Summary:**\n`
      content += `• Records analyzed: ${data.summary.recordCount}\n`
      content += `• Tables used: ${data.summary.tablesUsed.join(', ')}\n`
      if (data.summary.totalValue !== undefined) {
        content += `• Total value: $${data.summary.totalValue.toLocaleString()}\n`
      }
      if (data.summary.averageValue !== undefined) {
        content += `• Average value: $${data.summary.averageValue.toLocaleString()}\n`
      }
      content += '\n'
    }

    // Display results based on whether it's aggregated or detailed
    if (data.results && data.results.length > 0) {
      const isAggregated = data.summary?.hasAggregations
      
      if (isAggregated) {
        content += `**Aggregated Results:**\n\n`
        content += this.formatAggregatedResults(data.results)
      } else {
        content += `**Detailed Results (Top ${Math.min(data.results.length, 20)} records):**\n\n`
        content += this.formatDetailedResults(data.results.slice(0, 20))
      }
    }

    // Add insights
    if (data.insights && data.insights.length > 0) {
      content += `## 🔍 Key Insights\n\n`
      data.insights.forEach((insight: string) => {
        content += `• ${insight}\n`
      })
      content += '\n'
    }

    // Add visualization if available
    if (data.visualization) {
      content += `## 📈 Visualization\n\n`
      content += this.generateVisualizationMarkdown(data.visualization)
    }

    // Removed SQL query details for cleaner response

    return {
      content,
      summary: result.message || 'Cross-table analysis completed',
      metrics: data.summary,
      visualizations: data.visualization ? [data.visualization] : undefined,
      followUpQuestions: [
        'Can you break this down by department?',
        'What are the trends over time?',
        'Show me this data as a chart',
        'What are the outliers in this dataset?'
      ]
    }
  }

  private formatAggregatedResults(results: any[]): string {
    if (results.length === 0) return 'No results found.\n\n'

    // Get column headers
    const headers = Object.keys(results[0])
    
    // Create markdown table
    let table = '| ' + headers.map(h => this.formatHeader(h)).join(' | ') + ' |\n'
    table += '|' + headers.map(() => '---').join('|') + '|\n'
    
    // Add data rows
    results.forEach(row => {
      table += '| ' + headers.map(h => this.formatCellValue(row[h])).join(' | ') + ' |\n'
    })
    
    return table + '\n'
  }

  private formatDetailedResults(results: any[]): string {
    if (results.length === 0) return 'No results found.\n\n'

    // For detailed results, show key fields in a more readable format
    let content = ''
    results.forEach((record, index) => {
      content += `**${index + 1}.** `
      
      // Show primary identifier (name, title, or id)
      const primaryField = record.name || record.title || record.dealName || record.id
      if (primaryField) {
        content += `${primaryField}\n`
      }
      
      // Show key metrics
      if (record.amount !== undefined) {
        content += `   • Amount: $${record.amount.toLocaleString()}\n`
      }
      if (record.stage) {
        content += `   • Stage: ${record.stage}\n`
      }
      if (record.owner) {
        content += `   • Owner: ${record.owner}\n`
      }
      if (record.closeDate) {
        content += `   • Close Date: ${new Date(record.closeDate).toLocaleDateString()}\n`
      }
      
      content += '\n'
    })
    
    return content
  }

  private formatHeader(header: string): string {
    return header
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  private formatCellValue(value: any): string {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') {
      if (value > 1000) {
        return value.toLocaleString()
      }
      return value.toString()
    }
    if (value instanceof Date) {
      return value.toLocaleDateString()
    }
    return value.toString()
  }

  private generateVisualizationMarkdown(visualization: any): string {
    let content = ''
    
    switch (visualization.type) {
      case 'pie':
        content += '**Pie Chart Data:**\n'
        visualization.data.forEach((item: any) => {
          const percentage = (item.value / visualization.data.reduce((sum: number, i: any) => sum + i.value, 0) * 100).toFixed(1)
          content += `• ${item.label}: ${item.value.toLocaleString()} (${percentage}%)\n`
        })
        break
        
      case 'bar':
        content += '**Bar Chart Data:**\n'
        visualization.data.forEach((item: any) => {
          const barLength = Math.round(item.value / Math.max(...visualization.data.map((i: any) => i.value)) * 20)
          const bar = '█'.repeat(barLength)
          content += `${item.category}: ${bar} ${item.value.toLocaleString()}\n`
        })
        break
        
      case 'line':
        content += '**Trend Data:**\n'
        visualization.data.forEach((point: any) => {
          content += `• ${point.x}: ${point.y.toLocaleString()}\n`
        })
        break
        
      default:
        content += 'Visualization data is available for rendering in the UI.\n'
    }
    
    return content + '\n'
  }
}