import * as z from 'zod';

export const templateVariableSchema = z
  .object({
    type: z
      .enum(['string', 'number', 'boolean', 'array'])
      .describe('The data type of the variable.'),
    description: z.string().describe('A brief description of the variable.'),
    default: z.any().optional().describe('The default value for the variable, if applicable.'),
    place_holder: z.any().optional().describe('The placeholder value for the variable.'),
    inferred: z
      .boolean()
      .optional()
      .describe('Indicates whether the variable is inferred from context.'),
    customValidator: z
      .function()
      .args(z.any())
      .returns(z.boolean())
      .optional()
      .describe('A custom validation function for the variable.'),
  })
  .describe('Schema for defining template variables.');

export const outputVariableSchema = z
  .object({
    type: z
      .enum(['string', 'integer', 'float', 'boolean', 'array', 'object'])
      .describe('The data type of the output variable.'),
    description: z.string().optional().describe('A brief description of the output variable.'),
    default: z
      .any()
      .optional()
      .describe('The default value for the output variable, if applicable.'),
  })
  .describe('Schema for defining output variables.');

export const templateDefinitionSchema = z
  .object({
    name: z.string().describe('The name of the template.'),
    version: z.string().describe('The version of the template.'),
    description: z.string().describe('A detailed description of the template.'),
    author: z.string().describe('The author of the template.'),
    provider: z.string().optional().describe('The provider of the template, if applicable.'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Tags associated with the template for categorization.'),
    categories: z.array(z.string()).optional().describe('Categories that the template belongs to.'),
    model: z.string().optional().describe('The model associated with the template, if applicable.'),
    input_variables: z
      .record(z.string(), templateVariableSchema)
      .optional()
      .describe('Input variables for the template, defined by their names.'),
    output_variables: z
      .record(z.string(), outputVariableSchema)
      .optional()
      .describe('Output variables for the template, defined by their names.'),
    content: z.string().describe('The main content of the template.'),
    parameters: z
      .object({
        max_tokens: z.number().optional().describe('The maximum number of tokens to generate.'),
        temperature: z
          .number()
          .optional()
          .describe('Controls the randomness of the output; higher values mean more randomness.'),
        top_p: z
          .number()
          .optional()
          .describe('Nucleus sampling parameter; controls diversity via cumulative probability.'),
        top_k: z.number().optional().describe('Limits the sampling to the top k tokens.'),
      })
      .optional()
      .describe('Parameters for controlling the generation process.'),

    prompt_type: z
      .string()
      .describe(
        'The type of prompt, such as text generation, question answering, summarization, or translation.',
      )
      .optional(),
    task_description: z
      .string()
      .describe('A description of the task the prompt is designed for.')
      .optional(),
    example_outputs: z
      .array(z.string())
      .optional()
      .describe('Example outputs for the prompt, if available.'),
  })
  .describe('Schema for defining a template.');

export const templateDefinitionSchemaWithResolvedContent = templateDefinitionSchema.extend({
  resolved_content: z.string().optional().describe('The resolved content of the variable.'),
});

export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;
export type TemplateDefinitionWithResolvedContent = z.infer<
  typeof templateDefinitionSchemaWithResolvedContent
>;
export type TemplateVariable = z.infer<typeof templateVariableSchema>;
export type OutputVariable = z.infer<typeof outputVariableSchema>;
