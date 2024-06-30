import fs from 'fs/promises';
import path from 'path';
import { ProviderName } from '../config/types';
import { logger } from './logger';
import * as dotenv from 'dotenv';
import { EventEmitter } from 'events';

export interface AppConfig {
  awsProfile: string;
  awsRegion: string;
  defaultProvider: ProviderName;
  modelAlias?: string;
}

type ConfigLayer = Partial<AppConfig>;

class ConfigurationManager extends EventEmitter {
  private static instance: ConfigurationManager;
  private envVariables: ConfigLayer = {};
  private envFileValues: ConfigLayer = {};
  private commandLineOptions: ConfigLayer = {};
  private envPath: string;

  private constructor() {
    super();
    const currentPath = process.cwd();
    this.envPath = path.resolve(currentPath, '.env');
    this.loadEnvironmentVariables();
    this.loadEnvFile();
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  private async loadEnvFile(): Promise<void> {
    try {
      logger.debug(`Attempting to load .env file from: ${this.envPath}`);
      const envContent = await fs.readFile(this.envPath, 'utf-8');
      logger.debug(`Successfully read .env file. Content length: ${envContent.length}`);
      this.envFileValues = dotenv.parse(envContent);
      logger.debug(`Parsed .env file. Number of values: ${Object.keys(this.envFileValues).length}`);
    } catch (error) {
      logger.error(`Error loading .env file: ${error}`);
      this.envFileValues = {};
    }
  }

  private loadEnvironmentVariables(): void {
    this.envVariables = {
      awsProfile: process.env.AWS_PROFILE,
      awsRegion: process.env.AWS_REGION,
      defaultProvider: process.env.DEFAULT_PROVIDER as ProviderName,
      modelAlias: process.env.MODEL_ALIAS,
    };
  }

  private mergeConfiguration(): AppConfig {
    return {
      awsProfile: this.commandLineOptions.awsProfile || this.envFileValues.awsProfile || this.envVariables.awsProfile || 'default',
      awsRegion: this.commandLineOptions.awsRegion || this.envFileValues.awsRegion || this.envVariables.awsRegion || 'us-east-1',
      defaultProvider: this.commandLineOptions.defaultProvider || this.envFileValues.defaultProvider || this.envVariables.defaultProvider || 'anthropic',
      modelAlias: this.commandLineOptions.modelAlias || this.envFileValues.modelAlias || this.envVariables.modelAlias,
    };
  }

  public getConfig(): AppConfig {
    return this.mergeConfiguration();
  }

  public async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    Object.assign(this.envFileValues, updates);
    await this.updateEnvFile();
    this.emit('configUpdated', this.getConfig());
  }

  private async updateEnvFile(): Promise<void> {
    let envContent = '';
    for (const [key, value] of Object.entries(this.envFileValues)) {
      if (value !== undefined) {
        const envKey = key.toUpperCase();
        envContent += `${envKey}=${value}\n`;
      }
    }
    await fs.writeFile(this.envPath, envContent);
    await this.loadEnvFile();
  }

  public async reloadConfig(): Promise<void> {
    this.loadEnvironmentVariables();
    await this.loadEnvFile();
    this.emit('configUpdated', this.getConfig());
  }

  public setCommandLineOptions(options: Partial<AppConfig>): void {
    this.commandLineOptions = options;
    this.emit('configUpdated', this.getConfig());
  }
}

export const configManager = ConfigurationManager.getInstance();