/**
 * @fileoverview Groq provider implementation for the QLLM library.
 * This module implements both LLMProvider and EmbeddingProvider interfaces for Groq's high-performance LLMs.
 * 
 * @module providers/groq
 * @version 1.0.0
 * 
 * @remarks
 * Groq is a high-performance AI platform optimized for fast inference.
 * This implementation provides:
 * - Access to Groq's optimized LLM models
 * - Chat completions with streaming support
 * - Text embeddings generation
 * - Tool/function calling capabilities
 * - Advanced parameter control
 */

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

/** Default model for chat completions */
const DEFAULT_MODEL = 'mixtral-8x7b-32768';

/** Default model for embeddings */
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';

/** Maximum number of tokens for completion requests */
const DEFAULT_MAX_TOKENS = 1024 * 32;

/**
 * Groq provider implementation that supports chat completions and embeddings.
 * This class extends BaseLLMProvider and implements the EmbeddingProvider interface.
 * 
 * @extends {BaseLLMProvider}
 * @implements {EmbeddingProvider}
 * 
 * @remarks
 * The provider offers access to Groq's high-performance capabilities:
 * - Optimized model inference
 * - Streaming and non-streaming completions
 * - Text embeddings
 * - Tool/function calling
 * - System message support
 * 
 * @example
 * ```typescript
 * // Initialize provider
 * const provider = new GroqProvider('gsk-...');
 * 
 * // Generate completion
 * const response = await provider.generateChatCompletion({
 *   messages: [{ role: 'user', content: { type: 'text', text: 'Hello!' } }],
 *   options: { model: 'mixtral-8x7b-32768' }
 * });
 * 
 * // Generate embeddings
 * const embeddings = await provider.generateEmbedding({
 *   content: 'Hello, world!'
 * });
 * ```
 */
export class GroqProvider extends BaseLLMProvider implements EmbeddingProvider {
  private client: Groq;
  public readonly name = 'Groq';
  public readonly version = '1.0.0';

  /**
   * Creates a new Groq provider instance.
   * 
   * @param {string} [apiKey] - Optional API key. If not provided, uses GROQ_API_KEY environment variable
   * @throws {LLMProviderError} If no API key is found in environment variables when not provided
   * 
   * @example
   * ```typescript
   * // Using environment variable
   * const provider = new GroqProvider();
   * 
   * // Using explicit API key
   * const provider = new GroqProvider('gsk-...');
   * ```
   */
  constructor(apiKey?: string) {
    super();
    const key = apiKey ?? process.env.GROQ_API_KEY;
    if (!key) {
      throw new LLMProviderError('Groq API key not found', this.name);
    }
    this.client = new Groq({ apiKey: key });
  }

  /** Default options for LLM requests */
  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  /**
   * Lists available models from Groq's API.
   * 
   * @returns {Promise<Model[]>} List of available models with metadata
   * @throws {LLMProviderError} On API errors or authentication failures
   * 
   * @example
   * ```typescript
   * const models = await provider.listModels();
   * console.log(models.map(m => m.id));
   * // Example output: ['mixtral-8x7b-32768', 'llama2-70b-4096']
   * ```
   */
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

  /**
   * Generates a chat completion using Groq's API.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @param {ChatMessage[]} params.messages - Array of messages in the conversation
   * @param {LLMOptions} params.options - Model and generation options
   * @param {Tool[]} [params.tools] - Optional tools for function calling
   * @returns {Promise<ChatCompletionResponse>} Response containing generated text and metadata
   * @throws {LLMProviderError} On API errors or invalid parameters
   * 
   * @example
   * ```typescript
   * const response = await provider.generateChatCompletion({
   *   messages: [
   *     { role: 'system', content: { type: 'text', text: 'You are a helpful assistant.' } },
   *     { role: 'user', content: { type: 'text', text: 'Hello!' } }
   *   ],
   *   options: {
   *     model: 'mixtral-8x7b-32768',
   *     temperature: 0.7,
   *     maxTokens: 500
   *   }
   * });
   * ```
   */
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

  /**
   * Generates a streaming chat completion using Groq's API.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @returns {AsyncIterableIterator<ChatStreamCompletionResponse>} Stream of completion chunks
   * @throws {LLMProviderError} On API errors or invalid parameters
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
   *   options: { model: 'mixtral-8x7b-32768' }
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

  /**
   * Generates embeddings for given text content using Groq's API.
   * 
   * @param {EmbeddingRequestParams} input - Parameters for embedding generation
   * @param {string | string[]} input.content - Text to generate embeddings for
   * @param {string} [input.model] - Optional model to use (defaults to text-embedding-ada-002)
   * @returns {Promise<EmbeddingResponse>} Generated embeddings
   * @throws {LLMProviderError} On API errors or unsupported input types
   * 
   * @remarks
   * Groq's embedding service has some limitations:
   * - Only supports single text inputs (no batching)
   * - Only supports text content (no images)
   * - Uses a fixed embedding model
   * 
   * @example
   * ```typescript
   * const embeddings = await provider.generateEmbedding({
   *   content: 'Hello, world!'
   * });
   * ```
   */
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

  /**
   * Formats messages for Groq's API, handling text and image content.
   * 
   * @private
   * @param {ChatMessageWithSystem[]} messages - Messages to format
   * @returns {Promise<any[]>} Formatted messages for API
   * 
   * @remarks
   * This method handles:
   * - Text content formatting
   * - Image URL conversion to text placeholders
   * - Message role mapping
   * - Content array flattening
   */
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

  /**
   * Formats tools for Groq's API.
   * 
   * @private
   * @param {Tool[]} [tools] - Tools to format
   * @returns {any[] | undefined} Formatted tools for API
   * 
   * @remarks
   * Converts QLLM tool format to Groq's expected format:
   * - Maps function names and descriptions
   * - Formats parameters schema
   * - Handles optional properties
   */
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

  /**
   * Handles errors from Groq's API, converting them to LLMProviderError.
   * 
   * @protected
   * @param {unknown} error - Error from API call
   * @throws {LLMProviderError} Wrapped error with provider context
   */
  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      throw new LLMProviderError(error.message, this.name);
    } else {
      throw new LLMProviderError(`Unknown error: ${error}`, this.name);
    }
  }
}
