import { Body, Controller, Get, Param, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RequirePermissions } from '../auth/permissions.decorator'
import { PermissionsGuard } from '../auth/permissions.guard'
import { ConnectorsService } from './connectors.service'
import { CreateConnectorDto } from './dto/create-connector.dto'

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('connectors')
export class ConnectorsController {
  constructor(private readonly connectors: ConnectorsService) {}

  @RequirePermissions('datalake.read', 'crm.read')
  @Get()
  async list(@Req() req: any) {
    const tenantId = req.user.tenant?.id || req.user.tenantId
    return this.connectors.listConnectors(tenantId)
  }

  @RequirePermissions('datalake.read', 'crm.write')
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Req() req: any, @Body() dto: CreateConnectorDto) {
    const tenantId = req.user.tenant?.id || req.user.tenantId
    return this.connectors.createConnector(tenantId, dto.provider, dto.credentials, dto.active ?? true)
  }

  @RequirePermissions('crm.write')
  @Post(':id/ingest/accounts')
  async ingestAccounts(@Req() req: any, @Param('id') id: string, @Body() body: { provider: 'salesforce' | 'hubspot'; rows: any[] }) {
    const tenantId = req.user.tenant?.id || req.user.tenantId
    await this.connectors.upsertAccounts(tenantId, id, body.provider, body.rows)
    return { ok: true }
  }

  @RequirePermissions('crm.write')
  @Post(':id/ingest/contacts')
  async ingestContacts(@Req() req: any, @Param('id') id: string, @Body() body: { provider: 'salesforce' | 'hubspot'; rows: any[] }) {
    const tenantId = req.user.tenant?.id || req.user.tenantId
    await this.connectors.upsertContacts(tenantId, id, body.provider, body.rows)
    return { ok: true }
  }

  @RequirePermissions('crm.write')
  @Post(':id/ingest/deals')
  async ingestDeals(@Req() req: any, @Param('id') id: string, @Body() body: { provider: 'salesforce' | 'hubspot'; rows: any[] }) {
    const tenantId = req.user.tenant?.id || req.user.tenantId
    await this.connectors.upsertDeals(tenantId, id, body.provider, body.rows)
    return { ok: true }
  }

  @RequirePermissions('crm.write')
  @Post(':id/ingest/activities')
  async ingestActivities(@Req() req: any, @Param('id') id: string, @Body() body: { provider: 'salesforce' | 'hubspot'; rows: any[] }) {
    const tenantId = req.user.tenant?.id || req.user.tenantId
    await this.connectors.upsertActivities(tenantId, id, body.provider, body.rows)
    return { ok: true }
  }
}
