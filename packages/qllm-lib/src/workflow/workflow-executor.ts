/**
 * @fileoverview Workflow Executor implementation for managing and executing workflow steps
 * @module workflow/workflow-executor
 */
import { EventEmitter } from 'events';
import { TemplateExecutor } from '../templates/template-executor';
import { WorkflowDefinition, WorkflowStep, WorkflowExecutionContext, WorkflowExecutionResult } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { logger } from '../utils/logger';
import { TemplateLoader } from '../templates';
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
import { RAGToolWithEmbedding } from '../tools/fileoverview-rag';
import { LocalProjectLoaderTool } from '../tools/local-project-loader'; 

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
  
  /**
   * @constructor
   * Initializes the WorkflowExecutor and registers default tool factories
   */
  constructor() {
    super();
    this.templateExecutor = new TemplateExecutor();
    this.setupTemplateExecutorEvents();
    this.toolFactories = new Map();
    this.toolInstances = new Map();
    
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
    this.registerToolFactory('FileOverviewRAG', RAGToolWithEmbedding);
    this.registerToolFactory('LocalProjectLoader', LocalProjectLoaderTool);
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
    this.toolFactories = toolFactories;
    const context: WorkflowExecutionContext = {
      variables: { ...initialInput },
      results: {}
    };

    logger.info(`Executing workflow: ${workflow.name}`);

    for (const [index, step] of workflow.steps.entries()) {
      this.emit('stepStart', step, index);
      logger.info(`Step ${index + 1}`);
  
      try {
        let executionResult: WorkflowExecutionResult;

        if (step.tool) {
          executionResult = await this.executeToolStep(step, context);
        } else {
          executionResult = await this.executeTemplateStep(step, context, providers, workflow.defaultProvider);
        }
  
        this.storeStepResults(step, executionResult, context);
        this.emit('stepComplete', step, index, executionResult);
        logger.info(`Completed step ${index + 1}`);
  
      } catch (error) {
        this.emit('stepError', step, index, error as Error);
        throw error;
      }
    }
  
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
    if (!step.tool) {
      throw new Error('Tool name not specified');
    }

    const ToolClass = this.toolFactories.get(step.tool);
    if (!ToolClass) {
      throw new Error(`Tool factory "${step?.tool}" not found`);
    }

    const resolvedInput = await this.resolveStepInputs(step.input || {}, context);
    const tool = new ToolClass(resolvedInput.config || {});
    
    this.emit('toolExecution', step.tool, resolvedInput);
    const result = await tool.execute(resolvedInput);
    
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
    if (step.templateUrl && !step.template) {
      step.template = await TemplateLoader.load(step.templateUrl);
    }

    if (!step.template) {
      throw new Error('No template found for step');
    }

    const resolvedInput = await this.resolveStepInputs(step.input || {}, context);
    const provider = providers[step.provider || defaultProvider || ''];

    if (!provider) {
      throw new Error('Provider not found');
    }

    const result = await this.templateExecutor.execute({
      template: step.template,
      provider,
      variables: resolvedInput,
      stream: true
    });

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
  private storeStepResults(
    step: WorkflowStep,
    executionResult: WorkflowExecutionResult,
    context: WorkflowExecutionContext
  ): void {
    if (typeof step.output === 'string') {
      context.results[step.output] = executionResult;
    } else {
      Object.entries(step.output).forEach(([key, varName]) => {
        if (typeof varName === 'string') {
          context.results[varName] = executionResult.outputVariables[key];
        }
      });
    }
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
      const resolved: Record<string, any> = {};
    
      for (const [key, value] of Object.entries(inputs)) {
        if (typeof value === 'string') {
          if (value.startsWith('$')) {
            // Handle reference to previous step output
            const varName = value.slice(1);
            resolved[key] = context.results[varName]?.response || 
                           context.results[varName]?.outputVariables || 
                           context.results[varName];
          } else if (value.match(/\{\{.*\}\}/)) {
            // Handle template variables
            resolved[key] = this.resolveTemplateVariables(value, context.variables);
          } else {
            resolved[key] = value;
          }
        } else {
          resolved[key] = value;
        }
      }
    
      return resolved;
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
      const instance = new ToolClass({});
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