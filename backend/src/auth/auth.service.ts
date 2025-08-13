import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { User } from '../users/user.entity'
import { Tenant } from '../tenancy/tenant.entity'
import { Role } from '../rbac/role.entity'
import { Permission } from '../rbac/permission.entity'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permRepo: Repository<Permission>,
    private readonly jwtService: JwtService,
  ) {}

  async registerAdmin(dto: RegisterDto) {
    const existingTenant = await this.tenantRepo.findOne({ where: [{ name: dto.companyName }, { slug: dto.companySlug }] })
    if (existingTenant) {
      throw new BadRequestException('Company already exists')
    }

    const tenant = this.tenantRepo.create({ name: dto.companyName, slug: dto.companySlug })
    await this.tenantRepo.save(tenant)

    // Ensure base permissions and admin role exist for this tenant
    const basePermissionsKeys = [
      'crm.read',
      'crm.write',
      'datalake.read',
      'analytics.view',
      'users.manage',
      'roles.manage',
    ]
    const permissions: Permission[] = []
    for (const key of basePermissionsKeys) {
      let perm = await this.permRepo.findOne({ where: { key } })
      if (!perm) {
        perm = this.permRepo.create({ key, description: key })
        await this.permRepo.save(perm)
      }
      permissions.push(perm)
    }

    let adminRole = await this.roleRepo.findOne({ where: { name: 'admin', tenant: { id: tenant.id } }, relations: ['permissions', 'tenant'] })
    if (!adminRole) {
      adminRole = this.roleRepo.create({ name: 'admin', tenant, permissions })
      await this.roleRepo.save(adminRole)
    }

    // Also create a basic user role for the tenant
    let userRole = await this.roleRepo.findOne({ where: { name: 'user', tenant: { id: tenant.id } } })
    if (!userRole) {
      // Create user role with limited permissions
      const userPermissions = await this.permRepo.find({ where: { key: In(['users.read', 'crm.read']) } })
      userRole = this.roleRepo.create({ name: 'user', tenant, permissions: userPermissions })
      await this.roleRepo.save(userRole)
    }

    const adminUser = this.userRepo.create({ email: dto.adminEmail, name: dto.adminName, tenant, role: adminRole })
    await adminUser.setPassword(dto.adminPassword)
    await this.userRepo.save(adminUser)

    return { tenantId: tenant.id, adminId: adminUser.id }
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() }, relations: ['tenant', 'role', 'role.permissions'] })
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const isValid = await user.validatePassword(password)
    if (!isValid) throw new UnauthorizedException('Invalid credentials')
    return user
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      tenantId: user.tenant.id,
      role: user.role.name,
      permissions: user.role.permissions.map((p) => p.key),
    }
    const accessToken = await this.jwtService.signAsync(payload)
    return { accessToken, user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenant.id, role: user.role.name } }
  }
}
