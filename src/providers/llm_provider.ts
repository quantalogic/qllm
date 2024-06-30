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

// Stream event types
export interface StreamTextEvent {
  type: 'text';
  text: string;
}

export interface StreamErrorEvent {
  type: 'error';
  error: Error;
}

export interface StreamEndEvent {
  type: 'end';
}

export type StreamEvent = StreamTextEvent | StreamErrorEvent | StreamEndEvent;

// Async iterable for streaming responses
export interface AsyncResponseStream extends AsyncIterable<string> {
  on(event: 'text', listener: (text: string) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'end', listener: () => void): this;
  finalMessage(): Promise<string>;
}