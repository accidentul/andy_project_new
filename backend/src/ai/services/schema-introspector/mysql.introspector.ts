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

export class MySQLIntrospector implements SchemaIntrospector {
  private databaseName: string

  constructor(private dataSource: DataSource) {
    // Get the database name from connection options
    this.databaseName = (dataSource.options as any).database || ''
  }

  getDatabaseType(): DatabaseType {
    const type = this.dataSource.options.type
    return type === 'mariadb' ? 'mariadb' : 'mysql'
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
        indexes,
        comment: await this.getTableComment(tableInfo.name)
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
      databaseType: this.getDatabaseType(),
      tables,
      relationships,
      metadata: {
        version: await this.getMySQLVersion(),
        charset: await this.getDatabaseCharset(),
        collation: await this.getDatabaseCollation()
      }
    }
  }

  async getTables(): Promise<TableInfo[]> {
    const query = `
      SELECT 
        TABLE_NAME as name,
        TABLE_TYPE as type,
        TABLE_ROWS as row_count
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')
      ORDER BY TABLE_NAME
    `
    
    const results = await this.dataSource.query(query, [this.databaseName])
    
    return results.map((row: any) => ({
      name: row.name,
      type: row.type === 'BASE TABLE' ? 'table' : 'view',
      rowCount: row.row_count
    }))
  }

  async getColumns(tableName: string): Promise<ColumnSchema[]> {
    const query = `
      SELECT 
        COLUMN_NAME as column_name,
        DATA_TYPE as data_type,
        IS_NULLABLE as is_nullable,
        COLUMN_DEFAULT as column_default,
        CHARACTER_MAXIMUM_LENGTH as char_max_length,
        NUMERIC_PRECISION as numeric_precision,
        NUMERIC_SCALE as numeric_scale,
        COLUMN_TYPE as column_type,
        COLUMN_KEY as column_key,
        EXTRA as extra,
        COLUMN_COMMENT as column_comment
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `
    
    const results = await this.dataSource.query(query, [this.databaseName, tableName])
    
    return results.map((row: any) => ({
      name: row.column_name,
      type: row.column_type,
      dataType: this.mapMySQLType(row.data_type),
      nullable: row.is_nullable === 'YES',
      defaultValue: this.parseDefault(row.column_default),
      isGenerated: row.extra?.includes('GENERATED') || false,
      isPrimaryKey: row.column_key === 'PRI',
      isUnique: row.column_key === 'UNI',
      length: row.char_max_length,
      precision: row.numeric_precision,
      scale: row.numeric_scale,
      comment: row.column_comment || undefined
    }))
  }

  async getRelationships(): Promise<RelationshipInfo[]> {
    const query = `
      SELECT 
        TABLE_NAME as source_table,
        COLUMN_NAME as source_column,
        REFERENCED_TABLE_NAME as target_table,
        REFERENCED_COLUMN_NAME as target_column,
        CONSTRAINT_NAME as constraint_name
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `
    
    const results = await this.dataSource.query(query, [this.databaseName])
    
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
      SELECT COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = 'PRIMARY'
      ORDER BY ORDINAL_POSITION
    `
    
    const results = await this.dataSource.query(query, [this.databaseName, tableName])
    return results.map((row: any) => row.COLUMN_NAME)
  }

  async getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    const query = `
      SELECT 
        kcu.CONSTRAINT_NAME as constraint_name,
        kcu.COLUMN_NAME as column_name,
        kcu.REFERENCED_TABLE_NAME as referenced_table,
        kcu.REFERENCED_COLUMN_NAME as referenced_column,
        rc.UPDATE_RULE as update_rule,
        rc.DELETE_RULE as delete_rule
      FROM information_schema.KEY_COLUMN_USAGE kcu
      JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
        ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
        AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
      WHERE kcu.TABLE_SCHEMA = ?
        AND kcu.TABLE_NAME = ?
        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    `
    
    const results = await this.dataSource.query(query, [this.databaseName, tableName])
    
    return results.map((row: any) => ({
      name: row.constraint_name,
      columnName: row.column_name,
      referencedTable: row.referenced_table,
      referencedColumn: row.referenced_column,
      onDelete: this.mapFKAction(row.delete_rule),
      onUpdate: this.mapFKAction(row.update_rule)
    }))
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const query = `
      SELECT 
        INDEX_NAME as index_name,
        COLUMN_NAME as column_name,
        NON_UNIQUE as non_unique,
        SEQ_IN_INDEX as seq_in_index,
        INDEX_TYPE as index_type
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND INDEX_NAME != 'PRIMARY'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `
    
    const results = await this.dataSource.query(query, [this.databaseName, tableName])
    
    // Group by index name
    const indexMap = new Map<string, IndexInfo>()
    
    for (const row of results) {
      if (!indexMap.has(row.index_name)) {
        indexMap.set(row.index_name, {
          name: row.index_name,
          columns: [],
          unique: row.non_unique === 0,
          type: row.index_type === 'BTREE' ? 'btree' : 
                row.index_type === 'HASH' ? 'hash' : undefined
        })
      }
      
      const index = indexMap.get(row.index_name)!
      index.columns.push(row.column_name)
    }
    
    return Array.from(indexMap.values())
  }

  private async getTableComment(tableName: string): Promise<string | undefined> {
    const query = `
      SELECT TABLE_COMMENT
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
    `
    
    const results = await this.dataSource.query(query, [this.databaseName, tableName])
    return results[0]?.TABLE_COMMENT || undefined
  }

  private mapMySQLType(dataType: string): DataType {
    const upperType = dataType.toUpperCase()
    
    // Text types
    if (/VARCHAR|CHAR/.test(upperType)) return DataType.STRING
    if (/TEXT|LONGTEXT|MEDIUMTEXT|TINYTEXT/.test(upperType)) return DataType.TEXT
    
    // Integer types
    if (/TINYINT/.test(upperType)) return DataType.INTEGER
    if (/SMALLINT/.test(upperType)) return DataType.INTEGER
    if (/MEDIUMINT/.test(upperType)) return DataType.INTEGER
    if (/INT/.test(upperType) && !/BIGINT/.test(upperType)) return DataType.INTEGER
    if (/BIGINT/.test(upperType)) return DataType.BIGINT
    
    // Numeric types
    if (/DECIMAL|NUMERIC/.test(upperType)) return DataType.DECIMAL
    if (/FLOAT/.test(upperType)) return DataType.FLOAT
    if (/DOUBLE/.test(upperType)) return DataType.DOUBLE
    
    // Date/Time types
    if (upperType === 'DATE') return DataType.DATE
    if (upperType === 'TIME') return DataType.TIME
    if (upperType === 'DATETIME') return DataType.DATETIME
    if (upperType === 'TIMESTAMP') return DataType.TIMESTAMP
    
    // Boolean (MySQL uses TINYINT(1))
    if (upperType === 'TINYINT' || upperType === 'BOOL' || upperType === 'BOOLEAN') {
      return DataType.BOOLEAN
    }
    
    // Binary
    if (/BINARY|VARBINARY/.test(upperType)) return DataType.BINARY
    if (/BLOB|LONGBLOB|MEDIUMBLOB|TINYBLOB/.test(upperType)) return DataType.BLOB
    
    // JSON
    if (upperType === 'JSON') return DataType.JSON
    
    // Enum
    if (upperType === 'ENUM') return DataType.ENUM
    
    return DataType.UNKNOWN
  }

  private parseDefault(defaultValue: string | null): any {
    if (!defaultValue) return undefined
    
    // Handle NULL
    if (defaultValue === 'NULL') return null
    
    // Handle current timestamp
    if (defaultValue.includes('CURRENT_TIMESTAMP')) return 'CURRENT_TIMESTAMP'
    
    // Handle strings
    if (defaultValue.startsWith("'") && defaultValue.endsWith("'")) {
      return defaultValue.slice(1, -1)
    }
    
    // Handle numbers
    const num = Number(defaultValue)
    if (!isNaN(num)) return num
    
    return defaultValue
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

  private async getMySQLVersion(): Promise<string> {
    try {
      const result = await this.dataSource.query('SELECT VERSION() as version')
      const version = result[0]?.version || ''
      const match = version.match(/(\d+\.\d+\.\d+)/)
      return match ? match[1] : 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private async getDatabaseCharset(): Promise<string> {
    try {
      const result = await this.dataSource.query(`
        SELECT DEFAULT_CHARACTER_SET_NAME 
        FROM information_schema.SCHEMATA 
        WHERE SCHEMA_NAME = ?
      `, [this.databaseName])
      return result[0]?.DEFAULT_CHARACTER_SET_NAME || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private async getDatabaseCollation(): Promise<string> {
    try {
      const result = await this.dataSource.query(`
        SELECT DEFAULT_COLLATION_NAME 
        FROM information_schema.SCHEMATA 
        WHERE SCHEMA_NAME = ?
      `, [this.databaseName])
      return result[0]?.DEFAULT_COLLATION_NAME || 'unknown'
    } catch {
      return 'unknown'
    }
  }
}