# Table of Contents
- src/index.ts
- src/utils/index.ts
- src/utils/error/index.ts
- src/utils/logger/index.ts
- src/utils/conversation/index.ts
- src/utils/conversation/conversation-util.ts
- src/utils/cloud/aws/credential.ts
- src/utils/cloud/aws/bedrock.ts
- src/utils/images/index.ts
- src/utils/images/image-to-base64.ts
- src/utils/document/document-loader.ts
- src/utils/document/document-inclusion-resolver.ts
- src/utils/functions/index.ts
- src/templates/template-loader.ts
- src/templates/template-definition-builder.ts
- src/templates/template-manager.ts
- src/templates/index.ts
- src/templates/output-variable-extractor.ts
- src/templates/types.ts
- src/templates/template-schema.ts
- src/templates/template-validator.ts
- src/templates/template-executor.ts
- src/templates/samples/prompt-sample.yaml
- src/templates/utils/extract-variable-from-content.ts
- src/templates/utils/__test__/extract-variable-from-content.test.ts
- src/conversation/conversation-reducer.ts
- src/conversation/index.ts
- src/conversation/conversation-manager.ts
- src/types/index.ts
- src/types/llm-types.ts
- src/types/conversations-types.ts
- src/types/llm-provider.ts
- src/providers/index.ts
- src/providers/qroq/index.ts
- src/providers/ollama/index.ts
- src/providers/ollama/list-models.ts
- src/providers/anthropic/index.ts
- src/providers/anthropic/constants.ts
- src/providers/anthropic/aws-credentials.ts
- src/providers/anthropic/message-util.ts
- src/providers/mistral/index.ts
- src/providers/openrouter/index.ts
- src/providers/perplexity/index.ts
- src/providers/perplexity/models.ts
- src/providers/openai/index.ts
- src/storage/sqlite-conversation-storage-provider.ts
- src/storage/index.ts
- src/storage/in-memory-storage-provider.ts
- prompts/create_story.yaml
- prompts/story.md
- package.json

## File: src/index.ts

- Extension: .ts
- Language: typescript
- Size: 2008 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// Core types
export type * from './types';

// Providers
export * from './providers';

// Utilities
export * from './utils';

// Conversation management
export * from './conversation';

// Template management
export * from './templates';

// Main classes and interfaces
import type { LLMProvider, EmbeddingProvider } from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';
import { GroqProvider } from './providers/qroq';
import { TemplateManager } from './templates/template-manager';
import { TemplateLoader } from './templates';

// Factory function for creating providers
export function createLLMProvider({
  name,
  apiKey,
  url,
}: {
  name: string;
  apiKey?: string;
  url?: string;
}): LLMProvider {
  switch (name.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider({ apiKey });
    case 'ollama':
      return new OllamaProvider(url);
    case 'groq':
      return new GroqProvider(apiKey);
    default:
      throw new Error(`Unsupported provider: ${name}`);
  }
}

export function createEmbeddingProvider({
  name,
  apiKey,
  url,
}: {
  name: string;
  apiKey?: string;
  url?: string;
}): EmbeddingProvider {
  switch (name.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider({ apiKey });
    case 'ollama':
      return new OllamaProvider(url);
    case 'groq':
      return new GroqProvider(apiKey);
    default:
      throw new Error(`Unsupported provider: ${name}`);
  }
}

// Export main classes and types
export type { LLMProvider, EmbeddingProvider };

export {
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
  GroqProvider,
  TemplateManager,
  TemplateLoader,
};

// Default export (if needed)
export default {
  createLLMProvider,
  createEmbeddingProvider,
  TemplateManager,
};

```

## File: src/utils/index.ts

- Extension: .ts
- Language: typescript
- Size: 81 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
export * from './images';
export * from './functions';
export * from './logger';

```

## File: src/utils/error/index.ts

- Extension: .ts
- Language: typescript
- Size: 2393 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { logger } from '../logger';

export class ErrorManager {
  /**
   * Throws a custom error with a specific error type and message.
   * @param errorType The type of error to throw
   * @param message The error message
   * @throws {Error} A custom error with the specified type and message
   */
  static throwError(errorType: string, message: string): never {
    logger.error(`${errorType}: ${message}`);
    throw new Error(`${errorType}: ${message}`);
  }

  /**
   * Throws an error of the specified class with the given message.
   *
   * @param ErrorClass - The class of the error to be thrown. It should be a constructor function that takes a message string.
   * @param message - The message to be included in the error.
   * @throws {Error} - Throws an instance of the specified ErrorClass with the provided message.
   */
  static throw(ErrorClass: new (message: string) => Error, message: string): never {
    // Log the error message with the class name
    logger.error(`${ErrorClass.name}: ${message}`);

    // Create an instance of the specified error class with the message
    const error = new ErrorClass(message);

    // Throw the created error
    throw error;
  }

  /*
   * Logs a warning message without throwing an error.
   * @param warningType The type of warning
   * @param message The warning message
   */
  static logWarning(warningType: string, message: string): void {
    logger.warn(`${warningType}: ${message}`);
  }

  /**
   * Handles an error by logging it and optionally rethrowing.
   * @param error The error to handle
   * @param rethrow Whether to rethrow the error after logging
   * @throws {Error} The original error if rethrow is true
   */
  static handleError(error: Error, rethrow: boolean = false): void {
    logger.error(`Unhandled error: ${error.message}`);
    logger.debug(error.stack || '');

    if (rethrow) {
      throw error;
    }
  }

  /**
   * Asserts a condition and throws an error if it's false.
   * @param condition The condition to assert
   * @param errorType The type of error to throw if the condition is false
   * @param message The error message to use if the condition is false
   * @throws {Error} A custom error if the condition is false
   */
  static assert(condition: boolean, errorType: string, message: string): void {
    if (!condition) {
      this.throwError(errorType, message);
    }
  }
}

```

## File: src/utils/logger/index.ts

- Extension: .ts
- Language: typescript
- Size: 2038 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = 'info') {
    this.logLevel = logLevel;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    if (levels[level] >= levels[this.logLevel]) {
      const timestamp = this.getTimestamp();
      const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      if (typeof window !== 'undefined') {
        // Browser environment
        switch (level) {
          case 'debug':
            console.debug(formattedMessage, ...args);
            break;
          case 'info':
            console.info(formattedMessage, ...args);
            break;
          case 'warn':
            console.warn(formattedMessage, ...args);
            break;
          case 'error':
            console.error(formattedMessage, ...args);
            break;
        }
      } else {
        // Node.js environment
        const colors: Record<LogLevel, string> = {
          debug: '\x1b[36m', // Cyan
          info: '\x1b[32m', // Green
          warn: '\x1b[33m', // Yellow
          error: '\x1b[31m', // Red
        };
        const resetColor = '\x1b[0m';
        console.log(`${colors[level]}${formattedMessage}${resetColor}`, ...args);
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export const logger = new Logger();

export default logger;

```

## File: src/utils/conversation/index.ts

- Extension: .ts
- Language: typescript
- Size: 37 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
export * from './conversation-util';

```

## File: src/utils/conversation/conversation-util.ts

- Extension: .ts
- Language: typescript
- Size: 5237 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// src/utils/conversation/conversation-utils.ts

import { v4 as uuidv4 } from 'uuid';
import {
  Conversation,
  ConversationId,
  ConversationMessage,
  ConversationMetadata,
  ProviderId,
  ChatMessage,
} from '../../types';

/**
 * Creates a new conversation with the given metadata and initial message.
 * @param metadata Initial metadata for the conversation
 * @param initialMessage Optional initial message for the conversation
 * @param providerId Optional provider ID for the initial message
 * @returns A new Conversation object
 */
export function createConversation(
  metadata: Partial<ConversationMetadata> = {},
  initialMessage?: string,
  providerId?: ProviderId,
): Conversation {
  const id = uuidv4();
  const now = new Date();
  const conversation: Conversation = {
    id,
    messages: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      title: metadata.title || `Conversation ${id}`,
      description: metadata.description || '',
      ...metadata,
    },
    activeProviders: new Set(providerId ? [providerId] : []),
  };

  if (initialMessage) {
    addMessageToConversation(conversation, initialMessage, 'user', providerId);
  }

  return conversation;
}

/**
 * Adds a new message to the conversation.
 * @param conversation The conversation to update
 * @param content The content of the message
 * @param role The role of the message sender (user or assistant)
 * @param providerId The ID of the provider associated with this message
 * @returns The updated Conversation object
 */
export function addMessageToConversation(
  conversation: Conversation,
  content: string,
  role: 'user' | 'assistant',
  providerId?: ProviderId,
): Conversation {
  const message: ConversationMessage = {
    id: uuidv4(),
    role,
    content: { type: 'text', text: content },
    timestamp: new Date(),
    providerId: providerId || '',
  };

  conversation.messages.push(message);
  conversation.metadata.updatedAt = new Date();

  if (providerId) {
    conversation.activeProviders.add(providerId);
  }

  return { ...conversation };
}

/**
 * Updates the metadata of a conversation.
 * @param conversation The conversation to update
 * @param metadata The new metadata to apply
 * @returns The updated Conversation object
 */
export function updateConversationMetadata(
  conversation: Conversation,
  metadata: Partial<ConversationMetadata>,
): Conversation {
  return {
    ...conversation,
    metadata: {
      ...conversation.metadata,
      ...metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Adds a provider to the conversation's active providers.
 * @param conversation The conversation to update
 * @param providerId The ID of the provider to add
 * @returns The updated Conversation object
 */
export function addProviderToConversation(
  conversation: Conversation,
  providerId: ProviderId,
): Conversation {
  const updatedProviders = new Set(conversation.activeProviders);
  updatedProviders.add(providerId);

  return {
    ...conversation,
    activeProviders: updatedProviders,
    metadata: {
      ...conversation.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Removes a provider from the conversation's active providers.
 * @param conversation The conversation to update
 * @param providerId The ID of the provider to remove
 * @returns The updated Conversation object
 */
export function removeProviderFromConversation(
  conversation: Conversation,
  providerId: ProviderId,
): Conversation {
  const updatedProviders = new Set(conversation.activeProviders);
  updatedProviders.delete(providerId);

  return {
    ...conversation,
    activeProviders: updatedProviders,
    metadata: {
      ...conversation.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Converts a ConversationMessage to a ChatMessage.
 * @param message The ConversationMessage to convert
 * @returns A ChatMessage object
 */
export function conversationMessageToChatMessage(message: ConversationMessage): ChatMessage {
  return {
    role: message.role,
    content: message.content,
  };
}

/**
 * Extracts ChatMessages from a Conversation.
 * @param conversation The conversation to extract messages from
 * @returns An array of ChatMessage objects
 */
export function extractChatMessages(conversation: Conversation): ChatMessage[] {
  return conversation.messages.map(conversationMessageToChatMessage);
}

/**
 * Finds a conversation by its ID in an array of conversations.
 * @param conversations An array of Conversation objects
 * @param id The ID of the conversation to find
 * @returns The found Conversation object or undefined if not found
 */
export function findConversationById(
  conversations: Conversation[],
  id: ConversationId,
): Conversation | undefined {
  return conversations.find((conv) => conv.id === id);
}

/**
 * Sorts conversations by their last update time, most recent first.
 * @param conversations An array of Conversation objects to sort
 * @returns A new sorted array of Conversation objects
 */
export function sortConversationsByLastUpdate(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (a, b) => new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime(),
  );
}

```

## File: src/utils/cloud/aws/credential.ts

- Extension: .ts
- Language: typescript
- Size: 2948 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { STSClient, GetSessionTokenCommand } from '@aws-sdk/client-sts';

interface CachedCredentials extends AwsCredentialIdentity {
  expiration: Date;
}

let cachedCredentials: CachedCredentials | null = null;
const EXPIRATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Retrieves temporary AWS credentials using STS.
 * @param {string} awsRegion - The AWS region to use.
 * @returns {Promise<AwsCredentialIdentity>} - A promise that resolves to the temporary AWS credentials.
 * @throws Will throw an error if there is an issue retrieving the credentials.
 */
export async function getCredentials(awsRegion: string): Promise<AwsCredentialIdentity> {
  if (cachedCredentials && isCredentialValid(cachedCredentials)) {
    return cachedCredentials;
  }

  try {
    const baseCredentials = await fromNodeProviderChain()();
    const stsClient = new STSClient({ credentials: baseCredentials, region: awsRegion });
    const command = new GetSessionTokenCommand({});
    const response = await stsClient.send(command);

    if (!response.Credentials) {
      throw new Error('Failed to obtain temporary credentials from STS.');
    }

    const { AccessKeyId, SecretAccessKey, SessionToken, Expiration } = response.Credentials;

    if (!AccessKeyId || !SecretAccessKey || !SessionToken || !Expiration) {
      throw new Error('Incomplete credentials received from STS.');
    }

    cachedCredentials = {
      accessKeyId: AccessKeyId,
      secretAccessKey: SecretAccessKey,
      sessionToken: SessionToken,
      expiration: Expiration,
    };

    return cachedCredentials;
  } catch (error) {
    console.error('Error getting credentials:', error);
    throw new Error(`Failed to retrieve AWS credentials: ${(error as Error).message}`);
  }
}

/**
 * Checks if the given credentials are still valid.
 * @param {CachedCredentials} credentials - The credentials to check.
 * @returns {boolean} - True if the credentials are still valid, false otherwise.
 */
function isCredentialValid(credentials: CachedCredentials): boolean {
  const now = new Date();
  return credentials.expiration.getTime() - now.getTime() > EXPIRATION_THRESHOLD_MS;
}

/**
 * Refreshes the AWS credentials if they are expired or close to expiration.
 * @param {string} awsRegion - The AWS region to use.
 * @returns {Promise<AwsCredentialIdentity>} - A promise that resolves to the refreshed AWS credentials.
 */
export async function refreshCredentialsIfNeeded(
  awsRegion: string,
): Promise<AwsCredentialIdentity> {
  if (!cachedCredentials || !isCredentialValid(cachedCredentials)) {
    return getCredentials(awsRegion);
  }
  return cachedCredentials;
}

/**
 * Clears the cached credentials, forcing a new credential retrieval on the next call.
 */
export function clearCachedCredentials(): void {
  cachedCredentials = null;
}

```

## File: src/utils/cloud/aws/bedrock.ts

- Extension: .ts
- Language: typescript
- Size: 1032 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { AwsCredentialIdentity } from '@aws-sdk/types';

interface Model {
  id: string;
  name: string;
  description: string;
}

export async function listModels(
  credentials: AwsCredentialIdentity,
  region: string = 'us-east-1',
): Promise<Model[]> {
  const client = new BedrockClient({
    credentials,
    region,
  });

  try {
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);

    const models: Model[] =
      response.modelSummaries?.map((summary) => ({
        id: summary.modelId || '',
        name: summary.modelName || '',
        description: `${summary.modelName || ''} - Input: ${summary.inputModalities?.join(', ') || 'N/A'}, Output: ${summary.outputModalities?.join(', ') || 'N/A'}`,
      })) || [];

    return models;
  } catch (error) {
    console.error('Error listing foundation models:', error);
    throw new Error('Failed to list foundation models');
  }
}

```

## File: src/utils/images/index.ts

- Extension: .ts
- Language: typescript
- Size: 418 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { ChatMessageContent, ImageUrlContent } from '../../types';
import { imageToBase64 } from './image-to-base64';
export { imageToBase64 } from './image-to-base64';

export const createTextMessageContent = (content: string | string[]): ChatMessageContent => {
  if (Array.isArray(content)) {
    return content.map((text) => ({ type: 'text', text }));
  } else {
    return { type: 'text', text: content };
  }
};

```

## File: src/utils/images/image-to-base64.ts

- Extension: .ts
- Language: typescript
- Size: 2780 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { lookup } from 'mime-types';

export type ImageToBase64Output = {
  base64: string;
  mimeType: string;
};

/**
 * Expands the tilde (~) in a file path to the user's home directory.
 * @param filePath The file path to expand.
 * @returns The expanded file path.
 */
function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Converts an image to a base64-encoded string or returns the input if it's already base64-encoded.
 * @param source The URL, file path, or base64-encoded string of the image.
 * @returns A Promise that resolves to the base64-encoded string of the image.
 */
export async function imageToBase64(source: string): Promise<ImageToBase64Output> {
  // Check if the input is already a base64-encoded string
  if (source.startsWith('data:') && source.includes(';base64,')) {
    const [mimeType, base64] = source.split(';base64,');
    return { base64, mimeType: mimeType.split(':')[1] };
  }

  let buffer: Buffer;
  let mimeType: string;

  if (source.startsWith('http://') || source.startsWith('https://')) {
    // Handle URL
    const response = await axios.get(source, { responseType: 'arraybuffer' });
    buffer = Buffer.from(response.data);
    mimeType = response.headers['content-type'] as string;
  } else {
    // Handle local file path
    // Expand ~ to home directory and resolve relative paths
    source = path.resolve(expandTilde(source));

    // Handle file:// protocol
    if (source.startsWith('file://')) {
      source = source.slice(7);
    }

    buffer = await fs.readFile(source);
    const lookupResult = lookup(source);
    if (!lookupResult) {
      throw new Error(`Could not determine MIME type for: ${source}`);
    }
    mimeType = lookupResult;
  }

  const base64 = buffer.toString('base64');
  return { base64, mimeType };
}

export function createBase64Url(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Extracts the MIME type from a base64-encoded data URL string.
 * @param dataUrl The base64-encoded data URL string.
 * @returns The extracted MIME type, or null if the input is not a valid data URL.
 */
export function extractMimeType(dataUrl: string): string | null {
  // Check if the input is a valid data URL
  if (!dataUrl.startsWith('data:') || !dataUrl.includes(';base64,')) {
    return null;
  }

  // Extract the MIME type
  const mimeType = dataUrl.split(';')[0].split(':')[1];

  // Return the MIME type if it's not empty, otherwise return null
  return mimeType && mimeType.trim() !== '' ? mimeType : null;
}

```

## File: src/utils/document/document-loader.ts

