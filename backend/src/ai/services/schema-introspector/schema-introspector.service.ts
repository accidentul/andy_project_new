import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { InjectDataSource } from '@nestjs/typeorm'
import {
  DatabaseSchema,
  TableSchema,
  ColumnSchema,
  DataType,
  ForeignKeyInfo,
  RelationshipInfo,
  IndexInfo,
  DatabaseType,
  TableInfo,
  SchemaIntrospector
} from './schema.types'
import { SQLiteIntrospector } from './sqlite.introspector'
import { PostgreSQLIntrospector } from './postgres.introspector'
import { MySQLIntrospector } from './mysql.introspector'

@Injectable()
export class SchemaIntrospectorService {
  private readonly logger = new Logger(SchemaIntrospectorService.name)
  private schemaCache: DatabaseSchema | null = null
  private cacheTimestamp: number = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private introspector: SchemaIntrospector

  constructor(@InjectDataSource() private dataSource: DataSource) {
    // Initialize the appropriate introspector based on database type
    this.introspector = this.createIntrospector()
  }

  private createIntrospector(): SchemaIntrospector {
    const dbType = this.dataSource.options.type as DatabaseType
    
    switch (dbType) {
      case 'sqlite':
        return new SQLiteIntrospector(this.dataSource)
      case 'postgres':
        return new PostgreSQLIntrospector(this.dataSource)
      case 'mysql':
      case 'mariadb':
        return new MySQLIntrospector(this.dataSource)
      default:
        // Fallback to TypeORM metadata-based introspection
        this.logger.warn(`No specific introspector for ${dbType}, using TypeORM metadata`)
        return this.createTypeORMIntrospector()
    }
  }

  private createTypeORMIntrospector(): SchemaIntrospector {
    const dbType = this.dataSource.options.type as DatabaseType
    
    return {
      getDatabaseType: () => dbType,
      
      getSchema: async () => {
        return this.getSchemaFromTypeORM()
      },
      
      getTables: async () => {
        const metadata = this.dataSource.entityMetadatas
        return metadata.map(meta => ({
          name: meta.tableName,
          schema: meta.schema,
          type: 'table' as const
        }))
      },
      
      getColumns: async (tableName: string) => {
        const metadata = this.dataSource.entityMetadatas.find(
          m => m.tableName === tableName
        )
        if (!metadata) return []
        
        return metadata.columns.map(col => this.mapTypeORMColumn(col))
      },
      
      getRelationships: async () => {
        const relationships: RelationshipInfo[] = []
        
        for (const metadata of this.dataSource.entityMetadatas) {
          for (const relation of metadata.relations) {
            relationships.push({
              type: this.mapRelationType(relation.relationType),
              sourceTable: metadata.tableName,
              sourceColumn: relation.propertyName,
              targetTable: relation.inverseEntityMetadata.tableName,
              targetColumn: relation.inverseSidePropertyPath || '',
              joinTable: relation.junctionEntityMetadata?.tableName
            })
          }
        }
        
        return relationships
      },
      
      getPrimaryKeys: async (tableName: string) => {
        const metadata = this.dataSource.entityMetadatas.find(
          m => m.tableName === tableName
        )
        if (!metadata) return []
        
        return metadata.primaryColumns.map(col => col.databaseName)
      },
      
      getForeignKeys: async (tableName: string) => {
        const metadata = this.dataSource.entityMetadatas.find(
          m => m.tableName === tableName
        )
        if (!metadata) return []
        
        const foreignKeys: ForeignKeyInfo[] = []
        for (const fk of metadata.foreignKeys) {
          for (const col of fk.columns) {
            foreignKeys.push({
              name: fk.name || '',
              columnName: col.databaseName,
              referencedTable: fk.referencedTablePath,
              referencedColumn: fk.referencedColumns[0]?.databaseName || '',
              onDelete: fk.onDelete as any,
              onUpdate: fk.onUpdate as any
            })
          }
        }
        
        return foreignKeys
      },
      
      getIndexes: async (tableName: string) => {
        const metadata = this.dataSource.entityMetadatas.find(
          m => m.tableName === tableName
        )
        if (!metadata) return []
        
        return metadata.indices.map(idx => ({
          name: idx.name || '',
          columns: idx.columns.map(col => col.databaseName),
          unique: idx.isUnique || false
        }))
      }
    }
  }

  async getSchema(forceRefresh = false): Promise<DatabaseSchema> {
    const now = Date.now()
    
    // Return cached schema if still valid
    if (!forceRefresh && this.schemaCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.schemaCache
    }

    this.logger.log('Fetching database schema...')
    
    try {
      // Try specific introspector first
      const schema = await this.introspector.getSchema()
      
      // Cache the result
      this.schemaCache = schema
      this.cacheTimestamp = now
      
      this.logger.log(`Schema loaded: ${schema.tables.size} tables found`)
      return schema
    } catch (error) {
      this.logger.error('Failed to fetch schema from database, falling back to TypeORM metadata', error)
      
      // Fallback to TypeORM metadata
      const schema = await this.getSchemaFromTypeORM()
      
      // Cache the result
      this.schemaCache = schema
      this.cacheTimestamp = now
      
      return schema
    }
  }

