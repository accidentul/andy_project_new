import { Controller, Post, Get, Body, UseGuards, Request, Query, Param, Delete, HttpCode, HttpStatus, Res, StreamableFile, BadRequestException } from '@nestjs/common'
import { Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { EnhancedAiService } from './ai.service.enhanced'
import { AiService } from './ai.service'
import { ActionExecutorService } from './action-executor.service'
import { AiAgentService } from './ai-agent.service'
import { SchemaIntrospectorService } from './services/schema-introspector/schema-introspector.service'
import { IsString, IsOptional, IsIn, IsObject, ValidateNested, IsNotEmpty } from 'class-validator'
import { Type } from 'class-transformer'
import * as fs from 'fs'
import * as path from 'path'

class ChatQueryDto {
  @IsString()
  @IsNotEmpty()
  query!: string
  
  @IsOptional()
  @IsString()
  conversationId?: string
}

class DocumentAnalysisDto {
  @IsString()
  documentContent!: string
  
  @IsString()
  documentName!: string
  
  @IsOptional()
  @IsString()
  query?: string
}

class SeedDataDto {
  @IsString()
  connectorId!: string
  
  @IsIn(['salesforce', 'hubspot'])
  provider!: 'salesforce' | 'hubspot'
  
  @IsOptional()
  @IsIn(['small', 'medium', 'large'])
  volume?: 'small' | 'medium' | 'large'
}

class ActionDto {
  @IsString()
  type!: 'automation' | 'alert' | 'recommendation'
  
  @IsString()
  title!: string
  
  @IsString()
  description!: string
  
  @IsString()
  @IsOptional()
  impact?: string
  
  @IsOptional()
  requiresApproval?: boolean
  
  @IsObject()
  @IsOptional()
  actionData?: any
}

class ExecuteActionDto {
  @ValidateNested()
  @Type(() => ActionDto)
  action!: ActionDto
  
  @IsOptional()
  @IsString()
  conversationId?: string
}

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly enhancedAiService: EnhancedAiService,
    private readonly actionExecutor: ActionExecutorService,
    private readonly aiAgentService: AiAgentService,
    private readonly schemaIntrospector: SchemaIntrospectorService,
  ) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async chat(@Request() req: any, @Body() dto: ChatQueryDto) {
    if (!dto.query || dto.query.trim() === '') {
      throw new BadRequestException('Query cannot be empty')
    }
    const user = req.user
    const response = await this.enhancedAiService.processUserQuery(
      user,
      dto.query,
      dto.conversationId,
    )
    
    return {
      success: true,
      response,
      conversationId: dto.conversationId || `conv:${user.id}:${Date.now()}`,
    }
  }

  @Post('analyze-document')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async analyzeDocument(@Request() req: any, @Body() dto: DocumentAnalysisDto) {
    const user = req.user
    const response = await this.enhancedAiService.analyzeDocument(
      user,
      dto.documentContent,
      dto.documentName,
      dto.query,
    )
    
    return {
      success: true,
      response,
    }
  }

  @Get('suggested-actions')
  @UseGuards(JwtAuthGuard)
  async getSuggestedActions(@Request() req: any) {
    const user = req.user
    const actions = await this.enhancedAiService.getSuggestedActions(user)
    
    return {
      success: true,
      actions,
    }
  }

  @Delete('conversation/:id')
  @UseGuards(JwtAuthGuard)
  async clearConversation(@Param('id') conversationId: string) {
    await this.enhancedAiService.clearConversation(conversationId)
    
    return {
      success: true,
      message: 'Conversation cleared',
    }
  }

  @Get('widget-suggestions')
  @UseGuards(JwtAuthGuard)
  async getWidgetSuggestions(@Request() req: any) {
    const tenantId = req.user.tenant.id
    const suggestions = await this.aiService.generateCrmWidgetSuggestions(tenantId)
    
    return {
      success: true,
      suggestions,
    }
  }

  @Post('seed-data')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async seedData(@Request() req: any, @Body() dto: SeedDataDto) {
    const tenantId = req.user.tenant.id
    
    await this.aiService.seedSampleData(
      tenantId,
      dto.connectorId,
      dto.provider,
      { volume: dto.volume },
    )
    
    return {
      success: true,
      message: `Sample ${dto.provider} data seeded successfully`,
    }
  }

  @Get('available-roles')
  @UseGuards(JwtAuthGuard)
  async getAvailableRoles() {
    const factory = new (await import('./agents/agent.factory')).AgentFactory()
    const roles = factory.getAvailableRoles()
    
    return {
      success: true,
      roles,
    }
  }

  @Post('actions/execute')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async executeAction(@Request() req: any, @Body() dto: ExecuteActionDto) {
    const user = req.user
    
    try {
      const result = await this.actionExecutor.executeAction({
        action: dto.action,
        user,
        conversationId: dto.conversationId
      })
      
      return {
        success: result.success,
        message: result.message,
        data: result.data,
        error: result.error
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Action execution failed',
        error: error.message
      }
    }
  }

  @Get('download/:type/:filename')
  @UseGuards(JwtAuthGuard)
  async downloadFile(
    @Param('type') type: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const allowedTypes = ['presentation', 'export', 'report', 'analysis']
    if (!allowedTypes.includes(type)) {
      res.status(404)
      return { error: 'Invalid download type' }
    }
    
    const filepath = path.join(process.cwd(), 'data', `${type}s`, filename)
    
    if (!fs.existsSync(filepath)) {
      res.status(404)
      return { error: 'File not found' }
    }
    
    const file = fs.createReadStream(filepath)
    res.set({
      'Content-Type': filename.endsWith('.csv') ? 'text/csv' : 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`
    })
    
    return new StreamableFile(file)
  }

  @Post('chat/agent')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async chatWithAgent(
    @Request() req: any, 
    @Body() dto: ChatQueryDto & { agentRole?: string }
  ) {
    const user = req.user
    const agentRole = dto.agentRole || user.role?.name || 'Sales Manager'
    
    const context = {
      tenantId: user.tenant?.id,
      userId: user.id,
      userRole: user.role?.name,
    }

    const response = await this.aiAgentService.processWithAgent(
      dto.query,
      agentRole,
      context,
      false
    )
    
    return {
      success: true,
      response,
      agentRole,
      conversationId: dto.conversationId || `conv:${user.id}:${Date.now()}`,
    }
  }

  @Get('tools/available')
  @UseGuards(JwtAuthGuard)
  async getAvailableTools(@Request() req: any) {
    const user = req.user
    const role = user.role?.name || 'Sales Manager'
    
    return {
      success: true,
      role,
      tools: this.aiAgentService.getAvailableTools(role),
    }
  }

  @Post('tools/execute')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async executeTool(
    @Request() req: any,
    @Body() dto: { toolName: string; params: any }
  ) {
    const user = req.user
    
    const context = {
      tenantId: user.tenant?.id,
      userId: user.id,
      userRole: user.role?.name || 'Sales Manager',
    }

    const result = await this.aiAgentService.executeToolDirectly(
      dto.toolName,
      dto.params,
      context
    )
    
    return {
      success: result.success,
      data: result.data,
      message: result.message,
      error: result.error,
    }
  }

  @Get('agents/available')
  @UseGuards(JwtAuthGuard)
  async getAvailableAgents() {
    return {
      success: true,
      agents: this.aiAgentService.getAvailableAgents(),
    }
  }

  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  async getSuggestions(@Request() req: any) {
    const user = req.user
    const tenantId = user.tenant?.id
    
    try {
      const suggestions = await this.aiService.generateCrmWidgetSuggestions(tenantId)
      const actions = await this.enhancedAiService.getSuggestedActions(user)
      
      return {
        success: true,
        suggestions: {
          widgets: suggestions,
          actions: actions.slice(0, 3),
          insights: [
            {
              id: 'insight1',
              title: 'Sales Pipeline Trend',
              description: 'Your sales pipeline has grown 15% this quarter',
              type: 'positive',
              icon: 'trending-up',
            },
            {
              id: 'insight2',
              title: 'Customer Satisfaction',
              description: 'NPS score increased to 72 from 65',
              type: 'positive',
              icon: 'smile',
            },
            {
              id: 'insight3',
              title: 'Marketing ROI',
              description: 'Current campaigns showing 3.2x ROI',
              type: 'info',
              icon: 'chart',
            },
          ],
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        suggestions: {
          widgets: [],
          actions: [],
          insights: [],
        },
      }
    }
  }

  @Get('schema')
  @UseGuards(JwtAuthGuard)
  async getDatabaseSchema(@Request() req: any) {
    try {
      const user = req.user
      
      // Only allow admin or technical roles to view schema
      if (!['Admin', 'admin', 'CEO', 'CTO'].includes(user.role?.name)) {
        return {
          success: false,
          error: 'Insufficient permissions to view database schema'
        }
      }
      
      const schema = await this.schemaIntrospector.getSchema()
      
      // Convert Map to object for JSON serialization
      const tablesObject: Record<string, any> = {}
      for (const [tableName, tableSchema] of schema.tables) {
        const columnsObject: Record<string, any> = {}
        for (const [colName, colSchema] of tableSchema.columns) {
          columnsObject[colName] = colSchema
        }
        tablesObject[tableName] = {
          ...tableSchema,
          columns: columnsObject
        }
      }
      
      return {
        success: true,
        schema: {
          databaseType: schema.databaseType,
          tables: tablesObject,
          relationships: schema.relationships,
          metadata: schema.metadata
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  @Post('schema/refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refreshDatabaseSchema(@Request() req: any) {
    try {
      const user = req.user
      
      // Only allow admin or technical roles to refresh schema
      if (!['Admin', 'admin', 'CEO', 'CTO'].includes(user.role?.name)) {
        return {
          success: false,
          error: 'Insufficient permissions to refresh database schema'
        }
      }
      
      await this.schemaIntrospector.refreshSchema()
      
      return {
        success: true,
        message: 'Database schema refreshed successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  @Get('schema/tables')
  @UseGuards(JwtAuthGuard)
  async getTableList(@Request() req: any) {
    try {
      const schema = await this.schemaIntrospector.getSchema()
      const tables = Array.from(schema.tables.keys()).sort()
      
      return {
        success: true,
        tables,
        count: tables.length
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  @Get('schema/table/:tableName')
  @UseGuards(JwtAuthGuard)
  async getTableSchema(
    @Request() req: any,
    @Param('tableName') tableName: string
  ) {
    try {
      const schema = await this.schemaIntrospector.getSchema()
      const tableSchema = schema.tables.get(tableName)
      
      if (!tableSchema) {
        return {
          success: false,
          error: `Table ${tableName} not found`
        }
      }
      
      // Convert Map to object for JSON serialization
      const columnsObject: Record<string, any> = {}
      for (const [colName, colSchema] of tableSchema.columns) {
        columnsObject[colName] = colSchema
      }
      
      // Find relationships for this table
      const relationships = schema.relationships.filter(
        rel => rel.sourceTable === tableName || rel.targetTable === tableName
      )
      
      return {
        success: true,
        table: {
          ...tableSchema,
          columns: columnsObject
        },
        relationships
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}