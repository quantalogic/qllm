/**
 * @fileoverview Template Manager for QLLM Library
 * 
 * This module provides a robust file system-based template management system for QLLM.
 * It handles the complete lifecycle of templates including storage, retrieval, validation,
 * and management operations while ensuring thread-safety and proper error handling.
 * 
 * Key Features:
 * - Asynchronous template loading and caching
 * - File system-based persistence
 * - Version control for templates
 * - Error handling with detailed logging
 * - Type-safe template operations
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * @since 2023
 * 
 * @example
 * ```typescript
 * // Initialize the template manager with a specific directory
 * const manager = new TemplateManager({ promptDirectory: './templates' });
 * await manager.init();
 * 
 * // List all available templates
 * const templates = await manager.listTemplates();
 * 
 * // Save a new template with variables
 * await manager.saveTemplate({
 *   name: 'greeting',
 *   content: 'Hello {{name}}!',
 *   version: '1.0.0',
 *   variables: [{
 *     name: 'name',
 *     type: 'string',
 *     description: 'Name of the person to greet'
 *   }]
 * });
 * 
 * // Load a specific template
 * const template = await manager.loadTemplate('greeting');
 * ```
 * 
 * @see {@link TemplateExecutor} for template execution
 * @see {@link TemplateLoader} for template loading mechanics
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error';
import { TemplateDefinition, TemplateDefinitionBuilder, TemplateManagerError } from './types';
import { TemplateLoader } from './template-loader';

/**
 * Configuration options for the Template Manager.
 * 
 * @interface TemplateManagerConfig
 * @property {string} promptDirectory - Absolute or relative path to the directory containing template files.
 *                                     The directory will be created if it doesn't exist.
 * @throws {TemplateManagerError} If the directory path is invalid or inaccessible
 */
export interface TemplateManagerConfig {
  /** Directory path where template files are stored */
  promptDirectory: string;
}

/**
 * Manages the complete lifecycle of templates including storage, retrieval, and validation.
 * Provides a file system-based storage system with built-in caching for optimal performance.
 * 
 * Key responsibilities:
 * - Template storage and retrieval
 * - Version management
 * - Cache management
 * - File system operations
 * - Error handling and logging
 * 
 * @class TemplateManager
 * @implements {ITemplateManager}
 * 
 * @example
 * ```typescript
 * const manager = new TemplateManager({
 *   promptDirectory: path.join(__dirname, 'templates')
 * });
 * 
 * // Initialize the manager
 * await manager.init();
 * 
 * // Work with templates
 * const template = await manager.loadTemplate('myTemplate');
 * await manager.saveTemplate(newTemplate);
 * ```
 */
export class TemplateManager {
  /** Directory path where templates are stored */
  private templateDir: string;
  /** Cache for loaded template files */
  private fileCache: Map<string, string> = new Map();

  /**
   * Creates a new template manager instance.
   * 
   * @param {TemplateManagerConfig} config - Configuration options
   */
  constructor(config: TemplateManagerConfig) {
    logger.info('Initializing TemplateManager');
    logger.debug(`Setting template directory to: ${config.promptDirectory}`);
    this.templateDir = config.promptDirectory;
  }

  /**
   * Initializes the template manager by ensuring the template directory exists.
   * 
   * @returns {Promise<void>}
   * @throws {TemplateManagerError} If directory initialization fails
   */
  async init(): Promise<void> {
    logger.info('Starting TemplateManager initialization');
    await this.ensureTemplateDirectory();
    logger.info('TemplateManager initialization completed successfully');
  }

  /**
   * Lists all available templates in the template directory.
   * Only includes files with .yaml extension.
   * 
   * @returns {Promise<string[]>} List of template names (without extension)
   */
  async listTemplates(): Promise<string[]> {
    logger.info('Listing all available templates');
    const templates = await this.getYamlFilesInDirectory();
    logger.debug(`Found ${templates.length} templates`);
    return templates;
  }

  /**
   * Retrieves a template by name.
   * 
   * @param {string} name - Name of the template to retrieve
   * @returns {Promise<TemplateDefinition | null>} Template if found, null otherwise
   */
  async getTemplate(name: string): Promise<TemplateDefinition | null> {
    logger.info(`Loading template: ${name}`);
    const filePath = this.getFilePath(name);
    logger.debug(`Attempting to load template from: ${filePath}`);
    
    try {
      const template = await TemplateLoader.load(filePath);
      if (template) {
        logger.debug(`Template "${name}" loaded successfully`);
        logger.debug(`Template details - Version: ${template.version}, Variables: ${Object.keys(template.input_variables || {}).length}`);
      } else {
        logger.debug(`Template "${name}" not found`);
      }
      return template;
    } catch (error) {
      this.handleTemplateReadError(error, name);
      return null;
    }
  }

