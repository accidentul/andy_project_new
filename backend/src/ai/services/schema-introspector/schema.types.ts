export type DatabaseType = 'postgres' | 'mysql' | 'mariadb' | 'sqlite' | 'mssql' | 'oracle'

export interface DatabaseSchema {
  databaseType: DatabaseType
  tables: Map<string, TableSchema>
  relationships: RelationshipInfo[]
  metadata?: {
    version?: string
    collation?: string
    charset?: string
  }
}

export interface TableSchema {
  name: string
  schema?: string // For databases that support schemas (PostgreSQL, MSSQL)
  columns: Map<string, ColumnSchema>
  primaryKeys: string[]
  foreignKeys: ForeignKeyInfo[]
  indexes: IndexInfo[]
  comment?: string
  businessName?: string
  description?: string
  category?: 'crm' | 'user' | 'system' | 'analytics'
  commonQueries?: string[]
}

export interface ColumnSchema {
  name: string
  type: string // Original database type
  dataType: DataType // Normalized type for cross-database compatibility
  nullable: boolean
  defaultValue?: any
  isGenerated?: boolean
  isPrimaryKey?: boolean
  isUnique?: boolean
  length?: number
  precision?: number
  scale?: number
  comment?: string
  businessName?: string
  description?: string
  dataCategory?: 'identifier' | 'measure' | 'dimension' | 'date' | 'text' | 'system'
  aggregatable?: boolean
  groupable?: boolean
  synonyms?: string[]
}

export enum DataType {
  // Text types
  STRING = 'string',
  TEXT = 'text',
  
  // Numeric types
  INTEGER = 'integer',
  BIGINT = 'bigint',
  DECIMAL = 'decimal',
  FLOAT = 'float',
  DOUBLE = 'double',
  
  // Date/Time types
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  TIMESTAMP = 'timestamp',
  
  // Boolean
  BOOLEAN = 'boolean',
  
  // Binary
  BINARY = 'binary',
  BLOB = 'blob',
  
  // JSON
  JSON = 'json',
  JSONB = 'jsonb',
  
  // Other
  UUID = 'uuid',
  ARRAY = 'array',
  ENUM = 'enum',
  UNKNOWN = 'unknown'
}

export interface ForeignKeyInfo {
  name: string
  columnName: string
  referencedTable: string
  referencedColumn: string
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
}

export interface RelationshipInfo {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
  joinTable?: string // For many-to-many relationships
  constraint?: string
}

export interface IndexInfo {
  name: string
  columns: string[]
  unique: boolean
  type?: 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin'
}

export interface SchemaIntrospector {
  getDatabaseType(): DatabaseType
  getSchema(): Promise<DatabaseSchema>
  getTables(): Promise<TableInfo[]>
  getColumns(tableName: string): Promise<ColumnSchema[]>
  getRelationships(): Promise<RelationshipInfo[]>
  getPrimaryKeys(tableName: string): Promise<string[]>
  getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]>
  getIndexes(tableName: string): Promise<IndexInfo[]>
}

export interface TableInfo {
  name: string
  schema?: string
  type: 'table' | 'view'
  rowCount?: number
}