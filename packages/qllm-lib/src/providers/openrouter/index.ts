/**
 * @fileoverview OpenRouter provider implementation for the QLLM library.
 * This module implements the LLMProvider interface for OpenRouter's API, which provides access to multiple LLM models.
 * 
 * @module providers/openrouter
 * @version 1.0.0
 * 
 * @remarks
 * OpenRouter is a unified API that provides access to various language models from different providers.
 * This implementation:
 * - Supports multiple model providers through a single API
 * - Handles authentication and request routing
 * - Provides streaming and non-streaming completions
 * - Offers flexible model selection and parameters
 * - Uses OpenAI-compatible API format
 */

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

/** Maximum number of tokens for completion requests */
const DEFAULT_MAX_TOKENS = 1024 * 32;

/** Base URL for OpenRouter API */
const BASE_URL = 'https://openrouter.ai/api/v1';

/** Default model for chat completions */
const DEFAULT_MODEL = 'qwen/qwen-2-7b-instruct:free';

/**
 * OpenRouter provider implementation that supports chat completions through multiple model providers.
 * This class extends BaseLLMProvider and implements the LLMProvider interface.
 * 
 * @extends {BaseLLMProvider}
 * @implements {LLMProvider}
 * 
 * @remarks
 * OpenRouter provides a unified API to access multiple LLM providers:
 * - Anthropic (Claude models)
 * - OpenAI (GPT models)
 * - Meta (Llama models)
 * - Google (PaLM models)
 * - And many others
 * 
 * The provider uses OpenAI-compatible API format for easy integration.
 * 
 * @example
 * ```typescript
 * // Initialize with API key
 * const provider = new OpenRouterProvider('or-...');
 * 
 * // Generate completion
 * const response = await provider.generateChatCompletion({
 *   messages: [{ role: 'user', content: { type: 'text', text: 'Hello!' } }],
 *   options: { model: 'anthropic/claude-2' }
 * });
 * ```
 */
export class OpenRouterProvider extends BaseLLMProvider implements LLMProvider {
  private openAIProvider: OpenAIProvider;
  private apiKey: string;
  public readonly version = '1.0.0';
  public readonly name = 'OpenRouter';
  private baseURL = BASE_URL;

  /**
   * Creates a new OpenRouter provider instance.
   * 
   * @param {string} [apiKey] - Optional API key. If not provided, uses OPENROUTER_API_KEY environment variable
   * @throws {Error} If no API key is found in environment variables when not provided
   * 
   * @example
   * ```typescript
   * // Using environment variable
   * const provider = new OpenRouterProvider();
   * 
   * // Using explicit API key
   * const provider = new OpenRouterProvider('or-...');
   * ```
   */
  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey ?? process.env.OPENROUTER_API_KEY ?? '';
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not found');
    }
    this.openAIProvider = new OpenAIProvider(this.apiKey, this.baseURL);
  }

  /** Default options for LLM requests */
  public defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  /**
   * Makes a request to the OpenRouter API.
   * 
   * @private
   * @param {string} endpoint - API endpoint to call
   * @param {'GET' | 'POST'} method - HTTP method to use
   * @param {any} [data] - Optional request body for POST requests
   * @returns {Promise<any>} API response data
   * @throws {AuthenticationError | RateLimitError | InvalidRequestError} On API errors
   */
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

  /**
   * Lists available models from OpenRouter's API.
   * 
   * @returns {Promise<Model[]>} List of available models with metadata
   * @throws {AuthenticationError} On authentication failures
   * @throws {RateLimitError} On rate limit exceeded
   * @throws {InvalidRequestError} On invalid request or unexpected response format
   * 
   * @example
   * ```typescript
   * const models = await provider.listModels();
   * console.log(models.map(m => m.id));
   * // Example output: ['anthropic/claude-2', 'openai/gpt-4', 'meta/llama-2-70b']
   * ```
   */
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

  /**
   * Generates a chat completion using OpenRouter's API.
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
   *     model: 'anthropic/claude-2',
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

  /**
   * Generates a streaming chat completion using OpenRouter's API.
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
   *   options: { model: 'anthropic/claude-2' }
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

  /**
   * Filters and formats LLM options for OpenRouter API requests.
   * 
   * @private
   * @param {LLMOptions} options - Raw options to filter
   * @returns {LLMOptions} Filtered options object
   * 
   * @remarks
   * This method ensures that only valid options are sent to the API by:
   * - Removing null and undefined values
   * - Converting option names to OpenRouter's format
   * - Handling special cases and defaults
   */
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

  /**
   * Handles errors from OpenRouter's API, converting them to appropriate error types.
   * 
   * @protected
   * @param {unknown} error - Error from API call
   * @throws {AuthenticationError} On authentication failures (401)
   * @throws {RateLimitError} On rate limit exceeded (429)
   * @throws {InvalidRequestError} On invalid requests (400) or unexpected errors
   */
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
