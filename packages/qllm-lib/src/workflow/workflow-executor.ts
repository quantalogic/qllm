/**
 * @fileoverview Workflow Executor implementation for managing and executing workflow steps
 * @module workflow/workflow-executor
 */
import { EventEmitter } from 'events';
import { TemplateExecutor } from '../templates/template-executor';
import { WorkflowDefinition, WorkflowStep, WorkflowExecutionContext, WorkflowExecutionResult } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { logger } from '../utils/logger';
import { TemplateLoader, TemplateLoaderConfig } from '../templates';
import { BaseTool } from '../tools/base-tool';
import { GithubLoaderTool } from '../tools/github-loader';
import { FileSaverTool } from '../tools/file-saver.tool';
import { S3Tool } from '../tools/s3.tool';
import { SlackStreamerTool } from '../tools/slack-streamer.tool';
import { HtmlFormatterTool } from '../tools/html-formatter.tool';
import { LocalLoaderTool } from '../tools/local-loader.tool';
import { MongoDBSaverTool } from '../tools/mongodb-saver.tool';
import { RedisSaverTool } from '../tools/redis-saver.tool';
import { TextToJsonTool } from '../tools/text-to-json';
import { RAGToolWithEmbedding } from '../tools/llamaindex-rag-v1';
import { LocalProjectLoaderTool } from '../tools/local-project-loader'; 
import { RAGTool } from '../tools/llamaindex-rag.tool';
import { JiraTool } from '../tools/jira.tool'; 
import { S3ToLocalTool } from '../tools/s3_to_local.tool';
import { RemoveFromLocalTool } from '../tools/remove_from_local.tool';
import { ApiServerCallTool } from '../tools/api-server-call.tool';
import { EnhancedJiraTool } from '../tools/enhanced-jira.tool';
import { CustomApiServerCallTool } from '../tools/custom-api-server-call.tool';

/**
 * @class WorkflowExecutor
 * @extends EventEmitter
 * @description Manages the execution of workflow definitions, handling both template and tool-based steps
 * @emits stepStart - When a workflow step begins
 * @emits stepComplete - When a workflow step completes successfully
 * @emits stepError - When a workflow step encounters an error
 * @emits streamChunk - When streaming data is received
 * @emits requestSent - When a request is sent to a provider
 * @emits toolExecution - When a tool begins execution
 */
export class WorkflowExecutor extends EventEmitter {
  private templateExecutor: TemplateExecutor;
  private toolFactories: Map<string, new (...args: any[]) => BaseTool>;
  private toolInstances: Map<string, BaseTool>;
  private authConfig?: TemplateLoaderConfig;
  
  /**
   * @constructor
   * Initializes the WorkflowExecutor and registers default tool factories
   * @param {TemplateLoaderConfig} [authConfig] - Optional authentication configuration
   */
  constructor(authConfig?: TemplateLoaderConfig) {
    super();
    this.templateExecutor = new TemplateExecutor();
    this.setupTemplateExecutorEvents();
    this.toolFactories = new Map();
    this.toolInstances = new Map();
    this.authConfig = authConfig;
    
    // Register default tool factories
    this.registerToolFactory('githubLoader', GithubLoaderTool);
    this.registerToolFactory('fileSaver', FileSaverTool);
    this.registerToolFactory('s3', S3Tool);
    this.registerToolFactory('slackStreamer', SlackStreamerTool);
    this.registerToolFactory('htmlFormatter', HtmlFormatterTool);
    this.registerToolFactory('localLoader', LocalLoaderTool);
    this.registerToolFactory('MongoDBSaver', MongoDBSaverTool);
    this.registerToolFactory('RedisSaver', RedisSaverTool);
    this.registerToolFactory('TextToJson', TextToJsonTool);
    this.registerToolFactory('LlamaIndexRAGV1', RAGToolWithEmbedding);
    this.registerToolFactory('RAGToolV2', RAGTool); 
    this.registerToolFactory('FileOverviewRAG', RAGToolWithEmbedding);
    this.registerToolFactory('LocalProjectLoader', LocalProjectLoaderTool);
    this.registerToolFactory('JiraTool', JiraTool); 
    this.registerToolFactory('EnhancedJira', EnhancedJiraTool); 
    this.registerToolFactory('s3ToLocal', S3ToLocalTool);
    this.registerToolFactory('removeFromLocal', RemoveFromLocalTool);
    this.registerToolFactory('ApiServerCall', ApiServerCallTool);
    this.registerToolFactory('CustomApiServerCall', CustomApiServerCallTool);
  }


