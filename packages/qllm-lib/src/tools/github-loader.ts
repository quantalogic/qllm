/**
 * @fileoverview GitHub Repository Loader Tool
 * This module provides functionality to load and process GitHub repository contents
 * with configurable filtering options.
 * @module github-loader
 */

import { Octokit } from '@octokit/rest';
import { BaseTool, ToolDefinition } from './base-tool';
import { writeFile } from 'fs/promises';
import * as fs from "fs/promises"
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';

/**
 * @class GithubLoaderTool
 * @extends BaseTool
 * @description A tool for loading and processing GitHub repository contents with filtering capabilities
 */
export class GithubLoaderTool extends BaseTool {
  private octokit: Octokit;
  private rateLimitDelay: number = 1000; // 1 second delay between requests
  private tmpDir: string;
  private git: SimpleGit; 

  /**
   * @constructor
   * @param {Record<string, any>} config - Configuration object for the GitHub loader
   * @param {string} [config.authToken] - GitHub authentication token
   * @throws {Error} If unable to initialize Octokit client
   */
  constructor(config: Record<string, any>) {
    super(config);
    this.octokit = new Octokit({
      auth: config.authToken || process.env.GITHUB_TOKEN,
      retry: { enabled: true }
    });
    this.tmpDir = path.join(process.cwd(), 'tmp');
    this.git = simpleGit();
  }

  /**
   * @method getDefinition
   * @returns {ToolDefinition} Tool definition object containing name, description, input/output specifications
   * @description Provides the tool's definition including all required and optional parameters
   */
  getDefinition(): ToolDefinition {
      return {
          name: 'github-loader',
          description: 'Loads content from GitHub repositories',
          input: {
              repositoryUrl: {
                  type: 'string',
                  required: true,
                  description: 'Full GitHub repository URL'
              },
              authToken: {
                  type: 'string',
                  required: false,
                  description: 'GitHub authentication token'
              },
              excludePatterns: {
                  type: 'string',
                  required: false,
                  description: 'Comma-separated list of files, folders, or extensions to exclude'
              },
              includePatterns: {
                  type: 'string',
                  required: false,
                  description: 'Comma-separated list of files, folders, or extensions to include'
              }
          },
          output: {
              type: 'object',
              description: 'Repository contents with file metadata and content'
          }
      };
  }

