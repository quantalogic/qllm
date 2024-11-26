/**
 * @fileoverview Text to JSON Converter Tool
 * This module provides functionality to convert various text formats into structured JSON data
 * with support for schemas, custom separators, and automatic format detection.
 * @module text-to-json
 */

import { BaseTool, ToolDefinition } from "./base-tool";

/**
 * @interface SchemaDefinition
 * @description Defines the structure for data conversion
 */
interface SchemaDefinition {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'date';
    required?: boolean;
    default?: any;
    format?: string;
  };
}

/**
 * @interface ConversionOptions
 * @description Configuration options for text to JSON conversion
 */
interface ConversionOptions {
  /** Custom field separator */
  separator?: string;
  /** Line separator */
  lineSeparator?: string;
  /** Trim whitespace */
  trim?: boolean;
  /** Skip empty lines */
  skipEmpty?: boolean;
  /** Pretty print output */
  pretty?: boolean;
  /** Indentation spaces */
  indent?: number;
}

/**
 * @class TextToJsonTool
 * @extends BaseTool
 * @description Converts various text formats into structured JSON data
 */
export class TextToJsonTool extends BaseTool {
  private defaultOptions: ConversionOptions = {
    separator: ',',
    lineSeparator: '\n',
    trim: true,
    skipEmpty: true,
    pretty: true,
    indent: 2
  };

  /**
   * @constructor
   * @param {Record<string, any>} config - Tool configuration
   */
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  /**
   * @method getDefinition
   * @returns {ToolDefinition} Tool definition
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'text-to-json',
      description: 'Converts text content to JSON format with schema support',
      input: {
        text: { 
          type: 'string', 
          required: true, 
          description: 'Text to convert' 
        },
        schema: { 
          type: 'object', 
          required: false, 
          description: 'JSON schema structure' 
        },
        options: {
          type: 'object',
          required: false,
          description: 'Conversion options'
        }
      },
      output: { 
        type: 'string', 
        description: 'JSON formatted string' 
      }
    };
  }

  /**
   * @private
   * @method validateSchema
   * @param {SchemaDefinition} schema - Schema to validate
   * @throws {Error} If schema is invalid
   */
  private validateSchema(schema: SchemaDefinition): void {
    const validTypes = ['string', 'number', 'boolean', 'date'];
    Object.entries(schema).forEach(([key, def]) => {
      if (!validTypes.includes(def.type)) {
        throw new Error(`Invalid type '${def.type}' for field '${key}'`);
      }
    });
  }

  /**
   * @private
   * @method convertValue
   * @param {string} value - Value to convert
   * @param {string} type - Target type
   * @returns {any} Converted value
   */
  private convertValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'date':
        return new Date(value).toISOString();
      default:
        return value;
    }
  }

  /**
   * @private
   * @method processStructuredText
   * @param {string} text - Input text
   * @param {SchemaDefinition} schema - Data schema
   * @param {ConversionOptions} options - Conversion options
   * @returns {any} Processed data
   */
  private processStructuredText(
    text: string, 
    schema: SchemaDefinition, 
    options: ConversionOptions
  ): any {
    const lines = text.split(options.lineSeparator!)
      .filter(line => options.skipEmpty ? line.trim() : true);

    return lines.map(line => {
      const values = line.split(options.separator!);
      const obj: Record<string, any> = {};

      Object.entries(schema).forEach(([key, def], index) => {
        let value = values[index];
        if (options.trim) {
          value = value?.trim();
        }

        if (!value && def.required) {
          throw new Error(`Required field '${key}' is missing`);
        }

        obj[key] = value ? 
          this.convertValue(value, def.type) : 
          def.default;
      });

      return obj;
    });
  }

  /**
   * @method execute
   * @async
   * @param {Record<string, any>} inputs - Input parameters
   * @returns {Promise<string>} JSON formatted string
   * @throws {Error} If conversion fails
   */
  async execute(inputs: Record<string, any>): Promise<string> {
    try {
      const { text, schema, options = {} } = inputs;
      const conversionOptions = { ...this.defaultOptions, ...options };

      // Try parsing as JSON first
      try {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed, null, conversionOptions.indent);
      } catch {
        // Not valid JSON, continue with conversion
      }

      let result: any;

      if (schema) {
        this.validateSchema(schema);
        result = this.processStructuredText(text, schema, conversionOptions);
      } else {
        // Simple key-value parsing
        result = text.split(conversionOptions.lineSeparator!)
          .filter((line:any) => conversionOptions.skipEmpty ? line.trim() : true)
          .reduce((acc: Record<string, string>, line:any) => {
            const [key, ...values] = line.split(conversionOptions.separator!);
            if (key?.trim()) {
              acc[key.trim()] = values.join(conversionOptions.separator!).trim();
            }
            return acc;
          }, {});
      }

      return JSON.stringify(
        result, 
        null, 
        conversionOptions.pretty ? conversionOptions.indent : 0
      );
    } catch (error) {
      throw new Error(`Text to JSON conversion failed: ${error}`);
    }
  }
}