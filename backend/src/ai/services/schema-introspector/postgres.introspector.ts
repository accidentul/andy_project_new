import { DataSource } from 'typeorm'
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

export class PostgreSQLIntrospector implements SchemaIntrospector {
  private schema: string

  constructor(private dataSource: DataSource) {
    // Get the schema from connection options, default to 'public'
    this.schema = (dataSource.options as any).schema || 'public'
  }

  getDatabaseType(): DatabaseType {
    return 'postgres'
  }

  async getSchema(): Promise<DatabaseSchema> {
    const tables = new Map<string, TableSchema>()
    const relationships: RelationshipInfo[] = []

    // Get all tables
    const tableInfos = await this.getTables()
    
    for (const tableInfo of tableInfos) {
      const columns = await this.getColumns(tableInfo.name)
      const primaryKeys = await this.getPrimaryKeys(tableInfo.name)
      const foreignKeys = await this.getForeignKeys(tableInfo.name)
      const indexes = await this.getIndexes(tableInfo.name)

      const columnMap = new Map<string, ColumnSchema>()
      for (const column of columns) {
        columnMap.set(column.name, column)
      }

      tables.set(tableInfo.name, {
        name: tableInfo.name,
        schema: this.schema,
        columns: columnMap,
        primaryKeys,
        foreignKeys,
        indexes
      })

      // Build relationships from foreign keys
      for (const fk of foreignKeys) {
        relationships.push({
          type: 'many-to-one',
          sourceTable: tableInfo.name,
          sourceColumn: fk.columnName,
          targetTable: fk.referencedTable,
          targetColumn: fk.referencedColumn,
          constraint: fk.name
        })
      }
    }

    return {
      databaseType: 'postgres',
      tables,
      relationships,
      metadata: {
        version: await this.getPostgresVersion(),
        collation: await this.getDatabaseCollation()
      }
    }
  }

  async getTables(): Promise<TableInfo[]> {
    const query = `
      SELECT 
        table_name as name,
        table_type as type
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_type IN ('BASE TABLE', 'VIEW')
      ORDER BY table_name
    `
    
    const results = await this.dataSource.query(query, [this.schema])
    
    return results.map((row: any) => ({
      name: row.name,
      schema: this.schema,
      type: row.type === 'BASE TABLE' ? 'table' : 'view'
    }))
  }

  async getColumns(tableName: string): Promise<ColumnSchema[]> {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_identity,
        identity_generation,
        is_generated,
        generation_expression,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = $1 
        AND table_name = $2
      ORDER BY ordinal_position
    `
    
    const results = await this.dataSource.query(query, [this.schema, tableName])
    
    // Get primary key columns
    const pkColumns = await this.getPrimaryKeys(tableName)
    const pkSet = new Set(pkColumns)
    
    // Get unique columns
    const uniqueColumns = await this.getUniqueColumns(tableName)
    const uniqueSet = new Set(uniqueColumns)
    
    return results.map((row: any) => ({
      name: row.column_name,
      type: row.data_type,
      dataType: this.mapPostgresType(row.data_type, row.udt_name),
      nullable: row.is_nullable === 'YES',
      defaultValue: this.parseDefault(row.column_default),
      isGenerated: row.is_generated === 'ALWAYS' || row.is_identity === 'YES',
      isPrimaryKey: pkSet.has(row.column_name),
      isUnique: uniqueSet.has(row.column_name),
      length: row.character_maximum_length,
      precision: row.numeric_precision,
      scale: row.numeric_scale
    }))
  }

  async getRelationships(): Promise<RelationshipInfo[]> {
    const query = `
      SELECT 
        tc.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name as target_table,
        ccu.column_name as target_column,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
    `
    
    const results = await this.dataSource.query(query, [this.schema])
    
    return results.map((row: any) => ({
      type: 'many-to-one',
      sourceTable: row.source_table,
      sourceColumn: row.source_column,
      targetTable: row.target_table,
      targetColumn: row.target_column,
      constraint: row.constraint_name
    }))
  }

  async getPrimaryKeys(tableName: string): Promise<string[]> {
    const query = `
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
      ORDER BY kcu.ordinal_position
    `
    
    const results = await this.dataSource.query(query, [this.schema, tableName])
    return results.map((row: any) => row.column_name)
  }

  async getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    const query = `
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name as foreign_table_name,
        ccu.column_name as foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
    `
    
    const results = await this.dataSource.query(query, [this.schema, tableName])
    
    return results.map((row: any) => ({
      name: row.constraint_name,
      columnName: row.column_name,
      referencedTable: row.foreign_table_name,
      referencedColumn: row.foreign_column_name,
      onDelete: this.mapFKAction(row.delete_rule),
      onUpdate: this.mapFKAction(row.update_rule)
    }))
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const query = `
      SELECT 
        indexname as name,
        indexdef as definition
      FROM pg_indexes
      WHERE schemaname = $1
        AND tablename = $2
        AND indexname NOT LIKE '%_pkey'
    `
    
    const results = await this.dataSource.query(query, [this.schema, tableName])
    
    return results.map((row: any) => {
      // Parse columns from index definition
      const columnsMatch = row.definition.match(/\(([^)]+)\)/)
      const columns = columnsMatch 
        ? columnsMatch[1].split(',').map((c: string) => c.trim())
        : []
      
      return {
        name: row.name,
        columns,
        unique: row.definition.includes('UNIQUE'),
        type: this.extractIndexType(row.definition)
      }
    })
  }

  private async getUniqueColumns(tableName: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = $1
        AND tc.table_name = $2
    `
    
    const results = await this.dataSource.query(query, [this.schema, tableName])
    return results.map((row: any) => row.column_name)
  }

