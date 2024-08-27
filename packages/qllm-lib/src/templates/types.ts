// packages/qllm-lib/src/templates/types.ts

import { LLMOptions, ChatMessage } from "../types";
import * as z from 'zod';

// Enum for output event types
export enum OutputEventType {
  START = 'start',
  CHUNK = 'chunk',
  COMPLETE = 'complete',
  ERROR = 'error',
  STOP = 'stop'
}

export class BaseOutputEvent {
  constructor(public type: OutputEventType) {}
}

export class StartOutputEvent extends BaseOutputEvent {
  constructor() {
    super(OutputEventType.START);
  }
}

export class ChunkOutputEvent extends BaseOutputEvent {
  constructor(public chunk: string) {
    super(OutputEventType.CHUNK);
  }
}

export class CompleteOutputEvent extends BaseOutputEvent {
  constructor(public response: string) {
    super(OutputEventType.COMPLETE);
  }
}

export class ErrorOutputEvent extends BaseOutputEvent {
  constructor(public error: Error, public message: string) {
    super(OutputEventType.ERROR);
  }
}

export class StopOutputEvent extends BaseOutputEvent {
  constructor() {
    super(OutputEventType.STOP);
  }
}

export type OutputEvent =
  | StartOutputEvent
  | ChunkOutputEvent
  | CompleteOutputEvent
  | ErrorOutputEvent
  | StopOutputEvent;

// Utility Types
export interface Spinner {
  stop(): void;
  start(): void;
  fail(message: string): void;
  succeed(message: string): void;
  isActive(): boolean;
  isSpinning(): boolean;
}

// Template Types
export type VariableType = 'string' | 'number' | 'boolean' | 'array';
export type OutputVariableType = 'string' | 'integer' | 'float' | 'boolean' | 'array' | 'object';

export interface TemplateVariable {
  type: VariableType;
  description: string;
  default?: any;
  inferred?: boolean;
}

export interface OutputVariable {
  type: OutputVariableType;
  description?: string;
  default?: any;
}

// Zod schema for TemplateVariable
export const templateVariableSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'array']),
  description: z.string(),
  default: z.any().optional(),
  inferred: z.boolean().optional(),
});

// Zod schema for OutputVariable
export const outputVariableSchema = z.object({
  type: z.enum(['string', 'integer', 'float', 'boolean', 'array', 'object']),
  description: z.string().optional(),
  default: z.any().optional(),
});

// Zod schema for TemplateParameters
export const templateParametersSchema = z.object({
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  top_k: z.number().optional(),
});

// Zod schema for TemplateDefinition
export const templateDefinitionSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string(),
  provider: z.string(),
  model: z.string(),
  input_variables: z.record(z.string(), templateVariableSchema),
  output_variables: z.record(z.string(), outputVariableSchema).optional(),
  content: z.string(),
  parameters: templateParametersSchema.optional(),
  resolved_content: z.string().optional(),
});

// Type inference from Zod schemas
export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;
export type TemplateParameters = z.infer<typeof templateParametersSchema>;

// Execution Context interface
export interface ExecutionContext {
  template: TemplateDefinition;
  variables: Record<string, any>;
  providerOptions: LLMOptions;
  provider: any;
  stream?: boolean;
  spinner?: Spinner;
  onOutput?: (event: OutputEvent) => void;
  onPromptForMissingVariables?: (
    template: TemplateDefinition,
    initialVariables: Record<string, any>
  ) => Promise<Record<string, any>>;
}

// Error Classes
export class QllmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QllmError';
    Object.setPrototypeOf(this, QllmError.prototype);
  }
}

export class ConfigurationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export class ProviderError extends QllmError {
  constructor(message: string, public providerName: string) {
    super(message);
    this.name = 'ProviderError';
    Object.setPrototypeOf(this, ProviderError.prototype);
  }
}

export class TemplateError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
    Object.setPrototypeOf(this, TemplateError.prototype);
  }
}

export class InputValidationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'InputValidationError';
    Object.setPrototypeOf(this, InputValidationError.prototype);
  }
}

export class OutputValidationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'OutputValidationError';
    Object.setPrototypeOf(this, OutputValidationError.prototype);
  }
}

export class TemplateManagerError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateManagerError';
    Object.setPrototypeOf(this, TemplateManagerError.prototype);
  }
}

export class TemplateNotFoundError extends TemplateManagerError {
  constructor(templateName: string) {
    super(`Template not found: ${templateName}`);
    this.name = 'TemplateNotFoundError';
    Object.setPrototypeOf(this, TemplateNotFoundError.prototype);
  }
}

export class InvalidTemplateError extends TemplateManagerError {
  constructor(templateName: string, reason: string) {
    super(`Invalid template ${templateName}: ${reason}`);
    this.name = 'InvalidTemplateError';
    Object.setPrototypeOf(this, InvalidTemplateError.prototype);
  }
}

export class FileOperationError extends TemplateManagerError {
  constructor(operation: string, fileName: string, reason: string) {
    super(`Failed to ${operation} file ${fileName}: ${reason}`);
    this.name = 'FileOperationError';
    Object.setPrototypeOf(this, FileOperationError.prototype);
  }
}