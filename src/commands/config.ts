// src/commands/config.ts
import { Command, Option } from 'commander';
import { configManager } from '../utils/configuration_manager';
import { logger } from '../utils/logger';
import { AppConfig, ProviderName } from '../config/types';
import { ErrorManager } from '../utils/error_manager';
import { getProviderConfig } from '../config/provider_config';

export function createConfigCommand(): Command {
    const config_command = new Command('config')
        .description('Configure the QLLM utility')
        .addOption(new Option('--show', 'Show current configuration'))
        .addOption(new Option('--set-profile <profile>', 'Set AWS profile'))
        .addOption(new Option('--set-region <region>', 'Set AWS region'))
        .addOption(new Option('--set-model <model>', 'Set default model'))
        .addOption(new Option('--set-provider <provider>', 'Set default provider'))
        .addOption(new Option('--set-config <path>', 'Set path to configuration file'))
        .addOption(new Option('--set-prompts-dir <dir>', 'Set directory for prompt templates'))
        .action(async (options) => {
            try {
                await configManager.loadConfig();
                if (options.show) {
                    showConfig();
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
    config.configFile = config.configFile || 'Not set';
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
    if (options.setModel) {
        updates.defaultModelAlias = options.setModel;
        updates.defaultModelId = undefined; // Reset modelId when setting a new alias
    }
    if (options.setConfig) updates.configFile = options.setConfig;
    if (options.setPromptsDir) updates.promptDirectory = options.setPromptsDir;

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