  /**
   * @method registerToolFactory
   * @description Registers a new tool factory for use in workflow steps
   * @param {string} name - The unique identifier for the tool
   * @param {new (...args: any[]) => BaseTool} toolClass - The tool class constructor
   */
  registerToolFactory(name: string, toolClass: new (...args: any[]) => BaseTool): void {
    this.toolFactories.set(name, toolClass);
  }

  /**
   * @private
   * @method setupTemplateExecutorEvents
   * @description Sets up event listeners for template execution
   */
  private setupTemplateExecutorEvents() {
    this.templateExecutor.on('streamChunk', (chunk: string) => {
      this.emit('streamChunk', chunk);
    });

    this.templateExecutor.on('requestSent', (request: any) => {
      this.emit('requestSent', request);
    });
  } 

  /**
   * @method executeWorkflow
   * @description Executes a complete workflow definition with multiple steps
   * @param {WorkflowDefinition} workflow - The workflow definition to execute
   * @param {Record<string, LLMProvider>} providers - Available LLM providers
   * @param {Record<string, any>} initialInput - Initial input variables
   * @param {Map<string, new (...args: any[]) => BaseTool>} toolFactories - Available tool factories
   * @returns {Promise<Record<string, WorkflowExecutionResult>>} Results of workflow execution
   * @throws {Error} When a step fails to execute
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    providers: Record<string, LLMProvider>,
    initialInput: Record<string, any>,
    toolFactories: Map<string, new (...args: any[]) => BaseTool>
  ): Promise<Record<string, WorkflowExecutionResult>> {
    logger.info(`[WorkflowExecutor] Starting workflow execution: ${workflow.name}`);
    logger.debug(`[WorkflowExecutor] Initial input:`, initialInput);
    logger.debug(`[WorkflowExecutor] Number of steps: ${workflow.steps.length}`);

    this.toolFactories = toolFactories;
    const context: WorkflowExecutionContext = {
      variables: { ...initialInput },
      results: {}
    };

    for (const [index, step] of workflow.steps.entries()) {
      logger.info(`[WorkflowExecutor] Starting step ${index + 1}/${workflow.steps.length}: ${step.tool || 'template'}`);
      logger.debug(`[WorkflowExecutor] Step details:`, { 
        tool: step.tool,
        template: step.templateUrl || (step.template ? 'inline template' : undefined),
        input: step.input
      });

      this.emit('stepStart', step, index);
  
      try {
        let executionResult: WorkflowExecutionResult;

        if (step.tool) {
          logger.info(`[WorkflowExecutor] Executing tool step: ${step.tool}`);
          executionResult = await this.executeToolStep(step, context);
        } else {
          logger.info(`[WorkflowExecutor] Executing template step with provider: ${step.provider || workflow.defaultProvider}`);
          executionResult = await this.executeTemplateStep(step, context, providers, workflow.defaultProvider);
        }
  
        logger.debug(`[WorkflowExecutor] Step ${index + 1} execution result:`, executionResult);
        this.storeStepResults(step, executionResult, context);
        this.emit('stepComplete', step, index, executionResult);
        logger.info(`[WorkflowExecutor] Completed step ${index + 1}/${workflow.steps.length}`);
  
      } catch (error) {
        logger.error(`[WorkflowExecutor] Error in step ${index + 1}:`, error);
        logger.error(`[WorkflowExecutor] Step details at failure:`, {
          stepType: step.tool ? 'tool' : 'template',
          tool: step.tool,
          template: step.templateUrl || (step.template ? 'inline template' : undefined),
          input: step.input,
          provider: step.provider
        });
        logger.error(`[WorkflowExecutor] Context at failure:`, {
          availableVariables: Object.keys(context.variables),
          availableResults: Object.keys(context.results)
        });
        if (error instanceof Error) {
          logger.error(`[WorkflowExecutor] Error stack:`, error.stack);
          logger.error(`[WorkflowExecutor] Error name:`, error.name);
          logger.error(`[WorkflowExecutor] Error message:`, error.message);
        }
        this.emit('stepError', step, index, error as Error);
        throw error;
      }
    }

    logger.info(`[WorkflowExecutor] Workflow execution completed: ${workflow.name}`);
    logger.debug(`[WorkflowExecutor] Final context results:`, context.results);
  
    return context.results;
  }

  


  /**
   * @private
   * @method executeToolStep
   * @description Executes a single tool-based workflow step
   * @param {WorkflowStep} step - The workflow step to execute
   * @param {WorkflowExecutionContext} context - Current execution context
   * @returns {Promise<WorkflowExecutionResult>} Result of tool execution
   * @throws {Error} When tool is not found or execution fails
   */
  private async executeToolStep(
    step: WorkflowStep, 
    context: WorkflowExecutionContext
  ): Promise<WorkflowExecutionResult> {
    logger.info(`[WorkflowExecutor] Starting tool step execution: ${step.tool}`);

    if (!step.tool) {
      logger.error(`[WorkflowExecutor] Tool step execution failed: Tool name not specified`);
      throw new Error('Tool name not specified');
    }

    const ToolClass = this.toolFactories.get(step.tool);
    if (!ToolClass) {
      logger.error(`[WorkflowExecutor] Tool step execution failed: Tool factory "${step?.tool}" not found`);
      throw new Error(`Tool factory "${step?.tool}" not found`);
    }

    logger.debug(`[WorkflowExecutor] Resolving tool inputs for ${step.tool}`);
    const resolvedInput = await this.resolveStepInputs(step.input || {}, context);
    logger.debug(`[WorkflowExecutor] Resolved inputs:`, resolvedInput);

    const tool = this.createTool(step.tool, resolvedInput.config || {});
    logger.debug(`[WorkflowExecutor] Created tool instance: ${step.tool}`);
    
    this.emit('toolExecution', step.tool, resolvedInput);
    logger.info(`[WorkflowExecutor] Executing tool: ${step.tool}`);
    const result = await tool.execute(resolvedInput);
    
    logger.debug(`[WorkflowExecutor] Tool execution completed:`, result);
    return {
      response: JSON.stringify(result),
      outputVariables: result
    };
  }

