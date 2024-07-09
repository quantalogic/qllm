// src/utils/configuration_manager.ts

import { EventEmitter } from 'events';
import { AppConfig } from '../config/types';
import { logger } from './logger';
import { ErrorManager } from './error_manager';
import { DEFAULT_CONFIG } from '../config/default_config';


export class ConfigurationManager extends EventEmitter {
  private static instance: ConfigurationManager;
  private config: AppConfig;

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
      if (options) {
        this.updateConfig(options);
      }
      logger.debug(`Configuration loaded: ${JSON.stringify(this.config)}`);
    } catch (error) {
      ErrorManager.handleError('ConfigLoadError', `Failed to load configuration: ${error}`);
    }
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





}

export const configManager = ConfigurationManager.getInstance();