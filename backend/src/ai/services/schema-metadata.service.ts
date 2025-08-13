import { Injectable, Logger } from '@nestjs/common'
import { SchemaIntrospectorService } from './schema-introspector/schema-introspector.service'

export interface TableMetadata {
  tableName: string
  businessName: string
  description: string
  category: 'crm' | 'user' | 'system' | 'analytics'
  commonQueries: string[]
  relatedTables: {
    table: string
    relationship: string
    joinColumn: string
  }[]
}

export interface ColumnMetadata {
  columnName: string
  businessName: string
  description: string
  dataCategory: 'identifier' | 'measure' | 'dimension' | 'date' | 'text' | 'system'
  aggregatable: boolean
  groupable: boolean
  synonyms: string[]
}

export interface BusinessTermMapping {
  term: string
  table: string
  column?: string
  sqlExpression?: string
  description: string
}

@Injectable()
export class SchemaMetadataService {
  private readonly logger = new Logger(SchemaMetadataService.name)
  
  private tableMetadata: Map<string, TableMetadata> = new Map()
  private columnMetadata: Map<string, Map<string, ColumnMetadata>> = new Map()
  private businessTerms: Map<string, BusinessTermMapping> = new Map()
  
  constructor(
    private schemaIntrospector: SchemaIntrospectorService
  ) {
    this.initializeMetadata()
  }
  
  private initializeMetadata() {
    // Initialize CRM tables metadata
    this.tableMetadata.set('crm_deals', {
      tableName: 'crm_deals',
      businessName: 'Sales Opportunities',
      description: 'Sales deals and opportunities in the pipeline',
      category: 'crm',
      commonQueries: [
        'sales by stage',
        'pipeline value',
        'deals by owner',
        'win rate',
        'average deal size'
      ],
      relatedTables: [
        { table: 'crm_accounts', relationship: 'many-to-one', joinColumn: 'accountId' },
        { table: 'crm_contacts', relationship: 'many-to-one', joinColumn: 'contactId' },
        { table: 'crm_activities', relationship: 'one-to-many', joinColumn: 'dealId' }
      ]
    })
    
    this.tableMetadata.set('crm_accounts', {
      tableName: 'crm_accounts',
      businessName: 'Customers',
      description: 'Customer accounts and companies',
      category: 'crm',
      commonQueries: [
        'customers by industry',
        'account distribution',
        'top accounts by revenue',
        'new customers this month'
      ],
      relatedTables: [
        { table: 'crm_deals', relationship: 'one-to-many', joinColumn: 'accountId' },
        { table: 'crm_contacts', relationship: 'one-to-many', joinColumn: 'accountId' }
      ]
    })
    
    this.tableMetadata.set('crm_contacts', {
      tableName: 'crm_contacts',
      businessName: 'Contacts',
      description: 'Individual contacts and people',
      category: 'crm',
      commonQueries: [
        'contacts by account',
        'contact engagement',
        'contacts by role'
      ],
      relatedTables: [
        { table: 'crm_accounts', relationship: 'many-to-one', joinColumn: 'accountId' },
        { table: 'crm_deals', relationship: 'one-to-many', joinColumn: 'contactId' }
      ]
    })
    
    this.tableMetadata.set('crm_activities', {
      tableName: 'crm_activities',
      businessName: 'Activities',
      description: 'Sales activities, calls, meetings, and tasks',
      category: 'crm',
      commonQueries: [
        'activities by type',
        'activity trend',
        'activities per rep',
        'overdue tasks'
      ],
      relatedTables: [
        { table: 'crm_deals', relationship: 'many-to-one', joinColumn: 'dealId' },
        { table: 'crm_contacts', relationship: 'many-to-one', joinColumn: 'contactId' }
      ]
    })
    
    // Initialize column metadata for crm_deals
    const dealsColumns = new Map<string, ColumnMetadata>()
    dealsColumns.set('amount', {
      columnName: 'amount',
      businessName: 'Deal Value',
      description: 'Monetary value of the deal',
      dataCategory: 'measure',
      aggregatable: true,
      groupable: false,
      synonyms: ['value', 'revenue', 'size', 'worth', 'price']
    })
    
    dealsColumns.set('stage', {
      columnName: 'stage',
      businessName: 'Sales Stage',
      description: 'Current stage in the sales pipeline',
      dataCategory: 'dimension',
      aggregatable: false,
      groupable: true,
      synonyms: ['status', 'phase', 'step', 'pipeline stage']
    })
    
    dealsColumns.set('closeDate', {
      columnName: 'closeDate',
      businessName: 'Close Date',
      description: 'Expected or actual closing date of the deal',
      dataCategory: 'date',
      aggregatable: false,
      groupable: true,
      synonyms: ['closing date', 'close', 'expected close']
    })
    
    dealsColumns.set('name', {
      columnName: 'name',
      businessName: 'Deal Name',
      description: 'Name or title of the opportunity',
      dataCategory: 'text',
      aggregatable: false,
      groupable: true,
      synonyms: ['title', 'opportunity name', 'deal title']
    })
    
    this.columnMetadata.set('crm_deals', dealsColumns)
    
    // Initialize column metadata for crm_accounts
    const accountsColumns = new Map<string, ColumnMetadata>()
    accountsColumns.set('name', {
      columnName: 'name',
      businessName: 'Company Name',
      description: 'Name of the customer company',
      dataCategory: 'text',
      aggregatable: false,
      groupable: true,
      synonyms: ['company', 'account name', 'customer name']
    })
    
    accountsColumns.set('industry', {
      columnName: 'industry',
      businessName: 'Industry',
      description: 'Industry or sector of the company',
      dataCategory: 'dimension',
      aggregatable: false,
      groupable: true,
      synonyms: ['sector', 'vertical', 'business type']
    })
    
    accountsColumns.set('website', {
      columnName: 'website',
      businessName: 'Website',
      description: 'Company website URL',
      dataCategory: 'text',
      aggregatable: false,
      groupable: false,
      synonyms: ['url', 'web', 'site']
    })
    
    this.columnMetadata.set('crm_accounts', accountsColumns)
    
    // Initialize business term mappings
    this.initializeBusinessTerms()
  }
  
