import { Command } from 'commander';
import { logger } from '../utils/logger';
import { Spinner } from '../utils/spinner';
import { ProviderName } from '../config/types';
import { providerConfigs } from '../config/model_aliases';
import { AppConfig, configManager } from '../utils/configuration_manager';

export function createConfigCommand(): Command {
  const configCommand = new Command('config')
    .description('Display or update configuration')
    .option('-s, --show', 'Show current configuration')
    .option('--set-profile <profile>', 'Set AWS profile')
    .option('--set-region <region>', 'Set AWS region')
    .option('--set-provider <provider>', 'Set default provider')
    .option('--set-model <model>', 'Set default model for the provider')
    .action(async (options) => {
      const spinner = new Spinner('Processing configuration...');
      try {
        spinner.start();
        if (options.show) {
          showCurrentConfiguration();
        } else {
          await updateConfiguration(options);
        }
        spinner.succeed('Configuration processed successfully');
      } catch (error) {
        spinner.fail('Configuration processing failed');
        if (error instanceof Error) {
          logger.error(`An error occurred: ${error.message}`);
        } else {
          logger.error(`An error occurred: ${error}`);
        }
      }
    });

  return configCommand;
}

function showCurrentConfiguration(): void {
  const config = configManager.getConfig();
  logger.info('Current configuration:');
  logger.info(`AWS Profile: ${config.awsProfile || 'Not set'}`);
  logger.info(`AWS Region: ${config.awsRegion || 'Not set'}`);
  logger.info(`Default Provider: ${config.defaultProvider || 'Not set'}`);
  logger.info(`Model Alias: ${config.modelAlias || 'Not set'}`);

  Object.entries(providerConfigs).forEach(([provider, providerConfig]) => {
    logger.info(`\nProvider: ${provider}`);
    logger.info(`Default Model: ${providerConfig.defaultModel}`);
    logger.info('Available models:');
    providerConfig.models.forEach(model => {
      logger.info(` - ${model.alias}: ${model.modelId}`);
    });
  });
}

async function updateConfiguration(options: any): Promise<void> {
  const updates: Partial<AppConfig> = {};

  if (options.setProfile) {
    updates.awsProfile = options.setProfile;
    logger.info(`AWS Profile updated to: ${options.setProfile}`);
  }

  if (options.setRegion) {
    updates.awsRegion = options.setRegion;
    logger.info(`AWS Region updated to: ${options.setRegion}`);
  }

  if (options.setProvider) {
    if (isValidProvider(options.setProvider)) {
      updates.defaultProvider = options.setProvider;
      logger.info(`Default Provider updated to: ${options.setProvider}`);
    } else {
      logger.error(`Invalid provider: ${options.setProvider}`);
    }
  }

  if (options.setModel) {
    const config = configManager.getConfig();
    const provider = config.defaultProvider;
    if (!provider) {
      logger.error('Default provider not set. Please set a default provider first.');
      return;
    }
    const providerConfig = providerConfigs[provider];
    const model = providerConfig.models.find(m => m.alias === options.setModel);
    if (model) {
      updates.modelAlias = options.setModel;
      logger.info(`Default model for ${provider} updated to: ${options.setModel} (${model.modelId})`);
    } else {
      logger.error(`Invalid model alias for provider ${provider}: ${options.setModel}`);
    }
  }

  if (Object.keys(updates).length > 0) {
    await configManager.updateConfig(updates);
    logger.info('Configuration updated. Please restart the CLI for changes to take effect.');
  }
}

function isValidProvider(provider: string): provider is ProviderName {
  return Object.keys(providerConfigs).includes(provider);
}