import { z } from 'zod'
import { Repository } from 'typeorm'

export interface ToolContext {
  tenantId: string
  userId: string
  userRole: string
  department?: string
  repositories?: {
    [key: string]: Repository<any>
  }
}

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  message?: string
}

export abstract class BaseTool {
  abstract name: string
  abstract description: string
  abstract parameters: z.ZodType<any>

  abstract execute(params: any, context: ToolContext): Promise<ToolResult>

  getSchema() {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
    }
  }

  async run(params: any, context: ToolContext): Promise<ToolResult> {
    try {
      const validatedParams = this.parameters.parse(params)
      return await this.execute(validatedParams, context)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Invalid parameters: ${error.message}`,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}