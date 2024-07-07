// src/utils/configuration_manager.ts
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';
import os from 'os';
import { logger } from './logger';
import { AppConfig, ProviderName } from '../config/types';
import { ErrorManager } from './error_manager';

const CONFIG_MAP: Record<string, keyof AppConfig> = {
  'AWS_PROFILE': 'awsProfile',
  'AWS_REGION': 'awsRegion',
  'DEFAULT_PROVIDER': 'defaultProvider',
  'MODEL_ALIAS': 'modelAlias',
  'MODEL_ID': 'modelId',
  'PROMPT_DIRECTORY': 'promptDirectory',
};

class ConfigurationManager extends EventEmitter {
  private static instance: ConfigurationManager;
  private config: AppConfig;
  private envPath: string;

  private constructor() {
    super();
    this.envPath = path.resolve(process.cwd(), '.env');
    this.config = {
      awsProfile: 'default',
      awsRegion: 'us-east-1',
      defaultProvider: 'anthropic',
      promptDirectory: this.getDefaultPromptDirectory(),
    };
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public async loadConfig(): Promise<void> {
    try {
      logger.debug('Loading configuration...');
      this.loadEnvironmentVariables();
      await this.loadEnvFile();
      logger.debug('Configuration loaded successfully');
    } catch (error) {
      ErrorManager.handleError('ConfigLoadError', `Failed to load configuration: ${error}`);
    }
  }

  private async loadEnvFile(): Promise<void> {
    try {
      logger.debug(`Loading configuration from .env file: ${this.envPath}`);
      const envContent = await fs.readFile(this.envPath, 'utf-8');
      const envValues = dotenv.parse(envContent);
      const configUpdates = this.mapEnvToConfig(envValues);
      if (Object.keys(configUpdates).length > 0) {
        this.updateConfig(configUpdates);
        logger.debug('Configuration updated from .env file');
      } else {
        logger.debug('No configuration changes from .env file');
      }
    } catch (error) {
      logger.error(`Error loading .env file: ${error}`);
    }
  }

  private mapEnvToConfig(envValues: Record<string, string>): Partial<AppConfig> {
    const configUpdates: Partial<AppConfig> = {};
    for (const [envKey, configKey] of Object.entries(CONFIG_MAP)) {
      if (envValues[envKey] !== undefined) {
        if (configKey === 'promptDirectory') {
          configUpdates[configKey] = this.expandHomeDir(envValues[envKey]);
        } else if (configKey === 'defaultProvider') {
          configUpdates[configKey] = envValues[envKey] as ProviderName;
        } else {
          (configUpdates[configKey] as any) = envValues[envKey];
        }
      }
    }
    return configUpdates;
  }

  private loadEnvironmentVariables(): void {
    const envUpdates: Partial<AppConfig> = {};
    for (const [envKey, configKey] of Object.entries(CONFIG_MAP)) {
      if (process.env[envKey] !== undefined) {
        if (configKey === 'promptDirectory') {
          envUpdates[configKey] = this.expandHomeDir(process.env[envKey]!);
        } else if (configKey === 'defaultProvider') {
          envUpdates[configKey] = process.env[envKey] as ProviderName;
        } else {
          (envUpdates[configKey] as any) = process.env[envKey];
        }
      }
    }
    this.updateConfig(envUpdates);
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public async saveConfig(): Promise<void> {
    const envContent = Object.entries(CONFIG_MAP)
      .map(([envKey, configKey]) => {
        const value = this.config[configKey];
        if (value !== undefined) {
          return `${envKey}=${value}`;
        }
        return null;
      })
      .filter(line => line !== null)
      .join('\n');

    try {
      await fs.writeFile(this.envPath, envContent);
      logger.debug(`Configuration saved to .env file at: ${this.envPath}`);
    } catch (error) {
      ErrorManager.handleError('ConfigSaveError', `Error saving configuration to .env file: ${error}`);
    }
  }

  public updateConfig(updates: Partial<AppConfig>): void {
    const oldConfig = { ...this.config };
    this.config = {
      ...this.config,
      ...Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      ),
    };
    logger.debug(`Configuration updated. Old: ${JSON.stringify(oldConfig)}, New: ${JSON.stringify(this.config)}`);
    this.emit('configUpdated', this.config);
  }

  public validateConfig(): boolean {
    // Add validation logic here if needed
    return true;
  }

  private getDefaultPromptDirectory(): string {
    const homeDir = os.homedir();
    return path.join(homeDir, '.config', 'qllm', 'prompts');
  }

  public setPromptDirectory(directory: string): void {
    this.updateConfig({ promptDirectory: this.expandHomeDir(directory) });
  }

  private expandHomeDir(dir: string): string {
    if (dir.startsWith('~/') || dir === '~') {
      return path.join(os.homedir(), dir.slice(1));
    }
    return dir;
  }
}

export const configManager = ConfigurationManager.getInstance();