// src/config/config_resolver.ts
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { AppConfig } from './types';
import { parseConfigFile } from './config_file_parser';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error_manager';
import { DEFAULT_CONFIG } from './default_config';
import { log } from 'console';



const CONFIG_FILE_NAME = '.qllmrc.yaml';

/**
 * Resolves the configuration by merging different sources.
 * @param cliOptions Options provided via command line
 * @param envConfig Configuration from environment variables
 * @returns Resolved AppConfig
 */
export async function resolveConfig(cliOptions: Partial<AppConfig>, envConfig: Partial<AppConfig>): Promise<AppConfig> {
    try {
        const defaultConfig: AppConfig = DEFAULT_CONFIG;

        const configFilePaths = [
            path.join(process.cwd(), CONFIG_FILE_NAME),
            path.join(os.homedir(), CONFIG_FILE_NAME),
        ];

        let fileConfig: Partial<AppConfig> = {};
        for (const configPath of configFilePaths) {
            logger.debug(`Checking configuration file: ${configPath}`);
            if (await fileExists(configPath)) {
                logger.debug(`Loading configuration from: ${configPath}`);
                const parsedConfig = await parseConfigFile(configPath);
                fileConfig = { ...fileConfig, ...parsedConfig };
            }
        }

        // Merge configurations with correct priority
        const mergedConfig: AppConfig = {
            ...defaultConfig,
            ...fileConfig,
            ...envConfig,
            ...cliOptions,
        };

        logger.debug(`Resolved configuration: ${JSON.stringify(mergedConfig)}`);
        return mergedConfig;
    } catch (error) {
        ErrorManager.handleError('ConfigResolveError', `Failed to resolve configuration: ${error}`);
        throw error;
    }
}

/**
 * Checks if a file exists at the given path.
 * @param filePath Path to the file
 * @returns True if the file exists, false otherwise
 */
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Saves the current configuration to a file.
 * @param config The configuration to save
 * @param filePath The path to save the configuration file (optional)
 */
export async function saveConfig(config: AppConfig, filePath?: string): Promise<void> {
    try {
        const configPath = filePath || path.join(os.homedir(), CONFIG_FILE_NAME);
        const configContent = JSON.stringify(config, null, 2);
        await fs.writeFile(configPath, configContent, 'utf-8');
        logger.info(`Configuration saved to: ${configPath}`);
    } catch (error) {
        ErrorManager.handleError('ConfigSaveError', `Failed to save configuration: ${error}`);
    }
}

/**
 * Loads a configuration from a specific file.
 * @param filePath Path to the configuration file
 * @returns Parsed AppConfig
 */
export async function loadConfigFromFile(filePath: string): Promise<Partial<AppConfig>> {
    try {
        if (await fileExists(filePath)) {
            logger.debug(`Loading configuration from file: ${filePath}`);
            return await parseConfigFile(filePath);
        }
        logger.warn(`Configuration file not found: ${filePath}`);
        return {};
    } catch (error) {
        ErrorManager.handleError('ConfigLoadError', `Failed to load configuration from file: ${error}`);
        return {};
    }
}