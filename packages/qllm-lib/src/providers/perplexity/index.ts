/**
 * @fileoverview Perplexity provider implementation for the QLLM library.
 * This module implements both LLMProvider and EmbeddingProvider interfaces for Perplexity's language models.
 * 
 * @module providers/perplexity
 * @version 1.0.0
 * 
 * @remarks
 * Perplexity AI provides access to powerful language models including:
 * - Sonar models with real-time information access
 * - Chat models optimized for conversations
 * - Open-source Llama 3.1 models
 * - Text embedding capabilities
 * 
 * The provider uses an OpenAI-compatible API format and supports:
 * - Chat completions (streaming and non-streaming)
 * - Text embeddings
 * - Advanced parameter control
 * - System messages
 */

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

/** Maximum number of tokens for completion requests */
const DEFAULT_MAX_TOKENS = 1024 * 32;

/** Default model for chat completions */
const DEFAULT_MODEL = 'mixtral-8x7b-instruct';

/** Default model for embeddings */
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Perplexity provider implementation that supports both chat completions and embeddings.
 * This class implements both LLMProvider and EmbeddingProvider interfaces.
 * 
 * @implements {LLMProvider}
 * @implements {EmbeddingProvider}
 * 
 * @remarks
 * The provider offers comprehensive access to Perplexity's capabilities:
 * - Multiple model families (Sonar, Chat, Open-source)
 * - Real-time information access through Sonar models
 * - Streaming and non-streaming completions
 * - Text embeddings for vector operations
 * - System message support
 * 
 * @example
 * ```typescript
 * // Initialize provider
 * const provider = new PerplexityProvider('pplx-...');
 * 
 * // Generate completion
 * const response = await provider.generateChatCompletion({
 *   messages: [{ role: 'user', content: { type: 'text', text: 'Hello!' } }],
 *   options: { model: 'llama-3.1-70b-instruct' }
 * });
 * 
 * // Generate embeddings
 * const embeddings = await provider.generateEmbedding({
 *   content: 'Hello, world!',
 *   model: 'text-embedding-3-small'
 * });
 * ```
 */
export class PerplexityProvider implements LLMProvider, EmbeddingProvider {
  private openAIProvider: OpenAIProvider;
  public readonly version = '1.0.0';
  public readonly name = 'Perplexity';
  private baseURL = 'https://api.perplexity.ai';

  /**
   * Creates a new Perplexity provider instance.
   * 
   * @param {string} [key] - Optional API key. If not provided, uses PERPLEXITY_API environment variable
   * @throws {Error} If no API key is found in environment variables when not provided
   * 
   * @example
   * ```typescript
   * // Using environment variable
   * const provider = new PerplexityProvider();
   * 
   * // Using explicit API key
   * const provider = new PerplexityProvider('pplx-...');
   * ```
   */
  constructor(private key?: string) {
    const apiKey = key ?? process.env.PERPLEXITY_API;
    if (!apiKey) {
      throw new Error('Perplexity API key or PERPLEXITY_API not found in environment variables');
    }
    this.openAIProvider = new OpenAIProvider(apiKey, this.baseURL);
  }

