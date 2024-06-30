// src/qllm.ts

import { Command } from 'commander';
import { createAskCommand } from './commands/ask';
import { createConfigCommand } from './commands/config';
import { createStreamCommand } from './commands/stream';
import { createChatCommand } from './commands/chat';
import { configManager } from './utils/configuration_manager';
import { logger } from './utils/logger';
import { resolveModelAlias } from "./config/model_aliases";

const program = new Command();

program
  .version('1.0.0')
  .description('Multi-Provider LLM Command CLI - qllm. Created with ❤️ by @quantalogic.')
  .option('-p, --profile <profile>', 'AWS profile to use')
  .option('-r, --region <region>', 'AWS region to use')
  .option('--provider <provider>', 'LLM provider to use')
  .option('--modelid <modelid>', 'Specific model ID to use')
  .option('--model <model>', 'Model alias to use')
  .option('--log-level <level>', 'Set log level (error, warn, info, debug)', 'info')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    const config = configManager.getConfig();
    
    configManager.setCommandLineOptions({
      awsProfile: options.profile || config.awsProfile,
      awsRegion: options.region || config.awsRegion,
      defaultProvider: options.provider || config.defaultProvider,
      modelAlias: options.model || config.modelAlias
    });

    const updatedConfig = configManager.getConfig();

    console.log(JSON.stringify(options, null, 2));
    console.log(JSON.stringify(config, null, 2));

    console.log(JSON.stringify(updatedConfig, null, 2));

    if(updatedConfig.modelAlias) {
      options.resolvedModel = resolveModelAlias(
        updatedConfig.defaultProvider,
        updatedConfig.modelAlias
      );  
    }

    logger.setLogLevel(options.logLevel);

    logger.debug(`Using profile: ${updatedConfig.awsProfile}`);
    logger.debug(`Using region: ${updatedConfig.awsRegion}`);
    logger.debug(`Using provider: ${updatedConfig.defaultProvider}`);
    logger.debug(`Using model alias: ${updatedConfig.modelAlias}`);
    logger.debug(`Resolved model: ${options.resolvedModel}`);
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