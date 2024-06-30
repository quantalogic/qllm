#!/usr/bin/env node

import { Command } from 'commander';
import { createAskCommand } from './commands/ask';
import { createConfigCommand } from './commands/config';
import { createStreamCommand } from './commands/stream';
import { createChatCommand } from './commands/chat';
import { getAwsProfile, getAwsRegion, getDefaultProvider, getModelAlias } from './config/config';
import { logger } from './utils/logger';
import { ProviderName } from './config/types';
import {resolveModelAlias } from "./config/model_aliases";

const program = new Command();

// Global options
program
  .version('1.0.0')
  .description('Multi-Provider LLM Command CLI - qllm. Created with ❤️ by @quantalogic.')
  .option('-p, --profile <profile>', 'AWS profile to use', getAwsProfile())
  .option('-r, --region <region>', 'AWS region to use', getAwsRegion())
  .option('--provider <provider>', 'LLM provider to use', getDefaultProvider())
  .option('--modelid <modelid>', 'Specific model ID to use')
  .option('--model <model>', 'Model alias to use', getModelAlias())
  .option('--log-level <level>', 'Set log level (error, warn, info, debug)', 'info')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    options.resolvedModel = resolveModelAlias(
      options.provider as ProviderName,
      options.model
    );
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