  private mapPostgresType(dataType: string, udtName: string): DataType {
    const type = udtName || dataType
    const upperType = type.toUpperCase()
    
    // Text types
    if (/VARCHAR|CHAR|TEXT/.test(upperType)) return DataType.STRING
    
    // Integer types
    if (/INT2|SMALLINT/.test(upperType)) return DataType.INTEGER
    if (/INT4|INTEGER/.test(upperType)) return DataType.INTEGER
    if (/INT8|BIGINT/.test(upperType)) return DataType.BIGINT
    
    // Numeric types
    if (/NUMERIC|DECIMAL|MONEY/.test(upperType)) return DataType.DECIMAL
    if (/FLOAT4|REAL/.test(upperType)) return DataType.FLOAT
    if (/FLOAT8|DOUBLE/.test(upperType)) return DataType.DOUBLE
    
    // Date/Time types
    if (/DATE/.test(upperType) && !/TIME/.test(upperType)) return DataType.DATE
    if (/TIME/.test(upperType) && !/DATE/.test(upperType)) return DataType.TIME
    if (/TIMESTAMP/.test(upperType)) return DataType.TIMESTAMP
    
    // Boolean
    if (/BOOL/.test(upperType)) return DataType.BOOLEAN
    
    // Binary
    if (/BYTEA/.test(upperType)) return DataType.BINARY
    
    // JSON
    if (/JSONB/.test(upperType)) return DataType.JSONB
    if (/JSON/.test(upperType)) return DataType.JSON
    
    // UUID
    if (/UUID/.test(upperType)) return DataType.UUID
    
    // Array
    if (upperType.includes('[]') || dataType === 'ARRAY') return DataType.ARRAY
    
    // Enum
    if (dataType === 'USER-DEFINED') return DataType.ENUM
    
    return DataType.UNKNOWN
  }

  private parseDefault(defaultValue: string | null): any {
    if (!defaultValue) return undefined
    
    // Remove type casting
    const cleanValue = defaultValue.replace(/::[\w\s]+/g, '')
    
    // Handle nextval (sequences)
    if (cleanValue.includes('nextval')) return 'AUTO_INCREMENT'
    
    // Handle boolean
    if (cleanValue === 'true' || cleanValue === 'false') return cleanValue === 'true'
    
    // Handle NULL
    if (cleanValue === 'NULL') return null
    
    // Handle strings
    if (cleanValue.startsWith("'") && cleanValue.endsWith("'")) {
      return cleanValue.slice(1, -1)
    }
    
    // Handle numbers
    const num = Number(cleanValue)
    if (!isNaN(num)) return num
    
    return cleanValue
  }

  private mapFKAction(action: string): ForeignKeyInfo['onDelete'] {
    switch (action) {
      case 'CASCADE':
        return 'CASCADE'
      case 'SET NULL':
        return 'SET NULL'
      case 'RESTRICT':
        return 'RESTRICT'
      case 'NO ACTION':
        return 'NO ACTION'
      default:
        return 'NO ACTION'
    }
  }

  private extractIndexType(definition: string): IndexInfo['type'] {
    if (definition.includes('btree')) return 'btree'
    if (definition.includes('hash')) return 'hash'
    if (definition.includes('gin')) return 'gin'
    if (definition.includes('gist')) return 'gist'
    if (definition.includes('spgist')) return 'spgist'
    if (definition.includes('brin')) return 'brin'
    return 'btree'
  }

  private async getPostgresVersion(): Promise<string> {
    try {
      const result = await this.dataSource.query('SELECT version()')
      const version = result[0]?.version || ''
      const match = version.match(/PostgreSQL (\d+\.\d+)/)
      return match ? match[1] : 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private async getDatabaseCollation(): Promise<string> {
    try {
      const result = await this.dataSource.query(`
        SELECT datcollate 
        FROM pg_database 
        WHERE datname = current_database()
      `)
      return result[0]?.datcollate || 'unknown'
    } catch {
      return 'unknown'
    }
  }
}