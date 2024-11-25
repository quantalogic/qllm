/**
 * @fileoverview Utility module for converting Zod schemas to JSON Schema format and creating function tools.
 * Provides functionality to transform Zod validation schemas into OpenAI function-calling compatible JSON Schema.
 * 
 * @author QLLM Team
 * @module utils/functions
 */

import { z } from 'zod';
import { FunctionTool } from '../../types';

/**
 * Represents the structure of a JSON Schema type definition.
 * Supports common JSON Schema properties including nested objects, arrays, and enums.
 */
type JsonSchemaType = {
  type?: string;
  description?: string;
  properties?: Record<string, JsonSchemaType>;
  required?: string[];
  items?: JsonSchemaType;
  enum?: string[];
  anyOf?: JsonSchemaType[];
};

/**
 * Converts a Zod schema to its equivalent JSON Schema representation.
 * Supports common Zod types including objects, strings, numbers, booleans, arrays, enums, and unions.
 * 
 * @param {z.ZodTypeAny} schema - The Zod schema to convert
 * @returns {JsonSchemaType} Equivalent JSON Schema representation
 */
function zodToJsonSchema(schema: z.ZodTypeAny): JsonSchemaType {
  if (schema instanceof z.ZodObject) {
    const properties: Record<string, JsonSchemaType> = {};
    const required: string[] = [];

    Object.entries(schema.shape).forEach(([key, value]) => {
      properties[key] = zodToJsonSchema(value as z.ZodTypeAny);
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    });

    const result: JsonSchemaType = {
      type: 'object',
      properties,
    };

    if (schema.description) result.description = schema.description;
    if (required.length > 0) result.required = required;

    return result;
  }

  if (schema instanceof z.ZodString) {
    const result: JsonSchemaType = { type: 'string' };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodNumber) {
    const result: JsonSchemaType = { type: 'number' };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodBoolean) {
    const result: JsonSchemaType = { type: 'boolean' };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodArray) {
    const result: JsonSchemaType = {
      type: 'array',
      items: zodToJsonSchema(schema.element),
    };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodEnum) {
    const result: JsonSchemaType = {
      type: 'string',
      enum: schema.options as string[],
    };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodUnion) {
    return {
      anyOf: schema.options.map(zodToJsonSchema),
    };
  }

  if (schema instanceof z.ZodOptional) {
    const innerSchema = zodToJsonSchema(schema.unwrap());
    if (schema.description) innerSchema.description = schema.description;
    return innerSchema;
  }

  return {}; // fallback for unsupported types
}

/**
 * Configuration options for creating a function tool.
 */
export type FunctionToolConfig = {
  /** Name of the function tool */
  name: string;
  /** Description of what the function does */
  description: string;
  /** Zod schema defining the function's parameter structure */
  schema: z.ZodObject<z.ZodRawShape>;
  /** Whether to enforce strict validation (optional) */
  strict?: boolean;
};

/**
 * Creates a function tool compatible with OpenAI's function calling format using a Zod schema.
 * This allows for type-safe function definitions that can be used with LLM function calling.
 * 
 * @param {FunctionToolConfig} config - Configuration for the function tool
 * @returns {FunctionTool} OpenAI-compatible function tool definition
 * 
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: z.string().describe('The user\'s name'),
 *   age: z.number().describe('The user\'s age')
 * });
 * 
 * const functionTool = createFunctionToolFromZod({
 *   name: 'getUserInfo',
 *   description: 'Get user information',
 *   schema
 * });
 * ```
 */
export function createFunctionToolFromZod(config: FunctionToolConfig): FunctionTool {
  const { name, description, schema, strict } = config;
  const jsonSchema = zodToJsonSchema(schema);
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: jsonSchema,
    },
    strict,
  };
}
