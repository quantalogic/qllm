// src/commands/config.ts

import { logger } from '@qllm-lib/common/utils/logger';
import { ErrorManager } from '@qllm-lib/common/utils/error_manager';
import { configManager } from '@qllm-lib/config/configuration_manager';
import { AppConfig, ProviderName } from '@qllm/types/src';
import { Command, Option } from 'commander';
import prompts from 'prompts';
import { ConfigurationFileLoader } from '@qllm-lib/common/utils/configuration_file_loader';
import { resolveConfigPath } from '@qllm-lib/common/utils/path_resolver';
import { getAllProviders, getModelsForProvider } from '@qllm-lib/config/provider_config';
import { ErrorHandler } from '@qllm-lib/common/utils/error_handler';
import { QllmError } from '@qllm-lib/common/errors/custom_errors';

/**
 * Creates and returns the 'config' command for the CLI application.
 * This command allows users to configure the QLLM utility.
 *
 * @returns {Command} The configured 'config' command
 */
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
    .addOption(
      new Option('--show-models-provider <provider>', 'Show available models for a provider'),
    )
    .option(
      '--show-parameters-model <provider> <model>',
      'Show parameters for a specific model of a provider',
    )
    .action(async (options) => {
      try {
        // Resolve the configuration file path
        const configFile = await resolveConfigPath(options.config);
        const configLoader = new ConfigurationFileLoader(configFile);

        // Handle different command options
        if (options.showParametersModel) {
          const args = options.showParametersModel.split(' ');
          if (args.length !== 2) {
            throw new QllmError(
              'Both provider and model must be specified for --show-parameters-model',
            );
          }
          const [provider, model] = args;
          console.log(`Provider: ${provider}`);
          console.log(`Model: ${model}`);
          showModelParameters(provider, model);
        } else if (options.showProviders) {
          showProviders();
        } else if (options.showModelsProvider) {
          showModelsForProvider(options.showModelsProvider as ProviderName);
        } else if (options.show) {
          showConfig(configManager.getConfig());
        } else if (options.interactive) {
          await interactiveConfig(configLoader);
        } else {
          await updateConfig(options, configLoader);
        }
      } catch (error) {
        // Handle errors
        if (error instanceof QllmError) {
          ErrorHandler.handle(error);
        } else {
          ErrorHandler.handle(new QllmError(`Unexpected error in config command: ${error}`));
        }
        process.exit(1);
      }
    });

  return configCommand;
}

/**
 * Updates the configuration based on the provided options.
 *
 * @param {any} options - The options provided by the user
 * @param {ConfigurationFileLoader} configLoader - The configuration file loader
 */
async function updateConfig(options: any, configLoader: ConfigurationFileLoader): Promise<void> {
  const updates: Partial<AppConfig> = {};

  // Update configuration based on provided options
  if (options.setProfile) updates.awsProfile = options.setProfile;
  if (options.setRegion) updates.awsRegion = options.setRegion;
  if (options.setProvider) updates.defaultProvider = options.setProvider as ProviderName;
  if (options.setLogLevel) updates.logLevel = options.setLogLevel;
  if (options.setMaxTokens) updates.defaultMaxTokens = parseInt(options.setMaxTokens, 10);
  if (options.setPromptsDir) updates.promptDirectory = options.setPromptsDir;
  if (options.setModelAlias) updates.defaultModelAlias = options.setModelAlias;
  if (options.setModelId) updates.defaultModelId = options.setModelId;

  if (Object.keys(updates).length > 0) {
    await configManager.updateAndSaveConfig(updates);
    logger.info('Configuration updated successfully.');
    showConfig(configManager.getConfig());
  } else {
    logger.info('No configuration changes made.');
    showConfig(configManager.getConfig());
  }
}

/**
 * Displays all available providers.
 *
 * @returns {ProviderName[]} Array of available provider names
 */
function showProviders(): ProviderName[] {
  const availableProviders = getAllProviders();
  console.log('My providers : ', availableProviders);
  return availableProviders;
}

/**
 * Displays all available models for a specific provider.
 *
 * @param {ProviderName} providerName - The name of the provider
 */
function showModelsForProvider(providerName: ProviderName): void {
  try {
    const availableProviders = getModelsForProvider(providerName);
    console.log('My models:');
    availableProviders.forEach((model, index) => {
      console.log(`Model ${index + 1}, alias : ${model.alias}, id : ${model.modelId} `);
    });
  } catch (error) {
    console.error(error);
  }
}

/**
 * Displays parameters for a specific model of a provider.
 *
 * @param {ProviderName} providerName - The name of the provider
 * @param {string} modelAlias - The alias of the model
 */
function showModelParameters(providerName: ProviderName, modelAlias: string): void {
  try {
    const models = getModelsForProvider(providerName);
    const model = models.find((m) => m.alias === modelAlias);

    if (!model) {
      console.log(`Model '${modelAlias}' not found for provider '${providerName}'.`);
      return;
    }

    console.log(`Parameters for ${providerName}/${modelAlias}:`);
    console.log(JSON.stringify(model.parameters, null, 2));
  } catch (error) {
    console.error(`---- Error showing model parameters: ${error}`);
  }
}

/**
 * Displays the current configuration.
 *
 * @param {AppConfig} config - The current configuration
 */
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

/**
 * Initiates an interactive configuration session.
 *
 * @param {ConfigurationFileLoader} configLoader - The configuration file loader
 */
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
