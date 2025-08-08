import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { User } from './user.entity'
import { Role } from '../rbac/role.entity'
import { Permission } from '../rbac/permission.entity'
import { Tenant } from '../tenancy/tenant.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission, Tenant])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