- Extension: .ts
- Language: typescript
- Size: 9007 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
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
      ...options,
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

  private getCachePath(key: string): string {
    const hash = createHash('md5').update(key).digest('hex'); // Updated to use import
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

  public static async quickLoadString(
    input: string,
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<string>> {
    const loader = new DocumentLoader(input, options);
    return loader.loadAsString();
  }

  public static async quickLoadBuffer(
    input: string,
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<Buffer>> {
    const loader = new DocumentLoader(input, options);
    return loader.loadAsBuffer();
  }

  public static async loadMultipleAsString(
    inputs: string[],
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<string>[]> {
    const loaders = inputs.map((input) => new DocumentLoader(input, options));
    return Promise.all(loaders.map((loader) => loader.loadAsString()));
  }

  public static async loadMultipleAsBuffer(
    inputs: string[],
    options?: DocumentLoaderOptions,
  ): Promise<LoadResult<Buffer>[]> {
    const loaders = inputs.map((input) => new DocumentLoader(input, options));
    return Promise.all(loaders.map((loader) => loader.loadAsBuffer()));
  }

  // Type-safe event emitter methods
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

```

## File: src/utils/document/document-inclusion-resolver.ts

- Extension: .ts
- Language: typescript
- Size: 3036 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// content-loader.ts
import * as path from 'path';
import { URL } from 'url';
import { DocumentLoader } from './document-loader';

const includeRegex = /(?<!\\){{\s*include:\s*([^}\s]+)\s*}}/g;

type LoadedPaths = Set<string>;

export async function loadContent(
  inputPath: string,
  basePath: string,
  loadedPaths: LoadedPaths = new Set(),
): Promise<{ content: string; mimeType: string }> {
  const fullPath = resolveFullPath(inputPath, basePath);
  if (loadedPaths.has(fullPath)) {
    throw new Error(`Circular dependency detected: ${fullPath}`);
  }
  loadedPaths.add(fullPath);

  const loader = new DocumentLoader(fullPath);
  const result = await loader.loadAsString();
  if (!result?.content) {
    throw new Error(`Failed to load content for path: ${fullPath}`);
  }
  return result;
}

export function findIncludeStatements(content: string): Array<string> {
  const includeStatements = content.match(includeRegex) || [];
  return includeStatements;
}

export async function resolveIncludedContent(
  content: string,
  basePath: string,
  loadedPaths: LoadedPaths = new Set(),
  contentTransformBeforeInclude?: (contentLoaded: string, path: string) => string | Promise<string>,
): Promise<string> {
  content = contentTransformBeforeInclude
    ? await contentTransformBeforeInclude(content, basePath)
    : content;

  let resolvedContent = content;

  const matches = Array.from(content.matchAll(includeRegex));
  for (const match of matches) {
    const [fullMatch, includePath] = match;
    try {
      const trimmedIncludePath = includePath.trim(); // Trim spaces around the filename
      const fullPath = resolveFullPath(trimmedIncludePath, basePath);
      const { content: includedContent } = await loadContent(fullPath, basePath, loadedPaths);
      const recursivelyResolvedContent = await resolveIncludedContent(
        includedContent,
        fullPath,
        loadedPaths,
      );
      resolvedContent = resolvedContent.replace(fullMatch, recursivelyResolvedContent);
    } catch (error) {
      console.warn(
        `Failed to resolve included content: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Remove escape characters and replace escaped include directives
  resolvedContent = resolvedContent.replace(/\\{{include:/g, '{{include:');

  return resolvedContent;
}

function resolveFullPath(inputPath: string, basePath: string): string {
  if (isUrl(basePath)) return new URL(inputPath, basePath).toString();
  if (isUrl(inputPath)) return inputPath;
  if (isFileUrl(inputPath)) return path.resolve(path.dirname(basePath), fileUrlToPath(inputPath));
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(path.dirname(basePath), inputPath);
}

function isUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://');
}

function isFileUrl(input: string): boolean {
  return input.startsWith('file://');
}

function fileUrlToPath(fileUrl: string): string {
  return decodeURIComponent(new URL(fileUrl).pathname);
}

```

## File: src/utils/functions/index.ts

- Extension: .ts
- Language: typescript
- Size: 2800 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { z } from 'zod';
import { FunctionTool } from '../../types';

type JsonSchemaType = {
  type?: string;
  description?: string;
  properties?: Record<string, JsonSchemaType>;
  required?: string[];
  items?: JsonSchemaType;
  enum?: string[];
  anyOf?: JsonSchemaType[];
};

function zodToJsonSchema(schema: z.ZodTypeAny): JsonSchemaType {
  if (schema instanceof z.ZodObject) {
    const properties: Record<string, JsonSchemaType> = {};
    const required: string[] = [];

    Object.entries(schema.shape).forEach(([key, value]) => {
      properties[key] = zodToJsonSchema(value as z.ZodTypeAny);
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    });

    const result: JsonSchemaType = {
      type: 'object',
      properties,
    };

    if (schema.description) result.description = schema.description;
    if (required.length > 0) result.required = required;

    return result;
  }

  if (schema instanceof z.ZodString) {
    const result: JsonSchemaType = { type: 'string' };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodNumber) {
    const result: JsonSchemaType = { type: 'number' };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodBoolean) {
    const result: JsonSchemaType = { type: 'boolean' };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodArray) {
    const result: JsonSchemaType = {
      type: 'array',
      items: zodToJsonSchema(schema.element),
    };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodEnum) {
    const result: JsonSchemaType = {
      type: 'string',
      enum: schema.options as string[],
    };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodUnion) {
    return {
      anyOf: schema.options.map(zodToJsonSchema),
    };
  }

  if (schema instanceof z.ZodOptional) {
    const innerSchema = zodToJsonSchema(schema.unwrap());
    if (schema.description) innerSchema.description = schema.description;
    return innerSchema;
  }

  return {}; // fallback for unsupported types
}

export type FunctionToolConfig = {
  name: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  strict?: boolean;
};

export function createFunctionToolFromZod(config: FunctionToolConfig): FunctionTool {
  const { name, description, schema, strict } = config;
  const jsonSchema = zodToJsonSchema(schema);
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: jsonSchema,
    },
    strict,
  };
}

```

## File: src/templates/template-loader.ts

- Extension: .ts
- Language: typescript
- Size: 1380 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// template-loader.ts
import { TemplateDefinitionWithResolvedContent } from './template-schema';
import { TemplateDefinitionBuilder } from './template-definition-builder';
import { loadContent, resolveIncludedContent } from '../utils/document/document-inclusion-resolver';

export class TemplateLoader {
  static async load(inputFilePath: string): Promise<TemplateDefinitionWithResolvedContent> {
    const content = await loadContent(inputFilePath, inputFilePath);
    const builder = getBuilder(content);
    const template = builder.build();
    const resolvedContent = await resolveIncludedContent(template.content, inputFilePath);

    return { ...template, content: resolvedContent };
  }

  static async loadAsBuilder(inputFilePath: string): Promise<TemplateDefinitionBuilder> {
    const content = await loadContent(inputFilePath, inputFilePath);
    const builder = getBuilder(content);
    const resolvedContent = await resolveIncludedContent(builder.build().content, inputFilePath);

    return builder.setResolvedContent(resolvedContent);
  }
}

function getBuilder(content: { mimeType: string; content: string }): TemplateDefinitionBuilder {
  const { mimeType, content: contentString } = content;
  if (mimeType === 'application/json') {
    return TemplateDefinitionBuilder.fromJSON(contentString);
  }
  return TemplateDefinitionBuilder.fromYAML(contentString);
}

```

## File: src/templates/template-definition-builder.ts

- Extension: .ts
- Language: typescript
- Size: 12824 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// packages/qllm-lib/src/templates/template-definition-builder.ts

import * as z from 'zod';
import yaml from 'js-yaml';
import {
  templateDefinitionSchema,
  templateVariableSchema,
  outputVariableSchema,
  TemplateDefinition,
  TemplateVariable,
  OutputVariable,
  TemplateDefinitionWithResolvedContent,
} from './template-schema';

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_PROVIDER = 'openai';

export class TemplateDefinitionBuilder {
  private definition: Partial<TemplateDefinitionWithResolvedContent>;

  private constructor(definition: Partial<TemplateDefinition>) {
    this.definition = definition;
  }

  static fromTemplate(template: TemplateDefinition): TemplateDefinitionBuilder {
    return new TemplateDefinitionBuilder(template);
  }
  static create({
    name,
    version,
    description,
    author,
    content,
  }: {
    name: string;
    version: string;
    description: string;
    author: string;
    content: string;
  }): TemplateDefinitionBuilder {
    return new TemplateDefinitionBuilder({
      name,
      version,
      description,
      author,
      content,
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
      prompt_type: 'text_generation',
      parameters: {
        max_tokens: 100,
        temperature: 0.7,
      },
    });
  }

  static quickSetup(name: string, content: string): TemplateDefinitionBuilder {
    return TemplateDefinitionBuilder.create({
      name: name,
      version: '1.0.0',
      description: `Template for ${name}`,
      author: 'AI Assistant',
      content: content,
    });
  }

  withPrompt(prompt: string): this {
    this.definition.content = prompt;
    return this;
  }

  setResolvedContent(content: string): this {
    this.definition.resolved_content = content;
    return this;
  }

  clone(): TemplateDefinitionBuilder {
    return new TemplateDefinitionBuilder(JSON.parse(JSON.stringify(this.definition)));
  }

  private createTemplateVariable(
    type: TemplateVariable['type'],
    description: string,
    options: Partial<Omit<TemplateVariable, 'type' | 'description'>> = {},
  ): TemplateVariable {
    return templateVariableSchema.parse({ type, description, ...options });
  }

  private createOutputVariable(
    type: OutputVariable['type'],
    options: Partial<Omit<OutputVariable, 'type'>> = {},
  ): OutputVariable {
    return outputVariableSchema.parse({ type, ...options });
  }

  withProvider(provider: string): this {
    this.definition.provider = provider;
    return this;
  }

  withoutProvider(): this {
    delete this.definition.provider;
    return this;
  }

  withTags(...tags: string[]): this {
    this.definition.tags = [...(this.definition.tags || []), ...tags];
    return this;
  }

  withoutTags(...tags: string[]): this {
    if (this.definition.tags) {
      this.definition.tags = this.definition.tags.filter((t) => !tags.includes(t));
      if (this.definition.tags.length === 0) delete this.definition.tags;
    }
    return this;
  }

  withCategories(...categories: string[]): this {
    this.definition.categories = [...(this.definition.categories || []), ...categories];
    return this;
  }

  withoutCategories(...categories: string[]): this {
    if (this.definition.categories) {
      this.definition.categories = this.definition.categories.filter(
        (c) => !categories.includes(c),
      );
      if (this.definition.categories.length === 0) delete this.definition.categories;
    }
    return this;
  }

  withModel(model: string): this {
    this.definition.model = model;
    return this;
  }

  withoutModel(): this {
    delete this.definition.model;
    return this;
  }

  withInputVariable(name: string, variable: TemplateVariable): this;
  withInputVariable(
    name: string,
    type: TemplateVariable['type'],
    description: string,
    options?: Partial<Omit<TemplateVariable, 'type' | 'description'>>,
  ): this;
  withInputVariable(
    name: string,
    typeOrVariable: TemplateVariable['type'] | TemplateVariable,
    description?: string,
    options: Partial<Omit<TemplateVariable, 'type' | 'description'>> = {},
  ): this {
    if (typeof typeOrVariable === 'object') {
      if (!this.definition.input_variables) this.definition.input_variables = {};
      this.definition.input_variables[name] = typeOrVariable;
    } else {
      if (!description) throw new Error('Description is required when type is provided');
      const variable = this.createTemplateVariable(typeOrVariable, description, options);
      if (!this.definition.input_variables) this.definition.input_variables = {};
      this.definition.input_variables[name] = variable;
    }
    return this;
  }

  withoutInputVariable(name: string): this {
    if (this.definition.input_variables) {
      delete this.definition.input_variables[name];
      if (Object.keys(this.definition.input_variables).length === 0) {
        delete this.definition.input_variables;
      }
    }
    return this;
  }

  withOutputVariable(name: string, variable: OutputVariable): this;
  withOutputVariable(
    name: string,
    type: OutputVariable['type'],
    options?: Partial<Omit<OutputVariable, 'type'>>,
  ): this;
  withOutputVariable(
    name: string,
    typeOrVariable: OutputVariable['type'] | OutputVariable,
    options: Partial<Omit<OutputVariable, 'type'>> = {},
  ): this {
    if (typeof typeOrVariable === 'object') {
      if (!this.definition.output_variables) this.definition.output_variables = {};
      this.definition.output_variables[name] = typeOrVariable;
    } else {
      const variable = this.createOutputVariable(typeOrVariable, options);
      if (!this.definition.output_variables) this.definition.output_variables = {};
      this.definition.output_variables[name] = variable;
    }
    return this;
  }

  withoutOutputVariable(name: string): this {
    if (this.definition.output_variables) {
      delete this.definition.output_variables[name];
      if (Object.keys(this.definition.output_variables).length === 0) {
        delete this.definition.output_variables;
      }
    }
    return this;
  }

  withParameters(parameters: TemplateDefinition['parameters']): this {
    this.definition.parameters = {
      ...this.definition.parameters,
      ...parameters,
    };
    return this;
  }

  withSeed(seed: number): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.seed = seed;
    return this;
  }

  withSystemMessage(systemMessage: string): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.system_message = systemMessage;
    return this;
  }

  withFrequencyPenalty(frequencyPenalty: number): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.frequency_penalty = frequencyPenalty;
    return this;
  }

  withPresencePenalty(presencePenalty: number): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.presence_penalty = presencePenalty;
    return this;
  }

  withLogitBias(logitBias: Record<string, number>): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.logit_bias = logitBias;
    return this;
  }

  withLogprobs(logprobs: number): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.logprobs = logprobs;
    return this;
  }

  withStopSequences(...stopSequences: string[]): this {
    if (!this.definition.parameters) this.definition.parameters = {};
    this.definition.parameters.stop_sequences = stopSequences;
    return this;
  }

  withoutParameters(): this {
    delete this.definition.parameters;
    return this;
  }

  withPromptType(promptType: TemplateDefinition['prompt_type']): this {
    this.definition.prompt_type = promptType;
    return this;
  }

  withoutPromptType(): this {
    delete this.definition.prompt_type;
    return this;
  }

  withTaskDescription(taskDescription: string): this {
    this.definition.task_description = taskDescription;
    return this;
  }

  withoutTaskDescription(): this {
    delete this.definition.task_description;
    return this;
  }

  withExampleOutputs(...exampleOutputs: string[]): this {
    this.definition.example_outputs = [
      ...(this.definition.example_outputs || []),
      ...exampleOutputs,
    ];
    return this;
  }

  withoutExampleOutputs(...outputs: string[]): this {
    if (this.definition.example_outputs) {
      this.definition.example_outputs = this.definition.example_outputs.filter(
        (o) => !outputs.includes(o),
      );
      if (this.definition.example_outputs.length === 0) delete this.definition.example_outputs;
    }
    return this;
  }

  withCustomInputValidator(name: string, validator: (value: any) => boolean): this {
    if (this.definition.input_variables && this.definition.input_variables[name]) {
      this.definition.input_variables[name] = {
        ...this.definition.input_variables[name],
        customValidator: validator,
      };
    }
    return this;
  }

  withConditional(condition: string, trueContent: string, falseContent: string): this {
    this.definition.content =
      (this.definition.content || '') +
      `{{#if ${condition}}}${trueContent}{{else}}${falseContent}{{/if}}`;
    return this;
  }

  merge(other: TemplateDefinitionBuilder): this {
    this.definition = {
      ...this.definition,
      ...other.definition,
      input_variables: {
        ...(this.definition.input_variables || {}),
        ...(other.definition.input_variables || {}),
      },
      output_variables: {
        ...(this.definition.output_variables || {}),
        ...(other.definition.output_variables || {}),
      },
      tags: [...new Set([...(this.definition.tags || []), ...(other.definition.tags || [])])],
      categories: [
        ...new Set([...(this.definition.categories || []), ...(other.definition.categories || [])]),
      ],
    };
    return this;
  }

  validate(): string[] {
    const errors: string[] = [];
    try {
      templateDefinitionSchema.parse(this.definition);

      // Additional custom validation
      if (this.definition.input_variables) {
        for (const [name, variable] of Object.entries(this.definition.input_variables)) {
          if (variable.customValidator && variable.default !== undefined) {
            if (!variable.customValidator(variable.default)) {
              errors.push(`Custom validation failed for input variable '${name}'`);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map((e) => e.message));
      }
    }
    return errors;
  }

  generatePrompt(inputs: Record<string, any>): string {
    let content = this.definition.content || '';
    for (const [key, value] of Object.entries(inputs)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(value));
    }
    return content;
  }

  toJSON(): string {
    return JSON.stringify(this.definition, null, 2);
  }

  toYAML(): string {
    return yaml.dump(this.definition, {
      skipInvalid: true,
      noRefs: true,
      noCompatMode: true,
      lineWidth: -1, // Don't wrap long lines
    });
  }

  static fromJSON(json: string): TemplateDefinitionBuilder {
    const parsed = JSON.parse(json);
    return new TemplateDefinitionBuilder(parsed);
  }

  static fromYAML(yamlString: string): TemplateDefinitionBuilder {
    const parsed = yaml.load(yamlString) as Partial<TemplateDefinition>;
    return new TemplateDefinitionBuilder(parsed);
  }

  build(): TemplateDefinition {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`Template validation failed: ${errors.join(', ')}`);
    }
    return templateDefinitionSchema.parse(this.definition);
  }
}

// Convenience methods
export function createTemplateVariable(
  type: TemplateVariable['type'],
  description: string,
  options: Partial<Omit<TemplateVariable, 'type' | 'description'>> = {},
): TemplateVariable {
  return templateVariableSchema.parse({ type, description, ...options });
}

export function createOutputVariable(
  type: OutputVariable['type'],
  options: Partial<Omit<OutputVariable, 'type'>> = {},
): OutputVariable {
  return outputVariableSchema.parse({ type, ...options });
}

// Add this function at the end of the file
export function generatePromptFromTemplate(
  template: TemplateDefinition,
  inputs: Record<string, any>,
): string {
  let content = template.content || '';
  for (const [key, value] of Object.entries(inputs)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, String(value));
  }
  return content;
}

```

## File: src/templates/template-manager.ts

- Extension: .ts
- Language: typescript
- Size: 5209 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// src/templates/template_manager.ts

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error';
import { TemplateDefinition, TemplateDefinitionBuilder, TemplateManagerError } from './types';
import { TemplateLoader } from './template-loader';

export interface TemplateManagerConfig {
  promptDirectory: string;
}

export class TemplateManager {
  private templateDir: string;
  private fileCache: Map<string, string> = new Map();

  constructor(config: TemplateManagerConfig) {
    this.templateDir = config.promptDirectory;
  }

  async init(): Promise<void> {
    await this.ensureTemplateDirectory();
  }

  async listTemplates(): Promise<string[]> {
    return this.getYamlFilesInDirectory();
  }

  async getTemplate(name: string): Promise<TemplateDefinition | null> {
    const filePath = this.getFilePath(name);
    try {
      return await TemplateLoader.load(filePath);
    } catch (error) {
      this.handleTemplateReadError(error, name);
      return null;
    }
  }

  async saveTemplate(template: TemplateDefinition): Promise<void> {
    const templateBuilder = TemplateDefinitionBuilder.fromTemplate(template);
    const filePath = this.getFilePath(template.name);
    try {
      const content = templateBuilder.toYAML();
      await fs.writeFile(filePath, content, 'utf-8');
      logger.info(`Saved template ${template.name} to ${filePath}`);
    } catch (error) {
      this.handleTemplateSaveError(error, template.name);
    }
  }

  async deleteTemplate(name: string): Promise<void> {
    const filePath = this.getFilePath(name);
    try {
      await fs.unlink(filePath);
      logger.info(`Deleted template ${name} from ${filePath}`);
    } catch (error) {
      this.handleTemplateDeleteError(error, name);
    }
  }

  async updateTemplate(name: string, updatedTemplate: Partial<TemplateDefinition>): Promise<void> {
    const existingTemplate = await this.getTemplate(name);
    if (!existingTemplate) {
      ErrorManager.throw(TemplateManagerError, `Template ${name} not found`);
    }
    const mergedTemplate: TemplateDefinition = {
      ...existingTemplate,
      ...updatedTemplate,
    };

    await this.saveTemplate(mergedTemplate);
  }

  async templateExists(name: string): Promise<boolean> {
    const filePath = this.getFilePath(name);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async setPromptDirectory(directory: string): Promise<void> {
    try {
      const expandedDir = path.resolve(directory);
      await this.validateDirectory(expandedDir);
      this.templateDir = expandedDir;
      logger.info(`Prompt directory set to: ${expandedDir}`);
    } catch (error) {
      ErrorManager.throw(TemplateManagerError, `Failed to set prompt directory: ${error}`);
    }
  }

  // Private helper methods

  private async ensureTemplateDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.templateDir, { recursive: true });
      logger.debug(`Ensured template directory exists: ${this.templateDir}`);
    } catch (error) {
      logger.error(`Failed to initialize template directory: ${error}`);
      ErrorManager.throw(TemplateManagerError, `Failed to initialize template directory: ${error}`);
    }
  }

  private async getYamlFilesInDirectory(): Promise<string[]> {
    try {
      logger.debug(`Scanning directory: ${this.templateDir}`);
      const files = await fs.readdir(this.templateDir);
      const yamlFiles = files.filter((file) => file.endsWith('.yaml'));
      logger.debug(`Found ${yamlFiles.length} YAML files in ${this.templateDir}`);
      return yamlFiles.map((file) => path.basename(file, '.yaml'));
    } catch (error) {
      logger.error(`Failed to read directory ${this.templateDir}: ${error}`);
      return [];
    }
  }

  private getFilePath(name: string): string {
    return path.join(this.templateDir, `${name}.yaml`);
  }

  private async readFile(filePath: string): Promise<string> {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }
    const content = await fs.readFile(filePath, 'utf-8');
    this.fileCache.set(filePath, content);
    return content;
  }

  private handleTemplateReadError(error: any, name: string): void {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(`Failed to read template ${name}: ${error}`);
    }
  }

  private handleTemplateSaveError(error: any, name: string): void {
    logger.error(`Failed to save template ${name}: ${error}`);
    ErrorManager.throw(TemplateManagerError, `Failed to save template ${name}: ${error}`);
  }

  private handleTemplateDeleteError(error: any, name: string): void {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(`Failed to delete template ${name}: ${error}`);
      ErrorManager.throw(TemplateManagerError, `Failed to delete template ${name}: ${error}`);
    }
  }

  private async validateDirectory(dir: string): Promise<void> {
    const stats = await fs.stat(dir);
    if (!stats.isDirectory()) {
      ErrorManager.throw(TemplateManagerError, 'Specified path is not a directory');
    }
  }
}

```

## File: src/templates/index.ts

- Extension: .ts
- Language: typescript
- Size: 178 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
export * from './output-variable-extractor';
export * from './template-manager';
export * from './template-executor';
export * from './template-loader';
export * from './types';

```

## File: src/templates/output-variable-extractor.ts

- Extension: .ts
- Language: typescript
- Size: 3399 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { ErrorManager } from '../utils/error';
import { TemplateDefinition, OutputVariable } from './types';

export class OutputVariableExtractor {
  static extractVariables(template: TemplateDefinition, output: string): Record<string, any> {
    const extractor = new OutputVariableExtractor(template);
    return extractor.extractVariables(output);
  }

  private constructor(private template: TemplateDefinition) {}

  extractVariables(output: string): Record<string, any> {
    const result: Record<string, any> = {};
    const outputVariables = this.template.output_variables || {};

    for (const [key, variable] of Object.entries(outputVariables)) {
      // logger.debug(`Extracting output variable: ${key}`);
      const value = this.extractVariable(key, variable, output);
      // logger.debug(`Extracted value for ${key}: ${value}`);
      result[key] = this.validateAndTransform(key, variable, value);
    }

    return result;
  }

  private extractVariable(key: string, _variable: OutputVariable, output: string): string | null {
    const regex = new RegExp(`<${key}>(.+?)</${key}>`, 's');
    const match = output.match(regex);
    return match ? match[1].trim() : null;
  }

  private validateAndTransform(key: string, variable: OutputVariable, value: string | null): any {
    if (value === null) {
      if ('default' in variable) {
        return variable.default;
      }
      ErrorManager.throwError('OutputValidationError', `Missing required output variable: ${key}`);
    }

    switch (variable.type) {
      case 'string':
        return value;
      case 'integer':
        return this.parseInteger(key, value);
      case 'float':
        return this.parseFloat(key, value);
      case 'boolean':
        return this.parseBoolean(key, value);
      case 'array':
        return this.parseArray(key, value);
      case 'object':
        return this.parseObject(key, value);
      default:
        ErrorManager.throwError(
          'OutputValidationError',
          `Invalid type for output variable ${key}: ${variable.type}`,
        );
    }
  }

  private parseInteger(key: string, value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      ErrorManager.throwError(
        'OutputValidationError',
        `Invalid integer value for ${key}: ${value}`,
      );
    }
    return parsed;
  }

  private parseFloat(key: string, value: string): number {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      ErrorManager.throwError('OutputValidationError', `Invalid float value for ${key}: ${value}`);
    }
    return parsed;
  }

  private parseBoolean(key: string, value: string): boolean {
    const lowercaseValue = value.toLowerCase();
    if (lowercaseValue === 'true') return true;
    if (lowercaseValue === 'false') return false;
    ErrorManager.throwError('OutputValidationError', `Invalid boolean value for ${key}: ${value}`);
  }

  private parseArray(key: string, value: string): any[] {
    try {
      return JSON.parse(value);
    } catch (error) {
      ErrorManager.throwError('OutputValidationError', `Invalid array value for ${key}: ${value}`);
    }
  }

  private parseObject(key: string, value: string): object {
    try {
      return JSON.parse(value);
    } catch (error) {
      ErrorManager.throwError('OutputValidationError', `Invalid object value for ${key}: ${value}`);
    }
  }
}

```

## File: src/templates/types.ts

- Extension: .ts
- Language: typescript
- Size: 3116 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// packages/qllm-lib/src/templates/types.ts

import { LLMOptions, LLMProvider } from '../types';
import { TemplateDefinition } from './template-schema';

export * from './template-schema';
export * from './template-definition-builder';

// ==============================
// Execution Context Interface
// ==============================
export interface ExecutionContext {
  template: TemplateDefinition;
  variables?: Record<string, any>;
  providerOptions?: Partial<LLMOptions>;
  provider?: LLMProvider;
  stream?: boolean;
  onPromptForMissingVariables?: (
    template: TemplateDefinition,
    initialVariables: Record<string, any>,
  ) => Promise<Record<string, any>>;
}

// ==============================
// Error Classes
// ==============================
export class QllmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QllmError';
    Object.setPrototypeOf(this, QllmError.prototype);
  }
}