  /**
   * @private
   * @method executeTemplateStep
   * @description Executes a single template-based workflow step
   * @param {WorkflowStep} step - The workflow step to execute
   * @param {WorkflowExecutionContext} context - Current execution context
   * @param {Record<string, LLMProvider>} providers - Available providers
   * @param {string} [defaultProvider] - Default provider to use
   * @returns {Promise<WorkflowExecutionResult>} Result of template execution
   * @throws {Error} When template or provider is not found
   */
  private async executeTemplateStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    providers: Record<string, LLMProvider>,
    defaultProvider?: string
  ): Promise<WorkflowExecutionResult> {
    logger.info(`[WorkflowExecutor] Starting template step execution`);

    if (step.templateUrl && !step.template) {
      logger.debug(`[WorkflowExecutor] Loading template from URL: ${step.templateUrl}`);
      step.template = await TemplateLoader.load(step.templateUrl);
    }

    if (!step.template) {
      logger.error(`[WorkflowExecutor] Template step execution failed: No template found`);
      throw new Error('No template found for step');
    }

    logger.debug(`[WorkflowExecutor] Resolving template inputs`);
    const resolvedInput = await this.resolveStepInputs(step.input || {}, context);
    logger.debug(`[WorkflowExecutor] Resolved inputs:`, resolvedInput);

    const provider = providers[step.provider || defaultProvider || ''];
    if (!provider) {
      logger.error(`[WorkflowExecutor] Template step execution failed: Provider not found`);
      throw new Error('Provider not found');
    }

    logger.info(`[WorkflowExecutor] Executing template with provider: ${step.provider || defaultProvider}`);
    const result = await this.templateExecutor.execute({
      template: step.template,
      provider,
      variables: resolvedInput,
      stream: true
    });

    logger.debug(`[WorkflowExecutor] Template execution completed:`, result);
    return {
      response: result.response,
      outputVariables: result.outputVariables
    };
  }

  /**
   * @private
   * @method storeStepResults
   * @description Stores the results of a workflow step in the execution context
   * @param {WorkflowStep} step - The completed workflow step
   * @param {WorkflowExecutionResult} executionResult - Results from step execution
   * @param {WorkflowExecutionContext} context - Current execution context
   */
  private async storeStepResults(
    step: WorkflowStep,
    executionResult: WorkflowExecutionResult,
    context: WorkflowExecutionContext
  ): Promise<void> {
    logger.debug(`[WorkflowExecutor] Storing step results`);

    if (typeof step.output === 'string') {
      logger.debug(`[WorkflowExecutor] Storing single output: ${step.output}`);
      context.results[step.output] = executionResult;
      if (step.tool) {
        context.variables[step.output] = { tool: step.tool };
      }
    } else {
      logger.debug(`[WorkflowExecutor] Storing multiple outputs:`, step.output);
      Object.entries(step.output).forEach(([key, varName]) => {
        if (typeof varName === 'string') {
          logger.debug(`[WorkflowExecutor] Storing output ${key} to ${varName}`);
          context.results[varName] = executionResult.outputVariables[key];
          if (step.tool) {
            context.variables[varName] = { tool: step.tool };
          }
        }
      });
    }

    logger.debug(`[WorkflowExecutor] Updated context:`, { 
      results: Object.keys(context.results),
      variables: Object.keys(context.variables)
    });
  }

  /**
   * @private
   * @method resolveTemplateVariables
   * @description Resolves template variables in strings using context values
   * @param {string} value - Template string to resolve
   * @param {Record<string, any>} context - Context containing variable values
   * @returns {string} Resolved string with replaced variables
   */
    private resolveTemplateVariables(
      value: string, 
      context: Record<string, any>
    ): string {
      return value.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        return context[key.trim()] || '';
      });
    }
    
  /**
   * @private
   * @method resolveStepInputs
   * @description Resolves input values for a workflow step, handling variables and references
   * @param {Record<string, string | number | boolean>} inputs - Step inputs to resolve
   * @param {WorkflowExecutionContext} context - Current execution context
   * @returns {Promise<Record<string, any>>} Resolved input values
   */
    private async resolveStepInputs(
      inputs: Record<string, string | number | boolean>,
      context: WorkflowExecutionContext
    ): Promise<Record<string, any>> {
      logger.debug(`[WorkflowExecutor] Resolving step inputs:`, inputs);
      const resolved: Record<string, any> = {};
    
      for (const [key, value] of Object.entries(inputs)) {
        logger.debug(`[WorkflowExecutor] Resolving input: ${key}`);
        
        if (typeof value === 'string') {
          if (value.startsWith('$')) {
            const varName = value.slice(1);
            logger.debug(`[WorkflowExecutor] Resolving reference: ${varName}`);
            const result = context.results[varName];
            
            const toolName = Object.keys(context.results).find(key => key === varName);
            const isJiraTool = toolName && context.variables[toolName]?.tool === 'JiraTool';
            
            if (isJiraTool) {
              logger.debug(`[WorkflowExecutor] Special handling for JiraTool result`);
              if (result?.response) {
                try {
                  const parsed = JSON.parse(result.response);
                  resolved[key] = parsed.key;
                } catch (e) {
                  logger.error(`[WorkflowExecutor] Failed to parse JiraTool response:`, e);
                  logger.error(`[WorkflowExecutor] JiraTool response details:`, {
                    rawResponse: result?.response,
                    outputVariables: result?.outputVariables
                  });
                  logger.warn(`[WorkflowExecutor] Falling back to outputVariables.key`);
                  resolved[key] = result.outputVariables?.key;
                }
              } else {
                resolved[key] = result;
              }
            } else {
              resolved[key] = result?.response || 
                            result?.outputVariables || 
                            result;
            }
          } else if (value.match(/\{\{.*\}\}/)) {
            logger.debug(`[WorkflowExecutor] Resolving template variables in: ${value}`);
            resolved[key] = this.resolveTemplateVariables(value, context.variables);
          } else {
            resolved[key] = value;
          }
        } else {
          resolved[key] = value;
        }
      }
  
      logger.debug(`[WorkflowExecutor] Resolved inputs:`, resolved);
      return resolved;
    }

  /**
   * Updates the authentication configuration and propagates it to relevant tools
   * @param {TemplateLoaderConfig} config - The new authentication configuration
   */
  updateAuthConfig(config: TemplateLoaderConfig): void {
    this.authConfig = config;
    
    // Update auth config for existing tool instances that support it
    for (const [name, tool] of this.toolInstances.entries()) {
      if ('updateAuthConfig' in tool && typeof tool.updateAuthConfig === 'function') {
        tool.updateAuthConfig(config);
      }
    }
  }

  /**
   * Creates a tool instance from registered factory with auth config
   * @private
   * @param {string} name - The name of the tool to create
   * @param {any} config - Configuration for the tool instance
   * @returns {BaseTool} The created tool instance
   * @throws {Error} If tool factory is not found
   */
  private createTool(name: string, config: any): BaseTool {
    const ToolClass = this.toolFactories.get(name);
    if (!ToolClass) {
      throw new Error(`Tool factory "${name}" not found`);
    }

    // Merge auth config with tool config if tool supports it
    const toolConfig = {
      ...config,
      authConfig: this.authConfig
    };

    return new ToolClass(toolConfig);
  }

  /**
   * @method getAvailableTools
   * @description Returns information about all registered tools in the workflow executor
   * @returns {Array<{name: string, description: string}>} Array of available tools with their names and descriptions
   * @example
   * const executor = new WorkflowExecutor();
   * const tools = executor.getAvailableTools();
   * // Returns: [{name: 'githubLoader', description: 'Loads content from Github'}, ...]
   */
  public getAvailableTools(): Array<{name: string, description: string}> {
    const tools: Array<{name: string, description: string}> = [];
    
    this.toolFactories.forEach((ToolClass, name) => {
      // Create a temporary instance to get the description
      // We're using try-catch in case the tool constructor requires specific parameters
      try {
        const tempInstance = new ToolClass({});
        tools.push({
          name,
          description: tempInstance.getDescription() || 'No description available'
        });
      } catch (error) {
        tools.push({
          name,
          description: 'Description unavailable'
        });
      }
    });

    return tools;
  }

  /**
   * @method getToolInstance
   * @description Gets a specific tool instance by name
   * @param {string} toolName - The name of the tool to retrieve
   * @returns {BaseTool | undefined} The tool instance if found, undefined otherwise
   * @throws {Error} When the tool factory doesn't exist
   */
  public getToolInstance(toolName: string): BaseTool | undefined {
    // Check if we already have an instance
    if (this.toolInstances.has(toolName)) {
      return this.toolInstances.get(toolName);
    }

    // Get the tool factory
    const ToolClass = this.toolFactories.get(toolName);
    if (!ToolClass) {
      throw new Error(`Tool factory "${toolName}" not found`);
    }

    // Create new instance
    try {
      const instance = this.createTool(toolName, {});
      this.toolInstances.set(toolName, instance);
      return instance;
    } catch (error) {
      logger.error(`Failed to create instance of tool ${toolName}:`, error);
      return undefined;
    }
  }

  /**
   * @method hasToolAvailable
   * @description Checks if a specific tool is available
   * @param {string} toolName - The name of the tool to check
   * @returns {boolean} True if the tool is available, false otherwise
   */
  public hasToolAvailable(toolName: string): boolean {
    return this.toolFactories.has(toolName);
  }
}