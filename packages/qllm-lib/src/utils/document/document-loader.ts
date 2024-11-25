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
import { getHandlerForMimeType, FormatHandler } from './format-handlers';
import logger from '../logger';

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
}

/**
 * Result of a document load operation.
 */
export interface LoadResult<T> {
  /** The loaded document content */
  content: T;
  /** MIME type of the loaded document */
  mimeType: string;
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
   * Creates a new document loader instance.
   * 
   * @param inputPath Input path or URL to load.
   * @param options Configuration options for the loader.
   */
  constructor(inputPath: string, options: DocumentLoaderOptions = {}) {
    super();
    // Validate input path immediately
    this.validateFilePath(inputPath);
    
    this.inputPath = inputPath;
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
        ...options,
    };
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

  /**
   * Validates a file path to prevent directory traversal and other security issues.
   * 
   * @param filePath File path to validate.
   */
  private validateFilePath(filePath: string): void {
    if (typeof filePath !== 'string') {
        throw new Error('File path must be a string');
    }
    
    // Basic security check to prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
        throw new Error('File path cannot contain parent directory references');
    }
    
    // Additional security checks
    if (filePath.includes('\0')) {
        throw new Error('File path cannot contain null bytes');
    }
  }

  /**
   * Loads a document from a local file.
   * 
   * @param filePath Local file path to load.
   * @returns Loaded document content and MIME type.
   */
  private async loadFromFile(filePath: string): Promise<LoadResult<Buffer>> { 
    
    const expandedPath = this.expandTilde(filePath);
    const absolutePath = path.resolve(expandedPath);
    
    const mimeType = mime.lookup(absolutePath) || 'application/octet-stream';

    if (this.options.useCache) {
      const cachedPath = this.getCachePath(absolutePath);
      if (await this.isCacheValid(absolutePath, cachedPath)) {
        return { content: await fs.readFile(cachedPath), mimeType };
      }
    }

    const fileStats = await fs.stat(absolutePath);
    const totalSize = fileStats.size;
    let loadedSize = 0;

    const fileHandle = await fs.open(absolutePath, 'r');
    const chunks: Buffer[] = [];

    try {
      let bytesRead: number;
      const buffer = Buffer.alloc(this.options.chunkSize);

      do {
        const result = await fileHandle.read(buffer, 0, this.options.chunkSize, null);
        bytesRead = result.bytesRead;
        if (bytesRead > 0) {
          chunks.push(buffer.subarray(0, bytesRead));
          loadedSize += bytesRead;
          this.emit('progress', loadedSize / totalSize);
        }
      } while (bytesRead > 0);
    } finally {
      await fileHandle.close();
    }

    const content = Buffer.concat(chunks);

    if (this.options.useCache) {
      const cachedPath = this.getCachePath(absolutePath);
      await this.cacheContent(cachedPath, content);
    }

    return { content, mimeType };
  }

  /**
   * Loads a document from a URL.
   * 
   * @param url URL to load.
   * @returns Loaded document content and MIME type.
   */
  private async loadFromUrl(url: string): Promise<LoadResult<Buffer>> {
    if (this.options.useCache) {
      const cachedPath = this.getCachePath(url);
      if (await this.isCacheValid(url, cachedPath)) {
        const content = await fs.readFile(cachedPath);
        const mimeType = mime.lookup(url) || 'application/octet-stream';
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

        const response = await axios.get(url, axiosConfig);
        let content = Buffer.from(response.data);

        if (this.options.decompress && response.headers['content-encoding'] === 'gzip') {
          content = await gunzip(content);
        }

        const mimeType = response.headers['content-type'] || 'application/octet-stream';

        if (this.options.useCache) {
          const cachedPath = this.getCachePath(url);
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
      if (handler) {
        const text = await handler.handle(buffer);
        return { content: text, mimeType };
      } else {
        // Fallback to basic text conversion
        logger.warn(`No handler found for mime type ${mimeType}, falling back to basic text conversion`);
        return { 
          content: buffer.toString(this.options.encoding), 
          mimeType 
        };
      }
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
    const loader = new DocumentLoader(input, options);
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
    const loader = new DocumentLoader(input, options);
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
    const loaders = inputs.map((input) => new DocumentLoader(input, options));
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
    const loaders = inputs.map((input) => new DocumentLoader(input, options));
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
