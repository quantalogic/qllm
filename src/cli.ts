#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import { createAskCommand } from './commands/ask';
import { createConfigCommand } from './commands/config';
import { createStreamCommand } from './commands/stream';
import { createChatCommand } from './commands/chat';
import { DEFAULT_PROVIDER } from './config/provider_config';
import { logger } from './utils/logger';
import { resolveModel } from './config';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const program = new Command();

// Global options
program
  .version('1.0.0')
  .description('Multi-Provider LLM Command CLI')
  .option('-p, --profile <profile>', 'AWS profile to use', process.env.AWS_PROFILE)
  .option('-r, --region <region>', 'AWS region to use', process.env.AWS_REGION)
  .option('--provider <provider>', 'LLM provider to use', DEFAULT_PROVIDER)
  .option('--modelid <modelid>', 'Specific model ID to use')
  .option('--model <model>', 'Model alias to use')
  .option('--log-level <level>', 'Set log level (error, warn, info, debug)', 'info')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    options.resolvedModel = resolveModel(options.modelid, options.model);
    logger.setLogLevel(options.logLevel);
  });

// Register commands
program.addCommand(createAskCommand());
program.addCommand(createConfigCommand());
program.addCommand(createStreamCommand());
program.addCommand(createChatCommand());

// Error handling for unknown commands
program.on('command:*', () => {
  logger.error(`Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`);
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
