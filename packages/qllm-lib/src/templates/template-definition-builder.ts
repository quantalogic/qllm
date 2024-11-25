/**
 * @fileoverview Template Definition Builder for QLLM Library
 * 
 * This module provides a builder pattern implementation for creating and managing
 * LLM template definitions. It handles the construction and validation of template
 * configurations used for generating prompts and managing LLM interactions.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * 
 * @example
 * ```typescript
 * const template = TemplateDefinitionBuilder
 *   .create({
 *     name: 'MyTemplate',
 *     version: '1.0.0',
 *     description: 'A sample template',
 *     author: 'QLLM Team',
 *     content: 'Hello {{name}}!'
 *   })
 *   .withInputVariable('name', 'string', 'User name')
 *   .build();
 * ```
 */

import * as z from 'zod';
import yaml from 'js-yaml';
import {
  templateDefinitionSchema,
  templateVariableSchema,
  outputVariableSchema,
  TemplateDefinition,
  TemplateVariable,
  OutputVariable,
  TemplateDefinitionWithResolvedContent,
} from './template-schema';

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_PROVIDER = 'openai';

/**
 * Builder class for creating and managing template definitions.
 * Implements a fluent interface pattern for constructing template configurations.
 * 
 * @class TemplateDefinitionBuilder
 * @implements {TemplateDefinition}
 */
export class TemplateDefinitionBuilder {
  private definition: Partial<TemplateDefinitionWithResolvedContent>;

  /**
   * Private constructor to enforce builder pattern usage.
   * Use static factory methods to create instances.
   * 
   * @private
   * @param {Partial<TemplateDefinition>} definition - Initial template definition
   */
  private constructor(definition: Partial<TemplateDefinition>) {
    this.definition = definition;
  }

  /**
   * Creates a builder instance from an existing template definition.
   * 
   * @static
   * @param {TemplateDefinition} template - Existing template to build from
   * @returns {TemplateDefinitionBuilder} New builder instance
   */
  static fromTemplate(template: TemplateDefinition): TemplateDefinitionBuilder {
    return new TemplateDefinitionBuilder(template);
  }

  /**
   * Creates a new template definition with required fields.
   * 
   * @static
   * @param {Object} params - Template creation parameters
   * @param {string} params.name - Template name
   * @param {string} params.version - Template version
   * @param {string} params.description - Template description
   * @param {string} params.author - Template author
   * @param {string} params.content - Template content
   * @returns {TemplateDefinitionBuilder} New builder instance with default settings
   */
  static create({
    name,
    version,
    description,
    author,
    content,
  }: {
    name: string;
    version: string;
    description: string;
    author: string;
    content: string;
  }): TemplateDefinitionBuilder {
    return new TemplateDefinitionBuilder({
      name,
      version,
      description,
      author,
      content,
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
      prompt_type: 'text_generation',
      parameters: {
        max_tokens: 100,
        temperature: 0.7,
      },
    });
  }

  /**
   * Creates a quick template setup with minimal configuration.
   * 
   * @static
   * @param {string} name - Template name
   * @param {string} content - Template content
   * @returns {TemplateDefinitionBuilder} New builder instance with basic settings
   */
  static quickSetup(name: string, content: string): TemplateDefinitionBuilder {
    return TemplateDefinitionBuilder.create({
      name: name,
      version: '1.0.0',
      description: `Template for ${name}`,
      author: 'AI Assistant',
      content: content,
    });
  }

  /**
   * Sets the prompt content for the template.
   * 
   * @param {string} prompt - The prompt text
   * @returns {this} Builder instance for method chaining
   */
  withPrompt(prompt: string): this {
    this.definition.content = prompt;
    return this;
  }

  /**
   * Sets the resolved content after variable substitution.
   * 
   * @param {string} content - Resolved content with substituted variables
   * @returns {this} Builder instance for method chaining
   */
  setResolvedContent(content: string): this {
    this.definition.resolved_content = content;
    return this;
  }

  /**
   * Creates a deep copy of the current builder instance.
   * 
   * @returns {TemplateDefinitionBuilder} New builder instance with copied definition
   */
  clone(): TemplateDefinitionBuilder {
    return new TemplateDefinitionBuilder(JSON.parse(JSON.stringify(this.definition)));
  }

