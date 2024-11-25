/**
 * @fileoverview Workflow execution engine that handles the step-by-step processing of workflow definitions.
 * Manages template execution, variable resolution, and event emission for workflow monitoring.
 * 
 * @author QLLM Team
 * @module workflow/workflow-executor
 */

import { EventEmitter } from 'events';
import { TemplateExecutor } from '../templates/template-executor';
import { WorkflowDefinition, WorkflowStep, WorkflowExecutionContext, WorkflowExecutionResult } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { logger } from '../utils/logger';

/**
 * Executes workflow definitions by processing steps sequentially, managing context,
 * and handling template execution with variable resolution.
 * 
 * @extends EventEmitter
 * @fires WorkflowExecutor#streamChunk - Emitted when new content is streamed from LLM
 * @fires WorkflowExecutor#requestSent - Emitted when a request is sent to LLM
 * @fires WorkflowExecutor#stepStart - Emitted when a workflow step begins
 * @fires WorkflowExecutor#stepComplete - Emitted when a workflow step completes
 * @fires WorkflowExecutor#stepError - Emitted when a workflow step encounters an error
 */
export class WorkflowExecutor extends EventEmitter {
  private templateExecutor: TemplateExecutor;
  
  /**
   * Initializes a new WorkflowExecutor instance and sets up template executor event handlers.
   */
  constructor() {
    super();
    this.templateExecutor = new TemplateExecutor();
    this.setupTemplateExecutorEvents();
  }

  /**
   * Sets up event forwarding from template executor to workflow executor.
   * @private
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
   * Executes a workflow definition with the provided providers and initial input.
   * 
   * @param workflow - The workflow definition to execute
   * @param providers - Map of provider names to LLM provider instances
   * @param initialInput - Initial variables to populate the workflow context
   * @returns Promise resolving to execution results for each step
   * @throws Error if a required provider is not found
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    providers: Record<string, LLMProvider>,
    initialInput: Record<string, any>
  ): Promise<Record<string, WorkflowExecutionResult>> {
    const context: WorkflowExecutionContext = {
      variables: { ...initialInput },
      results: {}
    };

    logger.info(`Executing workflow: ${workflow.name}`);

    for (const [index, step] of workflow.steps.entries()) {
      this.emit('stepStart', step, index);
      logger.info(`Step ${index + 1}: ${step.template.name}`);

      try {
        const resolvedInput = await this.resolveStepInputs(step.input || {}, context);
        const provider = providers[step.provider || workflow.defaultProvider || ''];

        if (!provider) {
          throw new Error(`Provider not found for step ${index + 1}`);
        }
        logger.info(`Step ${index + 1} => resolvedInput: ${JSON.stringify(resolvedInput, null, 2)}`);
        const result = await this.templateExecutor.execute({
          template: step.template,
          provider,
          variables: resolvedInput,
          stream: true
        });

        // logger.info(`Step ${index + 1} => result: ${JSON.stringify(result, null, 2)}`); 
        const executionResult: WorkflowExecutionResult = {
          response: result.response,
          outputVariables: result.outputVariables
        };
        logger.info(`Step ${index + 1} => executionResult: ${JSON.stringify(executionResult, null, 2)}`); 

        // Store step results in context
        if (typeof step.output === 'string') {
          context.results[step.output] = executionResult;
        } else {
          Object.entries(step.output).forEach(([key, varName]) => {
            if (typeof varName === 'string') {
              context.results[varName] = executionResult.outputVariables[key];
            }
          });
        }

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
   * Resolves template variables in a string using the provided context.
   * 
   * @private
   * @param value - Template string containing variables in {{var}} format
   * @param context - Context object containing variable values
   * @returns Resolved string with variables replaced by their values
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
   * Resolves input values for a workflow step, handling variable references and template substitutions.
   * 
   * @private
   * @param inputs - Raw input values for the step
   * @param context - Current workflow execution context
   * @returns Promise resolving to processed input values
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
}