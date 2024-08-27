import { EventEmitter } from 'events';
import { ExecutionContext, TemplateDefinition, OutputEvent } from './types';
import { OutputVariableExtractor } from './output-variable-extractor';
import { logger } from '../utils';
import { ErrorManager } from '../utils/error';
import { TemplateValidator } from './template-validator';
import {
  ChunkOutputEvent,
  CompleteOutputEvent,
  ErrorOutputEvent,
  StartOutputEvent,
  StopOutputEvent,
} from './types';
import { ChatMessage, LLMProvider } from '../types';

export class TemplateExecutor extends EventEmitter {
  constructor() {
    super();
  }

  async execute(
    context: ExecutionContext,
  ): Promise<{ response: string; outputVariables: Record<string, any> }> {
    const { template, variables, providerOptions, provider, stream, spinner, onOutput } = context;

    try {
      this.logDebugInfo(template, variables);

      const resolvedVariables = await this.resolveAndValidateVariables(
        context,
        template,
        variables,
      );
      const content = await this.prepareContent(template, resolvedVariables);
      const messages = this.createChatMessages(content);

      logger.debug(`Sending request to provider with options: ${JSON.stringify(providerOptions)}`);

      const response = await this.generateResponse(
        provider,
        messages,
        providerOptions,
        stream || false,
        onOutput,
        spinner,
      );
      const outputVariables = this.processOutputVariables(template, response);

      return { response, outputVariables };
    } catch (error) {
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
    if (!context.onPromptForMissingVariables) return initialVariables;

    const missingVariables = this.findMissingVariables(template, initialVariables);
    return missingVariables.length > 0
      ? await context.onPromptForMissingVariables(template, initialVariables)
      : initialVariables;
  }

  private findMissingVariables(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): string[] {
    const requiredVariables = Object.keys(template.input_variables || {});
    return requiredVariables.filter((key) => !(key in variables));
  }

  private async prepareContent(
    template: TemplateDefinition,
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
    onOutput?: (event: OutputEvent) => void,
    spinner?: any,
  ): Promise<string> {
    return stream
      ? this.handleStreamingResponse(provider, messages, providerOptions, onOutput, spinner)
      : this.handleNonStreamingResponse(provider, messages, providerOptions, onOutput);
  }

  private async handleNonStreamingResponse(
    provider: LLMProvider,
    messages: ChatMessage[],
    providerOptions: any,
    onOutput?: (event: OutputEvent) => void,
  ): Promise<string> {
    const response = await provider.generateChatCompletion({ messages, options: providerOptions });
    const textResponse = response.text || '';
    onOutput?.(new CompleteOutputEvent(textResponse));
    return textResponse;
  }

  private async handleStreamingResponse(
    provider: any,
    messages: ChatMessage[],
    providerOptions: any,
    onOutput?: (event: OutputEvent) => void,
    spinner?: any,
  ): Promise<string> {
    const chunks: string[] = [];
    spinner?.start();
    onOutput?.(new StartOutputEvent());

    try {
      const stream = await provider.streamChatCompletion({ messages, options: providerOptions });
      for await (const chunk of stream) {
        if (chunk.text) {
          onOutput?.(new ChunkOutputEvent(chunk.text));
          chunks.push(chunk.text);
        }
      }
      const fullResponse = chunks.join('');
      onOutput?.(new CompleteOutputEvent(fullResponse));
      spinner?.succeed('Response generated');
      return fullResponse;
    } catch (error) {
      this.handleStreamingError(error, onOutput, spinner);
      throw error;
    } finally {
      this.finalizeStreaming(onOutput, spinner);
    }
  }

  private handleStreamingError(
    error: any,
    onOutput?: (event: OutputEvent) => void,
    spinner?: any,
  ): void {
    spinner?.fail('Error during streaming');
    onOutput?.(
      new ErrorOutputEvent(
        error instanceof Error ? error : new Error(String(error)),
        'Error during streaming',
      ),
    );
  }

  private finalizeStreaming(onOutput?: (event: OutputEvent) => void, spinner?: any): void {
    spinner?.stop();
    onOutput?.(new StopOutputEvent());
  }

  private processOutputVariables(
    template: TemplateDefinition,
    response: string,
  ): Record<string, any> {
    if (!template.output_variables) return { qllm_response: response };

    const extractor = new OutputVariableExtractor(template);
    return { qllm_response: response, ...extractor.extractVariables(response) };
  }

  private handleExecutionError(error: any): never {
    logger.error(`Failed to execute template: ${error}`);
    ErrorManager.throwError(
      'TemplateExecutionError',
      error instanceof Error ? error.message : String(error),
    );
  }
}
