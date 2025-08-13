import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectDataSource } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { BaseTool, ToolContext } from './base.tool'
import { 
  GetCrmAccountsTool, 
  GetCrmDealsTool, 
  CreateCrmActivityTool,
  AnalyzeSalesPipelineTool 
} from './crm.tools'
import { 
  GenerateReportTool, 
  ScheduleMeetingTool, 
  SendEmailTool,
  AutomateWorkflowTool,
  AnalyzeDataTool 
} from './business.tools'
import {
  AnalyzeWinLossRateTool,
  GetLostDealsTool
} from './analytics/win-loss-analysis.tool'
import { PipelineHealthTool } from './analytics/pipeline-health.tool'
import {
  ForecastRevenueTool,
  AnalyzeTrendsTool
} from './analytics/forecasting.tool'
import { GetTopDealsTool } from './analytics/top-deals.tool'
import { DynamicAnalyticsTool } from './analytics/dynamic-analytics.tool'
import { CrmAccount, CrmContact, CrmDeal, CrmActivity } from '../../connectors/unified-crm.entities'
import { AIQueryPlannerService } from '../services/ai-query-planner.service'
import { DynamicSQLBuilder } from '../core/dynamic-sql-builder'
import { SchemaIntrospectorService } from '../services/schema-introspector/schema-introspector.service'

@Injectable()
export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map()
  private toolsByRole: Map<string, Set<string>> = new Map()

  constructor(
    @InjectRepository(CrmAccount)
    private crmAccountRepo: Repository<CrmAccount>,
    @InjectRepository(CrmContact)
    private crmContactRepo: Repository<CrmContact>,
    @InjectRepository(CrmDeal)
    private crmDealRepo: Repository<CrmDeal>,
    @InjectRepository(CrmActivity)
    private crmActivityRepo: Repository<CrmActivity>,
    @InjectDataSource()
    private dataSource: DataSource,
    private aiQueryPlanner: AIQueryPlannerService,
    private dynamicSQLBuilder: DynamicSQLBuilder,
    private schemaIntrospector: SchemaIntrospectorService,
  ) {
    this.initializeTools()
    this.configureRoleAccess()
  }

  private initializeTools() {
    // CRM Tools
    this.registerTool(new GetCrmAccountsTool())
    this.registerTool(new GetCrmDealsTool())
    this.registerTool(new CreateCrmActivityTool())
    this.registerTool(new AnalyzeSalesPipelineTool())

    // Business Tools
    this.registerTool(new GenerateReportTool())
    this.registerTool(new ScheduleMeetingTool())
    this.registerTool(new SendEmailTool())
    this.registerTool(new AutomateWorkflowTool())
    this.registerTool(new AnalyzeDataTool())

    // Analytics Tools
    this.registerTool(new AnalyzeWinLossRateTool())
    this.registerTool(new GetLostDealsTool())
    this.registerTool(new GetTopDealsTool())
    this.registerTool(new PipelineHealthTool())
    this.registerTool(new ForecastRevenueTool())
    this.registerTool(new AnalyzeTrendsTool())
    // Replace CrossTableAnalyticsTool with DynamicAnalyticsTool
    this.registerTool(new DynamicAnalyticsTool(
      this.dataSource,
      this.aiQueryPlanner,
      this.dynamicSQLBuilder,
      this.schemaIntrospector
    ))
  }

  private configureRoleAccess() {
    // Sales Manager tools
    this.toolsByRole.set('Sales Manager', new Set([
      'get_crm_accounts',
      'get_crm_deals',
      'get_top_deals',
      'create_crm_activity',
      'analyze_sales_pipeline',
      'generate_report',
      'schedule_meeting',
      'send_email',
      'automate_workflow',
      'analyze_win_loss_rate',
      'get_lost_deals',
      'analyze_pipeline_health',
      'forecast_revenue',
      'analyze_trends',
      'dynamic_analytics',
    ]))

    // CFO tools
    this.toolsByRole.set('CFO', new Set([
      'get_crm_deals',
      'get_top_deals',
      'analyze_sales_pipeline',
      'generate_report',
      'analyze_data',
      'analyze_win_loss_rate',
      'get_lost_deals',
      'analyze_pipeline_health',
      'forecast_revenue',
      'analyze_trends',
      'dynamic_analytics',
    ]))

    // Marketing Manager tools
    this.toolsByRole.set('Marketing Manager', new Set([
      'get_crm_accounts',
      'create_crm_activity',
      'generate_report',
      'send_email',
      'automate_workflow',
      'analyze_data',
    ]))

    // Operations Manager tools
    this.toolsByRole.set('Operations Manager', new Set([
      'generate_report',
      'schedule_meeting',
      'automate_workflow',
      'analyze_data',
    ]))

    // HR Manager tools
    this.toolsByRole.set('HR Manager', new Set([
      'schedule_meeting',
      'send_email',
      'generate_report',
      'automate_workflow',
    ]))

    // Admin has access to all tools (both capitalized and lowercase)
    this.toolsByRole.set('Admin', new Set(this.tools.keys()))
    this.toolsByRole.set('admin', new Set(this.tools.keys()))
  }

  private registerTool(tool: BaseTool) {
    this.tools.set(tool.name, tool)
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name)
  }

  getToolsForRole(role: string): BaseTool[] {
    const toolNames = this.toolsByRole.get(role) || new Set()
    return Array.from(toolNames)
      .map(name => this.tools.get(name))
      .filter((tool): tool is BaseTool => tool !== undefined)
  }

  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values())
  }

  getToolSchemas(role?: string): any[] {
    const tools = role ? this.getToolsForRole(role) : this.getAllTools()
    return tools.map(tool => {
      try {
        // Convert Zod schema to JSON Schema
        const rawSchema = zodToJsonSchema(tool.parameters, {
          target: 'openApi3',
          $refStrategy: 'none',
        }) as any
        
        
        // Create the OpenAI-compatible schema
        // Always ensure it's an object type with properties
        const parameters: any = {
          type: 'object',
          properties: rawSchema.properties || {},
        }
        
        // Add required array if it exists and is not empty
        if (rawSchema.required && Array.isArray(rawSchema.required) && rawSchema.required.length > 0) {
          parameters.required = rawSchema.required
        }
        
        // Add additionalProperties if specified
        if (rawSchema.additionalProperties !== undefined) {
          parameters.additionalProperties = rawSchema.additionalProperties
        }
        
        return {
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters,
          }
        }
      } catch (error) {
        console.error(`Error converting schema for tool ${tool.name}:`, error)
        // Fallback schema
        return {
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: {
              type: 'object',
              properties: {},
              required: [],
            }
          }
        }
      }
    })
  }


  createContext(tenantId: string, userId: string, userRole: string, department?: string): ToolContext {
    return {
      tenantId,
      userId,
      userRole,
      department,
      repositories: {
        crmAccount: this.crmAccountRepo,
        crmContact: this.crmContactRepo,
        crmDeal: this.crmDealRepo,
        crmActivity: this.crmActivityRepo,
      },
    }
  }

  async executeTool(
    toolName: string, 
    params: any, 
    context: ToolContext
  ): Promise<any> {
    const tool = this.getTool(toolName)
    
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`)
    }

    // Check role access
    const roleTools = this.toolsByRole.get(context.userRole)
    if (roleTools && !roleTools.has(toolName)) {
      throw new Error(`Role ${context.userRole} does not have access to tool ${toolName}`)
    }

    return await tool.run(params, context)
  }
}