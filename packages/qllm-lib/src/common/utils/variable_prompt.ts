// src/utils/variable_prompt.ts
import prompts from 'prompts';
import { TemplateVariable } from '../../types/templates';

/**
 * Prompts for missing variables based on the template definition.
 * @param variables The template variables definition.
 * @param providedValues The values already provided.
 * @returns A promise that resolves to a record of all variable values.
 */
export async function promptForMissingVariables(
  variables: Record<string, TemplateVariable>,
  providedValues: Record<string, string>,
): Promise<Record<string, string>> {
  const missingVariables = Object.entries(variables).filter(
    ([key, _variable]) => !(key in providedValues) || providedValues[key] === '',
  );

  const results: Record<string, string> = { ...providedValues };

  for (const [key, variable] of missingVariables) {
    const result = await prompts({
      type: getPromptType(variable.type),
      name: key,
      message: getPromptMessage(key, variable),
      initial: variable.default,
      validate: (value) => validateInput(value, variable),
    });

    results[key] = result[key];
  }

  return results;
}

/**
 * Determines the prompt type based on the variable type.
 * @param variableType The type of the variable.
 * @returns The corresponding prompts type.
 */
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

/**
 * Generates the prompt message for a variable.
 * @param key The variable key.
 * @param variable The variable definition.
 * @returns The formatted prompt message.
 */
function getPromptMessage(key: string, variable: TemplateVariable): string {
  let message = `Enter value for ${key} (${variable.description})`;
  if ('default' in variable) {
    message += ` [default: ${formatDefaultValue(variable)}]`;
  }
  return message + ':';
}

/**
 * Formats the default value for display in the prompt message.
 * @param variable The variable definition.
 * @returns The formatted default value as a string.
 */
function formatDefaultValue(variable: TemplateVariable): string {
  if (variable.type === 'string') {
    return `"${variable.default}"`;
  } else if (variable.type === 'array') {
    return JSON.stringify(variable.default);
  } else {
    return String(variable.default);
  }
}

/**
 * Validates the input value against the variable definition.
 * @param value The input value to validate.
 * @param variable The variable definition.
 * @returns True if valid, or an error message string if invalid.
 */
function validateInput(value: any, variable: TemplateVariable): boolean | string {
  if (value === undefined || value === '') {
    if ('default' in variable) {
      return true; // Allow empty input if there's a default value
    }
    return 'This field is required';
  }

  switch (variable.type) {
    case 'number':
      return !isNaN(Number(value)) || 'Please enter a valid number';
    case 'boolean':
      return (
        typeof value === 'boolean' ||
        ['true', 'false'].includes(value.toLowerCase()) ||
        'Please enter true or false'
      );
    case 'array':
      return (
        Array.isArray(value) || typeof value === 'string' || 'Please enter a comma-separated list'
      );
    default:
      return true;
  }
}
