// src/workflow/workflow-executor.ts

import { EventEmitter } from 'events';
import { TemplateExecutor } from '../templates/template-executor';
import { WorkflowDefinition, WorkflowStep, WorkflowExecutionContext, WorkflowExecutionResult } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { logger } from '../utils/logger';
import { TemplateLoader } from '../templates';
import { BaseTool } from '../tools/base-tool';
import { GithubLoaderTool } from '../tools/github-loader';
import { FileSaverTool } from '../tools/file-saver.tool';
import { S3LoaderTool } from '../tools/s3-loader.tool';
import { SlackStreamerTool } from '../tools/slack-streamer.tool';
import { HtmlFormatterTool } from '../tools/html-formatter.tool';
import { LocalLoaderTool } from '../tools/local-loader.tool';
import { MongoDBSaverTool } from '../tools/mongodb-saver.tool';
import { RedisSaverTool } from '../tools/redis-saver.tool';
import { TextToJsonTool } from '../tools/text-to-json';

export class WorkflowExecutor extends EventEmitter {
  private templateExecutor: TemplateExecutor;
  private toolFactories: Map<string, new (...args: any[]) => BaseTool>;
  private toolInstances: Map<string, BaseTool>;
  
  constructor() {
    super();
    this.templateExecutor = new TemplateExecutor();
    this.setupTemplateExecutorEvents();
    this.toolFactories = new Map();
    this.toolInstances = new Map();
    
    // Register default tool factories
    this.registerToolFactory('githubLoader', GithubLoaderTool);
    this.registerToolFactory('fileSaver', FileSaverTool);
    this.registerToolFactory('s3Loader', S3LoaderTool);
    this.registerToolFactory('slackStreamer', SlackStreamerTool);
    this.registerToolFactory('htmlFormatter', HtmlFormatterTool);
    this.registerToolFactory('localLoader', LocalLoaderTool);
    this.registerToolFactory('MongoDBSaver', MongoDBSaverTool);
    this.registerToolFactory('RedisSaver', RedisSaverTool);
    this.registerToolFactory('TextToJson', TextToJsonTool);
  }


  registerToolFactory(name: string, toolClass: new (...args: any[]) => BaseTool): void {
    this.toolFactories.set(name, toolClass);
  }

  private setupTemplateExecutorEvents() {
    this.templateExecutor.on('streamChunk', (chunk: string) => {
      this.emit('streamChunk', chunk);
    });

    this.templateExecutor.on('requestSent', (request: any) => {
      this.emit('requestSent', request);
    });
  } 

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

  

  private async executeToolStep(
    step: WorkflowStep, 
    context: WorkflowExecutionContext
  ): Promise<WorkflowExecutionResult> {
    if (!step.tool) {
      throw new Error('Tool name not specified');
    }

    const ToolClass = this.toolFactories.get(step.tool);
    if (!ToolClass) {
      throw new Error(`Tool factory "${step.tool}" not found`);
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

    private resolveTemplateVariables(
      value: string, 
      context: Record<string, any>
    ): string {
      return value.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        return context[key.trim()] || '';
      });
    }
    // src/workflow/workflow-executor.ts
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
}