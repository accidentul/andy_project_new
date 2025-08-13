import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../users/user.entity'

export interface DataAccessRules {
  canViewAllData: boolean
  canViewDepartmentData: boolean
  canViewTeamData: boolean
  canViewOwnDataOnly: boolean
  allowedTables: string[]
  restrictedFields: string[]
  dataFilters: DataFilter[]
}

export interface DataFilter {
  table: string
  field: string
  operator: 'equals' | 'in' | 'not_in' | 'contains'
  value: any
}

@Injectable()
export class PermissionCheckerService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * Determines what data a user can access based on their role and position
   */
  async getDataAccessRules(userId: string): Promise<DataAccessRules> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions']
    })

    if (!user) {
      throw new Error('User not found')
    }

    const role = user.role?.name || user.roleTitle || 'unknown'
    const department = user.department
    const seniorityLevel = user.seniorityLevel

    return this.determineAccessRules(role, department, seniorityLevel, userId)
  }

  private determineAccessRules(
    role: string, 
    department?: string, 
    seniorityLevel?: string,
    userId?: string
  ): DataAccessRules {
    const baseRules: DataAccessRules = {
      canViewAllData: false,
      canViewDepartmentData: false,
      canViewTeamData: false,
      canViewOwnDataOnly: false,
      allowedTables: [],
      restrictedFields: [],
      dataFilters: []
    }

    // C-Level executives get full access
    if (role === 'CEO' || role === 'CFO' || role === 'COO' || role === 'CTO') {
      return {
        ...baseRules,
        canViewAllData: true,
        allowedTables: ['*'], // All tables
        restrictedFields: [], // No restrictions
        dataFilters: [] // No filters
      }
    }

    // Department heads see their department's data
    if (role.includes('Director') || role.includes('VP') || seniorityLevel === 'director') {
      return {
        ...baseRules,
        canViewDepartmentData: true,
        allowedTables: this.getAllowedTablesForDepartment(department),
        restrictedFields: this.getRestrictedFieldsForRole(role),
        dataFilters: department ? [
          {
            table: 'users',
            field: 'department',
            operator: 'equals',
            value: department
          },
          {
            table: 'crm_deals',
            field: 'ownerDepartment',
            operator: 'equals',
            value: department
          }
        ] : []
      }
    }

    // Managers see their team's data
    if (role.includes('Manager') || seniorityLevel === 'manager') {
      const filters: DataFilter[] = []
      
      if (department) {
        filters.push({
          table: 'users',
          field: 'department',
          operator: 'equals',
          value: department
        })
      }

      // For sales managers, they see their region/team
      if (role === 'Sales Manager' && userId) {
        filters.push({
          table: 'crm_deals',
          field: 'teamId',
          operator: 'in',
          value: `(SELECT teamId FROM user_teams WHERE managerId = '${userId}')`
        })
      }

      return {
        ...baseRules,
        canViewTeamData: true,
        allowedTables: this.getAllowedTablesForRole(role),
        restrictedFields: this.getRestrictedFieldsForRole(role),
        dataFilters: filters
      }
    }

    // Individual contributors see only their own data
    if (role === 'Sales Rep' || role === 'Account Executive' || 
        seniorityLevel === 'individual' || seniorityLevel === 'junior') {
      return {
        ...baseRules,
        canViewOwnDataOnly: true,
        allowedTables: [
          'crm_deals',
          'crm_accounts',
          'crm_contacts',
          'crm_activities'
        ],
        restrictedFields: [
          'salary',
          'commission',
          'passwordHash',
          'credentialsEncrypted'
        ],
        dataFilters: userId ? [
          {
            table: 'crm_deals',
            field: 'ownerId',
            operator: 'equals',
            value: userId
          },
          {
            table: 'crm_activities',
            field: 'createdBy',
            operator: 'equals',
            value: userId
          }
        ] : []
      }
    }

    // Default restrictive access
    return {
      ...baseRules,
      canViewOwnDataOnly: true,
      allowedTables: ['crm_deals', 'crm_accounts'],
      restrictedFields: ['*'], // Restrict all sensitive fields by default
      dataFilters: userId ? [
        {
          table: '*',
          field: 'ownerId',
          operator: 'equals',
          value: userId
        }
      ] : []
    }
  }

  private getAllowedTablesForDepartment(department?: string): string[] {
    if (!department) return ['*']

    const departmentTables: { [key: string]: string[] } = {
      'Sales': [
        'crm_deals',
        'crm_accounts',
        'crm_contacts',
        'crm_activities',
        'users'
      ],
      'Marketing': [
        'crm_accounts',
        'crm_contacts',
        'campaigns',
        'leads',
        'users'
      ],
      'Finance': [
        'crm_deals',
        'invoices',
        'payments',
        'budgets',
        'users'
      ],
      'Engineering': [
        'projects',
        'tasks',
        'deployments',
        'users'
      ],
      'HR': [
        'users',
        'departments',
        'roles',
        'permissions'
      ]
    }

    return departmentTables[department] || ['crm_deals', 'crm_accounts']
  }

  private getAllowedTablesForRole(role: string): string[] {
    const roleTables: { [key: string]: string[] } = {
      'Sales Manager': [
        'crm_deals',
        'crm_accounts',
        'crm_contacts',
        'crm_activities',
        'users'
      ],
      'Sales Rep': [
        'crm_deals',
        'crm_accounts',
        'crm_contacts',
        'crm_activities'
      ],
      'Marketing Manager': [
        'crm_accounts',
        'crm_contacts',
        'campaigns',
        'leads'
      ],
      'CFO': ['*'],
      'CEO': ['*'],
      'HR Manager': [
        'users',
        'departments',
        'roles'
      ]
    }

    return roleTables[role] || ['crm_deals', 'crm_accounts']
  }

  private getRestrictedFieldsForRole(role: string): string[] {
    // Fields that should be hidden from certain roles
    const restrictedByRole: { [key: string]: string[] } = {
      'Sales Rep': [
        'salary',
        'commission_rate',
        'cost',
        'margin',
        'passwordHash',
        'credentialsEncrypted'
      ],
      'Sales Manager': [
        'passwordHash',
        'credentialsEncrypted',
        'salary' // Can see commission but not salaries
      ],
      'Marketing Manager': [
        'salary',
        'commission',
        'passwordHash',
        'credentialsEncrypted',
        'cost',
        'margin'
      ]
    }

    // C-level and HR can see everything
    if (role === 'CEO' || role === 'CFO' || role === 'HR Director') {
      return []
    }

    return restrictedByRole[role] || ['passwordHash', 'credentialsEncrypted']
  }

  /**
   * Apply data filters to a SQL query
   */
  applyFiltersToQuery(sql: string, filters: DataFilter[]): string {
    if (filters.length === 0) return sql

    // Parse the SQL to find WHERE clause
    const whereIndex = sql.toUpperCase().indexOf('WHERE')
    const hasWhere = whereIndex !== -1

    // Build filter conditions
    const conditions = filters.map(filter => {
      switch (filter.operator) {
        case 'equals':
          return `${filter.table}.${filter.field} = '${filter.value}'`
        case 'in':
          return `${filter.table}.${filter.field} IN ${filter.value}`
        case 'not_in':
          return `${filter.table}.${filter.field} NOT IN ${filter.value}`
        case 'contains':
          return `${filter.table}.${filter.field} LIKE '%${filter.value}%'`
        default:
          return ''
      }
    }).filter(c => c)

    if (conditions.length === 0) return sql

    // Add filters to query
    if (hasWhere) {
      // Insert after existing WHERE conditions
      const beforeWhere = sql.substring(0, whereIndex + 5)
      const afterWhere = sql.substring(whereIndex + 5)
      return `${beforeWhere} (${afterWhere}) AND (${conditions.join(' AND ')})`
    } else {
      // Add WHERE clause
      const orderByIndex = sql.toUpperCase().indexOf('ORDER BY')
      const groupByIndex = sql.toUpperCase().indexOf('GROUP BY')
      const limitIndex = sql.toUpperCase().indexOf('LIMIT')
      
      let insertIndex = sql.length
      if (orderByIndex !== -1) insertIndex = Math.min(insertIndex, orderByIndex)
      if (groupByIndex !== -1) insertIndex = Math.min(insertIndex, groupByIndex)
      if (limitIndex !== -1) insertIndex = Math.min(insertIndex, limitIndex)
      
      const beforeInsert = sql.substring(0, insertIndex)
      const afterInsert = sql.substring(insertIndex)
      
      return `${beforeInsert} WHERE ${conditions.join(' AND ')} ${afterInsert}`
    }
  }

  /**
   * Check if a user can perform a specific action on a resource
   */
  async canUserAccess(
    userId: string, 
    resource: string, 
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    const rules = await this.getDataAccessRules(userId)

    // Check if user has access to the table
    if (!rules.allowedTables.includes('*') && !rules.allowedTables.includes(resource)) {
      return false
    }

    // For write and delete, additional checks would be needed
    if (action === 'write' || action === 'delete') {
      // Only certain roles can modify data
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role']
      })

      const writeRoles = ['CEO', 'CFO', 'Sales Manager', 'Admin']
      const deleteRoles = ['CEO', 'Admin']

      if (action === 'write' && !writeRoles.includes(user?.role?.name || '')) {
        return false
      }

      if (action === 'delete' && !deleteRoles.includes(user?.role?.name || '')) {
        return false
      }
    }

    return true
  }
}