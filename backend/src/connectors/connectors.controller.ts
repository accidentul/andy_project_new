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
    return this.connectors.listConnectors(req.user.tenantId)
  }

  @RequirePermissions('datalake.read', 'crm.write')
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Req() req: any, @Body() dto: CreateConnectorDto) {
    return this.connectors.createConnector(req.user.tenantId, dto.provider, dto.credentials, dto.active ?? true)
  }

  @RequirePermissions('crm.write')
  @Post(':id/ingest/accounts')
  async ingestAccounts(@Req() req: any, @Param('id') id: string, @Body() body: { provider: 'salesforce' | 'hubspot'; rows: any[] }) {
    await this.connectors.upsertAccounts(req.user.tenantId, id, body.provider, body.rows)
    return { ok: true }
  }

  @RequirePermissions('crm.write')
  @Post(':id/ingest/contacts')
  async ingestContacts(@Req() req: any, @Param('id') id: string, @Body() body: { provider: 'salesforce' | 'hubspot'; rows: any[] }) {
    await this.connectors.upsertContacts(req.user.tenantId, id, body.provider, body.rows)
    return { ok: true }
  }

  @RequirePermissions('crm.write')
  @Post(':id/ingest/deals')
  async ingestDeals(@Req() req: any, @Param('id') id: string, @Body() body: { provider: 'salesforce' | 'hubspot'; rows: any[] }) {
    await this.connectors.upsertDeals(req.user.tenantId, id, body.provider, body.rows)
    return { ok: true }
  }

  @RequirePermissions('crm.write')
  @Post(':id/ingest/activities')
  async ingestActivities(@Req() req: any, @Param('id') id: string, @Body() body: { provider: 'salesforce' | 'hubspot'; rows: any[] }) {
    await this.connectors.upsertActivities(req.user.tenantId, id, body.provider, body.rows)
    return { ok: true }
  }
}
