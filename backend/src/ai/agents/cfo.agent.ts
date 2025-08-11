import { BaseAgent, AgentContext, AgentAction } from './base.agent'

export class CFOAgent extends BaseAgent {
  constructor() {
    super('CFO')
  }

  protected buildSystemPrompt(): string {
    return `You are an AI assistant specialized for Chief Financial Officers and finance teams.
    
Your focus areas:
- Financial planning and analysis (FP&A)
- Cash flow management and forecasting
- Budget variance analysis
- Capital allocation and investment decisions
- Financial risk management
- Cost optimization opportunities
- Revenue recognition and compliance
- Investor relations and reporting

Communication style:
- Precise financial metrics with clear context
- Focus on profitability and efficiency ratios
- Provide scenario analysis and sensitivity models
- Highlight financial risks and mitigation strategies
- Data-driven recommendations for capital allocation

Always consider:
- GAAP/IFRS compliance requirements
- Working capital optimization
- Debt-to-equity ratios and leverage
- Return on investment (ROI) for major initiatives
- Tax implications and optimization strategies`
  }

  protected extractBusinessContext(data: any): string {
    if (!data) return 'No financial data available'

    const context = []
    
    // Financial metrics
    if (data.financials) {
      context.push(`Revenue: $${data.financials.revenue}M (${data.financials.revenueGrowth}% YoY)`)
      context.push(`EBITDA: $${data.financials.ebitda}M (${data.financials.ebitdaMargin}% margin)`)
      context.push(`Cash Position: $${data.financials.cash}M`)
      context.push(`Burn Rate: $${data.financials.burnRate}M/month`)
    }
    
    // Budget performance
    if (data.budget) {
      context.push(`Budget Variance: ${data.budget.variance}%`)
      context.push(`YTD Actual vs Budget: $${data.budget.actualVsBudget}M`)
    }
    
    // Cash flow
    if (data.cashFlow) {
      context.push(`Operating Cash Flow: $${data.cashFlow.operating}M`)
      context.push(`Days Sales Outstanding: ${data.cashFlow.dso} days`)
      context.push(`Cash Conversion Cycle: ${data.cashFlow.ccc} days`)
    }
    
    // Risk metrics
    if (data.risk) {
      context.push(`Debt/Equity Ratio: ${data.risk.debtToEquity}`)
      context.push(`Current Ratio: ${data.risk.currentRatio}`)
    }

    return context.join('\n')
  }

  protected generateActions(context: AgentContext, analysis: string): AgentAction[] {
    const actions: AgentAction[] = []

    // Cash flow optimization
    if (analysis.toLowerCase().includes('cash') || analysis.toLowerCase().includes('liquidity')) {
      actions.push({
        type: 'automation',
        title: 'Cash Flow Optimization',
        description: 'Automated analysis of receivables and payables for working capital improvement',
        impact: 'Improve cash position by $2-3M within 30 days',
        requiresApproval: true,
        actionData: {
          type: 'working_capital',
          targetDSO: 45,
          targetDPO: 60,
        }
      })
    }

    // Budget alert
    if (analysis.toLowerCase().includes('budget') || analysis.toLowerCase().includes('variance')) {
      actions.push({
        type: 'alert',
        title: 'Budget Variance Alert',
        description: 'Significant variance detected in operational expenses',
        impact: 'Potential $500K budget overrun this quarter',
        requiresApproval: false,
        actionData: {
          department: 'Operations',
          variance: '+15%',
          recommendation: 'Implement spending freeze',
        }
      })
    }

    // Investment recommendation
    if (analysis.toLowerCase().includes('investment') || analysis.toLowerCase().includes('capital')) {
      actions.push({
        type: 'recommendation',
        title: 'Capital Allocation Strategy',
        description: 'Optimize capital deployment across business units',
        impact: 'Increase ROI by 18-22% annually',
        requiresApproval: true,
        actionData: {
          reallocation: {
            'R&D': '+20%',
            'Marketing': '-10%',
            'Operations': '-10%',
          },
          expectedROI: '22%',
        }
      })
    }

    // Cost reduction
    if (analysis.toLowerCase().includes('cost') || analysis.toLowerCase().includes('expense')) {
      actions.push({
        type: 'recommendation',
        title: 'Cost Reduction Initiative',
        description: 'AI-identified cost optimization opportunities across vendors',
        impact: 'Reduce operational expenses by 8-12%',
        requiresApproval: true,
        actionData: {
          areas: ['Software licenses', 'Cloud infrastructure', 'Professional services'],
          estimatedSavings: '$1.2M annually',
        }
      })
    }

    return actions
  }
}