
import {ToolsArraySchema} from "@qllm/types/src"
import { z } from 'zod';

// Message roles
type MessageRole = 'user' | 'assistant' | 'system';

export type ContentItem = 
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

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



