import * as z from 'zod';

export const templateVariableSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'array']),
  description: z.string(),
  default: z.any().optional(),
  inferred: z.boolean().optional(),
});

export const outputVariableSchema = z.object({
  type: z.enum(['string', 'integer', 'float', 'boolean', 'array', 'object']),
  description: z.string().optional(),
  default: z.any().optional(),
});

export const templateDefinitionSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string(),
  provider: z.string().optional(),
  model: z.string().optional(),
  input_variables: z.record(z.string(), templateVariableSchema).optional(),
  output_variables: z.record(z.string(), outputVariableSchema).optional(),
  content: z.string(),
  parameters: z.object({
    max_tokens: z.number().optional(),
    temperature: z.number().optional(),
    top_p: z.number().optional(),
    top_k: z.number().optional(),
  }).optional(),
  resolved_content: z.string().optional(),
});

export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;
export type TemplateVariable = z.infer<typeof templateVariableSchema>;
export type OutputVariable = z.infer<typeof outputVariableSchema>;