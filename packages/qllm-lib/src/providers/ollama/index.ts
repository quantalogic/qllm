import {
  BaseLLMProvider,
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  LLMOptions,
  LLMProviderError,
  Model,
  ChatMessage,
} from '../../types';
import ollama, { ModelResponse } from 'ollama';

const DEFAULT_MODEL = 'llama3.1';

export class OllamaProvider extends BaseLLMProvider {
  public readonly name = 'Ollama';

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
  };

  private formatModelDescription(model: ModelResponse): string {
    const { details, size, size_vram } = model;
    const families = details.families.join(', ');
    const sizeGB = (size / (1024 * 1024 * 1024)).toFixed(2);
    const sizeVramGB = (size_vram / (1024 * 1024 * 1024)).toFixed(2);

    return [
      `Family: ${details.family}`,
      `Related families: ${families}`,
      `Quantization level: ${details.quantization_level}`,
      `Size: ${sizeGB} GB`,
      `VRAM size: ${sizeVramGB} GB`,
    ].join(' | ');
  }

  async listModels(): Promise<Model[]> {
    try {
      const { models } = await ollama.list();

      return models.map((model: ModelResponse) => ({
        id: model.name,
        createdAt: model.modified_at,
        description: this.formatModelDescription(model),
      }));
    } catch (error) {
      this.handleError(error);
    }
  }
  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = this.formatMessages(messageWithSystem);

      const response = await ollama.chat({
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
      });

      return {
        model: options.model || DEFAULT_MODEL,
        text: response.message.content,
        refusal: null,
        finishReason: response.done_reason || 'stop',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = this.formatMessages(messageWithSystem);

      const stream = await ollama.chat({
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
        stream: true,
      });

      for await (const part of stream) {
        yield {
          text: part.message.content,
          finishReason: part.done_reason || 'stop',
          model: options.model || DEFAULT_MODEL,
        };
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  protected handleError(error: unknown): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new LLMProviderError(error.message, this.name);
    } else {
      throw new LLMProviderError(`Unknown error: ${error}`, this.name);
    }
  }

  protected withSystemMessage(options: LLMOptions, messages: ChatMessage[]): ChatMessage[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [{ role: 'system', content: { type: 'text', text: options.systemMessage } }, ...messages]
      : messages;
  }

  protected formatMessages(messages: ChatMessage[]): { role: string; content: string }[] {
    return messages.map((message) => ({
      role: message.role,
      content: Array.isArray(message.content)
        ? message.content.map((content) => (content.type === 'text' ? content.text : '')).join(' ')
        : typeof message.content === 'string'
        ? message.content
        : '',
    }));
  }
}
