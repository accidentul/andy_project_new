import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { User } from './user.entity'
import { Role } from '../rbac/role.entity'
import { Permission } from '../rbac/permission.entity'
import { Tenant } from '../tenancy/tenant.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permRepo: Repository<Permission>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async createUserWithinTenant(params: {
    tenantId: string
    email: string
    name: string
    password: string
    roleId: string
    roleTitle?: string
    department?: string
  }) {
    const tenant = await this.tenantRepo.findOne({ where: { id: params.tenantId } })
    if (!tenant) throw new NotFoundException('Tenant not found')

    // Try to find role by ID first, then by name if ID lookup fails
    let role = await this.roleRepo.findOne({ where: { id: params.roleId }, relations: ['tenant'] })
    if (!role) {
      // If not found by ID, try by name (for convenience in tests)
      role = await this.roleRepo.findOne({ where: { name: params.roleId, tenant: { id: tenant.id } }, relations: ['tenant'] })
    }
    if (!role || role.tenant.id !== tenant.id) throw new BadRequestException('Invalid role for tenant')

    const existing = await this.userRepo.findOne({ where: { email: params.email.toLowerCase() } })
    if (existing) throw new BadRequestException('User already exists')

    const user = this.userRepo.create({ 
      email: params.email, 
      name: params.name, 
      tenant, 
      role,
      roleTitle: params.roleTitle,
      department: params.department
    })
    await user.setPassword(params.password)
    await this.userRepo.save(user)
    return user
  }

  async listRolesByTenant(tenantId: string) {
    return this.roleRepo.find({ where: { tenant: { id: tenantId } }, relations: ['permissions'] })
  }

  async createRole(params: { tenantId: string; name: string; permissionKeys: string[] }) {
    const tenant = await this.tenantRepo.findOne({ where: { id: params.tenantId } })
    if (!tenant) throw new NotFoundException('Tenant not found')

    const keys = params.permissionKeys || []
    const perms = keys.length ? await this.permRepo.find({ where: { key: In(keys) } }) : []
    const role = this.roleRepo.create({ name: params.name, tenant, permissions: perms })
    await this.roleRepo.save(role)
    return role
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: ['tenant', 'role', 'role.permissions']
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase() },
      relations: ['tenant', 'role', 'role.permissions']
    })
  }
}
