// src/templates/template_manager.ts

import fs from 'fs/promises';
import path from 'path';
import { Template } from './template';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error';
import { TemplateManagerError } from './types';

export interface TemplateManagerConfig {
  promptDirectory: string;
}

export class TemplateManager {
  private templateDir: string;
  private fileCache: Map<string, string> = new Map();

  constructor(config: TemplateManagerConfig) {
    this.templateDir = config.promptDirectory;
  }

  async init(): Promise<void> {
    await this.ensureTemplateDirectory();
  }

  async listTemplates(): Promise<string[]> {
    return this.getYamlFilesInDirectory();
  }

  async getTemplate(name: string): Promise<Template | null> {
    const filePath = this.getFilePath(name);
    try {
      const content = await this.readFile(filePath);
      return Template.fromYaml(content);
    } catch (error) {
      this.handleTemplateReadError(error, name);
      return null;
    }
  }

  async saveTemplate(template: Template): Promise<void> {
    const filePath = this.getFilePath(template.name);
    try {
      const content = template.toYaml();
      await fs.writeFile(filePath, content, 'utf-8');
      logger.info(`Saved template ${template.name} to ${filePath}`);
    } catch (error) {
      this.handleTemplateSaveError(error, template.name);
    }
  }

  async deleteTemplate(name: string): Promise<void> {
    const filePath = this.getFilePath(name);
    try {
      await fs.unlink(filePath);
      logger.info(`Deleted template ${name} from ${filePath}`);
    } catch (error) {
      this.handleTemplateDeleteError(error, name);
    }
  }

  async updateTemplate(name: string, updatedTemplate: Partial<Template>): Promise<void> {
    const existingTemplate = await this.getTemplate(name);
    if (!existingTemplate) {
      ErrorManager.throw(TemplateManagerError, `Template ${name} not found`);
    }
    const mergedTemplate = new Template({
      ...existingTemplate.toObject(),
      ...updatedTemplate,
    });
    await this.saveTemplate(mergedTemplate);
  }

  async templateExists(name: string): Promise<boolean> {
    const filePath = this.getFilePath(name);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

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

  async resolveFileInclusions(template: Template): Promise<void> {
    const resolvedContent = await this.resolveFileInclusionsInContent(template.content);
    template.resolved_content = resolvedContent;
  }

  // Private helper methods

  private async ensureTemplateDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.templateDir, { recursive: true });
      logger.debug(`Ensured template directory exists: ${this.templateDir}`);
    } catch (error) {
      logger.error(`Failed to initialize template directory: ${error}`);
      ErrorManager.throw(TemplateManagerError, `Failed to initialize template directory: ${error}`);
    }
  }

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

  private getFilePath(name: string): string {
    return path.join(this.templateDir, `${name}.yaml`);
  }

  private async readFile(filePath: string): Promise<string> {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }
    const content = await fs.readFile(filePath, 'utf-8');
    this.fileCache.set(filePath, content);
    return content;
  }

  private handleTemplateReadError(error: any, name: string): void {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(`Failed to read template ${name}: ${error}`);
    }
  }

  private handleTemplateSaveError(error: any, name: string): void {
    logger.error(`Failed to save template ${name}: ${error}`);
    ErrorManager.throw(TemplateManagerError, `Failed to save template ${name}: ${error}`);
  }

  private handleTemplateDeleteError(error: any, name: string): void {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(`Failed to delete template ${name}: ${error}`);
      ErrorManager.throw(TemplateManagerError, `Failed to delete template ${name}: ${error}`);
    }
  }

  private async validateDirectory(dir: string): Promise<void> {
    const stats = await fs.stat(dir);
    if (!stats.isDirectory()) {
      ErrorManager.throw(TemplateManagerError, 'Specified path is not a directory');
    }
  }

  private async resolveFileInclusionsInContent(
    content: string,
    visitedFiles: Set<string> = new Set()
  ): Promise<string> {
    const fileInclusionRegex = /{{file:\s*([^}]+)\s*}}/g;
    let resolvedContent = content;
    let match;

    while ((match = fileInclusionRegex.exec(content)) !== null) {
      const [fullMatch, filePath] = match;
      resolvedContent = await this.resolveFileInclusion(resolvedContent, fullMatch, filePath, visitedFiles);
    }

    return resolvedContent;
  }

  private async resolveFileInclusion(
    content: string,
    fullMatch: string,
    filePath: string,
    visitedFiles: Set<string>
  ): Promise<string> {
    const fullPath = path.resolve(this.templateDir, filePath.trim());
    if (visitedFiles.has(fullPath)) {
      ErrorManager.throw(TemplateManagerError, `Circular file inclusion detected: ${filePath}`);
    }

    try {
      const fileContent = await this.readFile(fullPath);
      visitedFiles.add(fullPath);
      const resolvedFileContent = await this.resolveFileInclusionsInContent(fileContent, visitedFiles);
      visitedFiles.delete(fullPath);
      return content.replace(fullMatch, resolvedFileContent);
    } catch (error) {
      ErrorManager.throw(TemplateManagerError, `Failed to include file ${filePath}: ${error}`);
    }
  }
}