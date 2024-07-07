// src/config/types.ts

/** 
 * Represents a model alias and its corresponding model ID.
 */
export interface ModelAlias {
  /** The alias name for the model */
  alias: string;
  /** The actual model ID */
  modelId: string;
}

/** 
 * Configuration for a specific LLM provider.
 */
export interface ProviderConfig {
  /** The name of the provider */
  name: string;
  /** Array of model aliases supported by this provider */
  models: ModelAlias[];
  /** The default model alias for this provider */
  defaultModel: string;
}

/** 
 * Supported LLM provider names.
 */
export type ProviderName = 'anthropic' | 'openai' | 'ollama';

/** 
 * Application configuration interface.
 */
export interface AppConfig {
  [x: string]: any;
  /** AWS profile to use */
  awsProfile: string;
  /** AWS region to use */
  awsRegion: string;
  /** Default LLM provider */
  defaultProvider: ProviderName;
  /** Model alias to use */
  defaultModelAlias?: string;
  /** Specific model ID to use */
  defaultModelId?: string;
  /** Prompt directory */
  promptDirectory: string;
  /** Configuration file path */
  configFile?: string;
  /** Log level */
  logLevel: string;
  /** Default maximum tokens */
  defaultMaxTokens: number;
  /** Default model alias */
  defaultModel: string;

}

/** 
 * CLI command options interface.
 */
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
  stream?: boolean;
  provider?: ProviderName;

}

/** 
 * Output format options for responses.
 */
export type OutputFormat = 'json' | 'markdown' | 'text' | 'xml';

/** 
 * Message roles in conversations.
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/** 
 * Structure of a message in a conversation.
 */
export interface Message {
  role: MessageRole;
  content: string;
}

/** 
 * LLM response structure.
 */
export interface LLMResponse {
  content: Array<{ text: string; }>;
}

/** 
 * Base error class for LLM providers.
 */
export class LLMProviderError extends Error {
  constructor(message: string, public providerName: string) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

/** 
 * Error class for authentication issues.
 */
export class AuthenticationError extends LLMProviderError {}

/** 
 * Error class for rate limit issues.
 */
export class RateLimitError extends LLMProviderError {}

/** 
 * Error class for invalid request issues.
 */
export class InvalidRequestError extends LLMProviderError {}

/** 
 * Stream event for text content.
 */
export interface StreamTextEvent {
  type: 'text';
  text: string;
}

/** 
 * Stream event for errors.
 */
export interface StreamErrorEvent {
  type: 'error';
  error: Error;
}

/** 
 * Stream event for end of stream.
 */
export interface StreamEndEvent {
  type: 'end';
}

/** 
 * Union type for all stream events.
 */
export type StreamEvent = StreamTextEvent | StreamErrorEvent | StreamEndEvent;

/** 
 * Interface for async response streams.
 */
export interface AsyncResponseStream extends AsyncIterable<string> {
  on(event: 'text', listener: (text: string) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'end', listener: () => void): this;
  finalMessage(): Promise<string>;
}