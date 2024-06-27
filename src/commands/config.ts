import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { logInfo, logError } from '../utils';
import { AWS_PROFILE, AWS_REGION, MODEL_ALIASES, DEFAULT_MODEL_ALIAS } from '../config';

export function createConfigCommand(): Command {
    const configCommand = new Command('config')
        .description('Display or update configuration')
        .option('-s, --show', 'Show current configuration')
        .option('--set-profile <profile>', 'Set AWS profile')
        .option('--set-region <region>', 'Set AWS region')
        .option('--set-modelid <modelid>', 'Set specific model ID')
        .option('--set-model <model>', 'Set model alias', Object.keys(MODEL_ALIASES))
        .action(async (options) => {
            try {
                if (options.show) {
                    showCurrentConfiguration();
                } else {
                    await updateConfiguration(options);
                }
            } catch (error) {
                if (error instanceof Error) {
                    logError(`An error occurred: ${error.message}`);
                } else {
                    logError(`An error occurred: ${error}`);
                }
            }
        });

    return configCommand;
}

function showCurrentConfiguration(): void {
    logInfo('Current configuration:');
    logInfo(`AWS Profile: ${process.env.AWS_PROFILE || AWS_PROFILE}`);
    logInfo(`AWS Region: ${process.env.AWS_REGION || AWS_REGION}`);
    logInfo(`Model ID: ${process.env.MODEL_ID || 'Not set'}`);
    logInfo(`Available model aliases: ${Object.keys(MODEL_ALIASES).join(', ')}`);
    logInfo(`Default model alias: ${DEFAULT_MODEL_ALIAS}`);
}

async function updateConfiguration(options: any): Promise<void> {
    const envPath = path.resolve(__dirname, '../../.env');
    let envContent = await fs.readFile(envPath, 'utf-8');

    if (options.setProfile) {
        envContent = updateEnvVariable(envContent, 'AWS_PROFILE', options.setProfile);
    }

    if (options.setRegion) {
        envContent = updateEnvVariable(envContent, 'AWS_REGION', options.setRegion);
    }

    if (options.setModelid && options.setModel) {
        logError('Cannot set both model ID and model alias. Please use only one.');
        return;
    }

    if (options.setModelid) {
        envContent = updateEnvVariable(envContent, 'MODEL_ID', options.setModelid);
    }

    if (options.setModel) {
        const resolvedModel = MODEL_ALIASES[options.setModel as keyof typeof MODEL_ALIASES] || options.setModel;
        envContent = updateEnvVariable(envContent, 'MODEL_ID', resolvedModel);
    }

    await fs.writeFile(envPath, envContent);
    logInfo('Configuration updated. Please restart the CLI for changes to take effect.');
}

function updateEnvVariable(envContent: string, variable: string, value: string): string {
    const regex = new RegExp(`${variable}=.*`);
    const newLine = `${variable}=${value}`;
    if (envContent.match(regex)) {
        return envContent.replace(regex, newLine);
    } else {
        return `${envContent}\n${newLine}`;
    }
}