import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from '../connectors/unified-crm.entities'
import { Tenant } from '../tenancy/tenant.entity'

@Injectable()
export class SeedDataService {
  constructor(
    @InjectRepository(CrmAccount) private readonly accountRepo: Repository<CrmAccount>,
    @InjectRepository(CrmContact) private readonly contactRepo: Repository<CrmContact>,
    @InjectRepository(CrmDeal) private readonly dealRepo: Repository<CrmDeal>,
    @InjectRepository(CrmActivity) private readonly activityRepo: Repository<CrmActivity>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async seedDashboardData(tenantId: string, connectorId: string, provider: 'salesforce' | 'hubspot') {
    // Get tenant entity
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } })
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    // Clear existing data for this connector
    await this.accountRepo.delete({ connectorId })
    await this.contactRepo.delete({ connectorId })
    await this.dealRepo.delete({ connectorId })
    await this.activityRepo.delete({ connectorId })

    // Seed Accounts
    const accounts = []
    const accountNames = [
      'Acme Corporation', 'Global Tech Solutions', 'Summit Industries', 'NextGen Enterprises',
      'Pacific Innovations', 'Mountain View Systems', 'Crystal Dynamics', 'Vertex Holdings',
      'Quantum Computing Inc', 'Solar Energy Partners', 'Digital Frontier', 'Cloud Nine Services',
      'Blue Ocean Ventures', 'Green Earth Tech', 'Silver Lining Corp'
    ]
    
    for (let i = 0; i < accountNames.length; i++) {
      const account = this.accountRepo.create({
        tenant,
        provider,
        connectorId,
        name: accountNames[i],
        website: `https://${accountNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
        industry: ['Technology', 'Energy', 'Finance', 'Healthcare', 'Manufacturing'][i % 5],
        externalId: `acc-${i + 1}`,
      })
      accounts.push(await this.accountRepo.save(account))
    }

    // Seed Contacts
    const contacts = []
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length]
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]
      const accountIndex = i % accounts.length
      
      const contact = this.contactRepo.create({
        tenant,
        provider,
        connectorId,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${accounts[accountIndex].name.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1 555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        externalId: `con-${i + 1}`,
      })
      contacts.push(await this.contactRepo.save(contact))
    }

    // Seed Deals
    const dealNames = [
      'Enterprise License Deal', 'Cloud Migration Project', 'Annual Subscription Renewal',
      'Professional Services Package', 'Platform Integration', 'Custom Development',
      'Security Audit Services', 'Data Analytics Platform', 'Infrastructure Upgrade',
      'Mobile App Development', 'AI Implementation', 'Consulting Services'
    ]
    
    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
    const now = new Date()
    
    for (let i = 0; i < 30; i++) {
      const monthsOffset = Math.floor(Math.random() * 6) - 3 // -3 to +3 months
      const closeDate = new Date(now)
      closeDate.setMonth(closeDate.getMonth() + monthsOffset)
      
      const deal = this.dealRepo.create({
        tenant,
        provider,
        connectorId,
        name: `${dealNames[i % dealNames.length]} - ${accounts[i % accounts.length].name}`,
        amount: Math.floor(Math.random() * 500000) + 10000,
        stage: stages[i % stages.length],
        closeDate: closeDate.toISOString().split('T')[0], // Format as date only
        externalId: `deal-${i + 1}`,
      })
      await this.dealRepo.save(deal)
    }

    // Seed Activities (last 30 days)
    const activityTypes = ['call', 'email', 'meeting', 'task']
    const subjects = [
      'Follow-up call', 'Product demo', 'Contract review', 'Quarterly check-in',
      'Technical discussion', 'Pricing negotiation', 'Implementation planning',
      'Support ticket review', 'Strategic planning', 'Account review'
    ]
    
    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      
      // Generate 5-15 activities per day
      const dailyCount = Math.floor(Math.random() * 11) + 5
      
      for (let j = 0; j < dailyCount; j++) {
        const hour = 8 + Math.floor(Math.random() * 10) // 8 AM to 6 PM
        date.setHours(hour, Math.floor(Math.random() * 60), 0, 0)
        
        const activity = this.activityRepo.create({
          tenant,
          provider,
          connectorId,
          type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          occurredAt: date,
          notes: `Activity notes for ${date.toLocaleDateString()}`,
          externalId: `act-${daysAgo}-${j}`,
        })
        await this.activityRepo.save(activity)
      }
    }

    return {
      success: true,
      message: 'Dashboard data seeded successfully',
      stats: {
        accounts: accounts.length,
        contacts: contacts.length,
        deals: 30,
        activities: 'Approximately 250 activities over 30 days'
      }
    }
  }
}