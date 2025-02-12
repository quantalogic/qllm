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
  private downloadedRepos: Set<string> = new Set();
  private exitCleanupRepos: Set<string> = new Set();

  /**
   * @constructor
   * @param {Record<string, any>} config - Configuration object for the GitHub loader
   * @throws {Error} If unable to initialize Octokit client
   */
  constructor(config: Record<string, any>) {
    super(config);
    // Initialize without token, will be set in execute if provided
    this.octokit = new Octokit({
      retry: { enabled: true }
    });
    this.tmpDir = '/tmp/github_loader';
    this.git = simpleGit();

    // Register cleanup on process exit
    process.on('exit', () => {
      this.cleanupExitRepos();
    });

    // Handle interrupts
    process.on('SIGINT', () => {
      console.log('\nCleaning up repositories marked for exit cleanup...');
      this.cleanupExitRepos();
      process.exit();
    });
  }

  /**
   * @method getDefinition
   * @returns {ToolDefinition} Tool definition object containing name, description, input/output specifications
   * @description Provides the tool's definition including all required and optional parameters
   */
  getDefinition(): ToolDefinition {
      return {
          name: 'github-loader',
          description: 'Loads content from GitHub repositories with options to return content or local path',
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
              branch: {
                  type: 'string',
                  required: false,
                  description: 'Branch to clone (defaults to "main")'
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
              },
              returnLocalPath: {
                  type: 'boolean',
                  required: false,
                  description: 'If true, returns the path to cloned repository instead of content'
              },
              cleanupAfter: {
                  type: 'number',
                  required: false,
                  description: 'Time in milliseconds after which repository should be deleted (defaults to 1 hour)'
              },
              cleanupOnExit: {
                  type: 'boolean',
                  required: false,
                  description: 'Whether to clean up immediately after process completion (defaults to true)'
              }
          },
          output: {
              type: 'object',
              description: 'Repository contents with file metadata and content, or path to cloned repository'
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
   * @param {string} [branch] - Branch to clone (defaults to "main")
   * @returns {Promise<string>} Path to the cloned repository
   * @throws {Error} If cloning fails
   * @description Clones a GitHub repository to a local temporary directory
   */
  private async cloneRepository(repositoryUrl: string, branch?: string): Promise<string> {
    const { owner, repo } = this.parseGithubUrl(repositoryUrl);
    const repoPath = path.join(this.tmpDir, `${owner}-${repo}`);

    try {
      // Ensure thorough cleanup of existing directory
      try {
        const stats = await fs.stat(repoPath);
        if (stats.isDirectory()) {
          console.log(`📂 Found existing repository at ${repoPath}, removing...`);
          await fs.rm(repoPath, { recursive: true, force: true });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        // Directory doesn't exist, which is fine
      }

      // Double check directory is gone
      try {
        await fs.access(repoPath);
        console.log('Directory still exists, attempting final cleanup...');
        await fs.rm(repoPath, { recursive: true, force: true });
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        // Directory doesn't exist, which is what we want
      }
      
      // Prepare the repository URL with authentication if token is available
      const authToken = this.config.authToken;
      const authenticatedUrl = authToken 
        ? `https://${authToken}@github.com/${owner}/${repo}.git`
        : repositoryUrl;

      // Clone the repository with specified branch
      console.log(`📥 Cloning repository: https://github.com/${owner}/${repo}${branch ? ` (branch: ${branch})` : ''}`);
      const cloneOptions = ['clone'];
      if (branch) {
        cloneOptions.push('-b', branch);
      }
      cloneOptions.push(authenticatedUrl, repoPath);
      
      try {
        await this.git.raw(cloneOptions);
        console.log(`✅ Repository cloned to: ${repoPath}`);
      } catch (cloneError) {
        // If clone fails, ensure cleanup and throw error
        try {
          await fs.rm(repoPath, { recursive: true, force: true });
        } catch (cleanupError) {
          // Ignore cleanup errors at this point
        }

        // Type check the error before accessing its properties
        if (cloneError && typeof cloneError === 'object' && 'message' in cloneError) {
          const errorMessage = cloneError.message as string;
          if (errorMessage.includes('Authentication failed') || errorMessage.includes('could not read Username')) {
            throw new Error(`Authentication failed. Please check your GitHub token. The repository might be private and require valid authentication.`);
          }
        }
        throw cloneError;
      }
      
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
      '.db',
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
      '*.ear',
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
   * @private
   * @method cleanupExitRepos
   * @returns {Promise<void>}
   * @description Cleans up repositories marked for exit cleanup
   */
  private async cleanupExitRepos(): Promise<void> {
    for (const repoPath of this.exitCleanupRepos) {
      try {
        await fs.rm(repoPath, { recursive: true, force: true });
        console.log(`Cleaned up repository on exit: ${repoPath}`);
      } catch (error) {
        console.error(`Error cleaning up repository ${repoPath}:`, error);
      }
    }
    this.exitCleanupRepos.clear();
  }

  /**
   * @private
   * @method scheduleCleanup
   * @param {string} repoPath - Path to the repository to clean up
   * @param {number} delay - Time in milliseconds after which repository should be deleted
   * @param {boolean} cleanupOnExit - Whether to clean up immediately after process completion
   * @returns {Promise<void>}
   * @description Schedules cleanup of a repository based on the provided parameters
   */
  private async scheduleCleanup(repoPath: string, delay: number, cleanupOnExit: boolean): Promise<void> {
    // Add repository to tracking set
    this.downloadedRepos.add(repoPath);
    
    if (cleanupOnExit) {
      this.exitCleanupRepos.add(repoPath);
    } else if (delay > 0) {
      setTimeout(async () => {
        try {
          await fs.rm(repoPath, { recursive: true, force: true });
          this.downloadedRepos.delete(repoPath);
          console.log(`Cleaned up repository after delay: ${repoPath}`);
        } catch (error) {
          console.error(`Error cleaning up repository ${repoPath}:`, error);
        }
      }, delay);
    }
  }

  /**
   * @method execute
   * @param {Record<string, any>} inputs - Input parameters including repository URL and patterns
   * @returns {Promise<Record<string, any> | string>} Processing results including content and statistics, or path string if returnLocalPath is true
   * @description Main execution method that processes a GitHub repository
   * @throws {Error} If repository processing fails
   */
  async execute(inputs: Record<string, any>): Promise<Record<string, any> | string> {
    // Handle authentication token
    const authToken = inputs.token || inputs.authToken; // Support both token formats
    if (authToken) {
      // Update Octokit instance with token
      this.octokit = new Octokit({
        auth: authToken,
        retry: { enabled: true }
      });
      // Store token in config for Git authentication
      this.config.authToken = authToken;
    }

    const excludePatterns = this.parsePatternString(inputs.excludePatterns);
    const includePatterns = this.parsePatternString(inputs.includePatterns);
    const returnLocalPath = inputs.returnLocalPath ?? false;
    const cleanupDelay = inputs.cleanupOnExit ? 0 : (inputs.cleanupAfter || 3600000); // Default to 1 hour if not cleaning up on exit
    const cleanupOnExit = inputs.cleanupOnExit ?? true; // Default to true if not specified
    const branch = inputs.branch || 'main';

    try {
      await this.initTempDirectory();
      const repoPath = await this.cloneRepository(inputs.input || inputs.repositoryUrl, branch);
      
      // Schedule cleanup based on parameters
      await this.scheduleCleanup(repoPath, cleanupDelay, cleanupOnExit);

      if (returnLocalPath) {
        return repoPath; // Return just the path string
      }

      const files = await this.getAllLocalFiles(repoPath, repoPath, excludePatterns, includePatterns);
      const results = [];

      for (const file of files) {
        if (!this.isBinaryFile(file.path)) {
          const content = await this.readLocalFile(path.join(repoPath, file.path));
          results.push(this.formatFileInfo(file, content));
        }
      }

      return {
        content: results.join('\n\n'),
        stats: {
          totalFiles: files.length,
          processedFiles: results.length,
          excludedPatterns: excludePatterns,
          includedPatterns: includePatterns
        }
      };
    } catch (error) {
      console.error('Error processing repository:', error);
      throw error;
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