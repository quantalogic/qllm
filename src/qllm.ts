#!/usr/bin/env node

import { Command } from 'commander';
import { createAskCommand } from './commands/ask';
import { createStreamCommand } from './commands/stream';
import { createChatCommand } from './commands/chat';
import { createConfigCommand } from './commands/config';
import { configManager } from './utils/configuration_manager';
import { logger } from './utils/logger';
import { resolveModelAlias } from "./config/model_aliases";
import { handleError } from './utils/error_handler';
import { ProviderName } from './config/types';

async function main() {
  try {
    const program = new Command();

    program
      .version('0.6.1')
      .description('Multi-Provider LLM Command CLI - qllm. Created with ❤️ by @quantalogic.')
      .option('-p, --profile <profile>', 'AWS profile to use')
      .option('-r, --region <region>', 'AWS region to use')
      .option('--provider <provider>', 'LLM provider to use')
      .option('--modelid <modelid>', 'Specific model ID to use')
      .option('--model <model>', 'Model alias to use')
      .option('--log-level <level>', 'Set log level (error, warn, info, debug)', 'info')
      .hook('preAction', async (thisCommand) => {
        try {
          const options = thisCommand.opts();

          if (options.modelAlias && options.modelId) {
            throw new Error('Cannot use both model alias and model ID. Please specify only one.');
          }

          await configManager.loadConfig();
          configManager.updateConfig({
            awsProfile: options.profile,
            awsRegion: options.region,
            defaultProvider: options.provider,
            modelAlias: options.model,
            modelId: options.modelid,
          });

          const config = configManager.getConfig();

          if (config.modelAlias) {
            logger.debug(`Resolving model alias: ${config.modelAlias}`);
            const modelId = resolveModelAlias(config.defaultProvider as ProviderName, config.modelAlias);
            logger.debug(`Resolved model alias to: ${modelId}`);
            configManager.updateConfig({ modelId: modelId });
          }

          if (config.awsProfile) {
            // This is very important for the AWS SDK to work correctly
            logger.debug(`Setting Env AWS profile: ${config.awsProfile}`);
            process.env.AWS_PROFILE = config.awsProfile;
          }

          if (config.awsRegion) {
            // This is very important for the AWS SDK to work correctly
            logger.debug(`Setting Env AWS region: ${config.awsRegion}`);
            process.env.AWS_REGION = config.awsRegion;
          }

          logger.setLogLevel(options.logLevel);
          logger.debug(`Configuration: ${JSON.stringify(configManager.getConfig())}`);
        } catch (error) {
          handleError(error);
          process.exit(1);
        }
      });

    // Register commands
    program.addCommand(createAskCommand());
    program.addCommand(createStreamCommand());
    program.addCommand(createChatCommand());
    program.addCommand(createConfigCommand());

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
    handleError(error);
    process.exit(1);
  }
}

main();