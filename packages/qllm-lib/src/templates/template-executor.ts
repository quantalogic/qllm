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
import { createLLMProvider, getLLMProvider } from '..';
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
    logger.info(`Starting template execution for template: ${template.name || 'unnamed'}`);
    logger.debug(`Execution parameters - Stream: ${stream}, Provider Options:`, providerOptions);
    
    this.emit('executionStart', { template, variables });

    const executionProvider =
      provider || (providerOptions.model && await getLLMProvider(providerOptions.model));

    if (!executionProvider) {
      logger.error('LLMProvider not provided and could not be created from model name');
      this.handleExecutionError('LLMProvider not provided');
    }

    logger.info(`Using provider: ${executionProvider.constructor.name}`);

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
      logger.info('Resolving and validating variables...');
      const resolvedVariables = await this.resolveAndValidateVariables(
        context,
        template,
        variables,
      );
      logger.debug('Variables resolved successfully:', resolvedVariables);
      this.emit('variablesResolved', resolvedVariables);

      logger.info('Preparing content...');
      const content = await this.prepareContent(template, resolvedVariables);
      logger.debug(`Content prepared, length: ${content.length} characters`);

      let resolvedContent = content;

      if (findIncludeStatements(content).length > 0) {
        logger.info('Processing include statements...');
        const currentPath = process.cwd();
        logger.debug(`Resolving includes from path: ${currentPath}`);
        const contentWithMissingInclude = await resolveIncludedContent(content, currentPath);
        resolvedContent = contentWithMissingInclude;
        logger.debug(`Include statements resolved, new content length: ${resolvedContent.length}`);
      }

      this.emit('contentPrepared', resolvedContent);

      logger.info('Creating chat messages...');
      const messages = this.createChatMessages(resolvedContent);
      logger.debug(`Created ${messages.length} chat messages`);
      this.emit('requestSent', { messages, providerOptions });

      logger.info(`Generating response (stream: ${stream})...`);
      const response = await this.generateResponse(
        provider!,
        messages,
        providerOptions,
        stream || false,
      );
      logger.debug(`Response generated, length: ${response.length} characters`);
      this.emit('responseReceived', response);

      logger.info('Processing output variables...');
      const outputVariables = this.processOutputVariables(template, response);
      logger.debug('Output variables processed:', outputVariables);
      this.emit('outputVariablesProcessed', outputVariables);

      logger.info('Template execution completed successfully');
      this.emit('executionComplete', { response, outputVariables });
      return { response, outputVariables };
    } catch (error) {
      logger.error('Template execution failed:', error);
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
    logger.debug('Starting variable resolution and validation');
    const resolvedVariables = await this.resolveVariables(context, template, initialVariables);
    logger.debug('Variables resolved, validating...');
    TemplateValidator.validateInputVariables(template, resolvedVariables);
    logger.debug('Variables validated successfully');
    return resolvedVariables;
  }

  private async resolveVariables(
    context: ExecutionContext,
    template: TemplateDefinition,
    initialVariables: Record<string, any>,
): Promise<Record<string, any>> {
    logger.debug('Resolving variables...');
    const resolvedVariables = { ...initialVariables };

    // Handle file path variables first
    for (const [key, value] of Object.entries(initialVariables)) {
        const varDef = template.input_variables?.[key];
        if (!varDef) {
            logger.debug(`Skipping undefined variable: ${key}`);
            continue;
        }

        if (varDef.type === 'file_path' || varDef.type === 'files_path') {
            logger.info(`Processing file path variable: ${key}`);
            try {
                if (Array.isArray(value) && varDef.type === 'files_path') {
                    logger.debug(`Processing multiple files for ${key}`);
                    const contents = await Promise.all(value.map(async (filePath) => {
                      logger.debug(`Loading file: ${filePath}`);
                      const defaultRegistry = new DefaultParserRegistry();
                        const loader = new DocumentLoader(filePath,defaultRegistry,{
                            encoding: 'utf-8',
                            useCache: true
                        });
                        const { content,parsedContent } = await loader.loadAsString();
                        logger.debug(`File loaded successfully: ${filePath}`);
                        return parsedContent || content;
                    }));
                    resolvedVariables[key] = contents.join('\n\n');
                    varDef["type"] = "string";
                    logger.debug(`Multiple files processed for ${key}`);
                } else if (typeof value === 'string' && varDef.type === 'file_path') {
                    logger.debug(`Processing single file: ${value}`);
                    const defaultRegistry = new DefaultParserRegistry();
                    const loader = new DocumentLoader(value,defaultRegistry, {
                        encoding: 'utf-8',
                        useCache: true
                    });
                    const { content,parsedContent } = await loader.loadAsString();
                    resolvedVariables[key] = parsedContent || content;
                    varDef["type"] = "string";
                    logger.debug(`Single file processed for ${key}`);
                }
            } catch (error) {
                logger.error(`Failed to process file ${key}:`, error);
                this.handleExecutionError(`Failed to process file ${key}: ${error}`);
            }
        }
    }

    if (!context.onPromptForMissingVariables) {
        logger.debug('No missing variable prompt handler, applying defaults');
        return this.applyDefaultValues(template, resolvedVariables);
    }
    
    const missingVariables = this.findMissingVariables(template, resolvedVariables);
    if (missingVariables.length > 0) {
        logger.info(`Found ${missingVariables.length} missing variables:`, missingVariables);
        const promptedVariables = await context.onPromptForMissingVariables(
            template,
            resolvedVariables,
        );
        logger.debug('Prompted variables resolved:', promptedVariables);
        return this.applyDefaultValues(template, { ...resolvedVariables, ...promptedVariables });
    }

    logger.debug('All variables resolved successfully');
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
    logger.debug('Starting content preparation');
    let content = template.resolved_content || template.content;
    logger.debug(`Initial content length: ${content.length}`);
    
    // Handle file path variables first
    for (const [key, value] of Object.entries(variables)) {
      if (key.includes('file_path')) {
        logger.info(`Processing file path variable in content: ${key}`);
        try {
          const fileContent = await this.resolveFileContent(value);
          variables[key] = fileContent;
          logger.debug(`File content resolved for ${key}`);
        } catch (error) {
          logger.error(`Failed to process file ${key}:`, error);
          this.handleExecutionError(`Failed to process file ${key}: ${error}`);
        }
      }
    }
  
    // Replace variables in content
    logger.debug('Replacing variables in content...');
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const matches = content.match(regex);
      if (matches) {
        logger.debug(`Replacing ${matches.length} occurrences of ${key}`);
        content = content.replace(regex, this.formatValue(value));
      }
    }
  
    // Handle any remaining include statements
    const includeStatements = findIncludeStatements(content);
    if (includeStatements.length > 0) {
      logger.info(`Processing ${includeStatements.length} include statements`);
      const currentPath = process.cwd();
      logger.debug(`Resolving includes from path: ${currentPath}`);
      content = await resolveIncludedContent(content, currentPath);
      logger.debug('Include statements resolved');
    }
  
    logger.debug(`Final content prepared, length: ${content.length}`);
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
    logger.info('Starting streaming response...');
    this.emit('streamStart', undefined);

    try {
      logger.debug('Requesting streaming completion...');
      const stream = await provider.streamChatCompletion({ messages, options: providerOptions });
      for await (const chunk of stream) {
        if (chunk.text) {
          logger.debug(`Received chunk, length: ${chunk.text.length}`);
          this.emit('streamChunk', chunk.text);
          chunks.push(chunk.text);
        }
      }
      const fullResponse = chunks.join('');
      logger.info(`Streaming completed, total length: ${fullResponse.length}`);
      this.emit('streamComplete', fullResponse);
      return fullResponse;
    } catch (error) {
      logger.error('Error in streaming response:', error);
      if (error instanceof Error) {
        this.emit('streamError', error);
      } else {
        this.emit('streamError', new Error(String(error)));
      }
      throw error;
    }
  }

  private processOutputVariables(
    template: TemplateDefinition,
    response: string,
  ): Record<string, any> {
    logger.debug('Processing output variables...');
    
    // If no output variables defined, return the entire response
    if (!template.output_variables) {
      logger.debug('No output variables defined, returning full response');
      return { qllm_response: response };
    }

    try {
      logger.debug('Attempting to extract variables using OutputVariableExtractor');
      // Try to extract variables using OutputVariableExtractor
      const extractedVariables = OutputVariableExtractor.extractVariables(template, response);
      logger.debug('Variables extracted successfully:', extractedVariables);
      return { qllm_response: response, ...extractedVariables };
    } catch (error) {
      logger.warn('Variable extraction failed, falling back to individual processing:', error);
      // If extraction fails, handle each output variable individually
      const result: Record<string, any> = { qllm_response: response };
      
      // For each defined output variable, try to extract it or use the entire response
      for (const [key, variable] of Object.entries(template.output_variables)) {
        if (key in result) {
          logger.debug(`Skipping already processed variable: ${key}`);
          continue;
        }
        
        // If this is the only output variable and extraction failed, use the entire response
        if (Object.keys(template.output_variables).length === 1) {
          logger.debug(`Using full response for single output variable: ${key}`);
          result[key] = this.transformValue(response.trim(), variable.type);
        } else if ('default' in variable) {
          logger.debug(`Using default value for variable: ${key}`);
          result[key] = variable.default;
        }
      }
      
      logger.debug('Fallback processing completed:', result);
      return result;
    }
  }

  private transformValue(value: string, type: string): any {
    try {
      switch (type) {
        case 'string':
          return value;
        case 'integer':
          return parseInt(value, 10);
        case 'float':
          return parseFloat(value);
        case 'boolean':
          return value.toLowerCase() === 'true';
        case 'array':
        case 'object':
          return JSON.parse(value);
        default:
          return value;
      }
    } catch {
      return value;
    }
  }

  private handleExecutionError(error: any): never {
    logger.error('Template execution error:', error);
    logger.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    ErrorManager.throwError(
      'TemplateExecutionError',
      error instanceof Error ? error.message : String(error),
    );
  }

  private async resolveFileContent(filePath: string): Promise<string> {
    logger.debug(`Resolving file content for: ${filePath}`);
    try {
      const defaultRegistry = new DefaultParserRegistry();
      const documentLoader = new DocumentLoader(filePath,defaultRegistry, {
        encoding: 'utf-8',
        useCache: true
      });
      
      logger.debug('Loading file content...');
      const { content, parsedContent } = await documentLoader.loadAsString();
      logger.debug(`File loaded successfully, content length: ${(parsedContent || content).length}`);
      return parsedContent || content;
    } catch (error) {
      logger.error(`Failed to load file ${filePath}:`, error);
      this.handleExecutionError(`Failed to load file: ${error}`);
    }
  }
}
