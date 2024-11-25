/**
 * @fileoverview Template Loader for QLLM Library
 * 
 * This module provides a robust and flexible system for loading template definitions
 * from various file formats. Key features include:
 * 
 * - Support for multiple file formats (JSON, YAML)
 * - Automatic content type detection
 * - Resolution of included content and dependencies
 * - Builder pattern support for template modification
 * - Error handling with detailed diagnostics
 * 
 * The loader handles all aspects of template loading, from file reading to
 * content resolution, ensuring templates are properly initialized before use.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * @since 2023
 * 
 * @example
 * ```typescript
 * // Load a template from YAML
 * const yamlTemplate = await TemplateLoader.load('templates/greeting.yaml');
 * 
 * // Load a template from JSON
 * const jsonTemplate = await TemplateLoader.load('templates/response.json');
 * 
 * // Load and modify a template using builder pattern
 * const builder = await TemplateLoader.loadAsBuilder('templates/base.yaml');
 * builder
 *   .setName('custom-template')
 *   .addVariable('user', { type: 'string', required: true })
 *   .setContent('Hello {{user}}!');
 * 
 * const customTemplate = builder.build();
 * ```
 * 
 * @see {@link TemplateDefinitionBuilder} for template modification
 * @see {@link TemplateManager} for template management
 */

import { TemplateDefinitionWithResolvedContent } from './template-schema';
import { TemplateDefinitionBuilder } from './template-definition-builder';
import { loadContent, resolveIncludedContent } from '../utils/document/document-inclusion-resolver';

/**
 * Utility class for loading and initializing template definitions from files.
 * Provides a high-level interface for template loading operations with built-in
 * support for different file formats and content resolution.
 * 
 * Key features:
 * - Automatic MIME type detection
 * - Content resolution for included files
 * - Builder pattern support
 * - Error handling with context
 * 
 * @class TemplateLoader
 * 
 * @example
 * ```typescript
 * // Basic template loading
 * const template = await TemplateLoader.load('templates/basic.yaml');
 * 
 * // Loading with included content
 * const complexTemplate = await TemplateLoader.load('templates/complex.yaml');
 * // Will automatically resolve any included files referenced in the template
 * 
 * // Load for modification
 * const builder = await TemplateLoader.loadAsBuilder('templates/base.yaml');
 * const modified = builder
 *   .addVariable('apiKey', { type: 'string', required: true })
 *   .build();
 * ```
 */
export class TemplateLoader {
  /**
   * Loads a template definition from a file and resolves all included content.
   * Automatically detects the file format and handles content resolution for
   * any included files or dependencies.
   * 
   * @static
   * @param {string} inputFilePath - Path to the template definition file (JSON or YAML)
   * @returns {Promise<TemplateDefinitionWithResolvedContent>} Fully resolved template definition
   * @throws {Error} If file loading fails, format is invalid, or content resolution fails
   * 
   * @example
   * ```typescript
   * try {
   *   const template = await TemplateLoader.load('templates/api-call.yaml');
   *   console.log('Template loaded:', template.name);
   *   console.log('Variables:', template.variables);
   * } catch (error) {
   *   console.error('Failed to load template:', error.message);
   * }
   * ```
   */
  static async load(inputFilePath: string): Promise<TemplateDefinitionWithResolvedContent> {
    const content = await loadContent(inputFilePath, inputFilePath);
    const builder = getBuilder(content);
    const template = builder.build();
    const resolvedContent = await resolveIncludedContent(template.content, inputFilePath);

    return { ...template, content: resolvedContent };
  }

  /**
   * Loads a template as a builder for further modification.
   * 
   * @static
   * @param {string} inputFilePath - Path to the template definition file
   * @returns {Promise<TemplateDefinitionBuilder>} Builder with loaded template
   * @throws {Error} If file loading or content resolution fails
   */
  static async loadAsBuilder(inputFilePath: string): Promise<TemplateDefinitionBuilder> {
    const content = await loadContent(inputFilePath, inputFilePath);
    const builder = getBuilder(content);
    const resolvedContent = await resolveIncludedContent(builder.build().content, inputFilePath);

    return builder.setResolvedContent(resolvedContent);
  }
}

/**
 * Creates a template builder from loaded content.
 * 
 * @private
 * @param {Object} content - Loaded content with MIME type
 * @param {string} content.mimeType - MIME type of the content ('application/json' or 'text/yaml')
 * @param {string} content.content - Raw content string
 * @returns {TemplateDefinitionBuilder} Template builder instance
 */
function getBuilder(content: { mimeType: string; content: string }): TemplateDefinitionBuilder {
  const { mimeType, content: contentString } = content;
  if (mimeType === 'application/json') {
    return TemplateDefinitionBuilder.fromJSON(contentString);
  }
  return TemplateDefinitionBuilder.fromYAML(contentString);
}
