import { logger } from './logger';
import { LLMProviderOptions } from '../providers/types';

type OptionValue = string | number | boolean | undefined;

function formatValue(value: OptionValue): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return 'undefined';
}

function isDefaultValue(key: string, value: OptionValue, defaults: Partial<LLMProviderOptions>): boolean {
  return defaults[key as keyof LLMProviderOptions] === value;
}

export function displayOptions(options: LLMProviderOptions, commandName: string): void {
  const defaults: Partial<LLMProviderOptions> = {
    maxTokens: 256,
    temperature: 0.7,
    topP: 1,
    topK: 250,
    model: '',
  };

  logger.debug(`Options for ${commandName} command:`);
  
  Object.entries(options).forEach(([key, value]) => {
    const formattedValue = formatValue(value);
    const isDefault = isDefaultValue(key, value, defaults);
    const defaultIndicator = isDefault ? ' (default)' : '';
    logger.debug(`  ${key}: ${formattedValue}${defaultIndicator}`);
  });
}