export class ConfigurationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export class ProviderError extends QllmError {
  constructor(
    message: string,
    public providerName: string,
  ) {
    super(message);
    this.name = 'ProviderError';
    Object.setPrototypeOf(this, ProviderError.prototype);
  }
}

export class TemplateError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
    Object.setPrototypeOf(this, TemplateError.prototype);
  }
}

export class InputValidationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'InputValidationError';
    Object.setPrototypeOf(this, InputValidationError.prototype);
  }
}

export class OutputValidationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'OutputValidationError';
    Object.setPrototypeOf(this, OutputValidationError.prototype);
  }
}

export class TemplateManagerError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateManagerError';
    Object.setPrototypeOf(this, TemplateManagerError.prototype);
  }
}

export class TemplateNotFoundError extends TemplateManagerError {
  constructor(templateName: string) {
    super(`Template not found: ${templateName}`);
    this.name = 'TemplateNotFoundError';
    Object.setPrototypeOf(this, TemplateNotFoundError.prototype);
  }
}

export class InvalidTemplateError extends TemplateManagerError {
  constructor(templateName: string, reason: string) {
    super(`Invalid template ${templateName}: ${reason}`);
    this.name = 'InvalidTemplateError';
    Object.setPrototypeOf(this, InvalidTemplateError.prototype);
  }
}

export class FileOperationError extends TemplateManagerError {
  constructor(operation: string, fileName: string, reason: string) {
    super(`Failed to ${operation} file ${fileName}: ${reason}`);
    this.name = 'FileOperationError';
    Object.setPrototypeOf(this, FileOperationError.prototype);
  }
}

```

## File: src/templates/template-schema.ts

- Extension: .ts
- Language: typescript
- Size: 5177 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import * as z from 'zod';

export const templateVariableSchema = z
  .object({
    type: z
      .enum(['string', 'number', 'boolean', 'array'])
      .describe('The data type of the variable.'),
    description: z.string().describe('A brief description of the variable.'),
    default: z.any().optional().describe('The default value for the variable, if applicable.'),
    place_holder: z.any().optional().describe('The placeholder value for the variable.'),
    inferred: z
      .boolean()
      .optional()
      .describe('Indicates whether the variable is inferred from context.'),
    customValidator: z
      .function()
      .args(z.any())
      .returns(z.boolean())
      .optional()
      .describe('A custom validation function for the variable.'),
  })
  .describe('Schema for defining template variables.');

export const outputVariableSchema = z
  .object({
    type: z
      .enum(['string', 'integer', 'float', 'boolean', 'array', 'object'])
      .describe('The data type of the output variable.'),
    description: z.string().optional().describe('A brief description of the output variable.'),
    default: z
      .any()
      .optional()
      .describe('The default value for the output variable, if applicable.'),
  })
  .describe('Schema for defining output variables.');

export const templateDefinitionSchema = z
  .object({
    name: z.string().describe('The name of the template.'),
    version: z.string().describe('The version of the template, following semantic versioning.'),
    description: z.string().describe('A detailed description of the template and its purpose.'),
    author: z.string().describe('The name or identifier of the template author.'),
    provider: z
      .string()
      .optional()
      .describe('The organization or platform providing the template.'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Keywords or labels for easy template discovery and categorization.'),
    categories: z
      .array(z.string())
      .optional()
      .describe('Broader categories the template falls under.'),
    model: z.string().optional().describe('The specific AI model the template is designed for.'),
    input_variables: z
      .record(z.string(), templateVariableSchema)
      .optional()
      .describe('Definitions of input variables required by the template.'),
    output_variables: z
      .record(z.string(), outputVariableSchema)
      .optional()
      .describe('Specifications for expected output variables from the template.'),
    content: z.string().describe('The main prompt or instruction text of the template.'),
    parameters: z
      .object({
        max_tokens: z
          .number()
          .optional()
          .describe('Maximum number of tokens in the generated output.'),
        temperature: z
          .number()
          .optional()
          .describe('Controls randomness in output generation (0-1).'),
        top_p: z.number().optional().describe('Nucleus sampling parameter for output diversity.'),
        top_k: z.number().optional().describe('Limits vocabulary for each generation step.'),
        seed: z.number().optional().describe('Random seed for reproducible outputs.'),
        system_message: z
          .string()
          .optional()
          .describe('Initial context or instruction for the AI model.'),
        frequency_penalty: z
          .number()
          .optional()
          .describe('Penalizes frequent token usage (-2.0 to 2.0).'),
        presence_penalty: z
          .number()
          .optional()
          .describe('Encourages topic diversity (-2.0 to 2.0).'),
        logit_bias: z
          .record(z.number())
          .optional()
          .describe('Adjusts likelihood of specific tokens.'),
        logprobs: z
          .number()
          .optional()
          .describe('Number of most likely tokens to return with probabilities.'),
        stop_sequences: z
          .array(z.string())
          .optional()
          .describe('Sequences that trigger output completion.'),
      })
      .optional()
      .describe("Fine-tuning parameters for the AI model's behavior."),
    prompt_type: z
      .string()
      .describe("Categorizes the template's primary function or output type.")
      .optional(),
    task_description: z
      .string()
      .describe('Detailed explanation of the task the template is designed to accomplish.')
      .optional(),
    example_outputs: z
      .array(z.string())
      .optional()
      .describe('Sample outputs demonstrating expected results from the template.'),
  })
  .describe('Comprehensive schema for defining an AI prompt template.');

export const templateDefinitionSchemaWithResolvedContent = templateDefinitionSchema.extend({
  resolved_content: z.string().optional().describe('The resolved content of the variable.'),
});

export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;
export type TemplateDefinitionWithResolvedContent = z.infer<
  typeof templateDefinitionSchemaWithResolvedContent
>;
export type TemplateVariable = z.infer<typeof templateVariableSchema>;
export type OutputVariable = z.infer<typeof outputVariableSchema>;

```

## File: src/templates/template-validator.ts

- Extension: .ts
- Language: typescript
- Size: 1780 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// Validator.ts

import { ErrorManager } from '../utils/error';
import { TemplateDefinition } from './types';

type ValidatorType = 'string' | 'number' | 'boolean' | 'array';

interface VariableDefinition {
  type: ValidatorType;
  default?: any;
}

export class TemplateValidator {
  static validateInputVariables(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): void {
    const inputVariables = template.input_variables || {};
    for (const [key, variable] of Object.entries(inputVariables)) {
      if (!(key in variables) && !('default' in variable)) {
        ErrorManager.throwError('InputValidationError', `Missing required input variable: ${key}`);
      }
      this.validateVariableType(key, variables[key], variable as VariableDefinition);
    }
  }

  private static validateVariableType(key: string, value: any, variable: VariableDefinition): void {
    if (value === undefined && 'default' in variable) return;

    const typeValidators: Record<ValidatorType, (v: any) => boolean> = {
      string: (v: any): v is string => typeof v === 'string',
      number: (v: any): boolean => typeof v === 'number' || !isNaN(Number(v)),
      boolean: (v: any): boolean =>
        typeof v === 'boolean' || ['true', 'false'].includes(String(v).toLowerCase()),
      array: (v: any): v is any[] | string => Array.isArray(v) || typeof v === 'string',
    };

    const validator = typeValidators[variable.type];
    if (!validator) {
      ErrorManager.throwError(
        'InputValidationError',
        `Unknown variable type for ${key}: ${variable.type}`,
      );
    }

    if (!validator(value)) {
      ErrorManager.throwError(
        'InputValidationError',
        `Invalid type for ${key}: expected ${variable.type}`,
      );
    }
  }
}

