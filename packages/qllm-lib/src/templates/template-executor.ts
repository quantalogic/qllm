/**
 * @fileoverview Template Executor for QLLM Library
 * 
 * This module provides the execution engine for QLLM templates. It handles template
 * processing, variable resolution, LLM interaction, and output processing. The executor
 * implements an event-driven architecture to provide detailed visibility into the
 * execution lifecycle.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * 
 * @example
 * ```typescript
 * const executor = new TemplateExecutor();
 * executor.on('executionComplete', ({ response, outputVariables }) => {
 *   console.log('Execution completed:', response);
 * });
 * 
 * const result = await executor.execute({
 *   template: myTemplate,
 *   variables: { input: 'Hello' }
 * });
 * ```
 */

import { EventEmitter } from 'events';
import { ExecutionContext, TemplateDefinition } from './types';
import { OutputVariableExtractor } from './output-variable-extractor';
import { logger } from '../utils';
import { ErrorManager } from '../utils/error';
import { TemplateValidator } from './template-validator';
import { ChatMessage, LLMProvider } from '../types';
import { createLLMProvider } from '..';
import {
  findIncludeStatements,
  resolveIncludedContent,
} from '../utils/document/document-inclusion-resolver';
import { DocumentLoader } from '../utils/document/document-loader';
import path from 'path';

/**
 * Events emitted during template execution.
 * Each event corresponds to a specific phase in the execution lifecycle.
 * 
 * @interface TemplateExecutorEvents
 */
interface TemplateExecutorEvents {
  /** Emitted when template execution begins */
  executionStart: { template: TemplateDefinition; variables: Record<string, any> };
  /** Emitted after all variables are resolved and validated */
  variablesResolved: Record<string, any>;
  /** Emitted when the template content is prepared with variables */
  contentPrepared: string;
  /** Emitted when the request is sent to the LLM provider */
  requestSent: { messages: ChatMessage[]; providerOptions: any };
  /** Emitted when a response is received from the LLM provider */
  responseReceived: string;
  /** Emitted when streaming response begins */
  streamStart: void;
  /** Emitted for each chunk in a streaming response */
  streamChunk: string;
  /** Emitted when streaming response completes */
  streamComplete: string;
  /** Emitted if streaming response encounters an error */
  streamError: Error;
  /** Emitted after output variables are extracted and processed */
  outputVariablesProcessed: Record<string, any>;
  /** Emitted when execution successfully completes */
  executionComplete: { response: string; outputVariables: Record<string, any> };
  /** Emitted if execution encounters an error */
  executionError: Error;
}

/**
 * Template execution engine that processes templates and interacts with LLM providers.
 * Extends EventEmitter to provide detailed execution lifecycle events.
 * 
 * @class TemplateExecutor
 * @extends {EventEmitter}
 */
export class TemplateExecutor extends EventEmitter {
  /**
   * Creates a new template executor instance.
   */
  constructor() {
    super();
  }

  /**
   * Registers an event listener for template execution events.
   * 
   * @template K - Event name type
   * @param {K} eventName - Name of the event to listen for
   * @param {function} listener - Event handler function
   * @returns {this} The executor instance for chaining
   */
  on<K extends keyof TemplateExecutorEvents>(
    eventName: K,
    listener: (arg: TemplateExecutorEvents[K]) => void,
  ): this {
    return super.on(eventName, listener);
  }

  /**
   * Emits a template execution event.
   * 
   * @template K - Event name type
   * @param {K} eventName - Name of the event to emit
   * @param {TemplateExecutorEvents[K]} arg - Event data
   * @returns {boolean} True if the event had listeners
   */
  emit<K extends keyof TemplateExecutorEvents>(
    eventName: K,
    arg: TemplateExecutorEvents[K],
  ): boolean {
    return super.emit(eventName, arg);
  }

