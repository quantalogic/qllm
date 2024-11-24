/**
 * @fileoverview Template Manager for QLLM Library
 * 
 * This module provides a file system-based template management system for QLLM.
 * It handles template storage, retrieval, and management operations while providing
 * error handling and logging capabilities.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * 
 * @example
 * ```typescript
 * const manager = new TemplateManager({ promptDirectory: './templates' });
 * await manager.init();
 * 
 * // List available templates
 * const templates = await manager.listTemplates();
 * 
 * // Save a new template
 * await manager.saveTemplate({
 *   name: 'example',
 *   content: 'Hello {{name}}!',
 *   version: '1.0.0'
 * });
 * ```
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
 */
export interface TemplateManagerConfig {
  /** Directory path where template files are stored */
  promptDirectory: string;
}

/**
 * Manages template storage and retrieval operations.
 * Provides a file system-based storage system for templates with caching capabilities.
 * 
 * @class TemplateManager
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
    this.templateDir = config.promptDirectory;
  }

  /**
   * Initializes the template manager by ensuring the template directory exists.
   * 
   * @returns {Promise<void>}
   * @throws {TemplateManagerError} If directory initialization fails
   */
  async init(): Promise<void> {
    await this.ensureTemplateDirectory();
  }

  /**
   * Lists all available templates in the template directory.
   * Only includes files with .yaml extension.
   * 
   * @returns {Promise<string[]>} List of template names (without extension)
   */
  async listTemplates(): Promise<string[]> {
    return this.getYamlFilesInDirectory();
  }

  /**
   * Retrieves a template by name.
   * 
   * @param {string} name - Name of the template to retrieve
   * @returns {Promise<TemplateDefinition | null>} Template if found, null otherwise
   */
  async getTemplate(name: string): Promise<TemplateDefinition | null> {
    const filePath = this.getFilePath(name);
    try {
      return await TemplateLoader.load(filePath);
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
    const templateBuilder = TemplateDefinitionBuilder.fromTemplate(template);
    const filePath = this.getFilePath(template.name);
    try {
      const content = templateBuilder.toYAML();
      await fs.writeFile(filePath, content, 'utf-8');
      logger.info(`Saved template ${template.name} to ${filePath}`);
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
    const filePath = this.getFilePath(name);
    try {
      await fs.unlink(filePath);
      logger.info(`Deleted template ${name} from ${filePath}`);
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
    const existingTemplate = await this.getTemplate(name);
    if (!existingTemplate) {
      ErrorManager.throw(TemplateManagerError, `Template ${name} not found`);
    }
    const mergedTemplate: TemplateDefinition = {
      ...existingTemplate,
      ...updatedTemplate,
    };

    await this.saveTemplate(mergedTemplate);
  }

  /**
   * Checks if a template exists.
   * 
   * @param {string} name - Name of the template to check
   * @returns {Promise<boolean>} True if template exists, false otherwise
   */
  async templateExists(name: string): Promise<boolean> {
    const filePath = this.getFilePath(name);
    try {
      await fs.access(filePath);
      return true;
    } catch {
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
    try {
      const expandedDir = path.resolve(directory);
      await this.validateDirectory(expandedDir);
      this.templateDir = expandedDir;
      logger.info(`Prompt directory set to: ${expandedDir}`);
    } catch (error) {
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
    try {
      await fs.mkdir(this.templateDir, { recursive: true });
      logger.debug(`Ensured template directory exists: ${this.templateDir}`);
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
    try {
      logger.debug(`Scanning directory: ${this.templateDir}`);
      const files = await fs.readdir(this.templateDir);
      const yamlFiles = files.filter((file) => file.endsWith('.yaml'));
      logger.debug(`Found ${yamlFiles.length} YAML files in ${this.templateDir}`);
      return yamlFiles.map((file) => path.basename(file, '.yaml'));
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
    return path.join(this.templateDir, `${name}.yaml`);
  }

  /**
   * Reads a file with caching support.
   * 
   * @private
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} File contents
   */
  private async readFile(filePath: string): Promise<string> {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }
    const content = await fs.readFile(filePath, 'utf-8');
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
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(`Failed to read template ${name}: ${error}`);
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
    logger.error(`Failed to save template ${name}: ${error}`);
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
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(`Failed to delete template ${name}: ${error}`);
      ErrorManager.throw(TemplateManagerError, `Failed to delete template ${name}: ${error}`);
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
    const stats = await fs.stat(dir);
    if (!stats.isDirectory()) {
      ErrorManager.throw(TemplateManagerError, 'Specified path is not a directory');
    }
  }
}