  /**
   * Creates a template variable with validation.
   * 
   * @private
   * @param {TemplateVariable['type']} type - Variable type
   * @param {string} description - Variable description
   * @param {Partial<Omit<TemplateVariable, 'type' | 'description'>>} options - Additional options
   * @returns {TemplateVariable} Validated template variable
   */
  private createTemplateVariable(
    type: TemplateVariable['type'],
    description: string,
    options: Partial<Omit<TemplateVariable, 'type' | 'description'>> = {},
  ): TemplateVariable {
    return templateVariableSchema.parse({ type, description, ...options });
  }

  /**
   * Creates an output variable with validation.
   * 
   * @private
   * @param {OutputVariable['type']} type - Output variable type
   * @param {Partial<Omit<OutputVariable, 'type'>>} options - Additional options
   * @returns {OutputVariable} Validated output variable
   */
  private createOutputVariable(
    type: OutputVariable['type'],
    options: Partial<Omit<OutputVariable, 'type'>> = {},
  ): OutputVariable {
    return outputVariableSchema.parse({ type, ...options });
  }

  /**
   * Sets the LLM provider for the template.
   * 
   * @param {string} provider - Provider name (e.g., 'openai', 'anthropic')
   * @returns {this} Builder instance for method chaining
   */
  withProvider(provider: string): this {
    this.definition.provider = provider;
    return this;
  }

  /**
   * Removes the provider setting from the template.
   * 
   * @returns {this} Builder instance for method chaining
   */
  withoutProvider(): this {
    delete this.definition.provider;
    return this;
  }

  /**
   * Adds tags to the template for categorization.
   * 
   * @param {...string} tags - Tags to add
   * @returns {this} Builder instance for method chaining
   */
  withTags(...tags: string[]): this {
    this.definition.tags = [...(this.definition.tags || []), ...tags];
    return this;
  }

  /**
   * Removes specified tags from the template.
   * 
   * @param {...string} tags - Tags to remove
   * @returns {this} Builder instance for method chaining
   */
  withoutTags(...tags: string[]): this {
    if (this.definition.tags) {
      this.definition.tags = this.definition.tags.filter((t) => !tags.includes(t));
      if (this.definition.tags.length === 0) delete this.definition.tags;
    }
    return this;
  }

  /**
   * Adds categories for template organization.
   * 
   * @param {...string} categories - Categories to add
   * @returns {this} Builder instance for method chaining
   */
  withCategories(...categories: string[]): this {
    this.definition.categories = [...(this.definition.categories || []), ...categories];
    return this;
  }

  /**
   * Removes specified categories from the template.
   * 
   * @param {...string} categories - Categories to remove
   * @returns {this} Builder instance for method chaining
   */
  withoutCategories(...categories: string[]): this {
    if (this.definition.categories) {
      this.definition.categories = this.definition.categories.filter(
        (c) => !categories.includes(c),
      );
      if (this.definition.categories.length === 0) delete this.definition.categories;
    }
    return this;
  }

  /**
   * Sets the LLM model for the template.
   * 
   * @param {string} model - Model identifier
   * @returns {this} Builder instance for method chaining
   */
  withModel(model: string): this {
    this.definition.model = model;
    return this;
  }

  /**
   * Removes the model setting from the template.
   * 
   * @returns {this} Builder instance for method chaining
   */
  withoutModel(): this {
    delete this.definition.model;
    return this;
  }

  /**
   * Adds an input variable to the template.
   * 
   * @param {string} name - Variable name
   * @param {TemplateVariable | TemplateVariable['type']} typeOrVariable - Variable type or complete variable
   * @param {string} [description] - Variable description (required if type is provided)
   * @param {Partial<Omit<TemplateVariable, 'type' | 'description'>>} [options] - Additional options
   * @returns {this} Builder instance for method chaining
   * @throws {Error} If description is missing when type is provided
   */
  withInputVariable(
    name: string,
    typeOrVariable: TemplateVariable['type'] | TemplateVariable,
    description?: string,
    options: Partial<Omit<TemplateVariable, 'type' | 'description'>> = {},
  ): this {
    if (typeof typeOrVariable === 'object') {
      if (!this.definition.input_variables) this.definition.input_variables = {};
      this.definition.input_variables[name] = typeOrVariable;
    } else {
      if (!description) throw new Error('Description is required when type is provided');
      const variable = this.createTemplateVariable(typeOrVariable, description, options);
      if (!this.definition.input_variables) this.definition.input_variables = {};
      this.definition.input_variables[name] = variable;
    }
    return this;
  }

