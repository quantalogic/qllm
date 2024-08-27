// packages/qllm-lib/src/templates/template-definition-builder.ts

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

export class TemplateDefinitionBuilder {
  private definition: Partial<TemplateDefinitionWithResolvedContent>;

  private constructor(definition: Partial<TemplateDefinition>) {
    this.definition = definition;
  }

  static fromTemplate(template: TemplateDefinition): TemplateDefinitionBuilder {
    return new TemplateDefinitionBuilder(template);
  }

  static create(
    name: string,
    version: string,
    description: string,
    author: string,
    content: string,
  ): TemplateDefinitionBuilder {
    return new TemplateDefinitionBuilder({
      name,
      version,
      description,
      author,
      content,
      provider: 'OpenAI',
      model: 'gpt-3.5-turbo',
      prompt_type: 'text_generation',
      parameters: {
        max_tokens: 100,
        temperature: 0.7,
      },
    });
  }

  static quickSetup(name: string, content: string): TemplateDefinitionBuilder {
    return TemplateDefinitionBuilder.create(
      name,
      '1.0.0',
      `Template for ${name}`,
      'AI Assistant',
      content,
    );
  }

  setResolvedContent(content: string): this {
    this.definition.resolved_content = content;
    return this;
  }

  clone(): TemplateDefinitionBuilder {
    return new TemplateDefinitionBuilder(JSON.parse(JSON.stringify(this.definition)));
  }

  private createTemplateVariable(
    type: TemplateVariable['type'],
    description: string,
    options: Partial<Omit<TemplateVariable, 'type' | 'description'>> = {},
  ): TemplateVariable {
    return templateVariableSchema.parse({ type, description, ...options });
  }

  private createOutputVariable(
    type: OutputVariable['type'],
    options: Partial<Omit<OutputVariable, 'type'>> = {},
  ): OutputVariable {
    return outputVariableSchema.parse({ type, ...options });
  }

  withProvider(provider: string): this {
    this.definition.provider = provider;
    return this;
  }

  withoutProvider(): this {
    delete this.definition.provider;
    return this;
  }

  withTags(...tags: string[]): this {
    this.definition.tags = [...(this.definition.tags || []), ...tags];
    return this;
  }

  withoutTags(...tags: string[]): this {
    if (this.definition.tags) {
      this.definition.tags = this.definition.tags.filter((t) => !tags.includes(t));
      if (this.definition.tags.length === 0) delete this.definition.tags;
    }
    return this;
  }

  withCategories(...categories: string[]): this {
    this.definition.categories = [...(this.definition.categories || []), ...categories];
    return this;
  }

  withoutCategories(...categories: string[]): this {
    if (this.definition.categories) {
      this.definition.categories = this.definition.categories.filter(
        (c) => !categories.includes(c),
      );
      if (this.definition.categories.length === 0) delete this.definition.categories;
    }
    return this;
  }

  withModel(model: string): this {
    this.definition.model = model;
    return this;
  }

  withoutModel(): this {
    delete this.definition.model;
    return this;
  }

  withInputVariable(name: string, variable: TemplateVariable): this;
  withInputVariable(
    name: string,
    type: TemplateVariable['type'],
    description: string,
    options?: Partial<Omit<TemplateVariable, 'type' | 'description'>>,
  ): this;
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

  withoutInputVariable(name: string): this {
    if (this.definition.input_variables) {
      delete this.definition.input_variables[name];
      if (Object.keys(this.definition.input_variables).length === 0) {
        delete this.definition.input_variables;
      }
    }
    return this;
  }

  withOutputVariable(name: string, variable: OutputVariable): this;
  withOutputVariable(
    name: string,
    type: OutputVariable['type'],
    options?: Partial<Omit<OutputVariable, 'type'>>,
  ): this;
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

  withoutOutputVariable(name: string): this {
    if (this.definition.output_variables) {
      delete this.definition.output_variables[name];
      if (Object.keys(this.definition.output_variables).length === 0) {
        delete this.definition.output_variables;
      }
    }
    return this;
  }

  withParameters(parameters: TemplateDefinition['parameters']): this {
    this.definition.parameters = { ...this.definition.parameters, ...parameters };
    return this;
  }

  withoutParameters(): this {
    delete this.definition.parameters;
    return this;
  }

  withPromptType(promptType: TemplateDefinition['prompt_type']): this {
    this.definition.prompt_type = promptType;
    return this;
  }

  withoutPromptType(): this {
    delete this.definition.prompt_type;
    return this;
  }

  withTaskDescription(taskDescription: string): this {
    this.definition.task_description = taskDescription;
    return this;
  }

  withoutTaskDescription(): this {
    delete this.definition.task_description;
    return this;
  }

  withExampleOutputs(...exampleOutputs: string[]): this {
    this.definition.example_outputs = [
      ...(this.definition.example_outputs || []),
      ...exampleOutputs,
    ];
    return this;
  }

  withoutExampleOutputs(...outputs: string[]): this {
    if (this.definition.example_outputs) {
      this.definition.example_outputs = this.definition.example_outputs.filter(
        (o) => !outputs.includes(o),
      );
      if (this.definition.example_outputs.length === 0) delete this.definition.example_outputs;
    }
    return this;
  }

  withCustomInputValidator(name: string, validator: (value: any) => boolean): this {
    if (this.definition.input_variables && this.definition.input_variables[name]) {
      this.definition.input_variables[name] = {
        ...this.definition.input_variables[name],
        customValidator: validator,
      };
    }
    return this;
  }

  withConditional(condition: string, trueContent: string, falseContent: string): this {
    this.definition.content =
      (this.definition.content || '') +
      `{{#if ${condition}}}${trueContent}{{else}}${falseContent}{{/if}}`;
    return this;
  }

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

  generatePrompt(inputs: Record<string, any>): string {
    let content = this.definition.content || '';
    for (const [key, value] of Object.entries(inputs)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(value));
    }
    return content;
  }

  toJSON(): string {
    return JSON.stringify(this.definition, null, 2);
  }

  toYAML(): string {
    return yaml.dump(this.definition, {
      skipInvalid: true,
      noRefs: true,
      noCompatMode: true,
      lineWidth: -1, // Don't wrap long lines
    });
  }

  static fromJSON(json: string): TemplateDefinitionBuilder {
    const parsed = JSON.parse(json);
    return new TemplateDefinitionBuilder(parsed);
  }

  static fromYAML(yamlString: string): TemplateDefinitionBuilder {
    const parsed = yaml.load(yamlString) as Partial<TemplateDefinition>;
    return new TemplateDefinitionBuilder(parsed);
  }

  build(): TemplateDefinition {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`Template validation failed: ${errors.join(', ')}`);
    }
    return templateDefinitionSchema.parse(this.definition);
  }
}

// Convenience methods
export function createTemplateVariable(
  type: TemplateVariable['type'],
  description: string,
  options: Partial<Omit<TemplateVariable, 'type' | 'description'>> = {},
): TemplateVariable {
  return templateVariableSchema.parse({ type, description, ...options });
}

export function createOutputVariable(
  type: OutputVariable['type'],
  options: Partial<Omit<OutputVariable, 'type'>> = {},
): OutputVariable {
  return outputVariableSchema.parse({ type, ...options });
}

// Add this function at the end of the file
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
