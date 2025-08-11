import { Controller, Post, Get, Body, UseGuards, Request, Query, Param, Delete, HttpCode, HttpStatus, Res, StreamableFile } from '@nestjs/common'
import { Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { EnhancedAiService } from './ai.service.enhanced'
import { AiService } from './ai.service'
import { ActionExecutorService } from './action-executor.service'
import { IsString, IsOptional, IsIn, IsObject, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import * as fs from 'fs'
import * as path from 'path'

class ChatQueryDto {
  @IsString()
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
  
  @IsObject()
  actionData!: any
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
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly enhancedAiService: EnhancedAiService,
    private readonly actionExecutor: ActionExecutorService,
  ) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Request() req: any, @Body() dto: ChatQueryDto) {
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
  async getSuggestedActions(@Request() req: any) {
    const user = req.user
    const actions = await this.enhancedAiService.getSuggestedActions(user)
    
    return {
      success: true,
      actions,
    }
  }

  @Delete('conversation/:id')
  async clearConversation(@Param('id') conversationId: string) {
    await this.enhancedAiService.clearConversation(conversationId)
    
    return {
      success: true,
      message: 'Conversation cleared',
    }
  }

  @Get('widget-suggestions')
  async getWidgetSuggestions(@Request() req: any) {
    const tenantId = req.user.tenant.id
    const suggestions = await this.aiService.generateCrmWidgetSuggestions(tenantId)
    
    return {
      success: true,
      suggestions,
    }
  }

  @Post('seed-data')
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
  async getAvailableRoles() {
    const factory = new (await import('./agents/agent.factory')).AgentFactory()
    const roles = factory.getAvailableRoles()
    
    return {
      success: true,
      roles,
    }
  }

  @Post('actions/execute')
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
}