  private async getSchemaFromTypeORM(): Promise<DatabaseSchema> {
    const dbType = this.dataSource.options.type as DatabaseType
    const tables = new Map<string, TableSchema>()
    const relationships: RelationshipInfo[] = []

    // Process each entity metadata
    for (const metadata of this.dataSource.entityMetadatas) {
      const columns = new Map<string, ColumnSchema>()
      const foreignKeys: ForeignKeyInfo[] = []
      const indexes: IndexInfo[] = []

      // Process columns
      for (const column of metadata.columns) {
        columns.set(column.databaseName, this.mapTypeORMColumn(column))
      }

      // Process foreign keys
      for (const fk of metadata.foreignKeys) {
        for (let i = 0; i < fk.columns.length; i++) {
          foreignKeys.push({
            name: fk.name || '',
            columnName: fk.columns[i].databaseName,
            referencedTable: fk.referencedTablePath,
            referencedColumn: fk.referencedColumns[i]?.databaseName || '',
            onDelete: fk.onDelete as any,
            onUpdate: fk.onUpdate as any
          })
        }
      }

      // Process indexes
      for (const index of metadata.indices) {
        indexes.push({
          name: index.name || '',
          columns: index.columns.map(col => col.databaseName),
          unique: index.isUnique || false
        })
      }

      // Process relationships
      for (const relation of metadata.relations) {
        relationships.push({
          type: this.mapRelationType(relation.relationType),
          sourceTable: metadata.tableName,
          sourceColumn: relation.propertyName,
          targetTable: relation.inverseEntityMetadata.tableName,
          targetColumn: relation.inverseSidePropertyPath || '',
          joinTable: relation.junctionEntityMetadata?.tableName
        })
      }

      tables.set(metadata.tableName, {
        name: metadata.tableName,
        schema: metadata.schema,
        columns,
        primaryKeys: metadata.primaryColumns.map(col => col.databaseName),
        foreignKeys,
        indexes
      })
    }

    return {
      databaseType: dbType,
      tables,
      relationships
    }
  }

  private mapTypeORMColumn(column: any): ColumnSchema {
    return {
      name: column.databaseName,
      type: column.type,
      dataType: this.normalizeDataType(column.type),
      nullable: column.isNullable || false,
      defaultValue: column.default,
      isGenerated: column.isGenerated || false,
      isPrimaryKey: column.isPrimary || false,
      isUnique: column.isUnique || false,
      length: column.length,
      precision: column.precision,
      scale: column.scale,
      comment: column.comment
    }
  }

  private normalizeDataType(type: any): DataType {
    const typeStr = typeof type === 'function' ? type.name : String(type).toLowerCase()
    
    // Text types
    if (/varchar|char|text|string/i.test(typeStr)) return DataType.STRING
    if (/text|clob/i.test(typeStr)) return DataType.TEXT
    
    // Numeric types
    if (/int|integer/i.test(typeStr) && !/bigint/i.test(typeStr)) return DataType.INTEGER
    if (/bigint|bigserial/i.test(typeStr)) return DataType.BIGINT
    if (/decimal|numeric|money/i.test(typeStr)) return DataType.DECIMAL
    if (/float|real/i.test(typeStr)) return DataType.FLOAT
    if (/double/i.test(typeStr)) return DataType.DOUBLE
    
    // Date/Time types
    if (/date/i.test(typeStr) && !/datetime|timestamp/i.test(typeStr)) return DataType.DATE
    if (/time/i.test(typeStr) && !/datetime|timestamp/i.test(typeStr)) return DataType.TIME
    if (/datetime/i.test(typeStr)) return DataType.DATETIME
    if (/timestamp/i.test(typeStr)) return DataType.TIMESTAMP
    
    // Boolean
    if (/bool|boolean/i.test(typeStr)) return DataType.BOOLEAN
    
    // Binary
    if (/binary|bytea|blob/i.test(typeStr)) return DataType.BINARY
    
    // JSON
    if (/json/i.test(typeStr)) return DataType.JSON
    if (/jsonb/i.test(typeStr)) return DataType.JSONB
    
    // UUID
    if (/uuid|guid/i.test(typeStr)) return DataType.UUID
    
    // Array
    if (/array|\[\]/i.test(typeStr)) return DataType.ARRAY
    
    // Enum
    if (/enum/i.test(typeStr)) return DataType.ENUM
    
    return DataType.UNKNOWN
  }

  private mapRelationType(type: string): RelationshipInfo['type'] {
    switch (type) {
      case 'one-to-one':
        return 'one-to-one'
      case 'one-to-many':
        return 'one-to-many'
      case 'many-to-one':
        return 'many-to-one'
      case 'many-to-many':
        return 'many-to-many'
      default:
        return 'one-to-many'
    }
  }

  async refreshSchema(): Promise<DatabaseSchema> {
    this.logger.log('Refreshing schema cache...')
    return this.getSchema(true)
  }

  async getTableSchema(tableName: string): Promise<TableSchema | undefined> {
    const schema = await this.getSchema()
    return schema.tables.get(tableName)
  }

  async getAIFriendlySchema(): Promise<string> {
    const schema = await this.getSchema()
    const lines: string[] = [
      `Database Type: ${schema.databaseType}`,
      `Tables: ${schema.tables.size}`,
      ''
    ]

    for (const [tableName, table] of schema.tables) {
      lines.push(`Table: ${tableName}`)
      lines.push('Columns:')
      
      for (const [colName, col] of table.columns) {
        const nullable = col.nullable ? 'NULL' : 'NOT NULL'
        const pk = col.isPrimaryKey ? ' [PK]' : ''
        lines.push(`  - ${colName}: ${col.dataType} ${nullable}${pk}`)
      }
      
      if (table.foreignKeys.length > 0) {
        lines.push('Foreign Keys:')
        for (const fk of table.foreignKeys) {
          lines.push(`  - ${fk.columnName} -> ${fk.referencedTable}.${fk.referencedColumn}`)
        }
      }
      
      lines.push('')
    }

    if (schema.relationships.length > 0) {
      lines.push('Relationships:')
      for (const rel of schema.relationships) {
        lines.push(`  - ${rel.sourceTable}.${rel.sourceColumn} ${rel.type} ${rel.targetTable}.${rel.targetColumn}`)
      }
    }

    return lines.join('\n')
  }
}