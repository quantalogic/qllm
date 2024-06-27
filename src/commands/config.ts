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
            if (options.show) {
                logInfo('Current configuration:');
                logInfo(`AWS Profile: ${process.env.AWS_PROFILE || AWS_PROFILE}`);
                logInfo(`AWS Region: ${process.env.AWS_REGION || AWS_REGION}`);
                logInfo(`Model ID: ${process.env.MODEL_ID || 'Not set'}`);
                logInfo(`Available model aliases: ${Object.keys(MODEL_ALIASES).join(', ')}`);
                logInfo(`Default model alias: ${DEFAULT_MODEL_ALIAS}`);
            } else if (options.setProfile || options.setRegion || options.setModelid || options.setModel) {
                const envPath = path.resolve(__dirname, '../../.env');
                let envContent = await fs.readFile(envPath, 'utf-8');
                if (options.setProfile) {
                    envContent = envContent.replace(/AWS_PROFILE=.*/, `AWS_PROFILE=${options.setProfile}`);
                }
                if (options.setRegion) {
                    envContent = envContent.replace(/AWS_REGION=.*/, `AWS_REGION=${options.setRegion}`);
                }
                if (options.setModelid && options.setModel) {
                    logError('Cannot set both model ID and model alias. Please use only one.');
                    return;
                }
                if (options.setModelid) {
                    envContent = envContent.replace(/MODEL_ID=.*/, `MODEL_ID=${options.setModelid}`);
                }
                if (options.setModel) {
                    const resolvedModel = MODEL_ALIASES[options.setModel as keyof typeof MODEL_ALIASES] || options.setModel;
                    envContent = envContent.replace(/MODEL_ID=.*/, `MODEL_ID=${resolvedModel}`);
                }
                await fs.writeFile(envPath, envContent);
                logInfo('Configuration updated. Please restart the CLI for changes to take effect.');
            } else {
                logInfo('Use --help to see available options for config command.');
            }
        });
    return configCommand;
}
