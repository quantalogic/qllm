/**
 * @fileoverview Core type definitions for the QLLM library.
 * This file contains all the fundamental types used across the library for
 * chat messages, completions, embeddings, and model configurations.
 * 
 * @version 1.0.0
 * @license MIT
 */

import { z } from 'zod';

// -------------------- Chat Message Types --------------------

/** Valid roles for chat messages */
export type ChatMessageRole = 'user' | 'assistant' | 'system';

/** Supported content types for chat messages */
export type ChatMessageContentType = 'text' | 'image_url';

/** Text content structure for chat messages */
export type TextContent = {
  type: 'text';
  text: string;
};

/** Image URL content structure for chat messages */
export type ImageUrlContent = {
  type: 'image_url';
  url: string;
};

/** Union type for all possible message content types */
export type MessageContent = TextContent | ImageUrlContent;

/** Chat message content can be a single content item or an array */
export type ChatMessageContent = MessageContent | MessageContent[];

/**
 * Core chat message structure used throughout the library
 */
export type ChatMessage = {
  role: ChatMessageRole;
  content: ChatMessageContent;
};

/**
 * System message structure for providing context or instructions
 */
export type SystemMessage = {
  role: 'system';
  content: TextContent;
};

/** Union type for messages that can include system messages */
export type ChatMessageWithSystem = ChatMessage | SystemMessage;

/**
 * Type guard to check if content is text-based
 * @param content - Message content to check
 * @returns True if content is text-based
 */
export function isTextContent(content: MessageContent): content is TextContent {
  return content.type === 'text';
}

/**
 * Type guard to check if content is image-based
 * @param content - Message content to check
 * @returns True if content is image-based
 */
export function isImageUrlContent(content: MessageContent): content is ImageUrlContent {
  return content.type === 'image_url';
}

// -------------------- Usage and Response Types --------------------

/**
 * Token usage statistics for API calls
 */
export type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

/**
 * Response structure for chat completion requests
 */
export type ChatCompletionResponse = {
  model: string;
  text: string | null;
  refusal: string | null;
  toolCalls?: ToolCall[];
  finishReason: string | null;
  usage?: Usage;
};

/**
 * Response structure for streaming chat completion requests
 */
export type ChatStreamCompletionResponse = {
  model: string;
  text: string | null;
  finishReason: string | null;
};

// -------------------- Embedding Types --------------------

/**
 * Parameters for embedding generation requests
 */
export type EmbeddingRequestParams = {
  model: string;
  content: string | string[] | number[] | number[][];
  dimensions?: number;
};

/** Vector representation of embedded content */
export type Embedding = number[];

/**
 * Response structure for embedding requests
 */
export type EmbeddingResponse = {
  embedding: Embedding;
  embeddings?: Embedding[];
};

// -------------------- Option Types --------------------

/**
 * Configuration options for text generation
 */
export interface GenerationOptions {
  /** Seed for deterministic generation. Same seed should produce same output */
  seed?: number;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Controls randomness: 0 = deterministic, 1 = very random */
  temperature?: number;
  /** Nucleus sampling: only consider tokens with top_p cumulative probability */
  topProbability?: number;
  /** Only sample from top K tokens */
  topKTokens?: number;
  /** Number of most likely tokens to return with their log probabilities */
  topLogprobs?: number | null;
  /** Adjust likelihood of specific tokens appearing in the output */
  logitBias?: Record<string, number> | null;
  /** Whether to return log probabilities of the output tokens */
  logprobs?: number | null;
  /** Sequences where the API will stop generating further tokens */
  stop?: string | string[] | null;
  /** Penalize new tokens based on their existing frequency */
  presencePenalty?: number | null;
  /** Penalize new tokens based on their existing frequency */
  frequencyPenalty?: number | null;
}

/** Model selection options */
export interface ModelOptions {
  model: string;
}

/** AWS environment configuration options */
export interface EnvironmentOptions {
  awsRegion?: string;
  awsProfile?: string;
}

/** Combined options for LLM operations */
export interface LLMOptions extends GenerationOptions, ModelOptions, EnvironmentOptions {
  systemMessage?: string;
}

// -------------------- Function and Tool Types --------------------

