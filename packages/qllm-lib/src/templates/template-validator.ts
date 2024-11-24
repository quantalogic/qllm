/**
 * @fileoverview Template Validator for QLLM Library
 * 
 * This module provides validation functionality for template input variables.
 * It ensures that all required variables are present and that their types
 * match the expected types defined in the template.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 */

import { ErrorManager } from '../utils/error';
import { TemplateDefinition } from './types';

/**
 * Valid types for template variables.
 */
type ValidatorType = 'string' | 'number' | 'boolean' | 'array';

/**
 * Interface defining the structure of a variable definition.
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
 * @class TemplateValidator
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
