/**
 * @fileoverview Advanced document loader with support for local files, URLs, and caching.
 * Features include:
 * - Progress tracking
 * - Cancellation support
 * - Automatic retries
 * - Caching
 * - MIME type detection
 * - Format-specific handling
 * - Proxy support
 * - Compression handling
 * 
 * @author QLLM Team
 * @module utils/document/document-loader
 */

import fs from 'fs/promises';
import path from 'path';
import axios, { AxiosRequestConfig, CancelTokenSource } from 'axios';
import { EventEmitter } from 'events';
import os from 'os';
import zlib from 'zlib';
import { promisify } from 'util';
import mime from 'mime-types';
import { URL } from 'url';
import { createHash } from 'crypto';
import { getHandlerForMimeType } from './format-handlers';
import logger from '../logger';
import { DocumentParser, LoadResult } from '../../types/document-types';
import { ParserRegistry, DefaultParserRegistry } from './parsers/parser-registry';
import { ContentValidator, ContentValidationOptions } from './content-validator';

const gunzip = promisify(zlib.gunzip);

/**
 * Configuration options for document loading behavior.
 */
export interface DocumentLoaderOptions {
  /** Size of chunks when reading files (in bytes) */
  chunkSize?: number;
  /** Character encoding for text files */
  encoding?: BufferEncoding;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom HTTP headers for URL requests */
  headers?: Record<string, string>;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Directory for caching loaded documents */
  cacheDir?: string;
  /** Proxy server configuration (format: "host:port") */
  proxy?: string;
  /** Whether to decompress gzipped content */
  decompress?: boolean;
  /** Whether to use document caching */
  useCache?: boolean;
  maxFileSize?: number;
  validationOptions?: ContentValidationOptions;
}

/**
 * Event handlers for document loading progress and status.
 */
export interface DocumentLoaderEvents {
  /** Called with progress percentage (0-1) during loading */
  progress: (progress: number) => void;
  /** Called when document is successfully loaded */
  loaded: (result: LoadResult<Buffer>) => void;
  /** Called when an error occurs during loading */
  error: (error: Error) => void;
  /** Called when a retry attempt is made */
  retry: (attempt: number, maxRetries: number) => void;
}

/**
 * Advanced document loader supporting multiple sources and formats.
 * Extends EventEmitter to provide progress and status updates during loading.
 * 
 * Features:
 * - Local file loading with chunking
 * - URL loading with progress tracking
 * - Automatic retry on failure
 * - Content caching
 * - Format-specific handling
 * - Cancellation support
 * 
 * @example
 * ```typescript
 * // Load a local file
 * const loader = new DocumentLoader('~/documents/report.pdf');
 * loader.on('progress', (progress) => console.log(`${progress * 100}% loaded`));
 * const result = await loader.loadAsBuffer();
 * 
 * // Load from URL with options
 * const urlLoader = new DocumentLoader('https://example.com/doc.pdf', {
 *   timeout: 5000,
 *   useCache: true
 * });
 * const content = await urlLoader.loadAsString();
 * ```
 */
export class DocumentLoader extends EventEmitter {
  /**
   * Input path or URL to load.
   */
  private inputPath: string;

  /**
   * Configuration options for the loader.
   */
  private options: Required<DocumentLoaderOptions>;

  /**
   * Cancel token source for the current load operation.
   */
  private cancelTokenSource: CancelTokenSource | null = null;

  /**
   * Content validator instance.
   */
  private contentValidator: ContentValidator;

  /**
   * Parser registry instance.
   */
  private parserRegistry: ParserRegistry;

  constructor(
    inputPath: string, 
    parserRegistry: ParserRegistry = new DefaultParserRegistry(),
    options: DocumentLoaderOptions = {}
  ) {
    super();
    this.validateFilePath(inputPath);
    this.inputPath = inputPath;
    this.parserRegistry = parserRegistry;

    this.options = {
      chunkSize: 1024 * 1024,
      encoding: 'utf-8',
      timeout: 30000,
      headers: {},
      maxRetries: 3,
      retryDelay: 1000,
      cacheDir: path.join(os.tmpdir(), 'document-loader-cache'),
      proxy: '',
      decompress: true,
      useCache: false,
      maxFileSize: 100 * 1024 * 1024,
      validationOptions: {
        maxFileSize: 100 * 1024 * 1024,
        allowedMimeTypes: ['text/plain', 'application/pdf', 'text/typescript', 'application/octet-stream', 'application/pdf'],
        validateEncoding: true,
        securityScanEnabled: true
      },
      ...options,
    };

    this.contentValidator = new ContentValidator(this.options.validationOptions);
  }

