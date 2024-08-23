// packages/qllm-lib/src/templates/types.ts

import { LLMOptions } from "../types";

// Utility Interfaces
export interface Spinner {
  stop: () => void;
  start: () => void;
  fail: (message: string) => void;
  succeed: (message: string) => void;
  isActive: () => boolean;
  isSpinning(): boolean;
}

export interface OutputStream {
  write: (chunk: string) => void;
}

// Template-related Interfaces
export interface TemplateVariable {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  default?: any;
}

export interface OutputVariable {
  type: 'string' | 'integer' | 'float' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: any;
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
  parameters?: {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
  resolved_content?: string;
}

export interface ExecutionContext {
  template: TemplateDefinition;
  variables: Record<string, any>;
  providerOptions: LLMOptions;
  provider: any;
  stream?: boolean;
  writableStream?: NodeJS.WritableStream;
  spinner?: Spinner;
}

// Error Classes
export class QllmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QllmError';
  }
}

export class ConfigurationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ProviderError extends QllmError {
  constructor(message: string, public providerName: string) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class TemplateError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

export class InputValidationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'InputValidationError';
  }
}

export class OutputValidationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'OutputValidationError';
  }
}

export class TemplateManagerError extends Error {
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