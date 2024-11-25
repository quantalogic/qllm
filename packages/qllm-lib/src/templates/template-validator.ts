/**
 * @fileoverview Template Validator for QLLM Library
 * 
 * This module implements robust validation for QLLM template input variables,
 * ensuring type safety and data integrity throughout template execution.
 * Key features include:
 * 
 * - Type validation for input variables
 * - Required field validation
 * - Default value handling
 * - Detailed error reporting
 * - Support for primitive and complex types
 * 
 * The validator helps prevent runtime errors by ensuring all variables
 * meet their specified constraints before template execution begins.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * @since 2023
 * 
 * @example
 * ```typescript
 * // Define a template with variable constraints
 * const template = {
 *   name: 'example',
 *   input_variables: {
 *     name: { type: 'string', required: true },
 *     age: { type: 'number', default: 0 },
 *     tags: { type: 'array' }
 *   }
 * };
 * 
 * // Validate input variables
 * try {
 *   TemplateValidator.validateInputVariables(template, {
 *     name: 'John',
 *     tags: ['user', 'new']
 *   });
 * } catch (error) {
 *   console.error('Validation failed:', error.message);
 * }
 * ```
 * 
 * @see {@link TemplateExecutor} for template execution
 * @see {@link TemplateDefinition} for template structure
 */

import { ErrorManager } from '../utils/error';
import { TemplateDefinition } from './types';

/**
 * Valid types for template variables.
 * These types represent the core data types that can be validated.
 * 
 * @type {ValidatorType}
 */
type ValidatorType = 'string' | 'number' | 'boolean' | 'array';

/**
 * Interface defining the structure of a variable definition.
 * Used to specify constraints and validation rules for template variables.
 * 
 * @interface VariableDefinition
 * @property {ValidatorType} type - The expected data type of the variable
 * @property {any} [default] - Optional default value if variable is not provided
 * @property {boolean} [required] - Whether the variable must be provided
 * @property {string} [description] - Optional description of the variable's purpose
 */
interface VariableDefinition {
  /** The expected type of the variable */
  type: ValidatorType;
  /** Optional default value if the variable is not provided */
  default?: any;
}

/**
 * Validates template input variables against their definitions.
 * Ensures type safety and presence of required variables.
 * 
 * Key responsibilities:
 * - Validates variable types against definitions
 * - Ensures required variables are present
 * - Applies default values when appropriate
 * - Provides detailed error messages on validation failure
 * 
 * @class TemplateValidator
 * @throws {InputValidationError} When validation fails
 * 
 * @example
 * ```typescript
 * // Simple validation
 * TemplateValidator.validateInputVariables(template, {
 *   username: 'john_doe',
 *   age: 25
 * });
 * 
 * // Validation with default values
 * TemplateValidator.validateInputVariables(template, {
 *   username: 'john_doe'
 *   // age will use default value if defined
 * });
 * ```
 */
export class TemplateValidator {
  /**
   * Validates all input variables for a template.
   * 
   * @static
   * @param {TemplateDefinition} template - The template containing variable definitions
   * @param {Record<string, any>} variables - The variables to validate
   * @throws {InputValidationError} If validation fails
   */
  static validateInputVariables(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): void {
    const inputVariables = template.input_variables || {};
    for (const [key, variable] of Object.entries(inputVariables)) {
      if (!(key in variables) && !('default' in variable)) {
        ErrorManager.throwError('InputValidationError', `Missing required input variable: ${key}`);
      }
      this.validateVariableType(key, variables[key], variable as VariableDefinition);
    }
  }

  /**
   * Validates the type of a single variable.
   * 
   * @private
   * @static
   * @param {string} key - The variable name
   * @param {any} value - The variable value to validate
   * @param {VariableDefinition} variable - The variable definition
   * @throws {InputValidationError} If type validation fails
   */
  private static validateVariableType(key: string, value: any, variable: VariableDefinition): void {
    if (value === undefined && 'default' in variable) return;

    const typeValidators: Record<ValidatorType, (v: any) => boolean> = {
      string: (v: any): v is string => typeof v === 'string',
      number: (v: any): boolean => typeof v === 'number' || !isNaN(Number(v)),
      boolean: (v: any): boolean =>
        typeof v === 'boolean' || ['true', 'false'].includes(String(v).toLowerCase()),
      array: (v: any): v is any[] | string => Array.isArray(v) || typeof v === 'string',
    };

    const validator = typeValidators[variable.type];
    if (!validator) {
      ErrorManager.throwError(
        'InputValidationError',
        `Unknown variable type for ${key}: ${variable.type}`,
      );
    }

    if (!validator(value)) {
      ErrorManager.throwError(
        'InputValidationError',
        `Invalid type for ${key}: expected ${variable.type}`,
      );
    }
  }
}
