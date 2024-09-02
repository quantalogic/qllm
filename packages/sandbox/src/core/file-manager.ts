import * as fs from 'fs/promises';
import * as path from 'path';
import { FileInput } from '../types';

/**
 * FileManager class for managing file operations in a temporary directory
 */
export class FileManager {
  /**
   * Creates a new FileManager instance
   * @param {string} tempDir - The temporary directory path for file operations
   */
  constructor(private tempDir: string) {}

  /**
   * Writes multiple files to the temporary directory
   * @param {FileInput[]} files - Array of file inputs to write
   * @throws {Error} If a file name is invalid
   */
  async writeFiles(files: FileInput[]): Promise<void> {
    for (const file of files) {
      if (!this.validateFileName(file.name)) {
        throw new Error(`Invalid file name: ${file.name}`);
      }
      const filePath = path.join(this.tempDir, file.name);
      await fs.writeFile(filePath, file.content);
    }
  }

  /**
   * Writes a single file to the temporary directory
   * @param {string} fileName - Name of the file to write
   * @param {string} content - Content to write to the file
   * @throws {Error} If the file name is invalid
   */
  async writeFile(fileName: string, content: string): Promise<void> {
    if (!this.validateFileName(fileName)) {
      throw new Error(`Invalid file name: ${fileName}`);
    }
    const filePath = path.join(this.tempDir, fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  }

  /**
   * Reads a file from the temporary directory
   * @param {string} fileName - Name of the file to read
   * @returns {Promise<string>} Content of the file
   * @throws {Error} If the file name is invalid
   */
  async readFile(fileName: string): Promise<string> {
    if (!this.validateFileName(fileName)) {
      throw new Error(`Invalid file name: ${fileName}`);
    }
    const filePath = path.join(this.tempDir, fileName);
    return fs.readFile(filePath, 'utf-8');
  }

  /**
   * Validates a file name to ensure it's safe to use
   * @param {string} fileName - Name of the file to validate
   * @returns {boolean} True if the file name is valid, false otherwise
   */
  validateFileName(fileName: string): boolean {
    const normalizedPath = path.normalize(fileName);
    return !normalizedPath.startsWith('..') && !path.isAbsolute(normalizedPath);
  }

  /**
   * Lists all files in the temporary directory
   * @returns {Promise<string[]>} Array of file names in the temporary directory
   */
  async listFiles(): Promise<string[]> {
    return fs.readdir(this.tempDir);
  }

  /**
   * Cleans up the temporary directory by removing it and its contents
   */
  async cleanup(): Promise<void> {
    await fs.rm(this.tempDir, { recursive: true, force: true });
  }
}