  private initializeBusinessTerms() {
    // Sales-related terms
    this.businessTerms.set('sales', {
      term: 'sales',
      table: 'crm_deals',
      description: 'Sales opportunities and deals'
    })
    
    this.businessTerms.set('opportunities', {
      term: 'opportunities',
      table: 'crm_deals',
      description: 'Sales opportunities'
    })
    
    this.businessTerms.set('deals', {
      term: 'deals',
      table: 'crm_deals',
      description: 'Sales deals'
    })
    
    this.businessTerms.set('pipeline', {
      term: 'pipeline',
      table: 'crm_deals',
      sqlExpression: 'stage NOT IN ("Closed Won", "Closed Lost")',
      description: 'Open deals in the sales pipeline'
    })
    
    this.businessTerms.set('revenue', {
      term: 'revenue',
      table: 'crm_deals',
      column: 'amount',
      sqlExpression: 'SUM(amount)',
      description: 'Total revenue or deal value'
    })
    
    this.businessTerms.set('customers', {
      term: 'customers',
      table: 'crm_accounts',
      description: 'Customer accounts'
    })
    
    this.businessTerms.set('accounts', {
      term: 'accounts',
      table: 'crm_accounts',
      description: 'Customer accounts'
    })
    
    this.businessTerms.set('companies', {
      term: 'companies',
      table: 'crm_accounts',
      description: 'Customer companies'
    })
    
    this.businessTerms.set('contacts', {
      term: 'contacts',
      table: 'crm_contacts',
      description: 'Individual contacts'
    })
    
    this.businessTerms.set('activities', {
      term: 'activities',
      table: 'crm_activities',
      description: 'Sales activities and tasks'
    })
    
    this.businessTerms.set('tasks', {
      term: 'tasks',
      table: 'crm_activities',
      sqlExpression: 'type = "task"',
      description: 'Task activities'
    })
    
    this.businessTerms.set('meetings', {
      term: 'meetings',
      table: 'crm_activities',
      sqlExpression: 'type = "meeting"',
      description: 'Meeting activities'
    })
    
    this.businessTerms.set('calls', {
      term: 'calls',
      table: 'crm_activities',
      sqlExpression: 'type = "call"',
      description: 'Call activities'
    })
    
    // Metrics
    this.businessTerms.set('win rate', {
      term: 'win rate',
      table: 'crm_deals',
      sqlExpression: 'COUNT(CASE WHEN stage = "Closed Won" THEN 1 END) * 100.0 / COUNT(*)',
      description: 'Percentage of deals won'
    })
    
    this.businessTerms.set('average deal size', {
      term: 'average deal size',
      table: 'crm_deals',
      column: 'amount',
      sqlExpression: 'AVG(amount)',
      description: 'Average value of deals'
    })
    
    this.businessTerms.set('conversion rate', {
      term: 'conversion rate',
      table: 'crm_deals',
      sqlExpression: 'COUNT(CASE WHEN stage = "Closed Won" THEN 1 END) * 100.0 / COUNT(*)',
      description: 'Percentage of opportunities converted to wins'
    })
  }
  
  getTableMetadata(tableName: string): TableMetadata | undefined {
    return this.tableMetadata.get(tableName)
  }
  
