// src/utils/configuration_manager.ts

import { EventEmitter } from 'events';
import { AppConfig, ProviderName } from '../config/types';
import { logger } from './logger';
import { ErrorManager } from './error_manager';
import { DEFAULT_CONFIG } from '../config/default_config';

// Mapping between environment variables and config keys
const CONFIG_MAP: Record<string, keyof AppConfig> = {
  'QLLM_AWS_PROFILE': 'awsProfile',
  'QLLM_AWS_REGION': 'awsRegion',
  'QLLM_DEFAULT_PROVIDER': 'defaultProvider',
  'QLLM_DEFAULT_MODEL': 'defaultModel',
  'QLLM_DEFAULT_MAX_TOKENS': 'defaultMaxTokens',
  'QLLM_PROMPT_DIRECTORY': 'promptDirectory',
  'QLLM_CONFIG_FILE': 'configFile',
  'QLLM_LOG_LEVEL': 'logLevel',
};

export class ConfigurationManager extends EventEmitter {
  private static instance: ConfigurationManager;
  private config: AppConfig;
  private currentOptions: Record<string, any> = {};

  private constructor() {
    super();
    this.config = { ...DEFAULT_CONFIG };
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public async loadConfig(options?: Partial<AppConfig>): Promise<void> {
    try {
      logger.debug('Loading configuration...');
      this.loadEnvironmentVariables();
      if (options) {
        this.updateConfig(options);
      }
      logger.debug(`Configuration loaded: ${JSON.stringify(this.config)}`);
    } catch (error) {
      ErrorManager.handleError('ConfigLoadError', `Failed to load configuration: ${error}`);
    }
  }

  private loadEnvironmentVariables(): void {
    const envUpdates: Partial<AppConfig> = {};
    for (const [envKey, configKey] of Object.entries(CONFIG_MAP)) {
      if (process.env[envKey] !== undefined) {
        envUpdates[configKey] = process.env[envKey];
      }
    }
    this.updateConfig(envUpdates);
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public async updateAndSaveConfig(updates: Partial<AppConfig>): Promise<void> {
    this.updateConfig(updates);
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




  public getOption<T extends keyof AppConfig>(key: T, cliOption?: AppConfig[T]): AppConfig[T] {
    if (cliOption !== undefined) {
      return cliOption;
    }
    return this.config[key] || DEFAULT_CONFIG[key];
  }

  public setCommandOptions(command: string, options: Record<string, any>): void {
    this.currentOptions[command] = options;
  }

  public getCommandOptions(command: string): Record<string, any> {
    return this.currentOptions[command] || {};
  }
}

export const configManager = ConfigurationManager.getInstance();