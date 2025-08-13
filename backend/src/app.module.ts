import { webcrypto, randomUUID } from 'crypto'

// Ensure global Web Crypto API is available for libraries expecting `globalThis.crypto`
// Fallback to providing only `randomUUID` if `webcrypto` is not supported by the Node version
const globalAny = globalThis as any
if (!globalAny.crypto) {
  globalAny.crypto = webcrypto || { randomUUID }
}

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
import { AiModule } from './ai/ai.module'
import { SeedModule } from './seed/seed.module'
import { Connector } from './connectors/connector.entity'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from './connectors/unified-crm.entities'
import { InsightsModule } from './ai/insights/insights.module'

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
    AiModule,
    SeedModule,
    InsightsModule,
  ],
})
export class AppModule {}