```

## File: src/templates/template-executor.ts

- Extension: .ts
- Language: typescript
- Size: 8414 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { EventEmitter } from 'events';
import { ExecutionContext, TemplateDefinition } from './types';
import { OutputVariableExtractor } from './output-variable-extractor';
import { logger } from '../utils';
import { ErrorManager } from '../utils/error';
import { TemplateValidator } from './template-validator';
import { ChatMessage, LLMProvider } from '../types';
import { createLLMProvider } from '..';
import {
  findIncludeStatements,
  resolveIncludedContent,
} from '../utils/document/document-inclusion-resolver';

interface TemplateExecutorEvents {
  executionStart: { template: TemplateDefinition; variables: Record<string, any> };
  variablesResolved: Record<string, any>;
  contentPrepared: string;
  requestSent: { messages: ChatMessage[]; providerOptions: any };
  responseReceived: string;
  streamStart: void;
  streamChunk: string;
  streamComplete: string;
  streamError: Error;
  outputVariablesProcessed: Record<string, any>;
  executionComplete: { response: string; outputVariables: Record<string, any> };
  executionError: Error;
}

export class TemplateExecutor extends EventEmitter {
  constructor() {
    super();
  }

  on<K extends keyof TemplateExecutorEvents>(
    eventName: K,
    listener: (arg: TemplateExecutorEvents[K]) => void,
  ): this {
    return super.on(eventName, listener);
  }

  emit<K extends keyof TemplateExecutorEvents>(
    eventName: K,
    arg: TemplateExecutorEvents[K],
  ): boolean {
    return super.emit(eventName, arg);
  }

  async execute({
    template,
    provider,
    variables = {},
    stream = false,
    providerOptions = {},
    onPromptForMissingVariables,
  }: ExecutionContext): Promise<{ response: string; outputVariables: Record<string, any> }> {
    this.emit('executionStart', { template, variables });

    const executionProvider =
      provider || (providerOptions.model && createLLMProvider({ name: providerOptions.model }));

    if (!executionProvider) {
      this.handleExecutionError('LLMProvider not provided');
    }

    const context = {
      template,
      variables,
      providerOptions,
      stream,
      provider: executionProvider,
      onPromptForMissingVariables,
    };

    try {
      this.logDebugInfo(template, variables);
      const resolvedVariables = await this.resolveAndValidateVariables(
        context,
        template,
        variables,
      );
      this.emit('variablesResolved', resolvedVariables);

      const content = await this.prepareContent(template, resolvedVariables);

      let resolvedContent = content;

      if (findIncludeStatements(content).length > 0) {
        const currentPath = process.cwd();
        const contentWithMissingInclude = await resolveIncludedContent(content, currentPath);
        resolvedContent = contentWithMissingInclude;
      }

      this.emit('contentPrepared', resolvedContent);

      const messages = this.createChatMessages(resolvedContent);
      this.emit('requestSent', { messages, providerOptions });

      const response = await this.generateResponse(
        provider!,
        messages,
        providerOptions,
        stream || false,
      );
      this.emit('responseReceived', response);

      const outputVariables = this.processOutputVariables(template, response);
      this.emit('outputVariablesProcessed', outputVariables);

      this.emit('executionComplete', { response, outputVariables });
      return { response, outputVariables };
    } catch (error) {
      this.emit('executionError', error instanceof Error ? error : new Error(String(error)));
      this.handleExecutionError(error);
    }
  }

  private logDebugInfo(template: TemplateDefinition, variables: Record<string, any>): void {
    logger.debug(`Executing template: ${JSON.stringify(template)}`);
    logger.debug(`Initial variables: ${JSON.stringify(variables)}`);
  }

  private async resolveAndValidateVariables(
    context: ExecutionContext,
    template: TemplateDefinition,
    initialVariables: Record<string, any>,
  ): Promise<Record<string, any>> {
    const resolvedVariables = await this.resolveVariables(context, template, initialVariables);
    TemplateValidator.validateInputVariables(template, resolvedVariables);
    return resolvedVariables;
  }

  private async resolveVariables(
    context: ExecutionContext,
    template: TemplateDefinition,
    initialVariables: Record<string, any>,
  ): Promise<Record<string, any>> {
    if (!context.onPromptForMissingVariables)
      return this.applyDefaultValues(template, initialVariables);

    const missingVariables = this.findMissingVariables(template, initialVariables);
    if (missingVariables.length > 0) {
      const promptedVariables = await context.onPromptForMissingVariables(
        template,
        initialVariables,
      );
      return this.applyDefaultValues(template, { ...initialVariables, ...promptedVariables });
    }
    return this.applyDefaultValues(template, initialVariables);
  }

  private applyDefaultValues(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): Record<string, any> {
    const result = { ...variables };
    for (const [key, value] of Object.entries(template.input_variables || {})) {
      if (!(key in result) && 'default' in value) {
        result[key] = value.default;
      }
    }
    return result;
  }

  private findMissingVariables(
    template: TemplateDefinition,
    variables: Record<string, any>,
  ): string[] {
    const requiredVariables = Object.keys(template.input_variables || {});
    return requiredVariables.filter(
      (key) => !(key in variables) && !('default' in (template.input_variables?.[key] || {})),
    );
  }

  private async prepareContent(
    template: TemplateDefinition & { resolved_content?: string },
    variables: Record<string, any>,
  ): Promise<string> {
    let content = template.resolved_content || template.content;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), this.formatValue(value));
    }
    return content;
  }

  private formatValue(value: any): string {
    return Array.isArray(value) ? value.join('\n') : String(value);
  }

  private createChatMessages(content: string): ChatMessage[] {
    return [{ role: 'user', content: { type: 'text', text: content } }];
  }

  private async generateResponse(
    provider: LLMProvider,
    messages: ChatMessage[],
    providerOptions: any,
    stream: boolean,
  ): Promise<string> {
    return stream
      ? this.handleStreamingResponse(provider, messages, providerOptions)
      : this.handleNonStreamingResponse(provider, messages, providerOptions);
  }

  private async handleNonStreamingResponse(
    provider: LLMProvider,
    messages: ChatMessage[],
    providerOptions: any,
  ): Promise<string> {
    const response = await provider.generateChatCompletion({ messages, options: providerOptions });
    const textResponse = response.text || '';
    return textResponse;
  }

  private async handleStreamingResponse(
    provider: any,
    messages: ChatMessage[],
    providerOptions: any,
  ): Promise<string> {
    const chunks: string[] = [];
    this.emit('streamStart', undefined);

    try {
      const stream = await provider.streamChatCompletion({ messages, options: providerOptions });
      for await (const chunk of stream) {
        if (chunk.text) {
          this.emit('streamChunk', chunk.text);
          chunks.push(chunk.text);
        }
      }
      const fullResponse = chunks.join('');
      this.emit('streamComplete', fullResponse);
      return fullResponse;
    } catch (error) {
      if (error instanceof Error) {
        this.emit('streamError', error);
      } else {
        this.emit('streamError', new Error(String(error)));
      }
      throw error;
    } finally {
    }
  }

  private processOutputVariables(
    template: TemplateDefinition,
    response: string,
  ): Record<string, any> {
    if (!template.output_variables) return { qllm_response: response };
    const extractedVariables = OutputVariableExtractor.extractVariables(template, response);
    return { qllm_response: response, ...extractedVariables };
  }

  private handleExecutionError(error: any): never {
    logger.error(`Failed to execute template: ${error}`);
    ErrorManager.throwError(
      'TemplateExecutionError',
      error instanceof Error ? error.message : String(error),
    );
  }
}

```

## File: src/templates/samples/prompt-sample.yaml

- Extension: .yaml
- Language: yaml
- Size: 1798 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```yaml
name: 'Text Generation Template'
version: '1.0.0'
description: 'A template for generating creative text based on user input.'
author: 'Raphaël MANSUY'
provider: 'OpenAI'
tags:
  - 'text generation'
  - 'AI'
categories:
  - 'NLP'
  - 'Content Creation'
model: 'gpt-4o-mini'
input_variables:
  user_input:
    type: 'string'
    description: 'The input text provided by the user to generate a response.'
    place_holder: 'Once upon a time'
    inferred: false
  tone:
    type: 'string'
    description: 'The tone of the generated text (e.g., formal, informal, humorous).'
    place_holder: 'informal'
    inferred: false
output_variables:
  generated_text:
    type: 'string'
    description: 'The text generated by the model based on the user input.'
    default: ''
parameters:
  max_tokens: 200 # Increased max tokens for longer responses
  temperature: 0.8 # Adjusted temperature for more creativity
  top_p: 0.95 # Increased top_p for more diverse outputs
  top_k: 60 # Increased top_k for broader sampling
prompt_type: 'text_generation'
target_language: 'en'
task_description: "Generate a creative story based on the user's input and specified tone."
example_outputs:
  - 'Once upon a time, in a land far away, there lived a brave knight named Sir Lancelot...'
  - 'Cats are furry, cats are fun, they chase the laser, they run and run!'
content: |
  ## As author write a Creative Story

  Generate a creative story based on the user's input and specified tone.

  Start of the story: `{{user_input}}`  
  Tone: `{{tone}}`  

  ## Steps 

  1. First find 10 ideas for the story.
  2. Select the best 3 ideas.
  3. Write the story based on the selected ideas in the <generated_text> section.

  ## Output format, you must respect.

  <generated_text>The story to generate ...</generated_text>

```

## File: src/templates/utils/extract-variable-from-content.ts

- Extension: .ts
- Language: typescript
- Size: 4523 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { TemplateVariable } from '../types';

interface ExtractVariablesFromContentOptions {
  allowDotNotation?: boolean;
  allowBracketNotation?: boolean;
  allowFunctionCalls?: boolean;
}

class Parser {
  private input: string;
  private index: number;
  private options: ExtractVariablesFromContentOptions;

  constructor(input: string, options: ExtractVariablesFromContentOptions) {
    this.input = input;
    this.index = 0;
    this.options = options;
  }

  private peek(): string {
    return this.input[this.index] || '';
  }

  private consume(): string {
    return this.input[this.index++] || '';
  }

  private match(expected: string): boolean {
    if (this.input.startsWith(expected, this.index)) {
      this.index += expected.length;
      return true;
    }
    return false;
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.peek())) {
      this.consume();
    }
  }

  parse(): Set<string> {
    const variables = new Set<string>();
    while (this.index < this.input.length) {
      if (this.match('{{')) {
        const variable = this.parseVariableExpression();
        if (variable) {
          variables.add(variable);
        }
      } else {
        this.consume();
      }
    }
    return variables;
  }

  private parseVariableExpression(): string | null {
    this.skipWhitespace();
    const variable = this.parseVariable();
    if (!variable) return null;
    this.skipWhitespace();
    if (!this.match('}}')) return null;
    return variable;
  }

  private parseVariable(): string | null {
    const rootVariable = this.parseIdentifier();
    if (!rootVariable) return null;
    let result = rootVariable;
    let extension = this.parseVariableExtension();
    while (extension) {
      result += extension;
      extension = this.parseVariableExtension();
    }
    return result.split(/[.[(]/)[0]; // Return only the root variable
  }

  private parseVariableExtension(): string | null {
    return this.parseDotNotation() || this.parseBracketNotation() || this.parseFunctionCall();
  }

  private parseIdentifier(): string | null {
    const start = this.index;
    if (/[a-zA-Z_$]/.test(this.peek())) {
      this.consume();
      while (/[a-zA-Z0-9_$]/.test(this.peek())) {
        this.consume();
      }
      return this.input.slice(start, this.index);
    }
    return null;
  }

  private parseDotNotation(): string | null {
    if (!this.options.allowDotNotation) return null;
    if (this.match('.')) {
      const identifier = this.parseIdentifier();
      if (identifier) {
        return '.' + identifier;
      }
    }
    return null;
  }

  private parseBracketNotation(): string | null {
    if (!this.options.allowBracketNotation) return null;
    if (this.match('[')) {
      const start = this.index;
      let bracketCount = 1;
      while (bracketCount > 0 && this.index < this.input.length) {
        if (this.peek() === '[') bracketCount++;
        if (this.peek() === ']') bracketCount--;
        this.consume();
      }
      if (bracketCount === 0) {
        return this.input.slice(start - 1, this.index);
      }
    }
    return null;
  }

  private parseFunctionCall(): string | null {
    if (!this.options.allowFunctionCalls) return null;
    if (this.match('(')) {
      const start = this.index;
      let parenCount = 1;
      while (parenCount > 0 && this.index < this.input.length) {
        if (this.peek() === '(') parenCount++;
        if (this.peek() === ')') parenCount--;
        this.consume();
      }
      if (parenCount === 0) {
        return this.input.slice(start - 1, this.index);
      }
    }
    return null;
  }
}

export function extractVariablesFromContent(
  {
    content,
    input_variables = {},
  }: { content: string; input_variables?: Record<string, TemplateVariable> },
  options: ExtractVariablesFromContentOptions = {
    allowDotNotation: true,
    allowBracketNotation: false,
    allowFunctionCalls: false,
  },
): Record<string, TemplateVariable> {
  const clonedInputVariables = { ...input_variables };
  const parser = new Parser(content, options);
  const uniqueVariables = parser.parse();

  try {
    uniqueVariables.forEach((variable) => {
      if (!clonedInputVariables[variable]) {
        clonedInputVariables[variable] = {
          type: 'string',
          description: `Variable ${variable} found in content`,
          inferred: true,
        };
      }
    });
  } catch (error) {
    console.error('Error extracting variables:', error);
  }

  return clonedInputVariables;
}

```

## File: src/templates/utils/__test__/extract-variable-from-content.test.ts

- Extension: .ts
- Language: typescript
- Size: 4779 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { TemplateValidator } from '../../template-validator';
import { TemplateVariable } from '../../types';
import { extractVariablesFromContent } from '../extract-variable-from-content';

describe('extractVariablesFromContent', () => {
  const defaultOptions = {
    allowDotNotation: true,
    allowBracketNotation: false,
    allowFunctionCalls: false,
  };

  it('should extract a simple variable', () => {
    const content = 'Hello {{name}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({
      name: {
        type: 'string',
        description: 'Variable name found in content',
        inferred: true,
      },
    });
  });

  it('should extract multiple variables', () => {
    const content = '{{firstName}} {{lastName}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({
      firstName: {
        type: 'string',
        description: 'Variable firstName found in content',
        inferred: true,
      },
      lastName: {
        type: 'string',
        description: 'Variable lastName found in content',
        inferred: true,
      },
    });
  });

  it('should extract variables with dot notation', () => {
    const content = '{{user.name}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({
      user: {
        type: 'string',
        description: 'Variable user found in content',
        inferred: true,
      },
    });
  });

  it('should not extract variables with bracket notation when disabled', () => {
    const content = '{{array[0]}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({});
  });

  it('should extract variables with bracket notation when enabled', () => {
    const content = '{{array[0]}}';
    const options = { ...defaultOptions, allowBracketNotation: true };
    const result = extractVariablesFromContent({ content }, options);
    expect(result).toEqual({
      array: {
        type: 'string',
        description: 'Variable array found in content',
        inferred: true,
      },
    });
  });

  it('should not extract function calls when disabled', () => {
    const content = '{{func()}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({});
  });

  it('should extract function calls when enabled', () => {
    const content = '{{func()}}';
    const options = { ...defaultOptions, allowFunctionCalls: true };
    const result = extractVariablesFromContent({ content }, options);
    expect(result).toEqual({
      func: {
        type: 'string',
        description: 'Variable func found in content',
        inferred: true,
      },
    });
  });

  it('should handle empty content', () => {
    const content = '';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({});
  });

  it('should handle content without variables', () => {
    const content = 'No variables here';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({});
  });

  it('should handle whitespace in variable names', () => {
    const content = '{{  whitespace  }}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({
      whitespace: {
        type: 'string',
        description: 'Variable whitespace found in content',
        inferred: true,
      },
    });
  });

  /*it('should handle nested curly braces', () => {
    const content = '{{ {{var} }}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({
      nested: {
        type: 'string',
        description: 'Variable nested found in content',
        inferred: true,
      },
      var: {
        type: 'string',
        description: 'Variable var found in content',
        inferred: true,
      },
    });
  });*/

  it('should not modify existing input variables', () => {
    const content = '{{existingVar}} {{newVar}}';
    const templateVariable: TemplateVariable = {
      type: 'number',
      description: 'Existing variable',
      inferred: false,
    };
    const inputVariables = {
      existingVar: templateVariable,
    };
    const result = extractVariablesFromContent(
      { content, input_variables: inputVariables },
      defaultOptions,
    );
    expect(result).toEqual({
      existingVar: {
        type: 'number',
        description: 'Existing variable',
        inferred: false,
      },
      newVar: {
        type: 'string',
        description: 'Variable newVar found in content',
        inferred: true,
      },
    });
  });
});

```

## File: src/conversation/conversation-reducer.ts

- Extension: .ts
- Language: typescript
- Size: 6560 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// packages/qllm-lib/src/conversation/conversation-reducer.ts
import { v4 as uuidv4 } from 'uuid';
import {
  Conversation,
  ConversationId,
  ConversationMessage,
  ConversationMetadata,
  CreateConversationOptions,
  ProviderId,
} from '../types';
import {
  ConversationError,
  ConversationNotFoundError,
  InvalidConversationOperationError,
} from '../types';

export type ConversationAction =
  | { type: 'CREATE_CONVERSATION'; payload: CreateConversationOptions }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: ConversationId; updates: Partial<Conversation> } }
  | { type: 'DELETE_CONVERSATION'; payload: ConversationId }
  | {
      type: 'ADD_MESSAGE';
      payload: { id: ConversationId; message: Omit<ConversationMessage, 'id'> };
    }
  | {
      type: 'SET_METADATA';
      payload: { id: ConversationId; metadata: Partial<ConversationMetadata> };
    }
  | { type: 'ADD_PROVIDER'; payload: { id: ConversationId; providerId: ProviderId } }
  | { type: 'REMOVE_PROVIDER'; payload: { id: ConversationId; providerId: ProviderId } }
  | { type: 'CLEAR_HISTORY'; payload: ConversationId }
  | { type: 'IMPORT_CONVERSATION'; payload: string };

