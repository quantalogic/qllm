// src/tools/github-loader.ts
import { Octokit } from '@octokit/rest';
import { BaseTool, ToolDefinition } from './base-tool';
import { writeFile } from 'fs/promises';
import * as fs from "fs/promises"
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';

interface TreeItem {
  path: string;
  type: string;
  sha: string;
  size?: number;
}

export class GithubLoaderTool extends BaseTool {
  private octokit: Octokit;
  private rateLimitDelay: number = 1000; // 1 second delay between requests
  private tmpDir: string;
  private git: SimpleGit;

  private defaultExcludePatterns = [
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

  constructor(config: Record<string, any>) {
    super(config);
    this.octokit = new Octokit({
      auth: config.authToken || process.env.GITHUB_TOKEN,
      retry: { enabled: true }
    });
    this.tmpDir = path.join(process.cwd(), 'tmp');
    this.git = simpleGit();
  }

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

    private parsePatternString(patterns: string | undefined): string[] {
        if (!patterns) return [];
        return patterns.split(',')
            .map(p => p.trim())
            .filter(p => p.length > 0);
    }
 
  private async initTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.tmpDir, { recursive: true });
      console.log(`📁 Temporary directory created at: ${this.tmpDir}`);
    } catch (error) {
      console.error('Error creating temp directory:', error);
      throw error;
    }
  }

  private async cleanupTempDirectory(repoPath: string): Promise<void> {
    try {
      await fs.rm(repoPath, { recursive: true, force: true });
      console.log(`🧹 Cleaned up repository directory: ${repoPath}`);
    } catch (error) {
      console.warn('Error cleaning up temp directory:', error);
    }
  }

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

  private async readLocalFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return `// Error reading file: ${error}`;
    }
  }
 
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
      'yarn.lock'
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


  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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