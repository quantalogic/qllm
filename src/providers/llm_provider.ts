import { Message } from './types';

export interface LLMProviderOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  system?: string;
  model?: string;
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
