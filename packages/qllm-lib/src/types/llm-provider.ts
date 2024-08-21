import { ChatMessage, ChatMessageRole, LLMOptions } from './llm-types';

// Unified Input Type
export type InputType = {
  content: string | Buffer | URL; // The content to be processed
  type: 'text' | 'image'; // Type of content
};

export type Model = {
  id: string;
  description?: string;
};

// LLM Provider Interface
export interface LLMProvider {
  supportsEmbedding: boolean; // Indicates if the provider supports embeddings
  supportsImageAnalysis: boolean; // Indicates if the provider supports image analysis
  version: string; // Version of the provider
  name: string; // Name of the provider
  generateEmbedding?(input: InputType): Promise<number[]>; // Optional embedding method
  listModels(): Promise<Model[]>; // Optional method to list available models
  generateChatCompletion(messages: ChatMessage[], options: LLMOptions): Promise<string>;
  streamChatCompletion(messages: ChatMessage[], options: LLMOptions): AsyncIterableIterator<string>;
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

  abstract generateChatCompletion(messages: ChatMessage[], options: LLMOptions): Promise<string>;
  abstract streamChatCompletion(
    messages: ChatMessage[],
    options: LLMOptions,
  ): AsyncIterableIterator<string>;

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
            role: ChatMessageRole.SYSTEM,
            content: { type: 'text', data: { text: options.systemMessage } },
          },
          ...messages,
        ]
      : messages;
  }
}
