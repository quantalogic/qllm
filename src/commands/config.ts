import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { Spinner } from '../utils/spinner';
import { ProviderName } from '../config/types';
import { providerConfigs, getProviderConfig } from '../config/model_aliases';
import { getAwsProfile, getAwsRegion } from '../config/config';

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
  logger.info('Current configuration:');
  logger.info(`AWS Profile: ${getAwsProfile() || 'Not set'}`);
  logger.info(`AWS Region: ${getAwsRegion() || 'Not set'}`);
  
  Object.entries(providerConfigs).forEach(([provider, config]) => {
    logger.info(`\nProvider: ${provider}`);
    logger.info(`Default Model: ${config.defaultModel}`);
    logger.info('Available models:');
    config.models.forEach(model => {
      logger.info(`  - ${model.alias}: ${model.modelId}`);
    });
  });
}

async function updateConfiguration(options: any): Promise<void> {
  const envPath = path.resolve(__dirname, '../../.env');
  let envContent = await fs.readFile(envPath, 'utf-8');

  if (options.setProfile) {
    envContent = updateEnvVariable(envContent, 'AWS_PROFILE', options.setProfile);
    logger.info(`AWS Profile updated to: ${options.setProfile}`);
  }

  if (options.setRegion) {
    envContent = updateEnvVariable(envContent, 'AWS_REGION', options.setRegion);
    logger.info(`AWS Region updated to: ${options.setRegion}`);
  }

  if (options.setProvider) {
    if (isValidProvider(options.setProvider)) {
      envContent = updateEnvVariable(envContent, 'DEFAULT_PROVIDER', options.setProvider);
      logger.info(`Default Provider updated to: ${options.setProvider}`);
    } else {
      logger.error(`Invalid provider: ${options.setProvider}`);
    }
  }

  if (options.setModel) {
    const provider = process.env.DEFAULT_PROVIDER as ProviderName;
    if (!provider) {
      logger.error('Default provider not set. Please set a default provider first.');
      return;
    }
    const providerConfig = getProviderConfig(provider);
    const model = providerConfig.models.find(m => m.alias === options.setModel);
    if (model) {
      envContent = updateEnvVariable(envContent, `${provider.toUpperCase()}_DEFAULT_MODEL`, model.modelId);
      logger.info(`Default model for ${provider} updated to: ${options.setModel} (${model.modelId})`);
    } else {
      logger.error(`Invalid model alias for provider ${provider}: ${options.setModel}`);
    }
  }

  await fs.writeFile(envPath, envContent);
  logger.info('Configuration updated. Please restart the CLI for changes to take effect.');
}

function updateEnvVariable(envContent: string, variable: string, value: string): string {
  const regex = new RegExp(`^${variable}=.*$`, 'm');
  const newLine = `${variable}=${value}`;
  if (envContent.match(regex)) {
    return envContent.replace(regex, newLine);
  } else {
    return `${envContent}\n${newLine}`;
  }
}

function isValidProvider(provider: string): provider is ProviderName {
  return Object.keys(providerConfigs).includes(provider);
}