  /**
   * Removes an input variable from the template.
   * 
   * @param {string} name - Variable name to remove
   * @returns {this} Builder instance for method chaining
   */
  withoutInputVariable(name: string): this {
    if (this.definition.input_variables) {
      delete this.definition.input_variables[name];
      if (Object.keys(this.definition.input_variables).length === 0) {
        delete this.definition.input_variables;
      }
    }
    return this;
  }

  /**
   * Adds an output variable to the template.
   * 
   * @param {string} name - Variable name
   * @param {OutputVariable | OutputVariable['type']} typeOrVariable - Variable type or complete variable
   * @param {Partial<Omit<OutputVariable, 'type'>>} [options] - Additional options
   * @returns {this} Builder instance for method chaining
   */
  withOutputVariable(
    name: string,
    typeOrVariable: OutputVariable['type'] | OutputVariable,
    options: Partial<Omit<OutputVariable, 'type'>> = {},
  ): this {
    if (typeof typeOrVariable === 'object') {
      if (!this.definition.output_variables) this.definition.output_variables = {};
      this.definition.output_variables[name] = typeOrVariable;
    } else {
      const variable = this.createOutputVariable(typeOrVariable, options);
      if (!this.definition.output_variables) this.definition.output_variables = {};
      this.definition.output_variables[name] = variable;
    }
    return this;
  }

  /**
   * Removes an output variable from the template.
   * 
   * @param {string} name - Variable name to remove
   * @returns {this} Builder instance for method chaining
   */
  withoutOutputVariable(name: string): this {
    if (this.definition.output_variables) {
      delete this.definition.output_variables[name];
      if (Object.keys(this.definition.output_variables).length === 0) {
        delete this.definition.output_variables;
      }
    }
    return this;
  }

  /**
   * Sets LLM parameters for the template.
   * 
   * @param {TemplateDefinition['parameters']} parameters - LLM parameters
   * @returns {this} Builder instance for method chaining
   */
  withParameters(parameters: TemplateDefinition['parameters']): this {
    this.definition.parameters = {
      ...this.definition.parameters,
      ...parameters,
    };
    return this;
  }

