/**
 * @fileoverview Remove From Local Tool
 * This module provides functionality to remove files or folders from the local filesystem.
 * @module remove-from-local
 */

import { rm } from "fs/promises";
import { existsSync } from "fs";
import { BaseTool, ToolDefinition } from "./base-tool";

/**
 * @class RemoveFromLocalTool
 * @extends BaseTool
 * @description A tool for removing files or folders from the local filesystem
 * 
 * @example
 * const remover = new RemoveFromLocalTool();
 * // Remove a file
 * await remover.execute({
 *   path: './file-to-remove.txt',
 *   recursive: false
 * });
 * // Remove a directory and its contents
 * await remover.execute({
 *   path: './directory-to-remove',
 *   recursive: true
 * });
 */
export class RemoveFromLocalTool extends BaseTool {
  /**
   * @constructor
   * @param {Record<string, any>} [config={}] - Tool configuration options
   */
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  /**
   * @method getDefinition
   * @returns {ToolDefinition} Tool definition object
   * @description Provides the tool's definition including input/output specifications
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'remove-from-local',
      description: 'Removes a file or directory from the local filesystem',
      input: {
        path: { 
          type: 'string', 
          required: true, 
          description: 'Path to the file or directory to remove' 
        },
        recursive: { 
          type: 'boolean', 
          required: false, 
          description: 'If true, recursively remove directories and their contents' 
        },
        force: {
          type: 'boolean',
          required: false,
          description: 'If true, ignore nonexistent files and never prompt'
        }
      },
      output: { 
        type: 'object', 
        description: 'Result of the removal operation' 
      }
    };
  }

  /**
   * @method execute
   * @async
   * @param {Record<string, any>} inputs - Input parameters
   * @param {string} inputs.path - Path to the file or directory to remove
   * @param {boolean} [inputs.recursive=false] - If true, recursively remove directories
   * @param {boolean} [inputs.force=false] - If true, ignore nonexistent files
   * @returns {Promise<{path: string, removed: boolean}>} Result of the removal operation
   * @throws {Error} If removal fails or if trying to remove a directory without recursive flag
   */
  async execute(inputs: Record<string, any>): Promise<{path: string, removed: boolean}> {
    const { path, recursive = false, force = false } = inputs;

    try {
      // Check if path exists
      if (!existsSync(path)) {
        if (force) {
          return { path, removed: false };
        }
        throw new Error(`Path does not exist: ${path}`);
      }

      // Remove the file or directory
      await rm(path, { 
        recursive, 
        force 
      });

      return {
        path,
        removed: true
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to remove ${path}: ${error.message}`);
      }
      throw error;
    }
  }
}