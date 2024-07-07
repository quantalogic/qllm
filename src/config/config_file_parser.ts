// src/config/config_file_parser.ts
import fs from 'fs';
import yaml from 'js-yaml';
import { AppConfig } from './types';
import { ErrorManager } from '../utils/error_manager';
import { logger } from '../utils/logger';

/**
 * Parses a YAML configuration file and returns a partial AppConfig object.
 * @param filePath The path to the YAML configuration file.
 * @returns A partial AppConfig object containing the parsed configuration.
 */
export function parseConfigFile(filePath: string): Partial<AppConfig> {
    try {
        logger.debug(`Parsing config file: ${filePath}`);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const config = yaml.load(fileContents) as Partial<AppConfig>;

        config.configFile = filePath;
        
        // Validate the parsed configuration
        validateConfig(config);

        logger.debug(`Successfully parsed config file: ${filePath}`);
        return config;
    } catch (error) {
        ErrorManager.handleError('ConfigParseError', `Failed to parse config file ${filePath}: ${error}`);
        return {};
    }
}

/**
 * Validates the parsed configuration object.
 * @param config The parsed configuration object to validate.
 * @throws {Error} If the configuration is invalid.
 */
function validateConfig(config: Partial<AppConfig>): void {
    // Add validation logic here
    // For example, checking if required fields are present and have correct types
    if (config.awsProfile && typeof config.awsProfile !== 'string') {
        ErrorManager.throwError('ConfigValidationError', 'awsProfile must be a string');
    }
    if (config.awsRegion && typeof config.awsRegion !== 'string') {
        ErrorManager.throwError('ConfigValidationError', 'awsRegion must be a string');
    }
    if (config.defaultProvider && typeof config.defaultProvider !== 'string') {
        ErrorManager.throwError('ConfigValidationError', 'defaultProvider must be a string');
    }
    if (config.promptDirectory && typeof config.promptDirectory !== 'string') {
        ErrorManager.throwError('ConfigValidationError', 'promptDirectory must be a string');
    }
    // Add more validation as needed
}

/**
 * Writes a configuration object to a YAML file.
 * @param config The configuration object to write.
 * @param filePath The path to the YAML file to write to.
 */
export function writeConfigFile(config: Partial<AppConfig>, filePath: string): void {
    try {
        logger.debug(`Writing config file: ${filePath}`);
        const yamlString = yaml.dump(config);
        fs.writeFileSync(filePath, yamlString, 'utf8');
        logger.debug(`Successfully wrote config file: ${filePath}`);
    } catch (error) {
        ErrorManager.handleError('ConfigWriteError', `Failed to write config file ${filePath}: ${error}`);
    }
}