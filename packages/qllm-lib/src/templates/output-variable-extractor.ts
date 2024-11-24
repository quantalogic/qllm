/**
 * @fileoverview Output Variable Extractor for QLLM Library
 * 
 * This module provides functionality for extracting and validating output variables
 * from template execution results. It supports parsing and type conversion for
 * various data types including strings, numbers, booleans, arrays, and objects.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * 
 * @example
 * ```typescript
 * const output = await executeTemplate(template);
 * const variables = OutputVariableExtractor.extractVariables(template, output);
 * ```
 */

import { ErrorManager } from '../utils/error';
import { TemplateDefinition, OutputVariable } from './types';

/**
 * Extracts and validates output variables from template execution results.
 * 
 * @class OutputVariableExtractor
 */
export class OutputVariableExtractor {
  /**
   * Creates a new instance and extracts variables from the output.
   * 
   * @static
   * @param {TemplateDefinition} template - The template containing output variable definitions
   * @param {string} output - The raw output from template execution
   * @returns {Record<string, any>} Extracted and validated variables
   */
  static extractVariables(template: TemplateDefinition, output: string): Record<string, any> {
    const extractor = new OutputVariableExtractor(template);
    return extractor.extractVariables(output);
  }

  /**
   * Creates a new OutputVariableExtractor instance.
   * 
   * @private
   * @param {TemplateDefinition} template - The template containing output variable definitions
   */
  private constructor(private template: TemplateDefinition) {}

  /**
   * Extracts all defined output variables from the execution result.
   * 
   * @param {string} output - The raw output from template execution
   * @returns {Record<string, any>} Extracted and validated variables
   */
  extractVariables(output: string): Record<string, any> {
    const result: Record<string, any> = {};
    const outputVariables = this.template.output_variables || {};

    for (const [key, variable] of Object.entries(outputVariables)) {
      const value = this.extractVariable(key, variable, output);
      result[key] = this.validateAndTransform(key, variable, value);
    }

    return result;
  }

  /**
   * Extracts a single variable from the output using XML-like tags.
   * 
   * @private
   * @param {string} key - The variable name
   * @param {OutputVariable} _variable - The variable definition
   * @param {string} output - The raw output containing the variable
   * @returns {string | null} Extracted value or null if not found
   */
  private extractVariable(key: string, _variable: OutputVariable, output: string): string | null {
    const regex = new RegExp(`<${key}>(.+?)</${key}>`, 's');
    const match = output.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Validates and transforms an extracted value according to its type definition.
   * 
   * @private
   * @param {string} key - The variable name
   * @param {OutputVariable} variable - The variable definition
   * @param {string | null} value - The extracted value
   * @returns {any} The transformed value
   * @throws {OutputValidationError} If validation or transformation fails
   */
  private validateAndTransform(key: string, variable: OutputVariable, value: string | null): any {
    if (value === null) {
      if ('default' in variable) {
        return variable.default;
      }
      ErrorManager.throwError('OutputValidationError', `Missing required output variable: ${key}`);
    }

    switch (variable.type) {
      case 'string':
        return value;
      case 'integer':
        return this.parseInteger(key, value);
      case 'float':
        return this.parseFloat(key, value);
      case 'boolean':
        return this.parseBoolean(key, value);
      case 'array':
        return this.parseArray(key, value);
      case 'object':
        return this.parseObject(key, value);
      default:
        ErrorManager.throwError(
          'OutputValidationError',
          `Invalid type for output variable ${key}: ${variable.type}`,
        );
    }
  }

  /**
   * Parses a string value as an integer.
   * 
   * @private
   * @param {string} key - The variable name
   * @param {string} value - The value to parse
   * @returns {number} The parsed integer
   * @throws {OutputValidationError} If parsing fails
   */
  private parseInteger(key: string, value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      ErrorManager.throwError(
        'OutputValidationError',
        `Invalid integer value for ${key}: ${value}`,
      );
    }
    return parsed;
  }

  /**
   * Parses a string value as a float.
   * 
   * @private
   * @param {string} key - The variable name
   * @param {string} value - The value to parse
   * @returns {number} The parsed float
   * @throws {OutputValidationError} If parsing fails
   */
  private parseFloat(key: string, value: string): number {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      ErrorManager.throwError('OutputValidationError', `Invalid float value for ${key}: ${value}`);
    }
    return parsed;
  }

  /**
   * Parses a string value as a boolean.
   * 
   * @private
   * @param {string} key - The variable name
   * @param {string} value - The value to parse
   * @returns {boolean} The parsed boolean
   * @throws {OutputValidationError} If parsing fails
   */
  private parseBoolean(key: string, value: string): boolean {
    const lowercaseValue = value.toLowerCase();
    if (lowercaseValue === 'true') return true;
    if (lowercaseValue === 'false') return false;
    ErrorManager.throwError('OutputValidationError', `Invalid boolean value for ${key}: ${value}`);
  }

  /**
   * Parses a string value as an array.
   * 
   * @private
   * @param {string} key - The variable name
   * @param {string} value - The value to parse
   * @returns {any[]} The parsed array
   * @throws {OutputValidationError} If parsing fails
   */
  private parseArray(key: string, value: string): any[] {
    try {
      return JSON.parse(value);
    } catch (error) {
      ErrorManager.throwError('OutputValidationError', `Invalid array value for ${key}: ${value}`);
    }
  }

  /**
   * Parses a string value as an object.
   * 
   * @private
   * @param {string} key - The variable name
   * @param {string} value - The value to parse
   * @returns {object} The parsed object
   * @throws {OutputValidationError} If parsing fails
   */
  private parseObject(key: string, value: string): object {
    try {
      return JSON.parse(value);
    } catch (error) {
      ErrorManager.throwError('OutputValidationError', `Invalid object value for ${key}: ${value}`);
    }
  }
}