export const conversationReducer = (
  state: Map<ConversationId, Conversation>,
  action: ConversationAction,
): Map<ConversationId, Conversation> => {
  switch (action.type) {
    case 'CREATE_CONVERSATION': {
      const id = uuidv4();
      const now = new Date();
      const conversation: Conversation = {
        id,
        messages: [],
        metadata: {
          createdAt: now,
          updatedAt: now,
          title: action.payload.metadata?.title || `Conversation ${id}`,
          description: action.payload.metadata?.description || '',
          ...action.payload.metadata,
        },
        activeProviders: new Set(action.payload.providerIds || []),
      };
      if (action.payload.initialMessage) {
        conversation.messages.push({
          id: uuidv4(),
          role: 'user',
          content: {
            type: 'text',
            text: action.payload.initialMessage,
          },
          timestamp: now,
          providerId: action.payload.providerIds?.[0] || '',
          options: {},
        });
      }
      return new Map(state).set(id, conversation);
    }

    case 'UPDATE_CONVERSATION': {
      const { id, updates } = action.payload;
      const conversation = state.get(id);
      if (!conversation) throw new ConversationNotFoundError(id);
      const updatedConversation: Conversation = {
        ...conversation,
        ...updates,
        metadata: {
          ...conversation.metadata,
          ...updates.metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(id, updatedConversation);
    }

    case 'DELETE_CONVERSATION': {
      const newState = new Map(state);
      newState.delete(action.payload);
      return newState;
    }

    case 'ADD_MESSAGE': {
      const { id, message } = action.payload;
      const conversation = state.get(id);
      if (!conversation) throw new ConversationNotFoundError(id);
      const newMessage: ConversationMessage = {
        ...message,
        id: uuidv4(),
        timestamp: new Date(),
      };
      const updatedConversation: Conversation = {
        ...conversation,
        messages: [...conversation.messages, newMessage],
        activeProviders: new Set(conversation.activeProviders).add(message.providerId),
        metadata: {
          ...conversation.metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(id, updatedConversation);
    }

    case 'SET_METADATA': {
      const { id, metadata } = action.payload;
      const conversation = state.get(id);
      if (!conversation) throw new ConversationNotFoundError(id);
      const updatedConversation: Conversation = {
        ...conversation,
        metadata: {
          ...conversation.metadata,
          ...metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(id, updatedConversation);
    }

    case 'ADD_PROVIDER': {
      const { id, providerId } = action.payload;
      const conversation = state.get(id);
      if (!conversation) throw new ConversationNotFoundError(id);
      const updatedConversation: Conversation = {
        ...conversation,
        activeProviders: new Set(conversation.activeProviders).add(providerId),
        metadata: {
          ...conversation.metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(id, updatedConversation);
    }

    case 'REMOVE_PROVIDER': {
      const { id, providerId } = action.payload;
      const conversation = state.get(id);
      if (!conversation) throw new ConversationNotFoundError(id);
      if (!conversation.activeProviders.has(providerId)) {
        throw new InvalidConversationOperationError(
          `Provider ${providerId} is not active in conversation ${id}`,
        );
      }
      const updatedProviders = new Set(conversation.activeProviders);
      updatedProviders.delete(providerId);
      const updatedConversation: Conversation = {
        ...conversation,
        activeProviders: updatedProviders,
        metadata: {
          ...conversation.metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(id, updatedConversation);
    }

    case 'CLEAR_HISTORY': {
      const conversation = state.get(action.payload);
      if (!conversation) throw new ConversationNotFoundError(action.payload);
      const updatedConversation: Conversation = {
        ...conversation,
        messages: [],
        metadata: {
          ...conversation.metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(action.payload, updatedConversation);
    }

    case 'IMPORT_CONVERSATION': {
      try {
        const parsedData = JSON.parse(action.payload) as Conversation;
        if (!isValidConversation(parsedData)) {
          throw new Error('Invalid conversation data structure');
        }
        return new Map(state).set(parsedData.id, parsedData);
      } catch (error) {
        throw new ConversationError(`Failed to import conversation: ${(error as Error).message}`);
      }
    }

    default:
      return state;
  }
};

const isValidConversation = (data: any): data is Conversation => {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    Array.isArray(data.messages) &&
    typeof data.metadata === 'object' &&
    data.activeProviders instanceof Set
  );
};

```

## File: src/conversation/index.ts

- Extension: .ts
- Language: typescript
- Size: 40 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
export * from './conversation-manager';

```

## File: src/conversation/conversation-manager.ts

- Extension: .ts
- Language: typescript
- Size: 7107 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// packages/qllm-lib/src/conversation/conversation-manager.ts
import {
  Conversation,
  ConversationId,
  ConversationManager,
  ConversationMessage,
  ConversationMetadata,
  CreateConversationOptions,
  ProviderId,
  StorageProvider,
} from '../types';
import { InMemoryStorageProvider } from '../storage/in-memory-storage-provider';
import { ConversationError, ConversationNotFoundError } from '../types';
import { ConversationAction, conversationReducer } from './conversation-reducer';

export const createConversationManager = (
  initialStorageProvider?: StorageProvider,
): ConversationManager => {
  let state = new Map<ConversationId, Conversation>();
  const storageProvider = initialStorageProvider || new InMemoryStorageProvider();

  const dispatch = (action: ConversationAction): void => {
    state = conversationReducer(state, action);
  };

  const manager: ConversationManager = {
    storageProvider,

    async createConversation(options: CreateConversationOptions = {}): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'CREATE_CONVERSATION',
        payload: options,
      };
      dispatch(action);
      const newConversation = Array.from(state.values()).pop();
      if (!newConversation) throw new ConversationError('Failed to create conversation');
      await storageProvider.save(newConversation);
      return newConversation;
    },

    async getConversation(id: ConversationId): Promise<Conversation> {
      const conversation = state.get(id);
      if (!conversation) {
        const loadedConversation = await storageProvider.load(id);
        if (!loadedConversation) throw new ConversationNotFoundError(id);
        state.set(id, loadedConversation);
        return loadedConversation;
      }
      return conversation;
    },

    async updateConversation(
      id: ConversationId,
      updates: Partial<Conversation>,
    ): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'UPDATE_CONVERSATION',
        payload: { id, updates },
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async deleteConversation(id: ConversationId): Promise<void> {
      dispatch({ type: 'DELETE_CONVERSATION', payload: id });
      await storageProvider.delete(id);
    },

    async listConversations(): Promise<Conversation[]> {
      return storageProvider.listConversations();
    },

    async addMessage(
      id: ConversationId,
      message: Omit<ConversationMessage, 'id'>,
    ): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'ADD_MESSAGE',
        payload: { id, message },
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async getHistory(id: ConversationId): Promise<ConversationMessage[]> {
      const conversation = await this.getConversation(id);
      return conversation.messages;
    },

    async setMetadata(
      id: ConversationId,
      metadata: Partial<ConversationMetadata>,
    ): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'SET_METADATA',
        payload: { id, metadata },
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async addProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'ADD_PROVIDER',
        payload: { id, providerId },
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async removeProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'REMOVE_PROVIDER',
        payload: { id, providerId },
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async clearHistory(id: ConversationId): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'CLEAR_HISTORY',
        payload: id,
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async searchConversations(query: string): Promise<ConversationMetadata[]> {
      const allConversations = await this.listConversations();
      return allConversations
        .filter(
          (conv) =>
            conv.metadata.title?.toLowerCase().includes(query.toLowerCase()) ||
            conv.metadata.description?.toLowerCase().includes(query.toLowerCase()),
        )
        .map((conv) => conv.metadata);
    },

    async exportConversation(id: ConversationId): Promise<string> {
      const conversation = await this.getConversation(id);
      return JSON.stringify(conversation, null, 2);
    },

    async importConversation(conversationData: string): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'IMPORT_CONVERSATION',
        payload: conversationData,
      };
      dispatch(action);
      const importedConversation = Array.from(state.values()).pop();
      if (!importedConversation) throw new ConversationError('Failed to import conversation');
      await storageProvider.save(importedConversation);
      return importedConversation;
    },

    // New methods for conversation management

    async clearConversation(id: ConversationId): Promise<Conversation> {
      return this.clearHistory(id);
    },

    async startNewConversation(options: CreateConversationOptions = {}): Promise<Conversation> {
      return this.createConversation(options);
    },

    async listAllConversations(): Promise<Conversation[]> {
      return this.listConversations();
    },

    async displayConversation(id: ConversationId): Promise<ConversationMessage[]> {
      return this.getHistory(id);
    },

    async selectConversation(id: ConversationId): Promise<Conversation> {
      return this.getConversation(id);
    },

    async deleteAllConversations(): Promise<void> {
      const allConversations = await this.listConversations();
      for (const conversation of allConversations) {
        await this.deleteConversation(conversation.id);
      }
    },
  };

  return manager;
};

```

## File: src/types/index.ts

- Extension: .ts
- Language: typescript
- Size: 100 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
export * from './llm-provider';
export * from './llm-types';
export * from './conversations-types';

```

## File: src/types/llm-types.ts

- Extension: .ts
- Language: typescript
- Size: 7167 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { z } from 'zod';

// -------------------- Chat Message Types --------------------

export type ChatMessageRole = 'user' | 'assistant';
export type ChatMessageContentType = 'text' | 'image_url';

export type TextContent = {
  type: 'text';
  text: string;
};

export type ImageUrlContent = {
  type: 'image_url';
  url: string;
};

export type MessageContent = TextContent | ImageUrlContent;
export type ChatMessageContent = MessageContent | MessageContent[];

export type ChatMessage = {
  role: ChatMessageRole;
  content: ChatMessageContent;
};

export type SystemMessage = {
  role: 'system';
  content: TextContent;
};

export type ChatMessageWithSystem = ChatMessage | SystemMessage;

// Type guard functions for type checking
export function isTextContent(content: MessageContent): content is TextContent {
  return content.type === 'text';
}

export function isImageUrlContent(content: MessageContent): content is ImageUrlContent {
  return content.type === 'image_url';
}

// -------------------- Usage and Response Types --------------------

export type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type ChatCompletionResponse = {
  model: string;
  text: string | null;
  refusal: string | null;
  toolCalls?: ToolCall[];
  finishReason: string | null;
  usage?: Usage;
};

export type ChatStreamCompletionResponse = {
  model: string;
  text: string | null;
  finishReason: string | null;
};

// -------------------- Embedding Types --------------------

export type EmbeddingRequestParams = {
  model: string;
  content: string | string[] | number[] | number[][];
  dimensions?: number;
};

export type Embedding = number[];

export type EmbeddingResponse = {
  embedding: Embedding;
  embeddings?: Embedding[];
};

// -------------------- Option Types --------------------

export interface GenerationOptions {
  // Seed for deterministic generation. Same seed should produce same output.
  seed?: number;
  // Maximum number of tokens to generate
  maxTokens?: number;
  // Controls randomness: 0 = deterministic, 1 = very random
  temperature?: number;
  // Nucleus sampling: only consider tokens with top_p cumulative probability
  topProbability?: number;
  // Only sample from top K tokens
  topKTokens?: number;
  // Number of most likely tokens to return with their log probabilities
  topLogprobs?: number | null;
  // Adjust likelihood of specific tokens appearing in the output
  logitBias?: Record<string, number> | null;
  // Whether to return log probabilities of the output tokens
  logprobs?: number | null;
  // Sequences where the API will stop generating further tokens
  stop?: string | string[] | null;
  // Penalize new tokens based on their existing frequency in the text so far
  presencePenalty?: number | null;
  // Penalize new tokens based on their existing frequency in the text so far
  frequencyPenalty?: number | null;
}

export interface ModelOptions {
  model: string;
}

export interface EnvironmentOptions {
  awsRegion?: string;
  awsProfile?: string;
}

export interface LLMOptions extends GenerationOptions, ModelOptions, EnvironmentOptions {
  systemMessage?: string;
}

// -------------------- Function and Tool Types --------------------

const JSONSchemaPrimitiveType = z.enum(['string', 'number', 'integer', 'boolean', 'null']);

const JSONSchemaType: z.ZodType<any> = z.lazy(() =>
  z
    .object({
      // Core schema metadata
      $schema: z.string().optional(),
      $id: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),

      // Type-specific fields
      type: z.union([JSONSchemaPrimitiveType, z.array(JSONSchemaPrimitiveType)]).optional(),
      enum: z.array(z.any()).optional(),
      const: z.any().optional(),

      // Numeric constraints
      multipleOf: z.number().positive().optional(),
      maximum: z.number().optional(),
      exclusiveMaximum: z.number().optional(),
      minimum: z.number().optional(),
      exclusiveMinimum: z.number().optional(),

      // String constraints
      maxLength: z.number().int().nonnegative().optional(),
      minLength: z.number().int().nonnegative().optional(),
      pattern: z.string().optional(),

      // Array constraints
      items: z.union([JSONSchemaType, z.array(JSONSchemaType)]).optional(),
      additionalItems: z.union([JSONSchemaType, z.boolean()]).optional(),
      maxItems: z.number().int().nonnegative().optional(),
      minItems: z.number().int().nonnegative().optional(),
      uniqueItems: z.boolean().optional(),

      // Object constraints
      properties: z.record(JSONSchemaType).optional(),
      patternProperties: z.record(JSONSchemaType).optional(),
      additionalProperties: z.union([JSONSchemaType, z.boolean()]).optional(),
      required: z.array(z.string()).optional(),
      propertyNames: JSONSchemaType.optional(),
      maxProperties: z.number().int().nonnegative().optional(),
      minProperties: z.number().int().nonnegative().optional(),

      // Combining schemas
      allOf: z.array(JSONSchemaType).optional(),
      anyOf: z.array(JSONSchemaType).optional(),
      oneOf: z.array(JSONSchemaType).optional(),
      not: JSONSchemaType.optional(),

      // Conditional schema
      if: JSONSchemaType.optional(),
      then: JSONSchemaType.optional(),
      else: JSONSchemaType.optional(),

      // Format
      format: z.string().optional(),

      // Schema annotations
      default: z.any().optional(),
      examples: z.array(z.any()).optional(),
    })
    .passthrough(),
);

const FunctionToolSchema = z.object({
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    description: z.string(),
    parameters: JSONSchemaType,
  }),
  strict: z.boolean().optional(),
});

const ToolSchema = FunctionToolSchema;

export type FunctionTool = z.infer<typeof FunctionToolSchema>;
export type Tool = z.infer<typeof ToolSchema>;

export type ToolChoiceFunction = {
  type: 'function';
  name: string;
};

export type ToolCallFunction = {
  name: string;
  arguments: string; // JSON string of arguments
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: ToolCallFunction;
};

// -------------------- Miscellaneous Types --------------------

export type ResponseFormatText = {
  type: 'text';
};

export type ResponseFormatJSONObject = {
  type: 'json_object';
};

export type ResponseFormatJSONSchema = {
  type: 'json_schema';
  json_schema: {
    name: string;
    description?: string;
    schema: Record<string, unknown>;
    strict?: boolean;
  };
};

export type ResponseFormat =
  | ResponseFormatText
  | ResponseFormatJSONObject
  | ResponseFormatJSONSchema;

export interface ErrorResponse {
  code: string;
  message: string;
  details?: string;
}

export type Model = {
  id: string;
  description?: string;
  created?: Date;
};

// -------------------- Chat Completion Types --------------------

export type ChatCompletionParams = {
  messages: ChatMessage[];
  tools?: Tool[];
  toolChoice?: 'none' | 'auto' | 'required';
  parallelToolCalls?: boolean;
  responseFormat?: ResponseFormat;
  options: LLMOptions;
};

```

## File: src/types/conversations-types.ts

- Extension: .ts
- Language: typescript
- Size: 3173 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// src/types/conversation-types.ts

import { ChatMessage, LLMOptions } from './llm-types';

export type ConversationId = string;
export type ProviderId = string;

export interface ConversationMetadata {
  createdAt: Date;
  updatedAt: Date;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface ConversationMessage extends ChatMessage {
  id: string;
  timestamp: Date;
  providerId: ProviderId;
  options?: Partial<LLMOptions>;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: ConversationId;
  messages: ConversationMessage[];
  metadata: ConversationMetadata;
  activeProviders: Set<ProviderId>;
}

export interface StorageProvider {
  save(conversation: Conversation): Promise<void>;
  load(id: ConversationId): Promise<Conversation | null>;
  delete(id: ConversationId): Promise<void>;
  list(): Promise<ConversationMetadata[]>;
  listConversations(): Promise<Conversation[]>; // Add this new method
}

export interface ConversationManager {
  createConversation(options?: CreateConversationOptions): Promise<Conversation>;
  getConversation(id: ConversationId): Promise<Conversation>;
  updateConversation(id: ConversationId, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: ConversationId): Promise<void>;
  listConversations(): Promise<Conversation[]>;
  addMessage(
    id: ConversationId,
    message: Omit<ConversationMessage, 'id' | 'timestamp'>,
  ): Promise<Conversation>;
  getHistory(id: ConversationId): Promise<ConversationMessage[]>;
  setMetadata(id: ConversationId, metadata: Partial<ConversationMetadata>): Promise<Conversation>;
  addProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation>;
  removeProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation>;
  clearHistory(id: ConversationId): Promise<Conversation>;
  searchConversations(query: string): Promise<ConversationMetadata[]>;
  exportConversation(id: ConversationId): Promise<string>;
  importConversation(conversationData: string): Promise<Conversation>;
  clearConversation(id: ConversationId): Promise<Conversation>;
  startNewConversation(options: CreateConversationOptions): Promise<Conversation>;
  listAllConversations(): Promise<Conversation[]>;
  displayConversation(id: ConversationId): Promise<ConversationMessage[]>;
  selectConversation(id: ConversationId): Promise<Conversation>;
  deleteAllConversations(): Promise<void>;
  storageProvider: StorageProvider;
}

export interface CreateConversationOptions {
  initialMessage?: string;
  metadata?: Partial<ConversationMetadata>;
  providerIds?: ProviderId[];
}

export class ConversationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversationError';
  }
}

export class ConversationNotFoundError extends ConversationError {
  constructor(id: ConversationId) {
    super(`Conversation with id ${id} not found`);
    this.name = 'ConversationNotFoundError';
  }
}

export class InvalidConversationOperationError extends ConversationError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidConversationOperationError';
  }
}

```

## File: src/types/llm-provider.ts

- Extension: .ts
- Language: typescript
- Size: 3184 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import {
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  ChatMessage,
  EmbeddingRequestParams,
  EmbeddingResponse,
  LLMOptions,
  Model,
  ChatMessageWithSystem,
} from './llm-types';

export interface AIProvider {
  readonly name: string;
  readonly version: string;
  listModels(): Promise<Model[]>;
}

export interface EmbeddingProvider extends AIProvider {
  generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse>;
  listModels(): Promise<Model[]>;
}

// LLM Provider Interface
export interface LLMProvider extends AIProvider {
  defaultOptions: LLMOptions; // Default options for the provider
  generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse>;
}

// Error Handling Classes
export class LLMProviderError extends Error {
  constructor(
    message: string,
    public providerName: string,
    public errorCode?: string,
  ) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

export class AuthenticationError extends LLMProviderError {}
export class RateLimitError extends LLMProviderError {}
export class InvalidRequestError extends LLMProviderError {}

// Base LLM Provider Class
export abstract class BaseLLMProvider implements LLMProvider {
  public supportsEmbedding = false;
  public supportsImageAnalysis = false;
  public version = '3.0.0'; // Default version
  public abstract name: string;

  abstract listModels(): Promise<Model[]>;

  abstract defaultOptions: LLMOptions;

  abstract generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  abstract streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse>;

  protected handleError(error: unknown): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new InvalidRequestError(error.message, this.constructor.name);
    } else {
      throw new InvalidRequestError(`Unknown error: ${error}`, this.constructor.name);
    }
  }

  protected withSystemMessage(
    options: LLMOptions,
    messages: ChatMessage[],
  ): ChatMessageWithSystem[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [
          {
            role: 'system',
            content: { type: 'text', text: options.systemMessage },
          },
          ...messages,
        ]
      : messages;
  }
}

export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  public version = '1.0.0'; // Default version
  public abstract name: string;

  abstract generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse>;
  abstract listModels(): Promise<Model[]>;

  protected handleError(error: unknown): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new InvalidRequestError(error.message, this.constructor.name);
    } else {
      throw new InvalidRequestError(`Unknown error: ${error}`, this.constructor.name);
    }
  }
}

```

## File: src/providers/index.ts

- Extension: .ts
- Language: typescript
- Size: 1834 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { EmbeddingProvider, LLMProvider } from '../types/index';
import { AnthropicProvider } from './anthropic';
import { createAwsBedrockAnthropicProvider } from './anthropic/aws-credentials';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { GroqProvider } from './qroq';
import { PerplexityProvider } from './perplexity';
import { MistralProvider } from './mistral';
import { OpenRouterProvider } from './openrouter';

export const getListProviderNames = (): string[] => {
  const listProviders = [
    'openai',
    'ollama',
    'groq',
    'anthropic',
    'aws-anthropic',
    'perplexity',
    'mistral',
    'openrouter',
  ].sort();
  return listProviders;
};

// Provider factory
export async function getLLMProvider(providerName: string): Promise<LLMProvider> {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    case 'ollama':
      return new OllamaProvider();
    case 'groq':
      return new GroqProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'aws-anthropic':
      return await createAwsBedrockAnthropicProvider();
    case 'perplexity':
      return new PerplexityProvider();
    case 'mistral':
      return new MistralProvider();
    case 'openrouter':
      return new OpenRouterProvider();
    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}

export async function getEmbeddingProvider(providerName: string): Promise<EmbeddingProvider> {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    case 'ollama':
      return new OllamaProvider();
    case 'groq':
      return new GroqProvider();
    case 'perplexity':
      return new PerplexityProvider();
    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}

```

## File: src/providers/qroq/index.ts

- Extension: .ts
- Language: typescript
- Size: 5678 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// packages/qllm-lib/src/providers/groq/index.ts

