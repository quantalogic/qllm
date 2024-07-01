import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { logger } from './logger';
import { ProviderName } from '../config/types';
import dotenv from 'dotenv';

export interface AppConfig {
  awsProfile: string;
  awsRegion: string;
  defaultProvider: ProviderName | undefined | string;
  modelAlias?: string;
  modelId?: string;
}

const CONFIG_MAP: Record<string, keyof AppConfig> = {
  'AWS_PROFILE': 'awsProfile',
  'AWS_REGION': 'awsRegion',
  'DEFAULT_PROVIDER': 'defaultProvider',
  'MODEL_ALIAS': 'modelAlias',
  'MODEL_ID': 'modelId',
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
    };
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public async loadConfig(): Promise<void> {
    this.loadEnvironmentVariables();
    await this.loadEnvFile();
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
      logger.error(`Error loading .env file: ${error} at path: ${this.envPath}`);
    }
  }

  private mapEnvToConfig(envValues: Record<string, string>): Partial<AppConfig> {
    const configUpdates: Partial<AppConfig> = {};
    if (envValues.AWS_PROFILE) configUpdates.awsProfile = envValues.AWS_PROFILE;
    if (envValues.AWS_REGION) configUpdates.awsRegion = envValues.AWS_REGION;
    if(envValues.MODEL_ALIAS) configUpdates.modelAlias = envValues.MODEL_ALIAS;
    if (envValues.DEFAULT_PROVIDER) configUpdates.defaultProvider = envValues.DEFAULT_PROVIDER as ProviderName;
    return configUpdates;
  }
  

  private loadEnvironmentVariables(): void {
    const envUpdates: Partial<AppConfig> = {};
    if (process.env.AWS_PROFILE) envUpdates.awsProfile = process.env.AWS_PROFILE;
    if (process.env.AWS_REGION) envUpdates.awsRegion = process.env.AWS_REGION;
    if(process.env.MODEL_ALIAS) envUpdates.modelAlias = process.env.MODEL_ALIAS;
    if (process.env.DEFAULT_PROVIDER) envUpdates.defaultProvider = process.env.DEFAULT_PROVIDER as ProviderName;
    this.updateConfig(envUpdates);
  }
  
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public async saveConfig(): Promise<void> {
    const envContent = Object.entries(CONFIG_MAP)
      .map(([envKey, configKey]) => {
        const value = this.config[configKey];
        return value !== undefined ? `${envKey}=${value}` : null;
      })
      .filter(line => line !== null)
      .join('\n');

    try {
      await fs.writeFile(this.envPath, envContent);
      logger.debug(`Configuration saved to .env file at: ${this.envPath}`);
    } catch (error) {
      logger.error(`Error saving configuration to .env file: ${error} at path: ${this.envPath}`);
      throw error;
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
}

export const configManager = ConfigurationManager.getInstance();
