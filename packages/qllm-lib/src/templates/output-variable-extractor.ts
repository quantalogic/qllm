/**
 * @fileoverview Output Variable Extractor for QLLM Library
 * 
 * This module implements a sophisticated system for extracting, parsing, and validating
 * output variables from template execution results. It provides robust handling of
 * various data types and formats with comprehensive error checking.
 * 
 * Key features:
 * - Type-safe variable extraction
 * - Support for multiple data types
 * - Robust error handling
 * - Format validation
 * - Default value handling
 * - Custom type conversion
 * 
 * Supported data types:
 * - Strings
 * - Numbers (integers and floats)
 * - Booleans
 * - Arrays
 * - Objects (JSON)
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * @since 2023
 * 
 * @example
 * ```typescript
 * // Define template with output variables
 * const template = {
 *   name: 'data-processor',
 *   output_variables: {
 *     count: { type: 'integer' },
 *     items: { type: 'array' },
 *     metadata: { type: 'object' }
 *   }
 * };
 * 
 * // Extract variables from execution output
 * const output = `
 * Count: 42
 * Items: ["apple", "banana", "orange"]
 * Metadata: {"status": "success", "timestamp": 1234567890}
 * `;
 * 
 * const variables = OutputVariableExtractor.extractVariables(template, output);
 * console.log(variables);
 * // {
 * //   count: 42,
 * //   items: ["apple", "banana", "orange"],
 * //   metadata: { status: "success", timestamp: 1234567890 }
 * // }
 * ```
 * 
 * @see {@link TemplateExecutor} for template execution
 * @see {@link TemplateDefinition} for template structure
 */

import { ErrorManager } from '../utils/error';
import { TemplateDefinition, OutputVariable } from './types';

/**
 * Extracts and validates output variables from template execution results.
 * Implements a robust parsing system with type conversion and validation.
 * 
 * Key responsibilities:
 * - Variable extraction from raw output
 * - Type conversion and validation
 * - Error handling and reporting
 * - Default value application
 * 
 * @class OutputVariableExtractor
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const vars = OutputVariableExtractor.extractVariables(template, output);
 * 
 * // Handling complex types
 * const template = {
 *   output_variables: {
 *     data: {
 *       type: 'object',
 *       default: { status: 'pending' }
 *     },
 *     timestamps: {
 *       type: 'array',
 *       description: 'List of processing timestamps'
 *     }
 *   }
 * };
 * 
 * const result = OutputVariableExtractor.extractVariables(template, output);
 * console.log(result.data.status);
 * console.log(result.timestamps.length);
 * ```
 */
export class OutputVariableExtractor {
  /**
   * Creates a new instance and extracts variables from the output.
   * Provides a convenient static interface for variable extraction.
   * 
   * @static
   * @param {TemplateDefinition} template - The template containing output variable definitions
   * @param {string} output - The raw output from template execution
   * @returns {Record<string, any>} Extracted and validated variables
   * @throws {OutputVariableError} If extraction or validation fails
   * 
   * @example
   * ```typescript
   * try {
   *   const variables = OutputVariableExtractor.extractVariables(template, output);
   *   console.log('Extracted variables:', variables);
   * } catch (error) {
   *   console.error('Failed to extract variables:', error.message);
   * }
   * ```
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
   * Extracts a single variable from the output using XML-like tags or key-value pairs.
   * 
   * @private
   * @param {string} key - The variable name
   * @param {OutputVariable} _variable - The variable definition
   * @param {string} output - The raw output containing the variable
   * @returns {string | null} Extracted value or null if not found
   */
  private extractVariable(key: string, _variable: OutputVariable, output: string): string | null {
    // First try XML-like tags
    const xmlRegex = new RegExp(`<${key}>(.+?)</${key}>`, 's');
    const xmlMatch = output.match(xmlRegex);
    if (xmlMatch) {
      return xmlMatch[1].trim();
    }

    // If no XML tags found, try to find the value in the output
    // Look for patterns like "key: value" or "key = value"
    const valueRegex = new RegExp(`${key}\\s*[:=]\\s*(.+?)(?=\\n|$)`, 'i');
    const valueMatch = output.match(valueRegex);
    if (valueMatch) {
      return valueMatch[1].trim();
    }

    // If still not found, consider the entire output as the value if this is the only output variable
    if (Object.keys(_variable).length === 1) {
      return output.trim();
    }

    return null;
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
