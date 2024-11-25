/**
 * @fileoverview Variable Extraction Utility for QLLM Templates
 * 
 * This module provides sophisticated variable extraction capabilities for QLLM templates,
 * supporting various notation styles and complex expressions. It implements a robust
 * parser to identify and extract template variables from content strings.
 * 
 * Key features:
 * - Mustache-style variable syntax ({{ }})
 * - Dot notation support (user.name)
 * - Bracket notation support (user['name'])
 * - Function call detection
 * - Whitespace handling
 * - Nested expression support
 * 
 * @version 1.0.0
 * @module qllm-lib/templates/utils
 * @since 2023
 * 
 * @example
 * ```typescript
 * const content = `
 *   Hello {{user.name}}!
 *   Your score is {{stats.points}}.
 *   Items: {{inventory['items']}}
 * `;
 * 
 * const variables = extractVariablesFromContent({
 *   content,
 *   input_variables: {
 *     'user.name': { type: 'string' }
 *   }
 * }, {
 *   allowDotNotation: true,
 *   allowBracketNotation: true
 * });
 * 
 * // Result:
 * // {
 * //   'user.name': { type: 'string' },
 * //   'stats.points': { type: 'string' },
 * //   "inventory['items']": { type: 'string' }
 * // }
 * ```
 */

import { TemplateVariable } from '../types';

/**
 * Configuration options for variable extraction.
 * Controls how variables are identified and parsed from the content.
 * 
 * @interface ExtractVariablesFromContentOptions
 * @property {boolean} [allowDotNotation] - Allow dot notation in variable names (e.g., user.name)
 * @property {boolean} [allowBracketNotation] - Allow bracket notation (e.g., user['name'])
 * @property {boolean} [allowFunctionCalls] - Allow function call syntax (e.g., format(date))
 */
interface ExtractVariablesFromContentOptions {
  allowDotNotation?: boolean;
  allowBracketNotation?: boolean;
  allowFunctionCalls?: boolean;
}

/**
 * Parser class for extracting variables from template content.
 * Implements a recursive descent parser to handle nested expressions
 * and various notation styles.
 * 
 * @class Parser
 * @private
 */
class Parser {
  private input: string;
  private index: number;
  private options: ExtractVariablesFromContentOptions;

  /**
   * Creates a new Parser instance.
   * 
   * @constructor
   * @param {string} input - The template content to parse
   * @param {ExtractVariablesFromContentOptions} options - Parsing configuration
   */
  constructor(input: string, options: ExtractVariablesFromContentOptions) {
    this.input = input;
    this.index = 0;
    this.options = options;
  }

  /**
   * Looks at the next character without consuming it.
   * 
   * @private
   * @returns {string} Next character or empty string if at end
   */
  private peek(): string {
    return this.input[this.index] || '';
  }

  /**
   * Consumes and returns the next character.
   * 
   * @private
   * @returns {string} Next character or empty string if at end
   */
  private consume(): string {
    return this.input[this.index++] || '';
  }

  /**
   * Attempts to match and consume an expected string.
   * 
   * @private
   * @param {string} expected - String to match
   * @returns {boolean} True if match successful
   */
  private match(expected: string): boolean {
    if (this.input.startsWith(expected, this.index)) {
      this.index += expected.length;
      return true;
    }
    return false;
  }

  /**
   * Skips whitespace characters.
   * 
   * @private
   */
  private skipWhitespace(): void {
    while (/\s/.test(this.peek())) {
      this.consume();
    }
  }

  /**
   * Parses the input string and extracts all variables.
   * 
   * @returns {Set<string>} Set of unique variable names
   */
  parse(): Set<string> {
    const variables = new Set<string>();
    while (this.index < this.input.length) {
      if (this.match('{{')) {
        const variable = this.parseVariableExpression();
        if (variable) {
          variables.add(variable);
        }
      } else {
        this.consume();
      }
    }
    return variables;
  }

  /**
   * Parses a variable expression within a Mustache block.
   * 
   * @private
   * @returns {string|null} Variable name or null if invalid
   */
  private parseVariableExpression(): string | null {
    this.skipWhitespace();
    const variable = this.parseVariable();
    if (!variable) return null;
    this.skipWhitespace();
    if (!this.match('}}')) return null;
    return variable;
  }

