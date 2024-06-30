import fs from 'fs/promises';
import path from 'path';
import { ProviderName } from '../config/types';
import { logger } from './logger';
import * as dotenv from 'dotenv';

export interface AppConfig {
  awsProfile: string;
  awsRegion: string;
  defaultProvider: ProviderName;
  modelAlias?: string;
}

class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: AppConfig;
  private envPath: string;
  private envValues: Record<string, string> = {};

  private constructor() {
    const currentPath = process.cwd();
    this.envPath = path.resolve(currentPath, '.env');
    this.loadEnvFile();
    this.config = this.loadConfiguration();
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
      this.envValues = dotenv.parse(envContent);
      logger.debug(`Parsed .env file. Number of values: ${Object.keys(this.envValues).length}`);
    } catch (error) {
      logger.error(`Error loading .env file: ${error}`);
      this.envValues = {};
    }
  }

  private loadConfiguration(): AppConfig {
    return {
      awsProfile: this.getValue('AWS_PROFILE', 'default'),
      awsRegion: this.getValue('AWS_REGION', 'us-east-1'),
      defaultProvider: this.getValue('DEFAULT_PROVIDER', 'anthropic') as ProviderName,
      modelAlias: this.envValues['MODEL_ALIAS'],
    };
  }

  private getValue(key: string, defaultValue: string): string {
    return this.envValues[key] || defaultValue;
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.updateEnvFile();
  }

  private async updateEnvFile(): Promise<void> {
    let envContent = '';

    for (const [key, value] of Object.entries(this.config)) {
      const envKey = key.toUpperCase();
      envContent += `${envKey}=${value}\n`;
    }

    await fs.writeFile(this.envPath, envContent);
    await this.loadEnvFile(); // Reload the env file after updating
  }

  public async reloadConfig(): Promise<void> {
    await this.loadEnvFile();
    this.config = this.loadConfiguration();
  }

  public setCommandLineOptions(options: Partial<AppConfig>): void {
    this.config = { ...this.config, ...options };
  }
}

export const configManager = ConfigurationManager.getInstance();