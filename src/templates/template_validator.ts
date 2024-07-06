// src/templates/template_validator.ts
import { TemplateDefinition, TemplateVariable, OutputVariable } from './types';
import { ErrorManager } from '../utils/error_manager';

export class TemplateValidator {
  /**
   * Validates the entire template structure.
   * @param template The template definition to validate.
   * @throws {Error} If the template is invalid.
   */
  static validate(template: TemplateDefinition): void {
    this.validateRequiredFields(template);
    this.validateInputVariables(template);
    this.validateOutputVariables(template);
    this.validateContent(template);
    this.validateParameters(template);
  }

  /**
   * Validates the presence of required fields in the template.
   * @param template The template definition to validate.
   * @throws {Error} If any required field is missing.
   */
  private static validateRequiredFields(template: TemplateDefinition): void {
    const requiredFields = ['name', 'version', 'description', 'author', 'provider', 'model', 'content'];
    for (const field of requiredFields) {
      if (!(field in template)) {
        ErrorManager.throwError('TemplateValidationError', `Missing required field: ${field}`);
      }
    }
  }

  /**
   * Validates the input variables of the template.
   * @param template The template definition to validate.
   * @throws {Error} If any input variable is invalid.
   */
  private static validateInputVariables(template: TemplateDefinition): void {
    if (!template.input_variables) return;

    for (const [key, variable] of Object.entries(template.input_variables)) {
      this.validateVariable(key, variable, 'input');
    }
  }

  /**
   * Validates the output variables of the template.
   * @param template The template definition to validate.
   * @throws {Error} If any output variable is invalid.
   */
  private static validateOutputVariables(template: TemplateDefinition): void {
    if (!template.output_variables) return;

    for (const [key, variable] of Object.entries(template.output_variables)) {
      this.validateOutputVariable(key, variable);
    }
  }

  /**
   * Validates a single variable (input or output).
   * @param key The variable key.
   * @param variable The variable definition.
   * @param variableType Whether it's an 'input' or 'output' variable.
   * @throws {Error} If the variable is invalid.
   */
  private static validateVariable(key: string, variable: TemplateVariable, variableType: 'input' | 'output'): void {
    if (!variable.type) {
      ErrorManager.throwError('TemplateValidationError', `Missing type for ${variableType} variable: ${key}`);
    }

    if (!['string', 'number', 'boolean', 'array'].includes(variable.type)) {
      ErrorManager.throwError('TemplateValidationError', `Invalid type for ${variableType} variable ${key}: ${variable.type}`);
    }

    if (!variable.description) {
      ErrorManager.throwError('TemplateValidationError', `Missing description for ${variableType} variable: ${key}`);
    }

    if (variableType === 'input' && 'default' in variable) {
      this.validateDefaultValue(key, variable);
    }
  }

  /**
   * Validates an output variable.
   * @param key The variable key.
   * @param variable The output variable definition.
   * @throws {Error} If the output variable is invalid.
   */
  private static validateOutputVariable(key: string, variable: OutputVariable): void {
    if (!variable.type) {
      ErrorManager.throwError('TemplateValidationError', `Missing type for output variable: ${key}`);
    }

    if (!['string', 'integer', 'float', 'boolean', 'array', 'object'].includes(variable.type)) {
      ErrorManager.throwError('TemplateValidationError', `Invalid type for output variable ${key}: ${variable.type}`);
    }

    if (!variable.description) {
      ErrorManager.throwError('TemplateValidationError', `Missing description for output variable: ${key}`);
    }

    if ('default' in variable) {
      this.validateOutputDefaultValue(key, variable);
    }
  }

  /**
   * Validates the default value of an input variable.
   * @param key The variable key.
   * @param variable The variable definition.
   * @throws {Error} If the default value is invalid.
   */
  private static validateDefaultValue(key: string, variable: TemplateVariable): void {
    if (variable.default === undefined) return;

    switch (variable.type) {
      case 'string':
        if (typeof variable.default !== 'string') {
          ErrorManager.throwError('TemplateValidationError', `Invalid default value for string variable ${key}`);
        }
        break;
      case 'number':
        if (typeof variable.default !== 'number') {
          ErrorManager.throwError('TemplateValidationError', `Invalid default value for number variable ${key}`);
        }
        break;
      case 'boolean':
        if (typeof variable.default !== 'boolean') {
          ErrorManager.throwError('TemplateValidationError', `Invalid default value for boolean variable ${key}`);
        }
        break;
      case 'array':
        if (!Array.isArray(variable.default)) {
          ErrorManager.throwError('TemplateValidationError', `Invalid default value for array variable ${key}`);
        }
        break;
    }
  }

