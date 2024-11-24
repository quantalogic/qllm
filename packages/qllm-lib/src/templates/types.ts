/**
 * @fileoverview Type Definitions for QLLM Library
 * 
 * This module provides type definitions and error classes for the QLLM library.
 * It includes types for execution context, template definitions, and specialized
 * error classes for different types of failures.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 */

import { LLMOptions, LLMProvider } from '../types';
import { TemplateDefinition } from './template-schema';

export * from './template-schema';
export * from './template-definition-builder';

/**
 * Execution context for template processing.
 * Contains all necessary information for template execution.
 * 
 * @interface ExecutionContext
 */
export interface ExecutionContext {
  /** The template to execute */
  template: TemplateDefinition;
  /** Variables to be used in template execution */
  variables?: Record<string, any>;
  /** Optional provider-specific options */
  providerOptions?: Partial<LLMOptions>;
  /** The LLM provider to use */
  provider?: LLMProvider;
  /** Whether to use streaming mode */
  stream?: boolean;
  /** Callback for handling missing variables */
  onPromptForMissingVariables?: (
    template: TemplateDefinition,
    initialVariables: Record<string, any>,
  ) => Promise<Record<string, any>>;
}

/**
 * Base error class for QLLM-specific errors.
 * 
 * @class QllmError
 * @extends Error
 */
export class QllmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QllmError';
    Object.setPrototypeOf(this, QllmError.prototype);
  }
}

/**
 * Error class for configuration-related errors.
 * 
 * @class ConfigurationError
 * @extends QllmError
 */
export class ConfigurationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error class for provider-specific errors.
 * 
 * @class ProviderError
 * @extends QllmError
 */
export class ProviderError extends QllmError {
  constructor(
    message: string,
    public providerName: string,
  ) {
    super(message);
    this.name = 'ProviderError';
    Object.setPrototypeOf(this, ProviderError.prototype);
  }
}

/**
 * Error class for template-related errors.
 * 
 * @class TemplateError
 * @extends QllmError
 */
export class TemplateError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
    Object.setPrototypeOf(this, TemplateError.prototype);
  }
}

/**
 * Error class for input validation failures.
 * 
 * @class InputValidationError
 * @extends QllmError
 */
export class InputValidationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'InputValidationError';
    Object.setPrototypeOf(this, InputValidationError.prototype);
  }
}

/**
 * Error class for output validation failures.
 * 
 * @class OutputValidationError
 * @extends QllmError
 */
export class OutputValidationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'OutputValidationError';
    Object.setPrototypeOf(this, OutputValidationError.prototype);
  }
}

/**
 * Error class for template manager failures.
 * 
 * @class TemplateManagerError
 * @extends QllmError
 */
export class TemplateManagerError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateManagerError';
    Object.setPrototypeOf(this, TemplateManagerError.prototype);
  }
}

/**
 * Error class for template not found errors.
 * 
 * @class TemplateNotFoundError
 * @extends TemplateManagerError
 */
export class TemplateNotFoundError extends TemplateManagerError {
  constructor(templateName: string) {
    super(`Template not found: ${templateName}`);
    this.name = 'TemplateNotFoundError';
    Object.setPrototypeOf(this, TemplateNotFoundError.prototype);
  }
}

/**
 * Error class for invalid template errors.
 * 
 * @class InvalidTemplateError
 * @extends TemplateManagerError
 */
export class InvalidTemplateError extends TemplateManagerError {
  constructor(templateName: string, reason: string) {
    super(`Invalid template ${templateName}: ${reason}`);
    this.name = 'InvalidTemplateError';
    Object.setPrototypeOf(this, InvalidTemplateError.prototype);
  }
}

/**
 * Error class for file operation failures.
 * 
 * @class FileOperationError
 * @extends TemplateManagerError
 */
export class FileOperationError extends TemplateManagerError {
  constructor(operation: string, fileName: string, reason: string) {
    super(`Failed to ${operation} file ${fileName}: ${reason}`);
    this.name = 'FileOperationError';
    Object.setPrototypeOf(this, FileOperationError.prototype);
  }
}
