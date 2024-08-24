#!/usr/bin/env node

import { Command } from 'commander';
import { askCommand } from './commands/ask';
import { listCommand } from './commands/list-command';
import { chatCommand } from './commands/chat-command';

const VERSION = '1.7.0';

export async function main() {
  try {
    const program = new Command();

    program
      .version(VERSION)
      .description('Multi-Provider LLM Command CLI - qllm. Created with ❤️ by @quantalogic.')
      .option('--log-level <level>', 'Set log level (error, warn, info, debug)')
      .option('--config <path>', 'Path to configuration file');

    // Add the ask command
    program.addCommand(askCommand);

    // Add the list command
    program.addCommand(listCommand);

    // Add chat command
    program.addCommand(chatCommand);

    // Add other commands here as needed
    // For example:
    // program.addCommand(generateEmbeddingCommand);

    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export default main;