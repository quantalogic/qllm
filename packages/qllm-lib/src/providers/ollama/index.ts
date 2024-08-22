import {
  BaseLLMProvider,
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  LLMOptions,
  LLMProviderError,
  Model,
  ChatMessage,
  isTextContent,
  isImageUrlContent,
  MessageContent,
} from '../../types';
import ollama, { ModelResponse, ChatRequest, ChatResponse } from 'ollama';
import { createImageContent, createTextMessageContent } from '../../utils/images';

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
      const formattedMessages = await this.formatMessages(messageWithSystem);

      const chatRequest: ChatRequest & { stream: false } = {
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
        stream: false,
      };

      const response = await ollama.chat(chatRequest);

      return {
        model: options.model || DEFAULT_MODEL,
        text: response.message.content,
        refusal: null,
        finishReason: response.done ? 'stop' : null,
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
      const formattedMessages = await this.formatMessages(messageWithSystem);

      const chatRequest: ChatRequest & { stream: true } = {
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
        stream: true,
      };

      const stream = await ollama.chat(chatRequest);

      for await (const part of stream) {
        yield {
          text: part.message.content,
          finishReason: part.done ? 'stop' : null,
          model: options.model || DEFAULT_MODEL,
        };
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async formatMessages(
    messages: ChatMessage[],
  ): Promise<{ role: string; content: string; images?: string[] }[]> {
    const formattedMessages: { role: string; content: string; images?: string[] }[] = [];

    for (const message of messages) {
      const messageContentArray: MessageContent[] = Array.isArray(message.content)
        ? message.content
        : [message.content];
      for (const messageContent of messageContentArray) {
        {
          if (isTextContent(messageContent)) {
            formattedMessages.push({ role: message.role, content: messageContent.text });
          } else if (isImageUrlContent(messageContent)) {
            formattedMessages.push({ role: message.role, content: messageContent.imageUrl.url });
          }
        }
      }
    }
    return formattedMessages;
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
    if (options.systemMessage && options.systemMessage.length > 0) {
      const systemMessage: ChatMessage = {
        role: 'system',
        content: createTextMessageContent(options.systemMessage),
      };
      return [systemMessage, ...messages];
    }
    return messages;
  }
}
