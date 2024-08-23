// packages/qllm-lib/src/templates/types.ts

import { LLMOptions, ChatMessage } from "../types";

// Enum for output event types
// types.ts

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

export type OutputEvent = StartOutputEvent | ChunkOutputEvent | CompleteOutputEvent | ErrorOutputEvent | StopOutputEvent;

// Utility Types
export interface Spinner {
  stop(): void;
  start(): void;
  fail(message: string): void;
  succeed(message: string): void;
  isActive(): boolean;
  isSpinning(): boolean;
}

export interface OutputStream {
  write(chunk: string): void;
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

export interface TemplateParameters {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
}

export interface TemplateDefinition {
  name: string;
  version: string;
  description: string;
  author: string;
  provider: string;
  model: string;
  input_variables: Record<string, TemplateVariable>;
  output_variables?: Record<string, OutputVariable>;
  content: string;
  parameters?: TemplateParameters;
  resolved_content?: string;
}

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