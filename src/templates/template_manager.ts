// src/templates/template_manager.ts
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { TemplateDefinition } from './types';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error_manager';

class TemplateManager {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'templates');
  }

  /**
   * Initializes the templates directory.
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create templates directory: ${error}`);
      ErrorManager.throwError('TemplateManagerError', `Failed to create templates directory: ${error}`);
    }
  }

  /**
   * Lists all available templates.
   * @returns An array of template names.
   */
  async listTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.templatesDir);
      return files.filter(file => file.endsWith('.yaml')).map(file => path.basename(file, '.yaml'));
    } catch (error) {
      logger.error(`Failed to list templates: ${error}`);
      ErrorManager.throwError('TemplateManagerError', `Failed to list templates: ${error}`);
    }
  }

  /**
   * Retrieves a specific template by name.
   * @param name The name of the template to retrieve.
   * @returns The template definition.
   */
  async getTemplate(name: string): Promise<TemplateDefinition> {
    const filePath = path.join(this.templatesDir, `${name}.yaml`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const template = yaml.load(content) as TemplateDefinition;
      if (!template || typeof template !== 'object') {
        ErrorManager.throwError('TemplateManagerError', `Invalid template structure for ${name}`);
      }
      return template;
    } catch (error) {
      logger.error(`Failed to read template ${name}: ${error}`);
      ErrorManager.throwError('TemplateManagerError', `Failed to read template ${name}: ${error}`);
    }
  }

  /**
   * Saves a template.
   * @param template The template to save.
   */
  async saveTemplate(template: TemplateDefinition): Promise<void> {
    const filePath = path.join(this.templatesDir, `${template.name}.yaml`);
    try {
      const content = yaml.dump(template);
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      logger.error(`Failed to save template ${template.name}: ${error}`);
      ErrorManager.throwError('TemplateManagerError', `Failed to save template ${template.name}: ${error}`);
    }
  }

  /**
   * Deletes a template.
   * @param name The name of the template to delete.
   */
  async deleteTemplate(name: string): Promise<void> {
    const filePath = path.join(this.templatesDir, `${name}.yaml`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.error(`Failed to delete template ${name}: ${error}`);
      ErrorManager.throwError('TemplateManagerError', `Failed to delete template ${name}: ${error}`);
    }
  }

  /**
   * Updates an existing template.
   * @param name The name of the template to update.
   * @param updatedTemplate The updated template definition.
   */
  async updateTemplate(name: string, updatedTemplate: TemplateDefinition): Promise<void> {
    try {
      const existingTemplate = await this.getTemplate(name);
      const mergedTemplate = { ...existingTemplate, ...updatedTemplate };
      await this.saveTemplate(mergedTemplate);
    } catch (error) {
      logger.error(`Failed to update template ${name}: ${error}`);
      ErrorManager.throwError('TemplateManagerError', `Failed to update template ${name}: ${error}`);
    }
  }

  /**
   * Checks if a template exists.
   * @param name The name of the template to check.
   * @returns True if the template exists, false otherwise.
   */
  async templateExists(name: string): Promise<boolean> {
    const filePath = path.join(this.templatesDir, `${name}.yaml`);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const templateManager = new TemplateManager();