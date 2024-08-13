import { Message } from './types';
import { z } from 'zod';
import {ToolsArraySchema} from "@qllm/types/src" 

/**
 * Represents the options for an LLM provider.
 */
export interface LLMProviderOptions {
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for response generation */
  temperature?: number;
  /** Top P for response generation */
  topP?: number;
  /** Top K for response generation */
  topK?: number;
  /** System message to set context */
  system?: string;
  /** Model to use for generation */
  model: string;
  /** AWS REGION */
  awsRegion?: string;
  /** AWS PROFIL */
  awsProfile?: string;
  /** Tools data */
  tools?: z.infer<typeof ToolsArraySchema>;
}

/**
 * Represents an LLM provider.
 */
export interface LLMProvider {
  /**
   * Generates a message using the LLM.
   * @param messages - The input messages.
   * @param options - The provider options.
   * @returns A promise that resolves to the generated message.
   */
  generateMessage: (messages: Message[], options: LLMProviderOptions) => Promise<string>;

  /**
   * Streams a message from the LLM.
   * @param messages - The input messages.
   * @param options - The provider options.
   * @returns An async iterable of message chunks.
   */
  streamMessage: (messages: Message[], options: LLMProviderOptions) => AsyncIterableIterator<string>;

  /**
   * Streams a message from the LLM.
   * @param messages - The input file.
   * @param options - The provider options.
   * @returns An async iterable of embedding files.
   */
  generateEmbedding?: (fileContent: Buffer, modelId: string) => Promise<number[]>;
}

export class LLMProviderError extends Error {
  constructor(message: string, public providerName: string) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

export class AuthenticationError extends LLMProviderError {}
export class RateLimitError extends LLMProviderError {}
export class InvalidRequestError extends LLMProviderError {}

export abstract class BaseLLMProvider implements LLMProvider {
  constructor(protected options: LLMProviderOptions) {}

  abstract generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string>;
  abstract streamMessage(messages: Message[], options: LLMProviderOptions): AsyncIterableIterator<string>;

  protected handleError(error: any): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new InvalidRequestError(error.message, this.constructor.name);
    } else {
      throw new InvalidRequestError(`Unknown error: ${error}`, this.constructor.name);
    }
  }

  protected withSystemMessage(options: LLMProviderOptions, messages: Message[]): Message[] {
    return options.system && options.system.length > 0
      ? [{ role: 'system', content: options.system }, ...messages]
      : messages;
  }
}