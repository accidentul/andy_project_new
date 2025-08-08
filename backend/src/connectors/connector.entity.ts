import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../tenancy/tenant.entity'

export type ConnectorProvider = 'salesforce' | 'hubspot'

@Entity('connectors')
export class Connector {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant!: Tenant

  @Column()
  provider!: ConnectorProvider

  @Column({ type: 'text' })
  credentialsEncrypted!: string

  @Column({ default: true })
  active!: boolean

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
