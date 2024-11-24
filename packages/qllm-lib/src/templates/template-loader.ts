/**
 * @fileoverview Template Loader for QLLM Library
 * 
 * This module provides functionality for loading template definitions from files.
 * It supports both JSON and YAML formats and handles the resolution of included
 * content within templates.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * 
 * @example
 * ```typescript
 * // Load a template definition
 * const template = await TemplateLoader.load('path/to/template.yaml');
 * 
 * // Load as a builder for further modification
 * const builder = await TemplateLoader.loadAsBuilder('path/to/template.json');
 * ```
 */

import { TemplateDefinitionWithResolvedContent } from './template-schema';
import { TemplateDefinitionBuilder } from './template-definition-builder';
import { loadContent, resolveIncludedContent } from '../utils/document/document-inclusion-resolver';

/**
 * Utility class for loading template definitions from files.
 * Supports both JSON and YAML formats and handles content resolution.
 * 
 * @class TemplateLoader
 */
export class TemplateLoader {
  /**
   * Loads a template definition from a file and resolves included content.
   * 
   * @static
   * @param {string} inputFilePath - Path to the template definition file
   * @returns {Promise<TemplateDefinitionWithResolvedContent>} Loaded and resolved template
   * @throws {Error} If file loading or content resolution fails
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
