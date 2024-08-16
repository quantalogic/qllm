import { logger } from './logger';
import { LLMProviderOptions } from '../providers/types';

type OptionValue = string | number | boolean | undefined;

function formatValue(value: OptionValue): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return 'undefined';
}


export function displayOptions(options: LLMProviderOptions, commandName: string): void {
  logger.debug(`Options for ${commandName} command:`);
  Object.entries(options).forEach(([key, value]) => {
    const formattedValue = formatValue(value);
    logger.debug(`  ${key}: ${formattedValue}`);
  });
}