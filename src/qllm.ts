import { Command } from 'commander';
import { createAskCommand } from './commands/ask';
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
  .hook('preAction', async (thisCommand) => {
    const options = thisCommand.opts();
    await configManager.loadConfig();
    
    configManager.updateConfig({
      awsProfile: options.profile,
      awsRegion: options.region,
      defaultProvider: options.provider,
      modelAlias: options.model,
      modelId: options.modelid,
    });


    const config = configManager.getConfig();
    
    if (config.modelAlias && config.modelId) {
      logger.error('Cannot use both model alias and model ID. Please specify only one.');
      process.exit(1);
    }

    if (config.modelAlias) {
      config.modelId = resolveModelAlias(config.defaultProvider, config.modelAlias);
    }

    // Very important to set the AWS profile and region before creating any provider instances
    console.log(config);
    
    if(config.awsProfile) {
      logger.debug(`Setting Env AWS profile: ${config.awsProfile}`);
      process.env.AWS_PROFILE = config.awsProfile;
    }
    if(config.awsRegion) {
      logger.debug(`Setting Env AWS region: ${config.awsRegion}`);
      process.env.AWS_REGION = config.awsRegion;
    }

    logger.setLogLevel(options.logLevel);
    logger.debug(`Configuration: ${JSON.stringify(config)}`);
  });

// Register commands
program.addCommand(createAskCommand());
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