import Groq from 'groq-sdk';
import {
  BaseLLMProvider,
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  LLMOptions,
  LLMProviderError,
  Model,
  Tool,
  EmbeddingProvider,
  EmbeddingRequestParams,
  EmbeddingResponse,
  isTextContent,
  isImageUrlContent,
  ChatMessageWithSystem,
} from '../../types';

const DEFAULT_MODEL = 'mixtral-8x7b-32768';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';
const DEFAULT_MAX_TOKENS = 1024 * 32;

export class GroqProvider extends BaseLLMProvider implements EmbeddingProvider {
  private client: Groq;
  public readonly name = 'Groq';
  public readonly version = '1.0.0';

  constructor(apiKey?: string) {
    super();
    const key = apiKey ?? process.env.GROQ_API_KEY;
    if (!key) {
      throw new LLMProviderError('Groq API key not found', this.name);
    }
    this.client = new Groq({ apiKey: key });
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  async listModels(): Promise<Model[]> {
    try {
      const models = await this.client.models.list();
      return models.data.map((model) => ({
        id: model.id,
        name: model.id,
        created: new Date(model.created * 1000),
        description: `${model.id} - owned by ${model.owned_by}`,
      }));
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = this.formatTools(tools);

      const response = await this.client.chat.completions.create({
        model: options.model || this.defaultOptions.model,
        messages: formattedMessages,
        tools: formattedTools,
        max_tokens: options.maxTokens || this.defaultOptions.maxTokens,
        temperature: options.temperature,
        top_p: options.topProbability,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
      });

      const firstChoice = response.choices[0];
      return {
        model: response.model,
        text: firstChoice?.message?.content || '',
        finishReason: firstChoice?.finish_reason || null,
        toolCalls: firstChoice?.message?.tool_calls,
        refusal: null,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);

      const stream = await this.client.chat.completions.create({
        model: options.model || this.defaultOptions.model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || this.defaultOptions.maxTokens,
        temperature: options.temperature,
        top_p: options.topProbability,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield {
            text: content,
            finishReason: chunk.choices[0]?.finish_reason || null,
            model: chunk.model,
          };
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    try {
      const { content, model } = input;

      if (Array.isArray(content)) {
        throw new LLMProviderError('Groq does not support batch embeddings', this.name);
      }

      if (typeof content !== 'string') {
        throw new LLMProviderError('Groq only supports text embeddings', this.name);
      }

      const response = await this.client.embeddings.create({
        model: model || DEFAULT_EMBEDDING_MODEL,
        input: content,
      });

      return {
        embedding: response.data as unknown as number[],
        embeddings: undefined,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  private async formatMessages(messages: ChatMessageWithSystem[]): Promise<any[]> {
    return messages.map((message) => ({
      role: message.role,
      content: Array.isArray(message.content)
        ? message.content
            .map((c) =>
              isTextContent(c) ? c.text : isImageUrlContent(c) ? `[Image: ${c.url}]` : '',
            )
            .join('\n')
        : isTextContent(message.content)
          ? message.content.text
          : isImageUrlContent(message.content)
            ? `[Image: ${message.content.url}]`
            : '',
    }));
  }

  private formatTools(tools?: Tool[]): any[] | undefined {
    if (!tools) return undefined;
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    }));
  }

  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      throw new LLMProviderError(error.message, this.name);
    } else {
      throw new LLMProviderError(`Unknown error: ${error}`, this.name);
    }
  }
}

```

## File: src/providers/ollama/index.ts

- Extension: .ts
- Language: typescript
- Size: 7388 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import {
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  LLMOptions,
  LLMProviderError,
  Model,
  Tool,
  ChatMessage,
  isTextContent,
  isImageUrlContent,
  MessageContent,
  ImageUrlContent,
  ToolCall,
  LLMProvider,
  EmbeddingProvider,
  EmbeddingRequestParams,
  EmbeddingResponse,
  ChatMessageWithSystem,
  SystemMessage,
} from '../../types';
import ollama, {
  ChatRequest,
  Tool as OllamaTool,
  ToolCall as OllamaToolCall,
  Options as OllamaOptions,
} from 'ollama';
import { imageToBase64 } from '../../utils/images';
import { listModels } from './list-models';

const DEFAULT_MODEL = 'llama3.1';
const BASE_URL = 'http://localhost:11434';

export class OllamaProvider implements LLMProvider, EmbeddingProvider {
  constructor(private baseUrl: string = BASE_URL) {}

  public readonly version: string = '1.0.0';
  public readonly name = 'Ollama';

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    if (Array.isArray(input.content)) {
      throw new Error('Ollama embeddings does not support multiple text inputs');
    }
    const result = await ollama.embeddings({
      model: input.model,
      prompt: input.content,
    });

    const embeddingResponse: EmbeddingResponse = {
      embedding: result.embedding,
      embeddings: [result.embedding],
    };

    return embeddingResponse;
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
  };

  async listModels(): Promise<Model[]> {
    try {
      const models = await listModels(this.baseUrl);

      return models.map((model) => ({
        id: model.id,
        createdAt: model.createdAt,
        description: model.description,
      }));
    } catch (error) {
      this.handleError(error);
      return []; // Return an empty array in case of error
    }
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = formatTools(tools);

      const chatRequest: ChatRequest & { stream: false } = {
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
        stream: false,
        tools: formattedTools,
        options: formatOptions(options),
      };

      const response = await ollama.chat(chatRequest);

      // console.dir(response, { depth: null });

      return {
        model: options.model || DEFAULT_MODEL,
        text: response.message.content,
        refusal: null,
        toolCalls: mapOllamaToolCallToToolCall(response.message.tool_calls),
        finishReason: response.done ? 'stop' : null,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = formatTools(tools);

      const chatRequest: ChatRequest & { stream: true } = {
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
        tools: formattedTools,
        stream: true,
        options: formatOptions(options),
      };

      const stream = await ollama.chat(chatRequest);

      for await (const part of stream) {
        yield {
          text: part.message.content,
          finishReason: part.done ? 'stop' : null,
          model: options.model || DEFAULT_MODEL,
        };
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async formatMessages(
    messages: ChatMessageWithSystem[],
  ): Promise<{ role: string; content: string; images?: string[] }[]> {
    const formattedMessages: { role: string; content: string; images?: string[] }[] = [];

    for (const message of messages) {
      const messageContentArray: MessageContent[] = Array.isArray(message.content)
        ? message.content
        : [message.content];

      let content = '';
      const images: string[] = [];

      for (const messageContent of messageContentArray) {
        if (isTextContent(messageContent)) {
          content += messageContent.text + '\n';
        } else if (isImageUrlContent(messageContent)) {
          const imageContent = await createOllamaImageContent(messageContent.url);
          images.push(imageContent.url);
        }
      }

      formattedMessages.push({
        role: message.role,
        content: content.trim(),
        ...(images.length > 0 && { images }),
      });
    }
    return formattedMessages;
  }
  protected handleError(error: unknown): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new LLMProviderError(error.message, this.name);
    } else {
      throw new LLMProviderError(`Unknown error: ${error}`, this.name);
    }
  }

  protected withSystemMessage(
    options: LLMOptions,
    messages: ChatMessage[],
  ): ChatMessageWithSystem[] {
    if (options.systemMessage && options.systemMessage.length > 0) {
      const systemMessage: SystemMessage = {
        role: 'system',
        content: {
          text: options.systemMessage,
          type: 'text',
        },
      };
      return [systemMessage, ...messages];
    }
    return messages;
  }
}

export const createOllamaImageContent = async (source: string): Promise<ImageUrlContent> => {
  const content = await imageToBase64(source);
  // Return the raw base64 string without the data URL prefix
  return {
    type: 'image_url',
    url: content.base64,
  };
};

function formatTools(tools: Tool[] | undefined): OllamaTool[] | undefined {
  if (!tools) {
    return undefined;
  }
  const ollamaTools: OllamaTool[] = [];
  for (const tool of tools) {
    const ollamaTool: OllamaTool = {
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    };
    ollamaTools.push(ollamaTool);
  }
  return ollamaTools;
}

function mapOllamaToolCallToToolCall(
  toolCalls: OllamaToolCall[] | undefined,
): ToolCall[] | undefined {
  if (!toolCalls) {
    return undefined;
  }
  return toolCalls.map(
    (toolCall) =>
      ({
        type: 'function',
        id: crypto.randomUUID(), // Generate a unique ID
        function: {
          name: toolCall.function.name,
          arguments: JSON.stringify(toolCall.function.arguments),
        },
      }) as ToolCall,
  );
}

function formatOptions(options: LLMOptions): Partial<OllamaOptions> {
  const stops: string[] = [];
  if (Array.isArray(options.stop)) {
    stops.push(...options.stop);
  } else if (options.stop) {
    stops.push(options.stop);
  }

  const formattedOptions: Partial<OllamaOptions> = {
    temperature: options.temperature,
    top_p: options.topProbability,
    seed: options.seed,
    top_k: options.topKTokens,
    stop: stops,
    presence_penalty: options.presencePenalty || undefined,
    frequency_penalty: options.frequencyPenalty || undefined,
  };
  return formattedOptions;
}

```

## File: src/providers/ollama/list-models.ts

- Extension: .ts
- Language: typescript
- Size: 1614 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import axios from 'axios';
import { LLMProviderError } from '../../types';

interface OllamaModelDetails {
  format: string;
  family: string;
  families: string[] | null;
  parameter_size: string;
  quantization_level: string;
}

interface OllamaModelResponse {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
}

interface OllamaListResponse {
  models: OllamaModelResponse[];
}

export interface Model {
  id: string;
  createdAt: string;
  description: string;
}

export async function listModels(baseUrl: string = 'http://localhost:11434'): Promise<Model[]> {
  try {
    const response = await axios.get<OllamaListResponse>(`${baseUrl}/api/tags`);

    if (!response.data || !response.data.models || !Array.isArray(response.data.models)) {
      //console.warn('Unexpected response format from Ollama API');
      return [];
    }

    return response.data.models.map((model: OllamaModelResponse) => ({
      id: model.name,
      createdAt: model.modified_at,
      description: formatModelDescription(model.details),
    }));
  } catch (error) {
    //console.error('Error fetching models from Ollama:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new LLMProviderError(`Failed to fetch models from Ollama ${errorMessage}`, 'Ollama');
  }
}

function formatModelDescription(details: OllamaModelDetails): string {
  const parts = [
    details.parameter_size,
    details.quantization_level,
    details.format.toUpperCase(),
    details.family,
  ];
  return parts.filter(Boolean).join(', ');
}

```

## File: src/providers/anthropic/index.ts

- Extension: .ts
- Language: typescript
- Size: 9434 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { Anthropic } from '@anthropic-ai/sdk';
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import {
  BaseLLMProvider,
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  LLMOptions,
  LLMProviderError,
  Model,
  Tool,
  EmbeddingRequestParams,
  EmbeddingResponse,
  ToolCall,
} from '../../types';
import { formatMessages } from './message-util';
import { listModels as listBedrockModels } from '../../utils/cloud/aws/bedrock';
import { region, getAwsCredential } from './aws-credentials';
import { DEFAULT_MAX_TOKENS, DEFAULT_MODEL } from './constants';

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic | AnthropicBedrock;
  public readonly name = 'Anthropic';
  public readonly version = '1.0.0';

  constructor({ apiKey, client }: { apiKey?: string; client?: AnthropicBedrock } = {}) {
    super();
    if (!client) {
      const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
      if (!key) {
        throw new LLMProviderError('Anthropic API key not found', this.name);
      }
      this.client = new Anthropic({ apiKey: key });
    } else {
      this.client = client;
    }
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  async listModels(): Promise<Model[]> {
    if (this.client instanceof AnthropicBedrock) {
      const models = await listBedrockModels(await getAwsCredential(), region());
      return models
        .map((model) => ({
          id: model.id,
          description: model.description,
        }))
        .filter((model) => model.id.startsWith('anthropic.'));
    }

    // Anthropic doesn't provide a model listing API, so we'll return a static list
    return [
      {
        id: 'claude-3-opus-20240229',
        created: new Date('2024-02-29'),
        description: 'Claude 3 Opus: Most capable model for highly complex tasks',
      },
      {
        id: 'claude-3-sonnet-20240229',
        created: new Date('2024-02-29'),
        description:
          'Claude 3 Sonnet: Ideal balance of intelligence and speed for enterprise workloads',
      },
      {
        id: 'claude-3-haiku-20240307',
        created: new Date('2024-03-07'),
        description:
          'Claude 3 Haiku: Fastest and most compact model for near-instant responsiveness',
      },
      {
        id: 'claude-3-embedding-20240229',
        created: new Date('2024-02-29'),
        description: 'Claude 3 Embedding: Embedding model for text embedding generation',
      },
      {
        id: 'claude-3-5-sonnet-20240620',
        created: new Date('2024-06-20'),
        description:
          'Claude 3.5 Sonnet: Ideal balance of intelligence and speed for enterprise workloads. Stronger than Claude 3 Opus.',
      },
    ];
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools } = params;
      const formattedMessages = await formatMessages(messages);
      const formattedTools = this.formatTools(tools);
      const request: Anthropic.Messages.MessageCreateParamsNonStreaming = {
        system: options.systemMessage as string | undefined,
        model: options.model || this.defaultOptions.model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || this.defaultOptions.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topProbability,
        top_k: options.topKTokens,
        stop_sequences: options.stop
          ? Array.isArray(options.stop)
            ? options.stop
            : [options.stop]
          : undefined,
        tools: formattedTools,
      };

      // console.log('AnthropicProvider.generateChatCompletion request:');
      // console.dir(request, { depth: null });
      const response = await this.client.messages.create(request);

      const getTextFromContentBlock = (
        contentBlock: Anthropic.Messages.ContentBlock,
      ): string | null => {
        if (contentBlock.type === 'text') {
          return contentBlock.text;
        }
        return null;
      };

      const getToolFromContentBlock = (
        contentBlock: Anthropic.Messages.ContentBlock,
      ): ToolCall | undefined => {
        if (contentBlock.type === 'tool_use') {
          const toolCall: ToolCall = {
            id: contentBlock.id,
            type: 'function',
            function: {
              name: contentBlock.name,
              arguments: JSON.stringify(contentBlock.input),
            },
          };
          return toolCall;
        }
        return undefined;
      };

      const getFirstTextFromContentBlocks = (
        contentBlocks: Anthropic.Messages.ContentBlock[],
      ): string | null => {
        const contentBlock = contentBlocks.find((block) => {
          const text = getTextFromContentBlock(block);
          return text !== null && text !== undefined;
        });
        return contentBlock ? getTextFromContentBlock(contentBlock) : null;
      };

      const getToolsUseFromContentBlocks = (
        contentBlocks: Anthropic.Messages.ContentBlock[],
      ): ToolCall[] | undefined => {
        const toolCalls: ToolCall[] = [];
        for (const block of contentBlocks) {
          const tool = getToolFromContentBlock(block);
          if (tool) {
            toolCalls.push(tool);
          }
        }
        return toolCalls.length > 0 ? toolCalls : undefined;
      };

      const toolCalls = getToolsUseFromContentBlocks(response.content);
      return {
        model: response.model,
        text: getFirstTextFromContentBlocks(response.content),
        finishReason: response.stop_reason,
        toolCalls: toolCalls,
        refusal: null,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools } = params;
      const formattedMessages = await formatMessages(messages);
      const formattedTools = this.formatTools(tools);
      const request: Anthropic.Messages.MessageCreateParamsNonStreaming = {
        system: options.systemMessage as string | undefined,
        model: options.model || this.defaultOptions.model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || this.defaultOptions.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topProbability,
        top_k: options.topKTokens,
        stop_sequences: options.stop
          ? Array.isArray(options.stop)
            ? options.stop
            : [options.stop]
          : undefined,
        tools: formattedTools,
      };
      const stream = await this.client.messages.create({ ...request, stream: true });

      const getTextDelta = (content: Anthropic.Messages.RawMessageStreamEvent): string | null => {
        if (content.type === 'content_block_delta' && content.delta.type == 'text_delta') {
          return content.delta.text;
        }
        if (content.type === 'content_block_delta' && content.delta.type == 'input_json_delta') {
          return content.delta.partial_json;
        }
        return null;
      };

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          yield {
            text: getTextDelta(chunk),
            finishReason: null,
            model: options.model || this.defaultOptions.model,
          };
        } else if (chunk.type === 'message_stop') {
          yield {
            text: null,
            finishReason: 'stop',
            model: options.model || this.defaultOptions.model,
          };
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    throw new LLMProviderError('Embedding generation is not supported by Anthropic', this.name);
  }

  private formatTools(tools?: Tool[]): Anthropic.Tool[] | undefined {
    if (!tools) return undefined;
    return tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));
  }

  private formatToolCalls(toolCalls?: any): ToolCall[] | undefined {
    //console.log('tool calls:');
    //console.dir(toolCalls, { depth: null });
    if (!toolCalls) return undefined;
    return toolCalls.map((toolCall: any) => ({
      id: toolCall.id,
      type: 'function',
      function: {
        name: toolCall.function.name,
        arguments: JSON.stringify(toolCall.function.arguments),
      },
    }));
  }

  protected handleError(error: unknown): never {
    const name = this.client instanceof AnthropicBedrock ? 'Anthropic Bedrock' : 'Anthropic';
    if (error instanceof Anthropic.APIError) {
      throw new LLMProviderError(`Anthropic API error: ${error.message}`, name);
    } else if (error instanceof Error) {
      throw new LLMProviderError(`Unexpected error: ${error.message}`, name);
    } else {
      throw new LLMProviderError(`Unknown error occurred: ${error}`, name);
    }
  }
}

```

## File: src/providers/anthropic/constants.ts

- Extension: .ts
- Language: typescript
- Size: 245 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
export const DEFAULT_AWS_BEDROCK_REGION = 'us-west-2';
export const DEFAULT_AWS_BEDROCK_PROFILE = 'bedrock';

export const DEFAULT_MODEL = 'anthropic.claude-3-haiku-20240307-v1:0';
export const DEFAULT_MAX_TOKENS = 128 * 1024; // 128,000 tokens

```

## File: src/providers/anthropic/aws-credentials.ts

- Extension: .ts
- Language: typescript
- Size: 2227 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { getCredentials } from '../../utils/cloud/aws/credential';
import { DEFAULT_AWS_BEDROCK_REGION } from './constants';

export const region = () => process.env.AWS_BEDROCK_REGION || DEFAULT_AWS_BEDROCK_REGION;
export const profile = () => process.env.AWS_BEDROCK_PROFILE;

export async function getAwsCredential() {
  const credentials = await getCredentials(region());
  return credentials;
}

export const createAwsBedrockAnthropicProvider = async () => {
  let client;

  try {
    if (process.env.AWS_BEDROCK_PROFILE) {
      // Clear static credentials if using profile
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_SESSION_TOKEN;

      process.env.AWS_PROFILE = process.env.AWS_BEDROCK_PROFILE; // Set AWS_PROFILE
      // Use profile-based credentials
      const credentials = await getAwsCredential(); // Ensure this function retrieves credentials based on the profile
      if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error('Failed to retrieve AWS credentials from profile.');
      }
      client = new AnthropicBedrock({
        awsAccessKey: credentials.accessKeyId,
        awsSecretKey: credentials.secretAccessKey,
        awsSessionToken: credentials.sessionToken, // Optional
        awsRegion: region(),
      });
    } else {
      // Fallback to environment variables
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be defined.');
      }
      delete process.env.AWS_PROFILE;

      client = new AnthropicBedrock({
        awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
        awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
        awsSessionToken: process.env.AWS_SESSION_TOKEN, // Optional
        awsRegion: region(),
      });
    }

    const { AnthropicProvider } = await import('./index');
    return new AnthropicProvider({ client });
  } catch (error) {
    console.error('Error creating AWS Bedrock Anthropic Provider:', error);
    throw error; // Rethrow the error after logging
  }
};

```

## File: src/providers/anthropic/message-util.ts

- Extension: .ts
- Language: typescript
- Size: 1861 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, isImageUrlContent, isTextContent, MessageContent } from '../../types';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as mime from 'mime-types';
import { imageToBase64 } from '../../utils';
import { extractMimeType } from '../../utils/images/image-to-base64';

export const formatMessage = async (message: ChatMessage): Promise<Anthropic.MessageParam> => {
  let content: string | Anthropic.MessageParam['content'];

  if (typeof message.content === 'string') {
    content = message.content;
  } else if (Array.isArray(message.content)) {
    content = await Promise.all(message.content.map(formatContent));
  } else {
    content = [await formatContent(message.content)];
  }

  return {
    role: message.role === 'user' ? 'user' : 'assistant',
    content,
  };
};

export async function formatMessages(messages: ChatMessage[]): Promise<Anthropic.MessageParam[]> {
  const formattedMessages = await Promise.all(messages.map(formatMessage));
  return formattedMessages;
}

export async function formatContent(
  content: MessageContent,
): Promise<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> {
  if (isTextContent(content)) {
    return {
      type: 'text',
      text: content.text,
    };
  } else if (isImageUrlContent(content)) {
    const base64Content = await imageToBase64(content.url);
    // Extract mime type from base64 string
    const imageContent: Anthropic.ImageBlockParam = {
      type: 'image',
      source: {
        type: 'base64',
        media_type: base64Content.mimeType as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp',
        data: base64Content.base64,
      },
    };
    return imageContent;
  }
  throw new Error('Unsupported content type');
}

```

## File: src/providers/mistral/index.ts

- Extension: .ts
- Language: typescript
- Size: 7093 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { Mistral } from '@mistralai/mistralai';

import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  LLMOptions,
  Model,
  ChatCompletionResponse,
  ChatCompletionParams,
  EmbeddingProvider,
  EmbeddingRequestParams,
  ChatStreamCompletionResponse,
  EmbeddingResponse,
  ToolCall,
} from '../../types';

const DEFAULT_MAX_TOKENS = 1024 * 4;
const DEFAULT_MODEL = 'mistral-small-latest';
const DEFAULT_EMBEDDING_MODEL = 'mistral-embed';

/**
 * MistralProvider class implements the LLMProvider interface for Mistral AI's language models.
 * It provides methods for generating messages, streaming messages, and generating embeddings.
 */
export class MistralProvider implements LLMProvider, EmbeddingProvider {
  public readonly version = '1.0.0';
  public readonly name = 'Mistral';

  constructor(private key?: string) {
    const apiKey = key ?? process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new AuthenticationError('Mistral API key MISTRAL_API_KEY is required', 'Mistral');
    }
  }

  private getKey() {
    const apiKey = this.key || process.env.MISTRAL_API_KEY || 'MISTRAL_API_KEY';

    if (!apiKey) {
      throw new AuthenticationError('Mistral API key MISTRAL_API_KEY is required', 'Mistral');
    }
    return this.key;
  }

  private getClient() {
    return new Mistral({ apiKey: this.getKey() });
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools } = params;

      const mistralsTools = this.prepareMistraTools(tools);

      const model = options.model || DEFAULT_MODEL;
      const response = await this.getClient().chat.complete({
        messages: messages.map((message) => ({
          role: message.role,
          content: Array.isArray(message.content)
            ? message.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
            : message.content.type === 'text'
              ? message.content.text
              : '',
        })),
        model: options.model || DEFAULT_MODEL,
        maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        tools: mistralsTools as any,
      });

      const responseContent = response.choices?.shift();
      const usage = response.usage;
      const messageAssistantContent = responseContent?.message.content || '';
      const toolCalls = responseContent?.message.toolCalls || [];
      const finishReason = responseContent?.finishReason || null;

      const toolCallResults: ToolCall[] = this.extractToolCallsResult(toolCalls);

      return {
        model: model,
        text: messageAssistantContent,
        finishReason: finishReason,
        toolCalls: toolCallResults,
        refusal: null,
        usage: usage,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  private prepareMistraTools(
    tools:
      | {
          function: { name: string; description: string; parameters?: any };
          type: 'function';
          strict?: boolean | undefined;
        }[]
      | undefined,
  ) {
    return (
      tools?.map((tool) => ({
        type: tool.type,
        function: {
          name: tool.function.name,
          description: tool.function.description,
          arguments: tool.function.parameters as string,
        },
      })) || undefined
    );
  }

  private extractToolCallsResult(toolCalls: any): ToolCall[] {
    return toolCalls.map((mistralToolCall: any) => {
      const toolCall: ToolCall = {
        id: mistralToolCall.id || mistralToolCall.function.name,
        type: 'function',
        function: {
          name: mistralToolCall.function.name,
          arguments: mistralToolCall.function.arguments as string,
        },
      };
      return toolCall;
    });
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools } = params;

      const mistralsTools = this.prepareMistraTools(tools);

      const model = options.model || DEFAULT_MODEL;
      const response = await this.getClient().chat.stream({
        messages: messages.map((message) => ({
          role: message.role,
          content: Array.isArray(message.content)
            ? message.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
            : message.content.type === 'text'
              ? message.content.text
              : '',
        })),
        model: options.model || DEFAULT_MODEL,
        maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        tools: mistralsTools as any,
      });

      for await (const chunk of response) {
        const content = chunk.data.choices[0]?.delta.content;
        const finishReason = chunk.data.choices[0]?.finishReason;

        const result: ChatStreamCompletionResponse = {
          text: content || null,
          finishReason: finishReason || null,
          model: model,
        };

        yield result;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    try {
      const { content, model } = input;
      const modelId = model || DEFAULT_EMBEDDING_MODEL;

      if (typeof content !== 'string') {
        throw new InvalidRequestError(
          'Mistral AI requires a string input for embeddings',
          'Mistral',
        );
      }

      const response = await this.getClient().embeddings.create({
        model: modelId,
        inputs: [content],
        encodingFormat: 'json',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding generated');
      }

      const embeddingResult: EmbeddingResponse = {
        embedding: response.data[0]?.embedding || [],
        embeddings: response.data.map((d: any) => d.embedding),
      };

      return embeddingResult;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<Model[]> {
    const models = await this.getClient().models.list();

    const modelList: Model[] =
      models.data?.map((model) => ({
        id: model.id || model.name || '',
        name: model.name || model.id,
        created: model.created ? new Date(model.created) : new Date(),
        description: model.description || model.name || '',
      })) || [];
    return modelList;
  }

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new AuthenticationError('Authentication failed with Mistral AI', 'Mistral');
      } else if (error.message.includes('429')) {
        throw new RateLimitError('Rate limit exceeded for Mistral AI', 'Mistral');
      } else {
        throw new InvalidRequestError(`Mistral AI request failed: ${error.message}`, 'Mistral');
      }
    } else {
      throw new InvalidRequestError(`Unknown error occurred: ${error}`, 'Mistral');
    }
  }
}

```

## File: src/providers/openrouter/index.ts

- Extension: .ts
- Language: typescript
- Size: 4743 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import axios from 'axios';
import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  LLMOptions,
  Model,
  ChatCompletionResponse,
  ChatCompletionParams,
  ChatStreamCompletionResponse,
  BaseLLMProvider,
} from '../../types';
import { OpenAIProvider } from '../openai';

