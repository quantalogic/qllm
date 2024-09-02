// packages/qllm-lib/src/utils/document/document-loader.ts

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

const gunzip = promisify(zlib.gunzip);

export interface DocumentLoaderOptions {
  chunkSize?: number;
  encoding?: BufferEncoding;
  timeout?: number;
  headers?: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number;
  cacheDir?: string;
  proxy?: string; // Should be in the format "host:port"
  decompress?: boolean;
  useCache?: boolean;
}

export interface LoadResult<T> {
  content: T;
  mimeType: string;
}

export interface DocumentLoaderEvents {
  progress: (progress: number) => void;
  loaded: (result: LoadResult<Buffer>) => void;
  error: (error: Error) => void;
  retry: (attempt: number, maxRetries: number) => void;
}

export class DocumentLoader extends EventEmitter {
  private inputPath: string;
  private options: Required<DocumentLoaderOptions>;
  private cancelTokenSource: CancelTokenSource | null = null;

  constructor(inputPath: string, options: DocumentLoaderOptions = {}) {
    super();
    this.inputPath = inputPath;
    this.options = {
      chunkSize: 1024 * 1024, // 1MB default chunk size
      encoding: 'utf-8',
      timeout: 30000, // 30 seconds default timeout
      headers: {},
      maxRetries: 3,
      retryDelay: 1000,
      cacheDir: path.join(os.tmpdir(), 'document-loader-cache'),
      proxy: '',
      decompress: true,
      useCache: false,
      ...options
    };
  }

  private expandTilde(filePath: string): string {
    if (filePath.startsWith('~/') || filePath === '~') {
      return filePath.replace('~', os.homedir());
    }
    return filePath;
  }

  private isUrl(input: string): boolean {
    return input.startsWith('http://') || input.startsWith('https://');
  }

  private isFileUrl(input: string): boolean {
    return input.startsWith('file://');
  }

  private fileUrlToPath(fileUrl: string): string {
    const url = new URL(fileUrl);
    return decodeURIComponent(url.pathname);
  }

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
          proxy: this.options.proxy ? {
            host: this.options.proxy.split(':')[0],
            port: parseInt(this.options.proxy.split(':')[1], 10)
          } : undefined,
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
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
      }
    }
    throw new Error('Max retries reached');
  }

  private getCachePath(key: string): string {
    const hash = createHash('md5').update(key).digest('hex'); // Updated to use import
    return path.join(this.options.cacheDir, hash);
  }

  private async isCacheValid(original: string, cached: string): Promise<boolean> {
    try {
      const [originalStat, cachedStat] = await Promise.all([
        fs.stat(original),
        fs.stat(cached)
      ]);
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
    const { content, mimeType } = await this.loadAsBuffer();
    return { content: content.toString(this.options.encoding), mimeType };
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

  public static async quickLoadString(input: string, options?: DocumentLoaderOptions): Promise<LoadResult<string>> {
    const loader = new DocumentLoader(input, options);
    return loader.loadAsString();
  }

  public static async quickLoadBuffer(input: string, options?: DocumentLoaderOptions): Promise<LoadResult<Buffer>> {
    const loader = new DocumentLoader(input, options);
    return loader.loadAsBuffer();
  }

  public static async loadMultipleAsString(inputs: string[], options?: DocumentLoaderOptions): Promise<LoadResult<string>[]> {
    const loaders = inputs.map(input => new DocumentLoader(input, options));
    return Promise.all(loaders.map(loader => loader.loadAsString()));
  }

  public static async loadMultipleAsBuffer(inputs: string[], options?: DocumentLoaderOptions): Promise<LoadResult<Buffer>[]> {
    const loaders = inputs.map(input => new DocumentLoader(input, options));
    return Promise.all(loaders.map(loader => loader.loadAsBuffer()));
  }

  // Type-safe event emitter methods
  public on<K extends keyof DocumentLoaderEvents>(
    event: K,
    listener: DocumentLoaderEvents[K]
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