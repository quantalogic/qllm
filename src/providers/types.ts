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



// CLI command options
// LLM response structure
export interface LLMResponse {
  content: Array<{
    text: string;
  }>;
}