  /**
   * Parses a variable name, including dot notation and bracket notation.
   * 
   * @private
   * @returns {string|null} Variable name or null if invalid
   */
  private parseVariable(): string | null {
    const rootVariable = this.parseIdentifier();
    if (!rootVariable) return null;
    let result = rootVariable;
    let extension = this.parseVariableExtension();
    while (extension) {
      result += extension;
      extension = this.parseVariableExtension();
    }
    return result.split(/[.[(]/)[0]; // Return only the root variable
  }

  /**
   * Parses a variable extension, including dot notation, bracket notation, and function calls.
   * 
   * @private
   * @returns {string|null} Variable extension or null if invalid
   */
  private parseVariableExtension(): string | null {
    return this.parseDotNotation() || this.parseBracketNotation() || this.parseFunctionCall();
  }

  /**
   * Parses an identifier, which is a sequence of alphanumeric characters and underscores.
   * 
   * @private
   * @returns {string|null} Identifier or null if invalid
   */
  private parseIdentifier(): string | null {
    const start = this.index;
    if (/[a-zA-Z_$]/.test(this.peek())) {
      this.consume();
      while (/[a-zA-Z0-9_$]/.test(this.peek())) {
        this.consume();
      }
      return this.input.slice(start, this.index);
    }
    return null;
  }

  /**
   * Parses dot notation, if enabled in the options.
   * 
   * @private
   * @returns {string|null} Dot notation or null if invalid
   */
  private parseDotNotation(): string | null {
    if (!this.options.allowDotNotation) return null;
    if (this.match('.')) {
      const identifier = this.parseIdentifier();
      if (identifier) {
        return '.' + identifier;
      }
    }
    return null;
  }

  /**
   * Parses bracket notation, if enabled in the options.
   * 
   * @private
   * @returns {string|null} Bracket notation or null if invalid
   */
  private parseBracketNotation(): string | null {
    if (!this.options.allowBracketNotation) return null;
    if (this.match('[')) {
      const start = this.index;
      let bracketCount = 1;
      while (bracketCount > 0 && this.index < this.input.length) {
        if (this.peek() === '[') bracketCount++;
        if (this.peek() === ']') bracketCount--;
        this.consume();
      }
      if (bracketCount === 0) {
        return this.input.slice(start - 1, this.index);
      }
    }
    return null;
  }

  /**
   * Parses function calls, if enabled in the options.
   * 
   * @private
   * @returns {string|null} Function call or null if invalid
   */
  private parseFunctionCall(): string | null {
    if (!this.options.allowFunctionCalls) return null;
    if (this.match('(')) {
      const start = this.index;
      let parenCount = 1;
      while (parenCount > 0 && this.index < this.input.length) {
        if (this.peek() === '(') parenCount++;
        if (this.peek() === ')') parenCount--;
        this.consume();
      }
      if (parenCount === 0) {
        return this.input.slice(start - 1, this.index);
      }
    }
    return null;
  }
}

/**
 * Extracts variables from template content and returns them as a record.
 * 
 * @param {object} params - Input parameters
 * @param {string} params.content - Template content to parse
 * @param {Record<string, TemplateVariable>} [params.input_variables] - Predefined variables
 * @param {ExtractVariablesFromContentOptions} [options] - Parsing configuration
 * @returns {Record<string, TemplateVariable>} Extracted variables
 * 
 * @description
 * This function takes template content and optional predefined variables as input.
 * It uses a parser to extract variable names from the content, and then constructs
 * a record of extracted variables. If a variable is already defined in the input
 * variables, its definition is used; otherwise, a default definition with a string
 * type is created.
 */
export function extractVariablesFromContent(
  {
    content,
    input_variables = {},
  }: { content: string; input_variables?: Record<string, TemplateVariable> },
  options: ExtractVariablesFromContentOptions = {
    allowDotNotation: true,
    allowBracketNotation: false,
    allowFunctionCalls: false,
  },
): Record<string, TemplateVariable> {
  const parser = new Parser(content, options);
  const variables = parser.parse();
  const result: Record<string, TemplateVariable> = {};

  // Process each extracted variable
  for (const variable of variables) {
    // If the variable is already defined in input_variables, use that definition
    if (variable in input_variables) {
      result[variable] = input_variables[variable];
    } else {
      // Create a new variable definition with default string type
      result[variable] = {
        type: 'string',
        description: `Automatically extracted variable: ${variable}`,
      };
    }
  }

  return result;
}
