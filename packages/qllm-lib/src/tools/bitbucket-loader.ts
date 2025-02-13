/**
 * @fileoverview Bitbucket Repository Loader Tool
 * This module provides functionality to load and process Bitbucket repository contents
 * with configurable filtering options.
 * @module bitbucket-loader
 */

import { BaseTool, ToolDefinition } from './base-tool';
import { writeFile } from 'fs/promises';
import * as fs from "fs/promises";
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import axios from 'axios';

/**
 * @class BitbucketLoaderTool
 * @extends BaseTool
 * @description A tool for loading and processing Bitbucket repository contents with filtering capabilities
 */
export class BitbucketLoaderTool extends BaseTool {
  private apiBaseUrl: string = 'https://api.bitbucket.org/2.0';
  private rateLimitDelay: number = 1000; // 1 second delay between requests
  private tmpDir: string;
  private git: SimpleGit;
  private downloadedRepos: Set<string> = new Set();
  private exitCleanupRepos: Set<string> = new Set();

  /**
   * @constructor
   * @param {Record<string, any>} config - Configuration object for the Bitbucket loader
   */
  constructor(config: Record<string, any> = {}) {
    super(config);
    console.log('🚀 Initializing Bitbucket Loader Tool');
    this.tmpDir = '/tmp/bitbucket_loader';
    
    // Initialize git with credential helper disabled
    this.git = simpleGit({
      config: [
        'credential.helper=',
        'credential.helper=/bin/false'
      ]
    });
    console.log('✨ Bitbucket Loader initialized with temp directory:', this.tmpDir);
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
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'bitbucket-loader',
      description: 'Loads content from Bitbucket repositories with options to return content or local path',
      input: {
        repositoryUrl: {
          type: 'string',
          required: true,
          description: 'Full Bitbucket repository URL'
        },
        authToken: {
          type: 'string',
          required: false,
          description: 'Bitbucket authentication token'
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
   * @method parseBitbucketUrl
   * @param {string} url - Bitbucket repository URL
   * @returns {{ workspace: string, repoSlug: string }} Parsed workspace and repository slug
   */
  private parseBitbucketUrl(url: string): { workspace: string; repoSlug: string } {
    const match = url.match(/bitbucket\.org\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new Error('Invalid Bitbucket repository URL');
    }
    return {
      workspace: match[1],
      repoSlug: match[2].replace(/\.git$/, '')
    };
  }

  /**
   * @private
   * @method parsePatternString
   * @param {string | undefined} patterns - Comma-separated string of patterns
   * @returns {string[]} Array of trimmed pattern strings
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
   * @method cleanupExitRepos
   */
  private async cleanupExitRepos(): Promise<void> {
    for (const repoPath of this.exitCleanupRepos) {
      await this.cleanupTempDirectory(repoPath);
    }
    this.exitCleanupRepos.clear();
  }

  /**
   * @private
   * @method cloneRepository
   */
  private async cloneRepository(repositoryUrl: string, authToken?: string, branch?: string): Promise<string> {
    console.log('\n📦 Starting repository clone process...');
    console.log('🔗 Repository URL:', repositoryUrl.replace(/\/\/.*@/, '//****@'));
    console.log('🌿 Branch:', branch || 'default');

    const { workspace, repoSlug } = this.parseBitbucketUrl(repositoryUrl);
    const targetRepoPath = path.join(this.tmpDir, `${workspace}_${repoSlug}`);
    console.log('📂 Target directory:', targetRepoPath);

    try {
      await fs.rm(targetRepoPath, { recursive: true, force: true });
      await fs.mkdir(targetRepoPath, { recursive: true });

      let cloneUrl = repositoryUrl;
      if (authToken) {
        const urlObj = new URL(repositoryUrl);
        urlObj.username = 'x-token-auth';
        urlObj.password = authToken;
        cloneUrl = urlObj.toString();
      }

      const cloneOptions = ['--depth', '1'];
      if (branch) {
        cloneOptions.push('--branch', branch);
      }

      await this.git.clone(cloneUrl, targetRepoPath, cloneOptions);
      console.log('✅ Repository cloned successfully');
      return targetRepoPath;
    } catch (error) {
      console.error('Error cloning repository:', error);
      throw error;
    }
  }

  /**
   * @method execute
   * @param {Record<string, any>} params - Execution parameters
   * @returns {Promise<any>} Execution result
   */
  async execute(params: Record<string, any>): Promise<any> {
    const {
      repositoryUrl,
      authToken,
      branch = 'main',
      excludePatterns,
      includePatterns,
      returnLocalPath = false,
      cleanupAfter = 3600000, // 1 hour default
      cleanupOnExit = true
    } = params;

    if (!repositoryUrl) {
      throw new Error('Repository URL is required');
    }

    await this.initTempDirectory();

    try {
      const repoPath = await this.cloneRepository(repositoryUrl, authToken, branch);
      this.downloadedRepos.add(repoPath);

      if (cleanupOnExit) {
        this.exitCleanupRepos.add(repoPath);
      }

      if (returnLocalPath) {
        if (cleanupAfter > 0) {
          setTimeout(() => this.cleanupTempDirectory(repoPath), cleanupAfter);
        }
        return { localPath: repoPath };
      }

      // Process repository contents
      const excludes = this.parsePatternString(excludePatterns);
      const includes = this.parsePatternString(includePatterns);

      const files = await this.processRepository(repoPath, includes, excludes);
      
      if (cleanupAfter > 0) {
        setTimeout(() => this.cleanupTempDirectory(repoPath), cleanupAfter);
      }

      return {
        files,
        metadata: {
          url: repositoryUrl,
          branch,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error in BitbucketLoaderTool execution:', error);
      throw error;
    }
  }

  /**
   * @private
   * @method processRepository
   */
  private async processRepository(
    repoPath: string,
    includes: string[],
    excludes: string[]
  ): Promise<Array<{ path: string; content: string }>> {
    const results: Array<{ path: string; content: string }> = [];
    
    async function processDirectory(dirPath: string) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(repoPath, fullPath);

        if (entry.isDirectory()) {
          await processDirectory(fullPath);
          continue;
        }

        // Skip if file matches exclude patterns
        if (excludes.some(pattern => {
          if (pattern.startsWith('.')) {
            return entry.name.endsWith(pattern);
          }
          return relativePath.includes(pattern);
        })) {
          continue;
        }

        // Skip if includes are specified and file doesn't match
        if (includes.length > 0) {
          const matchesInclude = includes.some(pattern => {
            if (pattern.startsWith('.')) {
              return entry.name.endsWith(pattern);
            }
            return relativePath.includes(pattern);
          });
          if (!matchesInclude) continue;
        }

        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          results.push({
            path: relativePath,
            content
          });
        } catch (error) {
          console.warn(`Error reading file ${relativePath}:`, error);
        }
      }
    }

    await processDirectory(repoPath);
    return results;
  }
}