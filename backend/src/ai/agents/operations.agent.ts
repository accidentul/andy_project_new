import { BaseAgent, AgentContext, AgentAction } from './base.agent'

export class OperationsAgent extends BaseAgent {
  constructor() {
    super('Operations Manager')
  }

  protected buildSystemPrompt(): string {
    return `You are an AI assistant specialized for Operations Managers and operations teams.
    
Your focus areas:
- Supply chain optimization and logistics
- Production efficiency and capacity planning
- Quality control and process improvement
- Inventory management and optimization
- Vendor and supplier relationship management
- Operational KPIs and performance metrics
- Resource allocation and workforce planning
- Technology infrastructure and systems

Communication style:
- Process-oriented with clear efficiency metrics
- Focus on throughput, utilization, and cycle times
- Provide actionable insights for bottleneck resolution
- Highlight opportunities for automation and optimization
- Balance efficiency with quality and reliability

Always consider:
- Lead times and delivery performance
- Overall Equipment Effectiveness (OEE)
- Six Sigma and lean principles
- Cost per unit and economies of scale
- Business continuity and risk mitigation`
  }

  protected extractBusinessContext(data: any): string {
    if (!data) return 'No operational data available'

    const context = []
    
    // Production metrics
    if (data.production) {
      context.push(`Production Volume: ${data.production.volume} units/day`)
      context.push(`Capacity Utilization: ${data.production.utilization}%`)
      context.push(`OEE Score: ${data.production.oee}%`)
      context.push(`Defect Rate: ${data.production.defectRate}%`)
    }
    
    // Supply chain
    if (data.supplyChain) {
      context.push(`On-Time Delivery: ${data.supplyChain.otd}%`)
      context.push(`Inventory Turnover: ${data.supplyChain.turnover}x`)
      context.push(`Lead Time: ${data.supplyChain.leadTime} days`)
      context.push(`Stockout Rate: ${data.supplyChain.stockoutRate}%`)
    }
    
    // Workforce
    if (data.workforce) {
      context.push(`Workforce Productivity: ${data.workforce.productivity}%`)
      context.push(`Overtime Rate: ${data.workforce.overtimeRate}%`)
      context.push(`Absenteeism: ${data.workforce.absenteeism}%`)
    }
    
    // Systems
    if (data.systems) {
      context.push(`System Uptime: ${data.systems.uptime}%`)
      context.push(`Incident Rate: ${data.systems.incidents}/month`)
    }

    return context.join('\n')
  }

  protected generateActions(context: AgentContext, analysis: string): AgentAction[] {
    const actions: AgentAction[] = []

    // Process optimization
    if (analysis.toLowerCase().includes('efficiency') || analysis.toLowerCase().includes('optimize')) {
      actions.push({
        type: 'automation',
        title: 'Process Automation Initiative',
        description: 'Implement RPA for repetitive operational tasks',
        impact: 'Reduce processing time by 40%, save 2000 hours/month',
        requiresApproval: true,
        actionData: {
          processes: ['Order processing', 'Inventory updates', 'Report generation'],
          technology: 'RPA',
          implementation: '60 days',
        }
      })
    }

    // Supply chain alert
    if (analysis.toLowerCase().includes('supply') || analysis.toLowerCase().includes('vendor')) {
      actions.push({
        type: 'alert',
        title: 'Supply Chain Risk Alert',
        description: 'Critical vendor showing delivery delays',
        impact: 'Potential production disruption in 2 weeks',
        requiresApproval: false,
        actionData: {
          vendor: 'Primary Component Supplier',
          delayDays: 5,
          affectedProducts: 3,
          mitigation: 'Activate secondary supplier',
        }
      })
    }

    // Capacity planning
    if (analysis.toLowerCase().includes('capacity') || analysis.toLowerCase().includes('demand')) {
      actions.push({
        type: 'recommendation',
        title: 'Capacity Expansion Plan',
        description: 'Scale operations to meet projected demand increase',
        impact: 'Support 30% growth without service degradation',
        requiresApproval: true,
        actionData: {
          currentCapacity: '10000 units/day',
          requiredCapacity: '13000 units/day',
          options: ['Add shift', 'Upgrade equipment', 'Outsource overflow'],
        }
      })
    }

    // Quality improvement
    if (analysis.toLowerCase().includes('quality') || analysis.toLowerCase().includes('defect')) {
      actions.push({
        type: 'recommendation',
        title: 'Quality Enhancement Program',
        description: 'Implement predictive quality control using ML',
        impact: 'Reduce defect rate by 60%, save $800K annually',
        requiresApproval: false,
        actionData: {
          currentDefectRate: '2.5%',
          targetDefectRate: '1.0%',
          methodology: 'Predictive analytics + IoT sensors',
        }
      })
    }

    return actions
  }
}