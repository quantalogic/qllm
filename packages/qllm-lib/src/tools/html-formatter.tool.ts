/**
 * @fileoverview HTML Formatter Tool
 * This module provides functionality to format content into HTML with customizable templates
 * and sanitization options.
 * @module html-formatter
 */

import { BaseTool, ToolDefinition } from "./base-tool";
import sanitizeHtml from 'sanitize-html'; // Add this dependency for security
import { marked } from 'marked'; // Add for Markdown support

/**
 * @interface FormatterConfig
 * @description Configuration options for HTML formatter
 */
interface FormatterConfig {
  /** Default HTML template */
  defaultTemplate?: string;
  /** Sanitization options */
  sanitize?: boolean;
  /** Support Markdown conversion */
  markdown?: boolean;
  /** Custom sanitization options */
  sanitizeOptions?: sanitizeHtml.IOptions;
}

/**
 * @class HtmlFormatterTool
 * @extends BaseTool
 * @description A tool for formatting content into HTML with security features and templates
 */
export class HtmlFormatterTool extends BaseTool {
  private defaultTemplate: string;
  private sanitize: boolean;
  private markdown: boolean;
  private sanitizeOptions: sanitizeHtml.IOptions;

  /**
   * @constructor
   * @param {FormatterConfig} config - Formatter configuration options
   */
  constructor(config: FormatterConfig = {}) {
    super(config);
    this.defaultTemplate = config.defaultTemplate || `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{{title}}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .content { max-width: 800px; margin: 0 auto; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="content">
            {{content}}
          </div>
        </body>
      </html>
    `;
    this.sanitize = config.sanitize ?? true;
    this.markdown = config.markdown ?? false;
    this.sanitizeOptions = config.sanitizeOptions || {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['class', 'id', 'style']
      }
    };
  }

  /**
   * @method getDefinition
   * @returns {ToolDefinition} Tool definition object
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'html-formatter',
      description: 'Formats content as HTML with security features and template support',
      input: {
        content: { 
          type: 'string', 
          required: true, 
          description: 'Content to format' 
        },
        template: { 
          type: 'string', 
          required: false, 
          description: 'Custom HTML template' 
        },
        title: {
          type: 'string',
          required: false,
          description: 'Page title'
        },
        markdown: {
          type: 'boolean',
          required: false,
          description: 'Process content as Markdown'
        },
        sanitize: {
          type: 'boolean',
          required: false,
          description: 'Enable/disable HTML sanitization'
        }
      },
      output: { 
        type: 'string', 
        description: 'Formatted and sanitized HTML content' 
      }
    };
  }

  /**
   * @private
   * @method processContent
   * @param {string} content - Raw content to process
   * @returns {string} Processed content
   */
  private processContent(content: string, useMarkdown: boolean): string {
    if (useMarkdown) {
      content = marked(content) as string;
    }
    if (this.sanitize) {
      content = sanitizeHtml(content, this.sanitizeOptions);
    }
    return content;
  }

  /**
   * @private
   * @method applyTemplate
   * @param {string} template - HTML template
   * @param {Record<string, string>} variables - Template variables
   * @returns {string} Processed template
   */
  private applyTemplate(template: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce(
      (result, [key, value]) => result.replace(
        new RegExp(`{{${key}}}`, 'g'), 
        value
      ),
      template
    );
  }

  /**
   * @method execute
   * @async
   * @param {Record<string, any>} inputs - Input parameters
   * @returns {Promise<string>} Formatted HTML content
   * @throws {Error} If content processing fails
   */
  async execute(inputs: Record<string, any>): Promise<string> {
    try {
      const {
        content,
        template = this.defaultTemplate,
        title = 'Generated Content',
        markdown = this.markdown,
        sanitize = this.sanitize
      } = inputs;

      // Process content
      const processedContent = this.processContent(content, markdown);

      // Apply template
      return this.applyTemplate(template, {
        content: processedContent,
        title
      });
    } catch (error) {
      throw new Error(`HTML formatting failed: ${error}`);
    }
  }
}