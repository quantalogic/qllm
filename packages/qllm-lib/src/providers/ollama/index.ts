import fs from 'fs/promises';
import path from 'path';
import axios from "axios";
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
  ImageUrlContent,
} from '../../types';
import ollama, { ModelResponse, ChatRequest, ChatResponse } from 'ollama';
import {  createTextMessageContent } from '../../utils/images';


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
      
      let content = '';
      const images: string[] = [];
  
      for (const messageContent of messageContentArray) {
        if (isTextContent(messageContent)) {
          content += messageContent.text + '\n';
        } else if (isImageUrlContent(messageContent)) {
          try {
            const imageContent = await createOllamaImageContent(messageContent.imageUrl.url);
            images.push(imageContent.imageUrl.url);
          } catch (error) {
            console.error('Error processing image:', error);
          }
        }
      }
  
      formattedMessages.push({ 
        role: message.role, 
        content: content.trim(),
        ...(images.length > 0 && { images })
      });
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

export const createOllamaImageContent = async (source: string): Promise<ImageUrlContent> => {
    try {
      let content: string;
  
      if (source.startsWith('http://') || source.startsWith('https://')) {
        // Handle URL
        const response = await axios.get(source, { responseType: 'arraybuffer' });
        content = Buffer.from(response.data).toString('base64');
      } else {
        // Handle local file path
        const absolutePath = path.resolve(source);
        content = await fs.readFile(absolutePath, { encoding: 'base64' });
      }
  
      // Return the raw base64 string without the data URL prefix
      return {
        type: 'image_url',
        imageUrl: {
          url: content,
        },
      };
    } catch (error) {
      console.error(`Error processing image from: ${source}`, error);
      throw error;
    }
  };
