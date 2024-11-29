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
import { createHash } from 'crypto'; // New import statement
import { getHandlerForMimeType } from './format-handlers';
import logger from '../logger';
import { DocumentParser, LoadResult } from '../../types/document-types';
import { ParserRegistry, DefaultParserRegistry } from './parsers/parser-registry';
import { ContentValidator,ContentValidationOptions } from './content-validator';


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
  private contentValidator: ContentValidator;

  constructor(inputPath: string, 
    private parserRegistry: ParserRegistry = new DefaultParserRegistry(),
    options: DocumentLoaderOptions = {}) {

    super();
    // Validate input path immediately
    this.validateFilePath(inputPath);
    this.inputPath = inputPath;

    this.options = {
        chunkSize: 1024 * 1024,
        encoding: 'utf-8',
        timeout: 30000, // 30 seconds
        headers: {},
        maxRetries: 3,
        retryDelay: 1000,
        cacheDir: path.join(os.tmpdir(), 'document-loader-cache'),
        proxy: '',
        decompress: true,
        useCache: false,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        validationOptions: {
          maxFileSize: 100 * 1024 * 1024,
          allowedMimeTypes: ['text/plain', 'application/pdf', 'text/typescript','application/octet-stream','application/pdf'],
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

    // // Check for suspicious characters
    // const suspiciousChars = /[\0<>:"|?*]/;
    // if (suspiciousChars.test(filePath)) {
    //     throw new Error('File path contains invalid characters');
    // }

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
      const mimeType = this.getMimeType(absolutePath) || 'application/octet-stream';

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
                  // Cache read failed, continue with normal file loading
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

          // Read file in chunks
          while (loadedSize < totalSize) {
              const buffer = Buffer.alloc(Math.min(this.options.chunkSize, totalSize - loadedSize));
              const result = await fileHandle.read(buffer, 0, buffer.length, loadedSize);
              
              if (result.bytesRead <= 0) {
                  break; // End of file or error
              }

              chunks.push(buffer.subarray(0, result.bytesRead));
              loadedSize += result.bytesRead;
              
              // Emit progress
              this.emit('progress', loadedSize / totalSize);

              // Check if operation was cancelled
              if (this.cancelTokenSource?.token.reason) {
                  throw new Error('Operation cancelled by user');
              }
          }

          const content = Buffer.concat(chunks);

          // Validate content size after reading
          if (content.length !== totalSize) {
              throw new Error(`File size mismatch: expected ${totalSize}, got ${content.length}`);
          }

          // Cache content if enabled
          if (this.options.useCache) {
              try {
                  const cachedPath = this.getCachePath(absolutePath);
                  await this.cacheContent(cachedPath, content);
              } catch (error) {
                  // Log cache write failure but continue
                  logger.error(`Failed to cache content for ${filePath}: ${error}`);
              }
          }

          // Parse content using appropriate parser
          const parsedContent = await this.parseContent(content, absolutePath);

          return { content, mimeType, parsedContent };

      } finally {
          // Ensure file handle is always closed
          if (fileHandle) {
              await fileHandle.close().catch(error => {
                  logger.error(`Failed to close file handle for ${filePath}: ${error}`);
              });
          }
      }

  } catch (error) {
      // Transform and rethrow errors with context
      const errorMessage = error instanceof Error ? 
          error.message : 
          `Unknown error: ${String(error)}`;
      
      throw new Error(`Failed to load file ${filePath}: ${errorMessage}`);
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

  /**
   * Loads a document from a URL.
   * 
   * @param url URL to load.
   * @returns Loaded document content and MIME type.
   */
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

  /**
   * Gets the cache path for a given input path or URL.
   * 
   * @param key Input path or URL to get the cache path for.
   * @returns Cache path.
   */
  private getCachePath(key: string): string {
    const hash = createHash('md5').update(key).digest('hex');
    return path.join(this.options.cacheDir, hash);
  }

  /**
   * Checks if the cache is valid for a given input path or URL.
   * 
   * @param original Original input path or URL.
   * @param cached Cached path to check.
   * @returns True if the cache is valid, false otherwise.
   */
  private async isCacheValid(original: string, cached: string): Promise<boolean> {
    try {
      const [originalStat, cachedStat] = await Promise.all([fs.stat(original), fs.stat(cached)]);
      return cachedStat.mtime > originalStat.mtime;
    } catch {
      return false;
    }
  }

  /**
   * Caches the content of a loaded document.
   * 
   * @param cachedPath Cached path to write to.
   * @param content Document content to cache.
   */
  private async cacheContent(cachedPath: string, content: Buffer): Promise<void> {
    await fs.mkdir(path.dirname(cachedPath), { recursive: true });
    await fs.writeFile(cachedPath, content);
  }

  /**
   * Loads a document as a string.
   * 
   * @returns Loaded document content and MIME type.
   */
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

  /**
   * Loads a document as a buffer.
   * 
   * @returns Loaded document content and MIME type.
   */
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

  /**
   * Cancels the current load operation.
   */
  public cancel(): void {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Operation cancelled by user');
    }
  }

  /**
   * Quickly loads a document as a string.
   * 
   * @param input Input path or URL to load.
   * @param options Configuration options for the loader.
   * @returns Loaded document content and MIME type.
   */
  public static async quickLoadString(
    input: string,
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<string>> {
    
    const defaultRegistry = new DefaultParserRegistry();
    const loader = new DocumentLoader(input, defaultRegistry,options);
    return loader.loadAsString();
  }

  /**
   * Quickly loads a document as a buffer.
   * 
   * @param input Input path or URL to load.
   * @param options Configuration options for the loader.
   * @returns Loaded document content and MIME type.
   */
  public static async quickLoadBuffer(
    input: string,
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<Buffer>> {
    const defaultRegistry = new DefaultParserRegistry();
    const loader = new DocumentLoader(input, defaultRegistry,options);
    return loader.loadAsBuffer();
  }

  /**
   * Loads multiple documents as strings.
   * 
   * @param inputs Input paths or URLs to load.
   * @param options Configuration options for the loader.
   * @returns Loaded document contents and MIME types.
   */
  public static async loadMultipleAsString(
    inputs: string[],
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<string>[]> {
    const defaultRegistry = new DefaultParserRegistry();
    const loaders = inputs.map((input) => new DocumentLoader(input,defaultRegistry, options));
    return Promise.all(loaders.map((loader) => loader.loadAsString()));
  }

  /**
   * Loads multiple documents as buffers.
   * 
   * @param inputs Input paths or URLs to load.
   * @param options Configuration options for the loader.
   * @returns Loaded document contents and MIME types.
   */
  public static async loadMultipleAsBuffer(
    inputs: string[],
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<Buffer>[]> {
    const defaultRegistry = new DefaultParserRegistry();
    const loaders = inputs.map((input) => new DocumentLoader(input,defaultRegistry, options));
    return Promise.all(loaders.map((loader) => loader.loadAsBuffer()));
  }

  /**
   * Type-safe event emitter methods.
   */
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
