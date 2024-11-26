/**
 * @fileoverview Local File Loader Tool
 * This module provides functionality to safely load and process files from the local filesystem
 * with support for various encodings and file types.
 * @module local-loader
 */

import { readFile, access, constants, stat } from "fs/promises";
import { extname, resolve } from "path";
import { BaseTool, ToolDefinition } from "./base-tool";

/**
 * @interface LoaderConfig
 * @description Configuration options for local file loader
 */
interface LoaderConfig {
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Allowed file extensions */
  allowedExtensions?: string[];
  /** Base directory for relative paths */
  baseDir?: string;
  /** Default encoding */
  defaultEncoding?: BufferEncoding;
}

/**
 * @class LocalLoaderTool
 * @extends BaseTool
 * @description A tool for safely loading and processing local files with validation and security features
 */
export class LocalLoaderTool extends BaseTool {
  private maxFileSize: number;
  private allowedExtensions: Set<string>;
  private baseDir: string;
  private defaultEncoding: BufferEncoding;

  /**
   * @constructor
   * @param {LoaderConfig} config - Loader configuration options
   */
  constructor(config: LoaderConfig = {}) {
    super(config);
    this.maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this.allowedExtensions = new Set(config.allowedExtensions || [
      '.txt', '.json', '.xml', '.csv', '.yml', '.yaml', 
      '.md', '.js', '.ts', '.jsx', '.tsx', '.html', '.css'
    ]);
    this.baseDir = config.baseDir || process.cwd();
    this.defaultEncoding = config.defaultEncoding || 'utf-8';
  }

  /**
   * @method getDefinition
   * @returns {ToolDefinition} Tool definition object
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'local-loader',
      description: 'Safely loads and processes files from local filesystem',
      input: {
        path: { 
          type: 'string', 
          required: true, 
          description: 'File path (absolute or relative to base directory)' 
        },
        encoding: { 
          type: 'string', 
          required: false, 
          description: 'File encoding (default: utf-8)' 
        },
        validateJson: {
          type: 'boolean',
          required: false,
          description: 'Validate JSON files'
        },
        skipExtensionCheck: {
          type: 'boolean',
          required: false,
          description: 'Skip file extension validation'
        }
      },
      output: { 
        type: 'string', 
        description: 'File content with optional processing' 
      }
    };
  }

  /**
   * @private
   * @method validatePath
   * @param {string} filePath - Path to validate
   * @throws {Error} If path validation fails
   */
  private async validatePath(filePath: string): Promise<void> {
    const resolvedPath = resolve(this.baseDir, filePath);
    
    // Check if path is within base directory
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Path outside base directory');
    }

    // Check file existence
    try {
      await access(resolvedPath, constants.R_OK);
    } catch {
      throw new Error(`File not accessible: ${filePath}`);
    }

    // Check file size
    const stats = await stat(resolvedPath);
    if (stats.size > this.maxFileSize) {
      throw new Error(`File too large: ${stats.size} bytes (max: ${this.maxFileSize} bytes)`);
    }

    // Validate extension
    const ext = extname(filePath).toLowerCase();
    if (!this.allowedExtensions.has(ext)) {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  /**
   * @private
   * @method processContent
   * @param {string} content - File content
   * @param {string} extension - File extension
   * @param {boolean} validateJson - Whether to validate JSON
   * @returns {string} Processed content
   */
  private processContent(content: string, extension: string, validateJson: boolean): string {
    if (extension === '.json' && validateJson) {
      try {
        JSON.parse(content);
      } catch (error) {
        throw new Error(`Invalid JSON content: ${error}`);
      }
    }
    return content;
  }

  /**
   * @method execute
   * @async
   * @param {Record<string, any>} inputs - Input parameters
   * @returns {Promise<string>} File content
   * @throws {Error} If file loading or processing fails
   */
  async execute(inputs: Record<string, any>): Promise<string> {
    try {
      const {
        path: filePath,
        encoding = this.defaultEncoding,
        validateJson = true,
        skipExtensionCheck = false
      } = inputs;

      if (!skipExtensionCheck) {
        await this.validatePath(filePath);
      }

      const resolvedPath = resolve(this.baseDir, filePath);
      const content = await readFile(resolvedPath, encoding);
      
      return this.processContent(
        content.toString(),
        extname(filePath).toLowerCase(),
        validateJson
      );
    } catch (error) {
      throw new Error(`File loading failed: ${error}`);
    }
  }
}