  /**
   * Executes a template with the given context and variables.
   * 
   * @param {Object} context - Execution context
   * @param {TemplateDefinition} context.template - Template to execute
   * @param {LLMProvider} [context.provider] - LLM provider to use
   * @param {Record<string, any>} [context.variables] - Input variables
   * @param {boolean} [context.stream] - Whether to stream the response
   * @param {any} [context.providerOptions] - Provider-specific options
   * @param {Function} [context.onPromptForMissingVariables] - Callback for missing variables
   * @returns {Promise<{response: string, outputVariables: Record<string, any>}>} Execution result
   * @throws {Error} If execution fails
   */
  async execute({
    template,
    provider,
    variables = {},
    stream = false,
    providerOptions = {},
    onPromptForMissingVariables,
  }: ExecutionContext): Promise<{ response: string; outputVariables: Record<string, any> }> {
    this.emit('executionStart', { template, variables });

    const executionProvider =
      provider || (providerOptions.model && createLLMProvider({ name: providerOptions.model }));

    if (!executionProvider) {
      this.handleExecutionError('LLMProvider not provided');
    }

    const context = {
      template,
      variables,
      providerOptions,
      stream,
      provider: executionProvider,
      onPromptForMissingVariables,
    };

    try {
      this.logDebugInfo(template, variables);
      const resolvedVariables = await this.resolveAndValidateVariables(
        context,
        template,
        variables,
      );
      this.emit('variablesResolved', resolvedVariables);

      const content = await this.prepareContent(template, resolvedVariables);

      let resolvedContent = content;

      if (findIncludeStatements(content).length > 0) {
        const currentPath = process.cwd();
        const contentWithMissingInclude = await resolveIncludedContent(content, currentPath);
        resolvedContent = contentWithMissingInclude;
      }

      this.emit('contentPrepared', resolvedContent);

      const messages = this.createChatMessages(resolvedContent);
      this.emit('requestSent', { messages, providerOptions });

      const response = await this.generateResponse(
        provider!,
        messages,
        providerOptions,
        stream || false,
      );
      this.emit('responseReceived', response);

      const outputVariables = this.processOutputVariables(template, response);
      this.emit('outputVariablesProcessed', outputVariables);

      this.emit('executionComplete', { response, outputVariables });
      return { response, outputVariables };
    } catch (error) {
      this.emit('executionError', error instanceof Error ? error : new Error(String(error)));
      this.handleExecutionError(error);
    }
  }

  /**
   * Logs debug information about the template execution.
   * 
   * @private
   * @param {TemplateDefinition} template - Template being executed
   * @param {Record<string, any>} variables - Input variables
   */
  private logDebugInfo(template: TemplateDefinition, variables: Record<string, any>): void {
    logger.debug(`Executing template: ${JSON.stringify(template)}`);
    logger.debug(`Initial variables: ${JSON.stringify(variables)}`);
  }

  /**
   * Resolves and validates all template variables.
   * 
   * @private
   * @param {ExecutionContext} context - Execution context
   * @param {TemplateDefinition} template - Template definition
   * @param {Record<string, any>} initialVariables - Initial variable values
   * @returns {Promise<Record<string, any>>} Resolved variables
   */
  private async resolveAndValidateVariables(
    context: ExecutionContext,
    template: TemplateDefinition,
    initialVariables: Record<string, any>,
  ): Promise<Record<string, any>> {
    const resolvedVariables = await this.resolveVariables(context, template, initialVariables);
    TemplateValidator.validateInputVariables(template, resolvedVariables);
    return resolvedVariables;
  }