  /**
   * Expands a file path containing a tilde (~) to the user's home directory.
   * 
   * @param filePath File path to expand.
   * @returns Expanded file path.
   */
  private expandTilde(filePath: string): string {
    if (filePath.startsWith('~/') || filePath === '~') {
      return filePath.replace('~', os.homedir());
    }
    return filePath;
  }

  /**
   * Checks if the input path is a URL.
   * 
   * @param input Input path to check.
   * @returns True if the input path is a URL, false otherwise.
   */
  private isUrl(input: string): boolean {
    return input.startsWith('http://') || input.startsWith('https://');
  }

  /**
   * Checks if the input path is a file URL.
   * 
   * @param input Input path to check.
   * @returns True if the input path is a file URL, false otherwise.
   */
  private isFileUrl(input: string): boolean {
    return input.startsWith('file://');
  }

  /**
   * Converts a file URL to a local file path.
   * 
   * @param fileUrl File URL to convert.
   * @returns Local file path.
   */
  private fileUrlToPath(fileUrl: string): string {
    const url = new URL(fileUrl);
    return decodeURIComponent(url.pathname);
  }

  private validateFilePath(filePath: string): void {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('File path must be a string');
    }

    // Basic security check to prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      throw new Error('File path cannot contain parent directory references');
    }

    // Check path length
    if (filePath.length > 510) {
        throw new Error('File path exceeds maximum length');
    }
  }

  private getParser(filename: string): DocumentParser | undefined {
    return this.parserRegistry.getParser(filename);
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    // Override MIME type for TypeScript files
    if (ext === '.ts' || ext === '.tsx') {
      return 'text/typescript';
    }
    return mime.lookup(filePath) || 'application/octet-stream';
  }

  private getRawGitHubUrl(url: string): string {
    try {
      const githubUrl = new URL(url);
      
      // Check if it's a GitHub URL
      if (!githubUrl.hostname.includes('github.com')) {
        throw new Error('Not a GitHub URL');
      }

      // Convert github.com to raw.githubusercontent.com
      // Remove 'blob/' from the path if present
      // Example: https://github.com/user/repo/blob/master/file.txt
      // becomes: https://raw.githubusercontent.com/user/repo/master/file.txt
      const pathParts = githubUrl.pathname.split('/');
      
      // Remove empty strings from path parts
      const filteredParts = pathParts.filter(part => part.length > 0);
      
      // Check if we have enough parts (user, repo, blob/tree, branch, filepath)
      if (filteredParts.length < 5) {
        throw new Error('Invalid GitHub URL format');
      }

      // Remove 'blob' or 'tree' from path
      const blobIndex = filteredParts.findIndex(part => part === 'blob' || part === 'tree');
      if (blobIndex !== -1) {
        filteredParts.splice(blobIndex, 1);
      }

      // Construct raw URL
      return `https://raw.githubusercontent.com/${filteredParts.join('/')}`;
    } catch (error) {
      throw new Error(`Failed to parse GitHub URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async loadFromFile(filePath: string): Promise<LoadResult<Buffer>> {
    try {
      // Initial path processing
      const expandedPath = this.expandTilde(filePath);
      const absolutePath = path.resolve(expandedPath);
      const mimeType = this.getMimeType(absolutePath);

      // Validate file existence and accessibility
      try {
        await fs.access(absolutePath, fs.constants.R_OK);
      } catch (error) {
        throw new Error(`File not accessible: ${filePath}`);
      }

      // Check cache if enabled
      if (this.options.useCache) {
        const cachedPath = this.getCachePath(absolutePath);
        if (await this.isCacheValid(absolutePath, cachedPath)) {
          try {
            const content = await fs.readFile(cachedPath);
            const parsedContent = await this.parseContent(content, absolutePath);
            return { content, mimeType, parsedContent };
          } catch (error) {
            logger.warn(`Cache read failed for ${filePath}, loading from source`);
          }
        }
      }

      // Get file stats and validate size
      const fileStats = await fs.stat(absolutePath);
      if (fileStats.size > this.options.maxFileSize) {
        throw new Error(
          `File size (${fileStats.size} bytes) exceeds maximum allowed size (${this.options.maxFileSize} bytes)`
        );
      }

      // Load file in chunks with proper resource management
      let fileHandle: fs.FileHandle | undefined;
      try {
        fileHandle = await fs.open(absolutePath, 'r');
        const totalSize = fileStats.size;
        let loadedSize = 0;
        const chunks: Buffer[] = [];

        while (loadedSize < totalSize) {
          const chunk = Buffer.alloc(Math.min(this.options.chunkSize, totalSize - loadedSize));
          const { bytesRead } = await fileHandle.read(chunk, 0, chunk.length, loadedSize);
          
          if (bytesRead === 0) break;
          
          chunks.push(chunk.slice(0, bytesRead));
          loadedSize += bytesRead;
          
          this.emit('progress', loadedSize / totalSize);
        }

        const content = Buffer.concat(chunks);
        const parsedContent = await this.parseContent(content, absolutePath);
        
        // Cache content if enabled
        if (this.options.useCache) {
          await this.cacheContent(absolutePath, content);
        }

        return { content, mimeType, parsedContent };
      } finally {
        if (fileHandle) {
          await fileHandle.close().catch(error => {
            logger.error('Error closing file handle:', error);
          });
        }
      }
    } catch (error) {
      throw new Error(`Failed to load file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateContent(buffer: Buffer, filePath: string): Promise<void> {
    try {
      const mimeType = this.getMimeType(filePath);
      await this.contentValidator.validateContent(buffer, mimeType, filePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? 
        error.message : 
        `Content validation failed: ${String(error)}`;
      throw new Error(`Validation error for ${filePath}: ${errorMessage}`);
    }
  }

  private async parseContent(buffer: Buffer, filePath: string): Promise<string | undefined> {
    const parser = this.getParser(filePath);
    if (!parser) {
      return undefined;
    }

    try {
      await this.validateContent(buffer, this.getMimeType(filePath));
      return await parser.parse(buffer, filePath);
    } catch (error) {
      this.emit('error', new Error(`Parsing error for ${filePath}: ${error}`));
      throw error;
    }
  }

  private async loadFromUrl(url: string): Promise<LoadResult<Buffer>> {
    let finalUrl = url;
    
    // Convert GitHub URLs to raw content URLs
    if (url.includes('github.com')) {
      try {
        finalUrl = this.getRawGitHubUrl(url);
      } catch (error) {
        logger.warn(`Failed to convert GitHub URL, using original URL: ${error}`);
      }
    }

    if (this.options.useCache) {
      const cachedPath = this.getCachePath(finalUrl);
      if (await this.isCacheValid(finalUrl, cachedPath)) {
        const content = await fs.readFile(cachedPath);
        const mimeType = mime.lookup(finalUrl) || 'application/octet-stream';
        return { content, mimeType };
      }
    }

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        this.cancelTokenSource = axios.CancelToken.source();
        const axiosConfig: AxiosRequestConfig = {
          responseType: 'arraybuffer',
          timeout: this.options.timeout,
          headers: this.options.headers,
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              this.emit('progress', progressEvent.loaded / progressEvent.total);
            }
          },
          cancelToken: this.cancelTokenSource.token,
          proxy: this.options.proxy
            ? {
              host: this.options.proxy.split(':')[0],
              port: parseInt(this.options.proxy.split(':')[1], 10),
            }
            : undefined,
        };

        const response = await axios.get(finalUrl, axiosConfig);
        let content = Buffer.from(response.data);

        if (this.options.decompress && response.headers['content-encoding'] === 'gzip') {
          content = await gunzip(content);
        }

        const mimeType = response.headers['content-type'] || 'application/octet-stream';

        if (this.options.useCache) {
          const cachedPath = this.getCachePath(finalUrl);
          await this.cacheContent(cachedPath, content);
        }

        return { content, mimeType };
      } catch (error) {
        if (axios.isCancel(error)) {
          throw new Error('Operation cancelled');
        }
        if (attempt === this.options.maxRetries) {
          throw error;
        }
        this.emit('retry', attempt, this.options.maxRetries);
        await new Promise((resolve) => setTimeout(resolve, this.options.retryDelay));
      }
    }
    throw new Error('Max retries reached');
  }

  private getCachePath(key: string): string {
    const hash = createHash('md5').update(key).digest('hex');
    return path.join(this.options.cacheDir, hash);
  }

  private async isCacheValid(original: string, cached: string): Promise<boolean> {
    try {
      const [originalStat, cachedStat] = await Promise.all([fs.stat(original), fs.stat(cached)]);
      return cachedStat.mtime > originalStat.mtime;
    } catch {
      return false;
    }
  }

  private async cacheContent(cachedPath: string, content: Buffer): Promise<void> {
    await fs.mkdir(path.dirname(cachedPath), { recursive: true });
    await fs.writeFile(cachedPath, content);
  }

  public async loadAsString(): Promise<LoadResult<string>> {
    const { content: buffer, mimeType } = await this.loadAsBuffer();
    try {
      const handler = getHandlerForMimeType(mimeType);
      let content: string;
      
      if (handler) {
        content = await handler.handle(buffer);
      } else {
        // Fallback to basic text conversion
        logger.warn(`No handler found for mime type ${mimeType}, falling back to basic text conversion`);
        content = buffer.toString(this.options.encoding);
      }
  
      // Add parsing step
      const parsedContent = await this.parseContent(buffer, this.inputPath);
  
      return {
        content,
        mimeType,
        parsedContent
      };
    } catch (error) {
      throw new Error(
        `Failed to process file (${mimeType}): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  public async loadAsBuffer(): Promise<LoadResult<Buffer>> {
    try {
      let result: LoadResult<Buffer>;
      
      if (this.isUrl(this.inputPath)) {
        result = await this.loadFromUrl(this.inputPath);
      } else if (this.isFileUrl(this.inputPath)) {
        const filePath = this.fileUrlToPath(this.inputPath);
        result = await this.loadFromFile(filePath);
      } else {
        result = await this.loadFromFile(this.inputPath);
      }
  
      // Add parsing step
      const parsedContent = await this.parseContent(result.content, this.inputPath);
      result.parsedContent = parsedContent;
  
      this.emit('loaded', result);
      return result;
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error(String(error));
      this.emit('error', typedError);
      throw typedError;
    }
  }

  public cancel(): void {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Operation cancelled by user');
    }
  }

  public static async quickLoadString(
    input: string,
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<string>> {
    const defaultRegistry = new DefaultParserRegistry();
    const loader = new DocumentLoader(input, defaultRegistry, options);
    return loader.loadAsString();
  }

  public static async quickLoadBuffer(
    input: string,
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<Buffer>> {
    const defaultRegistry = new DefaultParserRegistry();
    const loader = new DocumentLoader(input, defaultRegistry, options);
    return loader.loadAsBuffer();
  }

  public static async loadMultipleAsString(
    inputs: string[],
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<string>[]> {
    const defaultRegistry = new DefaultParserRegistry();
    const loaders = inputs.map((input) => new DocumentLoader(input, defaultRegistry, options));
    return Promise.all(loaders.map((loader) => loader.loadAsString()));
  }

  public static async loadMultipleAsBuffer(
    inputs: string[],
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<Buffer>[]> {
    const defaultRegistry = new DefaultParserRegistry();
    const loaders = inputs.map((input) => new DocumentLoader(input, defaultRegistry, options));
    return Promise.all(loaders.map((loader) => loader.loadAsBuffer()));
  }

  public on<K extends keyof DocumentLoaderEvents>(
    event: K,
    listener: DocumentLoaderEvents[K],
  ): this {
    return super.on(event, listener);
  }

  public emit<K extends keyof DocumentLoaderEvents>(
    event: K,
    ...args: Parameters<DocumentLoaderEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
