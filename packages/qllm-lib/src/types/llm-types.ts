import { z } from 'zod';

// Chat message roles
export type ChatMessageRole = 'user' | 'assistant' | 'system';

// Chat message content types
export type ChatMessageContentType = 'text' | 'image_url';

// Chat message content
export type ChatMessageContent = {
  type: ChatMessageContentType;
  data: {
    text?: string;
    imageUrl?: { url: string };
  };
};

// Chat message structure
export type ChatMessage = {
  role: ChatMessageRole;
  content: ChatMessageContent;
};

export type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type ChatCompletionResponse = {
  text: string | null;
  finishReason?: string;
  usage?: Usage;
};

// Generation options
export interface GenerationOptions {
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for response generation */
  temperature?: number;
  /** Top Probability for response generation */
  topProbability?: number;
  /** Top K Tokens for response generation */
  topKTokens?: number;
}

// Model options
export interface ModelOptions {
  /** Model to use for generation */
  model: string;
}

// Environment options
export interface EnvironmentOptions {
  /** AWS Region */
  awsRegion?: string;
  /** AWS Profile */
  awsProfile?: string;
}

// Function metadata
export interface FunctionMetadata {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// Functions options
const FunctionSchema = z.object({
  type: z.literal('function'),
  metadata: z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.unknown()),
  }),
});

export const FunctionsOptions = z.array(FunctionSchema);

// LLM options
export interface LLMOptions extends GenerationOptions, ModelOptions, EnvironmentOptions {
  /** System message to set context */
  systemMessage?: string;
  /** Functions data */
  functions?: z.infer<typeof FunctionsOptions>;
  /** Image path */
  imagePath?: string;
}

// Response formats
export type ResponseFormat = 'json' | 'markdown' | 'text';

export interface ErrorResponse {
  code: string;
  message: string;
  details?: string;
}
