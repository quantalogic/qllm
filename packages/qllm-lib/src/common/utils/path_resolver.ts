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
    // If no config path is provided, use the default config name
    if (!configPath) {
      configPath = defaultConfigName;
    }

    let resolvedPath: string;

    // Handle different types of paths
    if (configPath.startsWith('~/')) {
      // If path starts with '~/', it's relative to the user's home directory
      // Remove the '~/' and join with the home directory path
      resolvedPath = path.join(os.homedir(), configPath.slice(2));
    } else if (configPath.startsWith('./') || !path.isAbsolute(configPath)) {
      // If path starts with './' or is not absolute, it's relative to the current working directory
      // Resolve it against the current working directory
      resolvedPath = path.resolve(process.cwd(), configPath);
    } else {
      // If it's an absolute path, use it as is
      resolvedPath = configPath;
    }

    try {
      // Check if the resolved file path exists and is accessible
      await fs.access(resolvedPath);
      logger.debug(`Config file found at: ${resolvedPath}`);
      return resolvedPath;
    } catch (accessError) {
      // Handle file not found error
      if ((accessError as NodeJS.ErrnoException).code === 'ENOENT') {
        // If the file doesn't exist and we're looking for the default config,
        // return the path in the user's home directory
        if (configPath === defaultConfigName) {
          const homeConfigPath = path.join(os.homedir(), defaultConfigName);
          logger.debug(`Default config not found, using home directory: ${homeConfigPath}`);
          return homeConfigPath;
        }
        // If it's not the default config, throw a custom error
        ErrorManager.throwError(
          'ConfigNotFoundError',
          `Configuration file not found: ${configPath}`,
        );
      }
      // For any other file access error, re-throw it
      throw accessError;
    }
  } catch (error) {
    // Catch and re-throw any unexpected errors that weren't handled above
    throw error;
  }
}
