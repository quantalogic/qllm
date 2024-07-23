// src/commands/config.ts

import { Command, Option } from 'commander';
import prompts from 'prompts';
import { configManager } from '../utils/configuration_manager';
import { ConfigurationFileLoader } from '../utils/configuration_file_loader';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error_manager';
import { AppConfig, ProviderName } from '../config/types';
import { resolveConfigPath } from '../utils/path_resolver';
import { getAllProviders, getModelsForProvider } from '../config/provider_config';

export function createConfigCommand(): Command {
  const configCommand = new Command('config')
    .description('Configure the QLLM utility')
    .addOption(new Option('--show', 'Show current configuration'))
    .addOption(new Option('--set-profile <profile>', 'Set AWS profile'))
    .addOption(new Option('--set-region <region>', 'Set AWS region'))
    .addOption(new Option('--set-provider <provider>', 'Set default provider'))
    .addOption(new Option('--set-model <model>', 'Set default model'))
    .addOption(new Option('--set-log-level <level>', 'Set log level'))
    .addOption(new Option('--set-max-tokens <tokens>', 'Set default max tokens'))
    .addOption(new Option('--set-prompts-dir <directory>', 'Set prompt directory'))
    .addOption(new Option('--set-model-alias <alias>', 'Set default model alias'))
    .addOption(new Option('--set-model-id <id>', 'Set default model ID'))
    .addOption(new Option('--interactive', 'Enter interactive configuration mode'))
    .addOption(new Option('--show-providers', 'Show available providers'))
    .addOption(new Option('--show-models-provider <provider>', 'Show available models for a provider'))
    .action(async (options) => {
      try {
        const configFile = await resolveConfigPath(options.config);
        const configLoader = new ConfigurationFileLoader(configFile);

        if (options.showProvidersAvailable) {
          showProviders();
        }  else if (options.showModelsProvider) {
          showModelsForProvider(options.showModelsProvider as ProviderName);
        } else if (options.show) {
          showConfig(configManager.getConfig());
        } else if (options.interactive) {
          await interactiveConfig(configLoader);
        } else {
          await updateConfig(options, configLoader);
        }
      } catch (error) {
        ErrorManager.handleError('ConfigCommandError', `Configuration error: ${error}`);
      }
    });

  return configCommand;
}

async function updateConfig(options: any, configLoader: ConfigurationFileLoader): Promise<void> {
  const updates: Partial<AppConfig> = {};

  if (options.setProfile) updates.awsProfile = options.setProfile;
  if (options.setRegion) updates.awsRegion = options.setRegion;
  if (options.setProvider) updates.defaultProvider = options.setProvider as ProviderName;
  if (options.setLogLevel) updates.logLevel = options.setLogLevel;
  if (options.setMaxTokens) updates.defaultMaxTokens = parseInt(options.setMaxTokens, 10);
  if (options.setPromptsDir) updates.promptDirectory = options.setPromptsDir;
  if (options.setModelAlias) updates.defaultModelAlias = options.setModelAlias;
  if (options.setModelId) updates.defaultModelId = options.setModelId;

  if (Object.keys(updates).length > 0) {
    configManager.updateConfig(updates);
    await configLoader.saveConfig(configManager.getConfig());
    logger.info('Configuration updated successfully.');
    showConfig(configManager.getConfig());
  } else {
    logger.info('No configuration changes made.');
    showConfig(configManager.getConfig());
  }
}

function showProviders(): ProviderName[] {
  const availableProviders = getAllProviders()
  console.log("My providers : ", availableProviders)
  return availableProviders;
}

function showModelsForProvider(providerName: ProviderName): void {
  try{
    const availableProviders = getModelsForProvider(providerName)
    console.log("My providers : ", availableProviders)

  } catch (error) {
    console.error(error);
  }
}


function showConfig(config: AppConfig): void {
  console.info('Current configuration:');
  Object.entries(config).forEach(([key, value]) => {
    if (key.toLowerCase().includes('secret')) {
      console.info(`${key}: [HIDDEN]`);
    } else {
      console.info(`${key}: ${value}`);
    }
  });
}

async function interactiveConfig(configLoader: ConfigurationFileLoader): Promise<void> {
  const currentConfig = configManager.getConfig();
  const questions: prompts.PromptObject[] = [
    {
      type: 'text',
      name: 'awsProfile',
      message: 'Enter AWS profile:',
      initial: currentConfig.awsProfile,
    },
    {
      type: 'text',
      name: 'awsRegion',
      message: 'Enter AWS region:',
      initial: currentConfig.awsRegion,
    },
    {
      type: 'text',
      name: 'defaultProvider',
      message: 'Select default provider:',
      initial: currentConfig.defaultProvider,
    },
    {
      type: 'select',
      name: 'logLevel',
      message: 'Select log level:',
      choices: [
        { title: 'Info', value: 'info' },
        { title: 'Warning', value: 'warning' },
        { title: 'Error', value: 'error' },
        { title: 'Debug', value: 'debug' },
      ],
      initial: ['info', 'warning', 'error', 'debug'].indexOf(currentConfig.logLevel) || 0,
    },
    {
      type: 'number',
      name: 'defaultMaxTokens',
      message: 'Enter default max tokens:',
      initial: currentConfig.defaultMaxTokens,
    },
    {
      type: 'text',
      name: 'promptDirectory',
      message: 'Enter prompt directory:',
      initial: currentConfig.promptDirectory,
    },
    {
      type: 'text',
      name: 'defaultModelAlias',
      message: 'Enter default model alias:',
      initial: currentConfig.defaultModelAlias,
    },
    {
      type: 'text',
      name: 'defaultModelId',
      message: 'Enter default model ID:',
      initial: currentConfig.defaultModelId,
    },
  ];

  const responses = await prompts(questions);
  await configManager.updateAndSaveConfig(responses);
  await configLoader.saveConfig(configManager.getConfig());
  logger.info('Configuration updated successfully.');
  showConfig(configManager.getConfig());
}

export default createConfigCommand;