/** Schema definition for JSON primitive types */
const JSONSchemaPrimitiveType = z.enum(['string', 'number', 'integer', 'boolean', 'null']);

/**
 * Comprehensive JSON Schema type definition
 * Supports nested schemas and various validation rules
 */
const JSONSchemaType: z.ZodType<any> = z.lazy(() =>
  z
    .object({
      // Core schema metadata
      $schema: z.string().optional(),
      $id: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),

      // Type-specific fields
      type: z.union([JSONSchemaPrimitiveType, z.array(JSONSchemaPrimitiveType)]).optional(),
      enum: z.array(z.any()).optional(),
      const: z.any().optional(),

      // Numeric constraints
      multipleOf: z.number().positive().optional(),
      maximum: z.number().optional(),
      exclusiveMaximum: z.number().optional(),
      minimum: z.number().optional(),
      exclusiveMinimum: z.number().optional(),

      // String constraints
      maxLength: z.number().int().nonnegative().optional(),
      minLength: z.number().int().nonnegative().optional(),
      pattern: z.string().optional(),

      // Array constraints
      items: z.union([JSONSchemaType, z.array(JSONSchemaType)]).optional(),
      additionalItems: z.union([JSONSchemaType, z.boolean()]).optional(),
      maxItems: z.number().int().nonnegative().optional(),
      minItems: z.number().int().nonnegative().optional(),
      uniqueItems: z.boolean().optional(),

      // Object constraints
      properties: z.record(JSONSchemaType).optional(),
      patternProperties: z.record(JSONSchemaType).optional(),
      additionalProperties: z.union([JSONSchemaType, z.boolean()]).optional(),
      required: z.array(z.string()).optional(),
      propertyNames: JSONSchemaType.optional(),
      maxProperties: z.number().int().nonnegative().optional(),
      minProperties: z.number().int().nonnegative().optional(),

      // Combining schemas
      allOf: z.array(JSONSchemaType).optional(),
      anyOf: z.array(JSONSchemaType).optional(),
      oneOf: z.array(JSONSchemaType).optional(),
      not: JSONSchemaType.optional(),

      // Conditional schema
      if: JSONSchemaType.optional(),
      then: JSONSchemaType.optional(),
      else: JSONSchemaType.optional(),

      // Format
      format: z.string().optional(),

      // Schema annotations
      default: z.any().optional(),
      examples: z.array(z.any()).optional(),
    })
    .passthrough(),
);

/** Schema for function-based tools */
const FunctionToolSchema = z.object({
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    description: z.string(),
    parameters: JSONSchemaType,
  }),
  strict: z.boolean().optional(),
});

/** Combined tool schema */
const ToolSchema = FunctionToolSchema;

/** Type definition for function-based tools */
export type FunctionTool = z.infer<typeof FunctionToolSchema>;
/** Type definition for all tool types */
export type Tool = z.infer<typeof ToolSchema>;

/** Structure for function calls within tools */
export type ToolCallFunction = {
  name: string;
  arguments: string;
};

/** Structure for tool calls */
export type ToolCall = {
  id: string;
  type: 'function';
  function: ToolCallFunction;
};

// -------------------- Response Format Types --------------------

/** Text response format */
export type ResponseFormatText = {
  type: 'text';
};

/** JSON object response format */
export type ResponseFormatJSONObject = {
  type: 'json_object';
};

/** JSON schema response format */
export type ResponseFormatJSONSchema = {
  type: 'json_schema';
  json_schema: {
    name: string;
    description?: string;
    schema: Record<string, unknown>;
    strict?: boolean;
  };
};

/** Combined response format type */
export type ResponseFormat = ResponseFormatText | ResponseFormatJSONObject | ResponseFormatJSONSchema;

/** Error response structure */
export type ErrorResponse = {
  code: string;
  message: string;
  details?: string;
};

/** Model information structure */
export type Model = {
  id: string;
  description?: string;
  created?: Date;
};

// -------------------- Chat Completion Types --------------------

/** Parameters for chat completion requests */
export type ChatCompletionParams = {
  messages: ChatMessage[];
  tools?: Tool[];
  toolChoice?: 'none' | 'auto' | 'required';
  parallelToolCalls?: boolean;
  responseFormat?: ResponseFormat;
  options: LLMOptions;
};
