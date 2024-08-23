import { EventEmitter } from 'events';
import { ExecutionContext, TemplateDefinition, OutputEvent } from './types';
import { OutputVariableExtractor } from './output-variable-extractor';
import { logger } from '../utils';
import { ErrorManager } from '../utils/error';
import { ChatMessage } from '../types';
import { TemplateValidator } from './template-validator';

export class TemplateExecutor extends EventEmitter {
  constructor(
    private onPromptForMissingVariables?: (
      template: TemplateDefinition,
      initialVariables: Record<string, any>
    ) => Promise<Record<string, any>>
  ) {
    super();
  }

  async execute(context: ExecutionContext): Promise<{
    response: string;
    outputVariables: Record<string, any>;
  }> {
    const { template, variables, providerOptions, provider, stream, spinner, onOutput } = context;
    try {
      logger.debug(`Executing template: ${JSON.stringify(template)}`);
      logger.debug(`Initial variables: ${JSON.stringify(variables)}`);

      const resolvedVariables = await this.resolveVariables(template, variables);
      TemplateValidator.validateInputVariables(template, resolvedVariables);

      const content = await this.prepareContent(template, resolvedVariables);
      const messages: ChatMessage[] = [{ role: 'user', content: { type: 'text', text: content } }];

      logger.debug(`Sending request to provider with options: ${JSON.stringify(providerOptions)}`);
      const isStream = stream || false;
      const response = await this.generateResponse(
        provider,
        messages,
        providerOptions,
        isStream,
        onOutput,
        spinner
      );

      const outputVariables = this.processOutputVariables(template, response);
      return { response, outputVariables };
    } catch (error) {
      logger.error(`Failed to execute template: ${error}`);
      ErrorManager.throwError(
        'TemplateExecutionError',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async resolveVariables(
    template: TemplateDefinition,
    initialVariables: Record<string, any>
  ): Promise<Record<string, any>> {
    return this.onPromptForMissingVariables
      ? await this.onPromptForMissingVariables(template, initialVariables)
      : initialVariables;
  }

  private async prepareContent(
    template: TemplateDefinition,
    variables: Record<string, any>
  ): Promise<string> {
    let content = template.resolved_content || template.content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, this.formatValue(value));
    }
    return content;
  }

  private formatValue(value: any): string {
    return Array.isArray(value) ? value.join('\n') : String(value);
  }

  private async generateResponse(
    provider: any,
    messages: ChatMessage[],
    providerOptions: any,
    stream: boolean,
    onOutput?: (event: OutputEvent) => void,
    spinner?: any
  ): Promise<string> {
    if (stream) {
      return this.handleStreamingResponse(provider, messages, providerOptions, onOutput, spinner);
    } else {
      const response = await provider.generateMessage(messages, providerOptions);
      onOutput?.({ type: 'complete', data: response });
      return response;
    }
  }

  private async handleStreamingResponse(
    provider: any,
    messages: ChatMessage[],
    providerOptions: any,
    onOutput?: (event: OutputEvent) => void,
    spinner?: any
  ): Promise<string> {
    const chunks: string[] = [];
    spinner?.start();
    try {
      const stream = provider.streamChatCompletion({ messages, options: providerOptions });
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          onOutput?.({ type: 'chunk', data: chunkText });
          chunks.push(chunkText);
        }
      }
      const fullResponse = chunks.join('');
      onOutput?.({ type: 'complete', data: fullResponse });
      spinner?.succeed('Response generated');
      return fullResponse;
    } catch (error) {
      spinner?.fail('Error during streaming');
      onOutput?.({ type: 'error', data: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      spinner?.stop();
    }
  }

  private processOutputVariables(
    template: TemplateDefinition,
    response: string
  ): Record<string, any> {
    if (!template.output_variables) {
      return { qllm_response: response };
    }

    const extractor = new OutputVariableExtractor(template);
    return {
      qllm_response: response,
      ...extractor.extractVariables(response),
    };
  }
}