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
  modelId?: string;
}

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
    await this.loadEnvFile();
    this.loadEnvironmentVariables();
  }

  private async loadEnvFile(): Promise<void> {
    try {
      const envContent = await fs.readFile(this.envPath, 'utf-8');
      const envValues = dotenv.parse(envContent);
      this.updateConfig(envValues);
    } catch (error) {
      logger.error(`Error loading .env file: ${error}`);
    }
  }

  private loadEnvironmentVariables(): void {
    const appConfigUpdates: Partial<AppConfig> = {
      awsProfile: process.env.AWS_PROFILE || 'default',
      awsRegion: process.env.AWS_REGION || 'us-east-1',
  };
    this.updateConfig(appConfigUpdates);
  }

  public updateConfig(updates: Partial<AppConfig>): void {
    this.config = {
      ...this.config,
      ...Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      ),
    };
    this.emit('configUpdated', this.config);
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public async saveConfig(): Promise<void> {
    const envContent = Object.entries(this.config)
      .map(([key, value]) => `${key.toUpperCase()}=${value}`)
      .join('\n');
    await fs.writeFile(this.envPath, envContent);
  }
}

export const configManager = ConfigurationManager.getInstance();
