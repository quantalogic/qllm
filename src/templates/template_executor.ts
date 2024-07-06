// src/templates/template_executor.ts
import { TemplateDefinition, ExecutionContext, TemplateVariable } from './types';
import { Message } from '../providers/types';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error_manager';
import fs from 'fs/promises';
import path from 'path';
import {createStreamOutputHandler } from '../helpers/output_helper';
import { handleStreamWithSpinnerAndOutput } from '../helpers/stream_helper';

export class TemplateExecutor {
  /**
   * Executes a template with the given context.
   * @param context The execution context containing the template, variables, and provider options.
   * @returns A promise that resolves to the generated content.
   */
  static async execute(context: ExecutionContext): Promise<string> {
    const { template, variables, providerOptions, provider, stream } = context;
    try {
      logger.debug(`Executing template: ${JSON.stringify(template)}`);
      logger.debug(`Variables: ${JSON.stringify(variables)}`);
      logger.debug(`Provider options: ${JSON.stringify(providerOptions)}`);

      // Validate input variables
      this.validateInputVariables(template, variables);

      // Prepare content
      const content = await this.prepareContent(template, variables);

      const messages: Message[] = [{ role: 'user', content }];

      // Execute the request
      logger.debug(`Sending request to provider with options: ${JSON.stringify(providerOptions)}`);

      if (stream) {
        const outputHandler = await createStreamOutputHandler();
        return handleStreamWithSpinnerAndOutput(
          provider,
          messages,
          providerOptions,
          outputHandler
        );
      } else {
        const response = await provider.generateMessage(messages, providerOptions);
        return this.processOutputVariables(template, response);
      }
    } catch (error) {
      logger.error(`Failed to execute template: ${error}`);
      ErrorManager.handleError('TemplateExecutionError', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Validates the input variables against the template definition.
   * @param template The template definition.
   * @param variables The input variables.
   */
  private static validateInputVariables(template: TemplateDefinition, variables: Record<string, any>): void {
    const inputVariables = template.input_variables || {};
    for (const [key, variable] of Object.entries(inputVariables)) {
      if (!(key in variables) && !('default' in variable)) {
        ErrorManager.throwError('InputValidationError', `Missing required input variable: ${key}`);
      }
      this.validateVariableType(key, variables[key], variable);
    }
  }

  /**
   * Validates the type of a single variable.
   * @param key The variable key.
   * @param value The variable value.
   * @param variable The variable definition from the template.
   */
  private static validateVariableType(key: string, value: any, variable: TemplateVariable): void {
    if (value === undefined && 'default' in variable) {
      return; // Skip type checking for undefined values with defaults
    }

    switch (variable.type) {
      case 'string':
        if (typeof value !== 'string') {
          ErrorManager.throwError('InputValidationError', `Invalid type for ${key}: expected string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          ErrorManager.throwError('InputValidationError', `Invalid type for ${key}: expected number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          ErrorManager.throwError('InputValidationError', `Invalid type for ${key}: expected boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          ErrorManager.throwError('InputValidationError', `Invalid type for ${key}: expected array`);
        }
        break;
      default:
        ErrorManager.throwError('InputValidationError', `Unknown variable type for ${key}: ${variable.type}`);
    }
  }

  /**
   * Prepares the content by replacing variables and handling file inclusions.
   * @param template The template definition.
   * @param variables The input variables.
   * @returns A promise that resolves to the prepared content.
   */
  private static async prepareContent(template: TemplateDefinition, variables: Record<string, any>): Promise<string> {
    let content = template.content;

    // Replace variables in content
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, this.formatValue(value));
    }

    // Handle default values for missing variables
    const inputVariables = template.input_variables || {};
    for (const [key, variable] of Object.entries(inputVariables)) {
      if (!(key in variables) && 'default' in variable) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        content = content.replace(regex, this.formatValue(variable.default));
      }
    }

    // Handle file inclusions
    content = await this.handleFileInclusions(content);

    return content;
  }

  /**
   * Formats a value for inclusion in the content.
   * @param value The value to format.
   * @returns The formatted value as a string.
   */
  private static formatValue(value: any): string {
    if (Array.isArray(value)) {
      return value.join('\n');
    }
    return String(value);
  }

  /**
   * Handles file inclusions in the content.
   * @param content The content to process for file inclusions.
   * @returns A promise that resolves to the content with file inclusions processed.
   */
  private static async handleFileInclusions(content: string): Promise<string> {
    const fileInclusionRegex = /{{file:\s*([^}]+)\s*}}/g;
    const matches = content.match(fileInclusionRegex);

    if (matches) {
      for (const match of matches) {
        const filePath = match.slice(8, -2).trim(); // Remove '{{file:' and '}}'
        try {
          const fileContent = await fs.readFile(path.resolve(process.cwd(), filePath), 'utf-8');
          content = content.replace(match, fileContent);
        } catch (error) {
          ErrorManager.throwError('FileInclusionError', `Failed to include file ${filePath}: ${error}`);
        }
      }
    }

    return content;
  }

  /**
   * Processes output variables from the response.
   * @param template The template definition.
   * @param response The response from the LLM provider.
   * @returns The processed response.
   */
  private static processOutputVariables(template: TemplateDefinition, response: string): string {
    // TODO: Implement output variable processing logic
    // This could involve parsing the response based on the defined output_variables
    // and potentially transforming the data as specified in the template
    // For now, we'll just return the raw response
    return response;
  }
}