  /** Default options for LLM requests */
  defaultOptions: LLMOptions = {
    model: DEFAULT_PERPLEXITY_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  /**
   * Filters and formats LLM options for Perplexity API requests.
   * 
   * @private
   * @param {LLMOptions} options - Raw options to filter
   * @returns {LLMOptions} Filtered options object
   * 
   * @remarks
   * This method ensures that only valid options are sent to the API by:
   * - Removing undefined and null values
   * - Explicitly unsetting unsupported options
   * - Converting options to the correct format
   */
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

  /**
   * Generates a chat completion using Perplexity's API.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @param {ChatMessage[]} params.messages - Array of messages in the conversation
   * @param {LLMOptions} params.options - Model and generation options
   * @param {Tool[]} [params.tools] - Optional tools for function calling
   * @param {string} [params.toolChoice] - Optional tool selection strategy
   * @param {number} [params.parallelToolCalls] - Optional number of parallel tool calls
   * @param {Object} [params.responseFormat] - Optional response format specification
   * @returns {Promise<ChatCompletionResponse>} Response containing generated text and metadata
   * @throws {AuthenticationError} On authentication failures
   * @throws {RateLimitError} On rate limit exceeded
   * @throws {InvalidRequestError} On invalid request parameters
   * 
   * @example
   * ```typescript
   * const response = await provider.generateChatCompletion({
   *   messages: [
   *     { role: 'system', content: { type: 'text', text: 'You are a helpful assistant.' } },
   *     { role: 'user', content: { type: 'text', text: 'Hello!' } }
   *   ],
   *   options: {
   *     model: 'llama-3.1-70b-instruct',
   *     temperature: 0.7,
   *     maxTokens: 500
   *   }
   * });
   * ```
   */
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

  /**
   * Generates a streaming chat completion using Perplexity's API.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @returns {AsyncIterableIterator<ChatStreamCompletionResponse>} Stream of completion chunks
   * @throws {AuthenticationError} On authentication failures
   * @throws {RateLimitError} On rate limit exceeded
   * @throws {InvalidRequestError} On invalid request parameters
   * 
   * @remarks
   * The stream provides real-time updates as the model generates text.
   * Each chunk contains:
   * - text: The generated text fragment
   * - finishReason: Reason for completion (if final chunk)
   * - model: The model used for generation
   * 
   * @example
   * ```typescript
   * const stream = provider.streamChatCompletion({
   *   messages: [{ role: 'user', content: { type: 'text', text: 'Tell me a story...' } }],
   *   options: { model: 'llama-3.1-70b-instruct' }
   * });
   * 
   * for await (const chunk of stream) {
   *   process.stdout.write(chunk.text || '');
   * }
   * ```
   */
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

  /**
   * Generates embeddings for given text content using Perplexity's API.
   * 
   * @param {EmbeddingRequestParams} input - Parameters for embedding generation
   * @param {string | string[]} input.content - Text to generate embeddings for
   * @param {string} [input.model] - Optional model to use (defaults to text-embedding-3-small)
   * @returns {Promise<EmbeddingResponse>} Generated embeddings
   * @throws {AuthenticationError} On authentication failures
   * @throws {RateLimitError} On rate limit exceeded
   * @throws {InvalidRequestError} On invalid input
   * 
   * @example
   * ```typescript
   * const embeddings = await provider.generateEmbedding({
   *   content: 'Hello, world!',
   *   model: 'text-embedding-3-small'
   * });
   * ```
   */
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

  /**
   * Lists available models from Perplexity's predefined model list.
   * 
   * @returns {Promise<Model[]>} List of available models with metadata
   * 
   * @example
   * ```typescript
   * const models = await provider.listModels();
   * console.log(models.map(m => m.id));
   * // Example output: ['llama-3.1-70b-instruct', 'llama-3.1-sonar-small-128k-online']
   * ```
   */
  async listModels(): Promise<Model[]> {
    return Object.values(ALL_PERPLEXITY_MODELS).map((model) => ({
      id: model.id,
      name: model.name,
      description: `${model.name} - ${model.parameterCount} parameters, ${model.contextLength} context length`,
      created: new Date(), // You might want to add actual creation dates if available
    }));
  }

  /**
   * Adds system message to the chat messages if provided in options.
   * 
   * @private
   * @param {LLMOptions} options - Options containing potential system message
   * @param {ChatMessage[]} messages - Original chat messages
   * @returns {ChatMessageWithSystem[]} Messages with system message prepended if provided
   */
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

  /**
   * Handles errors from Perplexity's API, converting them to appropriate error types.
   * 
   * @private
   * @param {unknown} error - Error from API call
   * @throws {AuthenticationError} On authentication failures
   * @throws {RateLimitError} On rate limit exceeded
   * @throws {InvalidRequestError} On invalid requests or unexpected errors
   */
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
