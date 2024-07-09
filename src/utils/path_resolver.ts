// src/utils/path_resolver.ts
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { logger } from './logger';
import { ErrorManager } from './error_manager';

/**
 * Resolves the path to the configuration file based on the provided path or default locations.
 * @param configPath Optional path to the configuration file
 * @returns Promise resolving to the absolute path of the configuration file
 */
export async function resolveConfigPath(configPath?: string): Promise<string> {
    // Default configuration file name
    const defaultConfigName = '.qllmrc.yaml';

    try {
        if (!configPath) {
            // If no path provided, use default name in current working directory
            configPath = defaultConfigName;
        }

        let resolvedPath: string;

        if (configPath.startsWith('~/')) {
            // Resolve path relative to home directory
            resolvedPath = path.join(os.homedir(), configPath.slice(2));
        } else if (configPath.startsWith('./')) {
            // Resolve path relative to current working directory
            resolvedPath = path.resolve(process.cwd(), configPath.slice(2));
        } else {
            // Resolve path relative to current working directory
            resolvedPath = path.resolve(process.cwd(), configPath);
        }

        logger.debug(`Attempting to resolve config path: ${resolvedPath}`);

        // Check if the file exists
        await fs.access(resolvedPath);
        logger.debug(`Config file found at: ${resolvedPath}`);
        return resolvedPath;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            // If the file doesn't exist and it's the default config, return path in home directory
            if (configPath === defaultConfigName) {
                const homeConfigPath = path.join(os.homedir(), defaultConfigName);
                logger.debug(`Default config not found, using home directory: ${homeConfigPath}`);
                return homeConfigPath;
            }
            // Otherwise, throw an error
            ErrorManager.throwError('ConfigNotFoundError', `Configuration file not found: ${configPath}`);
        }
        // For any other error, re-throw
        throw error;
    }
}