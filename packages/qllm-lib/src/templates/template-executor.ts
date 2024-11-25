/**
 * @fileoverview Template Executor for QLLM Library
 * 
 * This module provides the core execution engine for QLLM templates, implementing
 * a robust event-driven architecture for template processing. It handles the complete
 * execution lifecycle including:
 * 
 * - Template validation and preprocessing
 * - Variable resolution and validation
 * - File inclusion and content resolution
 * - LLM provider interaction
 * - Response streaming and processing
 * - Output variable extraction
 * 
 * The executor emits events at each stage of processing, allowing for detailed
 * monitoring and debugging of template execution.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * @since 2023
 * 
 * @example
 * ```typescript
 * // Create an executor instance
 * const executor = new TemplateExecutor();
 * 
 * // Listen for execution events
 * executor.on('executionStart', ({ template, variables }) => {
 *   console.log('Starting execution with variables:', variables);
 * });
 * 
 * executor.on('executionComplete', ({ response, outputVariables }) => {
 *   console.log('Execution completed:', response);
 *   console.log('Extracted variables:', outputVariables);
 * });
 * 
 * // Execute a template with variables
 * const result = await executor.execute({
 *   template: {
 *     name: 'greeting',
 *     content: 'Generate a greeting for {{name}}',
 *     variables: [{ name: 'name', type: 'string', required: true }]
 *   },
 *   variables: { name: 'Alice' },
 *   stream: true // Enable streaming response
 * });
 * ```
 * 
 * @see {@link TemplateManager} for template management
 * @see {@link OutputVariableExtractor} for output processing
 * @see {@link TemplateValidator} for validation logic
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
import { DefaultParserRegistry } from '../utils/document/parsers/parser-registry';
import path from 'path';


interface TemplateExecutorEvents {
  executionStart: { template: TemplateDefinition; variables: Record<string, any> };
  variablesResolved: Record<string, any>;
  contentPrepared: string;
  requestSent: { messages: ChatMessage[]; providerOptions: any };
  responseReceived: string;
  streamStart: void;
  streamChunk: string;
  streamComplete: string;
  streamError: Error;
  outputVariablesProcessed: Record<string, any>;
  executionComplete: { response: string; outputVariables: Record<string, any> };
  executionError: Error;
}

export class TemplateExecutor extends EventEmitter {
  constructor() {
    super();
  }

  on<K extends keyof TemplateExecutorEvents>(
    eventName: K,
    listener: (arg: TemplateExecutorEvents[K]) => void,
  ): this {
    return super.on(eventName, listener);
  }

  emit<K extends keyof TemplateExecutorEvents>(
    eventName: K,
    arg: TemplateExecutorEvents[K],
  ): boolean {
    return super.emit(eventName, arg);
  }

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

  private logDebugInfo(template: TemplateDefinition, variables: Record<string, any>): void {
    logger.debug(`Executing template: ${JSON.stringify(template)}`);
    logger.debug(`Initial variables: ${JSON.stringify(variables)}`);
  }

  private async resolveAndValidateVariables(
    context: ExecutionContext,
    template: TemplateDefinition,
    initialVariables: Record<string, any>,
  ): Promise<Record<string, any>> {
    const resolvedVariables = await this.resolveVariables(context, template, initialVariables);
    TemplateValidator.validateInputVariables(template, resolvedVariables);
    return resolvedVariables;
  }

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
                      const defaultRegistry = new DefaultParserRegistry();
                        const loader = new DocumentLoader(filePath,defaultRegistry,{
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
                    const defaultRegistry = new DefaultParserRegistry();
                    const loader = new DocumentLoader(value,defaultRegistry, {
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

  private findMissingVariables(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): string[] {
    const requiredVariables = Object.keys(template.input_variables || {});
    return requiredVariables.filter(
      (key) => !(key in variables) && !('default' in (template.input_variables?.[key] || {})),
    );
  }

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

  
  private formatValue(value: any): string {
    if (Array.isArray(value)) {
        return value.join('\n');
    }
    return String(value);
  }

  private createChatMessages(content: string): ChatMessage[] {
    return [{ role: 'user', content: { type: 'text', text: content } }];
  }

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

  private async handleNonStreamingResponse(
    provider: LLMProvider,
    messages: ChatMessage[],
    providerOptions: any,
  ): Promise<string> {
    const response = await provider.generateChatCompletion({ messages, options: providerOptions });
    const textResponse = response.text || '';
    return textResponse;
  }

  private async handleStreamingResponse(
    provider: any,
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

  private processOutputVariables(
    template: TemplateDefinition,
    response: string,
  ): Record<string, any> {
    if (!template.output_variables) return { qllm_response: response };
    const extractedVariables = OutputVariableExtractor.extractVariables(template, response);
    return { qllm_response: response, ...extractedVariables };
  }

  private handleExecutionError(error: any): never {
    logger.error(`Failed to execute template: ${error}`);
    ErrorManager.throwError(
      'TemplateExecutionError',
      error instanceof Error ? error.message : String(error),
    );
  }

  private async resolveFileContent(filePath: string): Promise<string> {
    try {
      const defaultRegistry = new DefaultParserRegistry();
      const documentLoader = new DocumentLoader(filePath,defaultRegistry, {
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
