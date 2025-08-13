import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SeedService } from './seed.service'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { ConnectorsModule } from '../connectors/connectors.module'
import { AiModule } from '../ai/ai.module'
import { Tenant } from '../tenancy/tenant.entity'
import { User } from '../users/user.entity'
import { Role } from '../rbac/role.entity'
import { Permission } from '../rbac/permission.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, Role, Permission]),
    AuthModule,
    UsersModule,
    ConnectorsModule,
    AiModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}