import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { Tenant } from './tenancy/tenant.entity'
import { User } from './users/user.entity'
import { Role } from './rbac/role.entity'
import { Permission } from './rbac/permission.entity'
import { ConnectorsModule } from './connectors/connectors.module'
import { Connector } from './connectors/connector.entity'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from './connectors/unified-crm.entities'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite',
        database: process.env.DATABASE_PATH || 'andi.sqlite',
        synchronize: true,
        entities: [Tenant, User, Role, Permission, Connector, CrmAccount, CrmContact, CrmDeal, CrmActivity],
      }),
    }),
    AuthModule,
    UsersModule,
    ConnectorsModule,
  ],
})
export class AppModule {}
