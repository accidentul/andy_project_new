import { Injectable } from '@nestjs/common'
import { BaseAgent } from './base.agent'
import { CEOAgent } from './ceo.agent'
import { CFOAgent } from './cfo.agent'
import { SalesAgent } from './sales.agent'
import { MarketingAgent } from './marketing.agent'
import { OperationsAgent } from './operations.agent'
import { HRAgent } from './hr.agent'
import { User } from '../../users/user.entity'

export type UserRole = 'CEO' | 'CFO' | 'Sales Manager' | 'Marketing Manager' | 'Operations Manager' | 'HR Manager' | 'Business Analyst' | 'Default'

@Injectable()
export class AgentFactory {
  private agents: Map<string, BaseAgent> = new Map()

  constructor() {
    // Initialize all role-specific agents
    this.agents.set('CEO', new CEOAgent())
    this.agents.set('CFO', new CFOAgent())
    this.agents.set('Sales Manager', new SalesAgent())
    this.agents.set('Marketing Manager', new MarketingAgent())
    this.agents.set('Operations Manager', new OperationsAgent())
    this.agents.set('HR Manager', new HRAgent())
  }

  getAgentForUser(user: User): BaseAgent {
    // Determine agent based on user role and department
    const roleTitle = (user as any).roleTitle || user.role?.name || 'Default'
    const department = (user as any).department || 'General'
    
    // Try exact role match first
    if (this.agents.has(roleTitle)) {
      return this.agents.get(roleTitle)!
    }
    
    // Try department-based matching
    if (department.toLowerCase().includes('sales')) {
      return this.agents.get('Sales Manager')!
    }
    if (department.toLowerCase().includes('marketing')) {
      return this.agents.get('Marketing Manager')!
    }
    if (roleTitle.toLowerCase().includes('ceo') || roleTitle.toLowerCase().includes('chief executive')) {
      return this.agents.get('CEO')!
    }
    
    // Default to CEO agent for now (most comprehensive)
    return this.agents.get('CEO')!
  }

  getAvailableRoles(): string[] {
    return Array.from(this.agents.keys())
  }
}