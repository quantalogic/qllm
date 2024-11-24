/**
 * @fileoverview Schema definitions for QLLM templates using Zod.
 * 
 * This module defines the schema for QLLM templates, including input variables,
 * output variables, and template definitions. It uses Zod for runtime type
 * checking and validation.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 */

import * as z from 'zod';

/**
 * Schema for template input variables.
 * Defines the structure and validation rules for template input variables.
 */
export const templateVariableSchema = z
  .object({
    type: z
      .enum(['string', 'number', 'boolean', 'array', 'file_path', 'files_path'])
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

/**
 * Schema for template output variables.
 * Defines the structure and validation rules for template output variables.
 */
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

/**
 * Schema for complete template definitions.
 * Defines the structure and validation rules for entire template documents.
 */
export const templateDefinitionSchema = z
  .object({
    name: z.string().describe('The name of the template.'),
    version: z.string().describe('The version of the template, following semantic versioning.'),
    description: z.string().describe('A detailed description of the template and its purpose.'),
    author: z.string().describe('The name or identifier of the template author.'),
    provider: z
      .string()
      .optional()
      .describe('The organization or platform providing the template.'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Keywords or labels for easy template discovery and categorization.'),
    categories: z
      .array(z.string())
      .optional()
      .describe('Broader categories the template falls under.'),
    model: z.string().optional().describe('The specific AI model the template is designed for.'),
    input_variables: z
      .record(z.string(), templateVariableSchema)
      .optional()
      .describe('Definitions of input variables required by the template.'),
    output_variables: z
      .record(z.string(), outputVariableSchema)
      .optional()
      .describe('Specifications for expected output variables from the template.'),
    content: z.string().describe('The main prompt or instruction text of the template.'),
    parameters: z
      .object({
        max_tokens: z
          .number()
          .optional()
          .describe('Maximum number of tokens in the generated output.'),
        temperature: z
          .number()
          .optional()
          .describe('Controls randomness in output generation (0-1).'),
        top_p: z.number().optional().describe('Nucleus sampling parameter for output diversity.'),
        top_k: z.number().optional().describe('Limits vocabulary for each generation step.'),
        seed: z.number().optional().describe('Random seed for reproducible outputs.'),
        system_message: z
          .string()
          .optional()
          .describe('Initial context or instruction for the AI model.'),
        frequency_penalty: z
          .number()
          .optional()
          .describe('Penalizes frequent token usage (-2.0 to 2.0).'),
        presence_penalty: z
          .number()
          .optional()
          .describe('Encourages topic diversity (-2.0 to 2.0).'),
        logit_bias: z
          .record(z.number())
          .optional()
          .describe('Adjusts likelihood of specific tokens.'),
        logprobs: z
          .number()
          .optional()
          .describe('Number of most likely tokens to return with probabilities.'),
        stop_sequences: z
          .array(z.string())
          .optional()
          .describe('Sequences that trigger output completion.'),
      })
      .optional()
      .describe('Model-specific parameters for template execution.'),
    prompt_type: z
      .string()
      .describe("Categorizes the template's primary function or output type.")
      .optional(),
    task_description: z
      .string()
      .describe('Detailed explanation of the task the template is designed to accomplish.')
      .optional(),
    example_outputs: z
      .array(z.string())
      .optional()
      .describe('Sample outputs demonstrating expected results from the template.'),
  })
  .describe('Schema for complete template definitions.');

/**
 * Schema for complete template definitions with resolved content.
 * Extends templateDefinitionSchema to include fully resolved content.
 */
export const templateDefinitionSchemaWithResolvedContent = templateDefinitionSchema.extend({
  resolved_content: z.string().optional().describe('The resolved content of the variable.'),
});

/**
 * Type definition for a template, inferred from the schema.
 */
export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;

/**
 * Type definition for a template with resolved content.
 * Extends TemplateDefinition to include fully resolved content.
 */
export type TemplateDefinitionWithResolvedContent = z.infer<
  typeof templateDefinitionSchemaWithResolvedContent
>;

/**
 * Type definition for a template variable, inferred from the schema.
 */
export type TemplateVariable = z.infer<typeof templateVariableSchema>;

/**
 * Type definition for an output variable, inferred from the schema.
 */
export type OutputVariable = z.infer<typeof outputVariableSchema>;
