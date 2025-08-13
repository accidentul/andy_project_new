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

export class SQLiteIntrospector implements SchemaIntrospector {
  constructor(private dataSource: DataSource) {}

  getDatabaseType(): DatabaseType {
    return 'sqlite'
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
          targetColumn: fk.referencedColumn
        })
      }
    }

    return {
      databaseType: 'sqlite',
      tables,
      relationships,
      metadata: {
        version: await this.getSQLiteVersion()
      }
    }
  }

  async getTables(): Promise<TableInfo[]> {
    const query = `
      SELECT name, type 
      FROM sqlite_master 
      WHERE type IN ('table', 'view') 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
    
    const results = await this.dataSource.query(query)
    
    return results.map((row: any) => ({
      name: row.name,
      type: row.type as 'table' | 'view'
    }))
  }

  async getColumns(tableName: string): Promise<ColumnSchema[]> {
    const query = `PRAGMA table_info('${tableName}')`
    const results = await this.dataSource.query(query)
    
    return results.map((row: any) => ({
      name: row.name,
      type: row.type,
      dataType: this.mapSQLiteType(row.type),
      nullable: row.notnull === 0,
      defaultValue: row.dflt_value,
      isPrimaryKey: row.pk === 1,
      isGenerated: false // SQLite doesn't have generated columns in older versions
    }))
  }

  async getRelationships(): Promise<RelationshipInfo[]> {
    const relationships: RelationshipInfo[] = []
    const tables = await this.getTables()
    
    for (const table of tables) {
      const foreignKeys = await this.getForeignKeys(table.name)
      
      for (const fk of foreignKeys) {
        relationships.push({
          type: 'many-to-one',
          sourceTable: table.name,
          sourceColumn: fk.columnName,
          targetTable: fk.referencedTable,
          targetColumn: fk.referencedColumn
        })
      }
    }
    
    return relationships
  }

  async getPrimaryKeys(tableName: string): Promise<string[]> {
    const query = `PRAGMA table_info('${tableName}')`
    const results = await this.dataSource.query(query)
    
    return results
      .filter((row: any) => row.pk > 0)
      .sort((a: any, b: any) => a.pk - b.pk)
      .map((row: any) => row.name)
  }

  async getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    const query = `PRAGMA foreign_key_list('${tableName}')`
    const results = await this.dataSource.query(query)
    
    return results.map((row: any) => ({
      name: `fk_${tableName}_${row.id}`,
      columnName: row.from,
      referencedTable: row.table,
      referencedColumn: row.to,
      onDelete: row.on_delete,
      onUpdate: row.on_update
    }))
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const query = `PRAGMA index_list('${tableName}')`
    const results = await this.dataSource.query(query)
    const indexes: IndexInfo[] = []
    
    for (const row of results) {
      const indexInfo = await this.dataSource.query(
        `PRAGMA index_info('${row.name}')`
      )
      
      indexes.push({
        name: row.name,
        columns: indexInfo.map((col: any) => col.name),
        unique: row.unique === 1
      })
    }
    
    return indexes
  }

  private mapSQLiteType(type: string): DataType {
    const upperType = type.toUpperCase()
    
    // Text types
    if (upperType.includes('CHAR') || upperType.includes('TEXT') || upperType.includes('CLOB')) {
      return DataType.TEXT
    }
    
    // Integer types
    if (upperType.includes('INT')) {
      if (upperType.includes('BIGINT')) {
        return DataType.BIGINT
      }
      return DataType.INTEGER
    }
    
    // Numeric types
    if (upperType.includes('REAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
      return DataType.FLOAT
    }
    if (upperType.includes('DECIMAL') || upperType.includes('NUMERIC')) {
      return DataType.DECIMAL
    }
    
    // Date/Time types
    if (upperType.includes('DATE')) {
      if (upperType.includes('DATETIME')) {
        return DataType.DATETIME
      }
      return DataType.DATE
    }
    if (upperType.includes('TIME')) {
      return DataType.TIME
    }
    
    // Boolean (SQLite stores as integer)
    if (upperType.includes('BOOL')) {
      return DataType.BOOLEAN
    }
    
    // Binary
    if (upperType.includes('BLOB')) {
      return DataType.BLOB
    }
    
    return DataType.UNKNOWN
  }

  private async getSQLiteVersion(): Promise<string> {
    try {
      const result = await this.dataSource.query('SELECT sqlite_version() as version')
      return result[0]?.version || 'unknown'
    } catch {
      return 'unknown'
    }
  }
}