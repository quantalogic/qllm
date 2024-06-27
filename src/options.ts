import { Option } from 'commander';

export const maxTokensOption = new Option('-t, --max-tokens <number>', 'Maximum number of tokens to generate')
    .default(256)
    .argParser(parseInt);

export const temperatureOption = new Option('--temperature <number>', 'Temperature for response generation')
    .default(0.7)
    .argParser(parseFloat);

export const topPOption = new Option('--top-p <number>', 'Top P for response generation')
    .default(1)
    .argParser(parseFloat);

export const topKOption = new Option('--top-k <number>', 'Top K for response generation')
    .default(250)
    .argParser(parseInt);

export const systemOption = new Option('-s, --system <message>', 'System message to set context');

export const fileOption = new Option('-f, --file <path>', 'Path to input file');

export const outputOption = new Option('-o, --output <path>', 'Path to output file');

export const formatOption = new Option('--format <format>', 'Output format (json, markdown, text)')
    .choices(['json', 'markdown', 'text'])
    .default('text');
