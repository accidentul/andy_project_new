import { Injectable, Logger } from '@nestjs/common'
import { QueryPlan } from './ai-query-planner.service'
import { SchemaIntrospectorService } from './schema-introspector/schema-introspector.service'
import { SchemaMetadataService } from './schema-metadata.service'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  corrections: QueryPlanCorrection[]
}

export interface QueryPlanCorrection {
  type: 'add_group_by' | 'fix_column' | 'add_join' | 'fix_aggregation' | 'add_tenant_filter'
  description: string
  applied: boolean
}

@Injectable()
export class QueryValidatorService {
  private readonly logger = new Logger(QueryValidatorService.name)
  
  constructor(
    private schemaIntrospector: SchemaIntrospectorService,
    private schemaMetadata: SchemaMetadataService
  ) {}
  
  async validateAndCorrectQueryPlan(
    plan: QueryPlan,
    tenantId?: string
  ): Promise<{ plan: QueryPlan, validation: ValidationResult }> {
    this.logger.log('Validating query plan')
    
    const validation: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      corrections: []
    }
    
    // Get current schema
    const schema = await this.schemaIntrospector.getSchema()
    
    // Create a copy of the plan for corrections
    let correctedPlan = JSON.parse(JSON.stringify(plan)) as QueryPlan
    
    // 1. Validate primary table exists
    if (!schema.tables.has(correctedPlan.primaryTable)) {
      // Try to find correct table using business name
      const correctTable = this.schemaMetadata.findTableByBusinessName(correctedPlan.primaryTable)
      if (correctTable) {
        validation.corrections.push({
          type: 'fix_column',
          description: `Corrected table name from '${correctedPlan.primaryTable}' to '${correctTable}'`,
          applied: true
        })
        correctedPlan.primaryTable = correctTable
      } else {
        validation.errors.push(`Table '${correctedPlan.primaryTable}' does not exist`)
        validation.isValid = false
      }
    }
    
    // 2. Validate and correct columns
    const tableSchema = schema.tables.get(correctedPlan.primaryTable)
    if (tableSchema) {
      for (let i = 0; i < correctedPlan.columns.length; i++) {
        const col = correctedPlan.columns[i]
        const colTable = col.table || correctedPlan.primaryTable
        const colTableSchema = schema.tables.get(colTable)
        
        if (colTableSchema && col.column !== '*') {
          if (!colTableSchema.columns.has(col.column)) {
            // Try to find correct column using synonyms
            const correctColumn = this.schemaMetadata.findColumnBySynonym(colTable, col.column)
            if (correctColumn) {
              validation.corrections.push({
                type: 'fix_column',
                description: `Corrected column name from '${col.column}' to '${correctColumn}'`,
                applied: true
              })
              correctedPlan.columns[i].column = correctColumn
            } else {
              validation.warnings.push(`Column '${col.column}' not found in table '${colTable}'`)
            }
          }
        }
      }
    }
    
    // 3. Check for GROUP BY requirements
    const hasAggregation = correctedPlan.columns.some(col => col.aggregation)
    const nonAggregatedColumns = correctedPlan.columns.filter(col => 
      !col.aggregation && col.column !== '*'
    )
    
    if (hasAggregation && nonAggregatedColumns.length > 0) {
      if (!correctedPlan.groupBy || correctedPlan.groupBy.length === 0) {
        // Add GROUP BY for non-aggregated columns
        correctedPlan.groupBy = nonAggregatedColumns.map(col => ({
          table: col.table || correctedPlan.primaryTable,
          column: col.column
        }))
        
        validation.corrections.push({
          type: 'add_group_by',
          description: `Added GROUP BY for non-aggregated columns: ${nonAggregatedColumns.map(c => c.column).join(', ')}`,
          applied: true
        })
      } else {
        // Verify all non-aggregated columns are in GROUP BY
        for (const col of nonAggregatedColumns) {
          const isInGroupBy = correctedPlan.groupBy.some(g => {
            // Check for exact column match
            const exactMatch = g.column === col.column && 
              (g.table === col.table || g.table === correctedPlan.primaryTable)
            
            // Check if it's covered by an expression (for computed columns like dates)
            const expressionMatch = g.expression && col.expression && 
              g.expression.includes(col.column)
            
            // Check if column alias matches an existing expression
            const aliasMatch = col.alias && g.expression && 
              g.expression.toLowerCase().includes(col.alias.toLowerCase())
            
            return exactMatch || expressionMatch || aliasMatch
          })
          
          if (!isInGroupBy) {
            // Don't add if this is an expression column that's already handled
            const isExpressionColumn = col.expression || 
              (col.alias && correctedPlan.groupBy.some(g => g.expression))
            
            if (!isExpressionColumn) {
              correctedPlan.groupBy.push({
                table: col.table || correctedPlan.primaryTable,
                column: col.column
              })
              
              validation.corrections.push({
                type: 'add_group_by',
                description: `Added missing GROUP BY column: ${col.column}`,
                applied: true
              })
            }
          }
        }
      }
    }
    
