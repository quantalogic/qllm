/**
 * @fileoverview Type definitions for workflow management in the QLLM library.
 * This file defines the core types and interfaces for handling workflows,
 * including steps, definitions, and execution contexts.
 * 
 * @version 1.0.0
 * @license MIT
 */

import { TemplateDefinition } from '../templates/types';

/**
 * Represents a single step in a workflow
 * Each step contains a template, optional provider, input parameters, and output specification
 */
export interface WorkflowStep {
    template?: TemplateDefinition;
    templateUrl?: string;
    name?: string;
    description?: string;
    tool?: string;
    toolConfig?: Record<string, any>;  
    provider?: string;
    input?: Record<string, string | number | boolean>;
    output: string | Record<string, string>;
  }

/**
 * Defines a complete workflow including its metadata and steps
 */
export interface WorkflowDefinition {
    /** Name of the workflow */
    name: string;
    /** Optional description of the workflow's purpose */
    description?: string;
    /** Optional version identifier */
    version?: string;
    /** Default provider to use if not specified in steps */
    defaultProvider?: string;
    /** Ordered array of workflow steps */
    steps: WorkflowStep[];
}

/**
 * Result of executing a workflow step
 */
export interface WorkflowExecutionResult {
    /** Response text or data from the step execution */
    response: string;
    /** Variables produced by the step execution */
    outputVariables: Record<string, any>;
}

/**
 * Context maintained during workflow execution
 * Contains variables and results from previous steps
 */
export interface WorkflowExecutionContext {
    /** Variables available during workflow execution */
    variables: Record<string, any>;
    /** Results from executed steps */
    results: Record<string, WorkflowExecutionResult>;
}