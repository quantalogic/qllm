// src/workflow/workflow-manager.ts

import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { WorkflowExecutor } from './workflow-executor';
import { WorkflowDefinition, WorkflowExecutionResult, WorkflowStep } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { TemplateDefinition, TemplateLoader } from '../templates';
import { BaseTool, ToolDefinition } from "../tools/base-tool"
import { GithubLoaderTool } from '../tools/github-loader';
import { FileSaverTool } from '../tools/file-saver.tool';
import { S3LoaderTool } from '../tools/s3-loader.tool';
import { SlackStreamerTool } from '../tools/slack-streamer.tool';
import { HtmlFormatterTool } from '../tools/html-formatter.tool';
import { LocalLoaderTool } from '../tools/local-loader.tool';
import { MongoDBSaverTool } from '../tools/mongodb-saver.tool';
import { RedisSaverTool } from '../tools/redis-saver.tool';
import { TextToJsonTool } from '../tools/text-to-json';

export class WorkflowManager {
  private workflowExecutor: WorkflowExecutor;
  private workflows: Map<string, WorkflowDefinition>;
  private providers: Record<string, LLMProvider>;
  private templateCache: Map<string, TemplateDefinition>;
  private toolFactories: Map<string, new (...args: any[]) => BaseTool>;

  constructor(
    providers: Record<string, LLMProvider>,
    tools?: Record<string, BaseTool>
  ) {
    this.workflowExecutor = new WorkflowExecutor();
    this.workflows = new Map();
    this.providers = providers;
    this.templateCache = new Map();
    this.toolFactories = new Map();


    // Register default tools
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

  private createTool(name: string, config: any): BaseTool {
    const ToolClass = this.toolFactories.get(name);
    if (!ToolClass) {
      throw new Error(`Tool factory "${name}" not found`);
    }
    return new ToolClass(config);
  }

  private async loadTemplateFromUrl(url: string): Promise<TemplateDefinition> {
    if (this.templateCache.has(url)) {
      return this.templateCache.get(url)!;
    }

    const template = await TemplateLoader.load(url);
    this.templateCache.set(url, template);
    return template;
  }
  
  
  async loadWorkflow(workflowDefinition: WorkflowDefinition | string): Promise<void> {
    const workflow = typeof workflowDefinition === 'string' 
      ? await this.loadWorkflowFromYaml(workflowDefinition) 
      : workflowDefinition;
    
    // Validate and register tools from workflow
    for (const step of workflow.steps) {
      if (step.tool) {
        const ToolClass = this.toolFactories.get(step.tool);
        if (!ToolClass) {
          throw new Error(`Tool factory "${step?.tool}" not found`);
        }
        
        // Tool will be instantiated during execution with config from input
        if (!this.toolFactories.has(step.tool)) {
          throw new Error(`Tool factory "${step?.tool}" not registered`);
        }
      }
      
      if (step.templateUrl) {
        const template = await this.loadTemplateFromUrl(step.templateUrl);
        step.template = template;
      }
    }
  
    this.workflows.set(workflow.name, workflow);
  }
  
  private async loadWorkflowFromYaml(path: string): Promise<WorkflowDefinition> {
    let content: string;
    
    if (path.startsWith('http')) {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.statusText}`);
      }
      content = await response.text();
    } else {
      content = await readFile(path, 'utf-8');
    }
    
    const workflow = parse(content) as WorkflowDefinition;
    
    // Validate workflow schema
    if (!workflow.name || !Array.isArray(workflow.steps)) {
      throw new Error('Invalid workflow schema: missing required fields');
    }
    
    return workflow;
  }

  
  async runWorkflow(
    workflowName: string,
    input: Record<string, any>,
    options: {
      onStepStart?: (step: WorkflowStep, index: number) => void;
      onStepComplete?: (step: WorkflowStep, index: number, result: WorkflowExecutionResult) => void;
      onStreamChunk?: (chunk: string) => void;
      onRequestSent?: (request: any) => void;
      onToolExecution?: (toolName: string, input: Record<string, any>) => void;
    } = {}
  ): Promise<Record<string, WorkflowExecutionResult>> {
    const workflow = this.workflows.get(workflowName);
    
    if (!workflow) {
      throw new Error(`Workflow "${workflowName}" not found`);
    }

    // Set up event handlers
    if (options.onStepStart) {
      this.workflowExecutor.on('stepStart', options.onStepStart);
    }
    if (options.onStepComplete) {
      this.workflowExecutor.on('stepComplete', options.onStepComplete);
    }
    if (options.onStreamChunk) {
      this.workflowExecutor.on('streamChunk', options.onStreamChunk);
    }
    if (options.onRequestSent) {
      this.workflowExecutor.on('requestSent', options.onRequestSent);
    }
    if (options.onToolExecution) {
      this.workflowExecutor.on('toolExecution', options.onToolExecution);
    }

    try {
      // Pass toolFactories instead of tool instances
      return await this.workflowExecutor.executeWorkflow(
        workflow,
        this.providers,
        input,
        this.toolFactories
      );
    } finally {
      this.workflowExecutor.removeAllListeners();
    }
  }
}