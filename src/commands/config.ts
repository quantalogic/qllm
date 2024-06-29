import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { Spinner } from '../utils/spinner';
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
  logger.info(`AWS Profile: ${process.env.AWS_PROFILE || AWS_PROFILE}`);
  logger.info(`AWS Region: ${process.env.AWS_REGION || AWS_REGION}`);
  logger.info(`Model ID: ${process.env.MODEL_ID || 'Not set'}`);
  logger.info(`Available model aliases: ${Object.keys(MODEL_ALIASES).join(', ')}`);
  logger.info(`Default model alias: ${DEFAULT_MODEL_ALIAS}`);
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

  if (options.setModelid && options.setModel) {
    logger.error('Cannot set both model ID and model alias. Please use only one.');
    return;
  }

  if (options.setModelid) {
    envContent = updateEnvVariable(envContent, 'MODEL_ID', options.setModelid);
    logger.info(`Model ID updated to: ${options.setModelid}`);
  }

  if (options.setModel) {
    const resolvedModel = MODEL_ALIASES[options.setModel as keyof typeof MODEL_ALIASES];
    if (resolvedModel) {
      envContent = updateEnvVariable(envContent, 'MODEL_ID', resolvedModel);
      logger.info(`Model alias set to: ${options.setModel} (${resolvedModel})`);
    } else {
      logger.error(`Invalid model alias: ${options.setModel}`);
      return;
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
