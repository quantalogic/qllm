#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import { createAskCommand } from './commands/ask';
import { createConfigCommand } from './commands/config';
import { createStreamCommand } from './commands/stream';
import { createChatCommand } from './commands/chat';
import { DEFAULT_PROVIDER } from './config/provider_config';
import { logError } from './utils';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const program = new Command();

// Global options
program
  .version('1.0.0')
  .description('Multi-Provider LLM Command CLI')
  .option('-p, --profile <name>', 'AWS profile to use', process.env.AWS_PROFILE)
  .option('-r, --region <name>', 'AWS region to use', process.env.AWS_REGION)
  .option('--provider <name>', 'LLM provider to use', DEFAULT_PROVIDER)
  .option('--modelid <id>', 'Specific model ID to use')
  .option('--model <alias>', 'Model alias to use');

// Register commands
program.addCommand(createAskCommand());
program.addCommand(createConfigCommand());
program.addCommand(createStreamCommand());
program.addCommand(createChatCommand());

// Error handling for unknown commands
program.on('command:*', () => {
  logError(`Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`);
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
