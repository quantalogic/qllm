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
 * Message roles in conversations.
 */
export type MessageRole = 'user' | 'assistant' | 'system';








