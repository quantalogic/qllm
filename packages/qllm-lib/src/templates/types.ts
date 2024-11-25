/**
 * @fileoverview Type Definitions for QLLM Library
 * 
 * This module provides comprehensive type definitions and specialized error classes
 * for the QLLM library. It establishes the core type system that ensures type safety
 * and proper error handling throughout the application.
 * 
 * Key components:
 * - Execution context types
 * - Template definition types
 * - Error hierarchy
 * - Provider interfaces
 * - Validation types
 * 
 * The error hierarchy is designed to provide specific, contextual error handling
 * for different types of failures that may occur during template processing.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * @since 2023
 * 
 * @example
 * ```typescript
 * // Using execution context
 * const context: ExecutionContext = {
 *   template: myTemplate,
 *   variables: { key: 'value' },
 *   stream: true,
 *   providerOptions: {
 *     temperature: 0.7,
 *     maxTokens: 1000
 *   }
 * };
 * 
 * // Error handling
 * try {
 *   await executeTemplate(context);
 * } catch (error) {
 *   if (error instanceof TemplateError) {
 *     console.error('Template error:', error.message);
 *   } else if (error instanceof ProviderError) {
 *     console.error(`Provider ${error.providerName} error:`, error.message);
 *   }
 * }
 * ```
 * 
 * @see {@link TemplateExecutor} for execution handling
 * @see {@link TemplateManager} for template management
 */

import { LLMOptions, LLMProvider } from '../types';
import { TemplateDefinition } from './template-schema';

export * from './template-schema';
export * from './template-definition-builder';

/**
 * Execution context for template processing.
 * Contains all necessary information and configuration for template execution,
 * including the template itself, variables, provider options, and callbacks.
 * 
 * @interface ExecutionContext
 * 
 * @example
 * ```typescript
 * const context: ExecutionContext = {
 *   template: {
 *     name: 'example',
 *     content: 'Hello {{name}}!',
 *     input_variables: {
 *       name: { type: 'string' }
 *     }
 *   },
 *   variables: {
 *     name: 'World'
 *   },
 *   provider: new OpenAIProvider(),
 *   stream: true,
 *   providerOptions: {
 *     temperature: 0.5
 *   }
 * };
 * ```
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
 * Provides a foundation for the error hierarchy with consistent
 * error naming and prototype chain setup.
 * 
 * @class QllmError
 * @extends Error
 * 
 * @example
 * ```typescript
 * class CustomError extends QllmError {
 *   constructor(message: string) {
 *     super(message);
 *     this.name = 'CustomError';
 *     Object.setPrototypeOf(this, CustomError.prototype);
 *   }
 * }
 * ```
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
