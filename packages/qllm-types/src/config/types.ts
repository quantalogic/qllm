// src/config/types.ts

/** 
 * Represents a model alias and its corresponding model ID.
 */
export interface ModelAlias {
  /** The alias name for the model */
  alias: string;
  /** The actual model ID */
  modelId: string;
  /** parameters allowd */
  parameters: Object
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
export type ProviderName = 'anthropic' | 'openai' | 'ollama' | 'groq' | 'perplexity' | 'mistral' | 'openrouter';

/** 
 * Application configuration interface.
 */
export interface AppConfig {
  /** AWS profile to use */
  awsProfile: string;
  /** AWS region to use */
  awsRegion: string;
  /** Default LLM provider */
  defaultProvider: ProviderName;
  /** Specific model ID to use */
  defaultModelId?: string;
  /** Prompt directory */
  promptDirectory: string;
  /** Log level */
  logLevel: string;
  /** Default maximum tokens */
  defaultMaxTokens: number;
  /** Default model alias */
  defaultModelAlias: string;

}



/** 
 * Message roles in conversations.
 */
export type MessageRole = 'user' | 'assistant' | 'system';

