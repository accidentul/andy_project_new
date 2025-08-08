import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Permission } from './permission.entity'
import { Tenant } from '../tenancy/tenant.entity'

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  name!: string // e.g., 'admin', 'analyst', 'viewer'

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  tenant!: Tenant

  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
  @JoinTable({ name: 'role_permissions' })
  permissions!: Permission[]
}
