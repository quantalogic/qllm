import {
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  ChatMessage,
  EmbeddingRequestParams,
  EmbeddingResponse,
  LLMOptions,
  Model,
} from './llm-types';

export interface AIProvider {
  readonly name: string;
  readonly version: string;
  listModels(): Promise<Model[]>;
}

export interface EmbeddingProvider extends AIProvider {
  generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse>;
  listModels(): Promise<Model[]>;
}

// LLM Provider Interface
export interface LLMProvider extends AIProvider {
  defaultOptions: LLMOptions; // Default options for the provider
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
