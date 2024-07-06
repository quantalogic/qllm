// src/templates/template_manager.ts
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { TemplateDefinition } from './types';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error_manager';

export const TEMPLATE_DIR = "prompts";

class TemplateManager {
    private templatesDir: string;
    private fileCache: Map<string, string> = new Map();

    constructor() {
        this.templatesDir = path.join(process.cwd(), TEMPLATE_DIR);
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
            template.resolved_content = await this.resolveFileInclusions(template.content);
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

    /**
     * Resolves file inclusions in the template content.
     * @param content The template content to process.
     * @param visitedFiles Set of visited files to prevent circular dependencies
     * @returns The processed content with file inclusions resolved.
     */
    private async resolveFileInclusions(content: string, visitedFiles: Set<string> = new Set()): Promise<string> {
        const fileInclusionRegex = /{{file:\s*([^}]+)\s*}}/g;
        let resolvedContent = content;
        let match;

        while ((match = fileInclusionRegex.exec(content)) !== null) {
            const [fullMatch, filePath] = match;
            const fullPath = path.resolve(this.templatesDir, filePath.trim());

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

    /**
     * Parses variables from command line arguments and template content, including included files.
     * @param args Command line arguments
     * @param template Template definition
     * @returns Parsed variables
     */
    async parseVariables(args: string[], template: TemplateDefinition): Promise<Record<string, string>> {
        const variables: Record<string, string> = {};
        const variablePattern = /^-v:(\w+)$/;
        
        // Parse command line arguments
        for (let i = 0; i < args.length; i++) {
            const match = args[i].match(variablePattern);
            if (match) {
                const variableName = match[1];
                const variableValue = args[i + 1];
                if (variableValue && !variableValue.startsWith('-')) {
                    variables[variableName] = variableValue;
                    i++; // Skip the next argument as it's the value
                } else {
                    logger.warn(`Missing value for variable: ${variableName}`);
                }
            }
        }

        // Parse variables from template content, including included files
        await this.parseContentVariables(template.content, variables);

        return variables;
    }

    /**
     * Recursively parses variables from content, including included files.
     * @param content Content to parse
     * @param variables Variables object to update
     * @param visitedFiles Set of visited files to prevent circular dependencies
     */
    private async parseContentVariables(
        content: string, 
        variables: Record<string, string>, 
        visitedFiles: Set<string> = new Set()
    ): Promise<void> {
        const fileInclusionRegex = /{{file:\s*([^}]+)\s*}}/g;
        const variableRegex = /{{(\w+)}}/g;

        let match;
        while ((match = fileInclusionRegex.exec(content)) !== null) {
            const [fullMatch, filePath] = match;
            const fullPath = path.resolve(this.templatesDir, filePath.trim());

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
                await this.parseContentVariables(fileContent, variables, visitedFiles);
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
                variables[variableName] = ''; // Placeholder for undefined variables
            }
        }
    }
}

export const templateManager = new TemplateManager();