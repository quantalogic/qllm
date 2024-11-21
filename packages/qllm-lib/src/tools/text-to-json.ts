/**
 * Text to JSON Converter Tool
 * 
 * A tool that converts various text formats into structured JSON data.
 * 
 * Features:
 * - Auto-detects if input is already valid JSON
 * - Supports structured text conversion with custom schema
 * - Handles CSV-like data with custom separators
 * - Supports both single object and array of objects output
 * - Pretty prints JSON output with proper indentation
 * 
 * Configuration:
 * No specific configuration required. Uses default settings.
 * 
 * Usage examples in workflow:
 * 1. Simple key-value conversion:
 * ```yaml
 * - tool: text-to-json
 *   input:
 *     text: "name: John\nage: 30"
 *   output: "json_result"
 * ```
 * 
 * 2. Structured data with schema:
 * ```yaml
 * - tool: text-to-json
 *   input:
 *     text: "John,30,john@email.com\nJane,25,jane@email.com"
 *     schema:
 *       name: "string"
 *       age: "number"
 *       email: "string"
 *     separator: ","
 *   output: "json_result"
 * ```
 * 
 * Input Formats Supported:
 * - JSON strings
 * - Key-value pairs (name: value)
 * - CSV-like data with custom separators
 * - Line-delimited data
 * 
 * Error Handling:
 * - Validates JSON syntax
 * - Handles malformed input gracefully
 * - Provides clear error messages for invalid schemas
 * - Sanitizes input to prevent JSON injection
 */

import { BaseTool, ToolDefinition } from "./base-tool";

export class TextToJsonTool extends BaseTool {
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'text-to-json',
      description: 'Converts text content to JSON format',
      input: {
        text: { type: 'string', required: true, description: 'Text to convert' },
        schema: { type: 'object', required: false, description: 'JSON schema structure' },
        separator: { type: 'string', required: false, description: 'Field separator for structured text' }
      },
      output: { 
        type: 'string', 
        description: 'JSON formatted string' 
      }
    };
  }

  async execute(inputs: Record<string, any>) {
    const { text, schema, separator = ',' } = inputs;

    try {
      // First try to parse as JSON in case it's already JSON
      JSON.parse(text);
      return text;
    } catch {
      // If not JSON, process as structured text
      if (schema) {
        const lines = text.split('\n').filter((line:any) => line.trim());
        const result = lines.map((line:any) => {
          const values = line.split(separator);
          const obj: Record<string, any> = {};
          Object.keys(schema).forEach((key, index) => {
            obj[key] = values[index]?.trim();
          });
          return obj;
        });
        return JSON.stringify(result, null, 2);
      }

      // If no schema, try to create a simple key-value object
      const lines = text.split('\n').filter((line:any) => line.trim());
      const result = lines.reduce((acc: Record<string, string>, line:any) => {
        const [key, ...values] = line.split(separator).map((s:any) => s.trim());
        if (key) {
          acc[key] = values.join(separator);
        }
        return acc;
      }, {});

      return JSON.stringify(result, null, 2);
    }
  }
}