// src/templates/template.ts

import fs from 'fs/promises';
import yaml from 'js-yaml';
import { TemplateDefinition, TemplateVariable } from './types';
import { ErrorManager } from '../utils/error';
import { InputValidationError } from './types';
import axios from 'axios';

export class Template {
  private definition: TemplateDefinition;

  constructor(definition: TemplateDefinition) {
    this.definition = definition;
  }

  static async fromUrl(url: string): Promise<Template> {
    try {
      const response = await axios.get(url);
      const content = response.data;
      return Template.fromYaml(content);
    } catch (error) {
      ErrorManager.throw(InputValidationError, `Failed to fetch template from URL: ${error}`);
    }
  }

  static async fromPath(filePath: string): Promise<Template> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return Template.fromYaml(content);
    } catch (error) {
      ErrorManager.throw(InputValidationError, `Failed to read template from file: ${error}`);
    }
  }

  static fromYaml(content: string): Template {
    const definition = yaml.load(content) as TemplateDefinition;
    if (!definition || typeof definition !== 'object') {
      ErrorManager.throw(InputValidationError, 'Invalid template structure');
    }
    return new Template(definition);
  }

  get name(): string {
    return this.definition.name;
  }

  get content(): string {
    return this.definition.content;
  }

  get inputVariables(): Record<string, TemplateVariable> {
    return this.definition.input_variables;
  }

  set resolvedContent(content: string) {
    this.definition.resolved_content = content;
  }

  toYaml(): string {
    return yaml.dump(this.definition);
  }

  parseVariables(args: string[]): Record<string, any> {
    const variables: Record<string, any> = {};
    const variablePattern = /^-v:(\w+)$/;

    for (let i = 0; i < args.length; i++) {
      const match = args[i].match(variablePattern);
      if (match) {
        const variableName = match[1];
        const variableValue = args[i + 1];
        if (variableValue && !variableValue.startsWith('-')) {
          variables[variableName] = this.castVariable(variableName, variableValue);
          i++;
        }
      }
    }

    return variables;
  }

  private castVariable(key: string, value: string): any {
    if (this.inputVariables && this.inputVariables[key]) {
      const variableType = this.inputVariables[key].type;
      switch (variableType) {
        case 'number':
          return this.castToNumber(value, key);
        case 'boolean':
          return this.castToBoolean(value, key);
        case 'array':
          return this.castToArray(value);
        case 'string':
          return value;
        default:
          ErrorManager.throw(InputValidationError, `Unknown variable type '${variableType}' for variable '${key}'`);
      }
    }
    return value;
  }

  private castToNumber(value: string, key: string): number {
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
      ErrorManager.throw(InputValidationError, `Failed to cast '${value}' to number for variable '${key}'`);
    }
    return numberValue;
  }

  private castToBoolean(value: string, key: string): boolean {
    const lowerValue = value.toLowerCase();
    if (lowerValue !== 'true' && lowerValue !== 'false') {
      ErrorManager.throw(InputValidationError, `Failed to cast '${value}' to boolean for variable '${key}'. Use 'true' or 'false'`);
    }
    return lowerValue === 'true';
  }

  private castToArray(value: string): any[] {
    try {
      return JSON.parse(value);
    } catch {
      return value.split(',').map((item) => item.trim());
    }
  }

  toObject(): TemplateDefinition {
    return {
      ...this.definition,
    };
  }
}