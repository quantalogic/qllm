/**
 * @fileoverview GitLab Repository Loader Tool
 * This module provides functionality to load and process GitLab repository contents
 * with configurable filtering options.
 * @module gitlab-loader
 */

import { Gitlab } from '@gitbeaker/rest';
import type { Gitlab as GitlabClient } from '@gitbeaker/rest';
import { BaseTool, ToolDefinition } from './base-tool';
import { writeFile } from 'fs/promises';
import * as fs from "fs/promises"
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';

/**
 * @class GitlabLoaderTool
 * @extends BaseTool
 * @description A tool for loading and processing GitLab repository contents with filtering capabilities
 */
export class GitlabLoaderTool extends BaseTool {
  private gitlab: InstanceType<typeof Gitlab>;
  private rateLimitDelay: number = 1000; // 1 second delay between requests
  private tmpDir: string;
  private git: SimpleGit; 
  private downloadedRepos: Set<string> = new Set();
  private exitCleanupRepos: Set<string> = new Set();

  /**
   * @constructor
   * @param {Record<string, any>} config - Configuration object for the GitLab loader
   * @throws {Error} If unable to initialize GitLab client
   */
  constructor(config: Record<string, any> = {}) {
    super(config);
    console.log('🚀 Initializing GitLab Loader Tool');
    // Initialize GitLab client without token
    this.gitlab = new Gitlab({
      host: 'https://gitlab.com'
    });
    this.tmpDir = '/tmp/gitlab_loader';
    // Initialize git with credential helper disabled
    this.git = simpleGit({
      config: [
        'credential.helper=',
        'credential.helper=/bin/false'
      ]
    });
    console.log('✨ GitLab Loader initialized with temp directory:', this.tmpDir);
    console.log('🔒 Git credential caching disabled');

    // Register cleanup on process exit
    process.on('exit', () => {
      console.log('🧹 Running exit cleanup...');
      this.cleanupExitRepos();
    });

    // Handle interrupts
    process.on('SIGINT', () => {
      console.log('\n🛑 Interrupt received, cleaning up...');
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
          name: 'gitlab-loader',
          description: 'Loads content from GitLab repositories with options to return content or local path',
          input: {
              repositoryUrl: {
                  type: 'string',
                  required: true,
                  description: 'Full GitLab repository URL'
              },
              authToken: {
                  type: 'string',
                  required: false,
                  description: 'GitLab authentication token'
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
   * 
   * @example
   * // Glob pattern matching
   * matchesPattern('src/file.ts', ['*.ts']) // returns true
   * // Extension matching
   * matchesPattern('file.jpg', ['.jpg']) // returns true
   * // Directory matching
   * matchesPattern('src/components/Button.tsx', ['/src']) // returns true
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
   * @param {string} repositoryUrl - URL of the GitLab repository to clone
   * @param {string} [branch] - Branch to clone (defaults to "main")
   * @returns {Promise<string>} Path to the cloned repository
   * @throws {Error} If cloning fails
   * @description Clones a GitLab repository to a local temporary directory
   */
  private async cloneRepository(repositoryUrl: string, branch?: string): Promise<string> {
    console.log('\n📦 Starting repository clone process...');
    console.log('🔗 Repository URL:', repositoryUrl.replace(/\/\/.*@/, '//****@')); // Hide token in logs
    console.log('🌿 Branch:', branch || 'default');

    const { projectId } = this.parseGitlabUrl(repositoryUrl);
    console.log('📝 Project ID:', projectId);
    
    const targetRepoPath = path.join(this.tmpDir, projectId);
    console.log('📂 Target directory:', targetRepoPath);

    try {
      // Ensure thorough cleanup of existing directory
      try {
        const stats = await fs.stat(targetRepoPath);
        if (stats.isDirectory()) {
          console.log('🗑️  Found existing repository, cleaning up...');
          await fs.rm(targetRepoPath, { recursive: true, force: true });
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('✅ Existing directory removed');
        }
      } catch (err) {
        console.log('📝 No existing directory found');
      }

      // Double check directory is gone
      try {
        await fs.access(targetRepoPath);
        console.log('⚠️  Directory still exists, attempting final cleanup...');
        await fs.rm(targetRepoPath, { recursive: true, force: true });
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Final cleanup successful');
      } catch (err) {
        // Directory doesn't exist, which is what we want
      }

      let isPublic = true;
      const authToken = this.config.token || this.config.authToken;

      // Check if repository is public or private
      try {
        console.log('🔍 Checking repository visibility...');
        // Try unauthenticated request first
        const unauthGitlab = new Gitlab({ host: 'https://gitlab.com' });
        try {
          const response = await unauthGitlab.Projects.show(projectId);
          isPublic = response?.visibility === 'public';
          console.log(`📢 Repository is ${isPublic ? 'public' : 'private'}`);
        } catch (error) {
          // If unauthenticated request fails, try with token if available
          if (authToken) {
            const response = await this.gitlab.Projects.show(projectId);
            isPublic = response?.visibility === 'public';
            console.log(`📢 Repository is ${isPublic ? 'public' : 'private'}`);
          } else {
            console.log('⚠️  Could not verify repository visibility, will attempt public access');
          }
        }
      } catch (error: any) {
        if (!isPublic && !authToken) {
          throw new Error('Authentication token is required for private repositories');
        }
      }

      let cloneUrl = repositoryUrl;
      if (authToken) {
        // Prepare the repository URL with authentication if token is provided
        console.log('🔐 Preparing authenticated URL...');
        const urlMatch = repositoryUrl.match(/^(https?:\/\/)([^\/]+)(\/.*)/);
        if (!urlMatch) {
          throw new Error('Invalid GitLab repository URL format');
        }
        
        const [, protocol, host, path] = urlMatch;
        // Format: https://oauth2:TOKEN@gitlab.com/path
        cloneUrl = `${protocol}oauth2:${authToken}@${host}${path}`;
        console.log('🔒 URL prepared with authentication');
      } else {
        console.log('🌐 Using public URL for cloning');
      }

      // Clone the repository with specified branch
      console.log(`\n🚀 Starting clone operation for: https://gitlab.com/${projectId}`);
      if (branch) console.log(`📌 Using branch: ${branch}`);
      
      // Set up clone options with credential helper disabled
      const cloneOptions = [
        '-c', 'credential.helper=',
        '-c', 'credential.helper=/bin/false',
        'clone'
      ];
      
      if (branch) {
        cloneOptions.push('-b', branch);
      }
      cloneOptions.push('--single-branch'); // Only clone the specified branch
      cloneOptions.push(cloneUrl, targetRepoPath);
      
      console.log('⚙️  Clone options:', cloneOptions.map(opt => opt.includes(authToken || '') ? '****' : opt).join(' '));
      
      try {
        console.log('📥 Cloning repository...');
        await this.git.raw(cloneOptions);
        console.log('✅ Repository cloned successfully');
        console.log(`📁 Clone location: ${targetRepoPath}`);
      } catch (cloneError: any) {
        console.error('❌ Clone operation failed');
        
        // If clone fails, ensure cleanup
        try {
          console.log('🧹 Cleaning up failed clone...');
          await fs.rm(targetRepoPath, { recursive: true, force: true });
          console.log('✅ Cleanup successful');
        } catch (cleanupError) {
          console.error('⚠️  Cleanup after failed clone failed:', cleanupError);
        }

        throw cloneError;
      }
      
      return targetRepoPath;
    } catch (error) {
      console.error('❌ Repository clone failed:', error);
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
   * @example
   * // Glob pattern matching
   * matchesPattern('src/file.ts', ['*.ts']) // returns true
   * // Extension matching
   * matchesPattern('file.jpg', ['.jpg']) // returns true
   * // Directory matching
   * matchesPattern('src/components/Button.tsx', ['/src']) // returns true
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
      '*.webm',
      '*.wav',
      '*.ogg',
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
   * @method parseGitlabUrl
   * @param {string} url - GitLab repository URL
   * @returns {{ projectId: string }} Object containing project ID
   * @throws {Error} If URL format is invalid
   * @description Parses a GitLab URL to extract project ID
   * 
   * @example
   * parseGitlabUrl('https://gitlab.com/owner/repo')
   * // returns { projectId: 'owner/repo' }
   */
  private parseGitlabUrl(url: string): { projectId: string } {
    const match = url.match(/gitlab\.com\/([^\/]+\/[^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitLab repository URL');
    }
    return { 
      projectId: match[1].replace('.git', '') 
    };
  }

  /**
   * @private
   * @method getRepositoryContent
   * @param {string} projectId - GitLab project ID
   * @param {string} [path=''] - Path within repository
   * @param {string} [ref='main'] - Branch or commit reference
   * @returns {Promise<any[]>} Array of repository content items
   * @throws {Error} Handles rate limit errors and retries
   * @description Fetches repository content from GitLab API with rate limiting handling
 */


  /**
   * @private
   * @method handleRateLimitError
   * @param {any} error - Error object from GitLab API
   * @returns {Promise<void>}
   * @description Handles GitLab API rate limit errors by waiting for the reset time
   */
  private async handleRateLimitError(error: any): Promise<void> {
    const resetTime = error.response?.headers?.['ratelimit-reset'];
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
   * @param {string} projectId - GitLab project ID
   * @param {string} [path=''] - Path within repository
   * @returns {Promise<any[]>} Array of file objects
   * @description Recursively retrieves all files from a GitLab repository
   */


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
   * @description Main execution method that processes a GitLab repository
   * @throws {Error} If repository processing fails
   */
  async execute(inputs: Record<string, any>): Promise<Record<string, any> | string> {
    console.log('\n🚀 Starting GitLab Loader execution');
    
    // Log input parameters (hiding sensitive data)
    console.log('📝 Input parameters:', {
      ...inputs,
      authToken: inputs.authToken ? '****' : undefined,
      token: inputs.token ? '****' : undefined
    });

    // Configure authentication if token is provided
    const authToken = inputs.token || inputs.authToken;
    if (authToken) {
      console.log('🔐 Configuring GitLab client with authentication');
      this.gitlab = new Gitlab({
        host: 'https://gitlab.com',
        token: authToken
      });
      this.config.token = authToken;
      console.log('✅ Authentication configured');
    } else {
      console.log('⚠️  No authentication token provided. Private repositories may not be accessible.');
    }

    // Extract and validate repository URL
    const repositoryUrl = inputs.repositoryUrl || inputs.input;
    if (!repositoryUrl) {
      throw new Error('Repository URL is required');
    }
    console.log('🔗 Repository URL:', repositoryUrl);

    // Parse exclude patterns
    const excludePatterns = (inputs.excludePatterns || inputs.exclude || '')
      .split(',')
      .map((p: string) => p.trim())
      .filter((p: string) => p);
    console.log('🚫 Exclude patterns:', excludePatterns);

    // Parse include patterns
    const includePatterns = (inputs.includePatterns || inputs.files_to_include || '')
      .split(',')
      .map((p: string) => p.trim())
      .filter((p: string) => p);
    console.log('✅ Include patterns:', includePatterns);

    // Get other options
    const returnLocalPath = inputs.returnLocalPath || false;
    const cleanupDelay = inputs.cleanupDelay || 3600000; // 1 hour default
    const cleanupOnExit = inputs.cleanupOnExit !== false;
    const branch = inputs.branch;

    console.log('📂 Return local path:', returnLocalPath);
    console.log('⏲️  Cleanup delay:', cleanupDelay, 'ms');
    console.log('🧹 Cleanup on exit:', cleanupOnExit);
    if (branch) console.log('🌿 Branch:', branch);

    // Initialize temporary directory
    console.log('\n📁 Initializing temporary directory');
    await this.initTempDirectory();
    console.log('📁 Temporary directory created at:', this.tmpDir);

    // Clone repository
    console.log('\n📥 Cloning repository');
    const repoPath = await this.cloneRepository(repositoryUrl, branch);

    // Process repository files
    const result = await this.processRepository(repoPath, excludePatterns, includePatterns);

    // Schedule cleanup
    if (!returnLocalPath) {
      this.scheduleCleanup(repoPath, cleanupDelay, cleanupOnExit);
    }

    return result;
  }

  /**
   * @private
   * @method processRepository
   * @param {string} repoPath - Path to the cloned repository
   * @param {string[]} excludePatterns - Patterns to exclude from results
   * @param {string[]} includePatterns - Patterns to include in results
   * @returns {Promise<Record<string, any>>} Processing results including content and statistics
   * @description Processes the cloned repository by scanning files and applying filters
   */
  private async processRepository(repoPath: string, excludePatterns: string[], includePatterns: string[]): Promise<Record<string, any>> {
    console.log('\n🔍 Scanning repository files');
    const files = await this.getAllLocalFiles(repoPath, repoPath, excludePatterns, includePatterns);
    console.log(`📊 Found ${files.length} files matching criteria`);
    
    const results = [];
    console.log('\n📄 Processing files...');

    for (const file of files) {
      if (!this.isBinaryFile(file.path)) {
        console.log(`  Processing: ${file.path}`);
        const content = await this.readLocalFile(path.join(repoPath, file.path));
        results.push(this.formatFileInfo(file, content));
      } else {
        console.log(`  Skipping binary file: ${file.path}`);
      }
    }

    console.log('\n✅ Processing complete');
    console.log(`📊 Processed ${results.length} out of ${files.length} files`);

    return {
      content: results.join('\n\n'),
      stats: {
        totalFiles: files.length,
        processedFiles: results.length,
        excludedPatterns: excludePatterns,
        includedPatterns: includePatterns
      }
    };
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
      '.ogg', '.pdf', '.zip', '.tar', '.gz', '.7z', '.jar', '.war', '.db', '.sql',
      '.ear', '.class', '.dll', '.exe', '.so', '.dylib'
    ];
    const ext = '.' + (filepath.toLowerCase().split('.').pop() || '');
    return binaryExtensions.includes(ext);
  }
}