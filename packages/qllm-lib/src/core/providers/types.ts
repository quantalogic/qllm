


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