  /**
   * Saves a template to the file system.
   * 
   * @param {TemplateDefinition} template - Template to save
   * @returns {Promise<void>}
   * @throws {TemplateManagerError} If save operation fails
   */
  async saveTemplate(template: TemplateDefinition): Promise<void> {
    logger.info(`Saving template: ${template.name}`);
    logger.debug(`Template details - Version: ${template.version}, Variables: ${Object.keys(template.input_variables || {}).length}`);
    
    const templateBuilder = TemplateDefinitionBuilder.fromTemplate(template);
    const filePath = this.getFilePath(template.name);
    
    try {
      const content = templateBuilder.toYAML();
      logger.debug(`Writing template to file: ${filePath}`);
      await fs.writeFile(filePath, content, 'utf-8');
      logger.info(`Successfully saved template ${template.name}`);
      
      // Update cache if exists
      if (this.fileCache.has(filePath)) {
        logger.debug(`Updating cache for template: ${template.name}`);
        this.fileCache.set(filePath, content);
      }
    } catch (error) {
      this.handleTemplateSaveError(error, template.name);
    }
  }

  /**
   * Deletes a template from the file system.
   * 
   * @param {string} name - Name of the template to delete
   * @returns {Promise<void>}
   * @throws {TemplateManagerError} If deletion fails
   */
  async deleteTemplate(name: string): Promise<void> {
    logger.info(`Deleting template: ${name}`);
    const filePath = this.getFilePath(name);
    
    try {
      logger.debug(`Attempting to delete file: ${filePath}`);
      await fs.unlink(filePath);
      
      // Clear cache if exists
      if (this.fileCache.has(filePath)) {
        logger.debug(`Clearing cache for template: ${name}`);
        this.fileCache.delete(filePath);
      }
      
      logger.info(`Successfully deleted template: ${name}`);
    } catch (error) {
      this.handleTemplateDeleteError(error, name);
    }
  }

  /**
   * Updates an existing template with new values.
   * 
   * @param {string} name - Name of the template to update
   * @param {Partial<TemplateDefinition>} updatedTemplate - New template values
   * @returns {Promise<void>}
   * @throws {TemplateManagerError} If template not found or update fails
   */
  async updateTemplate(name: string, updatedTemplate: Partial<TemplateDefinition>): Promise<void> {
    logger.info(`Updating template: ${name}`);
    logger.debug(`Update details:`, updatedTemplate);
    
    const existingTemplate = await this.getTemplate(name);
    if (!existingTemplate) {
      logger.error(`Template ${name} not found for update`);
      ErrorManager.throw(TemplateManagerError, `Template ${name} not found`);
    }
    
    logger.debug(`Merging existing template with updates`);
    const mergedTemplate: TemplateDefinition = {
      ...existingTemplate,
      ...updatedTemplate,
    };

    logger.debug(`Saving merged template`);
    await this.saveTemplate(mergedTemplate);
    logger.info(`Successfully updated template: ${name}`);
  }

  /**
   * Checks if a template exists.
   * 
   * @param {string} name - Name of the template to check
   * @returns {Promise<boolean>} True if template exists, false otherwise
   */
  async templateExists(name: string): Promise<boolean> {
    logger.debug(`Checking existence of template: ${name}`);
    const filePath = this.getFilePath(name);
    
    try {
      await fs.access(filePath);
      logger.debug(`Template ${name} exists`);
      return true;
    } catch {
      logger.debug(`Template ${name} does not exist`);
      return false;
    }
  }

  /**
   * Sets a new prompt directory for template storage.
   * 
   * @param {string} directory - New directory path
   * @returns {Promise<void>}
   * @throws {TemplateManagerError} If directory is invalid
   */
  async setPromptDirectory(directory: string): Promise<void> {
    logger.info(`Setting new prompt directory: ${directory}`);
    
    try {
      const expandedDir = path.resolve(directory);
      logger.debug(`Resolved directory path: ${expandedDir}`);
      
      logger.debug(`Validating directory: ${expandedDir}`);
      await this.validateDirectory(expandedDir);
      
      this.templateDir = expandedDir;
      logger.info(`Successfully set prompt directory to: ${expandedDir}`);
      
      // Clear cache when changing directory
      if (this.fileCache.size > 0) {
        logger.debug(`Clearing template cache due to directory change`);
        this.fileCache.clear();
      }
    } catch (error) {
      logger.error(`Failed to set prompt directory: ${error}`);
      ErrorManager.throw(TemplateManagerError, `Failed to set prompt directory: ${error}`);
    }
  }

