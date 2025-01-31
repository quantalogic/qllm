/**
 * @fileoverview Core provider interfaces and base classes for the QLLM library.
 * This file defines the fundamental contracts that all LLM providers must implement,
 * as well as base error handling and utility functionality.
 * 
 * @version 3.0.0
 * @license MIT
 */

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

/**
 * Base interface for all AI providers in the system.
 * Defines the minimal contract that any AI service must implement.
 */
export interface AIProvider {
  readonly name: string;
  readonly version: string;
  listModels(): Promise<Model[]>;
}

/**
 * Interface for providers that support text embedding generation.
 * Extends the base AIProvider interface with embedding-specific functionality.
 */
export interface EmbeddingProvider extends AIProvider {
  generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse>;
  listModels(): Promise<Model[]>;
}

/**
 * Core interface for Language Model providers.
 * Defines the contract for providers that support chat completion generation.
 */
export interface LLMProvider extends AIProvider {
  /** Default configuration options for the provider */
  defaultOptions: LLMOptions;
  
  /**
   * Generates a chat completion response.
   * @param params - Parameters for the chat completion request
   * @returns Promise resolving to the completion response
   */
  generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  
  /**
   * Generates a streaming chat completion response.
   * @param params - Parameters for the chat completion request
   * @returns AsyncIterator yielding completion response chunks
   */
  streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse>;
}

/**
 * Base error class for LLM provider errors.
 * Provides structured error information including provider context.
 */
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

/** Error thrown when provider authentication fails */
export class AuthenticationError extends LLMProviderError {}
/** Error thrown when provider rate limits are exceeded */
export class RateLimitError extends LLMProviderError {}
/** Error thrown for invalid request parameters */
export class InvalidRequestError extends LLMProviderError {}

/**
 * Options for configuring an AI provider with optional configuration and API key
 */
export interface ProviderOptions<Config = Record<string, unknown>> {
  /** Optional configuration specific to the provider */
  config?: Config;
  /** API key for authentication with the provider */
  apiKey?: string;
}

/**
 * Abstract base class implementing common LLM provider functionality.
 * Provides default implementations and utility methods for concrete providers.
 */
export abstract class BaseLLMProvider implements LLMProvider {
  public supportsEmbedding = false;
  public supportsImageAnalysis = false;
  public version = '3.0.0';
  public abstract name: string;

  abstract listModels(): Promise<Model[]>;
  abstract defaultOptions: LLMOptions;
  abstract generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  abstract streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse>;

  /**
   * Standardized error handling for LLM providers.
   * @param error - The error to handle
   * @throws {LLMProviderError} Wrapped provider-specific error
   */
  protected handleError(error: unknown): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new InvalidRequestError(error.message, this.constructor.name);
    } else {
      throw new InvalidRequestError(`Unknown error: ${error}`, this.constructor.name);
    }
  }

  /**
   * Prepends a system message to the chat messages if specified in options.
   * @param options - LLM options containing optional system message
   * @param messages - Array of chat messages
   * @returns Messages array with system message prepended if present
   */
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

/**
 * Abstract base class implementing common embedding provider functionality.
 * Provides default implementations and utility methods for concrete embedding providers.
 */
export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  public version = '1.0.0';
  public abstract name: string;

  abstract generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse>;
  abstract listModels(): Promise<Model[]>;

  /**
   * Standardized error handling for embedding providers.
   * @param error - The error to handle
   * @throws {LLMProviderError} Wrapped provider-specific error
   */
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