  /**
   * Sets the random seed for reproducible results.
   * 
   * @param {number} seed - Random seed value
   * @returns {this} Builder instance for method chaining
   */
  withSeed(seed: number): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.seed = seed;
    return this;
  }

  /**
   * Sets the system message for chat-based models.
   * 
   * @param {string} systemMessage - System context message
   * @returns {this} Builder instance for method chaining
   */
  withSystemMessage(systemMessage: string): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.system_message = systemMessage;
    return this;
  }

  /**
   * Sets the frequency penalty for response diversity.
   * 
   * @param {number} frequencyPenalty - Penalty value (typically between -2.0 and 2.0)
   * @returns {this} Builder instance for method chaining
   */
  withFrequencyPenalty(frequencyPenalty: number): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.frequency_penalty = frequencyPenalty;
    return this;
  }

  /**
   * Sets the presence penalty for topic diversity.
   * 
   * @param {number} presencePenalty - Penalty value (typically between -2.0 and 2.0)
   * @returns {this} Builder instance for method chaining
   */
  withPresencePenalty(presencePenalty: number): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.presence_penalty = presencePenalty;
    return this;
  }

  /**
   * Sets token biases for controlling generation.
   * 
   * @param {Record<string, number>} logitBias - Token ID to bias mapping
   * @returns {this} Builder instance for method chaining
   */
  withLogitBias(logitBias: Record<string, number>): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.logit_bias = logitBias;
    return this;
  }

  /**
   * Sets the number of logprobs to return.
   * 
   * @param {number} logprobs - Number of logprobs to return
   * @returns {this} Builder instance for method chaining
   */
  withLogprobs(logprobs: number): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.logprobs = logprobs;
    return this;
  }

  /**
   * Sets stop sequences for response termination.
   * 
   * @param {...string} stopSequences - Sequences that terminate generation
   * @returns {this} Builder instance for method chaining
   */
  withStopSequences(...stopSequences: string[]): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.stop_sequences = stopSequences;
    return this;
  }

  /**
   * Removes all parameters from the template.
   * 
   * @returns {this} Builder instance for method chaining
   */
  withoutParameters(): this {
    delete this.definition.parameters;
    return this;
  }

  /**
   * Sets the prompt type for the template.
   * 
   * @param {TemplateDefinition['prompt_type']} promptType - Type of prompt
   * @returns {this} Builder instance for method chaining
   */
  withPromptType(promptType: TemplateDefinition['prompt_type']): this {
    this.definition.prompt_type = promptType;
    return this;
  }

  /**
   * Removes the prompt type setting.
   * 
   * @returns {this} Builder instance for method chaining
   */
  withoutPromptType(): this {
    delete this.definition.prompt_type;
    return this;
  }

  /**
   * Sets the task description for the template.
   * 
   * @param {string} taskDescription - Description of the task
   * @returns {this} Builder instance for method chaining
   */
  withTaskDescription(taskDescription: string): this {
    this.definition.task_description = taskDescription;
    return this;
  }

  /**
   * Removes the task description.
   * 
   * @returns {this} Builder instance for method chaining
   */
  withoutTaskDescription(): this {
    delete this.definition.task_description;
    return this;
  }

  /**
   * Adds example outputs for the template.
   * 
   * @param {...string} exampleOutputs - Example outputs to add
   * @returns {this} Builder instance for method chaining
   */
  withExampleOutputs(...exampleOutputs: string[]): this {
    this.definition.example_outputs = [
      ...(this.definition.example_outputs || []),
      ...exampleOutputs,
    ];
    return this;
  }

  /**
   * Removes specified example outputs.
   * 
   * @param {...string} outputs - Example outputs to remove
   * @returns {this} Builder instance for method chaining
   */
  withoutExampleOutputs(...outputs: string[]): this {
    if (this.definition.example_outputs) {
      this.definition.example_outputs = this.definition.example_outputs.filter(
        (o) => !outputs.includes(o),
      );
      if (this.definition.example_outputs.length === 0) delete this.definition.example_outputs;
    }
    return this;
  }

  /**
   * Adds a custom input validator for an input variable.
   * 
   * @param {string} name - Input variable name
   * @param {(value: any) => boolean} validator - Custom validation function
   * @returns {this} Builder instance for method chaining
   */
  withCustomInputValidator(name: string, validator: (value: any) => boolean): this {
    if (this.definition.input_variables && this.definition.input_variables[name]) {
      this.definition.input_variables[name] = {
        ...this.definition.input_variables[name],
        customValidator: validator,
      };
    }
    return this;
  }

  /**
   * Adds a conditional statement to the template content.
   * 
   * @param {string} condition - Condition to evaluate
   * @param {string} trueContent - Content to render if condition is true
   * @param {string} falseContent - Content to render if condition is false
   * @returns {this} Builder instance for method chaining
   */
  withConditional(condition: string, trueContent: string, falseContent: string): this {
    this.definition.content =
      (this.definition.content || '') +
      `{{#if ${condition}}}${trueContent}{{else}}${falseContent}{{/if}}`;
    return this;
  }

  /**
   * Merges another template definition into the current one.
   * 
   * @param {TemplateDefinitionBuilder} other - Template definition to merge
   * @returns {this} Builder instance for method chaining
   */
  merge(other: TemplateDefinitionBuilder): this {
    this.definition = {
      ...this.definition,
      ...other.definition,
      input_variables: {
        ...(this.definition.input_variables || {}),
        ...(other.definition.input_variables || {}),
      },
      output_variables: {
        ...(this.definition.output_variables || {}),
        ...(other.definition.output_variables || {}),
      },
      tags: [...new Set([...(this.definition.tags || []), ...(other.definition.tags || [])])],
      categories: [
        ...new Set([...(this.definition.categories || []), ...(other.definition.categories || [])]),
      ],
    };
    return this;
  }

  /**
   * Validates the template definition.
   * 
   * @returns {string[]} List of validation errors
   */
  validate(): string[] {
    const errors: string[] = [];
    try {
      templateDefinitionSchema.parse(this.definition);

      // Additional custom validation
      if (this.definition.input_variables) {
        for (const [name, variable] of Object.entries(this.definition.input_variables)) {
          if (variable.customValidator && variable.default !== undefined) {
            if (!variable.customValidator(variable.default)) {
              errors.push(`Custom validation failed for input variable '${name}'`);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map((e) => e.message));
      }
    }
    return errors;
  }

  /**
   * Generates a prompt from the template definition and input values.
   * 
   * @param {Record<string, any>} inputs - Input values to substitute
   * @returns {string} Generated prompt
   */
  generatePrompt(inputs: Record<string, any>): string {
    let content = this.definition.content || '';
    for (const [key, value] of Object.entries(inputs)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(value));
    }
    return content;
  }

  /**
   * Converts the template definition to JSON.
   * 
   * @returns {string} JSON representation of the template definition
   */
  toJSON(): string {
    return JSON.stringify(this.definition, null, 2);
  }

  /**
   * Converts the template definition to YAML.
   * 
   * @returns {string} YAML representation of the template definition
   */
  toYAML(): string {
    return yaml.dump(this.definition, {
      skipInvalid: true,
      noRefs: true,
      noCompatMode: true,
      lineWidth: -1, // Don't wrap long lines
    });
  }

  /**
   * Creates a template definition builder from a JSON string.
   * 
   * @static
   * @param {string} json - JSON string to parse
   * @returns {TemplateDefinitionBuilder} New builder instance
   */
  static fromJSON(json: string): TemplateDefinitionBuilder {
    const parsed = JSON.parse(json);
    return new TemplateDefinitionBuilder(parsed);
  }

  /**
   * Creates a template definition builder from a YAML string.
   * 
   * @static
   * @param {string} yamlString - YAML string to parse
   * @returns {TemplateDefinitionBuilder} New builder instance
   */
  static fromYAML(yamlString: string): TemplateDefinitionBuilder {
    const parsed = yaml.load(yamlString) as Partial<TemplateDefinition>;
    return new TemplateDefinitionBuilder(parsed);
  }

  /**
   * Builds the final template definition.
   * 
   * @returns {TemplateDefinition} Final template definition
   * @throws {Error} If validation fails
   */
  build(): TemplateDefinition {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`Template validation failed: ${errors.join(', ')}`);
    }
    return templateDefinitionSchema.parse(this.definition);
  }
}

