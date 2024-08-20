import { ToolsArraySchema } from 'config/tools_config';
import { z } from 'zod';

// Message roles
type MessageRole = 'user' | 'assistant' | 'system';

export type ContentItem =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

// Message structure
export interface Message {
  role: MessageRole;
  content: string;
}

/*
 * Represents the options for an LLM provider.
 */
export interface LLMProviderOptions {
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for response generation */
  temperature?: number;
  /** Top P for response generation */
  topP?: number;
  /** Top K for response generation */
  topK?: number;
  /** System message to set context */
  system?: string;
  /** Model to use for generation */
  model: string;
  /** AWS REGION */
  awsRegion?: string;
  /** AWS PROFIL */
  awsProfile?: string;
  /** Tools data */
  tools?: z.infer<typeof ToolsArraySchema>;
  /** Image path */
  imagePath?: string;
}

// Output format options
export type OutputFormat = 'json' | 'markdown' | 'text';

// CLI command options
// LLM response structure
export interface LLMResponse {
  content: Array<{
    text: string;
  }>;
}
