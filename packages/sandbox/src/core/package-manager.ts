import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

type PackageContent = Record<string, any>;

/**
 * PackageManager class for managing package files and caching
 */
export class PackageManager {
  /**
   * Creates a new PackageManager instance
   * @param {string} packagesDir - Directory containing package files
   * @param {string} cacheDir - Directory for caching package files
   */
  constructor(private readonly packagesDir: string, private readonly cacheDir: string) {}

  /**
   * Reads and returns a list of package files
   * @returns {Promise<string[]>} Array of package file names
   */
  async readPackages(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.packagesDir);
      return files.filter(file => file.endsWith('.yml') || file.endsWith('.yaml') || file.endsWith('.json'));
    } catch (error) {
      console.error('Failed to read packages:', error);
      return [];
    }
  }

  /**
   * Retrieves the content of a specific package
   * @param {string} packageName - Name of the package file
   * @returns {Promise<PackageContent>} Content of the package
   */
  async getPackageContent(packageName: string): Promise<PackageContent> {
    try {
      const filePath = path.join(this.packagesDir, packageName);
      const content = await fs.readFile(filePath, 'utf-8');
      return this.parseFileContent(packageName, content);
    } catch (error) {
      console.error(`Failed to read package ${packageName}:`, error);
      throw error;
    }
  }

  /**
   * Caches a package's content
   * @param {string} packageName - Name of the package file
   * @param {PackageContent} content - Content to be cached
   */
  async cachePackage(packageName: string, content: PackageContent): Promise<void> {
    try {
      const cachePath = path.join(this.cacheDir, packageName);
      const fileContent = this.stringifyContent(packageName, content);
      await fs.writeFile(cachePath, fileContent);
    } catch (error) {
      console.error(`Failed to cache package ${packageName}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a list of cached package files
   * @returns {Promise<string[]>} Array of cached package file names
   */
  async getCachedPackages(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.cacheDir);
      return files.filter(file => file.endsWith('.yml') || file.endsWith('.yaml') || file.endsWith('.json'));
    } catch (error) {
      console.error('Failed to read cached packages:', error);
      return [];
    }
  }

  /**
   * Retrieves the content of a specific cached package
   * @param {string} packageName - Name of the cached package file
   * @returns {Promise<PackageContent>} Content of the cached package
   */
  async getCachedPackageContent(packageName: string): Promise<PackageContent> {
    try {
      const filePath = path.join(this.cacheDir, packageName);
      const content = await fs.readFile(filePath, 'utf-8');
      return this.parseFileContent(packageName, content);
    } catch (error) {
      console.error(`Failed to read cached package ${packageName}:`, error);
      throw error;
    }
  }

  /**
   * Cleans up the cache directory
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Error during PackageManager cleanup:', error);
    }
  }

  /**
   * Parses the content of a file based on its extension
   * @param {string} fileName - Name of the file
   * @param {string} content - Content of the file
   * @returns {PackageContent} Parsed content
   */
  private parseFileContent(fileName: string, content: string): PackageContent {
    if (fileName.endsWith('.json')) {
      return JSON.parse(content);
    } else if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
      return yaml.load(content) as PackageContent;
    }
    throw new Error(`Unsupported file type: ${fileName}`);
  }

  /**
   * Stringifies content based on the file extension
   * @param {string} fileName - Name of the file
   * @param {PackageContent} content - Content to stringify
   * @returns {string} Stringified content
   */
  private stringifyContent(fileName: string, content: PackageContent): string {
    if (fileName.endsWith('.json')) {
      return JSON.stringify(content, null, 2);
    } else if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
      return yaml.dump(content);
    }
    throw new Error(`Unsupported file type: ${fileName}`);
  }
}