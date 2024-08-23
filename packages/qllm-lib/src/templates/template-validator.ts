// Validator.ts

import { ErrorManager } from '../utils/error';
import { TemplateDefinition } from './types';

type ValidatorType = 'string' | 'number' | 'boolean' | 'array';

interface VariableDefinition {
  type: ValidatorType;
  default?: any;
}

export class TemplateValidator {
  static validateInputVariables(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): void {
    const inputVariables = template.input_variables || {};
    for (const [key, variable] of Object.entries(inputVariables)) {
      if (!(key in variables) && !('default' in variable)) {
        ErrorManager.throwError('InputValidationError', `Missing required input variable: ${key}`);
      }
      this.validateVariableType(key, variables[key], variable as VariableDefinition);
    }
  }

  private static validateVariableType(key: string, value: any, variable: VariableDefinition): void {
    if (value === undefined && 'default' in variable) return;

    const typeValidators: Record<ValidatorType, (v: any) => boolean> = {
      string: (v: any): v is string => typeof v === 'string',
      number: (v: any): boolean => typeof v === 'number' || !isNaN(Number(v)),
      boolean: (v: any): boolean =>
        typeof v === 'boolean' || ['true', 'false'].includes(String(v).toLowerCase()),
      array: (v: any): v is any[] | string => Array.isArray(v) || typeof v === 'string',
    };

    const validator = typeValidators[variable.type];
    if (!validator) {
      ErrorManager.throwError(
        'InputValidationError',
        `Unknown variable type for ${key}: ${variable.type}`,
      );
    }

    if (!validator(value)) {
      ErrorManager.throwError(
        'InputValidationError',
        `Invalid type for ${key}: expected ${variable.type}`,
      );
    }
  }
}