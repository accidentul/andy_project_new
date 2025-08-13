import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { AuthService } from '../auth/auth.service'
import { UsersService } from '../users/users.service'
import { ConnectorsService } from '../connectors/connectors.service'
import { AiService } from '../ai/ai.service'
import { Tenant } from '../tenancy/tenant.entity'
import { User } from '../users/user.entity'
import { Role } from '../rbac/role.entity'
import { Permission } from '../rbac/permission.entity'

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name)

  constructor(
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly connectorsService: ConnectorsService,
    private readonly aiService: AiService,
  ) {}

  async checkIfDataExists(): Promise<boolean> {
    try {
      const tenantCount = await this.dataSource.getRepository(Tenant).count()
      return tenantCount > 0
    } catch (error) {
      this.logger.error('Error checking for existing data:', error)
      return false
    }
  }

  async seed() {
    this.logger.log('Starting database seed...')

    // Check if data already exists
    if (await this.checkIfDataExists()) {
      this.logger.log('Data already exists, skipping seed')
      return
    }

    try {
      // 1. Create main company and admin user
      this.logger.log('Creating main company and admin user...')
      const { tenantId } = await this.authService.registerAdmin({
        companyName: 'Acme Corporation',
        companySlug: 'acme',
        adminEmail: 'admin@acme.com',
        adminName: 'System Administrator',
        adminPassword: 'Admin123',
      })

      // 2. Create department users
      this.logger.log('Creating department users...')
      const departments = [
        {
          email: 'cfo@acme.com',
          name: 'Sarah Johnson',
          password: 'Pass123',
          roleId: 'user',
          roleTitle: 'Chief Financial Officer',
          department: 'Finance',
        },
        {
          email: 'sales.manager@acme.com',
          name: 'Michael Chen',
          password: 'Pass123',
          roleId: 'user',
          roleTitle: 'Sales Manager',
          department: 'Sales',
        },
        {
          email: 'marketing.manager@acme.com',
          name: 'Emily Rodriguez',
          password: 'Pass123',
          roleId: 'user',
          roleTitle: 'Marketing Manager',
          department: 'Marketing',
        },
        {
          email: 'ops.manager@acme.com',
          name: 'David Kim',
          password: 'Pass123',
          roleId: 'user',
          roleTitle: 'Operations Manager',
          department: 'Operations',
        },
        {
          email: 'hr.manager@acme.com',
          name: 'Jessica Williams',
          password: 'Pass123',
          roleId: 'user',
          roleTitle: 'HR Manager',
          department: 'Human Resources',
        },
        {
          email: 'sales.rep1@acme.com',
          name: 'John Smith',
          password: 'Pass123',
          roleId: 'user',
          roleTitle: 'Sales Representative',
          department: 'Sales',
        },
        {
          email: 'sales.rep2@acme.com',
          name: 'Lisa Anderson',
          password: 'Pass123',
          roleId: 'user',
          roleTitle: 'Sales Representative',
          department: 'Sales',
        },
        {
          email: 'marketing.specialist@acme.com',
          name: 'Robert Taylor',
          password: 'Pass123',
          roleId: 'user',
          roleTitle: 'Marketing Specialist',
          department: 'Marketing',
        },
        {
          email: 'hr.specialist@acme.com',
          name: 'Amanda Brown',
          password: 'Pass123',
          roleId: 'user',
          roleTitle: 'HR Specialist',
          department: 'Human Resources',
        },
        {
          email: 'analyst@acme.com',
          name: 'Christopher Lee',
          password: 'Pass123',
          roleId: 'user',
          roleTitle: 'Business Analyst',
          department: 'Operations',
        },
      ]

      for (const userData of departments) {
        try {
          await this.usersService.createUserWithinTenant({
            tenantId,
            ...userData,
          })
          this.logger.log(`Created user: ${userData.name} (${userData.email})`)
        } catch (error: any) {
          if (!error.message?.includes('already exists')) {
            this.logger.error(`Failed to create user ${userData.email}:`, error.message)
          }
        }
      }

      // 3. Create CRM connectors
      this.logger.log('Creating CRM connectors...')
      const salesforceConnector = await this.connectorsService.createConnector(
        tenantId,
        'salesforce',
        {
          instanceUrl: 'https://acme.my.salesforce.com',
          username: 'integration@acme.com',
          password: 'encrypted_password',
          securityToken: 'encrypted_token',
        },
        true
      )

      const hubspotConnector = await this.connectorsService.createConnector(
        tenantId,
        'hubspot',
        {
          apiKey: 'encrypted_hubspot_key',
          portalId: '12345678',
        },
        true
      )

      // 4. Seed CRM data using AI service
      this.logger.log('Seeding CRM data...')
      
      // Seed Salesforce data
      await this.aiService.seedSampleData(
        tenantId,
        salesforceConnector.id,
        'salesforce',
        { volume: 'medium' }
      )
      this.logger.log('Seeded Salesforce CRM data')

      // Seed HubSpot data
      await this.aiService.seedSampleData(
        tenantId,
        hubspotConnector.id,
        'hubspot',
        { volume: 'small' }
      )
      this.logger.log('Seeded HubSpot CRM data')

      // 5. Create sample subsidiary companies
      this.logger.log('Creating subsidiary companies...')
      const subsidiaries = [
        {
          companyName: 'Acme Europe',
          companySlug: 'acme-europe',
          adminEmail: 'admin@acme-europe.com',
          adminName: 'European Admin',
          adminPassword: 'Admin123',
        },
        {
          companyName: 'Acme Asia Pacific',
          companySlug: 'acme-apac',
          adminEmail: 'admin@acme-apac.com',
          adminName: 'APAC Admin',
          adminPassword: 'Admin123',
        },
      ]

      for (const subsidiary of subsidiaries) {
        try {
          await this.authService.registerAdmin(subsidiary)
          this.logger.log(`Created subsidiary: ${subsidiary.companyName}`)
        } catch (error: any) {
          if (!error.message?.includes('already exists')) {
            this.logger.error(`Failed to create subsidiary ${subsidiary.companyName}:`, error.message)
          }
        }
      }

      this.logger.log('Database seed completed successfully!')
      this.logger.log('=====================================')
      this.logger.log('Default login credentials:')
      this.logger.log('Admin: admin@acme.com / Admin123')
      this.logger.log('CFO: cfo@acme.com / Pass123')
      this.logger.log('Sales Manager: sales.manager@acme.com / Pass123')
      this.logger.log('Marketing Manager: marketing.manager@acme.com / Pass123')
      this.logger.log('Operations Manager: ops.manager@acme.com / Pass123')
      this.logger.log('HR Manager: hr.manager@acme.com / Pass123')
      this.logger.log('=====================================')
      
    } catch (error) {
      this.logger.error('Seed failed:', error)
      throw error
    }
  }
}