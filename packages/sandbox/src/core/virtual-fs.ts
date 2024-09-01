import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * VirtualFileSystem class for managing a sandboxed file system
 */
export class VirtualFileSystem {
  /**
   * Creates a new VirtualFileSystem instance
   * @param {string} rootDir - The root directory for the virtual file system
   */
  constructor(private rootDir: string) {}

  /**
   * Reads a file from the virtual file system
   * @param {string} filePath - The path of the file to read
   * @returns {Promise<Buffer>} The content of the file as a Buffer
   */
  async readFile(filePath: string): Promise<Buffer> {
    const fullPath = this.resolvePath(filePath);
    return fs.readFile(fullPath);
  }

  /**
   * Writes data to a file in the virtual file system
   * @param {string} filePath - The path of the file to write
   * @param {Buffer} data - The data to write to the file
   */
  async writeFile(filePath: string, data: Buffer): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  /**
   * Checks if a file or directory exists in the virtual file system
   * @param {string} filePath - The path to check
   * @returns {Promise<boolean>} True if the file or directory exists, false otherwise
   */
  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates a directory in the virtual file system
   * @param {string} dirPath - The path of the directory to create
   */
  async mkdir(dirPath: string): Promise<void> {
    const fullPath = this.resolvePath(dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  /**
   * Resolves and validates a file path within the virtual file system
   * @param {string} filePath - The path to resolve
   * @returns {string} The full resolved path
   * @throws {Error} If attempting to access outside of the virtual file system
   */
  private resolvePath(filePath: string): string {
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
      throw new Error('Access denied: Attempting to access outside of virtual file system');
    }
    return path.join(this.rootDir, normalizedPath);
  }
}