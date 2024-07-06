// src/templates/template_executor.ts
import { TemplateDefinition, ExecutionContext, TemplateVariable } from './types';
import { ProviderFactory } from '../providers/provider_factory';
import { LLMProviderOptions, Message } from '../providers/types';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error_manager';
import { configManager } from '../utils/configuration_manager';
import { resolveModelAlias } from '../config/model_aliases';
import fs from 'fs/promises';
import path from 'path';
import { ProviderName } from '../config/types';

const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TOP_P = 1.0;
const DEFAULT_TOP_K = 40;

export class TemplateExecutor {
  static async execute(context: ExecutionContext): Promise<string> {
    const { template, variables, providerOptions } = context;
    logger.debug(`Executing template: ${JSON.stringify(template)}`);
    logger.debug(`Variables: ${JSON.stringify(variables)}`);

    try {
      // Validate input variables
      this.validateInputVariables(template, variables);

      // Resolve provider and model
      const providerName = template.provider || configManager.getConfig().defaultProvider;
      if (!providerName) {
        throw new Error('No provider specified in template or default configuration');
      }

      const modelId = resolveModelAlias(providerName as ProviderName, template.model);
      const provider = await ProviderFactory.getProvider(providerName as ProviderName);

      // Prepare content
      const content = await this.prepareContent(template, variables);
      const messages: Message[] = [{ role: 'user', content }];

      // Prepare options
      const options: LLMProviderOptions = {
        model: modelId,
        maxTokens: template.parameters?.max_tokens || providerOptions?.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: template.parameters?.temperature || providerOptions?.temperature || DEFAULT_TEMPERATURE,
        topP: template.parameters?.top_p || providerOptions?.topP || DEFAULT_TOP_P,
        topK: template.parameters?.top_k || providerOptions?.topK || DEFAULT_TOP_K,
        ...providerOptions,
      };

      // Execute the request
      logger.debug(`Executing template "${template.name}" with provider "${providerName}"`);
      logger.debug(`Sending request to provider with options: ${JSON.stringify(options)}`);
      const response = await provider.generateMessage(messages, options);

      // Process output variables
      const processedResponse = this.processOutputVariables(template, response);
      return processedResponse;
    } catch (error) {
      logger.error(`Failed to execute template: ${error}`);
      ErrorManager.handleError('TemplateExecutionError', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private static validateInputVariables(template: TemplateDefinition, variables: Record<string, any>): void {
    const inputVariables = template.input_variables || {};
    for (const [key, variable] of Object.entries(inputVariables)) {
      if (!(key in variables) && !('default' in variable)) {
        ErrorManager.throwError('InputValidationError', `Missing required input variable: ${key}`);
      }
      this.validateVariableType(key, variables[key], variable);
    }
  }

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

  private static async prepareContent(template: TemplateDefinition, variables: Record<string, any>): Promise<string> {
    let content = template.content;

    // Replace variables in content
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      content = content.replace(regex, this.formatValue(value));
    }

    // Handle default values for missing variables
    const inputVariables = template.input_variables || {};
    for (const [key, variable] of Object.entries(inputVariables)) {
      if (!(key in variables) && 'default' in variable) {
        const regex = new RegExp(`{${key}}`, 'g');
        content = content.replace(regex, this.formatValue(variable.default));
      }
    }

    // Handle file inclusions
    content = await this.handleFileInclusions(content);

    return content;
  }

  private static formatValue(value: any): string {
    if (Array.isArray(value)) {
      return value.join('\n');
    }
    return String(value);
  }

  private static async handleFileInclusions(content: string): Promise<string> {
    const fileInclusionRegex = /{{file:([^}]+)}}/g;
    const matches = content.match(fileInclusionRegex);

    if (matches) {
      for (const match of matches) {
        const filePath = match.slice(7, -2).trim(); // Remove '{{file:' and '}}'
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

  private static processOutputVariables(template: TemplateDefinition, response: string): string {
    // TODO: Implement output variable processing logic
    // This could involve parsing the response based on the defined output_variables
    // and potentially transforming the data as specified in the template
    // For now, we'll just return the raw response
    return response;
  }
}