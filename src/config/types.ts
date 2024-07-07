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
  /** AWS profile to use */
  awsProfile: string;
  /** AWS region to use */
  awsRegion: string;
  /** Default LLM provider */
  defaultProvider: ProviderName | undefined | string;
  /** Model alias to use */
  modelAlias?: string;
  /** Specific model ID to use */
  modelId?: string;
  /** Prompt directory */
  promptDirectory: string;
}

/**
 * Output format options for responses.
 */
export type OutputFormat = 'json' | 'markdown' | 'text' | 'xml';

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