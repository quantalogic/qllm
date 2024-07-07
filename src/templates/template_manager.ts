// src/templates/template_manager.ts
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { TemplateDefinition, TemplateVariable } from './types';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error_manager';
import { configManager } from '../utils/configuration_manager';

export class TemplateManager {
  private templateDir: string;
  private fileCache: Map<string, string> = new Map();

  constructor() {
    this.templateDir = configManager.getConfig().promptDirectory;
    logger.debug(`Template directory: ${this.templateDir}`);
  }

  /**
   * Initializes the templates directory.
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.templateDir, { recursive: true });
      logger.debug(`Ensured template directory exists: ${this.templateDir}`);
    } catch (error) {
      logger.error(`Failed to create templates directory ${this.templateDir}: ${error}`);
      ErrorManager.throwError('TemplateManagerError', `Failed to create templates directory ${this.templateDir}: ${error}`);
    }
  }

  /**
   * Lists all available templates.
   * @returns An array of template names.
   */
  async listTemplates(): Promise<string[]> {
    try {
      logger.debug(`Scanning directory: ${this.templateDir}`);
      const files = await fs.readdir(this.templateDir);
      const yamlFiles = files.filter(file => file.endsWith('.yaml'));
      logger.debug(`Found ${yamlFiles.length} YAML files in ${this.templateDir}`);
      return yamlFiles.map(file => path.basename(file, '.yaml'));
    } catch (error) {
      logger.error(`Failed to read directory ${this.templateDir}: ${error}`);
      return [];
    }
  }

