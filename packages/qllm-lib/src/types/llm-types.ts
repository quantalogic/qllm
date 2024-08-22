import { z } from 'zod';

// -------------------- Chat Message Types --------------------

export type ChatMessageRole = 'user' | 'assistant' | 'system';
export type ChatMessageContentType = 'text' | 'image_url';

export type TextContent = {
  type: 'text';
  text: string;
};

export type ImageUrlContent = {
  type: 'image_url';
  imageUrl: {
    url: string;
  };
};

export type MessageContent = TextContent | ImageUrlContent;
export type ChatMessageContent = MessageContent | MessageContent[];

export type ChatMessage = {
  role: ChatMessageRole;
  content: ChatMessageContent;
};

// -------------------- Usage and Response Types --------------------

export type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type ChatCompletionResponse = {
  model: string;
  text: string | null;
  refusal: string | null;
  toolCalls?: ToolCall[];
  finishReason: string | null;
  usage?: Usage;
};

export type ChatStreamCompletionResponse = {
  model: string;
  text: string | null;
  finishReason: string | null;
};

// -------------------- Embedding Types --------------------

export type EmbeddingRequestParams = {
  model: string;
  content: string | string[] | number[] | number[][];
  dimensions?: number;
};

export type Embedding = number[];

export type EmbeddingResponse = {
  embedding: Embedding;
  embeddings: Embedding[];
};

// -------------------- Option Types --------------------

export interface GenerationOptions {
  seed?: number;
  maxTokens?: number;
  temperature?: number;
  topProbability?: number;
  topKTokens?: number;
}

export interface ModelOptions {
  model: string;
}

export interface EnvironmentOptions {
  awsRegion?: string;
  awsProfile?: string;
}

export interface LLMOptions extends GenerationOptions, ModelOptions, EnvironmentOptions {
  systemMessage?: string;
}

// -------------------- Function and Tool Types --------------------

const JSONSchemaPrimitiveType = z.enum(['string', 'number', 'integer', 'boolean', 'null']);

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

const FunctionToolSchema = z.object({
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    description: z.string(),
    parameters: JSONSchemaType,
  }),
});

const ToolSchema = FunctionToolSchema;

export type FunctionTool = z.infer<typeof FunctionToolSchema>;
export type Tool = z.infer<typeof ToolSchema>;

export type ToolChoiceFunction = {
  type: 'function';
  name: string;
};

export type ToolCallFunction = {
  name: string;
  arguments: string; // JSON string of arguments
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: ToolCallFunction;
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

export type ResponseFormat =
  | ResponseFormatText
  | ResponseFormatJSONObject
  | ResponseFormatJSONSchema;

export interface ErrorResponse {
  code: string;
  message: string;
  details?: string;
}

export type Model = {
  id: string;
  description?: string;
  created?: Date;
};

// -------------------- Chat Completion Types --------------------

export type ChatCompletionParams = {
  messages: ChatMessage[];
  tools?: Tool[];
  toolChoice?: 'none' | 'auto' | 'required';
  parallelToolCalls?: boolean;
  responseFormat?: ResponseFormat;
  options: LLMOptions;
};
