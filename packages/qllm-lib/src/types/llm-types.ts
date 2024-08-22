import { z } from 'zod';

// -------------------- Chat Message Types --------------------

// Chat message roles
export type ChatMessageRole = 'user' | 'assistant' | 'system';

// Chat message content types
export type ChatMessageContentType = 'text' | 'image_url';

// Text content
export type TextContent = {
  type: 'text';
  text: string;
};

// Image URL content
export type ImageUrlContent = {
  type: 'image_url';
  imageUrl: {
    url: string;
  };
};

// Message content (union type)
export type MessageContent = TextContent | ImageUrlContent;

// Chat message content (single or array)
export type ChatMessageContent = MessageContent | MessageContent[];

// Chat message structure
export type ChatMessage = {
  role: ChatMessageRole;
  content: ChatMessageContent;
};

// -------------------- Usage and Response Types --------------------

// Usage statistics
export type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

// Chat completion response
export type ChatCompletionResponse = {
  model: string;
  text: string | null;
  finishReason: string | null;
  usage?: Usage;
};

// Chat stream completion response
export type ChatStreamCompletionResponse = {
  model: string;
  text: string | null;
  finishReason: string | null;
};

// -------------------- Embedding Types --------------------

// Embedding request parameters
export type EmbeddingRequestParams = {
  model: string;
  content: string | string[] | number[] | number[][];
  dimensions?: number;
};

// Single embedding
export type Embedding = number[];

// Embedding response
export type EmbeddingResponse = {
  embedding: Embedding;
  embeddings: Embedding[];
};

// -------------------- Option Types --------------------

// Generation options
export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topProbability?: number;
  topKTokens?: number;
}

// Model options
export interface ModelOptions {
  model: string;
}

// Environment options
export interface EnvironmentOptions {
  awsRegion?: string;
  awsProfile?: string;
}

// LLM options (combined)
export interface LLMOptions extends GenerationOptions, ModelOptions, EnvironmentOptions {
  systemMessage?: string;
}

// -------------------- Function and Tool Types --------------------
// JSON Schema primitive types
const JSONSchemaPrimitiveType = z.enum(['string', 'number', 'integer', 'boolean', 'null']);

// JSON Schema type definition
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

// Function tool (aligned with OpenAI's format)
const FunctionToolSchema = z.object({
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    description: z.string(),
    parameters: JSONSchemaType,
  }),
});

const ToolSchema = FunctionToolSchema;

// Infer types from schemas
export type FunctionTool = z.infer<typeof FunctionToolSchema>;
export type Tool = z.infer<typeof ToolSchema>;

export type ToolChoiceFunction = {
  type: 'function';
  name: string;
};

// -------------------- Miscellaneous Types --------------------

export type ResponseFormatText = {
  type: 'text';
};

export type ResponseFormatJSONObject = {
  type: 'json_object';
};

export type ResponseFormatJSONSchema = {
  type: 'json_schema';
  json_schema: {
    name: string;
    description?: string;
    schema: Record<string, unknown>;
    strict?: boolean;
  };
};

// Response formats
export type ResponseFormat = ResponseFormatText | ResponseFormatJSONObject | ResponseFormatJSONSchema;

// Error response
export interface ErrorResponse {
  code: string;
  message: string;
  details?: string;
}

// Model
export type Model = {
  id: string;
  description?: string;
  created?: Date;
};

// -------------------- Chat Completion Types --------------------



// Chat completion parameters
export type ChatCompletionParams = {
  messages: ChatMessage[];
  tools?: Tool[];
  toolChoice?:  'none' | 'auto' | 'required';
  parallelToolCalls?: boolean;
  responseFormat?: ResponseFormat;
  options: LLMOptions;
};
