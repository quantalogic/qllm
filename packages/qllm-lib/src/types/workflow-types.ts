// src/types/workflow-types.ts

import { TemplateDefinition } from '../templates/types';

export interface WorkflowStep {
    template?: TemplateDefinition;
    templateUrl?: string;
    tool?: string; 
    provider?: string;
    input?: Record<string, string | number | boolean>;
    output: string | Record<string, string>;
  }

export interface WorkflowDefinition {
    name: string;
    description?: string;
    version?: string;
    defaultProvider?: string;
    steps: WorkflowStep[];
}

export interface WorkflowExecutionResult {
    response: string;
    outputVariables: Record<string, any>;
}

export interface WorkflowExecutionContext {
    variables: Record<string, any>;
    results: Record<string, WorkflowExecutionResult>;
}