  /**
   * @private
   * @method parsePatternString
   * @param {string | undefined} patterns - Comma-separated string of patterns
   * @returns {string[]} Array of trimmed pattern strings
   * @description Converts a comma-separated string of patterns into an array of trimmed strings
   */
  private parsePatternString(patterns: string | undefined): string[] {
      if (!patterns) return [];
      return patterns.split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0);
  }
 
  /**
   * @private
   * @method initTempDirectory
   * @returns {Promise<void>}
   * @throws {Error} If directory creation fails
   * @description Initializes a temporary directory for storing repository contents
   */
  private async initTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.tmpDir, { recursive: true });
      console.log(`📁 Temporary directory created at: ${this.tmpDir}`);
    } catch (error) {
      console.error('Error creating temp directory:', error);
      throw error;
    }
  }
  
  /**
   * @private
   * @method cleanupTempDirectory
   * @param {string} repoPath - Path to the repository directory to clean up
   * @returns {Promise<void>}
   * @description Removes a temporary repository directory and its contents
   * @throws {Error} Logs warning if cleanup fails
   */
  private async cleanupTempDirectory(repoPath: string): Promise<void> {
    try {
      await fs.rm(repoPath, { recursive: true, force: true });
      console.log(`🧹 Cleaned up repository directory: ${repoPath}`);
    } catch (error) {
      console.warn('Error cleaning up temp directory:', error);
    }
  }

  /**
   * @private
   * @method cloneRepository
   * @param {string} repositoryUrl - URL of the GitHub repository to clone
   * @returns {Promise<string>} Path to the cloned repository
   * @throws {Error} If cloning fails
   * @description Clones a GitHub repository to a local temporary directory
   */
  private async cloneRepository(repositoryUrl: string): Promise<string> {
    const { owner, repo } = this.parseGithubUrl(repositoryUrl);
    const repoPath = path.join(this.tmpDir, `${owner}-${repo}`);

    try {
      // Clean up existing directory if it exists
      await this.cleanupTempDirectory(repoPath);
      
      // Clone the repository
      console.log(`📥 Cloning repository: ${repositoryUrl}`);
      await this.git.clone(repositoryUrl, repoPath);
      console.log(`✅ Repository cloned to: ${repoPath}`);
      
      return repoPath;
    } catch (error) {
      console.error('Error cloning repository:', error);
      throw error;
    }
  }

  /**
   * @private
   * @method readLocalFile
   * @param {string} filePath - Path to the file to read
   * @returns {Promise<string>} Content of the file
   * @description Reads content from a local file with UTF-8 encoding
   * @throws {Error} Returns error message as string if reading fails
   */
  private async readLocalFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return `// Error reading file: ${error}`;
    }
  }
 
  /**
   * @private
   * @method getAllLocalFiles
   * @param {string} dirPath - Directory path to scan
   * @param {string} baseDir - Base directory for relative path calculation
   * @param {string[]} [excludePatterns=[]] - Patterns to exclude from results
   * @param {string[]} [includePatterns=[]] - Patterns to include in results
   * @returns {Promise<any[]>} Array of file objects with metadata
   * @description Recursively scans a directory and returns file information while applying filters
   * 
   * @typedef {Object} FileInfo
   * @property {string} path - Relative path of the file
   * @property {string} name - File name
   * @property {'file'} type - Type of the entry
   * @property {number} size - File size in bytes
   */
  private async getAllLocalFiles(
    dirPath: string,
    baseDir: string,
    excludePatterns: string[] = [],
    includePatterns: string[] = []
  ): Promise<any[]> {
    const files: any[] = [];
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Add default exclude patterns
    const defaultExcludes = [
      '.git',
      'node_modules',
      '.md',
      'argon.json',
      'dist',
      'build',
      'coverage',
      '.env',
      '.DS_Store',
      'package-lock.json',
      'yarn.lock',
      '.git/**',
      'node_modules/**',
      '.env*',
      '*.log',
      '*.lock',
      'dist/**',
      'build/**',
      '*.png',
      '*.jpg',
      '*.jpeg',
      '*.gif',
      '*.ico',
      '*.ttf',
      '*.woff*',
      '*.eot',
      '*.svg',
      '*.mp3',
      '*.mp4',
      '*.pdf',
      '*.zip',
      '*.tar',
      '*.gz',
      '*.7z',
      '*.jar',
      '*.war',
      '*.class',
      '*.dll',
      '*.exe',
      '*.so',
      '*.dylib'
    ];
    
    const allExcludes = [...new Set([...defaultExcludes, ...excludePatterns])];
  
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const relativePath = path.relative(baseDir, fullPath);
  
      // Skip if matches exclude patterns
      if (this.matchesPattern(relativePath, allExcludes)) {
        continue;
      }
  
      // Skip binary files and specific directories
      if (item.isFile() && this.isBinaryFile(item.name)) {
        continue;
      }
  
      if (item.isDirectory()) {
        const subFiles = await this.getAllLocalFiles(
          fullPath,
          baseDir,
          allExcludes,
          includePatterns
        );
        files.push(...subFiles);
      } else if (item.isFile()) {
        // Check include patterns if specified
        if (includePatterns.length === 0 || this.matchesPattern(relativePath, includePatterns)) {
          files.push({
            path: relativePath,
            name: item.name,
            type: 'file',
            size: (await fs.stat(fullPath)).size
          });
        }
      }
    }
    return files;
  }
  
  /**
   * @private
   * @method matchesPattern
   * @param {string} filepath - Path of the file to check
   * @param {string[]} patterns - Array of patterns to match against
   * @returns {boolean} True if filepath matches any pattern
   * @description Checks if a filepath matches any of the provided patterns using various matching strategies
   * 
   * @example
   * // Glob pattern matching
   * matchesPattern('src/file.ts', ['*.ts']) // returns true
   * // Extension matching
   * matchesPattern('file.jpg', ['.jpg']) // returns true
   * // Directory matching
   * matchesPattern('src/components/Button.tsx', ['/src']) // returns true
   */
  private matchesPattern(filepath: string, patterns: string[]): boolean {
    if (patterns.length === 0) return false;
    
    return patterns.some(pattern => {
      // Handle glob patterns
      if (pattern.includes('*')) {
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        return new RegExp(regexPattern).test(filepath);
      }
      
      // Handle extension patterns
      if (pattern.startsWith('.')) {
        return filepath.endsWith(pattern);
      }
      
      // Handle directory patterns
      if (pattern.startsWith('/')) {
        return filepath.startsWith(pattern.slice(1));
      }
      
      // Handle exact matches or contains
      return filepath.includes(pattern);
    });
  }


  /**
   * @private
   * @method sleep
   * @param {number} ms - Number of milliseconds to sleep
   * @returns {Promise<void>}
   * @description Creates a promise that resolves after the specified number of milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @private
   * @method checkRateLimit
   * @returns {Promise<void>}
   * @description Checks GitHub API rate limit and waits if necessary
   * @throws {Error} Logs warning if unable to check rate limit
   */
  private async checkRateLimit(): Promise<void> {
    try {
      const { data: rateLimit } = await this.octokit.rateLimit.get();
      if (rateLimit.rate.remaining < 10) {
        const resetTime = new Date(rateLimit.rate.reset * 1000);
        const waitTime = resetTime.getTime() - Date.now();
        console.log(`Rate limit low. Waiting ${waitTime / 1000} seconds...`);
        await this.sleep(waitTime);
      }
    } catch (error) {
      console.warn('Unable to check rate limit:', error);
    }
  }


  /**
   * @private
   * @method parseGithubUrl
   * @param {string} url - GitHub repository URL
   * @returns {{ owner: string; repo: string }} Object containing owner and repo names
   * @throws {Error} If URL format is invalid
   * @description Parses a GitHub URL to extract owner and repository names
   * 
   * @example
   * parseGithubUrl('https://github.com/owner/repo')
   * // returns { owner: 'owner', repo: 'repo' }
   */
  private parseGithubUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return { 
      owner: match[1], 
      repo: match[2].replace('.git', '').replace('/', '') 
    };
  }

  /**
   * @private
   * @method getRepositoryContent
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} [path=''] - Path within repository
   * @returns {Promise<any[]>} Array of repository content items
   * @throws {Error} Handles rate limit errors and retries
   * @description Fetches repository content from GitHub API with rate limiting handling
   */
  private async getRepositoryContent(owner: string, repo: string, path: string = ''): Promise<any[]> {
    await this.checkRateLimit();
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });

      await this.sleep(this.rateLimitDelay);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      if (error === 403) {
        await this.handleRateLimitError(error);
        return this.getRepositoryContent(owner, repo, path);
      }
      console.error(`Error fetching content for ${path}:`, error);
      return [];
    }
  }

  /**
   * @private
   * @method handleRateLimitError
   * @param {any} error - Error object from GitHub API
   * @returns {Promise<void>}
   * @description Handles GitHub API rate limit errors by waiting for the reset time
   */
  private async handleRateLimitError(error: any): Promise<void> {
    const resetTime = error.response?.headers?.['x-ratelimit-reset'];
    if (resetTime) {
      const waitTime = (Number(resetTime) * 1000) - Date.now();
      console.log(`Rate limit exceeded. Waiting ${waitTime / 1000} seconds...`);
      await this.sleep(waitTime > 0 ? waitTime : this.rateLimitDelay);
    } else {
      await this.sleep(this.rateLimitDelay);
    }
  }

  /**
   * @private
   * @method getAllFiles
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} [path=''] - Path within repository
   * @returns {Promise<any[]>} Array of file objects
   * @description Recursively retrieves all files from a GitHub repository
   */
  private async getAllFiles(owner: string, repo: string, path: string = ''): Promise<any[]> {
    const contents = await this.getRepositoryContent(owner, repo, path);
    let files: any[] = [];

    for (const item of contents) {
      if (item.type === 'dir') {
        const subFiles = await this.getAllFiles(owner, repo, item.path);
        files = [...files, ...subFiles];
      } else if (item.type === 'file') {
        files.push(item);
      }
    }

    return files;
  }

  /**
     * @private
     * @method getAllFiles
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} [path=''] - Path within repository
     * @returns {Promise<any[]>} Array of file objects
     * @description Recursively retrieves all files from a GitHub repository
     */
  private async getFileContent(file: any): Promise<string> {
    await this.checkRateLimit();
    try {
      const { owner, repo } = this.parseGithubUrl(file.repository);
      
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path: file.path
      });

      await this.sleep(this.rateLimitDelay);

      if ('content' in response.data) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }

      return '// Content not available';
    } catch (error) {
      if (error === 403) {
        await this.handleRateLimitError(error);
        return this.getFileContent(file);
      }
      return `// Error loading content: ${error}`;
    }
  }

  /**
   * @private
   * @method formatFileInfo
   * @param {any} file - File metadata object
   * @param {string} content - File content
   * @returns {string} Formatted file information in Markdown
   * @description Formats file metadata and content into a Markdown document
   */
  private formatFileInfo(file: any, content: string): string {
    const extension = file.name.split('.').pop() || '';
    const language = this.getLanguage(extension);
    const now = new Date().toISOString().split('T')[0];
    
    return `
## File: ${file.path}

- Extension: .${extension}
- Language: ${language}
- Size: ${file.size || 0} bytes
- SHA: ${file.sha}
- Created: ${now}
- Modified: ${now}

### Code

\`\`\`${language}
${content}
\`\`\`
`;
  }

  /**
   * @private
   * @method getLanguage
   * @param {string} extension - File extension
   * @returns {string} Programming language name
   * @description Maps file extensions to programming language names for syntax highlighting
   */
  private getLanguage(extension: string): string {
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'php': 'php',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'md': 'markdown',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sql': 'sql'
    };

    return languageMap[extension] || extension;
  }
    
  /**
   * @method execute
   * @param {Record<string, any>} inputs - Input parameters including repository URL and patterns
   * @returns {Promise<Record<string, any>>} Processing results including content and statistics
   * @description Main execution method that processes a GitHub repository
   * @throws {Error} If repository processing fails
   */
  async execute(inputs: Record<string, any>): Promise<Record<string, any>> {
    try {
        const { repositoryUrl, excludePatterns, includePatterns } = inputs;
        const excludeList = this.parsePatternString(excludePatterns);
        const includeList = this.parsePatternString(includePatterns);

        const { owner, repo } = this.parseGithubUrl(repositoryUrl);
        console.log(`\n📦 Processing repository: ${owner}/${repo}`);

        // Initialize temp directory
        await this.initTempDirectory();

        // Clone repository
        const repoPath = await this.cloneRepository(repositoryUrl);

        // Get all files with filtering
        const files = await this.getAllLocalFiles(repoPath, repoPath, excludeList, includeList);

        let output = `# Repository: ${owner}/${repo}\n\n`;
        output += `Generated at: ${new Date().toISOString()}\n\n`;
        output += '# Table of Contents\n';
        files.forEach(file => output += `- ${file.path}\n`);
        output += '\n';

        let processedFiles = 0;
        for (const file of files) {
            processedFiles++;
            console.log(`📄 [${processedFiles}/${files.length}] Processing: ${file.path}`);
            const fullPath = path.join(repoPath, file.path);
            const content = await this.readLocalFile(fullPath);
            output += this.formatFileInfo(file, content);
        }

        // Cleanup
        await this.cleanupTempDirectory(repoPath);

        return {
            content: output,
            fileCount: processedFiles,
            repository: `${owner}/${repo}`,
            totalFiles: files.length
        };
    } catch (error) {
        console.error('Error processing repository:', error);
        throw new Error(`Failed to process repository: ${error}`);
    }
  }

  /**
   * @private
   * @method isBinaryFile
   * @param {string} filepath - Path of the file to check
   * @returns {boolean} True if file is considered binary
   * @description Determines if a file should be treated as binary based on its extension
   */
  private isBinaryFile(filepath: string): boolean {
    // Add .git directory check
    if (filepath.startsWith('.git') || filepath === '.git') {
        return true;
    }

    const binaryExtensions = [
      '.png', '.jpg', '.md', '.jpeg', '.gif', '.ico', '.ttf', '.woff', 
      '.woff2', '.eot', '.svg', '.mp3', '.mp4', '.webm', '.wav', 
      '.ogg', '.pdf', '.zip', '.tar', '.gz', '.7z', '.jar', '.war',
      '.ear', '.class', '.dll', '.exe', '.so', '.dylib'
    ];
    const ext = '.' + (filepath.toLowerCase().split('.').pop() || '');
    return binaryExtensions.includes(ext);
  }
}