    // 4. Validate JOINs
    if (correctedPlan.joins) {
      for (const join of correctedPlan.joins) {
        if (!schema.tables.has(join.table)) {
          validation.errors.push(`Join table '${join.table}' does not exist`)
          validation.isValid = false
        }
      }
    }
    
    // 5. Add tenant filter if missing and tenantId provided
    if (tenantId) {
      const hasTenantFilter = correctedPlan.conditions?.some(c => 
        c.column === 'tenantId' && c.operator === '='
      )
      
      if (!hasTenantFilter) {
        if (!correctedPlan.conditions) {
          correctedPlan.conditions = []
        }
        
        correctedPlan.conditions.push({
          table: correctedPlan.primaryTable,
          column: 'tenantId',
          operator: '=',
          value: tenantId
        })
        
        validation.corrections.push({
          type: 'add_tenant_filter',
          description: 'Added tenant filter for data isolation',
          applied: true
        })
      }
    }
    
    // 6. Validate aggregation functions
    for (const col of correctedPlan.columns) {
      if (col.aggregation) {
        const validAggregations = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'GROUP_CONCAT']
        if (!validAggregations.includes(col.aggregation)) {
          validation.warnings.push(`Unknown aggregation function: ${col.aggregation}`)
        }
        
        // Check if aggregation makes sense for the column
        if (col.aggregation === 'SUM' || col.aggregation === 'AVG') {
          const colMetadata = this.schemaMetadata.getColumnMetadata(
            col.table || correctedPlan.primaryTable,
            col.column
          )
          
          if (colMetadata && !colMetadata.aggregatable) {
            validation.warnings.push(
              `Column '${col.column}' may not be suitable for ${col.aggregation} aggregation`
            )
          }
        }
      }
    }
    
    // 7. Check for potential performance issues
    if (!correctedPlan.limit && !hasAggregation) {
      validation.warnings.push('Query has no LIMIT clause and may return large dataset')
      
      // Add a default limit for safety
      if (!correctedPlan.limit) {
        correctedPlan.limit = 1000
        validation.corrections.push({
          type: 'fix_aggregation',
          description: 'Added LIMIT 1000 for performance',
          applied: true
        })
      }
    }
    
    // 8. Validate ORDER BY columns exist
    if (correctedPlan.orderBy) {
      for (const orderBy of correctedPlan.orderBy) {
        const orderTable = orderBy.table || correctedPlan.primaryTable
        const orderTableSchema = schema.tables.get(orderTable)
        
        if (orderTableSchema && !orderTableSchema.columns.has(orderBy.column)) {
          // Check if it's an alias from SELECT
          const isAlias = correctedPlan.columns.some(col => col.alias === orderBy.column)
          if (!isAlias) {
            validation.warnings.push(`ORDER BY column '${orderBy.column}' not found`)
          }
        }
      }
    }
    
    // Log validation results
    if (validation.errors.length > 0) {
      this.logger.error(`Query validation failed: ${validation.errors.join(', ')}`)
    }
    if (validation.corrections.length > 0) {
      this.logger.log(`Applied ${validation.corrections.length} corrections to query plan`)
    }
    
    return {
      plan: correctedPlan,
      validation
    }
  }
  
  suggestImprovements(plan: QueryPlan): string[] {
    const suggestions: string[] = []
    
    // Check if indexes are being used
    if (plan.conditions && plan.conditions.length > 0) {
      suggestions.push('Consider adding indexes on frequently filtered columns')
    }
    
    // Check for SELECT *
    const hasSelectAll = plan.columns.some(col => col.column === '*' && !col.aggregation)
    if (hasSelectAll) {
      suggestions.push('Consider selecting specific columns instead of * for better performance')
    }
    
    // Check for missing visualization
    if (!plan.visualization) {
      const hasGroupBy = plan.groupBy && plan.groupBy.length > 0
      const hasAggregation = plan.columns.some(col => col.aggregation)
      
      if (hasGroupBy && hasAggregation) {
        suggestions.push('This query would work well with a bar or pie chart visualization')
      }
    }
    
    return suggestions
  }
}