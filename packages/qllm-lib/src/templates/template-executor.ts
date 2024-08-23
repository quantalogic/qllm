// src/templates/template_executor.ts
import { ExecutionContext, TemplateDefinition } from './types';
import { OutputVariableExtractor } from './output-variable-extractor';
import { logger } from '../utils';
import { ErrorManager } from '../utils/error';
import { ChatMessage } from '../types';
import { handleStreamWithSpinner } from './stream-helper';

export class TemplateExecutor {
  onPromptForMissingVariables?: (
    template: TemplateDefinition,
    initialVariables: Record<string, any>,
  ) => Promise<Record<string, any>>;

  /**
   * Executes a template with the given context.
   * @param context The execution context containing the template, variables, and provider options.
   * @returns A promise that resolves to the generated content and extracted output variables.
   */
  async execute(
    context: ExecutionContext,
  ): Promise<{ response: string; outputVariables: Record<string, any> }> {
    const { template, variables, providerOptions, provider, stream, spinner,writableStream } = context;

    try {
      logger.debug(`Executing template: ${JSON.stringify(template)}`);
      logger.debug(`Initial variables: ${JSON.stringify(variables)}`);

      const resolvedVariables = await this.resolveVariables(template, variables);
      logger.debug(`Resolved variables: ${JSON.stringify(resolvedVariables)}`);

      this.validateInputVariables(template, resolvedVariables);

      const content = await this.prepareContent(template, resolvedVariables);
      const messages: ChatMessage[] = [{ role: 'user', content: { type: 'text', text: content } }];

      logger.debug(`Sending request to provider with options: ${JSON.stringify(providerOptions)}`);

      let response: string;
      if (stream) {
        response = await handleStreamWithSpinner(
          provider,
          messages,
          providerOptions,
          writableStream,
          spinner
        );
      } else {
        response = await provider.generateMessage(messages, providerOptions);
      }

      const outputVariables = this.processOutputVariables(template, response);

      return { response, outputVariables };
    } catch (error) {
      logger.error(`Failed to execute template: ${error}`);
      ErrorManager.throwError(
        'TemplateExecutionError',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Resolves variables by prompting for missing ones.
   * @param template The template definition.
   * @param initialVariables The initial set of variables.
   * @returns A promise that resolves to the complete set of variables.
   */
  private async resolveVariables(
    template: TemplateDefinition,
    initialVariables: Record<string, any>,
  ): Promise<Record<string, any>> {
    if (this.onPromptForMissingVariables) {
      return this.onPromptForMissingVariables(template, initialVariables);
    }
    return initialVariables; // Return initial variables if no prompt function is provided
  }

  /**
   * Validates the input variables against the template definition.
   * @param template The template definition.
   * @param variables The input variables.
   */
  private validateInputVariables(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): void {
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
  private validateVariableType(key: string, value: any, variable: any): void {
    if (value === undefined && 'default' in variable) {
      return; // Skip type checking for undefined values with defaults
    }

    switch (variable.type) {
      case 'string':
        if (typeof value !== 'string') {
          ErrorManager.throwError(
            'InputValidationError',
            `Invalid type for ${key}: expected string`,
          );
        }
        break;
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          ErrorManager.throwError(
            'InputValidationError',
            `Invalid type for ${key}: expected number`,
          );
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && !['true', 'false'].includes(value.toLowerCase())) {
          ErrorManager.throwError(
            'InputValidationError',
            `Invalid type for ${key}: expected boolean`,
          );
        }
        break;
      case 'array':
        if (!Array.isArray(value) && typeof value !== 'string') {
          ErrorManager.throwError(
            'InputValidationError',
            `Invalid type for ${key}: expected array or comma-separated string`,
          );
        }
        break;
      default:
        ErrorManager.throwError(
          'InputValidationError',
          `Unknown variable type for ${key}: ${variable.type}`,
        );
    }
  }

  /**
   * Prepares the content by replacing variables and handling file inclusions.
   * @param template The template definition.
   * @param variables The resolved variables.
   * @returns A promise that resolves to the prepared content.
   */
  private async prepareContent(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): Promise<string> {
    let content = template.resolved_content || template.content;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, this.formatValue(value));
    }

    return content;
  }

  /**
   * Formats a value for inclusion in the content.
   * @param value The value to format.
   * @returns The formatted value as a string.
   */
  private formatValue(value: any): string {
    if (Array.isArray(value)) {
      return value.join('\n');
    }
    return String(value);
  }

  /**
   * Processes output variables from the response.
   * @param template The template definition.
   * @param response The response from the LLM provider.
   * @returns The extracted output variables.
   */
  private processOutputVariables(
    template: TemplateDefinition,
    response: string,
  ): Record<string, any> {
    if (!template.output_variables) {
      return { qqlm_response: response };
    }

    const extractor = new OutputVariableExtractor(template);
    return {
      qllm_response: response,
      ...extractor.extractVariables(response),
    };
  }
}
