#!/usr/bin/env node

import { Command } from 'commander';
import { createAskCommand } from './commands/ask';
import { createStreamCommand } from './commands/stream';
import { createChatCommand } from './commands/chat';
import { createConfigCommand } from './commands/config';
import { createTemplateCommand } from './commands/template';
import { configManager } from './utils/configuration_manager';
import { logger } from './utils/logger';
import { resolveModelAlias } from "./config/model_aliases";
import { ErrorManager } from './utils/error_manager';
import { ProviderFactory } from './providers/provider_factory';
import { ProviderName } from './config/types';
import { templateManager } from './templates/template_manager';

const VERSION = '1.0.0'; 

async function main() {
  try {
    const program = new Command();

    program
      .version(VERSION)
      .description('Multi-Provider LLM Command CLI - qllm. Created with ❤️ by @quantalogic.')
      .option('-p, --profile <profile>', 'AWS profile to use')
      .option('-r, --region <region>', 'AWS region to use')
      .option('--provider <provider>', 'LLM provider to use')
      .option('--modelid <modelid>', 'Specific model ID to use')
      .option('--model <model>', 'Model alias to use')
      .option('--log-level <level>', 'Set log level (error, warn, info, debug)')
      .option('--prompts-dir <dir>', 'Set the directory for prompt templates')
      .option('--config <path>', 'Path to configuration file');

    program.hook('preAction', async (thisCommand) => {
      try {
        const options = thisCommand.opts();

        // Load configuration
        await configManager.loadConfig(options);
        const config = configManager.getConfig();

        logger.setLogLevel(config.logLevel || 'info');

        // Initialize template manager
        if (options.promptsDir) {
          await templateManager.setPromptDirectory(options.promptsDir);
        }
        logger.debug(`Using prompts directory: ${config.promptDirectory}`);
        await templateManager.init();

        // Update configuration with CLI options
        configManager.updateConfig({
          awsProfile: options.profile,
          awsRegion: options.region,
          defaultProvider: options.provider as ProviderName,
          defaultModelAlias: options.model,
          defaultModelId: options.modelid,
        });

  
        // Set AWS environment variables if provided
        if (config.awsProfile) {
          logger.debug(`Setting AWS profile: ${config.awsProfile}`);
          process.env.AWS_PROFILE = config.awsProfile;
        }
        if (config.awsRegion) {
          logger.debug(`Setting AWS region: ${config.awsRegion}`);
          process.env.AWS_REGION = config.awsRegion;
        }

        // Set log level
        logger.setLogLevel(config.logLevel || 'info');
        logger.debug(`Configuration: ${JSON.stringify(configManager.getConfig())}`);

        // Initialize provider
        if (config.defaultProvider) {
          await ProviderFactory.getProvider(config.defaultProvider as ProviderName);
        }
      } catch (error) {
        ErrorManager.handleError('PreActionError', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

    // Register commands
    program.addCommand(createAskCommand());
    program.addCommand(createStreamCommand());
    program.addCommand(createChatCommand());
    program.addCommand(createConfigCommand());
    program.addCommand(createTemplateCommand());

    // Error handling for unknown commands
    program.on('command:*', () => {
      logger.error(`Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`);
      process.exit(1);
    });

    // Parse command line arguments
    await program.parseAsync(process.argv);

    // If no arguments, show help
    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  } catch (error) {
    ErrorManager.handleError('MainError', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();