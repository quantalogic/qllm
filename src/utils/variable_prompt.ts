// src/utils/variable_prompt.ts
import prompts from 'prompts';
import { TemplateVariable } from '../templates/types';
import { logger } from './logger';

export async function promptForMissingVariables(
  variables: Record<string, TemplateVariable>,
  providedValues: Record<string, any>
): Promise<Record<string, any>> {
  const missingVariables = Object.entries(variables).filter(
    ([key, _]) => !(key in providedValues)
  );

  const results: Record<string, any> = { ...providedValues };

  for (const [key, variable] of missingVariables) {
    const result = await prompts({
      type: getPromptType(variable.type) as prompts.PromptType,
      name: key,
      message: getPromptMessage(key, variable),
      initial: variable.default,
      validate: (value) => validateInput(value, variable)
    });

    results[key] = result[key];
  }

  return results;
}

function getPromptType(variableType: string): prompts.PromptType {
  switch (variableType) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'confirm';
    case 'array':
      return 'list';
    default:
      return 'text';
  }
}

function getPromptMessage(key: string, variable: TemplateVariable): string {
  let message = `Enter value for ${key} (${variable.description})`;
  if ('default' in variable) {
    message += ` [default: ${formatDefaultValue(variable)}]`;
  }
  return message + ':';
}

function formatDefaultValue(variable: TemplateVariable): string {
  if (variable.type === 'string') {
    return `"${variable.default}"`;
  } else if (variable.type === 'array') {
    return JSON.stringify(variable.default);
  } else {
    return String(variable.default);
  }
}

function validateInput(value: any, variable: TemplateVariable): boolean | string {
  if (value === undefined || value === '') {
    if ('default' in variable) {
      return true; // Allow empty input if there's a default value
    }
    return 'This field is required';
  }

  switch (variable.type) {
    case 'number':
      return !isNaN(value) || 'Please enter a valid number';
    case 'boolean':
      return typeof value === 'boolean' || 'Please enter true or false';
    case 'array':
      return Array.isArray(value) || 'Please enter a comma-separated list';
    default:
      return true;
  }
}