  /**
   * Resolves template variables, handling file paths and missing variables.
   * 
   * @private
   * @param {ExecutionContext} context - Execution context
   * @param {TemplateDefinition} template - Template definition
   * @param {Record<string, any>} initialVariables - Initial variable values
   * @returns {Promise<Record<string, any>>} Resolved variables
   */
  private async resolveVariables(
    context: ExecutionContext,
    template: TemplateDefinition,
    initialVariables: Record<string, any>,
  ): Promise<Record<string, any>> {
    const resolvedVariables = { ...initialVariables };

    // Handle file path variables first
    for (const [key, value] of Object.entries(initialVariables)) {
      const varDef = template.input_variables?.[key];
      if (!varDef) continue;

      if (varDef.type === 'file_path' || varDef.type === 'files_path') {
        try {
          if (Array.isArray(value) && varDef.type === 'files_path') {
            // Handle multiple files
            const contents = await Promise.all(value.map(async (filePath) => {
              const loader = new DocumentLoader(filePath, {
                encoding: 'utf-8',
                useCache: true
              });
              const { content } = await loader.loadAsString();
              return content;
            }));
            resolvedVariables[key] = contents.join('\n\n');
            varDef["type"] = "string"
          } else if (typeof value === 'string' && varDef.type === 'file_path') {
            // Handle single file
            const loader = new DocumentLoader(value, {
              encoding: 'utf-8',
              useCache: true
            });
            const { content } = await loader.loadAsString();
            resolvedVariables[key] = content;
            varDef["type"] = "string"
          }
        } catch (error) {
          this.handleExecutionError(`Failed to process file ${key}: ${error}`);
        }
      }
    }

    if (!context.onPromptForMissingVariables) return this.applyDefaultValues(template, resolvedVariables);
    const missingVariables = this.findMissingVariables(template, resolvedVariables);
    if (missingVariables.length > 0) {
      const promptedVariables = await context.onPromptForMissingVariables(
        template,
        resolvedVariables,
      );
      return this.applyDefaultValues(template, { ...resolvedVariables, ...promptedVariables });
    }

    return this.applyDefaultValues(template, resolvedVariables);
  }

  /**
   * Applies default values to missing variables.
   * 
   * @private
   * @param {TemplateDefinition} template - Template definition
   * @param {Record<string, any>} variables - Current variables
   * @returns {Record<string, any>} Variables with defaults applied
   */
  private applyDefaultValues(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): Record<string, any> {
    const result = { ...variables };
    for (const [key, value] of Object.entries(template.input_variables || {})) {
      if (!(key in result) && 'default' in value) {
        result[key] = value.default;
      }
    }
    return result;
  }

  /**
   * Finds variables that are required but missing.
   * 
   * @private
   * @param {TemplateDefinition} template - Template definition
   * @param {Record<string, any>} variables - Current variables
   * @returns {string[]} Names of missing variables
   */
  private findMissingVariables(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): string[] {
    const requiredVariables = Object.keys(template.input_variables || {});
    return requiredVariables.filter(
      (key) => !(key in variables) && !('default' in (template.input_variables?.[key] || {})),
    );
  }

  /**
   * Prepares the template content by resolving variables and includes.
   * 
   * @private
   * @param {TemplateDefinition & { resolved_content?: string }} template - Template definition
   * @param {Record<string, any>} variables - Resolved variables
   * @returns {Promise<string>} Prepared content
   */
  private async prepareContent(
    template: TemplateDefinition & { resolved_content?: string },
    variables: Record<string, any>,
  ): Promise<string> {
    let content = template.resolved_content || template.content;
    
    // Handle file path variables first
    for (const [key, value] of Object.entries(variables)) {
      if (key.includes('file_path')) {
        try {
          const fileContent = await this.resolveFileContent(value);
          variables[key] = fileContent;
        } catch (error) {
          this.handleExecutionError(`Failed to process file ${key}: ${error}`);
        }
      }
    }
  
    // Replace variables in content
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(
        new RegExp(`{{\\s*${key}\\s*}}`, 'g'), 
        this.formatValue(value)
      );
    }
  
    // Handle any remaining include statements
    if (findIncludeStatements(content).length > 0) {
      const currentPath = process.cwd();
      content = await resolveIncludedContent(content, currentPath);
    }
  
