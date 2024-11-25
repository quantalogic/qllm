/**
 * @fileoverview Manages workflow definitions, their loading from YAML files, and their execution.
 * Provides a high-level interface for workflow operations and event handling.
 * 
 * @author QLLM Team
 * @module workflow/workflow-manager
 */

import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { WorkflowExecutor } from './workflow-executor';
import { WorkflowDefinition, WorkflowExecutionResult, WorkflowStep } from '../types/workflow-types';
import { LLMProvider } from '../types';

/**
 * Manages the lifecycle of workflows including loading, storage, and execution.
 * Provides event handling capabilities for monitoring workflow execution.
 */
export class WorkflowManager {
  private workflowExecutor: WorkflowExecutor;
  private workflows: Map<string, WorkflowDefinition>;
  private providers: Record<string, LLMProvider>;

  /**
   * Creates a new WorkflowManager instance.
   * 
   * @param providers - Map of provider names to LLM provider instances used in workflows
   */
  constructor(providers: Record<string, LLMProvider>) {
    this.workflowExecutor = new WorkflowExecutor();
    this.workflows = new Map();
    this.providers = providers;
  }

  /**
   * Loads a workflow definition from either a YAML file path or a WorkflowDefinition object.
   * 
   * @param workflowDefinition - Path to YAML file or WorkflowDefinition object
   * @throws Error if YAML file cannot be read or parsed
   */
  async loadWorkflow(workflowDefinition: WorkflowDefinition | string): Promise<void> {
    const workflow = typeof workflowDefinition === 'string' 
      ? await this.loadWorkflowFromYaml(workflowDefinition)
      : workflowDefinition;
      
    this.workflows.set(workflow.name, workflow);
  }

  /**
   * Loads a workflow definition from a YAML file.
   * 
   * @private
   * @param path - Path to the YAML file containing the workflow definition
   * @returns Promise resolving to parsed WorkflowDefinition
   * @throws Error if file cannot be read or parsed
   */
  private async loadWorkflowFromYaml(path: string): Promise<WorkflowDefinition> {
    const content = await readFile(path, 'utf-8');
    return parse(content) as WorkflowDefinition;
  }

  /**
   * Executes a loaded workflow with the given input and event handlers.
   * 
   * @param workflowName - Name of the workflow to execute
   * @param input - Initial input variables for the workflow
   * @param options - Optional event handlers for monitoring workflow execution
   * @param options.onStepStart - Called when a workflow step begins
   * @param options.onStepComplete - Called when a workflow step completes
   * @param options.onStreamChunk - Called when new content is streamed from LLM
   * @param options.onRequestSent - Called when a request is sent to LLM
   * @returns Promise resolving to execution results for each step
   * @throws Error if workflow is not found
   */
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