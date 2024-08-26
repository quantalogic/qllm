// src/templates/template.ts

import fs from 'fs/promises';
import yaml from 'js-yaml';
import { TemplateDefinition, TemplateVariable, OutputVariable } from './types';
import { ErrorManager } from '../utils/error';
import { InputValidationError } from './types';
import axios from 'axios';

export class Template implements TemplateDefinition {
  name!: string;
  version!: string;
  description!: string;
  author!: string;
  provider!: string;
  model!: string;
  input_variables!: Record<string, TemplateVariable>;
  output_variables?: Record<string, OutputVariable>;
  content!: string;
  parameters?: {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
  resolved_content?: string;

  constructor(definition: TemplateDefinition) {
    Object.assign(this, definition);
    this.extractVariablesFromContent();
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

  setResolvedContent(content: string): void {
    this.resolved_content = content;
  }

  toYaml(): string {
    return yaml.dump(this);
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
    if (this.input_variables && this.input_variables[key]) {
      const variableType = this.input_variables[key].type;
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
          ErrorManager.throw(
            InputValidationError,
            `Unknown variable type '${variableType}' for variable '${key}'`,
          );
      }
    }
    return value;
  }

  private castToNumber(value: string, key: string): number {
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
      ErrorManager.throw(
        InputValidationError,
        `Failed to cast '${value}' to number for variable '${key}'`,
      );
    }
    return numberValue;
  }

  private castToBoolean(value: string, key: string): boolean {
    const lowerValue = value.toLowerCase();
    if (lowerValue !== 'true' && lowerValue !== 'false') {
      ErrorManager.throw(
        InputValidationError,
        `Failed to cast '${value}' to boolean for variable '${key}'. Use 'true' or 'false'`,
      );
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
      ...this,
    };
  }
  private extractVariablesFromContent(
    options: {
      allowDotNotation?: boolean;
      allowBracketNotation?: boolean;
      allowFunctionCalls?: boolean;
    } = {},
  ): void {
    const {
      allowDotNotation = true,
      allowBracketNotation = false,
      allowFunctionCalls = false,
    } = options;

    // Build the regex pattern based on options
    const variableNamePattern = '[a-zA-Z_$][\\w$]*';
    const dotNotationPattern = allowDotNotation ? `(?:\\.${variableNamePattern})*` : '';
    const bracketNotationPattern = allowBracketNotation
      ? '(?:\\[(?:[^\\[\\]]*|\\[[^\\[\\]]*\\])*\\])*'
      : '';
    const functionCallPattern = allowFunctionCalls ? '(?:\\([^()]*\\))?' : '';

    const variablePattern = new RegExp(
      `{{\\s*(${variableNamePattern}${dotNotationPattern}${bracketNotationPattern}${functionCallPattern})\\s*}}`,
      'g',
    );

    const uniqueVariables = new Set<string>();
    let match;

    try {
      while ((match = variablePattern.exec(this.content)) !== null) {
        const variableExpression = match[1].trim();
        const rootVariable = variableExpression.split(/[.[(]/)[0];
        uniqueVariables.add(rootVariable);
      }

      uniqueVariables.forEach((variable) => {
        if (!this.input_variables[variable]) {
          this.input_variables[variable] = {
            type: 'string',
            description: `Variable ${variable} found in content`,
            inferred: true,
          };
        }
      });
    } catch (error) {
      console.error('Error extracting variables:', error);
      // Optionally, you could throw the error or handle it in a way that fits your application's needs
    }
  }
}
