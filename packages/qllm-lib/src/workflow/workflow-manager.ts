// src/workflow/workflow-manager.ts

import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { WorkflowExecutor } from './workflow-executor';
import { WorkflowDefinition, WorkflowExecutionResult, WorkflowStep } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { TemplateDefinition, TemplateLoader } from '../templates';
import { BaseTool, ToolDefinition } from "../tools/base-tool"

export class WorkflowManager {
  private workflowExecutor: WorkflowExecutor;
  private workflows: Map<string, WorkflowDefinition>;
  private providers: Record<string, LLMProvider>;
  private templateCache: Map<string, TemplateDefinition>;
  private tools: Map<string, BaseTool>;

  constructor(
    providers: Record<string, LLMProvider>,
    tools?: Record<string, BaseTool>
  ) {
    this.workflowExecutor = new WorkflowExecutor();
    this.workflows = new Map();
    this.providers = providers;
    this.templateCache = new Map();
    this.tools = new Map(Object.entries(tools || {}));
  }
  
  registerTool(name: string, tool: BaseTool): void {
    this.tools.set(name, tool);
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
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
    
    // Validate tools exist
    for (const step of workflow.steps) {
      if (step.tool && !this.tools.has(step.tool)) {
        throw new Error(`Tool "${step.tool}" not found`);
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
    
    return parse(content) as WorkflowDefinition;
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
      return await this.workflowExecutor.executeWorkflow(
        workflow,
        this.providers,
        input,
        this.tools
      );
    } finally {
      this.workflowExecutor.removeAllListeners();
    }
  }
}