import { Option } from 'commander';
import { ErrorManager } from './utils/error_manager';

function parseNumeric(value: string, min: number, max: number, defaultValue: number): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < min || parsed > max) {
    ErrorManager.throwError('InvalidOptionError', `Value must be a number between ${min} and ${max}`);
  }
  return parsed;
}

export const maxTokensOption = new Option('-t, --max-tokens <number>', 'Maximum number of tokens to generate')
  .default(256)
  .argParser((value) => parseNumeric(value, 1, 8192, 256));

export const temperatureOption = new Option('--temperature <number>', 'Temperature for response generation')
  .default(0.7)
  .argParser((value) => parseNumeric(value, 0, 1, 0.7));

export const topPOption = new Option('--top-p <number>', 'Top P for response generation')
  .default(1)
  .argParser((value) => parseNumeric(value, 0, 1, 1));

export const topKOption = new Option('--top-k <number>', 'Top K for response generation')
  .default(250)
  .argParser((value) => parseNumeric(value, 1, 1000, 250));

export const systemOption = new Option('-s, --system <message>', 'System message to set context');

export const fileOption = new Option('-f, --file <path>', 'Path to input file')
  .argParser((value) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      ErrorManager.throwError('InvalidOptionError', 'File path must be a non-empty string');
    }
    return value;
  });

export const outputOption = new Option('-o, --output <path>', 'Path to output file')
  .argParser((value) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      ErrorManager.throwError('InvalidOptionError', 'Output path must be a non-empty string');
    }
    return value;
  });

export const formatOption = new Option('--format <format>', 'Output format')
  .choices(['json', 'markdown', 'text'])
  .default('text');

export const cliOptions = {
  maxTokensOption,
  temperatureOption,
  topPOption,
  topKOption,
  systemOption,
  fileOption,
  outputOption,
  formatOption,
};