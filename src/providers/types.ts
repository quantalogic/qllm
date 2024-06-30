// Message roles
export type MessageRole = 'user' | 'assistant' | 'system';

// Message structure
export interface Message {
  role: MessageRole;
  content: string;
}

// LLM Provider options
export interface LLMProviderOptions {
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  system?: string;
  model: string;
}
// Output format options
export type OutputFormat = 'json' | 'markdown' | 'text';

// Provider configuration
export interface ProviderConfig {
  type: string;
  region?: string;
  apiKey?: string;
}

// CLI command options
export interface CommandOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  system?: string;
  file?: string;
  output?: string;
  format?: OutputFormat;
  model?: string;
  modelid?: string;
}

// LLM response structure
export interface LLMResponse {
  content: Array<{
    text: string;
  }>;
}

// Error types
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
  finalMessage(): Promise<LLMResponse>;
}
