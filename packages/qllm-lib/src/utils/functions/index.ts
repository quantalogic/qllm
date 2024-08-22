import { z } from 'zod';
import { FunctionTool } from '../../types';



// Helper type to extract parameter info from Zod schema
type ZodToJsonSchema<T extends z.ZodType<any, any, any>> = {
  type: string;
  description?: string;
} & (T extends z.ZodObject<any>
  ? { properties: { [K in keyof T['shape']]: ZodToJsonSchema<T['shape'][K]> } }
  : T extends z.ZodArray<infer ItemType>
  ? { items: ZodToJsonSchema<ItemType> }
  : T extends z.ZodEnum<any>
  ? { enum: T['options'] }
  : {});

// Utility function to convert Zod schema to JSON schema
function zodToJsonSchema<T extends z.ZodType<any, any, any>>(schema: T): ZodToJsonSchema<T> {
  if (schema instanceof z.ZodObject) {
    const properties: Record<string, ZodToJsonSchema<any>> = {};
    for (const [key, value] of Object.entries(schema.shape)) {
      properties[key] = zodToJsonSchema(value as z.ZodType<any, any, any>);
    }
    return {
      type: 'object',
      properties,
    } as unknown as ZodToJsonSchema<T>;
  } else if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodToJsonSchema(schema.element),
    } as unknown as ZodToJsonSchema<T>;
  } else if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema.options,
    } as unknown as ZodToJsonSchema<T>;
  } else {
    const jsonSchema: ZodToJsonSchema<T> = {
      type:
        schema instanceof z.ZodString
          ? 'string'
          : schema instanceof z.ZodNumber
          ? 'number'
          : schema instanceof z.ZodBoolean
          ? 'boolean'
          : 'unknown',
    } as unknown as ZodToJsonSchema<T>;
    if ('description' in schema._def) {
      jsonSchema.description = schema._def.description;
    }
    return jsonSchema;
  }
}

// Utility function to create a function tool from a Zod schema
export function createFunctionToolFromZod<T extends z.ZodObject<any>>(
  name: string,
  description: string,
  schema: T,
): FunctionTool {
  const jsonSchema = zodToJsonSchema(schema);
  const required = Object.entries(schema.shape)
    .filter(([_, value]) => !(value instanceof z.ZodOptional))
    .map(([key, _]) => key);

  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: {
        type: 'object',
        properties: jsonSchema.properties as Record<string, unknown>,
        required,
      },
    },
  };
}