  getColumnMetadata(tableName: string, columnName: string): ColumnMetadata | undefined {
    const tableColumns = this.columnMetadata.get(tableName)
    return tableColumns?.get(columnName)
  }
  
  getBusinessTerm(term: string): BusinessTermMapping | undefined {
    return this.businessTerms.get(term.toLowerCase())
  }
  
  findTableByBusinessName(businessName: string): string | undefined {
    const lowerName = businessName.toLowerCase()
    
    // First check direct business term mappings
    const termMapping = this.businessTerms.get(lowerName)
    if (termMapping) {
      return termMapping.table
    }
    
    // Then check table business names
    for (const [tableName, metadata] of this.tableMetadata) {
      if (metadata.businessName.toLowerCase().includes(lowerName)) {
        return tableName
      }
    }
    
    return undefined
  }
  
  findColumnBySynonym(tableName: string, synonym: string): string | undefined {
    const tableColumns = this.columnMetadata.get(tableName)
    if (!tableColumns) return undefined
    
    const lowerSynonym = synonym.toLowerCase()
    
    for (const [columnName, metadata] of tableColumns) {
      if (metadata.businessName.toLowerCase() === lowerSynonym ||
          metadata.synonyms.some(s => s.toLowerCase() === lowerSynonym)) {
        return columnName
      }
    }
    
    return undefined
  }
  
  getAggregateableColumns(tableName: string): string[] {
    const tableColumns = this.columnMetadata.get(tableName)
    if (!tableColumns) return []
    
    return Array.from(tableColumns.entries())
      .filter(([_, metadata]) => metadata.aggregatable)
      .map(([columnName, _]) => columnName)
  }
  
  getGroupableColumns(tableName: string): string[] {
    const tableColumns = this.columnMetadata.get(tableName)
    if (!tableColumns) return []
    
    return Array.from(tableColumns.entries())
      .filter(([_, metadata]) => metadata.groupable)
      .map(([columnName, _]) => columnName)
  }
  
  getAllBusinessTerms(): string[] {
    return Array.from(this.businessTerms.keys())
  }
  
  async getSchemaWithBusinessContext(): Promise<string> {
    const lines: string[] = []
    
    // Get the actual database schema
    const dbSchema = await this.schemaIntrospector.getSchema()
    
    lines.push('ACTUAL DATABASE SCHEMA (REAL-TIME)')
    lines.push('=' .repeat(50))
    lines.push(`Database Type: ${dbSchema.databaseType}`)
    lines.push(`Total Tables: ${dbSchema.tables.size}`)
    lines.push('')
    
    // List all actual tables with their real columns
    for (const [tableName, table] of dbSchema.tables) {
      lines.push(`Table: ${tableName}`)
      
      // Add business context if available
      const tableMetadata = this.tableMetadata.get(tableName)
      if (tableMetadata) {
        lines.push(`  Business Name: ${tableMetadata.businessName}`)
        lines.push(`  Description: ${tableMetadata.description}`)
      }
      
      lines.push('  Actual Columns:')
      for (const [colName, col] of table.columns) {
        const constraints: string[] = []
        if (col.isPrimaryKey) constraints.push('PK')
        if (col.nullable) constraints.push('NULL')
        else constraints.push('NOT NULL')
        if (col.isUnique) constraints.push('UNIQUE')
        
        lines.push(`    - ${colName}: ${col.dataType} [${constraints.join(', ')}]`)
      }
      
      // Show actual foreign keys from database
      if (table.foreignKeys.length > 0) {
        lines.push('  Foreign Keys (Actual):')
        for (const fk of table.foreignKeys) {
          lines.push(`    - ${fk.columnName} → ${fk.referencedTable}.${fk.referencedColumn}`)
        }
      }
      
      lines.push('')
    }
    
    // Show actual relationships if any
    if (dbSchema.relationships.length > 0) {
      lines.push('ACTUAL DATABASE RELATIONSHIPS')
      lines.push('-' .repeat(50))
      for (const rel of dbSchema.relationships) {
        lines.push(`${rel.sourceTable}.${rel.sourceColumn} ${rel.type} ${rel.targetTable}.${rel.targetColumn}`)
      }
      lines.push('')
    }
    
    lines.push('BUSINESS TERMINOLOGY')
    lines.push('=' .repeat(50))
    for (const [term, mapping] of this.businessTerms) {
      lines.push(`"${term}" → ${mapping.table}${mapping.column ? '.' + mapping.column : ''}`)
      if (mapping.sqlExpression) {
        lines.push(`  SQL: ${mapping.sqlExpression}`)
      }
    }
    
    return lines.join('\n')
  }
}