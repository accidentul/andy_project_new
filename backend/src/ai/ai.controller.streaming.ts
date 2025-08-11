import { Controller, Post, Get, Body, Query, UseGuards, Request, Res, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtService } from '@nestjs/jwt'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { AgentFactory } from './agents/agent.factory'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/user.entity'
import { IsString, IsOptional } from 'class-validator'
import { CrmAccount, CrmContact, CrmDeal, CrmActivity } from '../connectors/unified-crm.entities'

class StreamingChatDto {
  @IsString()
  query!: string
  
  @IsOptional()
  @IsString()
  conversationId?: string
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiStreamingController {
  private agentFactory: AgentFactory

  constructor() {
    this.agentFactory = new AgentFactory()
  }

  @Get('chat/stream')
  async streamChatGet(@Query('query') query: string, @Query('token') token: string, @Res() res: Response) {
    // Validate token manually for GET request
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    
    try {
      // Simple streaming response for now
      const messages = query.split(' ')
      for (const word of messages) {
        res.write(`data: ${JSON.stringify({ type: 'content', content: word + ' ' })}\n\n`)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      res.end()
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Streaming failed' })}\n\n`)
      res.end()
    }
  }
  
  @Post('chat/stream')
  async streamChat(@Request() req: any, @Body() dto: StreamingChatDto, @Res() res: Response) {
    const user = req.user
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    
    try {
      // Get appropriate agent for user
      const agent = this.agentFactory.getAgentForUser(user)
      
      // Create streaming LLM
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.7,
        streaming: true,
      })
      
      // Build role-specific system prompt
      const roleTitle = (user as any).roleTitle || user.role?.name || 'User'
      const department = (user as any).department || 'General'
      
      const messages = [
        new SystemMessage(`You are an AI assistant specialized for ${roleTitle} in the ${department} department.
          Focus on providing role-specific insights and actionable recommendations.
          Be concise but thorough in your analysis.`),
        new HumanMessage(dto.query),
      ]
      
      // Stream the response
      const stream = await llm.stream(messages)
      
      for await (const chunk of stream) {
        const content = chunk.content.toString()
        if (content) {
          // Send SSE event
          res.write(`data: ${JSON.stringify({ content, type: 'content' })}\n\n`)
        }
      }
      
      // Send completion event
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      res.end()
      
    } catch (error) {
      console.error('Streaming error:', error)
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'An error occurred during streaming' })}\n\n`)
      res.end()
    }
  }
}