  /**
   * Validates the default value of an output variable.
   * @param key The variable key.
   * @param variable The output variable definition.
   * @throws {Error} If the default value is invalid.
   */
  private static validateOutputDefaultValue(key: string, variable: OutputVariable): void {
    switch (variable.type) {
      case 'string':
        if (typeof variable.default !== 'string') {
          ErrorManager.throwError('TemplateValidationError', `Invalid default value for string output variable ${key}`);
        }
        break;
      case 'integer':
        if (!Number.isInteger(variable.default)) {
          ErrorManager.throwError('TemplateValidationError', `Invalid default value for integer output variable ${key}`);
        }
        break;
      case 'float':
        if (typeof variable.default !== 'number') {
          ErrorManager.throwError('TemplateValidationError', `Invalid default value for float output variable ${key}`);
        }
        break;
      case 'boolean':
        if (typeof variable.default !== 'boolean') {
          ErrorManager.throwError('TemplateValidationError', `Invalid default value for boolean output variable ${key}`);
        }
        break;
      case 'array':
        if (!Array.isArray(variable.default)) {
          ErrorManager.throwError('TemplateValidationError', `Invalid default value for array output variable ${key}`);
        }
        break;
      case 'object':
        if (typeof variable.default !== 'object' || variable.default === null) {
          ErrorManager.throwError('TemplateValidationError', `Invalid default value for object output variable ${key}`);
        }
        break;
    }
  }

  /**
   * Validates the content of the template.
   * @param template The template definition to validate.
   * @throws {Error} If the content is invalid or if there are unused variables.
   */
  private static validateContent(template: TemplateDefinition): void {
    if (typeof template.content !== 'string' || template.content.trim().length === 0) {
      ErrorManager.throwError('TemplateValidationError', 'Template content must be a non-empty string');
    }

    if (template.resolved_content && typeof template.resolved_content !== 'string') {
      ErrorManager.throwError('TemplateValidationError', 'Resolved content must be a string');
    }

    const contentToValidate = template.resolved_content || template.content;
    const inputVariables = template.input_variables || {};

    // Check if all input variables are used in the content
    for (const key in inputVariables) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      if (!regex.test(contentToValidate)) {
        ErrorManager.throwError('TemplateValidationError', `Input variable ${key} is not used in the template content`);
      }
    }

    // Check for undefined variables in content
    const contentVariables = this.extractContentVariables(contentToValidate);
    for (const variable of contentVariables) {
      if (!(variable in inputVariables)) {
        ErrorManager.throwError('TemplateValidationError', `Undefined variable ${variable} found in template content`);
      }
    }
  }

  /**
   * Validates the parameters of the template.
   * @param template The template definition to validate.
   * @throws {Error} If any parameter is invalid.
   */
  private static validateParameters(template: TemplateDefinition): void {
    if (!template.parameters) return;

    const validParameters = ['max_tokens', 'temperature', 'top_p', 'top_k'];
    for (const [key, value] of Object.entries(template.parameters)) {
      if (!validParameters.includes(key)) {
        ErrorManager.throwError('TemplateValidationError', `Invalid parameter: ${key}`);
      }

      switch (key) {
        case 'max_tokens':
          if (!Number.isInteger(value) || value <= 0) {
            ErrorManager.throwError('TemplateValidationError', `Invalid value for max_tokens: ${value}`);
          }
          break;
        case 'temperature':
        case 'top_p':
          if (typeof value !== 'number' || value < 0 || value > 1) {
            ErrorManager.throwError('TemplateValidationError', `Invalid value for ${key}: ${value}`);
          }
          break;
        case 'top_k':
          if (!Number.isInteger(value) || value <= 0) {
            ErrorManager.throwError('TemplateValidationError', `Invalid value for top_k: ${value}`);
          }
          break;
      }
    }
  }

  /**
   * Extracts all variable names from the template content.
   * @param content The template content.
   * @returns An array of variable names found in the content.
   */
  private static extractContentVariables(content: string): string[] {
    const variableRegex = /{{(.*?)}}/g;
    const matches = content.match(variableRegex);
    if (!matches) return [];
    return matches.map(match => match.slice(2, -2).trim());
  }
}