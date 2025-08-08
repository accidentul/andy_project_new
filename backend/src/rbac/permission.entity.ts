import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Role } from './role.entity'

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  key!: string // e.g., 'crm.read', 'crm.write', 'analytics.view'

  @Column({ nullable: true })
  description?: string

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[]
}
