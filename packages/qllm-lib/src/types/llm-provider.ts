import fs from 'fs/promises';

import {
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  ChatMessage,
  EmbeddingRequestParams,
  EmbeddingResponse,
  LLMOptions,
  Model,
  ChatMessageContent,
} from './llm-types';
import axios from 'axios';

export interface EmbeddingProvider {
  version: string;
  generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse>;
  listModels(): Promise<Model[]>;
}

// LLM Provider Interface
export interface LLMProvider {
  version: string; // Version of the provider
  name: string; // Name of the provider
  defaultOptions: LLMOptions; // Default options for the provider
  listModels(): Promise<Model[]>; // Optional method to list available models
  generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse>;
}

// Error Handling Classes
export class LLMProviderError extends Error {
  constructor(message: string, public providerName: string, public errorCode?: string) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

export class AuthenticationError extends LLMProviderError {}
export class RateLimitError extends LLMProviderError {}
export class InvalidRequestError extends LLMProviderError {}

// Base LLM Provider Class
export abstract class BaseLLMProvider implements LLMProvider {
  public supportsEmbedding = false;
  public supportsImageAnalysis = false;
  public version = '1.0.0'; // Default version
  public abstract name: string;

  abstract listModels(): Promise<Model[]>;

  abstract defaultOptions: LLMOptions;

  abstract generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  abstract streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse>;

  protected handleError(error: unknown): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new InvalidRequestError(error.message, this.constructor.name);
    } else {
      throw new InvalidRequestError(`Unknown error: ${error}`, this.constructor.name);
    }
  }

  protected withSystemMessage(options: LLMOptions, messages: ChatMessage[]): ChatMessage[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [
          {
            role: 'system',
            content: { type: 'text', text: options.systemMessage },
          },
          ...messages,
        ]
      : messages;
  }
}

export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  public version = '1.0.0'; // Default version
  public abstract name: string;

  abstract generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse>;
  abstract listModels(): Promise<Model[]>;

  protected handleError(error: unknown): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new InvalidRequestError(error.message, this.constructor.name);
    } else {
      throw new InvalidRequestError(`Unknown error: ${error}`, this.constructor.name);
    }
  }
}

export const createTextMessageContent = (content: string | string[]): ChatMessageContent => {
  if (Array.isArray(content)) {
    return content.map((text) => ({ type: 'text', text }));
  } else {
    return { type: 'text', text: content };
  }
};
export const createImageMessageContent = async (source: string): Promise<ChatMessageContent> => {
  try {
    let content: string;
    let mimeType: string;

    if (isUrl(source)) {
      // Handle URL
      const response = await axios.get(source, { responseType: 'arraybuffer' });
      content = Buffer.from(response.data, 'binary').toString('base64');
      mimeType = response.headers['content-type'];
    } else {
      // Handle local file path
      content = await fs.readFile(source, { encoding: 'base64' });
      mimeType = getMimeType(source);
    }

    const imageUrl = `data:${mimeType};base64,${content}`;

    return {
      type: 'image_url',
      imageUrl: {
        url: imageUrl,
      },
    };
  } catch (error) {
    console.error(`Error processing image from: ${source}`, error);
    throw error;
  }
};

// Helper function to determine if the source is a URL
function isUrl(source: string): boolean {
  try {
    new URL(source);
    return true;
  } catch {
    return false;
  }
}

// Helper function to determine MIME type based on file extension
function getMimeType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}