    return content;
  }

  /**
   * Formats a variable value for template substitution.
   * 
   * @private
   * @param {any} value - Value to format
   * @returns {string} Formatted value
   */
  private formatValue(value: any): string {
    if (Array.isArray(value)) {
        return value.join('\n');
    }
    return String(value);
  }

  /**
   * Creates chat messages from template content.
   * 
   * @private
   * @param {string} content - Template content
   * @returns {ChatMessage[]} Chat messages
   */
  private createChatMessages(content: string): ChatMessage[] {
    return [{ role: 'user', content: { type: 'text', text: content } }];
  }

  /**
   * Generates a response from the LLM provider.
   * 
   * @private
   * @param {LLMProvider} provider - LLM provider
   * @param {ChatMessage[]} messages - Chat messages
   * @param {any} providerOptions - Provider options
   * @param {boolean} stream - Whether to stream the response
   * @returns {Promise<string>} Generated response
   */
  private async generateResponse(
    provider: LLMProvider,
    messages: ChatMessage[],
    providerOptions: any,
    stream: boolean,
  ): Promise<string> {
    return stream
      ? this.handleStreamingResponse(provider, messages, providerOptions)
      : this.handleNonStreamingResponse(provider, messages, providerOptions);
  }

  /**
   * Handles non-streaming LLM response generation.
   * 
   * @private
   * @param {LLMProvider} provider - LLM provider
   * @param {ChatMessage[]} messages - Chat messages
   * @param {any} providerOptions - Provider options
   * @returns {Promise<string>} Generated response
   */
  private async handleNonStreamingResponse(
    provider: LLMProvider,
    messages: ChatMessage[],
    providerOptions: any,
  ): Promise<string> {
    const response = await provider.generateChatCompletion({ messages, options: providerOptions });
    const textResponse = response.text || '';
    return textResponse;
  }

  /**
   * Handles streaming LLM response generation.
   * 
   * @private
   * @param {LLMProvider} provider - LLM provider
   * @param {ChatMessage[]} messages - Chat messages
   * @param {any} providerOptions - Provider options
   * @returns {Promise<string>} Complete response
   */
  private async handleStreamingResponse(
    provider: LLMProvider,
    messages: ChatMessage[],
    providerOptions: any,
  ): Promise<string> {
    const chunks: string[] = [];
    this.emit('streamStart', undefined);

    try {
      const stream = await provider.streamChatCompletion({ messages, options: providerOptions });
      for await (const chunk of stream) {
        if (chunk.text) {
          this.emit('streamChunk', chunk.text);
          chunks.push(chunk.text);
        }
      }
      const fullResponse = chunks.join('');
      this.emit('streamComplete', fullResponse);
      return fullResponse;
    } catch (error) {
      if (error instanceof Error) {
        this.emit('streamError', error);
      } else {
        this.emit('streamError', new Error(String(error)));
      }
      throw error;
    } finally {
    }
  }

  /**
   * Processes output variables from the response.
   * 
   * @private
   * @param {TemplateDefinition} template - Template definition
   * @param {string} response - LLM response
   * @returns {Record<string, any>} Extracted output variables
   */
  private processOutputVariables(
    template: TemplateDefinition,
    response: string,
  ): Record<string, any> {
    if (!template.output_variables) return { qllm_response: response };
    const extractedVariables = OutputVariableExtractor.extractVariables(template, response);
    return { qllm_response: response, ...extractedVariables };
  }

  /**
   * Handles execution errors by emitting events and throwing.
   * 
   * @private
   * @param {any} error - Error to handle
   * @throws {Error} Always throws the handled error
   */
  private handleExecutionError(error: any): never {
    logger.error(`Failed to execute template: ${error}`);
    ErrorManager.throwError(
      'TemplateExecutionError',
      error instanceof Error ? error.message : String(error),
    );
  }

  /**
   * Resolves file content for file path variables.
   * 
   * @private
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} File content
   */
  private async resolveFileContent(filePath: string): Promise<string> {
    try {
      const documentLoader = new DocumentLoader(filePath, {
        encoding: 'utf-8',
        useCache: true
      });
      
      const { content } = await documentLoader.loadAsString();
      return content;
    } catch (error) {
      this.handleExecutionError(`Failed to load file: ${error}`);
    }
  }
}
