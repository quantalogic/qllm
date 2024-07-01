import { Command, Option } from 'commander';
import { AppConfig, configManager } from '../utils/configuration_manager';
import { logger } from '../utils/logger';
import { ProviderName } from '../config/types';

export function createConfigCommand(): Command {
  const config_command = new Command('config')
    .description('Configure the QLLM utility')
    .addOption(new Option('--show', 'Show current configuration'))
    .addOption(new Option('--set-profile <profile>', 'Set AWS profile'))
    .addOption(new Option('--set-region <region>', 'Set AWS region'))
    .addOption(new Option('--set-model <model>', 'Set default model'))
    .addOption(new Option('--set-provider <provider>', 'Set default provider'))
    .action(async (options) => {
      try {
        await configManager.loadConfig();
        
        if (options.show) {
          showConfig();
        } else {
          await updateConfig(options);
        }
      } catch (error) {
        logger.error(`Configuration error: ${error}`);
      }
    });

  return config_command;
}

function showConfig(): void {
  const config = configManager.getConfig();
  logger.info('Current configuration:');
  logger.info(`AWS Profile: ${config.awsProfile}`);
  logger.info(`AWS Region: ${config.awsRegion}`);
  logger.info(`Default Provider: ${config.defaultProvider}`);
  logger.info(`Model Alias: ${config.modelAlias || 'Not set'}`);
  logger.info(`Model ID: ${config.modelId || 'Not set'}`);
}

async function updateConfig(options: any): Promise<void> {
  const updates: Partial<AppConfig> = {};

  if (options.setProfile) updates.awsProfile = options.setProfile;
  if (options.setRegion) updates.awsRegion = options.setRegion;
  if (options.setModel) {
    updates.modelAlias = options.setModel;
    updates.modelId = undefined; // Reset modelId when setting a new alias
  }
  if (options.setProvider) updates.defaultProvider = validateProvider(options.setProvider);

  if (Object.keys(updates).length > 0) {
    configManager.updateConfig(updates);
    await configManager.saveConfig();
    logger.info('Configuration updated successfully.');
    showConfig(); // Show the updated configuration
  } else {
    logger.info('No configuration changes made.');
    showConfig(); // Show the current configuration
  }
}

function validateProvider(provider: string): ProviderName {
  const valid_providers: ProviderName[] = ['anthropic', 'openai'];
  if (valid_providers.includes(provider as ProviderName)) {
    return provider as ProviderName;
  }
  throw new Error(`Invalid provider: ${provider}. Valid options are: ${valid_providers.join(', ')}`);
}
