import { Controller, Post, Get, Body, Query, UseGuards, Request, Res, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { User } from '../users/user.entity'
import { IsString, IsOptional } from 'class-validator'
import { CrmAccount, CrmContact, CrmDeal, CrmActivity } from '../connectors/unified-crm.entities'

// Import the new intelligent system components
import { QueryAnalyzer } from './core/query-analyzer'
import { ToolSelector } from './core/tool-selector'
import { ResponseGenerator } from './core/response-generator'
import { ContextManager } from './core/context-manager'
import { ToolRegistry } from './tools/tool-registry'

class StreamingChatDto {
  @IsString()
  query!: string
  
  @IsOptional()
  @IsString()
  conversationId?: string
}

@Controller('ai')
export class AiStreamingController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly queryAnalyzer: QueryAnalyzer,
    private readonly toolSelector: ToolSelector,
    private readonly responseGenerator: ResponseGenerator,
    private readonly contextManager: ContextManager,
    private readonly toolRegistry: ToolRegistry,
    @InjectRepository(CrmAccount) private accountRepo: Repository<CrmAccount>,
    @InjectRepository(CrmContact) private contactRepo: Repository<CrmContact>,
    @InjectRepository(CrmDeal) private dealRepo: Repository<CrmDeal>,
    @InjectRepository(CrmActivity) private activityRepo: Repository<CrmActivity>,
  ) {}

  @Get('chat/stream')
  async streamChatGet(
    @Query('query') query: string, 
    @Query('token') token: string, 
    @Query('conversationId') conversationId: string = '',
    @Res() res: Response
  ) {
    // Set up SSE headers with proper UTF-8 encoding
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('X-Accel-Buffering', 'no')
    
    // Validate token and get user
    if (!token) {
      res.write(`data: ${JSON.stringify({ error: 'Authentication required' })}\n\n`)
      res.end()
      return
    }
    
    let user: any
    try {
      const payload = await this.jwtService.verifyAsync(token) as any
      user = await this.usersService.findById(payload.sub)
      if (!user) {
        res.write(`data: ${JSON.stringify({ error: 'User not found' })}\n\n`)
        res.end()
        return
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: 'Invalid token' })}\n\n`)
      res.end()
      return
    }
    
    if (!query) {
      res.write(`data: ${JSON.stringify({ error: 'Query is required' })}\n\n`)
      res.end()
      return
    }
    
    try {
      // Generate a conversation ID if not provided
      const finalConversationId = conversationId || `conv_${Date.now()}_${user.id}`
      await this.processIntelligentQuery(query, user, finalConversationId, res)
    } catch (error: any) {
      console.error('Streaming error:', error)
      res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`)
      res.end()
    }
  }
  
  @Post('chat/stream')
  @UseGuards(JwtAuthGuard)
  async streamChat(@Request() req: any, @Body() dto: StreamingChatDto, @Res() res: Response) {
    const user = req.user
    
    // Set up SSE headers with proper UTF-8 encoding
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('X-Accel-Buffering', 'no')
    
    try {
      const conversationId = dto.conversationId || `conv_${Date.now()}_${user.id}`
      await this.processIntelligentQuery(dto.query, user, conversationId, res)
    } catch (error) {
      console.error('Streaming error:', error)
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'An error occurred during streaming' })}\n\n`)
      res.end()
    }
  }

  private async processIntelligentQuery(
    query: string,
    user: any,
    conversationId: string,
    res: Response
  ): Promise<void> {
    try {
      // Step 1: Analyze the query
      const analysis = this.queryAnalyzer.analyze(query)
      
      // Step 2: Get conversation context
      const context = this.contextManager.getContext(
        conversationId,
        user.id,
        user.tenant.id
      )
      
      const contextData = this.contextManager.getContextForQuery(conversationId)
      const refinedAnalysis = contextData ? 
        this.queryAnalyzer.refineWithContext(analysis, contextData) : 
        analysis

      // Step 3: Select appropriate tools
      const userRole = user.role?.name || user.roleTitle || 'admin'
      let executionPlan
      
      try {
        executionPlan = this.toolSelector.selectTools(query, userRole, contextData)
      } catch (error) {
        // Fallback to basic information if no tools match
        await this.streamBasicResponse(query, user, res)
        return
      }

      // Step 4: Execute tools
      res.write(`data: ${JSON.stringify({ 
        type: 'thinking', 
        message: 'Analyzing your request...' 
      })}\n\n`)

      const toolResults = []
      const toolsUsed = []

      // Execute primary tool
      try {
        const toolContext = this.toolRegistry.createContext(
          user.tenant.id,
          user.id,
          userRole,
          user.department
        )

        const primaryResult = await executionPlan.primary.tool.execute(
          executionPlan.primary.params,
          toolContext
        )
        
        toolResults.push(primaryResult)
        toolsUsed.push(executionPlan.primary.tool.name)

        // Execute secondary tools if they exist
        if (executionPlan.secondary && executionPlan.secondary.length > 0) {
          for (const secondary of executionPlan.secondary) {
            try {
              const secondaryResult = await secondary.tool.execute(
                secondary.params,
                toolContext
              )
              toolResults.push(secondaryResult)
              toolsUsed.push(secondary.tool.name)
            } catch (err) {
              console.warn(`Secondary tool ${secondary.tool.name} failed:`, err)
              // Continue execution even if secondary tools fail
            }
          }
        }
      } catch (error) {
        console.error('Tool execution failed:', error)
        await this.streamErrorResponse(
          `I encountered an issue while analyzing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
          res
        )
        return
      }

      // Step 5: Generate response
      res.write(`data: ${JSON.stringify({ 
        type: 'processing', 
        message: 'Generating insights...' 
      })}\n\n`)

      const responseData = this.responseGenerator.generateResponse(
        query,
        refinedAnalysis,
        executionPlan,
        toolResults
      )

      // Extract visualization data from tool results if available
      let visualizationData = null
      console.log('[Stream] Tool results:', JSON.stringify(toolResults, null, 2))
      if (toolResults.length > 0 && toolResults[0].data?.visualization) {
        visualizationData = toolResults[0].data.visualization
        console.log('[Stream] Found visualization data:', visualizationData)
      } else {
        console.log('[Stream] No visualization data found in tool results')
      }

      // Step 6: Update context
      this.contextManager.updateContext(
        conversationId,
        query,
        refinedAnalysis,
        responseData.content,
        toolsUsed
      )

      // Step 7: Stream the response (content first)
      await this.streamResponse(responseData, res)
      
      // Step 7b: Send visualization data after content
      if (visualizationData) {
        res.write(`data: ${JSON.stringify({ 
          type: 'visualization', 
          visualization: visualizationData 
        })}\n\n`, 'utf8')
      }

      // Step 8: Send follow-up suggestions
      const followUpQuestions = this.contextManager.suggestFollowUpQuestions(conversationId)
      if (followUpQuestions.length > 0) {
        res.write(`data: ${JSON.stringify({ 
          type: 'suggestions', 
          questions: followUpQuestions 
        })}\n\n`)
      }

      // Step 9: Send completion
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      res.end()

    } catch (error) {
      console.error('Intelligent query processing failed:', error)
      await this.streamErrorResponse(
        'I encountered an unexpected error while processing your request. Please try rephrasing your question.',
        res
      )
    }
  }

  private async streamResponse(responseData: any, res: Response): Promise<void> {
    const content = responseData.content
    
    // Stream content in meaningful chunks (sentences or paragraphs)
    const paragraphs = content.split(/\n\n+/)
    let accumulatedContent = ''
    
    for (const paragraph of paragraphs) {
      // Split by sentence-ending punctuation but keep the punctuation
      const sentences = paragraph.split(/(?<=[.!?])\s+/)
      
      for (const sentence of sentences) {
        // Add sentence to accumulated content
        if (accumulatedContent && !accumulatedContent.endsWith('\n\n')) {
          accumulatedContent += ' '
        }
        accumulatedContent += sentence
        
        // Send the complete accumulated content so far
        const data = JSON.stringify({ 
          type: 'content',
          content: accumulatedContent,
        })
        
        // Ensure proper UTF-8 encoding for the SSE data
        res.write(`data: ${data}\n\n`, 'utf8')
        
        // Small delay between sentences for natural flow
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // Add paragraph break if not the last paragraph
      if (paragraph !== paragraphs[paragraphs.length - 1]) {
        accumulatedContent += '\n\n'
        res.write(`data: ${JSON.stringify({ 
          type: 'content',
          content: accumulatedContent,
        })}\n\n`, 'utf8')
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Send metrics if available
    if (responseData.metrics) {
      res.write(`data: ${JSON.stringify({ 
        type: 'metrics', 
        metrics: responseData.metrics 
      })}\n\n`)
    }

    // Send summary if available
    if (responseData.summary) {
      res.write(`data: ${JSON.stringify({ 
        type: 'summary', 
        summary: responseData.summary 
      })}\n\n`)
    }
  }

  private async streamBasicResponse(query: string, user: any, res: Response): Promise<void> {
    // Fallback for queries that don't match any tools
    const lowerQuery = query.toLowerCase()
    let response = ''

    if (lowerQuery.includes('user') || lowerQuery.includes('who') || lowerQuery.includes('team')) {
      const users = await this.dataSource.getRepository(User).find({
        where: { tenant: { id: user.tenant.id } },
        select: ['name', 'email', 'roleTitle', 'department']
      })
      
      response = users.length > 1 ? 
        `You have ${users.length} users in your organization across various departments and roles.` :
        `You are currently the only user in ${user.tenant.name}. You can add more team members through the admin panel.`
    } else {
      response = `I understand you're asking about "${query}". I can help you analyze your business data, track performance metrics, forecast revenue, and much more. Try asking specific questions like:

• "What's our win rate?"
• "Show me lost deals"
• "How is our pipeline health?"
• "What's the revenue forecast?"
• "What are our biggest risks?"

What would you like to know?`
    }

    await this.streamSimpleText(response, res)
    
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
  }

  private async streamErrorResponse(message: string, res: Response): Promise<void> {
    await this.streamSimpleText(message, res)
    
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
  }

  private async streamSimpleText(text: string, res: Response): Promise<void> {
    // Stream simple text in complete sentences
    const sentences = text.split(/(?<=[.!?])\s+/)
    let accumulatedContent = ''
    
    for (const sentence of sentences) {
      if (accumulatedContent) {
        accumulatedContent += ' '
      }
      accumulatedContent += sentence
      
      // Send accumulated content with UTF-8 encoding
      res.write(`data: ${JSON.stringify({ 
        type: 'content',
        content: accumulatedContent,
      })}\n\n`, 'utf8')
      
      // Small delay between sentences
      await new Promise(resolve => setTimeout(resolve, 80))
    }
  }
}