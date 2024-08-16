import { Message } from './types';

export interface LLMProviderOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  system?: string;
  model: string;
  awsRegion?: string;
  awsProfile?: string;
}

export interface LLMProvider {
  generateMessage: (messages: Message[], options: LLMProviderOptions) => Promise<string>;
  streamMessage: (messages: Message[], options: LLMProviderOptions) => AsyncIterableIterator<string>;
}

export class LLMProviderError extends Error {
  constructor(message: string, public providerName: string) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

export class AuthenticationError extends LLMProviderError {}
export class RateLimitError extends LLMProviderError {}
export class InvalidRequestError extends LLMProviderError {}

export abstract class BaseLLMProvider implements LLMProvider {
  constructor(protected options: LLMProviderOptions) {}

  abstract generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string>;
  abstract streamMessage(messages: Message[], options: LLMProviderOptions): AsyncIterableIterator<string>;

  protected handleError(error: any): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new InvalidRequestError(error.message, this.constructor.name);
    } else {
      throw new InvalidRequestError(`Unknown error: ${error}`, this.constructor.name);
    }
  }

  protected withSystemMessage(options: LLMProviderOptions, messages: Message[]): Message[] {
    return options.system && options.system.length > 0
      ? [{ role: 'system', content: options.system }, ...messages]
      : messages;
  }
}