  /**
   * Ensures the template directory exists, creating it if necessary.
   * 
   * @private
   * @returns {Promise<void>}
   * @throws {TemplateManagerError} If directory creation fails
   */
  private async ensureTemplateDirectory(): Promise<void> {
    logger.debug(`Ensuring template directory exists: ${this.templateDir}`);
    try {
      await fs.mkdir(this.templateDir, { recursive: true });
      logger.info(`Template directory ready: ${this.templateDir}`);
    } catch (error) {
      logger.error(`Failed to initialize template directory: ${error}`);
      ErrorManager.throw(TemplateManagerError, `Failed to initialize template directory: ${error}`);
    }
  }

  /**
   * Gets a list of YAML files in the template directory.
   * 
   * @private
   * @returns {Promise<string[]>} List of template names (without extension)
   */
  private async getYamlFilesInDirectory(): Promise<string[]> {
    logger.debug(`Scanning directory for YAML files: ${this.templateDir}`);
    try {
      const files = await fs.readdir(this.templateDir);
      logger.debug(`Found ${files.length} total files`);
      
      const yamlFiles = files.filter((file) => file.endsWith('.yaml'));
      logger.debug(`Found ${yamlFiles.length} YAML files`);
      
      const templateNames = yamlFiles.map((file) => path.basename(file, '.yaml'));
      logger.debug(`Template names: ${templateNames.join(', ')}`);
      
      return templateNames;
    } catch (error) {
      logger.error(`Failed to read directory ${this.templateDir}: ${error}`);
      return [];
    }
  }

  /**
   * Gets the full file path for a template name.
   * 
   * @private
   * @param {string} name - Template name
   * @returns {string} Full file path
   */
  private getFilePath(name: string): string {
    const filePath = path.join(this.templateDir, `${name}.yaml`);
    logger.debug(`Resolved file path for template "${name}": ${filePath}`);
    return filePath;
  }

  /**
   * Reads a file with caching support.
   * 
   * @private
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} File contents
   */
  private async readFile(filePath: string): Promise<string> {
    logger.debug(`Reading file: ${filePath}`);
    
    if (this.fileCache.has(filePath)) {
      logger.debug(`Cache hit for file: ${filePath}`);
      return this.fileCache.get(filePath)!;
    }
    
    logger.debug(`Cache miss, reading from disk: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf-8');
    
    logger.debug(`Caching content for: ${filePath}`);
    this.fileCache.set(filePath, content);
    
    return content;
  }

  /**
   * Handles errors during template read operations.
   * 
   * @private
   * @param {any} error - Error object
   * @param {string} name - Template name
   */
  private handleTemplateReadError(error: any, name: string): void {
    const errorCode = (error as NodeJS.ErrnoException).code;
    if (errorCode !== 'ENOENT') {
      logger.error(`Failed to read template ${name}:`, {
        error: error.message,
        code: errorCode,
        stack: error.stack
      });
    } else {
      logger.debug(`Template ${name} not found (ENOENT)`);
    }
  }

  /**
   * Handles errors during template save operations.
   * 
   * @private
   * @param {any} error - Error object
   * @param {string} name - Template name
   * @throws {TemplateManagerError} Always throws with error details
   */
  private handleTemplateSaveError(error: any, name: string): void {
    logger.error(`Failed to save template ${name}:`, {
      error: error.message,
      code: (error as NodeJS.ErrnoException).code,
      stack: error.stack
    });
    ErrorManager.throw(TemplateManagerError, `Failed to save template ${name}: ${error}`);
  }

  /**
   * Handles errors during template delete operations.
   * 
   * @private
   * @param {any} error - Error object
   * @param {string} name - Template name
   * @throws {TemplateManagerError} If error is not ENOENT
   */
  private handleTemplateDeleteError(error: any, name: string): void {
    const errorCode = (error as NodeJS.ErrnoException).code;
    if (errorCode !== 'ENOENT') {
      logger.error(`Failed to delete template ${name}:`, {
        error: error.message,
        code: errorCode,
        stack: error.stack
      });
      ErrorManager.throw(TemplateManagerError, `Failed to delete template ${name}: ${error}`);
    } else {
      logger.debug(`Template ${name} already deleted or does not exist (ENOENT)`);
    }
  }

  /**
   * Validates that a path is a directory.
   * 
   * @private
   * @param {string} dir - Directory path to validate
   * @returns {Promise<void>}
   * @throws {TemplateManagerError} If path is not a directory
   */
  private async validateDirectory(dir: string): Promise<void> {
    logger.debug(`Validating directory: ${dir}`);
    try {
      const stats = await fs.stat(dir);
      if (!stats.isDirectory()) {
        logger.error(`Path is not a directory: ${dir}`);
        ErrorManager.throw(TemplateManagerError, 'Specified path is not a directory');
      }
      logger.debug(`Directory validation successful: ${dir}`);
    } catch (error) {
      logger.error(`Directory validation failed: ${dir}`, {
        error: error,
      });
      throw error;
    }
  }
}
