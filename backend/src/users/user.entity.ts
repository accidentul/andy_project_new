import { Exclude } from 'class-transformer'
import { BeforeInsert, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../tenancy/tenant.entity'
import { Role } from '../rbac/role.entity'
import * as bcrypt from 'bcrypt'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  email!: string

  @Column()
  name!: string

  @Column()
  @Exclude()
  passwordHash!: string

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { nullable: false, onDelete: 'CASCADE' })
  tenant!: Tenant

  @ManyToOne(() => Role, { nullable: false, eager: true, onDelete: 'RESTRICT' })
  role!: Role

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @BeforeInsert()
  normalizeEmail() {
    this.email = this.email.toLowerCase()
  }

  async setPassword(plain: string) {
    const saltRounds = 10
    this.passwordHash = await bcrypt.hash(plain, saltRounds)
  }

  async validatePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash)
  }
}
