// src/templates/template_executor.ts
import { ExecutionContext, TemplateDefinition } from './types';
import { Message } from '../providers/types';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error_manager';
import { promptForMissingVariables } from '../utils/variable_prompt';
import { createStreamOutputHandler } from "../helpers/stream_helper";
import { handleStreamWithSpinnerAndOutput } from "../helpers/stream_helper";
import { OutputVariableExtractor } from './output_variable_extractor';
import { log } from 'console';

export class TemplateExecutor {
    /**
     * Executes a template with the given context.
     * @param context The execution context containing the template, variables, and provider options.
     * @returns A promise that resolves to the generated content and extracted output variables.
     */
    static async execute(context: ExecutionContext): Promise<{ response: string, outputVariables: Record<string, any> }> {
        const { template, variables, providerOptions, provider, stream } = context;

        try {
            logger.debug(`Executing template: ${JSON.stringify(template)}`);
            logger.debug(`Initial variables: ${JSON.stringify(variables)}`);

            const resolvedVariables = await this.resolveVariables(template, variables);
            logger.debug(`Resolved variables: ${JSON.stringify(resolvedVariables)}`);

            this.validateInputVariables(template, resolvedVariables);

            const content = await this.prepareContent(template, resolvedVariables);
            const messages: Message[] = [{ role: 'user', content }];

            logger.debug(`Sending request to provider with options: ${JSON.stringify(providerOptions)}`);

            let response: string;
            if (stream) {
                const outputHandler = await createStreamOutputHandler();
                response = await handleStreamWithSpinnerAndOutput(
                    provider,
                    messages,
                    providerOptions,
                    outputHandler
                );
            } else {
                response = await provider.generateMessage(messages, providerOptions);
            }

            const outputVariables = this.processOutputVariables(template, response);

            return { response, outputVariables };
        } catch (error) {
            logger.error(`Failed to execute template: ${error}`);
            ErrorManager.handleError('TemplateExecutionError', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Resolves variables by prompting for missing ones.
     * @param template The template definition.
     * @param initialVariables The initial set of variables.
     * @returns A promise that resolves to the complete set of variables.
     */
    private static async resolveVariables(
        template: TemplateDefinition,
        initialVariables: Record<string, any>
    ): Promise<Record<string, any>> {
        return promptForMissingVariables(template.input_variables || {}, initialVariables);
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
    private static validateVariableType(key: string, value: any, variable: any): void {
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
                if (typeof value !== 'number' && !isNaN(Number(value))) {
                    ErrorManager.throwError('InputValidationError', `Invalid type for ${key}: expected number`);
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean' && !['true', 'false'].includes(value.toLowerCase())) {
                    ErrorManager.throwError('InputValidationError', `Invalid type for ${key}: expected boolean`);
                }
                break;
            case 'array':
                if (!Array.isArray(value) && typeof value !== 'string') {
                    ErrorManager.throwError('InputValidationError', `Invalid type for ${key}: expected array or comma-separated string`);
                }
                break;
            default:
                ErrorManager.throwError('InputValidationError', `Unknown variable type for ${key}: ${variable.type}`);
        }
    }

    /**
     * Prepares the content by replacing variables and handling file inclusions.
     * @param template The template definition.
     * @param variables The resolved variables.
     * @returns A promise that resolves to the prepared content.
     */
    private static async prepareContent(template: TemplateDefinition, variables: Record<string, any>): Promise<string> {
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
    private static formatValue(value: any): string {
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
    private static processOutputVariables(template: TemplateDefinition, response: string): Record<string, any> {
        if (!template.output_variables) {
            return {
              qqlm_response: response
            }
        }
        const extractor = new OutputVariableExtractor(template);
        //logger.debug(`Extracting output variables from response: ${response}`);
        return { qllm_response: response, ...extractor.extractVariables(response) };
    }
}