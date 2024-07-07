// src/commands/config.ts
import { Command, Option } from 'commander';
import prompts from 'prompts';
import { configManager } from '../utils/configuration_manager';
import { logger } from '../utils/logger';
import { AppConfig, ProviderName } from '../config/types';
import { ErrorManager } from '../utils/error_manager';

export function createConfigCommand(): Command {
  const config_command = new Command('config')
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
    .action(async (options) => {
      try {
        await configManager.loadConfig();

        if (options.show) {
          showConfig();
        } else if (options.interactive) {
          await interactiveConfig();
        } else {
          await updateConfig(options);
        }
      } catch (error) {
        ErrorManager.handleError('ConfigCommandError', `Configuration error: ${error}`);
      }
    });

  return config_command;
}

function showConfig(): void {
  const config = configManager.getConfig();
  console.info('Current configuration:');
  Object.entries(config).forEach(([key, value]) => {
    if (key.toLowerCase().includes('secret')) {
      console.info(`${key}: [HIDDEN]`);
    } else {
      console.info(`${key}: ${value}`);
    }
  });
}

async function updateConfig(options: any): Promise<void> {
  const updates: Partial<AppConfig> = {};

  if (options.setProfile) updates.awsProfile = options.setProfile;
  if (options.setRegion) updates.awsRegion = options.setRegion;
  if (options.setProvider) updates.defaultProvider = options.setProvider as ProviderName;
  if (options.setModel) updates.defaultModel = options.setModel;
  if (options.setLogLevel) updates.logLevel = options.setLogLevel;
  if (options.setMaxTokens) updates.defaultMaxTokens = parseInt(options.setMaxTokens, 10);
  if (options.setPromptsDir) updates.promptDirectory = options.setPromptsDir;
  if (options.setModelAlias) updates.defaultModelAlias = options.setModelAlias;
  if (options.setModelId) updates.defaultModelId = options.setModelId;

  if (Object.keys(updates).length > 0) {
    await configManager.updateAndSaveConfig(updates);
    logger.info('Configuration updated successfully.');
    showConfig();
  } else {
    logger.info('No configuration changes made.');
    showConfig();
  }
}

import { PromptObject } from 'prompts';

async function interactiveConfig(): Promise<void> {
  const currentConfig = configManager.getConfig();
  const questions: PromptObject[] = [
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
    },
    {
      type: 'text',
      name: 'defaultModel',
      message: 'Enter default model:',
      initial: currentConfig.defaultModel,
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
  logger.info('Configuration updated successfully.');
  showConfig();
}
