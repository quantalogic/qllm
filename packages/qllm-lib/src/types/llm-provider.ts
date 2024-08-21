import { ChatCompletionResponse, ChatMessage,  ChatStreamCompletionResponse,  LLMOptions } from './llm-types';

// Unified Input Type
export type EmbeddingRequestParams = {
  model: string;
  content: string;
};

export type Model = {
  id: string;
  description?: string;
  created?: Date;
};

export type ChatCompletionParams = {
  messages: ChatMessage[];
  options: LLMOptions;
};

export interface EmbeddingProvider {
  version: string;
  generateEmbedding(input: EmbeddingRequestParams): Promise<number[]>;
  listModels(): Promise<Model[]>;
}

// LLM Provider Interface
export interface LLMProvider {
  version: string; // Version of the provider
  name: string; // Name of the provider
  defaultOptions: LLMOptions; // Default options for the provider
  listModels(): Promise<Model[]>; // Optional method to list available models
  generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  streamChatCompletion(params: ChatCompletionParams): AsyncIterableIterator<ChatStreamCompletionResponse>;
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
  abstract streamChatCompletion(params: ChatCompletionParams): AsyncIterableIterator<ChatStreamCompletionResponse>;


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
            content: { type: 'text', data: { text: options.systemMessage } },
          },
          ...messages,
        ]
      : messages;
  }
}

export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  public version = '1.0.0'; // Default version
  public abstract name: string;

  abstract generateEmbedding(input: EmbeddingRequestParams): Promise<number[]>;
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

