import { z } from 'zod';
import { FunctionTool } from '../../types';

function zodToJsonSchema(schema: z.ZodType<any, any, any>): any {
  if (schema instanceof z.ZodObject) {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    Object.entries(schema.shape).forEach(([key, value]) => {
      properties[key] = zodToJsonSchema(value as z.ZodType<any, any, any>);
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    });

    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  if (schema instanceof z.ZodString) return { type: 'string' };
  if (schema instanceof z.ZodNumber) return { type: 'number' };
  if (schema instanceof z.ZodBoolean) return { type: 'boolean' };

  if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodToJsonSchema(schema.element),
    };
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema._def.values,
    };
  }

  if (schema instanceof z.ZodUnion) {
    return {
      anyOf: schema._def.options.map(zodToJsonSchema),
    };
  }

  if (schema.description) {
    return {
      ...zodToJsonSchema(schema._def.innerType),
      description: schema.description,
    };
  }

  return {}; // fallback for unsupported types
}


export type FunctionToolConfig = {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
}

export function createFunctionToolFromZod(config: FunctionToolConfig): FunctionTool {
  const { name, description, schema } = config;
  const jsonSchema = zodToJsonSchema(schema);
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: jsonSchema,
    },
  };
}