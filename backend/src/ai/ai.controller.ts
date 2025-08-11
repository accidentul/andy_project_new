import { Controller, Post, Get, Body, UseGuards, Request, Query, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { EnhancedAiService } from './ai.service.enhanced'
import { AiService } from './ai.service'
import { IsString, IsOptional, IsIn } from 'class-validator'

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

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly enhancedAiService: EnhancedAiService,
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
}