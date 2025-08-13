import { Body, Controller, Get, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common'
import { UsersService } from './users.service'
import { AuthGuard } from '@nestjs/passport'
import { RequirePermissions } from '../auth/permissions.decorator'
import { PermissionsGuard } from '../auth/permissions.guard'
import { CreateUserDto } from './dto/create-user.dto'
import { CreateRoleDto } from './dto/create-role.dto'

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    return req.user
  }

  @RequirePermissions('users.manage')
  @Post('create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createUser(@Req() req: any, @Body() dto: CreateUserDto) {
    const tenantId = req.user.tenantId as string
    return this.usersService.createUserWithinTenant({ 
      tenantId, 
      email: dto.email, 
      name: dto.name, 
      password: dto.password, 
      roleId: dto.roleId,
      roleTitle: dto.roleTitle,
      department: dto.department
    })
  }

  @RequirePermissions('roles.manage')
  @Get('roles')
  async listRoles(@Req() req: any) {
    const tenantId = req.user.tenantId as string
    return this.usersService.listRolesByTenant(tenantId)
  }

  @RequirePermissions('roles.manage')
  @Post('roles')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createRole(@Req() req: any, @Body() dto: CreateRoleDto) {
    const tenantId = req.user.tenantId as string
    return this.usersService.createRole({ tenantId, name: dto.name, permissionKeys: dto.permissionKeys })
  }
}
