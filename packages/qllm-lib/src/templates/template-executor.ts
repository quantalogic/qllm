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
        console.debug('Resolved content with missing includes:');
        console.debug(contentWithMissingInclude);
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
    if (!context.onPromptForMissingVariables)
      return this.applyDefaultValues(template, initialVariables);

    const missingVariables = this.findMissingVariables(template, initialVariables);
    if (missingVariables.length > 0) {
      const promptedVariables = await context.onPromptForMissingVariables(
        template,
        initialVariables,
      );
      return this.applyDefaultValues(template, { ...initialVariables, ...promptedVariables });
    }
    return this.applyDefaultValues(template, initialVariables);
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
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), this.formatValue(value));
    }
    return content;
  }

  private formatValue(value: any): string {
    return Array.isArray(value) ? value.join('\n') : String(value);
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
}
