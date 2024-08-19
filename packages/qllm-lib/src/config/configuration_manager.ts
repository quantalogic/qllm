import { EventEmitter } from 'events';
import { AppConfig } from '@qllm/types/src';
import { DEFAULT_APP_CONFIG } from './default_config';
import { logger } from '../common/utils/logger';
import { ErrorManager } from '../common/utils/error_manager';
import { ConfigurationFileLoader } from '../common/utils/configuration_file_loader';
import { ConfigurationError } from '../common/errors/custom_errors';
import { ErrorHandler } from '../common/utils/error_handler';

export class ConfigurationManager extends EventEmitter {
  private static instance: ConfigurationManager;
  private config: AppConfig;
  private configLoader: ConfigurationFileLoader;

  private constructor() {
    super();
    this.config = { ...DEFAULT_APP_CONFIG };
    this.configLoader = new ConfigurationFileLoader('');
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public async loadConfig(configPath?: string): Promise<void> {
    try {
      logger.debug('Loading configuration...');
      this.configLoader = new ConfigurationFileLoader(configPath || '');
      const loadedConfig = await this.configLoader.loadConfig();
      this.updateConfig(loadedConfig);
      logger.debug(`Configuration loaded: ${JSON.stringify(this.config)}`);
    } catch (error) {
      //ErrorManager.handleError('ConfigLoadError', `Failed to load configuration: ${error}`);
      ErrorHandler.throw(ConfigurationError, `Failed to load configuration: ${error}`);
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public async updateAndSaveConfig(updates: Partial<AppConfig>): Promise<void> {
    this.updateConfig(updates);
    await this.saveConfig();
  }

  public updateConfig(updates: Partial<AppConfig>): void {
    const oldConfig = { ...this.config };
    this.config = {
      ...this.config,
      ...Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined)),
    };
    logger.debug(
      `Configuration updated. Old: ${JSON.stringify(oldConfig)}, New: ${JSON.stringify(this.config)}`,
    );
    this.emit('configUpdated', this.config);
  }

  private async saveConfig(): Promise<void> {
    try {
      await this.configLoader.saveConfig(this.config);
      logger.debug('Configuration saved successfully');
    } catch (error) {
      ErrorManager.handleError('ConfigSaveError', `Failed to save configuration: ${error}`);
    }
  }

  public validateConfig(): boolean {
    // Add validation logic here if needed
    return true;
  }
}

export const configManager = ConfigurationManager.getInstance();
