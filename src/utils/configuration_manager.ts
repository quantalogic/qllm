// src/utils/configuration_manager.ts
import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import { AppConfig, ProviderName } from '../config/types';
import { logger } from './logger';
import { ErrorManager } from './error_manager';
import { DEFAULT_CONFIG } from '../config/default_config';

const CONFIG_FILE_NAME = '.qllmrc.yaml';

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
  private configFilePath: string;

  private constructor() {
    super();
    this.configFilePath = path.join(process.cwd(), CONFIG_FILE_NAME);
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
      await this.loadConfigFile();
      this.loadEnvironmentVariables();
      if (options) {
        this.updateConfig(options);
      }
      logger.debug(`Configuration loaded: ${JSON.stringify(this.config)}`);
    } catch (error) {
      ErrorManager.handleError('ConfigLoadError', `Failed to load configuration: ${error}`);
    }
  }

  private async loadConfigFile(): Promise<void> {
    try {
      logger.debug(`Attempting to load config file from: ${this.configFilePath}`);
      if (await this.fileExists(this.configFilePath)) {
        const configContent = await fs.readFile(this.configFilePath, 'utf-8');
        logger.debug(`Config file content: ${configContent}`);
        const configData = yaml.load(configContent) as Partial<AppConfig>;
        logger.debug(`Parsed config data: ${JSON.stringify(configData)}`);
        this.updateConfig(configData);
        logger.debug(`Configuration loaded from ${this.configFilePath}`);
      } else {
        // If not found, check in the home directory
        const homeConfigPath = path.join(os.homedir(), CONFIG_FILE_NAME);
        if (await this.fileExists(homeConfigPath)) {
          const configContent = await fs.readFile(homeConfigPath, 'utf-8');
          const configData = yaml.load(configContent) as Partial<AppConfig>;
          this.updateConfig(configData);
          logger.debug(`Configuration loaded from ${homeConfigPath}`);
        } else {
          logger.debug('No configuration file found. Using default configuration.');
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error(`Error loading config file: ${error}`);
      }
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private loadEnvironmentVariables(): void {
    const envUpdates: Partial<AppConfig> = {};
    for (const [envKey, configKey] of Object.entries(CONFIG_MAP)) {
      if (process.env[envKey] !== undefined) {
        if (configKey === 'promptDirectory') {
          envUpdates[configKey] = this.expandHomeDir(process.env[envKey]!);
        } else if (configKey === 'defaultProvider') {
          envUpdates[configKey] = process.env[envKey] as ProviderName;
        } else if (configKey === 'defaultMaxTokens') {
          envUpdates[configKey] = parseInt(process.env[envKey]!, 10);
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

  public async updateAndSaveConfig(updates: Partial<AppConfig>): Promise<void> {
    this.updateConfig(updates);
    await this.saveConfig();
  }

  public async saveConfig(): Promise<void> {
    const configContent = yaml.dump(this.config);
    try {
      await fs.writeFile(this.configFilePath, configContent, 'utf-8');
      logger.debug(`Configuration saved to ${this.configFilePath}`);
    } catch (error) {
      ErrorManager.handleError('ConfigSaveError', `Error saving configuration to file: ${error}`);
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

  private expandHomeDir(dir: string): string {
    if (dir.startsWith('~/') || dir === '~') {
      return path.join(os.homedir(), dir.slice(1));
    }
    return dir;
  }

  public setPromptDirectory(directory: string): void {
    this.updateConfig({ promptDirectory: this.expandHomeDir(directory) });
  }

  public getOption<T extends keyof AppConfig>(key: T, cliOption?: AppConfig[T]): AppConfig[T] {
    if (cliOption !== undefined) {
      return cliOption;
    }
    return this.config[key] || DEFAULT_CONFIG[key];
  }

}

export const configManager = ConfigurationManager.getInstance();