const DEFAULT_MAX_TOKENS = 1024 * 32;
const BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'qwen/qwen-2-7b-instruct:free';

export class OpenRouterProvider extends BaseLLMProvider implements LLMProvider {
  private openAIProvider: OpenAIProvider;
  private apiKey: string;
  public readonly version = '1.0.0';
  public readonly name = 'OpenRouter';
  private baseURL = BASE_URL;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey ?? process.env.OPENROUTER_API_KEY ?? '';
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not found');
    }
    this.openAIProvider = new OpenAIProvider(this.apiKey, this.baseURL);
  }

  public defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  private async makeRequest(endpoint: string, method: 'GET' | 'POST', data?: any) {
    try {
      const response = await axios({
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<Model[]> {
    const response = await this.makeRequest('/models', 'GET');

    // Check if the response has a 'data' property that contains the array of models
    const models = response.data || response;

    if (!Array.isArray(models)) {
      throw new Error('Unexpected response format from OpenRouter API');
    }

    return models.map((model: any) => ({
      id: model.id,
      name: model.name,
      description: `${model.name} - Context: ${model.context_length}, Price: ${model.pricing.prompt} per prompt token`,
      created: new Date(),
    }));
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getOptions(options);

      const response = await this.openAIProvider.generateChatCompletion({
        messages: messages,
        options: {
          ...filteredOptions,
          model,
        },
        tools,
        toolChoice,
        parallelToolCalls,
        responseFormat,
      });

      return {
        ...response,
        model,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getOptions(options);

      const stream = this.openAIProvider.streamChatCompletion({
        messages: messages,
        options: {
          ...filteredOptions,
          model,
        },
        tools,
        toolChoice,
        parallelToolCalls,
        responseFormat,
      });

      for await (const chunk of stream) {
        yield {
          ...chunk,
          model,
        };
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private getOptions(options: LLMOptions): LLMOptions {
    const optionsToInclude = {
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topProbability,
      top_k: options.topKTokens,
      presence_penalty: options.presencePenalty,
      frequency_penalty: options.frequencyPenalty,
    };

    return Object.fromEntries(
      Object.entries(optionsToInclude).filter(([_, v]) => v != null),
    ) as unknown as LLMOptions;
  }

  protected handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new AuthenticationError('Authentication failed with OpenRouter', 'OpenRouter');
      } else if (error.response?.status === 429) {
        throw new RateLimitError('Rate limit exceeded for OpenRouter', 'OpenRouter');
      } else if (error.response?.status === 400) {
        throw new InvalidRequestError(
          `OpenRouter request failed: ${error.response.data.error}`,
          'OpenRouter',
        );
      }
    }
    throw new InvalidRequestError(`Unexpected error: ${error}`, 'OpenRouter');
  }
}

```

## File: src/providers/perplexity/index.ts

- Extension: .ts
- Language: typescript
- Size: 5816 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { OpenAIProvider } from '../openai';
import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  ChatMessage,
  LLMOptions,
  Model,
  ChatCompletionResponse,
  ChatCompletionParams,
  EmbeddingProvider,
  EmbeddingRequestParams,
  ChatStreamCompletionResponse,
  EmbeddingResponse,
  ChatMessageWithSystem,
} from '../../types';
import { ALL_PERPLEXITY_MODELS, DEFAULT_PERPLEXITY_MODEL } from './models';

const DEFAULT_MAX_TOKENS = 1024 * 32;
const DEFAULT_MODEL = 'mixtral-8x7b-instruct';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * PerplexityProvider class implements the LLMProvider interface for Perplexity's language models.
 * It provides methods for generating messages, streaming messages, and generating embeddings.
 */
export class PerplexityProvider implements LLMProvider, EmbeddingProvider {
  private openAIProvider: OpenAIProvider;
  public readonly version = '1.0.0';
  public readonly name = 'Perplexity';
  private baseURL = 'https://api.perplexity.ai';

  constructor(private key?: string) {
    const apiKey = key ?? process.env.PERPLEXITY_API;
    if (!apiKey) {
      throw new Error('Perplexity API key or PERPLEXITY_API not found in environment variables');
    }
    this.openAIProvider = new OpenAIProvider(apiKey, this.baseURL);
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_PERPLEXITY_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  private getOptions(options: LLMOptions): LLMOptions {
    // Remove undefined and null values
    const optionsToInclude: Partial<LLMOptions> = {
      temperature: options.temperature,
      model: options.model,
      maxTokens: options.maxTokens,
      // Explicitly unset logprobs and topLogprobs
      logprobs: undefined,
      topLogprobs: undefined,
    };

    const filteredOptions = Object.fromEntries(
      Object.entries(optionsToInclude)
        .filter(([_, v]) => v != null)
        .filter(([_, v]) => v !== undefined),
    ) as unknown as LLMOptions;

    // console.log('filteredOptions 🔥 🍵: ', filteredOptions);

    return filteredOptions;
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getOptions(options);

      const chatRequest: ChatCompletionParams = {
        messages: messages,
        options: {
          ...filteredOptions, // Include filtered options
          model,
        },
        tools,
        toolChoice,
        parallelToolCalls,
        responseFormat,
      };

      // console.log('chatRequest 🔥: ', chatRequest);
      // console.dir(chatRequest, { depth: null });

      const response = await this.openAIProvider.generateChatCompletion(chatRequest);

      return {
        ...response,
        model,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getOptions(options);

      const chatRequest: ChatCompletionParams = {
        messages: messages,
        options: {
          ...filteredOptions, // Include filtered options
          model,
        },
        tools,
        toolChoice,
        parallelToolCalls,
        responseFormat,
      };

      // console.log('chatRequest 🔥 🍵: ', chatRequest);
      // console.dir(chatRequest, { depth: null });

      const stream = this.openAIProvider.streamChatCompletion(chatRequest);

      for await (const chunk of stream) {
        yield {
          ...chunk,
          model,
        };
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    try {
      const { content, model } = input;
      const modelId = model || DEFAULT_EMBEDDING_MODEL;

      return await this.openAIProvider.generateEmbedding({
        content,
        model: modelId,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<Model[]> {
    return Object.values(ALL_PERPLEXITY_MODELS).map((model) => ({
      id: model.id,
      name: model.name,
      description: `${model.name} - ${model.parameterCount} parameters, ${model.contextLength} context length`,
      created: new Date(), // You might want to add actual creation dates if available
    }));
  }

  private withSystemMessage(options: LLMOptions, messages: ChatMessage[]): ChatMessageWithSystem[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [
          {
            role: 'system',
            content: { type: 'text', text: options.systemMessage },
          },
          ...messages,
        ]
      : messages;
  }

  private handleError(error: unknown): never {
    if (error instanceof AuthenticationError) {
      throw new AuthenticationError('Authentication failed with Perplexity', 'Perplexity');
    } else if (error instanceof RateLimitError) {
      throw new RateLimitError('Rate limit exceeded for Perplexity', 'Perplexity');
    } else if (error instanceof InvalidRequestError) {
      throw new InvalidRequestError(`Perplexity request failed: ${error.message}`, 'Perplexity');
    } else if (error instanceof Error) {
      throw new InvalidRequestError(`Unexpected error: ${error.message}`, 'Perplexity');
    } else {
      throw new InvalidRequestError(`Unknown error occurred: ${error}`, 'Perplexity');
    }
  }
}

```

## File: src/providers/perplexity/models.ts

- Extension: .ts
- Language: typescript
- Size: 1856 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
// Perplexity Sonar Models
export const PERPLEXITY_SONAR_MODELS = {
  SONAR_SMALL_ONLINE: {
    id: 'llama-3.1-sonar-small-128k-online',
    name: 'Llama 3.1 Sonar Small 128K (Online)',
    parameterCount: '8B',
    contextLength: 127072,
    type: 'Chat Completion',
  },
  SONAR_LARGE_ONLINE: {
    id: 'llama-3.1-sonar-large-128k-online',
    name: 'Llama 3.1 Sonar Large 128K (Online)',
    parameterCount: '70B',
    contextLength: 127072,
    type: 'Chat Completion',
  },
  SONAR_HUGE_ONLINE: {
    id: 'llama-3.1-sonar-huge-128k-online',
    name: 'Llama 3.1 Sonar Huge 128K (Online)',
    parameterCount: '405B',
    contextLength: 127072,
    type: 'Chat Completion',
  },
};

// Perplexity Chat Models
export const PERPLEXITY_CHAT_MODELS = {
  SONAR_SMALL_CHAT: {
    id: 'llama-3.1-sonar-small-128k-chat',
    name: 'Llama 3.1 Sonar Small 128K (Chat)',
    parameterCount: '8B',
    contextLength: 131072,
    type: 'Chat Completion',
  },
  SONAR_LARGE_CHAT: {
    id: 'llama-3.1-sonar-large-128k-chat',
    name: 'Llama 3.1 Sonar Large 128K (Chat)',
    parameterCount: '70B',
    contextLength: 131072,
    type: 'Chat Completion',
  },
};

// Open-Source Models
export const PERPLEXITY_OPEN_SOURCE_MODELS = {
  LLAMA_8B_INSTRUCT: {
    id: 'llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    parameterCount: '8B',
    contextLength: 131072,
    type: 'Chat Completion',
  },
  LLAMA_70B_INSTRUCT: {
    id: 'llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    parameterCount: '70B',
    contextLength: 131072,
    type: 'Chat Completion',
  },
};

// All Perplexity Models
export const ALL_PERPLEXITY_MODELS = {
  ...PERPLEXITY_SONAR_MODELS,
  ...PERPLEXITY_CHAT_MODELS,
  ...PERPLEXITY_OPEN_SOURCE_MODELS,
};

// Default model
export const DEFAULT_PERPLEXITY_MODEL = PERPLEXITY_SONAR_MODELS.SONAR_SMALL_ONLINE.id;

```

## File: src/providers/openai/index.ts

- Extension: .ts
- Language: typescript
- Size: 9990 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import OpenAI from 'openai';
import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  ChatMessage,
  LLMOptions,
  Model,
  ChatCompletionResponse,
  ChatCompletionParams,
  EmbeddingProvider,
  EmbeddingRequestParams,
  ChatStreamCompletionResponse,
  EmbeddingResponse,
  Tool,
  ChatMessageWithSystem,
} from '../../types';
import {
  ChatCompletionMessageParam as ChatCompletionMessageParamOpenAI,
  ChatCompletionContentPart as ChatCompletionContentPartOpenAI,
  ChatCompletionTool as ChatCompletionToolOpenAI,
  ChatCompletionCreateParamsStreaming as ChatCompletionCreateParamsStreamingOpenAI,
  ChatCompletionCreateParamsNonStreaming as ChatCompletionCreateParamsNonStreamingOpenAI,
} from 'openai/resources/chat/completions';
import { createBase64Url, imageToBase64 } from '../../utils/images/image-to-base64';

const DEFAULT_MAX_TOKENS = 1024 * 8;
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * OpenAIProvider class implements the LLMProvider interface for OpenAI's language models.
 * It provides methods for generating messages, streaming messages, and generating embeddings.
 */
export class OpenAIProvider implements LLMProvider, EmbeddingProvider {
  private client: OpenAI;
  public readonly version = '1.0.0';
  public readonly name = 'OpenAI';

  constructor(key?: string, baseUrl?: string) {
    const apiKey = key ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    this.client = new OpenAI({ apiKey, baseURL: baseUrl });
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  private getFilteredOptions(options: LLMOptions): LLMOptions {
    const optionsToInclude = {
      temperature: options.temperature,
      top_p: options.topProbability,
      seed: options.seed,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      // Remove logprobs from here
      // logprobs: options.logitBias,
      // top_logprobs: options.topLogprobs,
    };

    const filteredOptions = Object.fromEntries(
      Object.entries(optionsToInclude)
        .filter(([_, value]) => value !== undefined)
        .filter(([_, value]) => value !== null),
    ) as unknown as LLMOptions;

    return filteredOptions;
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = tools ? this.formatTools(tools) : undefined;

      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getFilteredOptions(options);

      const chatRequest: ChatCompletionCreateParamsNonStreamingOpenAI = {
        messages: formattedMessages,
        tools: formattedTools,
        parallel_tool_calls: parallelToolCalls,
        response_format: responseFormat,
        tool_choice: toolChoice,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        ...filteredOptions,
        // Ensure logprobs is a boolean
        logprobs: typeof options.logprobs === 'boolean' ? options.logprobs : undefined,
        model: model,
      };

      const response = await this.client.chat.completions.create(chatRequest);

      const firstResponse = response.choices[0];
      const usage = response.usage;
      return {
        model: model,
        text: firstResponse?.message?.content || '',
        finishReason: firstResponse?.finish_reason,
        toolCalls: firstResponse?.message?.tool_calls,
        refusal: firstResponse?.message?.refusal,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = tools ? this.formatTools(tools) : undefined;

      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getFilteredOptions(options);

      const chatRequest: ChatCompletionCreateParamsStreamingOpenAI = {
        messages: formattedMessages,
        tools: formattedTools,
        parallel_tool_calls: parallelToolCalls,
        response_format: responseFormat,
        tool_choice: toolChoice,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        ...filteredOptions,
        // Ensure logprobs is a boolean
        logprobs: typeof options.logprobs === 'boolean' ? options.logprobs : undefined,
        model: model,
        stream: true,
      };
      const stream = await this.client.chat.completions.create(chatRequest);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        const _usage = chunk.usage;
        const finishReason = chunk.choices[0]?.finish_reason;
        const result: ChatStreamCompletionResponse = {
          text: content || null,
          finishReason: finishReason,
          model: model,
        };
        yield result;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    try {
      const { content, model } = input;

      const modelId = model || DEFAULT_EMBEDDING_MODEL;

      const response = await this.client.embeddings.create({
        model: modelId,
        input: content,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding generated');
      }

      const embeddingResult: EmbeddingResponse = {
        embedding: response.data[0]?.embedding || [],
        embeddings: response.data.map((item) => item.embedding),
      };

      return embeddingResult;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<Model[]> {
    try {
      const { data } = await this.client.models.list();
      return data.map(({ id, created, owned_by }) => ({
        id,
        name: id,
        created: new Date(created * 1000),
        description: `${id} - ${owned_by} - created at ${new Date(created * 1000)}`,
      }));
    } catch (error) {
      this.handleError(error);
    }
  }

  private withSystemMessage(options: LLMOptions, messages: ChatMessage[]): ChatMessageWithSystem[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [{ role: 'system', content: { type: 'text', text: options.systemMessage } }, ...messages]
      : messages;
  }

  private async formatMessages(
    messages: ChatMessageWithSystem[],
  ): Promise<ChatCompletionMessageParamOpenAI[]> {
    const formattedMessages: ChatCompletionMessageParamOpenAI[] = [];

    for (const message of messages) {
      const formattedMessage: ChatCompletionMessageParamOpenAI = {
        role: message.role,
        content: '', // Initialize with an empty string
      };

      if (Array.isArray(message.content)) {
        const contentParts: ChatCompletionContentPartOpenAI[] = [];
        for (const content of message.content) {
          if (content.type === 'text') {
            contentParts.push({ type: 'text', text: content.text });
          } else if (content.type === 'image_url') {
            // Check if the URL is a local file or a remote URL
            if (content.url.startsWith('http://') || content.url.startsWith('https://')) {
              // Handle remote URL (if needed, you can implement fetching here)
              contentParts.push({
                type: 'image_url',
                image_url: { url: content.url }, // Keep the URL as is for remote
              } as ChatCompletionContentPartOpenAI); // Type assertion
            } else {
              // Convert local image file to base64
              const contentImage = await imageToBase64(content.url);
              const urlBase64Image = createBase64Url(contentImage.mimeType, contentImage.base64);
              contentParts.push({
                type: 'image_url',
                image_url: { url: urlBase64Image }, // Use the base64 image
              } as ChatCompletionContentPartOpenAI); // Type assertion
            }
          }
        }
        formattedMessage.content = contentParts;
      } else {
        if (message.content.type === 'text') {
          formattedMessage.content = message.content.text;
        }
      }

      formattedMessages.push(formattedMessage);
    }

    return formattedMessages;
  }

  private formatTools(tools?: Tool[]): ChatCompletionToolOpenAI[] | undefined {
    if (!tools) return undefined;
    return tools.map((tool) => ({
      ...tool,
    }));
  }

  private handleError(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new AuthenticationError('Authentication failed with OpenAI', 'OpenAI');
      } else if (error.status === 429) {
        throw new RateLimitError('Rate limit exceeded for OpenAI', 'OpenAI');
      } else {
        throw new InvalidRequestError(`OpenAI request failed: ${error.message}`, 'OpenAI');
      }
    } else if (error instanceof Error) {
      throw new InvalidRequestError(`Unexpected error: ${error.message}`, 'OpenAI');
    } else {
      throw new InvalidRequestError(`Unknown error occurred: ${error}`, 'OpenAI');
    }
  }
}

```

## File: src/storage/sqlite-conversation-storage-provider.ts

- Extension: .ts
- Language: typescript
- Size: 5847 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
/*import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { 
  Conversation, 
  ConversationId, 
  ConversationMetadata, 
  StorageProvider,
  ConversationMessage,
} from "../types";

export class SQLiteConversationStorageProvider implements StorageProvider {
  private db: Database | null = null;

  constructor(private dbPath: string) {}

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      await this.initializeTables();
    }
    return this.db;
  }

  private async initializeTables(): Promise<void> {
    const db = await this.getDb();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        metadata TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        provider_id TEXT NOT NULL,
        options TEXT,
        metadata TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );
      CREATE TABLE IF NOT EXISTS active_providers (
        conversation_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        PRIMARY KEY (conversation_id, provider_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );
    `);
  }

  async save(conversation: Conversation): Promise<void> {
    const db = await this.getDb();
    await db.run('BEGIN TRANSACTION');
    try {
      // Save conversation metadata
      await db.run(
        'INSERT OR REPLACE INTO conversations (id, metadata) VALUES (?, ?)',
        conversation.id,
        JSON.stringify(conversation.metadata)
      );

      // Delete existing messages and active providers
      await db.run('DELETE FROM messages WHERE conversation_id = ?', conversation.id);
      await db.run('DELETE FROM active_providers WHERE conversation_id = ?', conversation.id);

      // Save messages
      for (const message of conversation.messages) {
        await db.run(
          'INSERT INTO messages (id, conversation_id, role, content, timestamp, provider_id, options, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          message.id,
          conversation.id,
          message.role,
          JSON.stringify(message.content),
          message.timestamp.toISOString(),
          message.providerId,
          JSON.stringify(message.options),
          JSON.stringify(message.metadata)
        );
      }

      // Save active providers
      for (const providerId of conversation.activeProviders) {
        await db.run(
          'INSERT INTO active_providers (conversation_id, provider_id) VALUES (?, ?)',
          conversation.id,
          providerId
        );
      }

      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  async load(id: ConversationId): Promise<Conversation | null> {
    const db = await this.getDb();
    const conversationRow = await db.get('SELECT * FROM conversations WHERE id = ?', id);
    if (!conversationRow) return null;

    const messages = await db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp', id);
    const activeProviders = await db.all('SELECT provider_id FROM active_providers WHERE conversation_id = ?', id);

    return {
      id: conversationRow.id,
      metadata: JSON.parse(conversationRow.metadata),
      messages: messages.map(m => ({
        id: m.id,
        role: m.role as ConversationMessage['role'],
        content: JSON.parse(m.content),
        timestamp: new Date(m.timestamp),
        providerId: m.provider_id,
        options: m.options ? JSON.parse(m.options) : undefined,
        metadata: m.metadata ? JSON.parse(m.metadata) : undefined
      })),
      activeProviders: new Set(activeProviders.map(ap => ap.provider_id))
    };
  }

  async delete(id: ConversationId): Promise<void> {
    const db = await this.getDb();
    await db.run('BEGIN TRANSACTION');
    try {
      await db.run('DELETE FROM messages WHERE conversation_id = ?', id);
      await db.run('DELETE FROM active_providers WHERE conversation_id = ?', id);
      await db.run('DELETE FROM conversations WHERE id = ?', id);
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  async list(): Promise<ConversationMetadata[]> {
    const db = await this.getDb();
    const rows = await db.all('SELECT id, metadata FROM conversations');
    return rows.map(row => ({
      id: row.id,
      ...JSON.parse(row.metadata)
    }));
  }

  async listConversations(): Promise<Conversation[]> {
    const db = await this.getDb();
    const conversations = await db.all('SELECT * FROM conversations');
    return Promise.all(conversations.map(async (conv) => {
      const messages = await db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp', conv.id);
      const activeProviders = await db.all('SELECT provider_id FROM active_providers WHERE conversation_id = ?', conv.id);
      return {
        id: conv.id,
        metadata: JSON.parse(conv.metadata),
        messages: messages.map(m => ({
          id: m.id,
          role: m.role as ConversationMessage['role'],
          content: JSON.parse(m.content),
          timestamp: new Date(m.timestamp),
          providerId: m.provider_id,
          options: m.options ? JSON.parse(m.options) : undefined,
          metadata: m.metadata ? JSON.parse(m.metadata) : undefined
        })),
        activeProviders: new Set(activeProviders.map(ap => ap.provider_id))
      };
    }));
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}*/

```

## File: src/storage/index.ts

- Extension: .ts
- Language: typescript
- Size: 878 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { StorageProvider } from '../types';
import { InMemoryStorageProvider } from './in-memory-storage-provider';
//import { SQLiteConversationStorageProvider } from './sqlite-conversation-storage-provider';

export type StorageProviderName = 'in-memory' | 'sqlite';

export default function createStorageProvider(
  name: StorageProviderName,
  {
    dbPath,
  }: {
    dbPath?: string;
  },
): StorageProvider | undefined {
  // Updated return type to include undefined
  switch (name.toLowerCase()) {
    case 'in-memory':
      return new InMemoryStorageProvider();
    case 'local':
      if (!dbPath) {
        throw new Error('dbPath must be provided for SQLite storage provider');
      }
      // ... handle SQLite storage provider ...
      return; // Added return statement for 'local' case
  }
  return undefined; // Added return statement for cases not handled
}

```

## File: src/storage/in-memory-storage-provider.ts

- Extension: .ts
- Language: typescript
- Size: 983 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```typescript
import { Conversation, ConversationId, ConversationMetadata, StorageProvider } from '../types';

export class InMemoryStorageProvider implements StorageProvider {
  private conversations = new Map<ConversationId, Conversation>();

  async save(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.id, structuredClone(conversation));
  }

  async load(id: ConversationId): Promise<Conversation | null> {
    const conversation = this.conversations.get(id);
    return conversation ? structuredClone(conversation) : null;
  }

  async delete(id: ConversationId): Promise<void> {
    this.conversations.delete(id);
  }

  async list(): Promise<ConversationMetadata[]> {
    return Array.from(this.conversations.values()).map((conv) => conv.metadata);
  }

  // Implement the new listConversations method
  async listConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).map((conv) => structuredClone(conv));
  }
}

```

## File: prompts/create_story.yaml

- Extension: .yaml
- Language: yaml
- Size: 2207 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```yaml
name: create_satirical_story
version: '1.1'
description: Create a witty and satirical story based on a given subject
author: Raphaël MANSUY
input_variables:
  subject:
    type: string
    description: The main topic or event for the story
    place_holder: "Emmanuel Macron dissout l'assemblée"
  genre:
    type: string
    description: The specific genre or style of the story
    place_holder: 'Humour et satire politique'
  role:
    type: string
    description: The persona or character perspective to write from
    place_holder: 'Gaspar PROUST'
  lang:
    type: string
    description: The language in which the story should be written
    place_holder: 'Français'
  max_length:
    type: number
    description: The maximum word count for the story
    default: 1000
output_variables:
  story:
    type: string
    description: The complete satirical story

content: |
  Craft a satirical story about {{subject}} from the perspective of {{role}} in {{lang}}, adhering to the {{genre}} style. The story should not exceed {{max_length}} words.

  The story MUST WRITEN in {{lang}} LANGAGE.

  Follow these steps:

  1. Brainstorm 5-7 witty and subversive ideas related to the subject. Present these ideas in a markdown table with columns for "Idea" and "Satirical Angle".

  2. Select the top 3 ideas based on their potential for humor and social commentary.

  3. Develop a compelling outline for the story, incorporating the chosen ideas. Use markdown headers to structure the outline.

  4. Write the full story, ensuring it's engaging, humorous, and thought-provoking. Use markdown formatting to enhance readability and emphasis.

  5. Conclude with a punchy, memorable ending that ties back to the main subject.

  Format your response as follows:

  <ideas>
  | Idea | Satirical Angle |
  |------|-----------------|
  | Idea 1 | Angle 1 |
  | ... | ... |
  </ideas>

  <outline>
  ## Introduction
  - Point 1
  - Point 2

  ## Main Body
  ### Section 1
  - Subpoint a
  - Subpoint b

  ### Section 2
  - Subpoint a
  - Subpoint b

  ## Conclusion
  - Final thought
  </outline>

  <story>
  # Title of the Story

  [Your full story here, using markdown for formatting]

  </story>

  END.

```

## File: prompts/story.md

- Extension: .md
- Language: markdown
- Size: 301 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```markdown
Write a story aboout {{subject}} as {{role}} in {{lang}} max length.

Use the style of this {{author}}

1 - First find funny and subversive ideas format as a table
2 - Select the best 3 ideas
3 - Create the outline of the story
4 - Write the full story

Format markdown:

<ideas/>
<outline/>
<story/>

```

## File: package.json

- Extension: .json
- Language: json
- Size: 2765 bytes
- Created: 2024-11-05 17:05:45
- Modified: 2024-11-05 17:05:45

### Code

```json
{
  "name": "qllm-lib",
  "version": "3.6.2",
  "description": "Core library providing robust AI engineering functionalities tailored for Large Language Model (LLM) applications, enabling developers to build, deploy, and optimize AI solutions with ease.",
  "keywords": [
    "ai",
    "llm",
    "qllm",
    "library",
    "typescript",
    "aws-sdk"
  ],
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "types": "dist/tsc/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build:tsc": "tsc",
    "build:rollup": "rollup -c",
    "build": "npm run build:tsc && npm run build:rollup",
    "build:prod": "NODE_ENV=production npm run build",
    "clean": "rimraf dist",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "jest",
    "prepublishOnly": "npm run clean && npm run build:prod",
    "docs": "typedoc --options typedoc.json"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/quantalogic/qllm.git"
  },
  "bugs": {
    "url": "https://github.com/quantalogic/qllm/issues"
  },
  "homepage": "https://github.com/quantalogic/qllm#readme",
  "author": {
    "name": "QuantaLogic",
    "url": "https://quantalogic.com"
  },
  "license": "Apache-2.0",
  "devDependencies": {
    "@npmcli/fs": "^3.1.1",
    "@rollup/plugin-node-resolve": "15.2.3",
    "@rollup/plugin-terser": "0.4.4",
    "@types/jest": "^29.5.12",
    "@types/js-yaml": "^4.0.9",
    "@types/mime-types": "^2.1.4",
    "@types/node": "^22.5.0",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^8.2.0",
    "@typescript-eslint/parser": "^8.2.0",
    "eslint": "^9.9.1",
    "jest": "^29.7.0",
    "prettier": "^3.3.3",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.5.4"
  },
  "dependencies": {
    "@anthropic-ai/bedrock-sdk": "^0.10.2",
    "@anthropic-ai/sdk": "^0.27.0",
    "@aws-sdk/client-bedrock": "^3.645.0",
    "@aws-sdk/client-sso-oidc": "^3.645.0",
    "@aws-sdk/client-sts": "^3.645.0",
    "@aws-sdk/credential-providers": "^3.645.0",
    "@mistralai/mistralai": "1.0.4",
    "axios": "^1.7.5",
    "groq-sdk": "^0.5.0",
    "js-yaml": "^4.1.0",
    "mime-types": "^2.1.35",
    "node-gyp": "^10.2.0",
    "ollama": "^0.5.8",
    "openai": "^4.56.0",
    "sqlite": "^5.1.1",
    "uuid": "^10.0.0",
    "zod": "^3.23.8"
  },
  "overrides": {
    "glob": "^9.0.0",
    "rimraf": "^5.0.0",
    "@npmcli/move-file": "npm:@npmcli/fs@latest",
    "are-we-there-yet": "latest",
    "gauge": "latest",
    "@aws-sdk/client-sts": "^3.645.0",
    "@aws-sdk/credential-provider-node": "^3.645.0",
    "@aws-sdk/credential-provider-ini": "^3.645.0",
    "@aws-sdk/credential-provider-web-identity": "^3.645.0"
  },
  "publishConfig": {
    "access": "public"
  }
}

```

