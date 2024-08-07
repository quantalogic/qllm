// src/utils/configuration_file_loader.ts

import yaml from 'js-yaml';
import fs from 'fs/promises';
import { logger } from './logger';
import { ErrorManager } from './error_manager';
import { AppConfig } from '../../core/config/types';
import { DEFAULT_APP_CONFIG } from '../../core/config/default_config';

export class ConfigurationFileLoader {
  constructor(private configFilePath: string) {}

  /**
   * Loads the configuration from the specified file.
   * @returns A promise that resolves to the loaded AppConfig.
   */
  async loadConfig(): Promise<AppConfig> {
    try {
      const configContent = await fs.readFile(this.configFilePath, 'utf-8');
      const loadedConfig = yaml.load(configContent) as Partial<AppConfig>;
      return { ...DEFAULT_APP_CONFIG, ...loadedConfig };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.warn(`Configuration file not found at ${this.configFilePath}. Using default configuration.`);
        return DEFAULT_APP_CONFIG;
      }
      ErrorManager.throwError('ConfigLoadError', `Failed to load configuration: ${error}`);
    }
  }

  /**
   * Saves the configuration to the specified file.
   * @param config The configuration to save.
   */
  async saveConfig(config: AppConfig): Promise<void> {
    try {
      const configContent = yaml.dump(config);
      await fs.writeFile(this.configFilePath, configContent, 'utf-8');
      logger.debug(`Configuration saved to ${this.configFilePath}`);
    } catch (error) {
      ErrorManager.throwError('ConfigSaveError', `Failed to save configuration: ${error}`);
    }
  }
}
