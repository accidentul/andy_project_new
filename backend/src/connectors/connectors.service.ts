import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Connector } from './connector.entity'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from './unified-crm.entities'
import { encryptSecret } from '../common/crypto.util'

@Injectable()
export class ConnectorsService {
  constructor(
    @InjectRepository(Connector) private readonly connRepo: Repository<Connector>,
    @InjectRepository(CrmAccount) private readonly accountRepo: Repository<CrmAccount>,
    @InjectRepository(CrmContact) private readonly contactRepo: Repository<CrmContact>,
    @InjectRepository(CrmDeal) private readonly dealRepo: Repository<CrmDeal>,
    @InjectRepository(CrmActivity) private readonly activityRepo: Repository<CrmActivity>,
  ) {}

  async createConnector(tenantId: string, provider: 'salesforce' | 'hubspot', credentials: any, active = true) {
    const connector = this.connRepo.create({
      tenant: { id: tenantId } as any,
      provider,
      credentialsEncrypted: encryptSecret(JSON.stringify(credentials)),
      active,
    })
    return this.connRepo.save(connector)
  }

  async listConnectors(tenantId: string) {
    return this.connRepo.find({ where: { tenant: { id: tenantId } } })
  }

  async upsertAccounts(tenantId: string, connectorId: string, provider: 'salesforce' | 'hubspot', rows: Array<{ externalId?: string; name: string; website?: string; industry?: string }>) {
    for (const r of rows) {
      let ent: CrmAccount | null = null
      if (r.externalId) {
        ent = await this.accountRepo.findOne({ where: { tenant: { id: tenantId }, externalId: r.externalId, provider } })
      }
      if (!ent) ent = this.accountRepo.create({ tenant: { id: tenantId } as any, provider, connectorId })
      ent.name = r.name
      ent.website = r.website
      ent.industry = r.industry
      ent.externalId = r.externalId
      await this.accountRepo.save(ent)
    }
  }

  async upsertContacts(tenantId: string, connectorId: string, provider: 'salesforce' | 'hubspot', rows: Array<{ externalId?: string; firstName: string; lastName: string; email: string; phone?: string }>) {
    for (const r of rows) {
      let ent: CrmContact | null = null
      if (r.externalId) {
        ent = await this.contactRepo.findOne({ where: { tenant: { id: tenantId }, externalId: r.externalId, provider } })
      }
      if (!ent) ent = this.contactRepo.create({ tenant: { id: tenantId } as any, provider, connectorId })
      ent.firstName = r.firstName
      ent.lastName = r.lastName
      ent.email = r.email
      ent.phone = r.phone
      ent.externalId = r.externalId
      await this.contactRepo.save(ent)
    }
  }

  async upsertDeals(tenantId: string, connectorId: string, provider: 'salesforce' | 'hubspot', rows: Array<{ externalId?: string; name: string; amount: number; stage?: string; closeDate?: string }>) {
    for (const r of rows) {
      let ent: CrmDeal | null = null
      if (r.externalId) {
        ent = await this.dealRepo.findOne({ where: { tenant: { id: tenantId }, externalId: r.externalId, provider } })
      }
      if (!ent) ent = this.dealRepo.create({ tenant: { id: tenantId } as any, provider, connectorId })
      ent.name = r.name
      ent.amount = r.amount
      ent.stage = r.stage
      ent.closeDate = r.closeDate as any
      ent.externalId = r.externalId
      await this.dealRepo.save(ent)
    }
  }

  async upsertActivities(tenantId: string, connectorId: string, provider: 'salesforce' | 'hubspot', rows: Array<{ externalId?: string; type: string; occurredAt: Date; subject?: string; notes?: string }>) {
    for (const r of rows) {
      let ent: CrmActivity | null = null
      if (r.externalId) {
        ent = await this.activityRepo.findOne({ where: { tenant: { id: tenantId }, externalId: r.externalId, provider } })
      }
      if (!ent) ent = this.activityRepo.create({ tenant: { id: tenantId } as any, provider, connectorId })
      ent.type = r.type
      ent.occurredAt = r.occurredAt
      ent.subject = r.subject
      ent.notes = r.notes
      ent.externalId = r.externalId
      await this.activityRepo.save(ent)
    }
  }
}