  /**
   * Retrieves a specific template by name.
   * @param name The name of the template to retrieve.
   * @returns The template definition or null if not found.
   */
  async getTemplate(name: string): Promise<TemplateDefinition | null> {
    const filePath = path.join(this.templateDir, `${name}.yaml`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const template = yaml.load(content) as TemplateDefinition;
      if (!template || typeof template !== 'object') {
        ErrorManager.throwError('TemplateManagerError', `Invalid template structure for ${name}`);
      }
      template.resolved_content = await this.resolveFileInclusions(template.content);
      return template;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error(`Failed to read template ${name}: ${error}`);
      }
      return null;
    }
  }

  /**
   * Saves a template.
   * @param template The template to save.
   */
  async saveTemplate(template: TemplateDefinition): Promise<void> {
    const filePath = path.join(this.templateDir, `${template.name}.yaml`);
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
    const filePath = path.join(this.templateDir, `${name}.yaml`);
    try {
      await fs.unlink(filePath);
      logger.info(`Deleted template ${name} from ${this.templateDir}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error(`Failed to delete template ${name}: ${error}`);
        ErrorManager.throwError('TemplateManagerError', `Failed to delete template ${name}: ${error}`);
      }
    }
  }

  /**
   * Updates an existing template.
   * @param name The name of the template to update.
   * @param updatedTemplate The updated template definition.
   */
  async updateTemplate(name: string, updatedTemplate: TemplateDefinition): Promise<void> {
    const existingTemplate = await this.getTemplate(name);
    if (!existingTemplate) {
      ErrorManager.throwError('TemplateManagerError', `Template ${name} not found`);
    }
    const mergedTemplate = { ...existingTemplate, ...updatedTemplate };
    await this.saveTemplate(mergedTemplate);
  }

  /**
   * Checks if a template exists.
   * @param name The name of the template to check.
   * @returns True if the template exists, false otherwise.
   */
  async templateExists(name: string): Promise<boolean> {
    const filePath = path.join(this.templateDir, `${name}.yaml`);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parses variables from command line arguments and template content.
   * @param args Command line arguments
   * @param template Template definition
   * @returns Parsed variables
   */
  async parseVariables(args: string[], template: TemplateDefinition): Promise<Record<string, any>> {
    const variables: Record<string, any> = {};
    const variablePattern = /^-v:(\w+)$/;

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const match = args[i].match(variablePattern);
      if (match) {
        const variableName = match[1];
        const variableValue = args[i + 1];
        if (variableValue && !variableValue.startsWith('-')) {
          variables[variableName] = this.castVariable(variableName, variableValue, template.input_variables);
          i++; // Skip the next argument as it's the value
        } else {
          logger.warn(`Missing value for variable: ${variableName}`);
        }
      }
    }

    // Parse variables from template content, including included files
    await this.parseContentVariables(template.content, variables, template.input_variables);

    return variables;
  }

  /**
   * Sets a new prompt directory.
   * @param directory The directory path to set
   */
  async setPromptDirectory(directory: string): Promise<void> {
    try {
      const expandedDir = this.expandPath(directory);
      const stats = await fs.stat(expandedDir);
      if (!stats.isDirectory()) {
        ErrorManager.throwError('SetPromptDirError', 'Specified path is not a directory');
      }
      configManager.updateConfig({ promptDirectory: expandedDir });
      await configManager.saveConfig();
      this.templateDir = expandedDir;
      logger.info(`Prompt directory set to: ${expandedDir}`);
    } catch (error) {
      ErrorManager.throwError('SetPromptDirError', `Failed to set prompt directory: ${error}`);
    }
  }

  private async parseContentVariables(
    content: string,
    variables: Record<string, any>,
    inputVariables: Record<string, TemplateVariable>,
    visitedFiles: Set<string> = new Set()
  ): Promise<void> {
    const fileInclusionRegex = /{{file:\s*([^}]+)\s*}}/g;
    const variableRegex = /{{(\w+)}}/g;

    let match;
    while ((match = fileInclusionRegex.exec(content)) !== null) {
      const [fullMatch, filePath] = match;
      const fullPath = path.resolve(this.templateDir, filePath.trim());
      if (visitedFiles.has(fullPath)) {
        ErrorManager.throwError('CircularDependencyError', `Circular file inclusion detected: ${filePath}`);
      }
      try {
        let fileContent: string;
        if (this.fileCache.has(fullPath)) {
          fileContent = this.fileCache.get(fullPath)!;
        } else {
          fileContent = await fs.readFile(fullPath, 'utf-8');
          this.fileCache.set(fullPath, fileContent);
        }
        visitedFiles.add(fullPath);
        await this.parseContentVariables(fileContent, variables, inputVariables, visitedFiles);
        visitedFiles.delete(fullPath);
      } catch (error) {
        ErrorManager.throwError('FileInclusionError', `Failed to include file ${filePath}: ${error}`);
      }
    }

    // Parse variables in the current content
    let varMatch;
    while ((varMatch = variableRegex.exec(content)) !== null) {
      const [, variableName] = varMatch;
      if (!(variableName in variables)) {
        variables[variableName] = this.castVariable(variableName, '', inputVariables);
      }
    }
  }

  private castVariable(key: string, value: string, inputVariables: Record<string, TemplateVariable>): any {
    if (inputVariables && inputVariables[key]) {
      const variableType = inputVariables[key].type;
      switch (variableType) {
        case 'number':
          const numberValue = Number(value);
          if (isNaN(numberValue)) {
            ErrorManager.throwError('InputValidationError', `Failed to cast '${value}' to number for variable '${key}'`);
          }
          return numberValue;
        case 'boolean':
          const lowerValue = value.toLowerCase();
          if (lowerValue !== 'true' && lowerValue !== 'false') {
            ErrorManager.throwError('InputValidationError', `Failed to cast '${value}' to boolean for variable '${key}'. Use 'true' or 'false'`);
          }
          return lowerValue === 'true';
        case 'array':
          try {
            // First, attempt to parse as JSON
            return JSON.parse(value);
          } catch {
            // If JSON parsing fails, fall back to comma-separated string splitting
            return value.split(',').map(item => item.trim());
          }
        case 'string':
          return value;
        default:
          ErrorManager.throwError('InputValidationError', `Unknown variable type '${variableType}' for variable '${key}'`);
      }
    }
    return value; // If type is not defined, return as-is
  }

  private async resolveFileInclusions(content: string, visitedFiles: Set<string> = new Set()): Promise<string> {
    const fileInclusionRegex = /{{file:\s*([^}]+)\s*}}/g;
    let resolvedContent = content;
    let match;

    while ((match = fileInclusionRegex.exec(content)) !== null) {
      const [fullMatch, filePath] = match;
      const fullPath = path.resolve(this.templateDir, filePath.trim());
      if (visitedFiles.has(fullPath)) {
        ErrorManager.throwError('FileInclusionError', `Circular file inclusion detected: ${filePath}`);
      }
      try {
        let fileContent: string;
        if (this.fileCache.has(fullPath)) {
          fileContent = this.fileCache.get(fullPath)!;
        } else {
          fileContent = await fs.readFile(fullPath, 'utf-8');
          this.fileCache.set(fullPath, fileContent);
        }
        visitedFiles.add(fullPath);
        const resolvedFileContent = await this.resolveFileInclusions(fileContent, visitedFiles);
        resolvedContent = resolvedContent.replace(fullMatch, resolvedFileContent);
        visitedFiles.delete(fullPath);
      } catch (error) {
        ErrorManager.throwError('FileInclusionError', `Failed to include file ${filePath}: ${error}`);
      }
    }
    return resolvedContent;
  }

  private expandPath(dir: string): string {
    if (dir.startsWith('~')) {
      return path.join(os.homedir(), dir.slice(1));
    }
    if (path.isAbsolute(dir)) {
      return dir;
    }
    return path.resolve(process.cwd(), dir);
  }
}

export const templateManager = new TemplateManager();