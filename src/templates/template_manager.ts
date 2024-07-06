// src/templates/template_manager.ts

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { TemplateDefinition } from './types';
import { logger } from '../utils/logger';

class TemplateManager {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'templates');
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create templates directory: ${error}`);
      throw error;
    }
  }

  async listTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.templatesDir);
      return files.filter(file => file.endsWith('.yaml'));
    } catch (error) {
      logger.error(`Failed to list templates: ${error}`);
      throw error;
    }
  }

  async getTemplate(name: string): Promise<TemplateDefinition> {
    const filePath = path.join(this.templatesDir, `${name}.yaml`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const template = yaml.load(content) as TemplateDefinition;
      if (!template || typeof template !== 'object') {
        throw new Error(`Invalid template structure for ${name}`);
      }
      return template;
    } catch (error) {
      logger.error(`Failed to read template ${name}: ${error}`);
      throw error;
    }
  }

  async saveTemplate(template: TemplateDefinition): Promise<void> {
    const filePath = path.join(this.templatesDir, `${template.name}.yaml`);
    try {
      const content = yaml.dump(template);
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      logger.error(`Failed to save template ${template.name}: ${error}`);
      throw error;
    }
  }

  async deleteTemplate(name: string): Promise<void> {
    const filePath = path.join(this.templatesDir, `${name}.yaml`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.error(`Failed to delete template ${name}: ${error}`);
      throw error;
    }
  }
}

export const templateManager = new TemplateManager();