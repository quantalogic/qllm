import { ChatCompletionResponse, ChatMessage, ChatMessageRole, LLMOptions } from './llm-types';

// Unified Input Type
export type InputType = {
  content: string | Buffer | URL; // The content to be processed
  type: 'text' | 'image'; // Type of content
  model?: string; // Model to use for processing
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

// LLM Provider Interface
export interface LLMProvider {
  version: string; // Version of the provider
  name: string; // Name of the provider
  defaultOptions: LLMOptions; // Default options for the provider
  generateEmbedding?(input: InputType): Promise<number[]>; // Optional embedding method
  listModels(): Promise<Model[]>; // Optional method to list available models
  generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  streamChatCompletion(params: ChatCompletionParams): AsyncIterableIterator<string>;
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
  abstract streamChatCompletion(params: ChatCompletionParams): AsyncIterableIterator<string>;

  // Default implementation for generateEmbedding
  async generateEmbedding(_input: InputType): Promise<number[]> {
    throw new Error('Embedding not supported by this provider.');
  }

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
