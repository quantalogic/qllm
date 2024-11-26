/**
 * @fileoverview Base Tool Definition and Abstract Class
 * This module provides the foundation for creating tool implementations
 * with standardized interfaces and configurations.
 */

/**
 * @interface ToolDefinition
 * @description Defines the structure and metadata for a tool implementation
 * 
 * @property {string} name - Unique identifier for the tool
 * @property {string} description - Human-readable description of the tool's purpose
 * @property {Record<string, InputDefinition>} input - Map of input parameters and their definitions
 * @property {OutputDefinition} output - Definition of the tool's output format
 * 
 * @example
 * const toolDef: ToolDefinition = {
 *   name: 'my-tool',
 *   description: 'Processes data in a specific way',
 *   input: {
 *     sourceUrl: {
 *       type: 'string',
 *       required: true,
 *       description: 'URL of the data source'
 *     }
 *   },
 *   output: {
 *     type: 'object',
 *     description: 'Processed data results'
 *   }
 * };
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input: Record<string, {
    type: string;
    required: boolean;
    description: string;
  }>;
  output: {
    type: string;
    description: string;
  };
}

/**
 * @abstract
 * @class BaseTool
 * @description Abstract base class for implementing tools with standard interfaces
 * 
 * @property {Record<string, any>} config - Configuration parameters for the tool
 * 
 * @example
 * class MyTool extends BaseTool {
 *   async execute(inputs: Record<string, any>): Promise<any> {
 *     // Implementation
 *   }
 *   
 *   getDefinition(): ToolDefinition {
 *     // Return tool definition
 *   }
 * }
 */
export abstract class BaseTool {
  /**
   * @constructor
   * @param {Record<string, any>} config - Tool configuration options
   */
  constructor(protected config: Record<string, any> = {}) {}

  /**
   * @abstract
   * @method execute
   * @param {Record<string, any>} inputs - Input parameters for tool execution
   * @returns {Promise<any>} Result of tool execution
   * @description Executes the tool's main functionality with provided inputs
   */
  abstract execute(inputs: Record<string, any>): Promise<any>;

  /**
   * @abstract
   * @method getDefinition
   * @returns {ToolDefinition} Tool's metadata and interface definition
   * @description Returns the tool's definition including inputs and outputs
   */
  abstract getDefinition(): ToolDefinition;
  /**
   * @method getDescription
   * @description Returns a description of what the tool does
   * @returns {string} Tool description
   */
  public getDescription(): string {
    return 'Base tool description - should be overridden by implementing classes';
  }
}