/**
 * Creates a template variable with validation.
 * 
 * @param {TemplateVariable['type']} type - Variable type
 * @param {string} description - Variable description
 * @param {Partial<Omit<TemplateVariable, 'type' | 'description'>>} options - Additional options
 * @returns {TemplateVariable} Validated template variable
 */
export function createTemplateVariable(
  type: TemplateVariable['type'],
  description: string,
  options: Partial<Omit<TemplateVariable, 'type' | 'description'>> = {},
): TemplateVariable {
  return templateVariableSchema.parse({ type, description, ...options });
}

/**
 * Creates an output variable with validation.
 * 
 * @param {OutputVariable['type']} type - Output variable type
 * @param {Partial<Omit<OutputVariable, 'type'>>} options - Additional options
 * @returns {OutputVariable} Validated output variable
 */
export function createOutputVariable(
  type: OutputVariable['type'],
  options: Partial<Omit<OutputVariable, 'type'>> = {},
): OutputVariable {
  return outputVariableSchema.parse({ type, ...options });
}

/**
 * Generates a prompt from a template definition and input values.
 * 
 * @param {TemplateDefinition} template - Template definition
 * @param {Record<string, any>} inputs - Input values to substitute
 * @returns {string} Generated prompt
 */
export function generatePromptFromTemplate(
  template: TemplateDefinition,
  inputs: Record<string, any>,
): string {
  let content = template.content || '';
  for (const [key, value] of Object.entries(inputs)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, String(value));
  }
  return content;
}
