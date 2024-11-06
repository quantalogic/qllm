// src/workflow/workflow-manager.ts

import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { WorkflowExecutor } from './workflow-executor';
import { WorkflowDefinition, WorkflowExecutionResult, WorkflowStep } from '../types/workflow-types';
import { LLMProvider } from '../types';

export class WorkflowManager {
  private workflowExecutor: WorkflowExecutor;
  private workflows: Map<string, WorkflowDefinition>;
  private providers: Record<string, LLMProvider>;

  constructor(providers: Record<string, LLMProvider>) {
    this.workflowExecutor = new WorkflowExecutor();
    this.workflows = new Map();
    this.providers = providers;
  }

  async loadWorkflow(workflowDefinition: WorkflowDefinition | string): Promise<void> {
    const workflow = typeof workflowDefinition === 'string' 
      ? await this.loadWorkflowFromYaml(workflowDefinition)
      : workflowDefinition;
      
    this.workflows.set(workflow.name, workflow);
  }

  private async loadWorkflowFromYaml(path: string): Promise<WorkflowDefinition> {
    const content = await readFile(path, 'utf-8');
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

    try {
      return await this.workflowExecutor.executeWorkflow(
        workflow,
        this.providers,
        input
      );
    } finally {
      this.workflowExecutor.removeAllListeners();
    }
  }
}