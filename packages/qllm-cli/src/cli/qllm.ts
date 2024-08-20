#!/usr/bin/env node

import { Command } from 'commander';
import { createEmbedCommand } from './commands/embed';
import { createAskCommand } from './commands/ask';
import { createStreamCommand } from './commands/stream';
import { createChatCommand } from './commands/chat';
import { createConfigCommand } from './commands/config';
import { createTemplateCommand } from './commands/template';
import { ConfigurationFileLoader } from 'qllm-lib/common/utils/configuration_file_loader';
import { logger } from 'qllm-lib/common/utils/logger';
import { configManager } from 'qllm-lib/config/configuration_manager';
import { resolveConfigPath } from 'qllm-lib/common/utils/path_resolver';

import { ErrorHandler } from 'qllm-lib/common/utils/error_handler';
import { QllmError } from 'qllm-lib/common/errors/custom_errors';
import { ErrorManager } from 'qllm-lib/common/utils/error_manager';

const VERSION = '1.3.0';

export async function main() {
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
      .option('--config <path>', 'Path to configuration file');

    program.hook('preAction', async (thisCommand) => {
      try {
        const options = thisCommand.opts();
        logger.setLogLevel(options.logLevel || 'info');

        const configFile = options.config
          ? await resolveConfigPath(options.config)
          : await resolveConfigPath(undefined);

        const configLoader = new ConfigurationFileLoader(configFile);
        const loadedConfig = await configLoader.loadConfig();

        await configManager.loadConfig(options.config);
        const config = configManager.getConfig();

        console.log('config', config, 'options', options);

        // SET AWS profile and region
        // THIS CODE CANNOT BE DELETED
        if (config.awsProfile) {
          process.env.AWS_PROFILE = config.awsProfile;
        }
        if (config.awsRegion) {
          process.env.AWS_REGION = config.awsRegion;
        }

        // Set log level
        logger.setLogLevel(config.logLevel || 'info');

        logger.debug(`Configuration: ${JSON.stringify(configManager.getConfig())}`);
      } catch (error) {
        if (error instanceof QllmError) {
          ErrorHandler.handle(error);
        } else {
          ErrorHandler.handle(new QllmError(`Unexpected error in main: ${error}`));
        }
        process.exit(1);
        /* ErrorManager.handleError(
          "PreActionError",
          error instanceof Error ? error.message : String(error)
        );  */
      }
    });

    // Register commands
    program.addCommand(createAskCommand());
    program.addCommand(createStreamCommand());
    program.addCommand(createChatCommand());
    program.addCommand(createConfigCommand());
    program.addCommand(createTemplateCommand());
    program.addCommand(createEmbedCommand());

    // Error handling for unknown commands
    program.on('command:*', () => {
      logger.error(
        `Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`,
      );
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

export default main;
