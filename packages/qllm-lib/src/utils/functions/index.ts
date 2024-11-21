import { z } from 'zod';
import { FunctionTool } from '../../types';

type JsonSchemaType = {
  type?: string;
  description?: string;
  properties?: Record<string, JsonSchemaType>;
  required?: string[];
  items?: JsonSchemaType;
  enum?: string[];
  anyOf?: JsonSchemaType[];
};

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

export type FunctionToolConfig = {
  name: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  strict?: boolean;
};

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



export function parseTemplateUrl(url: string): string {
  if (url.startsWith('https://github.com/')) {
    return githubUrlToRaw(url);
  } else if (url.startsWith('https://s3.amazonaws.com/') || url.includes('.s3.amazonaws.com/')) {
    return parseS3Url(url);
  } else if (url.includes('drive.google.com')) {
    return parseGoogleDriveUrl(url);
  }
  return url;
}

function githubUrlToRaw(url: string): string {
  return url
    .replace('github.com', 'raw.githubusercontent.com')
    .replace('/blob/', '/');
}

function parseS3Url(url: string): string {
  // S3 URLs are already direct download links
  // Just ensure proper URL encoding
  return encodeURI(url);
}

function parseGoogleDriveUrl(url: string): string {
  // Extract file ID from various Google Drive URL formats
  let fileId = '';
  
  if (url.includes('/file/d/')) {
    fileId = url.split('/file/d/')[1].split('/')[0];
  } else if (url.includes('id=')) {
    fileId = new URL(url).searchParams.get('id') || '';
  }
  
  if (!fileId) {
    throw new Error('Invalid Google Drive URL format');
  }
  
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}