import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../tenancy/tenant.entity'

export type CrmProvider = 'salesforce' | 'hubspot'

@Entity('crm_accounts')
export class CrmAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant!: Tenant
  @Column() name!: string
  @Column({ nullable: true }) website?: string
  @Column({ nullable: true }) industry?: string
  @Column() provider!: CrmProvider
  @Column() connectorId!: string
  @Index()
  @Column({ nullable: true }) externalId?: string
  @CreateDateColumn() createdAt!: Date
  @UpdateDateColumn() updatedAt!: Date
}

@Entity('crm_contacts')
export class CrmContact {
  @PrimaryGeneratedColumn('uuid') id!: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' }) tenant!: Tenant
  @Column() firstName!: string
  @Column() lastName!: string
  @Index() @Column() email!: string
  @Column({ nullable: true }) phone?: string
  @Column() provider!: CrmProvider
  @Column() connectorId!: string
  @Index() @Column({ nullable: true }) externalId?: string
  @CreateDateColumn() createdAt!: Date
  @UpdateDateColumn() updatedAt!: Date
}

@Entity('crm_deals')
export class CrmDeal {
  @PrimaryGeneratedColumn('uuid') id!: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' }) tenant!: Tenant
  @Column() name!: string
  @Column('decimal', { precision: 14, scale: 2, default: 0 }) amount!: number
  @Column({ nullable: true }) stage?: string
  @Column({ type: 'date', nullable: true }) closeDate?: string
  @Column() provider!: CrmProvider
  @Column() connectorId!: string
  @Index() @Column({ nullable: true }) externalId?: string
  @CreateDateColumn() createdAt!: Date
  @UpdateDateColumn() updatedAt!: Date
}

@Entity('crm_activities')
export class CrmActivity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' }) tenant!: Tenant
  @Column() type!: string // call, email, meeting
  @Column({ type: 'datetime' }) occurredAt!: Date
  @Column({ nullable: true }) subject?: string
  @Column({ type: 'text', nullable: true }) notes?: string
  @Column() provider!: CrmProvider
  @Column() connectorId!: string
  @Index() @Column({ nullable: true }) externalId?: string
  @CreateDateColumn() createdAt!: Date
  @UpdateDateColumn() updatedAt!: Date
}
