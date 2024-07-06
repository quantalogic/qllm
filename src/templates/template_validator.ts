// src/templates/template_validator.ts
import { TemplateDefinition, TemplateVariable } from './types';
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
      this.validateVariable(key, variable, 'output');
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
   * Validates the content of the template.
   * @param template The template definition to validate.
   * @throws {Error} If the content is invalid or if there are unused variables.
   */
  private static validateContent(template: TemplateDefinition): void {
    if (typeof template.content !== 'string' || template.content.trim().length === 0) {
      ErrorManager.throwError('TemplateValidationError', 'Template content must be a non-empty string');
    }

    // Check if all input variables are used in the content
    const inputVariables = template.input_variables || {};
    for (const key in inputVariables) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      if (!regex.test(template.content)) {
        ErrorManager.throwError('TemplateValidationError', `Input variable ${key} is not used in the template content`);
      }
    }

    // Check for undefined variables in content
    const contentVariables = this.extractContentVariables(template.content);
    for (const variable of contentVariables) {
      if (!(variable in inputVariables)) {
        ErrorManager.throwError('TemplateValidationError', `Undefined variable ${variable} found in template content`);
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